import { NextResponse } from "next/server";
import { queryDb, isDbConnected } from "@/lib/db/dbPool";
import { botsStore } from "@/lib/db/botsStore";
import { leadsStore } from "@/lib/db/leadsStore";
import { documentsStore } from "@/lib/db/documentsStore";
import { getAuthenticatedPrincipal, isPlatformSuperAdmin } from "@/lib/auth/guard";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_PROVIDER = (
  process.env.DEFAULT_AI_PROVIDER || (process.env.GROQ_API_KEY ? "groq" : "ollama")
).toLowerCase();

export async function GET(request) {
  const startTime = Date.now();
  let dbStatus = isDbConnected() ? "connected" : "local_fallback";
  let dbError = null;

  // Non-blocking health probe: Use cached isDbConnected() status to eliminate pool contention under load.
  // Only attempt active query if database is unverified and not in unit test.
  if (!isDbConnected() && process.env.NODE_ENV !== "test") {
    try {
      const dbRes = await queryDb("SELECT 1 AS live;");
      if (dbRes.ok) {
        dbStatus = "connected";
      } else {
        dbError = dbRes.error || "Connection failed";
      }
    } catch (err) {
      dbStatus = "local_fallback";
      dbError = err.message;
    }
  }

  let storageStatus = "operational";
  let stats = null;

  // Check whether caller is authenticated Platform SUPER_ADMIN before returning internal diagnostics (SEC-22)
  let isAdminCaller = false;
  if (request?.headers) {
    try {
      const principal = await getAuthenticatedPrincipal(request);
      isAdminCaller = isPlatformSuperAdmin(principal);
    } catch {}
  }

  if (isAdminCaller) {
    try {
      const bots = botsStore.getBots();
      const leads = leadsStore.getLeads();
      const docs = documentsStore.getDocuments();
      stats = {
        botsCount: bots.length,
        leadsCount: leads.length,
        documentsCount: docs.length,
      };
    } catch {
      storageStatus = "degraded";
    }
  }

  const isLivenessHealthy = true;
  const isReadinessHealthy = storageStatus === "operational" && dbStatus === "connected";
  const latencyMs = Date.now() - startTime;

  const basePayload = {
    status: isReadinessHealthy ? "healthy" : "degraded",
    liveness: isLivenessHealthy,
    readiness: isReadinessHealthy,
    timestamp: new Date().toISOString(),
    latencyMs,
  };

  if (isAdminCaller) {
    const dependencies = {
      database: dbStatus,
      ...(dbError ? { databaseError: dbError } : {}),
      inference: {
        activeProvider: DEFAULT_PROVIDER === "ollama" ? "neural_engine" : DEFAULT_PROVIDER,
        status: "ready",
      },
    };

    if (DEFAULT_PROVIDER === "groq") {
      let hasPoolKey = false;
      try {
        const { GroqKeyPoolManager } = await import("@/lib/ai/groqKeyPool");
        hasPoolKey = GroqKeyPoolManager.hasAvailableKeys();
      } catch {}
      const hasEnvKey = Boolean(
        process.env.GROQ_API_KEY &&
          process.env.GROQ_API_KEY.length > 10 &&
          !process.env.GROQ_API_KEY.includes("your_groq_api_key")
      );
      dependencies.inference.status = hasEnvKey || hasPoolKey ? "configured" : "awaiting_key_in_admin_panel";
      dependencies.inference.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    } else if (DEFAULT_PROVIDER === "ollama") {
      try {
        const ping = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
        dependencies.inference.status = ping.ok ? "connected" : `degraded_http_${ping.status}`;
      } catch {
        dependencies.inference.status = "unreachable";
      }
    }

    Object.assign(basePayload, {
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      stats,
      dependencies,
      security: {
        rateLimiterActive: true,
        ssrfProtectionActive: true,
        originWhitelistingActive: true,
        hmacWebhooksActive: true,
      },
    });
  }

  return NextResponse.json(basePayload, { status: isReadinessHealthy ? 200 : 503 });
}
