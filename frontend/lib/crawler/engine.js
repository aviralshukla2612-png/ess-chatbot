import crypto from "node:crypto";
import { validateUrlForSSRF } from "../security/ssrf.js";
import { websitesDb } from "../db/websites.js";
import { documentsStore } from "../db/documentsStore.js";
import { queryDb, isPostgresAuthoritative } from "../db/dbPool.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "nomic-embed-text";
const QDRANT_URL = process.env.QDRANT_URL || "http://127.0.0.1:6333";

// In-memory Vector Store fallback when running locally or during tests
const vectorStorePoints = [];

/**
 * Strips HTML tags, navigation, scripts, styles, footers, cookie banners
 */
function cleanHtmlContent(rawHtml) {
  if (!rawHtml) return { title: "", description: "", text: "" };

  // Extract <title>
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract <meta name="description">
  const descMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  // Remove scripts, styles, noscript, svg, iframes
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ");

  // Remove navigation, header, footer, cookie modals
  cleaned = cleaned
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ");

  // Convert headings and paragraphs into readable text lines
  cleaned = cleaned
    .replace(/<(h[1-6]|p|li|div|article|section)[^>]*>/gi, "\n")
    .replace(/<\/[^>]+>/g, " ")
    .replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse whitespace
  const text = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 20) // Filter out noise / short navigation links
    .join("\n\n");

  return { title, description, text };
}

/**
 * Splits text into chunks with overlap
 */
function chunkText(text, chunkSize = 500, overlap = 80) {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of current chunk
      currentChunk = currentChunk.slice(-overlap) + "\n\n" + para;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generates embeddings via Ollama nomic-embed-text with robust fallback and strict dimension validation
 */
async function generateEmbedding(text) {
  if (process.env.FORCE_EMBEDDING_FAILURE === "true") {
    throw new Error(`Embedding model '${EMBED_MODEL}' failed: simulated embedding inference rejection`);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: text.slice(0, 1024),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.embeddings && data.embeddings[0]) {
        const vec = data.embeddings[0];
        if (
          !Array.isArray(vec) ||
          vec.length !== 768 ||
          !vec.every((n) => typeof n === "number" && Number.isFinite(n))
        ) {
          throw new Error(
            `Embedding dimension mismatch: expected 768, got ${Array.isArray(vec) ? vec.length : typeof vec}`
          );
        }
        return vec;
      }
    }
  } catch (e) {
    if (e.message.includes("Embedding dimension mismatch") || e.message.includes("simulated")) {
      throw e;
    }
    // Ollama unreachable
  }

  if (process.env.FORCE_EMBEDDING_DIM_MISMATCH === "true") {
    // Return invalid 512 dimensions to test dimension mismatch rejection
    return new Array(512).fill(0.1);
  }

  // If in test environment without Ollama container running, return deterministic test vector
  if (process.env.NODE_ENV === "test" || process.env.ALLOW_TEST_EMBEDDINGS === "true") {
    const hash = crypto.createHash("sha256").update(text).digest();
    const vector = new Array(768).fill(0);
    for (let i = 0; i < 768; i++) {
      vector[i] = (hash[i % hash.length] - 128) / 128;
    }
    return vector;
  }

  throw new Error(`Embedding model '${EMBED_MODEL}' unavailable at ${OLLAMA_URL}`);
}

/**
 * Discovers URLs from homepage or sitemap.xml
 */
async function discoverUrls(baseUrl, scope, maxPages = 50, includePatterns = [], excludePatterns = []) {
  const discovered = new Set([baseUrl]);
  const origin = new URL(baseUrl).origin;

  // If scope is 'homepage', only crawl homepage
  if (scope === "homepage") {
    return Array.from(discovered);
  }

  // 1. Try fetching sitemap.xml
  try {
    const sitemapUrl = `${origin}/sitemap.xml`;
    const ssrfCheck = await validateUrlForSSRF(sitemapUrl);
    if (ssrfCheck.valid) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(sitemapUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const xml = await res.text();
        const locMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
        for (const match of locMatches) {
          if (discovered.size >= maxPages) break;
          const u = match[1].trim();
          if (u.startsWith(origin)) {
            discovered.add(u);
          }
        }
      }
    }
  } catch (e) {
    // Sitemap discovery failed, fall back to link extraction from homepage
  }

  // 2. Discover links from homepage HTML if sitemap gave few links
  if (discovered.size < maxPages) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(baseUrl, {
        headers: { "User-Agent": "NexusAI-KnowledgeBot/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        const hrefMatches = html.matchAll(/href=["'](\/[^"'#\s]*|https?:\/\/[^"'#\s]*)["']/gi);
        for (const match of hrefMatches) {
          if (discovered.size >= maxPages) break;
          try {
            const rawHref = match[1];
            const resolved = new URL(rawHref, baseUrl).href;
            if (resolved.startsWith(origin)) {
              // Apply exclude patterns
              const isExcluded = excludePatterns.some((pattern) => resolved.includes(pattern));
              if (!isExcluded) {
                // Apply include patterns if specified
                if (includePatterns.length === 0 || includePatterns.some((p) => resolved.includes(p))) {
                  discovered.add(resolved);
                }
              }
            }
          } catch (urlErr) {}
        }
      }
    } catch (e) {}
  }

  return Array.from(discovered).slice(0, maxPages);
}

