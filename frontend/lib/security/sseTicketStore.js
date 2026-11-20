/**
 * Short-Lived Single-Use SSE Exchange Ticket Store
 *
 * Implements ephemeral exchange tickets (60s TTL) for widget EventSource streaming.
 * Prevents long-lived visitor credentials from appearing in URL query strings,
 * Nginx access logs, CDN logs, or browser histories.
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected } from "../redis/redisClient.js";

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

    // 1. Store in distributed Redis if connected
    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        await redis.set(`sse:tkt:${ticket}`, payload, "EX", ttlSeconds);
      } catch (err) {
        console.warn("[SSE_TICKET_REDIS_SET_WARN]", err.message);
      }
    }

    // 2. Also register in local memory fallback
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

    // 1. Try distributed Redis atomic consumption via Lua
    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const raw = await redis.eval(LUA_CONSUME_TICKET, 1, `sse:tkt:${ticket}`);
        if (raw) {
          memorySseTickets.delete(ticket); // Clean local copy
          const parsed = JSON.parse(raw);
          if (parsed.botId === botId || parsed.botId === `bot_${botId}` || botId === `bot_${parsed.botId}`) {
            return { visitorId: parsed.visitorId };
          }
          return null;
        }
      } catch (err) {
        console.warn("[SSE_TICKET_REDIS_CONSUME_WARN]", err.message);
      }
    }

    // 2. Fall back to local in-memory store
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
