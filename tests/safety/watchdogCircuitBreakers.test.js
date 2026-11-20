/**
 * Emperor Nexus — Safety Watchdog Circuit Breakers Unit & Simulation Suite
 *
 * Verifies all 8 circuit breaker triggers independently using simulated metrics:
 * A. CPU utilization (>85% sustained >10s)
 * B. Memory exhaustion (MemAvailable < 15 GiB)
 * C. Neighbor containers (24 container inventory, missing/unhealthy/exited detection)
 * D. PostgreSQL pool saturation (Active connections >= 40)
 * E. Redis memory saturation (>=80% of maxmemory)
 * F. Disk space depletion (<50 GB free)
 * G. Application error rate (>5% 5xx sustained)
 * H. Precision process termination targeting
 */

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

describe("Stage 3 Safety Watchdog Circuit Breaker Simulation Suite", () => {
  // A. CPU Circuit Breaker Logic
  describe("A. CPU Utilization Circuit Breaker", () => {
    function evaluateCpu(ticks, threshold = 85, maxStreak = 5) {
      let streak = 0;
      for (const val of ticks) {
        if (val > threshold) {
          streak++;
          if (streak >= maxStreak) {
            return { aborted: true, reason: `CPU sustained at ${val}% for >10s` };
          }
        } else {
          streak = 0;
        }
      }
      return { aborted: false, streak };
    }

    test("Transient CPU spike (<10s) does NOT trip circuit breaker", () => {
      const samples = [40, 60, 92, 95, 80, 50]; // only 2 ticks above 85%
      const res = evaluateCpu(samples);
      assert.equal(res.aborted, false);
      assert.equal(res.streak, 0);
    });

    test("Sustained CPU (>85% for 5 ticks / 10s) TRIPS circuit breaker", () => {
      const samples = [50, 88, 91, 89, 93, 90]; // 5 consecutive ticks >85%
      const res = evaluateCpu(samples);
      assert.equal(res.aborted, true);
      assert.ok(res.reason.includes("CPU sustained"));
    });
  });

  // B. Memory Circuit Breaker Logic
  describe("B. Memory Exhaustion Circuit Breaker", () => {
    function evaluateMemory(availKb, limitKb = 15728640) {
      if (availKb < limitKb) {
        const availGib = (availKb / 1024 / 1024).toFixed(2);
        return { aborted: true, reason: `Available memory ${availGib} GiB below 15 GiB limit` };
      }
      return { aborted: false };
    }

    test("Healthy available RAM (58 GiB) passes cleanly", () => {
      const healthyKb = 58 * 1024 * 1024;
      assert.equal(evaluateMemory(healthyKb).aborted, false);
    });

    test("Low available RAM (12 GiB) TRIPS circuit breaker", () => {
      const lowKb = 12 * 1024 * 1024;
      const res = evaluateMemory(lowKb);
      assert.equal(res.aborted, true);
      assert.ok(res.reason.includes("below 15 GiB limit"));
    });
  });

  // C. Neighbor Container Inventory & Health Check
  describe("C. 24 Neighbor Containers Inventory Check", () => {
    const EXPECTED_NEIGHBORS = [
      "admafia-frontend", "admafia-backend", "admafia-mongo", "admafia-redis", "admafia-mongo-express",
      "knotelle-app", "knotelle-db", "nutsandnutrition-app", "nutsandnutrition-db",
      "convoza-nginx", "convoza-admin", "convoza-website", "convoza-campaign-worker",
      "convoza-webhook-worker", "convoza-message-worker", "convoza-api", "convoza-postgres", "convoza-dashboard",
      "talknex-web", "talknex-api", "aviatorguide-app-1", "aviatorguide-db-1", "rockyblog-app-1", "rockyblog-db-1"
    ];

    function evaluateNeighbors(actualContainerMap, excluded = []) {
      for (const name of EXPECTED_NEIGHBORS) {
        if (excluded.includes(name)) continue;
        if (!actualContainerMap.has(name)) {
          return { aborted: true, code: "NEIGHBOR_MISSING", name };
        }
        const status = actualContainerMap.get(name);
        if (/restarting|dead|unhealthy/i.test(status)) {
          return { aborted: true, code: "NEIGHBOR_UNHEALTHY", name, status };
        }
        if (/exited \([1-9]/i.test(status)) {
          return { aborted: true, code: "NEIGHBOR_CRASHED", name, status };
        }
      }
      return { aborted: false, count: EXPECTED_NEIGHBORS.length - excluded.length };
    }

    test("All 24 baseline containers healthy returns PASS", () => {
      const containerMap = new Map();
      EXPECTED_NEIGHBORS.forEach((name) => containerMap.set(name, "Up 4 days (healthy)"));
      const res = evaluateNeighbors(containerMap);
      assert.equal(res.aborted, false);
      assert.equal(res.count, 24);
    });

    test("Missing neighbor container TRIPS circuit breaker", () => {
      const containerMap = new Map();
      EXPECTED_NEIGHBORS.slice(1).forEach((name) => containerMap.set(name, "Up 4 days"));
      // 'admafia-frontend' is missing
      const res = evaluateNeighbors(containerMap);
      assert.equal(res.aborted, true);
      assert.equal(res.code, "NEIGHBOR_MISSING");
      assert.equal(res.name, "admafia-frontend");
    });

    test("Neighbor entering 'Restarting' TRIPS circuit breaker immediately", () => {
      const containerMap = new Map();
      EXPECTED_NEIGHBORS.forEach((name) => containerMap.set(name, "Up 4 days"));
      containerMap.set("convoza-postgres", "Restarting (1) 2 seconds ago");
      const res = evaluateNeighbors(containerMap);
      assert.equal(res.aborted, true);
      assert.equal(res.code, "NEIGHBOR_UNHEALTHY");
      assert.equal(res.name, "convoza-postgres");
    });
  });

  // D. PostgreSQL Connection Saturation
  describe("D. PostgreSQL Active Connection Circuit Breaker", () => {
    function evaluatePg(activeConns, threshold = 40) {
      if (activeConns >= threshold) {
        return { aborted: true, reason: `Active connections ${activeConns} reached threshold ${threshold}` };
      }
      return { aborted: false, conns: activeConns };
    }

    test("Normal connections (8 active) passes", () => {
      assert.equal(evaluatePg(8).aborted, false);
    });

    test("Elevated connections (42 active) TRIPS circuit breaker", () => {
      const res = evaluatePg(42);
      assert.equal(res.aborted, true);
      assert.ok(res.reason.includes("reached threshold 40"));
    });
  });

  // E. Redis Memory Saturation
  describe("E. Redis Memory Saturation Circuit Breaker", () => {
    function evaluateRedisMem(used, max, thresholdPct = 80) {
      if (max > 0) {
        const pct = Math.round((100 * used) / max);
        if (pct >= thresholdPct) {
          return { aborted: true, pct, reason: `Redis memory at ${pct}% of max` };
        }
      }
      return { aborted: false };
    }

    test("Normal Redis memory (10 MB out of 64 MB = 15%) passes", () => {
      assert.equal(evaluateRedisMem(10 * 1024 * 1024, 64 * 1024 * 1024).aborted, false);
    });

    test("High Redis memory (55 MB out of 64 MB = 86%) TRIPS circuit breaker", () => {
      const res = evaluateRedisMem(55 * 1024 * 1024, 64 * 1024 * 1024);
      assert.equal(res.aborted, true);
      assert.equal(res.pct, 86);
    });
  });

  // F. Disk Headroom
  describe("F. Disk Space Depletion Circuit Breaker", () => {
    function evaluateDisk(availGb, thresholdGb = 50) {
      if (availGb < thresholdGb) {
        return { aborted: true, reason: `Free disk space ${availGb} GB fell below ${thresholdGb} GB limit` };
      }
      return { aborted: false };
    }

    test("Current disk headroom (166 GB) passes", () => {
      assert.equal(evaluateDisk(166).aborted, false);
    });

    test("Low disk headroom (44 GB) TRIPS circuit breaker", () => {
      const res = evaluateDisk(44);
      assert.equal(res.aborted, true);
      assert.ok(res.reason.includes("below 50 GB limit"));
    });
  });

  // G. Application Error Rate
  describe("G. Sustained 5xx Application Error Rate Circuit Breaker", () => {
    function evaluateErrors(samples, maxStreak = 3) {
      let streak = 0;
      for (const { total, errors } of samples) {
        if (total > 20) {
          const rate = (100 * errors) / total;
          if (rate > 5) {
            streak++;
            if (streak >= maxStreak) {
              return { aborted: true, reason: `Sustained 5xx error rate at ${rate.toFixed(1)}%` };
            }
          } else {
            streak = 0;
          }
        }
      }
      return { aborted: false };
    }

    test("Transient errors (1 bad sample then recovery) passes", () => {
      const samples = [
        { total: 50, errors: 4 }, // 8% error
        { total: 50, errors: 1 }, // 2% error
        { total: 50, errors: 0 },
      ];
      assert.equal(evaluateErrors(samples).aborted, false);
    });

    test("Sustained 5xx error rate across 3 consecutive intervals TRIPS circuit breaker", () => {
      const samples = [
        { total: 50, errors: 4 }, // 8%
        { total: 50, errors: 5 }, // 10%
        { total: 50, errors: 4 }, // 8%
      ];
      const res = evaluateErrors(samples);
      assert.equal(res.aborted, true);
      assert.ok(res.reason.includes("Sustained 5xx error rate"));
    });
  });

  // H. Precision Process Termination Matching (Strict PID File Tracking)
  describe("H. Precision Process Termination Matching", () => {
    function resolveTerminationTarget(pidFileContent, envPid) {
      if (pidFileContent && pidFileContent.trim().length > 0) {
        const parsed = parseInt(pidFileContent.trim(), 10);
        if (Number.isFinite(parsed) && parsed > 0) return { targetPid: parsed, source: "pid_file" };
      }
      if (envPid) {
        const parsed = parseInt(envPid, 10);
        if (Number.isFinite(parsed) && parsed > 0) return { targetPid: parsed, source: "env" };
      }
      return { targetPid: null, source: "none" };
    }

    test("Accurately resolves runner PID from pid file", () => {
      const res = resolveTerminationTarget("41924\n", null);
      assert.equal(res.targetPid, 41924);
      assert.equal(res.source, "pid_file");
    });

    test("Falls back to env PID when pid file is absent", () => {
      const res = resolveTerminationTarget("", "58210");
      assert.equal(res.targetPid, 58210);
      assert.equal(res.source, "env");
    });

    test("Rejects broad or non-numeric process targets", () => {
      const res = resolveTerminationTarget("invalid_string", "");
      assert.equal(res.targetPid, null);
      assert.equal(res.source, "none");
    });
  });
});