/**
 * Main Background Ingestion Pipeline
 */
export async function executeWebsiteIngestion(jobId) {
  const job = await websitesDb.getIngestionJob(jobId);
  if (!job) return;

  const source = await websitesDb.getWebsiteSourceById(job.websiteSourceId);
  if (!source) return;

  try {
    // Step 1: Discovering URLs
    await websitesDb.updateIngestionJob(jobId, {
      jobStatus: "Discovering",
      status: "Discovering",
      currentStep: "Discovering sitemap and permitted public URLs",
      progress: 10,
    });
    await websitesDb.updateWebsiteSource(source.id, { status: "Crawling" });

    const urls = await discoverUrls(
      source.baseUrl,
      source.crawlScope,
      source.maxPages,
      source.includePatterns,
      source.excludePatterns
    );

    await websitesDb.updateIngestionJob(jobId, {
      discoveredCount: urls.length,
      progress: 25,
      currentStep: `Discovered ${urls.length} URLs. Starting crawler...`,
    });

    // Step 2 & 3: Crawling & Content Extraction
    let indexedPages = 0;
    let failedPages = 0;
    let totalChunks = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      // Check SSRF
      const ssrfCheck = await validateUrlForSSRF(url);
      if (!ssrfCheck.valid) {
        failedPages++;
        continue;
      }

      await websitesDb.updateIngestionJob(jobId, {
        jobStatus: "Crawling",
        status: "Crawling",
        currentStep: `Crawling page (${i + 1}/${urls.length}): ${url}`,
        progress: Math.min(25 + Math.floor(((i + 1) / urls.length) * 35), 60),
      });

      let pageTitle = "";
      let pageDesc = "";
      let pageText = "";
      let contentHash = "";

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, {
          headers: {
            "User-Agent": "NexusAI-KnowledgeBot/1.0 (+https://nexusai.so/bot)",
            Accept: "text/html,application/xhtml+xml",
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          failedPages++;
          continue;
        }

        const rawHtml = await res.text();
        const extracted = cleanHtmlContent(rawHtml);
        pageTitle = extracted.title || new URL(url).pathname || "Home";
        pageDesc = extracted.description;
        pageText = extracted.text;
        contentHash = crypto.createHash("sha256").update(pageText).digest("hex");
      } catch (fetchErr) {
        // Truthful reporting: do not invent fake page text
        console.warn(`[CRAWL_FETCH_FAIL] Could not fetch ${url}: ${fetchErr.message}`);
        failedPages++;
        continue;
      }

      // If text extraction yielded zero or insufficient usable text, report truthfully
      if (!pageText || pageText.trim().length < 20) {
        failedPages++;
        continue;
      }

      // Step 4: Semantic Chunking
      const chunks = chunkText(pageText, 450, 70);
      if (chunks.length === 0) {
        failedPages++;
        continue;
      }

      // Step 5 & 6: Generate Embeddings & Upsert to Vector Store
      await websitesDb.updateIngestionJob(jobId, {
        jobStatus: "Embedding",
        status: "Embedding",
        currentStep: `Generating embeddings for: ${pageTitle}`,
        progress: Math.min(60 + Math.floor(((i + 1) / urls.length) * 35), 95),
      });

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunk = chunks[cIdx];
        const embedding = await generateEmbedding(chunk);
        const chunkId = `chk_ws_${source.id}_${i}_${cIdx}`;

        // Persist to PostgreSQL KnowledgeChunk with vector embedding
        if (embedding) {
          const vectorStr = `[${embedding.join(",")}]`;
          await queryDb(
            `INSERT INTO "KnowledgeChunk" (
              "id", "documentId", "organizationId", "botId", "chunkIndex",
              "content", "contentHash", "embedding", "sourceUrl", "pageTitle", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9, $10, NOW())
            ON CONFLICT ("id") DO UPDATE SET
              "content" = EXCLUDED."content",
              "embedding" = EXCLUDED."embedding",
              "sourceUrl" = EXCLUDED."sourceUrl",
              "pageTitle" = EXCLUDED."pageTitle";`,
            [
              chunkId,
              source.id,
              source.organizationId,
              source.botId,
              cIdx,
              chunk,
              contentHash,
              vectorStr,
              url,
              pageTitle,
            ]
          );
        }

        // Cache in memory for fast local lookup
        vectorStorePoints.push({
          id: chunkId,
          tenantId: source.organizationId,
          botId: source.botId,
          websiteId: source.id,
          pageUrl: url,
          pageTitle: pageTitle,
          chunkIndex: cIdx,
          contentHash: contentHash,
          content: chunk,
          embedding: embedding,
          createdAt: new Date().toISOString(),
        });
        totalChunks++;
      }

      // Record Website Page
      await websitesDb.upsertWebsitePage({
        websiteSourceId: source.id,
        botId: source.botId,
        organizationId: source.organizationId,
        url: url,
        title: pageTitle,
        description: pageDesc,
        contentHash: contentHash,
        crawlStatus: "Indexed",
        chunksCount: chunks.length,
        httpStatus: 200,
        lastIndexedAt: new Date().toISOString(),
      });

      indexedPages++;
    }

    // Step 7: Finalize Job Status
    const isSuccess = indexedPages > 0;
    await websitesDb.updateIngestionJob(jobId, {
      jobStatus: isSuccess ? "Completed" : "Failed",
      status: isSuccess ? "Completed" : "Failed",
      currentStep: isSuccess
        ? "Synchronization completed successfully"
        : "Failed to extract usable content from the provided website.",
      progress: 100,
      indexedCount: indexedPages,
      failedCount: failedPages,
      finishedAt: new Date().toISOString(),
      errorDetails: isSuccess ? null : "No usable content could be extracted from the provided URL(s).",
    });

    await websitesDb.updateWebsiteSource(source.id, {
      status: isSuccess ? "Ready" : "Failed",
      pagesDiscovered: urls.length,
      pagesIndexed: indexedPages,
      pagesFailed: failedPages,
      lastSyncedAt: new Date().toISOString(),
      lastError: isSuccess ? null : "No usable content extracted from website.",
    });
  } catch (err) {
    await websitesDb.updateIngestionJob(jobId, {
      jobStatus: "Failed",
      status: "Failed",
      currentStep: `Ingestion failed: ${err.message}`,
      errorDetails: err.message,
      finishedAt: new Date().toISOString(),
    });

    await websitesDb.updateWebsiteSource(source.id, {
      status: "Failed",
      lastError: err.message,
    });
  }
}

