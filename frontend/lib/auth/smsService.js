import http from "http";
import https from "https";
import querystring from "querystring";

const httpsKeepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 16,
  family: 4, // Force IPv4 to avoid dual-stack IPv6 connect delays
});

const httpKeepAliveAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 16,
});

function pickTransport(urlObj) {
  const isHttp = urlObj.protocol === "http:";
  return {
    lib: isHttp ? http : https,
    agent: isHttp ? httpKeepAliveAgent : httpsKeepAliveAgent,
    defaultPort: isHttp ? 80 : 443,
  };
}

function getGatewayTimeoutMs() {
  return Number(process.env.DLT_SMS_TIMEOUT_MS) || 4000;
}

export function getDltConfig() {
  return {
    uri: process.env.DLT_SMS_URI || "https://allsmssolution.in/sms-panel/api/http/index.php",
    username: process.env.DLT_SMS_USERNAME || "EMPEROR",
    apikey: process.env.DLT_SMS_APIKEY || "62CEF-9A446",
    sender: process.env.DLT_SMS_SENDER || "TXXTOO",
    route: process.env.DLT_SMS_ROUTE || "TRANS",
    templateId: process.env.DLT_SMS_TEMPLATE_ID || "1607100000000313742",
    entityId: process.env.DLT_SMS_ENTITY_ID || "1401805350000060162",
    // Primary sign-off variable (#3): "Team Nexus" (configurable via env)
    signOff: process.env.DLT_SMS_SIGNOFF || "Team Nexus",
    // Carrier-verified Entity fallback sign-off if operator DLT scrubber rejects primary sign-off
    fallbackSignOff: process.env.DLT_SMS_FALLBACK_SIGNOFF || "Team Emperor",
    autoHealSignOff: process.env.DLT_SMS_AUTO_FALLBACK_SIGNOFF !== "false",
  };
}

// In-memory cache of live carrier Delivery Reports keyed by messageId (TTL bounded)
const dlrStatusCache = new Map();
const activeDlrTimers = new Set();

function recordDlrCache(messageId, entry) {
  if (!messageId) return;
  if (dlrStatusCache.size > 500) {
    const oldestKey = dlrStatusCache.keys().next().value;
    if (oldestKey) dlrStatusCache.delete(oldestKey);
  }
  dlrStatusCache.set(String(messageId), {
    ...entry,
    updatedAt: new Date().toISOString(),
  });
}

function parseGatewayBody(rawText, statusCode) {
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {}

  const lower = (rawText || "").toLowerCase();
  const statusStr = String(parsed?.status || "").toLowerCase();
  const rawMsgId = parsed?.["message-id"] || parsed?.msgid || parsed?.messageId || null;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;

  const isSuccess =
    statusCode >= 200 &&
    statusCode < 300 &&
    (statusStr === "success" ||
      Boolean(messageId) ||
      (!parsed && (lower.includes("sms sent successfully") || lower.includes("message-id"))));

  const definitiveGatewayError =
    statusStr === "error" ||
    statusStr === "failed" ||
    Boolean(parsed?.message && statusStr !== "success" && !messageId);

  return {
    httpStatus: statusCode,
    success: isSuccess,
    definitiveGatewayError,
    messageId: messageId ? String(messageId) : null,
    gatewayMessage: parsed?.message || (typeof rawText === "string" ? rawText.trim().slice(0, 180) : ""),
    raw: parsed || rawText,
  };
}

