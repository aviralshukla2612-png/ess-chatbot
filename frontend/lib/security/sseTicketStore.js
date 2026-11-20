/**
 * Short-Lived Single-Use SSE Exchange Ticket Store
 *
 * Implements ephemeral exchange tickets (60s TTL) for widget EventSource streaming.
 * Prevents long-lived visitor credentials from appearing in URL query strings,
 * Nginx access logs, CDN logs, or browser histories.
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected, isRedisConfigured } from "../redis/redisClient.js";

const DEFAULT_TICKET_TTL_SECONDS = 60;
const memorySseTickets = new Map();

// Periodic in-memory sweeper (evicts expired tickets every 30s)
const sweepInterval = setInterval(() => {
  const now = Date.now();
  for (const [tkt, data] of memorySseTickets.entries()) {
    if (now > data.expiresAt) {
      memorySseTickets.delete(tkt);
    }
  }
}, 30000);
if (typeof sweepInterval.unref === "function") {
  sweepInterval.unref();
}

const LUA_CONSUME_TICKET = `
local val = redis.call('GET', KEYS[1])
if val then
  redis.call('DEL', KEYS[1])
  return val
else
  return nil
end
`;

export const sseTicketStore = {
  _resetMemoryStore() {
    memorySseTickets.clear();
  },

  /**
   * Generates a 60-second single-use exchange ticket bound to botId & visitorId.
   */
  async createTicket(botId, visitorId, ttlSeconds = DEFAULT_TICKET_TTL_SECONDS) {
    if (!botId || !visitorId) return null;

    const ticket = `tkt_${crypto.randomBytes(24).toString("hex")}`;
    const payload = JSON.stringify({
      botId,
      visitorId,
      createdAt: Date.now(),
    });

    // 1. Distributed Redis mode: ticket is stored exclusively in Redis
    if (isRedisConfigured()) {
      if (!isRedisConnected()) {
        console.warn("[SSE_TICKET_REDIS_OUTAGE] Cannot create ticket: Redis configured but disconnected (fail-closed)");
        return null;
      }
      const redis = getRedisClient();
      if (!redis) return null;
      try {
        await redis.set(`sse:tkt:${ticket}`, payload, "EX", ttlSeconds);
        return ticket;
      } catch (err) {
        console.warn("[SSE_TICKET_REDIS_SET_WARN]", err.message);
        return null;
      }
    }

    // 2. Single-instance development mode ONLY (Redis explicitly unconfigured)
    if (process.env.NODE_ENV === "production") {
      console.error("[SSE_TICKET_SECURITY_ERR] Local memory ticket store forbidden in production when Redis is unconfigured.");
      return null;
    }

    memorySseTickets.set(ticket, {
      botId,
      visitorId,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return ticket;
  },

  /**
   * Atomically consumes and validates an exchange ticket single-use.
   * Returns { visitorId } if valid, or null if expired, missing, or mismatched.
   */
  async consumeTicket(botId, ticket) {
    if (!ticket || typeof ticket !== "string" || !ticket.startsWith("tkt_")) {
      return null;
    }

    // Distributed Redis mode (CASE A, B, C)
    if (isRedisConfigured()) {
      // CASE B: Redis configured but disconnected -> Fail closed
      if (!isRedisConnected()) {
        console.warn("[SSE_TICKET_REDIS_OUTAGE] Rejecting ticket consumption: Redis configured but disconnected (fail-closed)");
        return null;
      }

      const redis = getRedisClient();
      if (!redis) return null;

      try {
        const raw = await redis.eval(LUA_CONSUME_TICKET, 1, `sse:tkt:${ticket}`);
        // CASE A: Redis is single source of truth. If raw is nil, ticket does not exist or was ALREADY consumed
        if (!raw) {
          return null; // Never fall through to local memory
        }
        const parsed = JSON.parse(raw);
        if (parsed.botId === botId || parsed.botId === `bot_${botId}` || botId === `bot_${parsed.botId}`) {
          return { visitorId: parsed.visitorId };
        }
        return null; // Bot mismatch
      } catch (err) {
        // CASE C: Redis command throws or times out -> Fail closed
        console.warn("[SSE_TICKET_REDIS_CONSUME_WARN]", err.message);
        return null;
      }
    }

    // CASE D: Redis explicitly unconfigured (Single-instance development ONLY)
    if (process.env.NODE_ENV === "production") {
      console.error("[SSE_TICKET_SECURITY_ERR] Local memory ticket consumption forbidden in production without Redis.");
      return null;
    }

    if (memorySseTickets.has(ticket)) {
      const entry = memorySseTickets.get(ticket);
      memorySseTickets.delete(ticket); // Single-use consumption
      if (Date.now() <= entry.expiresAt) {
        if (entry.botId === botId || entry.botId === `bot_${botId}` || botId === `bot_${entry.botId}`) {
          return { visitorId: entry.visitorId };
        }
      }
    }

    return null;
  },
};
