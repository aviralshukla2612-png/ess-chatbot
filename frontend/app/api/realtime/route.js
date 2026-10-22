import { sseBroker } from "@/lib/db/sseBroker";
import { requireAuth, ROLES } from "@/lib/auth/guard";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { principal } = auth;
  const isSuperAdmin =
    principal.platformRole === ROLES.SUPER_ADMIN ||
    principal.orgRole === ROLES.SUPER_ADMIN;

  let unsubscribe;
  let heartbeatInterval;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event scoped to user's org
      const initialPayload = JSON.stringify({
        type: "connected",
        message: "Real-time SSE event stream connected",
        organizationId: principal.organizationId,
        activeClients: sseBroker.getActiveClientsCount(principal.organizationId) + 1,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(new TextEncoder().encode(`event: message\ndata: ${initialPayload}\n\n`));

      // 2. Subscribe controller to global broker with tenant isolation metadata
      unsubscribe = sseBroker.subscribe(controller, {
        organizationId: principal.organizationId,
        isSuperAdmin,
      });

      // 3. Keep-alive heartbeat every 15s
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat ${Date.now()}\n\n`));
        } catch (e) {
          clearInterval(heartbeatInterval);
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
        }
      }, 15000);
      if (typeof heartbeatInterval.unref === "function") {
        heartbeatInterval.unref();
      }
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
