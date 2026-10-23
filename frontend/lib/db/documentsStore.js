import fs from "fs";
import path from "path";

function resolveDataFile() {
  const frontendPath = path.join(process.cwd(), "frontend", "data", "documents.json");
  if (fs.existsSync(frontendPath)) return frontendPath;
  const directPath = path.join(process.cwd(), "data", "documents.json");
  if (fs.existsSync(directPath)) return directPath;
  if (process.cwd().endsWith("frontend")) return directPath;
  return frontendPath;
}

const DATA_FILE = resolveDataFile();

// Helper to chunk text
function chunkDocumentText(text, chunkSize = 450, overlap = 60) {
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
function scoreChunkRelevance(query, chunk) {
  if (!query || !chunk) return 0;
  // Keep meaningful tokens like 'mr', 'dr', 'ai', 'qa', but filter out generic stop words
  const qWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  if (qWords.length === 0) return 0;

  const cLower = chunk.toLowerCase();
  let score = 0;

  for (const word of qWords) {
    if (cLower.includes(word)) {
      score += 2.0;
      // Bonus for exact word boundaries
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(cLower)) {
        score += 2.0;
      }
    }

    // Check synonyms
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

function deleteDocFromDbAsync(docId) {
  (async () => {
    try {
      const { queryDb } = await import("./dbPool.js");
      await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [docId]);
      await queryDb('DELETE FROM "KnowledgeDocument" WHERE "id" = $1;', [docId]);
    } catch (e) {}
  })();
}

let memoryDocsCache = null;

function loadDocumentsFromDisk() {
  if (memoryDocsCache !== null) {
    return memoryDocsCache;
  }
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
      memoryDocsCache = [];
      return memoryDocsCache;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
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
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving documents store:", e);
  }
}

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

  getDocumentById(docId) {
    const all = loadDocumentsFromDisk();
    return all.find((d) => d.id === docId) || null;
  },

  /**
   * Internal processor for durable document chunking and vector indexing.
   * Truthfully marks documents as 'Processing', 'Ready', or 'Failed'.
   * Prevents duplicate chunks by clearing previous chunks for the document before insertion.
   */
  async processDocument(doc) {
    let queryDb = null;
    let generateEmbedding = null;

    try {
      const dbModule = await import("./dbPool.js");
      queryDb = dbModule.queryDb;
    } catch (e) {}

    try {
      const crawlerModule = await import("../crawler/engine.js");
      generateEmbedding = crawlerModule.generateEmbedding;
    } catch (e) {}

    const docSize = doc.content ? doc.content.length : 0;
    const chunksCount = Array.isArray(doc.chunks) ? doc.chunks.length : 0;
    const orgId = doc.organizationId || null;

    try {
      if (queryDb) {
        // Step 1: Mark as Processing in PostgreSQL (if DB available)
        const dbRes = await queryDb(
          `INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, 'Processing', $7, NOW(), NOW())
           ON CONFLICT ("id") DO UPDATE SET
             "name" = EXCLUDED."name",
             "type" = EXCLUDED."type",
             "status" = 'Processing',
             "sizeBytes" = EXCLUDED."sizeBytes",
             "chunksCount" = EXCLUDED."chunksCount",
             "updatedAt" = NOW();`,
          [doc.id, orgId, doc.botId, doc.name, doc.type || "Document", docSize, chunksCount]
        );

        if (dbRes.ok) {
          // Step 2: Delete old chunks to avoid duplicate chunks on retries
          await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc.id]);

          // Step 3: Embed & persist chunks
          if (Array.isArray(doc.chunks) && doc.chunks.length > 0) {
            for (let i = 0; i < doc.chunks.length; i++) {
              const chunkText = doc.chunks[i];
              const chunkId = `chk_${doc.id}_${i}`;
              let embeddingVec = null;

              if (generateEmbedding) {
                try {
                  embeddingVec = await generateEmbedding(chunkText);
                } catch (embErr) {
                  throw new Error(`Embedding generation failed for chunk ${i}: ${embErr.message}`);
                }
              }

              if (embeddingVec && Array.isArray(embeddingVec) && embeddingVec.length > 0) {
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
              } else {
                const chunkInsert = await queryDb(
                  `INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
                   VALUES ($1, $2, $3, $4, $5, $6, NOW())
                   ON CONFLICT ("id") DO UPDATE SET
                     "content" = EXCLUDED."content";`,
                  [chunkId, doc.id, orgId, doc.botId, i, chunkText]
                );
                if (!chunkInsert.ok) {
                  throw new Error(`Chunk persistence failed for chunk ${i}: ${chunkInsert.error}`);
                }
              }
            }
          }

          // Step 4: Mark Ready in PostgreSQL
          await queryDb(
            `UPDATE "KnowledgeDocument" SET "status" = 'Ready', "updatedAt" = NOW() WHERE "id" = $1;`,
            [doc.id]
          );
        }
      }

      // Mark Ready in disk store
      const readyDoc = updateDocStatusInDisk(doc.id, "Ready", null);
      return readyDoc || { ...doc, status: "Ready", errorMessage: null };
    } catch (err) {
      if (queryDb) {
        try {
          await queryDb(
            `UPDATE "KnowledgeDocument" SET "status" = 'Failed', "updatedAt" = NOW() WHERE "id" = $1;`,
            [doc.id]
          );
        } catch (e) {}
      }
      const failedDoc = updateDocStatusInDisk(doc.id, "Failed", err.message);
      return failedDoc || { ...doc, status: "Failed", errorMessage: err.message };
    }
  },

  addDocument({ id, botId, organizationId, name, content, type = "Document" }) {
    const all = loadDocumentsFromDisk();
    const docId = id || `doc_${Date.now()}`;
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
    this.processDocument(doc).catch((e) => {});
    return doc;
  },

  async addDocumentAsync(payload) {
    const doc = this.addDocument(payload);
    const processed = await this.processDocument(doc);
    return processed || doc;
  },

  async retryDocument(docId, organizationId = null) {
    const all = loadDocumentsFromDisk();
    const doc = all.find((d) => d.id === docId);
    if (!doc) {
      return { ok: false, error: "Document not found" };
    }
    if (organizationId && doc.organizationId && doc.organizationId !== organizationId) {
      return { ok: false, error: "Unauthorized" };
    }

    updateDocStatusInDisk(docId, "Processing", null);
    doc.status = "Processing";
    doc.errorMessage = null;

    const result = await this.processDocument(doc);
    return { ok: result.status === "Ready", document: result };
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
    this.processDocument(updated).catch((e) => {});
    return updated;
  },

  deleteDocument(docId) {
    const all = loadDocumentsFromDisk();
    const filtered = all.filter((d) => d.id !== docId);
    saveDocumentsToDisk(filtered);
    deleteDocFromDbAsync(docId);
    return true;
  },

  async reconcileDocumentsStore(organizationId = null) {
    const all = loadDocumentsFromDisk();
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

  searchDocuments(botId, query, topK = 4) {
    const cleanQ = (query || "").trim().toLowerCase();
    // Do not return document sources for pure greetings or small talk
    if (/^(hi+|hello+|hey+|hola|namaste|greetings|good\s*(morning|afternoon|evening|day))[\s!.,?]*$/i.test(cleanQ)) {
      return [];
    }

    const all = loadDocumentsFromDisk();
    // Filter docs strictly relevant to this bot AND exclude Failed docs
    const relevantDocs = all.filter((d) => {
      if (!botId || d.botId !== botId) return false;
      if (d.status === "Failed") return false;
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

    // Return scored chunks that matched the query
    if (scoredChunks.length > 0) {
      return scoredChunks.slice(0, topK);
    }

    return [];
  },
};
