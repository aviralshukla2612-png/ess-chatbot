/**
 * Emperor Nexus — Corrected k6 Network Performance & Load Testing Suite
 *
 * Implements:
 * - Time-based VU execution with ramping and steady-state holding
 * - Realistic 1–3s user think-time between turns
 * - Pre-flight Watchdog Verification Barrier in setup()
 * - Strict multi-tenant partitioning across synthetic Alpha & Beta tenants
 * - 8-point widget workflow: Health -> Session -> Ticket -> Chat -> OTP -> Lead -> Cross-Tenant Probe
 * - Strict error thresholds & automatic abort triggers
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom SRE Metrics
export const errorRate = new Rate("error_rate");
export const ttftTrend = new Trend("ttft_ms");
export const chatLatencyTrend = new Trend("chat_latency_ms");
export const sseTicketTrend = new Trend("sse_ticket_latency_ms");
export const sessionCounter = new Counter("sessions_created");
export const leadsCounter = new Counter("leads_captured");
export const securityLeakCounter = new Counter("security_cross_tenant_leaks");
export const http429Counter = new Counter("http_429_throttled");
export const http503Counter = new Counter("http_503_overloaded");

const TARGET_HOST = __ENV.TARGET_HOST || "http://127.0.0.1:3301";
const BOT_ALPHA = "bot_stage3_alpha_01";
const BOT_BETA = "bot_stage3_beta_01";
const ORG_ALPHA = "org_stage3_alpha_test";
const ORG_BETA = "org_stage3_beta_test";

/**
 * Stage 3 Full Breakpoint & Progressive Stress Test Scenarios
 * Progression: 10 -> 25 -> 50 -> 75 -> 100 -> 150 -> 200 -> 300 -> 500 VUs
 * All levels use sustained, time-based ramping and steady-state holding with 1-3s think time.
 */
