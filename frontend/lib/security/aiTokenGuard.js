/**
 * AI Token, Resource & Cost Protection Guard
 *
 * Capabilities:
 * 1. Conservative token estimation & cost calculation
 * 2. Pre-generation atomic token reservation
 * 3. Post-generation reconciliation with actual provider usage (prompt_tokens, completion_tokens)
 * 4. Cancellation / refund of reservations upon inference errors or network abortions
 * 5. Persistent tracking in PostgreSQL `UsageRecord` table
 */

import crypto from "crypto";
import { queryDb } from "../db/dbPool.js";

// Model Cost Table (USD per 1,000 tokens)
const MODEL_COSTS = {
  "llama-3.3-70b-versatile": { inputPer1k: 0.00059, outputPer1k: 0.00079 },
  "llama-3.1-8b-instant": { inputPer1k: 0.00005, outputPer1k: 0.00008 },
  "llama3.2:1b": { inputPer1k: 0.0, outputPer1k: 0.0 }, // Local Ollama = $0 API cost
  "gpt-4o-mini": { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  default: { inputPer1k: 0.0003, outputPer1k: 0.0006 },
};

// In-memory counter for token usage: Map<string, number>
const memoryTokenCounters = new Map();
// Active reservations map: Map<string, { organizationId: string, botId: string, reservedTokens: number, createdAt: number }>
const activeReservations = new Map();

export function getCurrentPeriodKey() {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export const aiTokenGuard = {
  /**
   * Calculate conservative token count.
   */
  estimateTokens(text = "") {
    if (!text || typeof text !== "string") return 0;
    const hasNonAscii = /[^\x00-\x7F]/.test(text);
    const divisor = hasNonAscii ? 2.4 : 3.8;
    return Math.max(1, Math.ceil(text.length / divisor));
  },

  /**
   * Estimate financial cost for a model invocation.
   */
  calculateCostUsd(modelName, promptTokens, completionTokens) {
    const rates = MODEL_COSTS[modelName] || MODEL_COSTS.default;
    const promptCost = (promptTokens / 1000) * rates.inputPer1k;
    const completionCost = (completionTokens / 1000) * rates.outputPer1k;
    return Number((promptCost + completionCost).toFixed(6));
  },

  /**
   * Pre-generation atomic reservation.
   * Ensures the workspace has not exceeded its monthly token budget.
   */
  async reserveTokenBudget({ organizationId, botId = null, estimatedTokens = 500, maxMonthlyTokens = 10000000 }) {
    if (!organizationId) {
      return { allowed: true, reservationId: null };
    }

    // Default internal workspace has unlimited budget
    if (organizationId === "org_ess_default" || organizationId === "org_default") {
      const resId = `res_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      return { allowed: true, reservationId: resId, estimatedTokens };
    }

    const periodKey = getCurrentPeriodKey();
    const periodMetricKey = `${organizationId}_tokens_total_${periodKey}`;
    const currentUsed = memoryTokenCounters.get(periodMetricKey) || 0;

    if (currentUsed + estimatedTokens > maxMonthlyTokens) {
      return {
        allowed: false,
        reason: "TOKEN_QUOTA_EXCEEDED",
        error: "This assistant has reached its monthly AI token allowance. Please contact the workspace owner or upgrade your plan.",
        currentUsed,
        maxMonthlyTokens,
      };
    }

    const reservationId = `res_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    activeReservations.set(reservationId, {
      organizationId,
      botId,
      reservedTokens: estimatedTokens,
      createdAt: Date.now(),
    });

    memoryTokenCounters.set(periodMetricKey, currentUsed + estimatedTokens);

    return {
      allowed: true,
      reservationId,
      estimatedTokens,
    };
  },

  /**
   * Post-generation reconciliation with actual provider usage tokens.
   */
  async reconcileActualTokens({
    reservationId,
    organizationId,
    botId = null,
    conversationId = null,
    modelName = "llama-3.3-70b-versatile",
    promptTokens = 0,
    completionTokens = 0,
  }) {
    const periodKey = getCurrentPeriodKey();
    const totalActual = promptTokens + completionTokens;
    const periodMetricKey = `${organizationId}_tokens_total_${periodKey}`;

    let reserved = 0;
    if (reservationId && activeReservations.has(reservationId)) {
      reserved = activeReservations.get(reservationId).reservedTokens;
      activeReservations.delete(reservationId);
    }

    // Adjust in-memory counters (difference between reserved and actual)
    const current = memoryTokenCounters.get(periodMetricKey) || 0;
    const adjusted = Math.max(0, current - reserved + totalActual);
    memoryTokenCounters.set(periodMetricKey, adjusted);

    // Persist actual usage records asynchronously in PostgreSQL
    if (organizationId && totalActual > 0) {
      const costUsd = this.calculateCostUsd(modelName, promptTokens, completionTokens);
      const recordId = `usg_tok_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

      queryDb(
        `INSERT INTO "UsageRecord" ("id", "organizationId", "botId", "conversationId", "metric", "quantity", "periodKey")
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [recordId, organizationId, botId, conversationId, "tokens_total", totalActual, periodKey]
      ).catch(() => {});
    }

    return {
      reconciled: true,
      totalActualTokens: totalActual,
      promptTokens,
      completionTokens,
    };
  },

  /**
   * Cancel reservation upon failed generation (refunds the reserved token allowance).
   */
  async cancelReservation(reservationId) {
    if (!reservationId || !activeReservations.has(reservationId)) return;
    const res = activeReservations.get(reservationId);
    activeReservations.delete(reservationId);

    const periodKey = getCurrentPeriodKey();
    const periodMetricKey = `${res.organizationId}_tokens_total_${periodKey}`;
    const current = memoryTokenCounters.get(periodMetricKey) || 0;
    memoryTokenCounters.set(periodMetricKey, Math.max(0, current - res.reservedTokens));
  },

  /**
   * Test helper: Reset memory.
   */
  _resetTokenMemory() {
    memoryTokenCounters.clear();
    activeReservations.clear();
  },
};
