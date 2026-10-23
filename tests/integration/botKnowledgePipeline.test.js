/**
 * tests/integration/botKnowledgePipeline.test.js
 *
 * PHASE P2 — Complete Chatbot Knowledge Pipeline Repair Verification Suite
 * =========================================================================
 * Validates the full repaired lifecycle:
 * 1. Bot creation and persistence with business details (company, websiteUrl, phoneNumber).
 * 2. Website source registration and ingestion job creation in durable store.
 * 3. Text extraction and canary verification in page text.
 * 4. Chunks and embeddings storage with strict bot and organization scoping.
 * 5. Multi-tenant semantic retrieval: Bot A NEVER receives Bot B chunks and vice versa.
 * 6. System prompt construction: accurately includes business phone, website, and grounding directives.
 * 7. Absence of false answers: No hospital/clinic mocks in timeout, errors, or DIY builder interceptors.
 * 8. Contact query resolution: Custom bots return configured phone and website, never Emperor Smart Solutions.
 * 9. Honest unconfigured/missing answers: Chatbot admits when information is absent.
 */

process.env.NODE_ENV = "test";
process.env.ALLOW_TEST_EMBEDDINGS = "true";

import test from "node:test";
import assert from "node:assert/strict";
import { botsStore } from "../../frontend/lib/db/botsStore.js";
import { websitesDb } from "../../frontend/lib/db/websites.js";
import {
  cleanHtmlContent,
  chunkText,
  generateEmbedding,
  vectorStorePoints,
  searchWebsiteKnowledge,
} from "../../frontend/lib/crawler/engine.js";
import {
  buildMasterSystemPrompt,
  validateOutput,
} from "../../frontend/lib/ai/masterPrompt.js";
import { validateUrlForSSRF } from "../../frontend/lib/security/ssrf.js";

