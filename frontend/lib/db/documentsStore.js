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

function syncDocToDbAsync(doc) {
  (async () => {
    try {
      const { queryDb } = await import("./dbPool.js");
      const { generateEmbedding } = await import("../crawler/engine.js");
      const docSize = doc.content ? doc.content.length : 0;
      const chunksCount = Array.isArray(doc.chunks) ? doc.chunks.length : 0;
      const orgId = doc.organizationId || "org_default";

      await queryDb(
        `INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'Ready', $7, NOW(), NOW())
         ON CONFLICT ("id") DO UPDATE SET
           "name" = EXCLUDED."name",
           "type" = EXCLUDED."type",
           "sizeBytes" = EXCLUDED."sizeBytes",
           "chunksCount" = EXCLUDED."chunksCount",
           "updatedAt" = NOW();`,
        [doc.id, orgId, doc.botId, doc.name, doc.type || "Document", docSize, chunksCount]
      );

      await queryDb('DELETE FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc.id]);

      if (Array.isArray(doc.chunks)) {
        for (let i = 0; i < doc.chunks.length; i++) {
          const chunkText = doc.chunks[i];
          const chunkId = `chk_${doc.id}_${i}`;
          let embeddingVec = null;
          try {
            embeddingVec = await generateEmbedding(chunkText);
          } catch (e) {}

          if (embeddingVec && Array.isArray(embeddingVec)) {
            const vectorStr = `[${embeddingVec.join(",")}]`;
            await queryDb(
              `INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "embedding", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())
               ON CONFLICT ("id") DO NOTHING;`,
              [chunkId, doc.id, orgId, doc.botId, i, chunkText, vectorStr]
            );
          } else {
            await queryDb(
              `INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW())
               ON CONFLICT ("id") DO NOTHING;`,
              [chunkId, doc.id, orgId, doc.botId, i, chunkText]
            );
          }
        }
      }
    } catch (e) {
      // Disk JSON is durable fallback
    }
  })();
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

function loadDocumentsFromDisk() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading documents store:", e);
    return [];
  }
}

function saveDocumentsToDisk(docs) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving documents store:", e);
  }
}

export const documentsStore = {
  getDocuments(botId) {
    const all = loadDocumentsFromDisk();
    if (!botId) return all;
    return all.filter((d) => d.botId === botId);
  },

  getDocumentById(docId) {
    const all = loadDocumentsFromDisk();
    return all.find((d) => d.id === docId) || null;
  },

  addDocument({ id, botId, name, content, type = "Document" }) {
    const all = loadDocumentsFromDisk();
    const docId = id || `doc_${Date.now()}`;
    const chunks = chunkDocumentText(content);

    const doc = {
      id: docId,
      botId: botId || "bot_sales_01",
      name: name || "Untitled Document",
      type: type || "Document",
      content: content || "",
      chunks,
      chunksCount: chunks.length,
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
    syncDocToDbAsync(doc);
    return doc;
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
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    saveDocumentsToDisk(all);
    syncDocToDbAsync(updated);
    return updated;
  },

  deleteDocument(docId) {
    const all = loadDocumentsFromDisk();
    const filtered = all.filter((d) => d.id !== docId);
    saveDocumentsToDisk(filtered);
    deleteDocFromDbAsync(docId);
    return true;
  },

  searchDocuments(botId, query, topK = 4) {
    const cleanQ = (query || "").trim().toLowerCase();
    // Do not return document sources for pure greetings or small talk
    if (/^(hi+|hello+|hey+|hola|namaste|greetings|good\s*(morning|afternoon|evening|day))[\s!.,?]*$/i.test(cleanQ)) {
      return [];
    }

    const all = loadDocumentsFromDisk();
    // Filter docs strictly relevant to this bot
    const relevantDocs = all.filter((d) => Boolean(botId && d.botId === botId));

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