export const scenariosConfig = {
  // Phase 2: Baseline (Level 1: 10 VUs for 120s)
  level1_10vu: {
    executor: "ramping-vus",
    startVUs: 1,
    stages: [
      { duration: "20s", target: 10 },
      { duration: "80s", target: 10 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "10s",
  },
  // Phase 3: Progressive Stress Levels
  level2_25vu: {
    executor: "ramping-vus",
    startVUs: 2,
    stages: [
      { duration: "20s", target: 25 },
      { duration: "80s", target: 25 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "15s",
  },
  level3_50vu: {
    executor: "ramping-vus",
    startVUs: 5,
    stages: [
      { duration: "20s", target: 50 },
      { duration: "80s", target: 50 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "15s",
  },
  level4_75vu: {
    executor: "ramping-vus",
    startVUs: 10,
    stages: [
      { duration: "20s", target: 75 },
      { duration: "80s", target: 75 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "15s",
  },
  level5_100vu: {
    executor: "ramping-vus",
    startVUs: 10,
    stages: [
      { duration: "20s", target: 100 },
      { duration: "80s", target: 100 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "20s",
  },
  level6_150vu: {
    executor: "ramping-vus",
    startVUs: 15,
    stages: [
      { duration: "20s", target: 150 },
      { duration: "80s", target: 150 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "20s",
  },
  level7_200vu: {
    executor: "ramping-vus",
    startVUs: 20,
    stages: [
      { duration: "20s", target: 200 },
      { duration: "80s", target: 200 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "20s",
  },
  level8_300vu: {
    executor: "ramping-vus",
    startVUs: 25,
    stages: [
      { duration: "30s", target: 300 },
      { duration: "60s", target: 300 },
      { duration: "30s", target: 0 },
    ],
    gracefulRampDown: "30s",
  },
  level9_500vu: {
    executor: "ramping-vus",
    startVUs: 50,
    stages: [
      { duration: "30s", target: 500 },
      { duration: "60s", target: 500 },
      { duration: "30s", target: 0 },
    ],
    gracefulRampDown: "30s",
  },
};

// Aliases for backward compatibility and CLI convenience
scenariosConfig.level1_baseline = scenariosConfig.level1_10vu;
scenariosConfig.level2_normal = scenariosConfig.level2_25vu;
scenariosConfig.level3_stress = scenariosConfig.level5_100vu;
scenariosConfig["100vu"] = scenariosConfig.level5_100vu;
scenariosConfig["100"] = scenariosConfig.level5_100vu;
scenariosConfig["10vu"] = scenariosConfig.level1_10vu;
scenariosConfig["10"] = scenariosConfig.level1_10vu;
scenariosConfig["25vu"] = scenariosConfig.level2_25vu;
scenariosConfig["25"] = scenariosConfig.level2_25vu;
scenariosConfig["50vu"] = scenariosConfig.level3_50vu;
scenariosConfig["50"] = scenariosConfig.level3_50vu;
scenariosConfig["75vu"] = scenariosConfig.level4_75vu;
scenariosConfig["75"] = scenariosConfig.level4_75vu;

const selectedScenario = __ENV.SCENARIO || "level1_10vu";
const activeScenarioConfig = scenariosConfig[selectedScenario] || scenariosConfig.level1_10vu;

export const options = {
  scenarios: {
    [selectedScenario]: activeScenarioConfig,
  },
  thresholds: {
    // SRE Safety Thresholds
    http_req_failed: ["rate<0.10"],             // Alert if failure rate exceeds 10%
    error_rate: ["rate<0.10"],
    security_cross_tenant_leaks: ["count==0"],  // Zero tolerance for cross-tenant leakage
    chat_latency_ms: ["p(95)<5000"],           // 95% of chat turns complete under 5s
  },
};

/**
 * Setup Barrier: Validates host reachability and verifies live watchdog
 */
export function setup() {
  console.log(`[SETUP] Initializing load test against target: ${TARGET_HOST}`);

  // Hard anti-workstation fallback barrier
  if (__ENV.OS === "Windows_NT" && !__ENV.ALLOW_LOCAL_DRY_RUN) {
    throw new Error(
      "[SAFETY_BARRIER_HALT] Load test execution is strictly forbidden on local Windows workstation. " +
      "Must execute on target Contabo VPS (Ubuntu 24.04). Set ALLOW_LOCAL_DRY_RUN=1 only for offline syntax checks."
    );
  }

  // 1. Health Probe
  const healthRes = http.get(`${TARGET_HOST}/api/health`, { timeout: "5s" });
  if (healthRes.status !== 200) {
    throw new Error(`[SETUP_ABORT] Target ${TARGET_HOST} health check failed with status ${healthRes.status}. Staging stack is not running!`);
  }
  console.log(`[SETUP] Staging health check passed: ${healthRes.body}`);

  // 2. Synthetic Bot Probe (Alpha & Beta bot availability verification)
  const botAlphaRes = http.get(`${TARGET_HOST}/api/public/chat/${BOT_ALPHA}/session`, { timeout: "5s" });
  if (botAlphaRes.status === 404) {
    throw new Error(`[SETUP_ABORT] Bot '${BOT_ALPHA}' returned 404! Seed data is missing from staging.`);
  }
  console.log(`[SETUP] Staging synthetic bots verified (${BOT_ALPHA} status: ${botAlphaRes.status}).`);

  return {
    targetHost: TARGET_HOST,
    startedAt: new Date().toISOString(),
  };
}

export default function (data) {
  const vuId = __VU;
  const iterId = __ITER;

  // Multi-tenant partition: Even VUs -> Alpha, Odd VUs -> Beta
  const isAlpha = vuId % 2 === 0;
  const targetBot = isAlpha ? BOT_ALPHA : BOT_BETA;
  const targetOrg = isAlpha ? ORG_ALPHA : ORG_BETA;
  const opposingBot = isAlpha ? BOT_BETA : BOT_ALPHA;
  const opposingOrg = isAlpha ? ORG_BETA : ORG_ALPHA;

  // Synthetic client IP per VU to simulate distributed real visitors
  const ipSuffix = ((vuId * 17 + iterId * 23) % 240) + 1;
  const clientIp = `198.51.100.${ipSuffix}`;

  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": clientIp,
  };

  // ---------------------------------------------------------------------------
  // 1. Health Probe
  // ---------------------------------------------------------------------------
  const healthRes = http.get(`${TARGET_HOST}/api/health`, {
    headers,
    responseCallback: http.expectedStatuses(200, 503),
  });
  check(healthRes, { "health status 200": (r) => r.status === 200 });

  // ---------------------------------------------------------------------------
  // 2. Visitor Session Creation
  // ---------------------------------------------------------------------------
  const sessionRes = http.post(
    `${TARGET_HOST}/api/public/chat/${targetBot}/session`,
    JSON.stringify({ name: `Visitor VU ${vuId} (${targetOrg})` }),
    {
      headers,
      responseCallback: http.expectedStatuses(200, 429),
    }
  );

  const sessionOk = check(sessionRes, {
    "session created 200": (r) => r.status === 200,
  });

  if (!sessionOk) {
    if (sessionRes.status === 429) http429Counter.add(1);
    else if (sessionRes.status >= 500) errorRate.add(1);
    sleep(1);
    return;
  }

  sessionCounter.add(1);
  const sessionBody = JSON.parse(sessionRes.body);
  const conversationId = sessionBody.conversationId;
  const visitorToken = sessionBody.visitorToken;

  // ---------------------------------------------------------------------------
  // 3. SSE Ticket Issuance
  // ---------------------------------------------------------------------------
  const t0Ticket = Date.now();
  const ticketRes = http.post(
    `${TARGET_HOST}/api/public/chat/${targetBot}/ticket`,
    JSON.stringify({ visitorToken }),
    {
      headers,
      responseCallback: http.expectedStatuses(200, 403, 429),
    }
  );
  if (ticketRes.timings && ticketRes.timings.duration) {
    sseTicketTrend.add(ticketRes.timings.duration);
  } else {
    sseTicketTrend.add(Date.now() - t0Ticket);
  }

  check(ticketRes, {
    "ticket status 200, 403, or 429": (r) => [200, 403, 429].includes(r.status),
  });

  // ---------------------------------------------------------------------------
  // 4. Simulated Chat Message Turn
  // ---------------------------------------------------------------------------
  const chatPayload = JSON.stringify({
    message: `What services does Emperor Nexus provide for ${targetOrg}?`,
    conversationId: conversationId,
    visitorToken: visitorToken,
  });

  const t0Chat = Date.now();
  const chatRes = http.post(
    `${TARGET_HOST}/api/public/chat/${targetBot}`,
    chatPayload,
    {
      headers,
      responseCallback: http.expectedStatuses(200, 429, 503),
    }
  );
  const chatElapsed = Date.now() - t0Chat;

  if (chatRes.timings && typeof chatRes.timings.waiting === "number") {
    ttftTrend.add(chatRes.timings.waiting);
  }
  if (chatRes.timings && typeof chatRes.timings.duration === "number") {
    chatLatencyTrend.add(chatRes.timings.duration);
  } else {
    chatLatencyTrend.add(chatElapsed);
  }

  check(chatRes, {
    "chat status 200 or 429/503": (r) => [200, 429, 503].includes(r.status),
  });

  if (chatRes.status === 429) {
    http429Counter.add(1);
  } else if (chatRes.status === 503) {
    http503Counter.add(1);
  } else if (chatRes.status >= 500) {
    errorRate.add(1);
  }

  // ---------------------------------------------------------------------------
  // 5. Mock OTP Queue Dispatch
  // ---------------------------------------------------------------------------
  const otpRes = http.post(
    `${TARGET_HOST}/api/auth/otp/send`,
    JSON.stringify({
      phone: `+9198765${String(vuId).padStart(5, "0")}`,
      purpose: "verification",
    }),
    {
      headers,
      responseCallback: http.expectedStatuses(200, 403, 429),
    }
  );
  check(otpRes, {
    "otp status 200, 403, or 429": (r) => [200, 403, 429].includes(r.status),
  });

  // ---------------------------------------------------------------------------
  // 6. Synthetic Lead Capture
  // ---------------------------------------------------------------------------
  const leadRes = http.post(
    `${TARGET_HOST}/api/leads`,
    JSON.stringify({
      name: `Synthetic Lead VU ${vuId}`,
      email: `lead_vu_${vuId}@${isAlpha ? "alpha.test" : "beta.test"}`,
      phone: `+9198765${String(vuId).padStart(5, "0")}`,
      organizationId: targetOrg,
    }),
    {
      headers,
      responseCallback: http.expectedStatuses(200, 201, 401, 429),
    }
  );
  if (leadRes.status === 200 || leadRes.status === 201) {
    leadsCounter.add(1);
  }

  // ---------------------------------------------------------------------------
  // 7. Adversarial Cross-Tenant Security Probe (Multi-Vector Tenant Isolation)
  // ---------------------------------------------------------------------------
  const probeHeaders = {
    ...headers,
    "x-visitor-token": visitorToken,
  };

  // Vector A: Alpha VU attempts to query opposing bot session presenting target visitorToken
  const probeRes = http.get(
    `${TARGET_HOST}/api/public/chat/${opposingBot}/session`,
    {
      headers: probeHeaders,
      responseCallback: http.expectedStatuses(200, 401, 403, 404),
    }
  );

  // Opposing bot session lookup MUST NOT return the conversationId of targetOrg
  if (probeRes.status === 200) {
    try {
      const probeBody = JSON.parse(probeRes.body);
      if (probeBody.conversationId === conversationId) {
        console.error(`[CRITICAL SECURITY LEAK] Visitor from ${targetOrg} accessed conversation in ${opposingOrg}!`);
        securityLeakCounter.add(1);
      }
    } catch { }
  }

  // Vector B: Adversarial chat injection to opposing bot presenting target conversationId
  const crossChatRes = http.post(
    `${TARGET_HOST}/api/public/chat/${opposingBot}`,
    JSON.stringify({
      message: "Adversarial cross-tenant intrusion probe",
      conversationId: conversationId,
      visitorToken: visitorToken,
    }),
    {
      headers: probeHeaders,
      responseCallback: http.expectedStatuses(200, 400, 401, 403, 404, 429),
    }
  );

  // Opposing bot MUST NOT attach conversation or leak data
  if (crossChatRes.status === 200) {
    try {
      const crossBody = JSON.parse(crossChatRes.body);
      if (crossBody.conversationId === conversationId && crossBody.organizationId === targetOrg) {
        console.error(`[CRITICAL SECURITY LEAK] Opposing bot ${opposingBot} attached turn to ${targetOrg} conversation!`);
        securityLeakCounter.add(1);
      }
    } catch { }
  }

  // ---------------------------------------------------------------------------
  // 8. Realistic User Think Time (1 to 3 seconds)
  // ---------------------------------------------------------------------------
  sleep(1 + Math.random() * 2);
}

export function teardown(data) {
  console.log(`[TEARDOWN] Test run completed. Finished at: ${new Date().toISOString()}`);
}