function requestGatewayGet(uri, payload, timeoutMs = getGatewayTimeoutMs()) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => {
      if (!settled) {
        settled = true;
        clearTimeout(hardTimer);
        resolve(val);
      }
    };

    let req = null;
    const hardTimer = setTimeout(() => {
      try {
        req?.destroy(new Error("Gateway GET timeout"));
      } catch {}
      done({ success: false, timeout: true, error: `Gateway GET timed out after ${timeoutMs}ms` });
    }, timeoutMs + 150);
    hardTimer.unref?.();

    try {
      const urlObj = new URL(uri);
      const { lib, agent, defaultPort } = pickTransport(urlObj);
      const q = querystring.stringify(payload);
      const fullPath = `${urlObj.pathname}${urlObj.search ? urlObj.search + "&" : "?"}${q}`;

      req = lib.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || defaultPort,
          path: fullPath,
          method: "GET",
          agent,
          headers: {
            Accept: "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (compatible; EmperorNexus/2.0)",
          },
        },
        (res) => {
          let text = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (text += chunk));
          res.on("end", () => done(parseGatewayBody(text, res.statusCode)));
        }
      );

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Gateway socket timeout (${timeoutMs}ms)`));
      });

      req.on("error", (err) => {
        done({ success: false, error: err.message });
      });

      req.end();
    } catch (err) {
      done({ success: false, error: err.message });
    }
  });
}

function requestGatewayPost(uri, payload, timeoutMs = getGatewayTimeoutMs()) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => {
      if (!settled) {
        settled = true;
        clearTimeout(hardTimer);
        resolve(val);
      }
    };

    let req = null;
    const hardTimer = setTimeout(() => {
      try {
        req?.destroy(new Error("Gateway POST timeout"));
      } catch {}
      done({ success: false, timeout: true, error: `Gateway POST timed out after ${timeoutMs}ms` });
    }, timeoutMs + 150);
    hardTimer.unref?.();

    try {
      const urlObj = new URL(uri);
      const { lib, agent, defaultPort } = pickTransport(urlObj);
      const postData = querystring.stringify(payload);

      req = lib.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || defaultPort,
          path: urlObj.pathname + urlObj.search,
          method: "POST",
          agent,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData),
            Accept: "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (compatible; EmperorNexus/2.0)",
          },
        },
        (res) => {
          let text = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (text += chunk));
          res.on("end", () => done(parseGatewayBody(text, res.statusCode)));
        }
      );

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Gateway socket timeout (${timeoutMs}ms)`));
      });

      req.on("error", (err) => {
        done({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      done({ success: false, error: err.message });
    }
  });
}

function buildTemplateMessage(var1, var2, var3) {
  // Exact TRAI DLT approved template pattern (TemplateID: 1607100000000313742, Header: TXXTOO):
  // "Dear {#var#} Your OTP for verification is {#var#}. Please enter this code to complete the process.\nRegards {#var#}\nTEXT2"
  const cleanVar1 = String(var1 || "User").trim().slice(0, 30) || "User";
  const cleanVar2 = String(var2 || "").trim().slice(0, 10);
  const cleanVar3 = String(var3 || "Team Nexus").trim().slice(0, 30) || "Team Nexus";
  return `Dear ${cleanVar1} Your OTP for verification is ${cleanVar2}. Please enter this code to complete the process.\nRegards ${cleanVar3}\nTEXT2`;
}

function buildDltPayload(cfg, cleanNumbers, finalMessage) {
  return {
    username: cfg.username,
    apikey: cfg.apikey,
    apirequest: "Text",
    sender: cfg.sender,
    route: cfg.route,
    format: "JSON",
    TemplateID: cfg.templateId,
    EntityID: cfg.entityId,
    PE_ID: cfg.entityId,
    mobile: cleanNumbers,
    message: finalMessage,
  };
}

function isDefinitiveCarrierRejection(dlr) {
  if (!dlr || typeof dlr !== "object") return false;
  const stat = String(dlr.stat || "").toUpperCase().trim();
  const msgStatus = String(dlr.message_status || "").toLowerCase().trim();
  const errCode = String(dlr.err || "").trim();

  if (stat === "DELIVRD" || msgStatus === "delivered") return false;
  if (
    ["REJECTD", "UNDELIV", "FAILED", "EXPIRED", "DND", "BLOCKED", "DELETED"].includes(stat) ||
    /reject|undeliv|fail|scrub|dnd|block|invalid|template/i.test(msgStatus)
  ) {
    return true;
  }
  if (
    errCode &&
    errCode !== "000" &&
    errCode !== "0" &&
    !["SUBMITTED", "ACCEPTD", "PENDING", "ENROUTE", ""].includes(stat)
  ) {
    return true;
  }
  return false;
}

