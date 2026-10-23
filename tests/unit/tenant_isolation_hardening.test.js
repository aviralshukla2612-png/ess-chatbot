import test from "node:test";
import assert from "node:assert/strict";
import { classifyMessageIntent } from "../../frontend/lib/ai/intentClassifier.js";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";
import { buildMasterSystemPrompt, validateOutput } from "../../frontend/lib/ai/masterPrompt.js";

// Helper function replicating widget.js formatMessage for URL rendering tests
function formatWidgetMessage(text, isUser = false, primaryColor = "#4f46e5") {
  if (!text || typeof text !== "string") return "";

  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  if (isUser) {
    escaped = escaped.replace(
      /(https?:\/\/[^\s<)"']+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#ffffff!important;text-decoration:underline;font-weight:600;word-break:break-all;">$1</a>'
    );
    return escaped.replace(/\n/g, "<br/>");
  }

  escaped = escaped.replace(/^(?:IMPORTANT\s+CHATBOT\s+RULES|CHATBOT\s+RULES|SYSTEM\s+RULES|RULES|SYSTEM\s+PROMPT):?[^\n]*\n*/gim, "");
  escaped = escaped.replace(/\*{2,3}([^*]+)\*{2,3}/g, '<strong style="font-weight:700!important;color:#0f172a!important;opacity:1!important;">$1</strong>');

  const linkTokens = [];
  escaped = escaped.replace(/\[([^\]]+)\]\(((?:https?:\/\/)[^\s)<>"']+)\)/gi, (match, rawTitle, rawUrl) => {
    const idx = linkTokens.length;
    linkTokens.push({ title: rawTitle, url: rawUrl });
    return `%%NEXUS_LINK_TOKEN_${idx}%%`;
  });

  escaped = escaped.replace(/(^|[\s(])((?:https?:\/\/)[^\s<>)"]+)/gi, (match, prefix, rawUrl) => {
    const cleanUrl = rawUrl.replace(/[.,;:!?]+$/, "");
    const trailingPunct = rawUrl.slice(cleanUrl.length);
    const idx = linkTokens.length;
    linkTokens.push({ title: cleanUrl, url: cleanUrl });
    return `${prefix}%%NEXUS_LINK_TOKEN_${idx}%%${trailingPunct}`;
  });

  escaped = escaped.replace(/%%NEXUS_LINK_TOKEN_(\d+)%%/g, (match, index) => {
    const token = linkTokens[Number(index)];
    if (!token) return "";
    if (!/^https?:\/\//i.test(token.url)) return token.title;
    return `<a href="${token.url}" target="_blank" rel="noopener noreferrer" style="color:${primaryColor};text-decoration:underline;font-weight:600;word-break:break-all;">${token.title}</a>`;
  });

  escaped = escaped.replace(/^[*-]\s+(.+)$/gm, "• $1");
  escaped = escaped.replace(/\n/g, "<br/>");
  return escaped;
}

// ============================================================================
// SUITE A: Intent Classification & Non-Interception Tests
// ============================================================================
test("Suite A1: 'Who is Mr. Heet?' is NOT intercepted as external trivia (routes to PROCEED)", () => {
  const result = classifyMessageIntent({ message: "Who is Mr. Heet?" });
  assert.equal(result.action, "PROCEED");
  assert.notEqual(result.intent, "OUT_OF_SCOPE");
});

test("Suite A2: 'Who is the founder of Fylex?' is NOT intercepted as external trivia", () => {
  const result = classifyMessageIntent({ message: "Who is the founder of Fylex?" });
  assert.equal(result.action, "PROCEED");
  assert.notEqual(result.intent, "OUT_OF_SCOPE");
});

test("Suite A3: 'Who owns Fylex Watches?' is NOT intercepted as external trivia", () => {
  const result = classifyMessageIntent({ message: "Who owns Fylex Watches?" });
  assert.equal(result.action, "PROCEED");
  assert.notEqual(result.intent, "OUT_OF_SCOPE");
});

test("Suite A4: Synthetic customer brand founder query routes to PROCEED", () => {
  const result = classifyMessageIntent({ message: "Who is the founder of Nova Health Technologies?" });
  assert.equal(result.action, "PROCEED");
  assert.notEqual(result.intent, "OUT_OF_SCOPE");
});

test("Suite A5: 'What is your warranty policy?' routes to PROCEED", () => {
  const result = classifyMessageIntent({ message: "What is your warranty policy?" });
  assert.equal(result.action, "PROCEED");
  assert.notEqual(result.intent, "OUT_OF_SCOPE");
});

test("Suite A6: 'Do you love me?' is correctly classified as OUT_OF_SCOPE with REFUSE", () => {
  const result = classifyMessageIntent({ message: "Do you love me?" });
  assert.equal(result.intent, "OUT_OF_SCOPE");
  assert.equal(result.action, "REFUSE");
  assert.ok(result.refusalReply);
});

test("Suite A7: General celebrity trivia 'Who is Leonardo DiCaprio?' is classified as OUT_OF_SCOPE", () => {
  const result = classifyMessageIntent({ message: "Who is Leonardo DiCaprio?" });
  assert.equal(result.intent, "OUT_OF_SCOPE");
  assert.equal(result.action, "REFUSE");
});

// ============================================================================
// SUITE B: RAG Grounding & Synonym Retrieval Tests
// ============================================================================
test("Suite B1: FYLEX founder chunk is retrieved for 'Who is Mr. Heet?'", () => {
  const testDocId = `test_fylex_doc_${Date.now()}`;
  const testBotId = `test_fylex_bot_${Date.now()}`;

  documentsStore.addDocument({
    id: testDocId,
    botId: testBotId,
    name: "FYLEX Watches Knowledge",
    content: "The founder of FYLEX Watches is known to us as Heet Sir. His full name has not been verified.\n\nFYLEX produces luxury quartz timepieces engineered with sapphire crystal.",
  });

  try {
    const results = documentsStore.searchDocuments(testBotId, "Who is Mr. Heet?", 2);
    assert.ok(results.length > 0, "Expected at least 1 chunk result");
    assert.match(results[0].content, /Heet Sir/i);

    // Equivalent wording test: "Who is the founder of Fylex?"
    const resultsFounder = documentsStore.searchDocuments(testBotId, "Who is the founder of Fylex?", 2);
    assert.ok(resultsFounder.length > 0);
    assert.match(resultsFounder[0].content, /Heet Sir/i);

    // Equivalent wording test: "Who owns Fylex?"
    const resultsOwner = documentsStore.searchDocuments(testBotId, "Who owns Fylex?", 2);
    assert.ok(resultsOwner.length > 0);
    assert.match(resultsOwner[0].content, /Heet Sir/i);
  } finally {
    documentsStore.deleteDocument(testDocId);
  }
});

test("Suite B2: Missing policy query returns empty results when not in document", () => {
  const testDocId = `test_synth_doc_${Date.now()}`;
  const testBotId = `test_synth_bot_${Date.now()}`;

  documentsStore.addDocument({
    id: testDocId,
    botId: testBotId,
    name: "Synthetic Product Catalog",
    content: "Product A is made of stainless steel.\n\nProduct B comes in silver and gold.",
  });

  try {
    const results = documentsStore.searchDocuments(testBotId, "What is the return refund policy?", 2);
    assert.equal(results.length, 0, "Unrelated query should not match product description chunks");
  } finally {
    documentsStore.deleteDocument(testDocId);
  }
});

test("Suite B3: Document update and deletion lifecycle updates retrieval immediately", () => {
  const testDocId = `test_lifecycle_doc_${Date.now()}`;
  const testBotId = `test_lifecycle_bot_${Date.now()}`;

  // 1. Initial add
  documentsStore.addDocument({
    id: testDocId,
    botId: testBotId,
    name: "Lifecycle Doc V1",
    content: "Initial feature: Cloud Sync V1.",
  });

  let res = documentsStore.searchDocuments(testBotId, "Cloud Sync V1", 2);
  assert.equal(res.length, 1);
  assert.match(res[0].content, /Cloud Sync V1/);

  // 2. Update document
  documentsStore.updateDocument(testDocId, {
    name: "Lifecycle Doc V2",
    content: "Updated feature: Cloud Sync V2 with end-to-end encryption.",
  });

  res = documentsStore.searchDocuments(testBotId, "Cloud Sync V2", 2);
  assert.equal(res.length, 1);
  assert.match(res[0].content, /Cloud Sync V2/);

  // 3. Delete document
  documentsStore.deleteDocument(testDocId);
  res = documentsStore.searchDocuments(testBotId, "Cloud Sync", 2);
  assert.equal(res.length, 0);
});

// ============================================================================
// SUITE C: Multi-Tenant Isolation Tests (Synthetic Customers Alpha & Beta)
// ============================================================================
test("Suite C1: Tenant Isolation - Synthetic Bot Alpha cannot retrieve Bot Beta documents", () => {
  const botAlphaId = `bot_alpha_${Date.now()}`;
  const botBetaId = `bot_beta_${Date.now()}`;
  const docAlphaId = `doc_alpha_${Date.now()}`;
  const docBetaId = `doc_beta_${Date.now()}`;

  documentsStore.addDocument({
    id: docAlphaId,
    botId: botAlphaId,
    name: "Alpha Corp Knowledge",
    content: "Alpha Corp was founded by Dr. Aris Thorne. Official phone: +1-800-555-0199. Specialty: Quantum Sensors.",
  });

  documentsStore.addDocument({
    id: docBetaId,
    botId: botBetaId,
    name: "Beta Industries Knowledge",
    content: "Beta Industries was founded by Marcus Vance. Official phone: +44-20-7946-0991. Specialty: Marine Propulsion.",
  });

  try {
    // Query Alpha bot for Marcus Vance (Beta's founder)
    const alphaResults = documentsStore.searchDocuments(botAlphaId, "Who is Marcus Vance?", 2);
    assert.equal(alphaResults.length, 0, "Bot Alpha must NOT retrieve Bot Beta's founder");

    // Query Beta bot for Dr. Aris Thorne (Alpha's founder)
    const betaResults = documentsStore.searchDocuments(botBetaId, "Who is Dr. Aris Thorne?", 2);
    assert.equal(betaResults.length, 0, "Bot Beta must NOT retrieve Bot Alpha's founder");

    // Query Alpha bot for Quantum Sensors
    const alphaLegit = documentsStore.searchDocuments(botAlphaId, "Quantum Sensors", 2);
    assert.equal(alphaLegit.length, 1);
    assert.match(alphaLegit[0].content, /Dr\. Aris Thorne/);

    // Query Beta bot for Marine Propulsion
    const betaLegit = documentsStore.searchDocuments(botBetaId, "Marine Propulsion", 2);
    assert.equal(betaLegit.length, 1);
    assert.match(betaLegit[0].content, /Marcus Vance/);
  } finally {
    documentsStore.deleteDocument(docAlphaId);
    documentsStore.deleteDocument(docBetaId);
  }
});

// ============================================================================
// SUITE D: Response Generation & Anti-Hallucination Guardrails
// ============================================================================
test("Suite D1: Master System Prompt incorporates tenant business scope and anti-hallucination policies", () => {
  const prompt = buildMasterSystemPrompt({
    bot: {
      name: "WatchBot",
      company: "FYLEX Watches",
      description: "Luxury handcrafted timepieces.",
      websiteUrl: "https://fylexwatches.com",
      phoneNumber: "+91 99999 88888",
      collectLeads: true,
    },
    businessName: "FYLEX Watches",
    retrievedContext: "The founder of FYLEX Watches is known to us as Heet Sir. His full name has not been verified.",
    userLanguage: "english",
  });

  assert.match(prompt, /FYLEX Watches/);
  assert.match(prompt, /Heet Sir/);
  assert.match(prompt, /NEVER invent or assume/);
  assert.match(prompt, /Warranty durations/);
  assert.match(prompt, /Return or exchange windows/);
  // Must NOT force ESS software engineering persona into FYLEX prompt
  assert.doesNotMatch(prompt, /Emperor Smart Solutions \(ESS\) is a premier/);
});

test("Suite D2: Output validator strips leaked system rules (IMPORTANT CHATBOT RULES)", () => {
  const rawLlmOutput = "IMPORTANT CHATBOT RULES: You must follow all rules.\n\nThe founder of FYLEX Watches is known as Heet Sir.";
  const validated = validateOutput(rawLlmOutput, "FYLEX Watches", "english");
  assert.doesNotMatch(validated, /IMPORTANT CHATBOT RULES/);
  assert.match(validated, /Heet Sir/);
});

test("Suite D3: Output validator prevents Emperor Smart Solutions contamination in tenant bot", () => {
  const rawLlmOutput = "Welcome to Emperor Smart Solutions! We offer custom software engineering, mobile applications, web platforms, and enterprise AI solutions.";
  const validated = validateOutput(rawLlmOutput, "FYLEX Watches", "english");
  assert.doesNotMatch(validated, /Emperor Smart Solutions/);
  assert.match(validated, /FYLEX Watches/);
});

// ============================================================================
// SUITE E: URL Rendering Safety & Nested Anchor Prevention
// ============================================================================
test("Suite E1: Standalone HTTPS URL renders safely without nested anchors", () => {
  const input = "Visit our official store at https://fylexwatches.com for details.";
  const formatted = formatWidgetMessage(input, false, "#4f46e5");
  assert.match(formatted, /<a href="https:\/\/fylexwatches\.com"/);
  assert.doesNotMatch(formatted, /<a[^>]*<a/); // No nested anchors
});

test("Suite E2: Markdown link renders safely without nested anchor tags", () => {
  const input = "Check our website: [FYLEX Watches](https://fylexwatches.com)";
  const formatted = formatWidgetMessage(input, false, "#4f46e5");
  assert.match(formatted, /<a href="https:\/\/fylexwatches\.com"[^>]*>FYLEX Watches<\/a>/);
  assert.doesNotMatch(formatted, /<a[^>]*<a/);
});

test("Suite E3: Redundant markdown link [https://url](https://url) does NOT create nested anchors", () => {
  const input = "Here is the link: [https://fylexwatches.com](https://fylexwatches.com)";
  const formatted = formatWidgetMessage(input, false, "#4f46e5");
  assert.match(formatted, /<a href="https:\/\/fylexwatches\.com"[^>]*>https:\/\/fylexwatches\.com<\/a>/);
  assert.doesNotMatch(formatted, /href="<a/);
  assert.doesNotMatch(formatted, /<a[^>]*<a/);
});

test("Suite E4: Standalone URL followed by trailing punctuation preserves punctuation outside the link", () => {
  const input = "Official website is https://fylexwatches.com.";
  const formatted = formatWidgetMessage(input, false, "#4f46e5");
  assert.match(formatted, /href="https:\/\/fylexwatches\.com"/);
  assert.ok(formatted.endsWith("."));
});

test("Suite E5: Raw HTML input is sanitized against XSS", () => {
  const maliciousInput = '<script>alert("hack")</script><img src="x" onerror="alert(1)"/>';
  const formatted = formatWidgetMessage(maliciousInput, false, "#4f46e5");
  assert.doesNotMatch(formatted, /<script>/);
  assert.doesNotMatch(formatted, /<img/);
  assert.match(formatted, /&lt;script&gt;/);
});
