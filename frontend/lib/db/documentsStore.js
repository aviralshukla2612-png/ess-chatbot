import fs from "fs";
import path from "path";
import { queryDb, isPostgresAuthoritative, isPostgresConfigured } from "./dbPool.js";
import { persistenceMetrics } from "../observability/persistenceMetrics.js";
import { getDataFilePath } from "./dataDir.js";
import { botsStore } from "./botsStore.js";

// Helper to chunk text
export function chunkDocumentText(text, chunkSize = 450, overlap = 60) {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if ((current + "\n\n" + trimmed).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + "\n\n" + trimmed;
    } else {
      current = current ? current + "\n\n" + trimmed : trimmed;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  // Fallback if no paragraph breaks
  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize).trim());
    }
  }

  return chunks;
}

// Keyword synonyms to ensure robust RAG retrieval across phrasing variations
const KEYWORD_SYNONYMS = {
  founder: ["founder", "founder's", "founders", "owner", "owner's", "creator", "started", "leadership", "ceo", "heet", "sir"],
  owner: ["owner", "owner's", "founder", "founder's", "creator", "leadership", "heet"],
  heet: ["heet", "founder", "owner", "leadership"],
  price: ["price", "prices", "pricing", "cost", "costs", "rate", "rates"],
  warranty: ["warranty", "guarantee", "warranties"],
  return: ["return", "returns", "refund", "refunds", "exchange", "exchanges"],
  shipping: ["shipping", "delivery", "dispatch", "courier"],
  contact: ["contact", "phone", "email", "whatsapp", "address", "location"],
};

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "you", "who", "what", "is", "was", "were", "be", "been", "being",
  "in", "on", "at", "to", "of", "by", "with", "from", "about", "into", "through", "after", "before",
  "this", "that", "these", "those", "it", "its", "they", "them", "their",
  "can", "could", "would", "should", "do", "does", "did", "have", "has", "had",
  "how", "why", "when", "where", "which", "your", "our", "my", "me", "tell", "please", "know"
]);

// Resilient keyword relevance score with boundary matching and synonyms
export function scoreChunkRelevance(query, chunk) {
  if (!query || !chunk) return 0;
  const qWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  if (qWords.length === 0) return 0;

  const cLower = chunk.toLowerCase();
  let score = 0;

  for (const word of qWords) {
    if (cLower.includes(word)) {
      score += 2.0;
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(cLower)) {
        score += 2.0;
      }
    }

    const syns = KEYWORD_SYNONYMS[word] || [];
    for (const syn of syns) {
      if (syn !== word && cLower.includes(syn)) {
        score += 1.5;
        const sRegex = new RegExp(`\\b${syn}\\b`, "i");
        if (sRegex.test(cLower)) {
          score += 1.0;
        }
      }
    }
  }

  return score;
}

let memoryDocsCache = null;

function loadDocumentsFromDisk() {
  if (memoryDocsCache !== null) {
    return memoryDocsCache;
  }
  const dataFile = getDataFilePath("documents.json");
  try {
    if (!fs.existsSync(dataFile)) {
      const dir = path.dirname(dataFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify([], null, 2), "utf8");
      memoryDocsCache = [];
      return memoryDocsCache;
    }
    const raw = fs.readFileSync(dataFile, "utf8");
    memoryDocsCache = JSON.parse(raw);
    return memoryDocsCache;
  } catch (e) {
    console.error("Error reading documents store:", e);
    memoryDocsCache = memoryDocsCache || [];
    return memoryDocsCache;
  }
}

function saveDocumentsToDisk(docs) {
  memoryDocsCache = docs;
  const dataFile = getDataFilePath("documents.json");
  try {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${dataFile}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(docs, null, 2), "utf8");
    try {
      fs.renameSync(tempFile, dataFile);
    } catch {
      fs.copyFileSync(tempFile, dataFile);
      try { fs.unlinkSync(tempFile); } catch {}
    }
  } catch (e) {
    console.error("Error saving documents store:", e);
  }
}