function scheduleBackgroundDlrCheck({ messageId, cleanNumbers, var1, otpCode, usedSignOff }) {
  if (!messageId) return;
  recordDlrCache(messageId, {
    messageId,
    mobile: cleanNumbers,
    status: "queued",
    stat: "SUBMITTED",
    signOff: usedSignOff,
  });

  let healed = false;
  const checkDelaysMs = process.env.DLT_DLR_DELAYS_MS
    ? process.env.DLT_DLR_DELAYS_MS.split(",").map((n) => Number(n.trim())).filter(Boolean)
    : [3500, 8000];

  checkDelaysMs.forEach((delayMs, idx) => {
    const t = setTimeout(async () => {
      activeDlrTimers.delete(t);
      try {
        const current = dlrStatusCache.get(String(messageId));
        if (current?.status === "delivered" || healed) return;

        const dlr = await smsService.checkDeliveryReport(messageId);
        if (!dlr || dlr.status === "error") return;

        const stat = String(dlr.stat || "").toUpperCase();
        const msgStatus = String(dlr.message_status || "");

        if (stat === "DELIVRD" || msgStatus.toLowerCase() === "delivered") {
          recordDlrCache(messageId, {
            messageId,
            mobile: cleanNumbers,
            status: "delivered",
            stat: stat || "DELIVRD",
            err: dlr.err || "000",
            deliveredAt: dlr.deliveredAt || new Date().toISOString(),
            signOff: usedSignOff,
          });
          console.log(
            `[DLT_CARRIER_DELIVERED] +91${cleanNumbers} | MsgID=${messageId} | stat=${stat} | err=${dlr.err} | deliveredAt=${dlr.deliveredAt}`
          );
          return;
        }

        if (isDefinitiveCarrierRejection(dlr)) {
          const cfg = getDltConfig();
          console.warn(
            `[DLT_CARRIER_REJECTED] +91${cleanNumbers} | MsgID=${messageId} | signOff='${usedSignOff}' | status='${msgStatus}' | stat='${stat}' | err='${dlr.err}'`
          );

          // Auto-heal once if primary sign-off ("Team Nexus") was scrubbed by carrier PE-Brand filter
          if (
            !healed &&
            cfg.autoHealSignOff &&
            cfg.fallbackSignOff &&
            usedSignOff.toLowerCase() !== cfg.fallbackSignOff.toLowerCase()
          ) {
            healed = true;
            const fallbackMsg = buildTemplateMessage(var1, otpCode, cfg.fallbackSignOff);
            const fallbackPayload = buildDltPayload(cfg, cleanNumbers, fallbackMsg);
            const retryRes = await requestGatewayGet(cfg.uri, fallbackPayload);
            if (retryRes.success) {
              console.log(
                `[DLT_AUTO_HEALED] Re-dispatched same OTP to +91${cleanNumbers} with fallback sign-off '${cfg.fallbackSignOff}' | New MsgID=${retryRes.messageId}`
              );
              recordDlrCache(messageId, {
                messageId,
                healedMessageId: retryRes.messageId,
                mobile: cleanNumbers,
                status: "queued",
                stat: "AUTO_HEALED",
                signOff: cfg.fallbackSignOff,
              });
              if (retryRes.messageId) {
                scheduleBackgroundDlrCheck({
                  messageId: retryRes.messageId,
                  cleanNumbers,
                  var1,
                  otpCode,
                  usedSignOff: cfg.fallbackSignOff,
                });
              }
              return;
            }
          }

          recordDlrCache(messageId, {
            messageId,
            mobile: cleanNumbers,
            status: "failed",
            stat: stat || "REJECTD",
            err: dlr.err || "DLT_REJECTED",
            messageStatus: msgStatus,
            signOff: usedSignOff,
          });
        } else if (idx === checkDelaysMs.length - 1) {
          console.log(
            `[DLT_CARRIER_IN_TRANSIT] +91${cleanNumbers} | MsgID=${messageId} | status='${msgStatus || "Pending"}' | stat='${stat || "SUBMITTED"}'`
          );
        }
      } catch {}
    }, delayMs);
    activeDlrTimers.add(t);
    t.unref?.();
  });
}

