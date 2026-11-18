import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { conversationsStore } = await import("../../frontend/lib/db/conversationsStore.js");
const { leadsStore } = await import("../../frontend/lib/db/leadsStore.js");
const { POST: publicChatPost } = await import("../../frontend/app/api/public/chat/[botId]/route.js");

describe("Phase 6 — Performance, mtime Caching & Streaming Scalability Suite", () => {
  it("1. Serves 500 consecutive mtime-cached store reads in under 80ms without redundant JSON.parse", () => {
    botsStore.getBots("org_perf_bench");
    conversationsStore.getConversations({ organizationId: "org_perf_bench" });

    const start = performance.now();
    for (let i = 0; i < 500; i++) {
      botsStore.getBots("org_perf_bench");
      conversationsStore.getConversations({ organizationId: "org_perf_bench" });
    }
    const elapsedMs = performance.now() - start;

    assert.ok(
      elapsedMs < 80,
      `Expected 500 cached store reads in < 80ms, took ${elapsedMs.toFixed(2)}ms`
    );
  });

  it("2. Enriches 120 leads across 120 conversations in O(L + C) time (< 100ms)", () => {
    const perfOrg = `org_perf_join_${Date.now()}`;

    try {
      for (let i = 0; i < 120; i++) {
        const conv = conversationsStore.createConversation({
          organizationId: perfOrg,
          botId: "bot_perf_1",
          visitorName: `Perf Visitor ${i}`,
          visitorPhone: `9876500${String(i).padStart(3, "0")}`,
          qualification: { answers: { budget: "₹1L+", timeline: "Immediate" } },
        });

        leadsStore.createLead({
          organizationId: perfOrg,
          botId: "bot_perf_1",
          sessionId: conv.id,
          name: `Perf Visitor ${i}`,
          email: `perf${i}@example.com`,
          phone: `9876500${String(i).padStart(3, "0")}`,
          inquiry: "Inquired via live chat widget",
        });
      }

      const start = performance.now();
      const enriched = leadsStore.getLeads({ organizationId: perfOrg });
      const elapsedMs = performance.now() - start;

      assert.equal(enriched.length, 120);
      assert.equal(enriched[0].answers?.budget, "₹1L+");
      assert.ok(
        elapsedMs < 100,
        `Expected O(L+C) lead enrichment in < 100ms, took ${elapsedMs.toFixed(2)}ms`
      );
    } finally {
      conversationsStore.clearAll(perfOrg);
      leadsStore.clearAll(perfOrg);
    }
  });

  it("3. Streams progressive Server-Sent Events (text/event-stream) from POST /api/public/chat/[botId]", async () => {
    const orgId = `org_stream_${Date.now()}`;
    const bot = botsStore.upsertBot(
      {
        id: `bot_stream_${Date.now()}`,
        name: "Streaming Test Bot",
        company: "Acme Cloud",
        welcomeMessage: "Hello from Acme!",
      },
      orgId
    );

    try {
      const req = new Request(`http://localhost:3000/api/public/chat/${bot.id}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "192.0.2.88",
        },
        body: JSON.stringify({
          message: "Hello!",
          stream: true,
        }),
      });

      const res = await publicChatPost(req, { params: Promise.resolve({ botId: bot.id }) });
      assert.equal(res.status, 200);
      assert.ok(
        res.headers.get("content-type")?.includes("text/event-stream"),
        "Streaming mode must return text/event-stream"
      );

      const rawSse = await res.text();
      assert.ok(rawSse.includes("data: "), "SSE stream must emit data frames");
      assert.ok(rawSse.includes("[DONE]"), "SSE stream must emit final [DONE] frame");
    } finally {
      botsStore.deleteBot(bot.id, orgId);
      conversationsStore.clearAll(orgId);
    }
  });
});