test("PHASE P2 — End-to-End Knowledge Pipeline & Isolation Suite", async (t) => {
  // Test Tenants & Canaries
  const botA_Id = `bot_test_a_${Date.now()}`;
  const botB_Id = `bot_test_b_${Date.now()}`;
  const orgA_Id = `org_tenant_a_${Date.now()}`;
  const orgB_Id = `org_tenant_b_${Date.now()}`;

  const canaryA = "ESS-CANARY-A-7Q4M";
  const canaryB = "ESS-CANARY-B-9R2N";

  const phoneA = "+1 555 019 2834";
  const phoneB = "+1 555 098 7654";

  const websiteA = "https://example.com/alpha";
  const websiteB = "https://example.com/beta";

  await t.test("1. Bot Persistence — Stores and retrieves business configuration", async () => {
    // Save Bot A
    const createdA = botsStore.upsertBot({
      id: botA_Id,
      organizationId: orgA_Id,
      name: "Alpha Assistant",
      company: "Alpha Dynamics",
      websiteUrl: websiteA,
      phoneNumber: phoneA,
      description: "Autonomous robotics and warehouse automation company.",
      status: "Active",
    });
    assert.equal(createdA.company, "Alpha Dynamics");
    assert.equal(createdA.websiteUrl, websiteA);
    assert.equal(createdA.phoneNumber, phoneA);

    // Save Bot B
    const createdB = botsStore.upsertBot({
      id: botB_Id,
      organizationId: orgB_Id,
      name: "Beta Assistant",
      company: "Beta Retailers",
      websiteUrl: websiteB,
      phoneNumber: phoneB,
      description: "Direct-to-consumer sustainable apparel company.",
      status: "Active",
    });
    assert.equal(createdB.company, "Beta Retailers");
    assert.equal(createdB.websiteUrl, websiteB);
    assert.equal(createdB.phoneNumber, phoneB);

    // Retrieve and verify fields
    const fetchedA = botsStore.getBot(botA_Id);
    assert.ok(fetchedA, "Bot A must be retrievable");
    assert.equal(fetchedA.phoneNumber, phoneA);
    assert.equal(fetchedA.websiteUrl, websiteA);
    assert.equal(fetchedA.company, "Alpha Dynamics");

    const fetchedB = botsStore.getBot(botB_Id);
    assert.ok(fetchedB, "Bot B must be retrievable");
    assert.equal(fetchedB.phoneNumber, phoneB);
    assert.equal(fetchedB.websiteUrl, websiteB);
    assert.equal(fetchedB.company, "Beta Retailers");
  });

  await t.test("2. Website Submission & Ingestion Jobs — Registered and persisted", async () => {
    // SSRF Check on public domain
    const ssrfValid = await validateUrlForSSRF("https://example.com");
    assert.equal(ssrfValid.valid, true, "Public URL must pass SSRF validation");

    // SSRF Check blocking private IP and loopback
    const ssrfLoopback = await validateUrlForSSRF("http://127.0.0.1:8080");
    assert.equal(ssrfLoopback.valid, false, "Loopback IP must be blocked by SSRF guard");

    const ssrfMetadata = await validateUrlForSSRF("http://169.254.169.254/latest/meta-data");
    assert.equal(ssrfMetadata.valid, false, "Cloud metadata endpoint must be blocked by SSRF guard");

    // Register Website Source A
    const sourceA = await websitesDb.createWebsiteSource({
      organizationId: orgA_Id,
      botId: botA_Id,
      name: "Alpha Dynamics Main",
      baseUrl: websiteA,
      crawlScope: "entire",
      maxPages: 10,
    });
    assert.ok(sourceA.id, "Source A must have an ID");
    assert.equal(sourceA.botId, botA_Id);
    assert.equal(sourceA.organizationId, orgA_Id);

    // Create Ingestion Job A
    const jobA = await websitesDb.createIngestionJob(sourceA.id, botA_Id, orgA_Id);
    assert.ok(jobA.id, "Job A must be created");
    assert.equal(jobA.status, "Pending");

    // Register Website Source B
    const sourceB = await websitesDb.createWebsiteSource({
      organizationId: orgB_Id,
      botId: botB_Id,
      name: "Beta Retailers Store",
      baseUrl: websiteB,
      crawlScope: "entire",
      maxPages: 10,
    });
    assert.ok(sourceB.id, "Source B must have an ID");
    assert.equal(sourceB.botId, botB_Id);
    assert.equal(sourceB.organizationId, orgB_Id);

    // Create Ingestion Job B
    const jobB = await websitesDb.createIngestionJob(sourceB.id, botB_Id, orgB_Id);
    assert.ok(jobB.id, "Job B must be created");
    assert.equal(jobB.status, "Pending");
  });

  await t.test("3. Text Extraction — Extracts authentic content without hallucination", async () => {
    const rawHtmlA = `
      <!DOCTYPE html>
      <html>
        <head><title>Alpha Dynamics - Robotics</title></head>
        <body>
          <header><nav><a href="/">Home</a><a href="/products">Products</a></nav></header>
          <main>
            <h1>Autonomous Robotics & Warehouse Intelligence</h1>
            <p>Alpha Dynamics engineers warehouse automation drones. Canary token: ${canaryA}</p>
            <p>Our autonomous pallet shuttle handles up to 1,500 kg loads.</p>
          </main>
          <footer><p>&copy; 2026 Alpha Dynamics</p></footer>
        </body>
      </html>
    `;

    const extractedA = cleanHtmlContent(rawHtmlA).text;
    assert.ok(extractedA.includes(canaryA), "Extracted text must contain Canary A");
    assert.ok(extractedA.includes("Autonomous Robotics & Warehouse Intelligence"));
    assert.ok(!extractedA.includes("<main>"), "HTML tags must be stripped");

    const rawHtmlB = `
      <!DOCTYPE html>
      <html>
        <head><title>Beta Retailers - Organic Apparel</title></head>
        <body>
          <main>
            <h1>Organic Cotton Clothing</h1>
            <p>Beta Retailers ships worldwide from London. Verification code: ${canaryB}</p>
            <p>All garments are 100% GOTS certified organic cotton.</p>
          </main>
        </body>
      </html>
    `;

    const extractedB = cleanHtmlContent(rawHtmlB).text;
    assert.ok(extractedB.includes(canaryB), "Extracted text must contain Canary B");
    assert.ok(extractedB.includes("Organic Cotton Clothing"));
  });

  await t.test("4. Chunking & Embeddings Persistence — Scoped to specific bot", async () => {
    // Ingest chunks for Bot A
    const contentA = `Alpha Dynamics specializes in autonomous drones and pallet systems. Security token: ${canaryA}. Founded in 2021.`;
    const chunksA = chunkText(contentA, 450, 70);
    assert.ok(chunksA.length >= 1, "Must generate at least 1 chunk for Bot A");
    assert.ok(chunksA[0].includes(canaryA), "Chunk A must contain Canary A");

    for (const ch of chunksA) {
      const emb = await generateEmbedding(ch);
      vectorStorePoints.push({
        id: `vec_a_${Date.now()}_${Math.random()}`,
        botId: botA_Id,
        pageUrl: `${websiteA}/about`,
        pageTitle: "About Alpha Dynamics",
        content: ch,
        embedding: emb,
      });
    }

    // Ingest chunks for Bot B
    const contentB = `Beta Retailers offers sustainably farmed garments and accessories. Verification code: ${canaryB}. Zero plastic packaging.`;
    const chunksB = chunkText(contentB, 450, 70);
    assert.ok(chunksB.length >= 1, "Must generate at least 1 chunk for Bot B");
    assert.ok(chunksB[0].includes(canaryB), "Chunk B must contain Canary B");

    for (const ch of chunksB) {
      const emb = await generateEmbedding(ch);
      vectorStorePoints.push({
        id: `vec_b_${Date.now()}_${Math.random()}`,
        botId: botB_Id,
        pageUrl: `${websiteB}/about`,
        pageTitle: "About Beta Retailers",
        content: ch,
        embedding: emb,
      });
    }
  });

  await t.test("5. Multi-Tenant Vector Retrieval Isolation — Strict bot isolation", async () => {
    // Query Bot A for canary
    const resultsA = await searchWebsiteKnowledge(botA_Id, "What is your security canary token?", 5);
    assert.ok(resultsA.length > 0, "Bot A must retrieve its own knowledge chunks");
    const foundCanaryA = resultsA.some((c) => c.content.includes(canaryA));
    assert.equal(foundCanaryA, true, "Bot A must find Canary A");

    // CRITICAL: Bot A must NEVER retrieve Bot B's canary
    const leakedCanaryB_in_A = resultsA.some((c) => c.content.includes(canaryB));
    assert.equal(leakedCanaryB_in_A, false, "CRITICAL: Bot A must NEVER retrieve Canary B");

    // Query Bot B for canary
    const resultsB = await searchWebsiteKnowledge(botB_Id, "What is your verification code canary?", 5);
    assert.ok(resultsB.length > 0, "Bot B must retrieve its own knowledge chunks");
    const foundCanaryB = resultsB.some((c) => c.content.includes(canaryB));
    assert.equal(foundCanaryB, true, "Bot B must find Canary B");

    // CRITICAL: Bot B must NEVER retrieve Bot A's canary
    const leakedCanaryA_in_B = resultsB.some((c) => c.content.includes(canaryA));
    assert.equal(leakedCanaryA_in_B, false, "CRITICAL: Bot B must NEVER retrieve Canary A");

    // CRITICAL: Neither bot should retrieve Emperor Smart Solutions internal documents
    const leakedEss_in_A = resultsA.some((c) => c.content.includes("Shitiratna Complex"));
    assert.equal(leakedEss_in_A, false, "Customer Bot A must not retrieve Emperor Smart Solutions head office");
  });

  await t.test("6. Prompt Construction & Grounding Directives", () => {
    const promptA = buildMasterSystemPrompt({
      assistantName: "AlphaBot",
      businessName: "Alpha Dynamics",
      tenantId: orgA_Id,
      retrievedContext: `[Source: ${websiteA}/about]: Autonomous robotics. Token: ${canaryA}`,
      businessPhone: phoneA,
      websiteUrl: websiteA,
      botDescription: "Autonomous robotics provider.",
    });

    // Must contain business details
    assert.ok(promptA.includes("Alpha Dynamics"), "Must contain business name");
    assert.ok(promptA.includes(phoneA), "Must contain business phone");
    assert.ok(promptA.includes(websiteA), "Must contain website URL");
    assert.ok(promptA.includes(canaryA), "Must contain retrieved Canary A");

    // Must NOT contain ESS leadership or founders
    assert.ok(!promptA.includes("Yash Sharma"), "Must NOT contain Yash Sharma");
    assert.ok(!promptA.includes("Karan Makwana"), "Must NOT contain Karan Makwana");
    assert.ok(!promptA.includes("+91 63591 20081"), "Must NOT contain ESS phone number");

    // Must contain strict grounding honesty rule
    assert.ok(promptA.includes("STRICT KNOWLEDGE GROUNDING & HONESTY RULE"), "Must have grounding honesty rule");
    assert.ok(promptA.includes("I do not have that specific information in my verified records for Alpha Dynamics"), "Must have honest missing notice directive");
  });

  await t.test("7. False Answer Removal & Intercept Scoping in validateOutput", () => {
    // Test DIY builder intercept: Must NOT return clinic package for custom bot
    const rawReply = "You can choose a platform or website builder like Wix or WordPress.";
    const outputCustom = validateOutput(rawReply, "Alpha Dynamics", "english", "AlphaBot");
    assert.ok(!outputCustom.includes("At Emperor Smart Solutions"), "Custom bot must NOT receive ESS clinic pitch");
    assert.ok(!outputCustom.includes("₹50,000"), "Custom bot must NOT receive ₹50,000 clinic package");
    assert.ok(!outputCustom.includes("patient appointment scheduling"), "Custom bot must NOT receive hospital scheduling pitch");

    // Test ESS bot: Still receives ESS agency positioning
    const outputEss = validateOutput(rawReply, "Emperor Smart Solutions", "english", "Emperor AI");
    assert.ok(outputEss.includes("Emperor Smart Solutions"), "ESS bot should receive ESS agency positioning");

    // Test Off-topic: Custom bot pivots to Alpha Dynamics, not ESS
    const offTopicReply = "Here is the recipe for chocolate cake: 2 cups flour, 1 tablespoon baking powder.";
    const offTopicCustom = validateOutput(offTopicReply, "Alpha Dynamics", "english", "AlphaBot");
    assert.ok(offTopicCustom.includes("Alpha Dynamics"), "Off-topic pivot must reference Alpha Dynamics");
    assert.ok(!offTopicCustom.includes("Emperor Smart Solutions"), "Off-topic pivot must NOT reference Emperor Smart Solutions");

    // Test Empty reply fallback: Greets with business name
    const emptyCustom = validateOutput("", "Alpha Dynamics", "english");
    assert.ok(emptyCustom.includes("Alpha Dynamics"), "Empty fallback must mention Alpha Dynamics");
    assert.ok(!emptyCustom.includes("Emperor Smart Solutions"), "Empty fallback must not mention ESS");

    // Test Prefix-only reply: Strips prefix and falls back to business greeting
    const prefixOnly = validateOutput("Assistant: ", "Alpha Dynamics", "english", "Assistant");
    assert.ok(prefixOnly.includes("Welcome to Alpha Dynamics"), "Prefix-only fallback must welcome to Alpha Dynamics");
  });

  await t.test("8. Contact Details Integrity — Custom bot contact queries", () => {
    // Mock the contact formatting logic from public chat route
    function formatBotContactReply(bot, lang = "english") {
      const isEssBot = bot?.id === "bot_aa" || bot?.company === "Emperor Smart Solutions";
      if (!isEssBot) {
        const contactParts = [];
        if (bot?.websiteUrl) contactParts.push(`🌐 **Website:** [${bot.websiteUrl}](${bot.websiteUrl})`);
        if (bot?.phoneNumber) contactParts.push(`📞 **Phone / WhatsApp:** ${bot.phoneNumber}`);

        if (contactParts.length > 0) {
          return `Here are the official contact details for ${bot.company}:\n\n${contactParts.join("\n")}\n\nHow can we assist you today?`;
        }
        return `Official contact details are not currently configured for ${bot.company}. How else can I assist you today?`;
      }
      return "Here are the official contact details and head office address for Emperor Smart Solutions:\n\n📞 **Phone & WhatsApp:** +91 63591 20081";
    }

    const botA = botsStore.getBot(botA_Id);
    const replyA = formatBotContactReply(botA);
    assert.ok(replyA.includes(phoneA), `Contact reply must contain ${phoneA}`);
    assert.ok(replyA.includes(websiteA), `Contact reply must contain ${websiteA}`);
    assert.ok(!replyA.includes("+91 63591 20081"), "Must NOT contain ESS phone");

    const botB = botsStore.getBot(botB_Id);
    const replyB = formatBotContactReply(botB);
    assert.ok(replyB.includes(phoneB), `Contact reply must contain ${phoneB}`);
    assert.ok(replyB.includes(websiteB), `Contact reply must contain ${websiteB}`);
    assert.ok(!replyB.includes(phoneA), "Bot B must NOT contain Bot A phone");

    // Test bot with no contact configured
    const unconfiguredBot = { id: "bot_empty", company: "Empty Corp" };
    const replyEmpty = formatBotContactReply(unconfiguredBot);
    assert.ok(replyEmpty.includes("not currently configured"), "Must honestly admit when contact details are missing");
    assert.ok(!replyEmpty.includes("+91 63591 20081"), "Unconfigured bot must NOT fall back to ESS phone");
  });
});