export const smsService = {
  _clearBackgroundTimers() {
    for (const t of activeDlrTimers) {
      clearTimeout(t);
    }
    activeDlrTimers.clear();
    dlrStatusCache.clear();
  },

  /**
   * Queries real-time Telecom Operator Delivery Report (DLR) from allsmssolution.in
   */
  async checkDeliveryReport(messageId) {
    if (!messageId) return null;
    const cfg = getDltConfig();
    const cleanId = Array.isArray(messageId) ? messageId[0] : String(messageId).trim();

    return new Promise((resolve) => {
      const q = querystring.stringify({
        username: cfg.username,
        apikey: cfg.apikey,
        apirequest: "DeliveryReport",
        messageid: cleanId,
        format: "JSON",
      });

      let settled = false;
      const finish = (val) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
      };

      try {
        const urlObj = new URL(cfg.uri);
        const { lib, agent, defaultPort } = pickTransport(urlObj);
        const req = lib.request(
          {
            hostname: urlObj.hostname,
            port: urlObj.port || defaultPort,
            path: `${urlObj.pathname}${urlObj.search ? urlObj.search + "&" : "?"}${q}`,
            method: "GET",
            agent,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; EmperorNexus/2.0)" },
          },
          (res) => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (c) => (body += c));
            res.on("end", () => {
              try {
                finish(JSON.parse(body));
              } catch {
                finish({ raw: body });
              }
            });
          }
        );
        req.setTimeout(3000, () => req.destroy(new Error("DLR timeout")));
        req.on("error", () => finish(null));
        req.end();
      } catch {
        finish(null);
      }
    });
  },

  /**
   * Returns cached or live DLR status for a dispatched messageId (safe metadata only, never OTP)
   */
  async getDeliveryStatus(messageId) {
    if (!messageId) return { status: "unknown" };
    const cached = dlrStatusCache.get(String(messageId));
    if (cached?.status === "delivered" || cached?.status === "failed") {
      return cached;
    }

    const targetId = cached?.healedMessageId || messageId;
    const live = await this.checkDeliveryReport(targetId);
    if (live && live.status !== "error") {
      const stat = String(live.stat || "").toUpperCase();
      const msgStatus = String(live.message_status || "");
      if (stat === "DELIVRD" || msgStatus.toLowerCase() === "delivered") {
        const updated = {
          messageId: String(messageId),
          status: "delivered",
          stat: stat || "DELIVRD",
          err: live.err || "000",
          deliveredAt: live.deliveredAt || null,
        };
        recordDlrCache(messageId, updated);
        return updated;
      }
      if (isDefinitiveCarrierRejection(live)) {
        const failed = {
          messageId: String(messageId),
          status: "failed",
          stat: stat || "REJECTD",
          err: live.err || "REJECTED",
          messageStatus: msgStatus,
        };
        recordDlrCache(messageId, failed);
        return failed;
      }
    }

    return cached || { messageId: String(messageId), status: "queued", stat: "SUBMITTED" };
  },

  /**
   * Dispatches TRAI DLT Compliant SMS text message to the user's mobile number.
   * Template ID: 1607100000000313742 | Sender ID: TXXTOO | PE_ID: 1401805350000060162
   * 3 Variables:
   *   1. Dear {#var#}    -> "User"
   *   2. OTP is {#var#}  -> 6-digit OTP
   *   3. Regards {#var#} -> "Team Nexus" (auto-heals to "Team Emperor" if carrier scrubber rejects)
   */
  async sendSms({ to, otp, recipientName = "User", message: fallbackMessage }) {
    const startMs = Date.now();
    const digits = (to || "").replace(/\D/g, "");
    const cleanNumbers = digits.length >= 10 ? digits.slice(-10) : digits;
    const otpCode = String(
      otp || (fallbackMessage ? fallbackMessage.match(/\b\d{6}\b/)?.[0] : "") || ""
    ).trim();

    if (!cleanNumbers || cleanNumbers.length !== 10 || !/^[6-9]\d{9}$/.test(cleanNumbers) || !otpCode) {
      console.warn(`[SMS_DISPATCH_SKIPPED] Invalid Indian mobile or OTP: ${to}`);
      return {
        success: false,
        error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      };
    }

    const cfg = getDltConfig();

    // Fast-path mock SMS handling for tests and staging mock gateway
    if (
      (process.env.NODE_ENV === "test" && process.env.ALLOW_LIVE_SMS_IN_TEST !== "true") ||
      cfg.uri.includes("mock") ||
      cfg.apikey === "MOCK_KEY_NO_CHARGES" ||
      process.env.MOCK_SMS === "true"
    ) {
      return {
        success: true,
        provider: "mock_sms_gateway",
        messageId: `mock_msg_${Date.now()}`,
        latencyMs: 1,
      };
    }
    const var1 = (recipientName || "User").trim() || "User";
    const var2 = otpCode;
    const var3 = (cfg.signOff || "Team Nexus").trim();

    const finalMessage = buildTemplateMessage(var1, var2, var3);
    const payload = buildDltPayload(cfg, cleanNumbers, finalMessage);

    // 1. Primary Fast Path: Persistent Keep-Alive HTTPS GET (~75-220ms, avoids WAF POST 403 blocks)
    let result = await requestGatewayGet(cfg.uri, payload);

    // 2. Resilient Fallback: Only retry via POST if GET failed at transport/HTTP proxy layer
    if (!result.success && !result.definitiveGatewayError) {
      console.warn(
        `[DLT_GET_WARN] Retrying via POST for +91${cleanNumbers} (${result.error || result.httpStatus})...`
      );
      result = await requestGatewayPost(cfg.uri, payload);
    }

    const latencyMs = Date.now() - startMs;

    if (result.success) {
      console.log(
        `[DLT_SMS_DISPATCHED] +91${cleanNumbers} in ${latencyMs}ms | Regards: '${var3}' | MsgID: ${result.messageId || "OK"}`
      );
      if (result.messageId) {
        scheduleBackgroundDlrCheck({
          messageId: result.messageId,
          cleanNumbers,
          var1,
          otpCode,
          usedSignOff: var3,
        });
      }
      return {
        success: true,
        provider: "dlt_allsmssolution",
        messageId: result.messageId,
        latencyMs,
      };
    }

    console.warn(
      `[DLT_SMS_FAILURE] Gateway failed for +91${cleanNumbers} in ${latencyMs}ms:`,
      result.raw || result.error
    );

    // 3. Optional Secondary Provider: Fast2SMS
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    if (fast2SmsKey && otpCode) {
      try {
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2SmsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otpCode,
            numbers: cleanNumbers,
          }),
          signal: AbortSignal.timeout(4000),
        });
        const d = await res.json();
        if (d && d.return) {
          console.log(`[Fast2SMS_SUCCESS] Dispatched to +91${cleanNumbers}`);
          return {
            success: true,
            provider: "fast2sms",
            messageId: d.request_id || null,
            latencyMs: Date.now() - startMs,
          };
        }
      } catch (err) {
        console.warn("[Fast2SMS_Error]", err.message);
      }
    }

    // Optional explicit dev-only console fallback if opted in via env
    if (process.env.ALLOW_CONSOLE_OTP_FALLBACK === "true") {
      console.log(`[SMS_CONSOLE_FALLBACK] +91${cleanNumbers} -> OTP: ${otpCode}`);
      return { success: true, provider: "console_log", latencyMs: Date.now() - startMs };
    }

    return {
      success: false,
      provider: "failed",
      latencyMs,
      error:
        result.gatewayMessage ||
        result.error ||
        "SMS gateway could not dispatch verification code. Please retry in a moment.",
    };
  },
};