/**
 * Searches website and document knowledge with strict tenant and bot isolation
 */
export async function searchWebsiteKnowledge(botId, query, topK = 4, options = {}) {
  if (!botId || !query) return [];

  // Parse options
  const explicitOrgId = typeof options === "string" ? options : (options?.organizationId || options?.tenantId || null);

  // Server-side verification of bot ownership
  let bot = null;
  try {
    const { botsStore } = await import("../db/botsStore.js");
    bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
  } catch (e) {}

  // Cross-tenant verification:
  // If caller provided an organizationId, but the verified bot belongs to a different organization,
  // this is an unauthorized cross-tenant attempt!
  if (explicitOrgId && bot && bot.organizationId && bot.organizationId !== explicitOrgId) {
    return [];
  }

  const effectiveOrgId = explicitOrgId || bot?.organizationId || null;
  // Fail closed if tenant boundary cannot be established
  if (!effectiveOrgId) {
    return [];
  }

  const isAuthoritative = isPostgresAuthoritative();
  let dbResults = [];
  let dbQueriedSuccessfully = false;

  // 1. Primary: Search PostgreSQL pgvector KnowledgeChunk table for this botId & effectiveOrgId
  try {
    const queryVec = await generateEmbedding(query);
    if (queryVec && Array.isArray(queryVec)) {
      const vectorStr = `[${queryVec.join(",")}]`;
      const sql = `SELECT c."id", c."botId", c."organizationId", c."content", c."sourceUrl", c."pageTitle",
                (1 - (c."embedding" <=> $1::vector)) AS score
         FROM "KnowledgeChunk" c
         LEFT JOIN "KnowledgeDocument" d ON c."documentId" = d."id"
         WHERE c."botId" = $2 AND c."organizationId" = $3 AND c."embedding" IS NOT NULL
           AND (d."status" IS NULL OR d."status" = 'Ready')
         ORDER BY c."embedding" <=> $1::vector ASC LIMIT $4;`;
      const params = [vectorStr, botId, effectiveOrgId, topK];

      const res = await queryDb(sql, params);
      if (res.ok && Array.isArray(res.rows)) {
        dbQueriedSuccessfully = true;
        dbResults = res.rows.map((r) => ({
          pageTitle: r.pageTitle || r.sourceUrl,
          pageUrl: r.sourceUrl,
          content: r.content,
          score: Number(r.score) || 0,
        }));
      }
    }
  } catch (dbErr) {
    // Vector search error, try keyword search on PostgreSQL KnowledgeChunk
    try {
      const keywords = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
      if (keywords.length > 0) {
        const pattern = `%${keywords[0]}%`;
        const kwSql = `SELECT c."id", c."botId", c."organizationId", c."content", c."sourceUrl", c."pageTitle", 1.0 AS score
           FROM "KnowledgeChunk" c
           LEFT JOIN "KnowledgeDocument" d ON c."documentId" = d."id"
           WHERE c."botId" = $1 AND c."organizationId" = $2 AND c."content" ILIKE $3
             AND (d."status" IS NULL OR d."status" = 'Ready')
           LIMIT $4;`;
        const kwParams = [botId, effectiveOrgId, pattern, topK];

        const res = await queryDb(kwSql, kwParams);
        if (res.ok && Array.isArray(res.rows)) {
          dbQueriedSuccessfully = true;
          dbResults = res.rows.map((r) => ({
            pageTitle: r.pageTitle || r.sourceUrl,
            pageUrl: r.sourceUrl,
            content: r.content,
            score: Number(r.score) || 0.8,
          }));
        }
      }
    } catch (kwErr) {}
  }

  // If PostgreSQL is canonical and was successfully queried:
  // Return database results directly. Do not merge with stale or unpersisted JSON copies.
  if (dbQueriedSuccessfully && dbResults.length > 0) {
    return dbResults.slice(0, topK);
  }

  // In authoritative production/staging mode, do not silently fall back to JSON or mock data
  if (isAuthoritative) {
    return dbResults.slice(0, topK);
  }

  // Fallback for local test environments where PostgreSQL container is not configured
  let docResults = [];
  try {
    docResults = documentsStore.searchDocuments(botId, query, topK, effectiveOrgId);
  } catch (err) {
    console.warn("[KNOWLEDGE_DOC_SEARCH_WARN]", err.message);
  }

  const botPoints = vectorStorePoints.filter(
    (p) => p.botId === botId && p.organizationId === effectiveOrgId
  );
  let websiteResults = [];

  if (botPoints.length > 0) {
    try {
      const queryVec = await generateEmbedding(query);
      if (queryVec) {
        websiteResults = botPoints.map((point) => {
          let dot = 0;
          let normA = 0;
          let normB = 0;
          for (let i = 0; i < 768; i++) {
            const a = queryVec[i] || 0;
            const b = point.embedding?.[i] || 0;
            dot += a * b;
            normA += a * a;
            normB += b * b;
          }
          const score = dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
          return { ...point, score };
        });
        websiteResults.sort((a, b) => b.score - a.score);
      }
    } catch (e) {
      console.warn("[KNOWLEDGE_WEBSITE_SEARCH_WARN]", e.message);
    }
  }

  const combined = [...dbResults, ...docResults, ...websiteResults];
  if (combined.length === 0) return [];

  const unique = [];
  const seenContent = new Set();
  for (const item of combined) {
    const key = (item.content || "").slice(0, 80);
    if (!seenContent.has(key)) {
      seenContent.add(key);
      unique.push(item);
    }
  }

  unique.sort((a, b) => (b.score || 0) - (a.score || 0));
  return unique.slice(0, topK);
}

export { cleanHtmlContent, chunkText, generateEmbedding, vectorStorePoints };
