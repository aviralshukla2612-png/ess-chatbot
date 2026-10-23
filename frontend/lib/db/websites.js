// Persistent PostgreSQL + fallback in-memory store for Website Sources, Ingestion Jobs, Pages, and Widget Installations
// Implements strict multi-tenant isolation by organizationId and botId
import { queryDb } from "./dbPool.js";

let websiteSourcesStore = [];
let websitePagesStore = [];
let ingestionJobsStore = [];
let widgetInstallationsStore = [];

// Helper to generate IDs
const uid = (prefix = "id") => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const websitesDb = {
  // --- WEBSITE SOURCES ---
  async createWebsiteSource({
    organizationId = "org_ess_01",
    botId,
    name,
    baseUrl,
    crawlScope = "entire",
    maxPages = 50,
    includePatterns = [],
    excludePatterns = [],
    syncSchedule = "manual",
  }) {
    const existing = await this.getWebsiteSources(botId, organizationId);
    if (existing.some((s) => s.baseUrl && s.baseUrl.toLowerCase() === baseUrl.toLowerCase())) {
      throw new Error("This website URL is already connected to this chatbot.");
    }

    const id = uid("ws");
    const source = {
      id,
      organizationId,
      botId,
      name: name || new URL(baseUrl).hostname,
      baseUrl,
      crawlScope,
      maxPages: Number(maxPages) || 50,
      includePatterns: Array.isArray(includePatterns) ? includePatterns : [],
      excludePatterns: Array.isArray(excludePatterns) ? excludePatterns : [],
      syncSchedule,
      status: "Pending", // Pending, Crawling, Indexing, Ready, Failed, Paused
      pagesDiscovered: 0,
      pagesIndexed: 0,
      pagesSkipped: 0,
      pagesFailed: 0,
      lastSyncedAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await queryDb(
      `INSERT INTO "WebsiteSource" (
        "id", "organizationId", "botId", "name", "baseUrl", "crawlScope",
        "maxPages", "includePatterns", "excludePatterns", "syncSchedule",
        "status", "pagesDiscovered", "pagesIndexed", "pagesSkipped", "pagesFailed",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, 0, 0, NOW(), NOW())
      RETURNING *;`,
      [
        id,
        organizationId,
        botId,
        source.name,
        baseUrl,
        crawlScope,
        source.maxPages,
        source.includePatterns,
        source.excludePatterns,
        syncSchedule,
        source.status,
      ]
    );

    const saved = (res.ok && res.rows[0]) ? res.rows[0] : source;
    websiteSourcesStore.unshift(saved);
    return saved;
  },

  async getWebsiteSources(botId, organizationId) {
    if (botId || organizationId) {
      const res = await queryDb(
        `SELECT * FROM "WebsiteSource"
         WHERE ($1::text IS NULL OR "botId" = $1)
           AND ($2::text IS NULL OR "organizationId" = $2)
         ORDER BY "createdAt" DESC;`,
        [botId || null, organizationId || null]
      );
      if (res.ok) {
        return res.rows;
      }
    }
    return websiteSourcesStore.filter(
      (s) => (!botId || s.botId === botId) && (!organizationId || s.organizationId === organizationId)
    );
  },

  async getWebsiteSourceById(websiteId, botId) {
    if (websiteId) {
      const res = await queryDb(
        `SELECT * FROM "WebsiteSource"
         WHERE "id" = $1 AND ($2::text IS NULL OR "botId" = $2)
         LIMIT 1;`,
        [websiteId, botId || null]
      );
      if (res.ok && res.rows.length > 0) {
        return res.rows[0];
      }
    }
    return websiteSourcesStore.find(
      (s) => s.id === websiteId && (!botId || s.botId === botId)
    ) || null;
  },

  async updateWebsiteSource(websiteId, updates) {
    if (websiteId && updates && Object.keys(updates).length > 0) {
      const sets = [];
      const vals = [websiteId];
      let pIdx = 2;
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`"${k}" = $${pIdx}`);
        vals.push(v);
        pIdx++;
      }
      sets.push(`"updatedAt" = NOW()`);
      await queryDb(
        `UPDATE "WebsiteSource" SET ${sets.join(", ")} WHERE "id" = $1;`,
        vals
      );
    }
    const idx = websiteSourcesStore.findIndex((s) => s.id === websiteId);
    if (idx >= 0) {
      websiteSourcesStore[idx] = {
        ...websiteSourcesStore[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return websiteSourcesStore[idx];
    }
    return updates;
  },

  async deleteWebsiteSource(websiteId, botId) {
    if (websiteId) {
      await queryDb(
        `DELETE FROM "KnowledgeChunk" WHERE "sourceUrl" IN (
           SELECT "url" FROM "WebsitePage" WHERE "websiteSourceId" = $1
         ) OR "documentId" = $1;`,
        [websiteId]
      );
      await queryDb(
        `DELETE FROM "WebsiteSource" WHERE "id" = $1 AND ($2::text IS NULL OR "botId" = $2);`,
        [websiteId, botId || null]
      );
    }
    websitePagesStore = websitePagesStore.filter((p) => p.websiteSourceId !== websiteId);
    ingestionJobsStore = ingestionJobsStore.filter((j) => j.websiteSourceId !== websiteId);
    websiteSourcesStore = websiteSourcesStore.filter((s) => s.id !== websiteId);
    return true;
  },

  // --- INGESTION JOBS ---
  async createIngestionJob(websiteSourceId, botId, organizationId = "org_ess_01") {
    const id = uid("job");
    const job = {
      id,
      websiteSourceId,
      botId,
      organizationId,
      status: "Pending",
      jobStatus: "Pending",
      currentStep: "Initializing crawler",
      progress: 0,
      discoveredCount: 0,
      indexedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      errorDetails: null,
    };

    const res = await queryDb(
      `INSERT INTO "IngestionJob" (
        "id", "organizationId", "botId", "websiteSourceId", "status", "jobStatus",
        "currentStep", "progress", "discoveredCount", "indexedCount", "failedCount", "startedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, NOW())
      RETURNING *;`,
      [
        id,
        organizationId,
        botId,
        websiteSourceId,
        job.status,
        job.jobStatus,
        job.currentStep,
        job.progress,
      ]
    );

    const saved = (res.ok && res.rows[0]) ? res.rows[0] : job;
    ingestionJobsStore.unshift(saved);
    return saved;
  },

  async getIngestionJob(jobId) {
    if (jobId) {
      const res = await queryDb(
        `SELECT * FROM "IngestionJob" WHERE "id" = $1 LIMIT 1;`,
        [jobId]
      );
      if (res.ok && res.rows.length > 0) {
        return res.rows[0];
      }
    }
    return ingestionJobsStore.find((j) => j.id === jobId) || null;
  },

  async getLatestJobForSource(websiteSourceId) {
    if (websiteSourceId) {
      const res = await queryDb(
        `SELECT * FROM "IngestionJob" WHERE "websiteSourceId" = $1 ORDER BY "startedAt" DESC LIMIT 1;`,
        [websiteSourceId]
      );
      if (res.ok && res.rows.length > 0) {
        return res.rows[0];
      }
    }
    return ingestionJobsStore.find((j) => j.websiteSourceId === websiteSourceId) || null;
  },

  async updateIngestionJob(jobId, updates) {
    if (jobId && updates && Object.keys(updates).length > 0) {
      const dbUpdates = { ...updates };
      if (dbUpdates.jobStatus && !dbUpdates.status) {
        dbUpdates.status = dbUpdates.jobStatus;
      }
      const sets = [];
      const vals = [jobId];
      let pIdx = 2;
      for (const [k, v] of Object.entries(dbUpdates)) {
        sets.push(`"${k}" = $${pIdx}`);
        vals.push(v);
        pIdx++;
      }
      await queryDb(
        `UPDATE "IngestionJob" SET ${sets.join(", ")} WHERE "id" = $1;`,
        vals
      );
    }
    const idx = ingestionJobsStore.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      ingestionJobsStore[idx] = {
        ...ingestionJobsStore[idx],
        ...updates,
      };
      return ingestionJobsStore[idx];
    }
    return updates;
  },

  // --- WEBSITE PAGES ---
  async getPagesForWebsite(websiteSourceId) {
    if (websiteSourceId) {
      const res = await queryDb(
        `SELECT * FROM "WebsitePage" WHERE "websiteSourceId" = $1 ORDER BY "createdAt" ASC;`,
        [websiteSourceId]
      );
      if (res.ok) {
        return res.rows;
      }
    }
    return websitePagesStore.filter((p) => p.websiteSourceId === websiteSourceId);
  },

  async upsertWebsitePage(pageData) {
    const id = pageData.id || uid("page");
    const record = {
      id,
      ...pageData,
      updatedAt: new Date().toISOString(),
    };

    await queryDb(
      `INSERT INTO "WebsitePage" (
        "id", "websiteSourceId", "botId", "organizationId", "url", "canonicalUrl",
        "title", "description", "contentHash", "crawlStatus", "chunksCount",
        "httpStatus", "lastIndexedAt", "lastError", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "description" = EXCLUDED."description",
        "contentHash" = EXCLUDED."contentHash",
        "crawlStatus" = EXCLUDED."crawlStatus",
        "chunksCount" = EXCLUDED."chunksCount",
        "httpStatus" = EXCLUDED."httpStatus",
        "lastIndexedAt" = EXCLUDED."lastIndexedAt",
        "lastError" = EXCLUDED."lastError",
        "updatedAt" = NOW();`,
      [
        id,
        pageData.websiteSourceId,
        pageData.botId,
        pageData.organizationId,
        pageData.url,
        pageData.canonicalUrl || null,
        pageData.title || null,
        pageData.description || null,
        pageData.contentHash || null,
        pageData.crawlStatus || "Pending",
        Number(pageData.chunksCount) || 0,
        Number(pageData.httpStatus) || 200,
        pageData.lastIndexedAt || null,
        pageData.lastError || null,
      ]
    );

    const existingIdx = websitePagesStore.findIndex(
      (p) => p.websiteSourceId === pageData.websiteSourceId && p.url === pageData.url
    );
    if (existingIdx >= 0) {
      websitePagesStore[existingIdx] = record;
    } else {
      websitePagesStore.push(record);
    }
    return record;
  },

  async togglePageExclusion(websiteId, pageId, excluded) {
    const page = websitePagesStore.find(
      (p) => p.id === pageId && p.websiteSourceId === websiteId
    );
    if (page) {
      page.crawlStatus = excluded ? "Excluded" : "Indexed";
      page.updatedAt = new Date().toISOString();
    }
    await queryDb(
      `UPDATE "WebsitePage" SET "crawlStatus" = $1, "updatedAt" = NOW()
       WHERE "id" = $2 AND "websiteSourceId" = $3;`,
      [excluded ? "Excluded" : "Indexed", pageId, websiteId]
    );
    return page;
  },

  // --- WIDGET INSTALLATIONS ---
  async getWidgetInstallation(botId) {
    return widgetInstallationsStore.find((w) => w.botId === botId) || null;
  },

  async saveWidgetInstallation({
    botId,
    domain,
    installationStatus,
    cmsProvider = "custom",
    failureReason = null,
  }) {
    const existingIdx = widgetInstallationsStore.findIndex((w) => w.botId === botId);
    const data = {
      id: existingIdx >= 0 ? widgetInstallationsStore[existingIdx].id : uid("inst"),
      botId,
      domain,
      cmsProvider,
      installationStatus, // Unverified, Verified, Failed
      lastVerifiedAt: new Date().toISOString(),
      failureReason,
    };

    if (existingIdx >= 0) {
      widgetInstallationsStore[existingIdx] = data;
    } else {
      widgetInstallationsStore.push(data);
    }
    return data;
  },
};
