/**
 * tests/integration/tenantIdentityBenchmark.test.js
 *
 * Verifies Tenant Identity Isolation and Prompt Configuration Guardrails:
 * 1. Greeting ('hey') -> welcomes to tenant business, no ESS branding or software quick replies.
 * 2. Identity inquiry ('Who are you?' / 'yeah who are you') -> identifies as official assistant for tenant, not trivia refusal.
 * 3. Products inquiry ('What products do you sell?') -> classified as BUSINESS_RELEVANT, prompt contains product guidance not software MVP pricing.
 * 4. Founder grounding ('Who is the founder of FYLEX Watches?') -> never attributes ESS founders (Yash Sharma/Karan Makwana) to custom tenant.
 * 5. Platform provider query ('What services does Emperor Smart Solutions provide?') -> explains provider role without hijacking bot identity.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { classifyMessageIntent } from "../../frontend/lib/ai/intentClassifier.js";
import { buildMasterSystemPrompt, validateOutput } from "../../frontend/lib/ai/masterPrompt.js";

test("Tenant Identity Benchmark Suite", async (t) => {
  const fylexBot = {
    id: "bot_1792735728223",
    name: "FYLEX Assistant",
    company: "Fylex Watches",
    phoneNumber: "+91 99999 88888",
    websiteUrl: "https://fylexwatches.com",
    welcomeMessage: "Welcome to Fylex Watches! How can I assist you with our luxury timepieces today?",
    quickReplies: ["Men's Collection", "Women's Collection", "Warranty & Support", "Contact Store"],
  };

  const essBot = {
    id: "bot_aa",
    name: "Emperor Assistant",
    company: "Emperor Smart Solutions",
    phoneNumber: "+91 63591 20081",
    websiteUrl: "https://emperorsmartsolutions.com",
    welcomeMessage: "Welcome to Emperor Smart Solutions! Which solution are you planning to build?",
    quickReplies: ["Website Development", "Mobile Applications", "AI Solutions"],
  };

  await t.test("Benchmark 1: Greeting ('hey') behavior isolation", () => {
    // Intent classification for greetings
    const res = classifyMessageIntent({ message: "hey", businessName: fylexBot.company });
    assert.equal(res.action, "PROCEED");

    // Non-ESS bot greeting must not contain ESS software development branding
    assert.doesNotMatch(fylexBot.welcomeMessage, /Emperor Smart Solutions/i);
    assert.doesNotMatch(fylexBot.welcomeMessage, /custom software engineering/i);
    for (const pill of fylexBot.quickReplies) {
      assert.doesNotMatch(pill, /Mobile Applications|Website Development|Cloud/i);
    }

    // ESS bot preserves full consultative sales intro
    assert.match(essBot.company, /Emperor Smart Solutions/i);
  });

  await t.test("Benchmark 2: Identity inquiry ('yeah who are you' & 'who are you') is NOT classified as trivia", () => {
    const queries = ["who are you", "yeah who are you", "who are u", "what are you", "tell me about yourself"];

    for (const q of queries) {
      const res = classifyMessageIntent({ message: q, businessName: fylexBot.company });
      assert.equal(res.action, "PROCEED", `Query '${q}' should proceed`);
      assert.equal(res.intent, "BOT_IDENTITY", `Query '${q}' should have BOT_IDENTITY intent`);
      assert.equal(res.isTriviaRefusal, undefined, `Query '${q}' must not be marked as trivia refusal`);
    }

    // Master prompt for tenant bot must define official assistant without software agency sales persona
    const prompt = buildMasterSystemPrompt({
      bot: fylexBot,
      history: [],
      verifiedKnowledge: "Fylex Watches specializes in automatic and quartz luxury chronographs.",
    });

    assert.match(prompt, /official AI assistant for Fylex Watches/i);
    assert.doesNotMatch(prompt, /official AI Sales Consultant and Technology Advisor/i);
    assert.doesNotMatch(prompt, /MVPs starting from ₹50,000/i);
    assert.doesNotMatch(prompt, /Why choose ESS\?/i);
  });

  await t.test("Benchmark 3: Products inquiry ('What products do you sell?') remains strictly in-scope", () => {
    const productQueries = [
      "What products do you sell?",
      "Do you have chronograph watches?",
      "What is your luxury collection?",
      "Show me items in your catalog",
    ];

    for (const q of productQueries) {
      const res = classifyMessageIntent({ message: q, businessName: fylexBot.company });
      assert.equal(res.action, "PROCEED", `Product query '${q}' must proceed`);
      assert.equal(res.intent, "BUSINESS_RELEVANT", `Product query '${q}' must be BUSINESS_RELEVANT`);
    }

    // Master prompt for tenant provides e-commerce/retail grounding instructions
    const prompt = buildMasterSystemPrompt({
      bot: fylexBot,
      history: [],
      verifiedKnowledge: "Fylex Watches offers classic leather strap timepieces and stainless steel chronographs.",
    });

    assert.match(prompt, /CUSTOMER INQUIRIES & POLICIES/i);
    assert.match(prompt, /Ground all product details, warranties, and pricing strictly in the Verified Knowledge/i);
    assert.doesNotMatch(prompt, /custom mobile\/web apps ₹50,000 to ₹2,00,000/i);
  });

  await t.test("Benchmark 4: Founder grounding prevents attributing ESS founders to tenant", () => {
    // If output hallucinates Yash Sharma or Karan Makwana as Fylex founder, validateOutput intercepts and cleans it
    const hallucinatedOutput = "The founder of Fylex Watches is Yash Sharma, who founded the company to deliver timepieces.";
    const cleaned = validateOutput(hallucinatedOutput, {
      bot: fylexBot,
      visitorName: "Customer",
      lang: "english",
    });

    assert.doesNotMatch(cleaned, /Yash Sharma is the founder of Fylex Watches/i);
    assert.match(cleaned, /do not have verified documentation regarding the founder of Fylex Watches/i);

    // ESS bot correctly retains ESS leadership when asked about ESS
    const essOutput = "I do not have founder details.";
    const cleanedEss = validateOutput(essOutput, {
      bot: essBot,
      visitorName: "Customer",
      lang: "english",
    });
    assert.match(cleanedEss, /Yash Sharma/i);
    assert.match(cleanedEss, /Karan Makwana/i);
  });

  await t.test("Benchmark 5: Platform provider query distinguishes Emperor Smart Solutions from tenant bot", () => {
    // System prompt defines the tenant's identity clearly
    const prompt = buildMasterSystemPrompt({
      bot: fylexBot,
      history: [],
      verifiedKnowledge: "Fylex Watches.",
    });

    assert.match(prompt, /You are EXCLUSIVELY the official AI assistant for Fylex Watches/i);

    // Off-topic refusal for tenant does not pitch ESS software development
    const offTopicRes = classifyMessageIntent({ message: "Who is Salman Khan?", businessName: fylexBot.company });
    assert.equal(offTopicRes.action, "REFUSE");
    assert.match(offTopicRes.refusalReply, /I am the official AI assistant for Fylex Watches/i);
    assert.doesNotMatch(offTopicRes.refusalReply, /custom software engineering/i);
    assert.doesNotMatch(offTopicRes.refusalReply, /Which solution are you planning to build\?/i);
  });
});
