// n8n Webhook Workflow Dispatcher and Callback Client
import crypto from "crypto";
import { executeWebsiteIngestion } from "@/lib/crawler/engine";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://127.0.0.1:5678/webhook/website-ingestion";
const DEV_N8N_SECRET = "nx_n8n_sec_dev_fallback_only_32chars";

function getCallbackSecret() {
  if (process.env.N8N_CALLBACK_SECRET && process.env.N8N_CALLBACK_SECRET.length >= 16) {
    return process.env.N8N_CALLBACK_SECRET;
  }
  if (process.env.NODE_ENV === "production") {
    return ""; // Fail closed in production when unconfigured
  }
  return DEV_N8N_SECRET;
}

export const n8nClient = {
  /**
   * Dispatches a crawl job to n8n workflow.
   * If n8n webhook is offline or in local mode, falls back to direct async background processor.
   */
  async triggerIngestionWorkflow({ jobId, websiteSource, botId, organizationId }) {
    const callbackSecret = getCallbackSecret();
    if (callbackSecret && process.env.N8N_WEBHOOK_URL) {
      const payload = {
        jobId,
        botId,
        organizationId,
        websiteId: websiteSource.id,
        name: websiteSource.name,
        baseUrl: websiteSource.baseUrl,
        crawlScope: websiteSource.crawlScope,
        maxPages: websiteSource.maxPages,
        includePatterns: websiteSource.includePatterns,
        excludePatterns: websiteSource.excludePatterns,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/n8n/callback`,
        timestamp: new Date().toISOString(),
      };

      try {
        const res = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Nexus-Auth": callbackSecret,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(2000),
        });

        if (res.ok) {
          return { dispatched: true, engine: "n8n" };
        }
      } catch {
        // Fallback to built-in async worker
      }
    }

    setTimeout(() => {
      executeWebsiteIngestion(jobId).catch((err) => {
        console.error("Background ingestion worker error:", err);
      });
    }, 50);

    return { dispatched: true, engine: "crawler-worker" };
  },

  /**
   * Verifies the authenticity of a callback from n8n in constant time.
   */
  verifyCallbackSecret(headerSecret) {
    const expected = getCallbackSecret();
    if (!expected || !headerSecret || typeof headerSecret !== "string") {
      return false;
    }
    const a = Buffer.from(headerSecret);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  },
};
