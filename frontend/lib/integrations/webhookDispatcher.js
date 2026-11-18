/**
 * Production Webhook Dispatcher with HMAC SHA-256 Signatures, SSRF Guard, and Exponential Backoff Retries
 */

import crypto from "node:crypto";
import { validateUrlForSSRF } from "../security/ssrf.js";

export class WebhookDispatcher {
  /**
   * Signs a payload with HMAC SHA-256
   */
  static signPayload(payloadString, secret) {
    if (!secret) return "";
    return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
  }

  /**
   * Dispatches a webhook asynchronously with SSRF protection, retry, and idempotency
   */
  static async dispatch({
    url,
    secret = "",
    event = "lead_captured",
    payload = {},
    maxRetries = 3,
  }) {
    if (!url || typeof url !== "string" || !url.trim()) {
      return { success: false, error: "Invalid webhook URL." };
    }

    const ssrfCheck = await validateUrlForSSRF(url.trim());
    if (!ssrfCheck.valid) {
      return { success: false, error: `Invalid webhook URL: ${ssrfCheck.error}` };
    }

    const payloadString = JSON.stringify({
      id: `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const signature = WebhookDispatcher.signPayload(payloadString, secret);
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "NexusAI-Webhook-Dispatcher/1.0",
      "X-Event-Type": event,
      "X-Idempotency-Key": `idemp_${Date.now()}`,
    };

    if (signature) {
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const res = await fetch(ssrfCheck.normalizedUrl, {
          method: "POST",
          headers,
          body: payloadString,
          redirect: "error", // Prevent HTTP 30x redirect SSRF to internal networks
          signal: AbortSignal.timeout(7000),
        });

        if (res.ok) {
          return {
            success: true,
            statusCode: res.status,
            attemptCount: attempt,
          };
        } else if (res.status >= 400 && res.status < 500) {
          return {
            success: false,
            statusCode: res.status,
            error: `Client error HTTP ${res.status}`,
            attemptCount: attempt,
          };
        } else {
          lastError = new Error(`Server returned HTTP ${res.status}`);
        }
      } catch (err) {
        lastError = err;
      }

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 400;
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    return {
      success: false,
      error: lastError ? lastError.message : "Failed after retries",
      attemptCount: attempt,
    };
  }
}
