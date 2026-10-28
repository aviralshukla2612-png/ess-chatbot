/**
 * Observability & Telemetry Module for Document & Knowledge Persistence
 * Tracks real operational signals without logging sensitive customer content or credentials.
 */

import { queryDb, isPostgresAuthoritative } from "../db/dbPool.js";

class PersistenceMetricsTracker {
  constructor() {
    this.counters = {
      documentsQueued: 0,
      documentsProcessing: 0,
      documentsReady: 0,
      documentsFailed: 0,
      chunksPersisted: 0,
      embeddingFailures: 0,
      persistenceFailures: 0,
      retryAttempts: 0,
      retrievalQueries: 0,
      retrievalPostgresHits: 0,
      retrievalFallbackHits: 0,
    };
    this.timings = {
      recentDurationsMs: [],
    };
  }

  recordDocumentQueued() {
    this.counters.documentsQueued++;
  }

  recordDocumentProcessing() {
    this.counters.documentsProcessing++;
  }

  recordDocumentReady(chunksCount, durationMs = 0) {
    this.counters.documentsReady++;
    this.counters.chunksPersisted += chunksCount || 0;
    if (durationMs > 0) {
      this.timings.recentDurationsMs.push(durationMs);
      if (this.timings.recentDurationsMs.length > 50) {
        this.timings.recentDurationsMs.shift();
      }
    }
  }

  recordDocumentFailed(reason = "") {
    this.counters.documentsFailed++;
    this.counters.persistenceFailures++;
  }

  recordEmbeddingFailure() {
    this.counters.embeddingFailures++;
  }

  recordRetryAttempt() {
    this.counters.retryAttempts++;
  }

  recordRetrieval(source = "postgres", resultsCount = 0) {
    this.counters.retrievalQueries++;
    if (source === "postgres") {
      this.counters.retrievalPostgresHits++;
    } else {
      this.counters.retrievalFallbackHits++;
    }
  }

  getSnapshot() {
    const durations = this.timings.recentDurationsMs;
    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    return {
      ...this.counters,
      avgProcessingDurationMs: avgDurationMs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Queries real PostgreSQL database state rather than memory fallback
   */
  async getAuthoritativeDbMetrics() {
    try {
      const docStatsRes = await queryDb(`
        SELECT 
          COUNT(*)::int AS total_docs,
          COUNT(*) FILTER (WHERE "status" = 'Ready')::int AS ready_docs,
          COUNT(*) FILTER (WHERE "status" = 'Failed')::int AS failed_docs,
          COUNT(*) FILTER (WHERE "status" = 'Processing')::int AS processing_docs,
          COALESCE(SUM("chunksCount"), 0)::int AS reported_chunks
        FROM "KnowledgeDocument";
      `);

      const chunkStatsRes = await queryDb(`
        SELECT 
          COUNT(*)::int AS total_chunks,
          COUNT(*) FILTER (WHERE "embedding" IS NOT NULL)::int AS embedded_chunks,
          COUNT(DISTINCT "botId")::int AS distinct_bots,
          COUNT(DISTINCT "organizationId")::int AS distinct_orgs
        FROM "KnowledgeChunk";
      `);

      if (docStatsRes.ok && chunkStatsRes.ok) {
        return {
          ok: true,
          source: "postgresql",
          documents: docStatsRes.rows[0],
          chunks: chunkStatsRes.rows[0],
          inMemoryCounters: this.getSnapshot(),
        };
      }
      return {
        ok: false,
        source: "memory_fallback",
        error: docStatsRes.error || chunkStatsRes.error,
        inMemoryCounters: this.getSnapshot(),
      };
    } catch (err) {
      return {
        ok: false,
        source: "memory_fallback",
        error: err.message,
        inMemoryCounters: this.getSnapshot(),
      };
    }
  }
}

export const persistenceMetrics = new PersistenceMetricsTracker();
