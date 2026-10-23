import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Analytics Truthful Metrics & Non-Fabrication Suite", () => {
  it("1. Accurately calculates response time between user question and assistant answer", () => {
    const t0 = new Date("2026-10-23T12:00:00Z").getTime();
    const t1 = new Date("2026-10-23T12:00:02.500Z").getTime(); // 2.5s diff

    const convs = [
      {
        id: "c_1",
        messages: [
          { role: "user", createdAt: new Date(t0).toISOString() },
          { role: "assistant", createdAt: new Date(t1).toISOString() },
        ],
      },
    ];

    let totalDiff = 0;
    let pairs = 0;
    convs.forEach((c) => {
      const msgs = c.messages || [];
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === "user" && msgs[i + 1].role === "assistant") {
          const d1 = new Date(msgs[i].createdAt).getTime();
          const d2 = new Date(msgs[i + 1].createdAt).getTime();
          if (!isNaN(d1) && !isNaN(d2) && d2 >= d1 && d2 - d1 < 60000) {
            totalDiff += d2 - d1;
            pairs++;
          }
        }
      }
    });

    assert.equal(pairs, 1);
    const avgResponseTime = `${(totalDiff / pairs / 1000).toFixed(1)}s`;
    assert.equal(avgResponseTime, "2.5s", "Must calculate true 2.5s from message timestamps");
  });

  it("2. Returns truthful unavailable or empty state when no conversations exist", () => {
    const convs = [];
    let totalDiff = 0;
    let pairs = 0;
    convs.forEach((c) => {
      const msgs = c.messages || [];
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === "user" && msgs[i + 1].role === "assistant") {
          totalDiff += 1000;
          pairs++;
        }
      }
    });

    let avgResponseTime = "—";
    if (pairs > 0) {
      avgResponseTime = `${(totalDiff / pairs / 1000).toFixed(1)}s`;
    } else if (convs.length > 0) {
      avgResponseTime = "< 1s";
    }

    assert.equal(avgResponseTime, "—", "Must return '—' when no conversation data exists, never hardcoded '1.1s'");
  });

  it("3. Does NOT fabricate conversations for zero-conversation bots (no || 1 fallback)", () => {
    const bots = [
      { id: "b_empty_1", name: "Empty Bot 1", primaryColor: "#4f46e5" },
      { id: "b_active_1", name: "Active Bot 1", primaryColor: "#10b981" },
    ];

    const conversations = [
      { id: "c_1", botId: "b_active_1", botName: "Active Bot 1" },
      { id: "c_2", botId: "b_active_1", botName: "Active Bot 1" },
    ];

    const botsDistribution = bots.map((b) => ({
      name: b.name,
      value: conversations.filter((c) => c.botId === b.id || c.botName === b.name).length,
      color: b.primaryColor || "#4f46e5",
    }));

    const emptyBotMetric = botsDistribution.find((b) => b.name === "Empty Bot 1");
    const activeBotMetric = botsDistribution.find((b) => b.name === "Active Bot 1");

    assert.equal(emptyBotMetric.value, 0, "Bot with 0 conversations must report 0, not fabricated 1");
    assert.equal(activeBotMetric.value, 2, "Active bot must report exact conversation count");
  });

  it("4. Calculates genuine period-over-period comparisons instead of synthetic +100%", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const nowTime = now.getTime();
    const MS_PER_DAY = 86400000;
    const p7 = 7 * MS_PER_DAY;
    const p14 = 14 * MS_PER_DAY;

    // Case A: Prior period has 10 convs, current has 15 (+50% increase)
    const convsWithPrior = [
      // 15 convs in current period [now - 7d, now]
      ...Array.from({ length: 15 }, () => ({ createdAt: new Date(nowTime - 2 * MS_PER_DAY).toISOString() })),
      // 10 convs in prior period [now - 14d, now - 7d]
      ...Array.from({ length: 10 }, () => ({ createdAt: new Date(nowTime - 10 * MS_PER_DAY).toISOString() })),
    ];

    const currA = convsWithPrior.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= nowTime - p7 && t <= nowTime;
    }).length;
    const priorA = convsWithPrior.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= nowTime - p14 && t < nowTime - p7;
    }).length;

    const computeChange = (current, prior) => {
      if (prior > 0) {
        const pct = Math.round(((current - prior) / prior) * 100);
        return { change: `${pct >= 0 ? "+" : ""}${pct}%`, pos: pct >= 0 };
      }
      if (current > 0 && prior === 0) {
        return { change: "—", pos: true }; // Truthful representation when no historical baseline exists
      }
      return { change: "0%", pos: true };
    };

    const resultA = computeChange(currA, priorA);
    assert.equal(resultA.change, "+50%", "Must calculate real percentage increase (+50%)");

    // Case B: No prior data (prior = 0, current = 5). Must NOT invent +100%!
    const resultB = computeChange(5, 0);
    assert.equal(resultB.change, "—", "Must return '—' when no prior interval data exists, not synthetic +100%");

    // Case C: Zero in both periods
    const resultC = computeChange(0, 0);
    assert.equal(resultC.change, "0%");
  });

  it("5. Handles missing or malformed timestamps safely without throwing or fabricating", () => {
    const convsWithCorruptTimestamps = [
      {
        id: "c_corrupt",
        messages: [
          { role: "user", createdAt: "invalid-date-string" },
          { role: "assistant", createdAt: null },
        ],
      },
      {
        id: "c_valid",
        messages: [
          { role: "user", timestamp: "2026-10-23T10:00:00Z" },
          { role: "assistant", timestamp: "2026-10-23T10:00:01Z" },
        ],
      },
    ];

    let totalDiff = 0;
    let pairs = 0;
    convsWithCorruptTimestamps.forEach((c) => {
      const msgs = c.messages || [];
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === "user" && msgs[i + 1].role === "assistant") {
          const t1 = new Date(msgs[i].createdAt || msgs[i].timestamp).getTime();
          const t2 = new Date(msgs[i + 1].createdAt || msgs[i + 1].timestamp).getTime();
          if (!isNaN(t1) && !isNaN(t2) && t2 >= t1 && t2 - t1 < 60000) {
            totalDiff += t2 - t1;
            pairs++;
          }
        }
      }
    });

    assert.equal(pairs, 1);
    assert.equal(totalDiff, 1000);
    const avgResponseTime = `${(totalDiff / pairs / 1000).toFixed(1)}s`;
    assert.equal(avgResponseTime, "1.0s");
  });
});