function updateDocStatusInDisk(docId, status, errorMessage = null) {
  const all = loadDocumentsFromDisk();
  const idx = all.findIndex((d) => d.id === docId);
  if (idx >= 0) {
    all[idx].status = status;
    all[idx].errorMessage = errorMessage || null;
    all[idx].updatedAt = new Date().toISOString();
    saveDocumentsToDisk(all);
    return all[idx];
  }
  return null;
}

const inFlightDocProcessing = new Map();

export const documentsStore = {
  _resetMemoryStore() {
    memoryDocsCache = null;
  },

  getDocuments(botId, organizationId = null) {
    const all = loadDocumentsFromDisk();
    return all.filter((d) => {
      if (botId && d.botId !== botId) return false;
      if (organizationId && d.organizationId && d.organizationId !== organizationId) return false;
      return true;
    });
  },

  async getDocumentsAsync(botId, organizationId = null) {
    let sql = 'SELECT * FROM "KnowledgeDocument" WHERE 1=1';
    const params = [];
    if (botId) {
      params.push(botId);
      sql += ` AND "botId" = $${params.length}`;
    }
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND "organizationId" = $${params.length}`;
    }
    sql += ' ORDER BY "createdAt" DESC;';

    const dbRes = await queryDb(sql, params);
    if (dbRes.ok) {
      return dbRes.rows.map((r) => ({
        id: r.id,
        botId: r.botId,
        organizationId: r.organizationId,
        name: r.name,
        type: r.type,
        sizeBytes: r.sizeBytes,
        status: r.status,
        chunksCount: r.chunksCount,
        errorMessage: r.errorMessage || null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
      }));
    }

    if (isPostgresAuthoritative()) {
      throw new Error(`[PERSISTENCE_ERROR] PostgreSQL document query failed: ${dbRes.error}`);
    }

    return this.getDocuments(botId, organizationId);
  },

  getDocumentById(docId) {
    const all = loadDocumentsFromDisk();
    return all.find((d) => d.id === docId) || null;
  },

  async getDocumentByIdAsync(docId) {
    const dbRes = await queryDb('SELECT * FROM "KnowledgeDocument" WHERE "id" = $1;', [docId]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      const r = dbRes.rows[0];
      const content = r.content || "";
      const chunks = chunkDocumentText(content);
      return {
        id: r.id,
        botId: r.botId,
        organizationId: r.organizationId,
        name: r.name,
        type: r.type,
        sizeBytes: r.sizeBytes,
        status: r.status,
        chunksCount: r.chunksCount !== undefined && r.chunksCount !== null ? r.chunksCount : chunks.length,
        errorMessage: r.errorMessage || null,
        content: content,
        chunks: chunks,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
      };
    }

    if (isPostgresAuthoritative() && !dbRes.ok) {
      throw new Error(`[PERSISTENCE_ERROR] PostgreSQL getDocumentById failed: ${dbRes.error}`);
    }

    return this.getDocumentById(docId);
  },

  /**
   * Authoritative document processing state machine:
   * State flow: Pending -> Processing -> Ready (only upon full chunk & vector verification) or Failed.
   * Eliminates dual-persistence divergence: PostgreSQL writes are authoritative and strictly awaited.
   * Concurrency-safe: Coalesces concurrent operations on the same document to prevent race conditions.
   */
  async processDocument(doc) {
    if (!doc || !doc.id) return doc;

    if (inFlightDocProcessing.has(doc.id)) {
      return await inFlightDocProcessing.get(doc.id);
    }

    const task = (async () => {
      try {
        return await this._executeProcessDocument(doc);
      } finally {
        inFlightDocProcessing.delete(doc.id);
      }
    })();

    inFlightDocProcessing.set(doc.id, task);
    return await task;
  },

  async _executeProcessDocument(doc) {
    const isAuthoritative = isPostgresAuthoritative();
    let generateEmbedding = null;

    try {
      const crawlerModule = await import("../crawler/engine.js");
      generateEmbedding = crawlerModule.generateEmbedding;
    } catch (e) {}

    const docSize = doc.content ? doc.content.length : 0;
    const chunks = Array.isArray(doc.chunks) && doc.chunks.length > 0
      ? doc.chunks
      : chunkDocumentText(doc.content);
    const chunksCount = chunks.length;
    const orgId = doc.organizationId || null;
    const startTime = Date.now();
    persistenceMetrics.recordDocumentProcessing();

    // Fast-fail in authoritative production mode if database pool is unavailable
    const poolRes = await queryDb("SELECT 1;");
    const isDbActive = poolRes.ok;

    if (isAuthoritative && !isDbActive) {
      const errMsg = "PostgreSQL authoritative store unavailable: Cannot process or persist document.";
      persistenceMetrics.recordDocumentFailed(errMsg);
      updateDocStatusInDisk(doc.id, "Failed", errMsg);
      return { ...doc, status: "Failed", errorMessage: errMsg };
    }

    try {
      if (isDbActive) {
        // Step 1: Verify tenant foreign key constraints (Bot must exist in "Bot" table)
        if (doc.botId) {
          const botCheck = await queryDb('SELECT "id", "organizationId" FROM "Bot" WHERE "id" = $1;', [doc.botId]);
          if (!botCheck.ok || botCheck.rows.length === 0) {
            throw new Error(`Referenced bot '${doc.botId}' does not exist in PostgreSQL`);
          }
          if (orgId && botCheck.rows[0].organizationId !== orgId) {
            throw new Error(`Tenant boundary violation: bot '${doc.botId}' belongs to '${botCheck.rows[0].organizationId}', not '${orgId}'`);
          }
        }

        // Step 2: Mark as Processing in PostgreSQL
        const insertDocRes = await queryDb(
          `INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "errorMessage", "content", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, 'Processing', $7, NULL, $8, NOW(), NOW())
           ON CONFLICT ("id") DO UPDATE SET
             "name" = EXCLUDED."name",
             "type" = EXCLUDED."type",
             "status" = 'Processing',
             "sizeBytes" = EXCLUDED."sizeBytes",
             "chunksCount" = EXCLUDED."chunksCount",
             "errorMessage" = NULL,
             "content" = EXCLUDED."content",
             "updatedAt" = NOW();`,
          [doc.id, orgId, doc.botId, doc.name, doc.type || "Document", docSize, chunksCount, doc.content || ""]
        );

        if (!insertDocRes.ok) {
          throw new Error(`Document metadata persistence failed: ${insertDocRes.error}`);
        }

        // Step 3: Delete old chunks to ensure idempotency on retries
        await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc.id]);

        // Step 4: Embed & persist each chunk with verified 768-dimensional vector
        if (chunksCount > 0) {
          for (let i = 0; i < chunksCount; i++) {
            const chunkText = chunks[i];
            const chunkId = `chk_${doc.id}_${i}`;
            let embeddingVec = null;

            if (generateEmbedding) {
              try {
                embeddingVec = await generateEmbedding(chunkText);
              } catch (embErr) {
                throw new Error(`Embedding generation failed for chunk ${i}: ${embErr.message}`);
              }
            }

            if (!embeddingVec || !Array.isArray(embeddingVec) || embeddingVec.length !== 768) {
              throw new Error(
                `Embedding dimension mismatch: expected 768, got ${Array.isArray(embeddingVec) ? embeddingVec.length : typeof embeddingVec}`
              );
            }

            const vectorStr = `[${embeddingVec.join(",")}]`;
            const chunkInsert = await queryDb(
              `INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "embedding", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())
               ON CONFLICT ("id") DO UPDATE SET
                 "content" = EXCLUDED."content",
                 "embedding" = EXCLUDED."embedding";`,
              [chunkId, doc.id, orgId, doc.botId, i, chunkText, vectorStr]
            );

            if (!chunkInsert.ok) {
              throw new Error(`Chunk persistence failed for chunk ${i}: ${chunkInsert.error}`);
            }
          }
        }

        // Step 5: Verify all chunks and embeddings are persisted in PostgreSQL
        const verifyRes = await queryDb(
          `SELECT count(*)::int AS count FROM "KnowledgeChunk" WHERE "documentId" = $1 AND "embedding" IS NOT NULL;`,
          [doc.id]
        );
        const verifiedCount = verifyRes.ok && verifyRes.rows[0] ? Number(verifyRes.rows[0].count) : 0;
        if (verifiedCount !== chunksCount) {
          throw new Error(`Chunk verification count mismatch: expected ${chunksCount}, found ${verifiedCount}`);
        }

        // Step 6: Mark Ready in PostgreSQL
        const readyUpdate = await queryDb(
          `UPDATE "KnowledgeDocument" SET "status" = 'Ready', "errorMessage" = NULL, "chunksCount" = $1, "updatedAt" = NOW() WHERE "id" = $2;`,
          [chunksCount, doc.id]
        );
        if (!readyUpdate.ok) {
          throw new Error(`Failed to update status to Ready in PostgreSQL: ${readyUpdate.error}`);
        }
      }

      // Mark Ready in test/local disk store
      const readyDoc = updateDocStatusInDisk(doc.id, "Ready", null);
      persistenceMetrics.recordDocumentReady(chunksCount, Date.now() - startTime);
      return readyDoc || { ...doc, chunks, chunksCount, status: "Ready", errorMessage: null };
    } catch (err) {
      const sanitizedError = (err.message || "Unknown error").replace(/password=[^@\s]+/gi, "password=***");
      persistenceMetrics.recordDocumentFailed(sanitizedError);
      if (isDbActive) {
        try {
          await queryDb(
            `UPDATE "KnowledgeDocument" SET "status" = 'Failed', "errorMessage" = $1, "updatedAt" = NOW() WHERE "id" = $2;`,
            [sanitizedError.slice(0, 500), doc.id]
          );
          // Clean up partial chunks to prevent orphan or stale vector chunks
          await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc.id]);
        } catch (e) {}
      }

      const failedDoc = updateDocStatusInDisk(doc.id, "Failed", sanitizedError);
      return failedDoc || { ...doc, chunks, chunksCount, status: "Failed", errorMessage: sanitizedError };
    }
  },

  addDocument({ id, botId, organizationId, name, content, type = "Document" }) {
    const all = loadDocumentsFromDisk();
    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const chunks = chunkDocumentText(content);

    const doc = {
      id: docId,
      botId: botId || null,
      organizationId: organizationId || null,
      name: name || "Untitled Document",
      type: type || "Document",
      content: content || "",
      chunks,
      chunksCount: chunks.length,
      status: "Processing",
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = all.findIndex((d) => d.id === docId);
    if (existingIdx >= 0) {
      all[existingIdx] = doc;
    } else {
      all.unshift(doc);
    }
    saveDocumentsToDisk(all);

    // If running in asynchronous/real environment, trigger processing
    this.processDocument(doc).catch((err) => {
      console.warn(`[DOC_PROCESS_WARN] ${docId}: ${err.message}`);
    });
    return doc;
  },

  async addDocumentAsync(payload) {
    const docId = payload.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const chunks = chunkDocumentText(payload.content);

    const doc = {
      id: docId,
      botId: payload.botId || null,
      organizationId: payload.organizationId || null,
      name: payload.name || "Untitled Document",
      type: payload.type || "Document",
      content: payload.content || "",
      chunks,
      chunksCount: chunks.length,
      status: "Processing",
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Keep test store in sync
    const all = loadDocumentsFromDisk();
    const existingIdx = all.findIndex((d) => d.id === docId);
    if (existingIdx >= 0) all[existingIdx] = doc;
    else all.unshift(doc);
    saveDocumentsToDisk(all);

    const processed = await this.processDocument(doc);
    return processed || doc;
  },

  async retryDocument(docId, organizationId = null) {
    const doc = await this.getDocumentByIdAsync(docId);
    if (!doc) {
      return { ok: false, error: "Document not found" };
    }
    if (organizationId && doc.organizationId && doc.organizationId !== organizationId) {
      return { ok: false, error: "Unauthorized" };
    }

    persistenceMetrics.recordRetryAttempt();
    updateDocStatusInDisk(docId, "Processing", null);
    doc.status = "Processing";
    doc.errorMessage = null;
    if (!doc.chunks || doc.chunks.length === 0) {
      doc.chunks = chunkDocumentText(doc.content);
      doc.chunksCount = doc.chunks.length;
    }

    const result = await this.processDocument(doc);
    return {
      ok: result.status === "Ready",
      document: result,
      error: result.status === "Ready" ? null : result.errorMessage,
    };
  },

  updateDocument(docId, { name, content, type }) {
    const all = loadDocumentsFromDisk();
    const idx = all.findIndex((d) => d.id === docId);
    if (idx === -1) return null;
    const existing = all[idx];
    const newContent = content !== undefined ? content : existing.content;
    const newChunks = chunkDocumentText(newContent);
    const updated = {
      ...existing,
      name: name !== undefined && name.trim() ? name.trim() : existing.name,
      content: newContent,
      type: type !== undefined ? type : existing.type,
      chunks: newChunks,
      chunksCount: newChunks.length,
      status: "Processing",
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    saveDocumentsToDisk(all);
    this.processDocument(updated).catch(() => {});
    return updated;
  },

  async updateDocumentAsync(docId, { name, content, type }) {
    const existing = await this.getDocumentByIdAsync(docId);
    if (!existing) return null;
    const newContent = content !== undefined ? content : existing.content;
    const newChunks = chunkDocumentText(newContent);
    const updated = {
      ...existing,
      name: name !== undefined && name.trim() ? name.trim() : existing.name,
      content: newContent,
      type: type !== undefined ? type : existing.type,
      chunks: newChunks,
      chunksCount: newChunks.length,
      status: "Processing",
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    };

    const all = loadDocumentsFromDisk();
    const idx = all.findIndex((d) => d.id === docId);
    if (idx >= 0) all[idx] = updated;
    saveDocumentsToDisk(all);

    const processed = await this.processDocument(updated);
    return processed || updated;
  },

  deleteDocument(docId) {
    const all = loadDocumentsFromDisk();
    const filtered = all.filter((d) => d.id !== docId);
    saveDocumentsToDisk(filtered);
    (async () => {
      try {
        await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [docId]);
        await queryDb('DELETE FROM "KnowledgeDocument" WHERE "id" = $1;', [docId]);
      } catch (e) {}
    })();
    return true;
  },

  async deleteDocumentAsync(docId) {
    const chunkDel = await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [docId]);
    const docDel = await queryDb('DELETE FROM "KnowledgeDocument" WHERE "id" = $1;', [docId]);

    const all = loadDocumentsFromDisk();
    const filtered = all.filter((d) => d.id !== docId);
    saveDocumentsToDisk(filtered);

    if (isPostgresAuthoritative() && (!chunkDel.ok || !docDel.ok)) {
      throw new Error(`[PERSISTENCE_ERROR] Deletion failed in PostgreSQL: ${docDel.error || chunkDel.error}`);
    }
    return true;
  },

  async reconcileDocumentsStore(organizationId = null) {
    const all = await this.getDocumentsAsync(null, organizationId);
    const reconciled = [];
    for (const doc of all) {
      if (organizationId && doc.organizationId && doc.organizationId !== organizationId) {
        continue;
      }
      if (!doc.status || doc.status === "Processing" || doc.status === "Failed") {
        const result = await this.processDocument(doc);
        reconciled.push(result);
      } else {
        reconciled.push(doc);
      }
    }
    return reconciled;
  },

  searchDocuments(botId, query, topK = 4, organizationId = null) {
    if (!botId || !query) return [];
    const cleanQ = (query || "").trim().toLowerCase();
    if (/^(hi+|hello+|hey+|hola|namaste|greetings|good\s*(morning|afternoon|evening|day))[\s!.,?]*$/i.test(cleanQ)) {
      return [];
    }

    let effectiveOrgId = organizationId || null;
    let bot = null;
    try {
      bot = botsStore.getBot(botId);
    } catch (e) {}

    // Cross-tenant verification:
    // If caller provided an organizationId, but bot belongs to a different organization:
    if (organizationId && bot && bot.organizationId && bot.organizationId !== organizationId) {
      return [];
    }

    if (!effectiveOrgId && bot?.organizationId) {
      effectiveOrgId = bot.organizationId;
    }

    // Fail closed if tenant boundary cannot be resolved
    if (!effectiveOrgId) {
      return [];
    }

    const all = loadDocumentsFromDisk();
    const relevantDocs = all.filter((d) => {
      if (!botId || d.botId !== botId) return false;
      if (d.status === "Failed") return false;
      // Strict organization match: require exact organizationId match
      // Unassigned/missing/mismatched documents are strictly excluded
      if (!d.organizationId || d.organizationId !== effectiveOrgId) {
        return false;
      }
      return true;
    });

    const scoredChunks = [];

    for (const doc of relevantDocs) {
      if (Array.isArray(doc.chunks)) {
        for (const chunk of doc.chunks) {
          const score = scoreChunkRelevance(query, chunk);
          if (score > 0) {
            scoredChunks.push({
              pageTitle: doc.name,
              pageUrl: doc.name,
              content: chunk,
              score,
            });
          }
        }
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.length > 0 ? scoredChunks.slice(0, topK) : [];
  },

  async searchDocumentsAsync(botId, query, topK = 4, organizationId = null) {
    if (!botId || !query) return [];

    let effectiveOrgId = organizationId || null;
    let bot = null;
    try {
      bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    } catch (e) {}

    // Verify cross-tenant mismatch
    if (organizationId && bot && bot.organizationId && bot.organizationId !== organizationId) {
      return [];
    }

    if (!effectiveOrgId && bot?.organizationId) {
      effectiveOrgId = bot.organizationId;
    }

    // Fail closed if tenant boundary cannot be established
    if (!effectiveOrgId) {
      return [];
    }

    let generateEmbedding = null;
    try {
      const crawlerModule = await import("../crawler/engine.js");
      generateEmbedding = crawlerModule.generateEmbedding;
    } catch (e) {}

    if (generateEmbedding) {
      try {
        const queryVec = await generateEmbedding(query);
        if (queryVec && Array.isArray(queryVec) && queryVec.length === 768) {
          const vectorStr = `[${queryVec.join(",")}]`;
          const res = await queryDb(
            `SELECT c."id", c."botId", c."organizationId", c."content", c."sourceUrl", c."pageTitle",
                    (1 - (c."embedding" <=> $1::vector)) AS score
             FROM "KnowledgeChunk" c
             INNER JOIN "KnowledgeDocument" d ON c."documentId" = d."id"
             WHERE c."botId" = $2 AND c."organizationId" = $3 AND c."embedding" IS NOT NULL
               AND (d."status" IS NULL OR d."status" = 'Ready')
             ORDER BY c."embedding" <=> $1::vector ASC
             LIMIT $4;`,
            [vectorStr, botId, effectiveOrgId, topK]
          );
          if (res.ok && Array.isArray(res.rows)) {
            return res.rows.map((r) => ({
              pageTitle: r.pageTitle || r.sourceUrl || "Document Source",
              pageUrl: r.sourceUrl || "document",
              content: r.content,
              score: Number(r.score) || 0,
            }));
          }
        }
      } catch (err) {
        if (isPostgresAuthoritative()) {
          throw err;
        }
      }
    }
    return this.searchDocuments(botId, query, topK, effectiveOrgId);
  },
};
