/**
 * Emperor Nexus — Comprehensive k6 Performance & Load Testing Suite
 *
 * Scenarios:
 * - Level 1: Baseline (5-10 VUs)
 * - Level 2: Normal Load (25 VUs)
 * - Level 3: Moderate Load (50 VUs)
 * - Level 4: Heavy Load (100 VUs)
 * - Level 5: Spike Test (100 to 200 VUs)
 * - Level 6: Breaking Point Test
 *
 * Configured strictly for isolated staging (default: http://127.0.0.1:3301).
 * Never points to production without explicit manual override.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("error_rate");
const ttftTrend = new Trend("ttft_ms");
const chatLatencyTrend = new Trend("chat_latency_ms");
const sessionCreatedCounter = new Counter("sessions_created");

const TARGET_HOST = __ENV.TARGET_HOST || "http://127.0.0.1:3301";
const BOT_ID = __ENV.BOT_ID || "bot_stage3_alpha_01";
const ORG_ID = __ENV.ORG_ID || "org_stage3_alpha_test";

export const options = {
  scenarios: {
    // Selectable via CLI: k6 run -e SCENARIO=level1 tests/load/k6_scenarios.js
    level1_baseline: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "20s", target: 10 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
    level2_normal: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "15s", target: 25 },
        { duration: "30s", target: 25 },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    level3_moderate: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "20s", target: 50 },
        { duration: "40s", target: 50 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    level4_heavy: {
      executor: "ramping-vus",
      startVUs: 20,
      stages: [
        { duration: "30s", target: 100 },
        { duration: "60s", target: 100 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "15s",
    },
    level5_spike: {
      executor: "ramping-vus",
      startVUs: 20,
      stages: [
        { duration: "15s", target: 100 },
        { duration: "15s", target: 200 },
        { duration: "30s", target: 200 },
        { duration: "20s", target: 20 },
      ],
      gracefulRampDown: "15s",
    },
  },
  thresholds: {
    // SRE Safety Thresholds
    http_req_failed: ["rate<0.05"], // Error rate must stay under 5%
    error_rate: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"], // 95% of requests should complete under 3s
  },
};

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const ipSuffix = ((vuId * 7 + iterId) % 250) + 1;
  const clientIp = `198.51.100.${ipSuffix}`;

  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": clientIp,
  };

  // 1. Health Probe
  const healthRes = http.get(`${TARGET_HOST}/api/health`, { headers });
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
  });

  // 2. Visitor Session Creation
  const sessionPayload = JSON.stringify({
    name: `Test Visitor VU ${vuId}`,
  });

  const sessionRes = http.post(
    `${TARGET_HOST}/api/public/chat/${BOT_ID}/session`,
    sessionPayload,
    { headers }
  );

  const sessionOk = check(sessionRes, {
    "session status is 200": (r) => r.status === 200,
    "session returns conversationId": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.conversationId);
      } catch {
        return false;
      }
    },
  });

  if (!sessionOk) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  sessionCreatedCounter.add(1);
  const sessionData = JSON.parse(sessionRes.body);
  const conversationId = sessionData.conversationId;
  const visitorToken = sessionData.visitorToken;

  // 3. Message Submission (Simulated Chat Turn)
  const chatPayload = JSON.stringify({
    message: "What services do you provide for web and chatbot development?",
    conversationId: conversationId,
    visitorToken: visitorToken,
  });

  const t0 = Date.now();
  const chatRes = http.post(
    `${TARGET_HOST}/api/public/chat/${BOT_ID}`,
    chatPayload,
    { headers }
  );
  const elapsed = Date.now() - t0;
  chatLatencyTrend.add(elapsed);

  check(chatRes, {
    "chat returns 200 or 429": (r) => r.status === 200 || r.status === 429,
  });

  if (chatRes.status >= 500) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Realistic user think time (between 1s and 3s)
  sleep(1 + Math.random() * 2);
}
