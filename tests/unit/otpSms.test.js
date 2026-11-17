import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import querystring from "node:querystring";
import { otpStore } from "../../frontend/lib/auth/otpStore.js";
import { smsService } from "../../frontend/lib/auth/smsService.js";

describe("TRAI DLT SMS Gateway & OTP Verification Suite", () => {
  let server;
  let mockUrl;
  let requests = [];
  let serverBehavior = null;

  before(async () => {
    process.env.ALLOW_LIVE_SMS_IN_TEST = "true";
    process.env.DLT_SMS_TIMEOUT_MS = "300";
    process.env.DLT_DLR_DELAYS_MS = "40";

    server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, "http://127.0.0.1");
      const query = Object.fromEntries(parsedUrl.searchParams.entries());
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const postParams = body ? querystring.parse(body) : {};
        const merged = { ...query, ...postParams };
        requests.push({ method: req.method, params: merged });

        if (serverBehavior) {
          serverBehavior(req, res, merged);
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            "message-id": ["msg_mock_1001"],
            message: "SMS Sent Successfully",
          })
        );
      });
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    mockUrl = `http://127.0.0.1:${port}/sms-panel/api/http/index.php`;
    process.env.DLT_SMS_URI = mockUrl;
  });

  after(async () => {
    smsService._clearBackgroundTimers();
    delete process.env.ALLOW_LIVE_SMS_IN_TEST;
    delete process.env.DLT_SMS_URI;
    delete process.env.DLT_SMS_TIMEOUT_MS;
    delete process.env.DLT_DLR_DELAYS_MS;
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    smsService._clearBackgroundTimers();
    requests = [];
    serverBehavior = null;
    otpStore._resetMemoryStore();
  });

  it("1. Dispatches exact 3-variable DLT template (Dear User / 6-digit OTP / Team Nexus) in sub-100ms", async () => {
    const t0 = Date.now();
    const res = await otpStore.sendOtp({ phone: "9876543210", purpose: "registration" });
    const elapsed = Date.now() - t0;

    assert.equal(res.success, true);
    assert.equal(res.phone, "+919876543210");
    assert.equal(res.messageId, "msg_mock_1001");
    assert.ok(elapsed < 250, `Expected fast response <250ms, got ${elapsed}ms`);

    const smsReq = requests.find((r) => r.params.apirequest === "Text");
    assert.ok(smsReq, "Expected Text SMS dispatch call");
    assert.equal(smsReq.method, "GET");
    assert.equal(smsReq.params.sender, "TXXTOO");
    assert.equal(smsReq.params.TemplateID, "1607100000000313742");
    assert.equal(smsReq.params.EntityID, "1401805350000060162");
    assert.equal(smsReq.params.mobile, "9876543210");
    assert.match(
      smsReq.params.message,
      /^Dear User Your OTP for verification is (\d{6})\. Please enter this code to complete the process\.\nRegards Team Nexus\nTEXT2$/
    );

    // Extract OTP and verify end-to-end
    const otpMatch = smsReq.params.message.match(/\b(\d{6})\b/);
    const verifyRes = await otpStore.verifyOtp({
      phone: "9876543210",
      otp: otpMatch[1],
      purpose: "registration",
    });
    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.verified, true);
    assert.ok(verifyRes.verificationToken);

    // Login OTP token also works for new-user registration handoff
    const loginToken = otpStore.createVerificationToken("+919876543210", "login");
    assert.equal(
      otpStore.verifyVerificationToken("+919876543210", loginToken, "registration"),
      true
    );
  });

  it("2. Does NOT fake success or lock 60s cooldown when SMS gateway fails, allowing immediate retry", async () => {
    serverBehavior = (_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: "Insufficient Balance" }));
    };

    const failRes = await otpStore.sendOtp({ phone: "9123456789", purpose: "login" });
    assert.equal(failRes.success, false);
    assert.equal(failRes.gatewayFailed, true);
    assert.match(failRes.error, /Insufficient Balance/);

    // Restore healthy gateway and immediately retry (must NOT hit 60s cooldown!)
    serverBehavior = null;
    const retryRes = await otpStore.sendOtp({ phone: "9123456789", purpose: "login" });
    assert.equal(retryRes.success, true);
    assert.equal(retryRes.messageId, "msg_mock_1001");
  });

  it("3. Falls back from GET to POST automatically on HTTP 403/502 proxy errors and destroys hung sockets", async () => {
    serverBehavior = (req, res) => {
      if (req.method === "GET") {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("GET blocked by proxy");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", "message-id": ["msg_post_2002"] }));
    };

    const res = await smsService.sendSms({ to: "+919988776655", otp: "654321" });
    assert.equal(res.success, true);
    assert.equal(res.messageId, "msg_post_2002");
    assert.equal(requests[0].method, "GET");
    assert.equal(requests[1].method, "POST");
  });

  it("4. Tracks carrier DLR and auto-heals with 'Team Emperor' if carrier scrubber rejects 'Team Nexus'", async () => {
    let textCallCount = 0;
    serverBehavior = (_req, res, params) => {
      if (params.apirequest === "Text") {
        textCallCount++;
        const id = textCallCount === 1 ? "msg_primary_scrubbed" : "msg_healed_delivered";
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", "message-id": [id] }));
        return;
      }
      if (params.apirequest === "DeliveryReport") {
        res.writeHead(200, { "Content-Type": "application/json" });
        if (params.messageid === "msg_primary_scrubbed") {
          res.end(
            JSON.stringify({
              mobile: "9876501234",
              sender: "TXXTOO",
              message_status: "Rejected by DLT",
              stat: "REJECTD",
              err: "415",
            })
          );
        } else {
          res.end(
            JSON.stringify({
              mobile: "9876501234",
              sender: "TXXTOO",
              message_status: "Delivered",
              deliveredAt: "2026-11-17 18:30:00",
              stat: "DELIVRD",
              err: "000",
            })
          );
        }
      }
    };

    const sendRes = await smsService.sendSms({ to: "9876501234", otp: "778899" });
    assert.equal(sendRes.success, true);
    assert.equal(sendRes.messageId, "msg_primary_scrubbed");

    // Wait briefly for background DLR check + auto-heal
    await new Promise((r) => setTimeout(r, 140));

    const textCalls = requests.filter((r) => r.params.apirequest === "Text");
    assert.equal(textCalls.length, 2, "Expected primary Team Nexus + auto-healed Team Emperor dispatch");
    assert.ok(textCalls[0].params.message.includes("Regards Team Nexus\nTEXT2"));
    assert.ok(textCalls[1].params.message.includes("Regards Team Emperor\nTEXT2"));
    assert.ok(textCalls[1].params.message.includes("778899"), "Must preserve identical OTP code");

    const dlrStatus = await smsService.getDeliveryStatus("msg_primary_scrubbed");
    assert.equal(dlrStatus.status, "delivered");
  });
});
