import fs from "fs";
import path from "path";
import { queryDb } from "./dbPool.js";
import { sseBroker } from "./sseBroker.js";
import { conversationsStore } from "./conversationsStore.js";

function resolveDataFile() {
  const frontendPath = path.join(process.cwd(), "frontend", "data", "bots.json");
  if (fs.existsSync(frontendPath)) return frontendPath;
  const directPath = path.join(process.cwd(), "data", "bots.json");
  if (fs.existsSync(directPath)) return directPath;
  if (process.cwd().endsWith("frontend")) return directPath;
  return frontendPath;
}

const DATA_FILE = resolveDataFile();
const DEFAULT_ORG_ID = "org_ess_default";

function enrichBotWithMetrics(bot, allBotsCount = 1) {
  if (!bot) return bot;
  try {
    const allConvs = conversationsStore.getConversations({
      organizationId: bot.organizationId || undefined,
    }) || [];

    const botId = String(bot.id || "").trim();
    const botName = String(bot.name || "").trim().toLowerCase();

    // Match conversations belonging to this bot
    let matched = allConvs.filter((c) => {
      const cBotId = String(c.botId || "").trim();
      const cBotName = String(c.botName || "").trim().toLowerCase();
      if (cBotId && cBotId === botId) return true;
      if (botId && (cBotId === `bot_${botId}` || cBotId === botId.replace(/^bot_/, ""))) return true;
      if (botName && (cBotName === botName || cBotName.includes(botName) || botName.includes(cBotName))) return true;
      // If there is only 1 bot in the workspace or organization, attribute all conversations to this active bot
      if (allBotsCount === 1) return true;
      return false;
    });

    const dbConvsCount = Number(bot.conversationsCount) || 0;
    const dbQuestionsCount = Number(bot.questionsCount) || 0;
    const dbLeadsCount = Number(bot.leadsCount) || 0;

    const convCount = Math.max(dbConvsCount, matched.length);
    const leadsCount = Math.max(
      dbLeadsCount,
      matched.filter((c) => c.isLead || c.leadScore || c.visitorEmail || c.visitorPhone).length
    );
    const questionsCount = Math.max(
      dbQuestionsCount,
      matched.reduce((acc, c) => {
        const q = c.questionsCount || (Array.isArray(c.messages) ? c.messages.filter((m) => m.role === "user" || m.sender === "user").length : 0);
        return acc + (q || 1);
      }, 0)
    );

    // Calculate humanized last active string
    let lastActive = bot.lastActive || "Just now";
    const latestTimestamp = bot.lastActiveAt || (matched.length > 0 ? (matched[0].lastActivityAt || matched[0].updatedAt || matched[0].createdAt) : null);
    if (latestTimestamp) {
      const diffMs = Date.now() - new Date(latestTimestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (isNaN(diffMins) || diffMins < 2) lastActive = "Just now";
      else if (diffMins < 60) lastActive = `${diffMins}m ago`;
      else if (diffMins < 1440) lastActive = `${Math.floor(diffMins / 60)}h ago`;
      else lastActive = `${Math.floor(diffMins / 1440)}d ago`;
    }

    return {
      ...bot,
      conversationsCount: convCount,
      questionsCount: questionsCount,
      leadsCount: leadsCount,
      lastActive,
    };
  } catch (err) {
    console.error("Error enriching bot with live metrics:", err);
    return bot;
  }
}

// Default single official seed bot: Emperor AI Assistant
const DEFAULT_BOTS = [
  {
    id: "bot_1791618269632",
    organizationId: DEFAULT_ORG_ID,
    name: "Emperor AI Assistant",
    company: "Emperor Smart Solutions",
    description: "Official AI Sales Representative for Emperor Smart Solutions & Daily Cashbook.",
    avatar: "🤖",
    status: "Active",
    primaryColor: "#B68A55",
    welcomeMessage: "Hello! Welcome to Emperor Smart Solutions. How can I help you today?",
    placeholderText: "Type a message...",
    launcherPosition: "bottom-right",
    brandingEnabled: true,
    personality: "Helpful & Professional",
    systemPrompt: "You are Emperor AI, the official AI Sales Consultant for Emperor Smart Solutions (ESS). Assist visitors with Website Development, Mobile Application, AI Chatbot & RAG, Custom Software, ERP, Cloud & DevOps, and hiring dedicated developers. Founder: Yash Sharma, Co-Founder: Karan Makwana.",
    responseLength: "Balanced",
    instructions: "Be courteous, clear, and direct. Explain services and pricing tiers accurately.",
    collectLeads: true,
    allowedDomains: ["*"],
    quickReplies: [
      "Website Development",
      "Mobile Application",
      "AI Chatbot & RAG",
      "Custom Software & ERP",
      "UI/UX Design",
      "Cloud & DevOps",
      "Hire Dedicated Developers",
    ],
    conversationsCount: 0,
    questionsCount: 0,
    leadsCount: 0,
    sourcesCount: 0,
    createdDate: "Oct 9, 2026",
    lastActive: "Just now",
    documents: [],
  },
];

let memoryBotsCache = null;

function loadBotsFromDisk() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_BOTS, null, 2), "utf8");
      memoryBotsCache = [...DEFAULT_BOTS];
      return memoryBotsCache;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out legacy dummy bot 'bot_aa' / 'aa' and enforce single official bot
      const sanitized = parsed.filter((b) => b.id !== "bot_aa" && b.name !== "aa");
      if (sanitized.length === 0) {
        sanitized.push(...DEFAULT_BOTS);
      }
      memoryBotsCache = sanitized.map((b) => ({
        ...b,
        organizationId: b.organizationId || DEFAULT_ORG_ID,
        primaryColor: (!b.primaryColor || b.primaryColor === "#4f46e5" || b.primaryColor === "#6366f1") ? "#B68A55" : b.primaryColor,
      }));
      // If disk had dummy bot_aa, persist the sanitized list
      if (sanitized.length !== parsed.length) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(memoryBotsCache, null, 2), "utf8");
      }
      return memoryBotsCache;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
    memoryBotsCache = [];
    return memoryBotsCache;
  } catch (err) {
    console.error("Error reading bots store:", err);
    return memoryBotsCache || DEFAULT_BOTS;
  }
}

function saveBotsToDisk(bots) {
  try {
    memoryBotsCache = bots;
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(bots, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving bots store:", err);
  }
}

export const botsStore = {
  /**
   * List bots scoped strictly by organizationId.
   */
  async getBotsAsync(organizationId) {
    let rows = [];
    try {
      const sql = `
        SELECT b.*,
          COALESCE((
            SELECT COUNT(*)::int FROM "Conversation" c 
            WHERE c."botId" = b.id OR c."botId" = 'bot_' || b.id OR c."botId" = REPLACE(b.id, 'bot_', '') OR LOWER(c."botName") = LOWER(b.name)
          ), 0) AS "conversationsCount",
          COALESCE((
            SELECT COUNT(*)::int FROM "Message" m
            JOIN "Conversation" c ON m."conversationId" = c.id
            WHERE (c."botId" = b.id OR c."botId" = 'bot_' || b.id OR c."botId" = REPLACE(b.id, 'bot_', '') OR LOWER(c."botName") = LOWER(b.name))
              AND (m."sender" = 'user' OR m."role" = 'user')
          ), 0) AS "questionsCount",
          COALESCE((
            SELECT COUNT(*)::int FROM "Conversation" c
            WHERE (c."botId" = b.id OR c."botId" = 'bot_' || b.id OR c."botId" = REPLACE(b.id, 'bot_', '') OR LOWER(c."botName") = LOWER(b.name))
              AND (c."isLead" = TRUE OR c."leadScore" IS NOT NULL OR c."visitorEmail" IS NOT NULL OR c."visitorPhone" IS NOT NULL)
          ), 0) AS "leadsCount",
          (
            SELECT c."lastActivityAt" FROM "Conversation" c
            WHERE c."botId" = b.id OR c."botId" = 'bot_' || b.id OR c."botId" = REPLACE(b.id, 'bot_', '') OR LOWER(c."botName") = LOWER(b.name)
            ORDER BY c."lastActivityAt" DESC LIMIT 1
          ) AS "lastActiveAt"
        FROM "Bot" b
        ${organizationId ? 'WHERE b."organizationId" = $1' : ''}
        ORDER BY b."createdAt" DESC;
      `;
      const params = organizationId ? [organizationId] : [];
      const dbRes = await queryDb(sql, params);
      if (dbRes.ok && dbRes.rows.length > 0) {
        rows = dbRes.rows;
      }
    } catch (err) {
      console.warn("Error in getBotsAsync DB query:", err);
    }

    if (rows.length === 0) {
      const all = loadBotsFromDisk();
      rows = organizationId ? all.filter((b) => b.organizationId === organizationId) : all;
    }

    return rows.map((b) => enrichBotWithMetrics(b, rows.length));
  },

  getBots(organizationId) {
    const all = loadBotsFromDisk();
    const list = organizationId ? all.filter((b) => b.organizationId === organizationId) : all;
    return list.map((b) => enrichBotWithMetrics(b, list.length));
  },

  /**
   * Retrieve a bot by ID or Name, enforcing organizationId tenant boundary when provided.
   * Returns null if no exact matching bot is found. Never falls back to arbitrary bots.
   */
  getBot(idOrName, organizationId = null) {
    if (!idOrName) return null;
    const query = String(idOrName).trim();
    if (!query) return null;

    const bots = loadBotsFromDisk();
    const queryLower = query.toLowerCase();

    // Filter to tenant if organizationId is specified
    const scopedBots = organizationId
      ? bots.filter((b) => b.organizationId === organizationId)
      : bots;

    // 1. Exact ID match
    let match = scopedBots.find((b) => b.id === query);
    if (match) return enrichBotWithMetrics(match, scopedBots.length);

    // 2. Case-insensitive ID match
    match = scopedBots.find((b) => b.id && b.id.toLowerCase() === queryLower);
    if (match) return enrichBotWithMetrics(match, scopedBots.length);

    // 3. Exact Name match (case-insensitive)
    match = scopedBots.find((b) => b.name && b.name.trim().toLowerCase() === queryLower);
    if (match) return enrichBotWithMetrics(match, scopedBots.length);

    // 4. Default seed bot fallback (ensure official default Emperor AI Assistant is always accessible)
    if (!organizationId || organizationId === DEFAULT_ORG_ID || organizationId === "org_default") {
      if (queryLower === "bot_1791618269632" || queryLower === "bot_aa" || queryLower === "aa" || queryLower === "default") {
        const def = DEFAULT_BOTS[0];
        if (def) {
          if (!bots.some((b) => b.id === def.id)) {
            bots.push(def);
            saveBotsToDisk(bots);
          }
          return enrichBotWithMetrics(def, 1);
        }
      }
    }

    // Strict: Never fall back to another tenant's bot or the first bot in the store
    return null;
  },

  /**
   * Retrieve a bot by ID or Name asynchronously, checking PostgreSQL database first
   * and falling back to memory/disk store.
   */
  async getBotAsync(idOrName, organizationId = null) {
    if (!idOrName) return null;
    const query = String(idOrName).trim();
    if (!query) return null;
    const queryLower = query.toLowerCase();

    // Check disk/memory first for speed
    const localMatch = this.getBot(query, organizationId);
    if (localMatch) return localMatch;

    // Query PostgreSQL Database
    try {
      let dbRes;
      if (organizationId) {
        dbRes = await queryDb(
          'SELECT * FROM "Bot" WHERE ("id" = $1 OR LOWER("id") = LOWER($1) OR LOWER("name") = LOWER($1)) AND "organizationId" = $2 LIMIT 1;',
          [query, organizationId]
        );
      } else {
        dbRes = await queryDb(
          'SELECT * FROM "Bot" WHERE "id" = $1 OR LOWER("id") = LOWER($1) OR LOWER("name") = LOWER($1) LIMIT 1;',
          [query]
        );
      }
      if (dbRes.ok && dbRes.rows.length > 0) {
        const bot = dbRes.rows[0];
        if (!bot.allowedDomains || !Array.isArray(bot.allowedDomains) || bot.allowedDomains.length === 0) {
          bot.allowedDomains = ["*"];
        }
        // Cache in memory store so subsequent synchronous lookups also succeed
        const all = loadBotsFromDisk();
        const existingIdx = all.findIndex((b) => b.id === bot.id);
        if (existingIdx >= 0) {
          all[existingIdx] = { ...all[existingIdx], ...bot };
        } else {
          all.push(bot);
        }
        memoryBotsCache = all;
        return enrichBotWithMetrics(bot, 1);
      }
    } catch (err) {
      console.warn("Database bot lookup error:", err);
    }

    // Default seed bot fallback
    if (!organizationId || organizationId === DEFAULT_ORG_ID || organizationId === "org_default") {
      if (queryLower === "bot_1791618269632" || queryLower === "bot_aa" || queryLower === "aa" || queryLower === "default") {
        return enrichBotWithMetrics(DEFAULT_BOTS[0], 1);
      }
    }

    return null;
  },

  /**
   * Upsert a bot with explicit tenant scoping.
   */
  upsertBot(botData, targetOrgId = null) {
    const bots = loadBotsFromDisk();
    const id = botData.id || `bot_${Date.now()}`;
    const orgId = targetOrgId || botData.organizationId || DEFAULT_ORG_ID;

    const existingIndex = bots.findIndex(
      (b) => b.id === id && (!targetOrgId || b.organizationId === orgId)
    );

    const merged = {
      id,
      organizationId: orgId,
      status: "Active",
      conversationsCount: 0,
      questionsCount: 0,
      leadsCount: 0,
      sourcesCount: botData.documents?.length || 0,
      createdDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastActive: "Just now",
      primaryColor: "#B68A55",
      welcomeMessage: `Hello! I am ${botData.name || "AI Assistant"}. How can I help you today?`,
      launcherPosition: "bottom-right",
      brandingEnabled: true,
      company: botData.company || null,
      websiteUrl: botData.websiteUrl || null,
      phoneNumber: botData.phoneNumber || botData.phone || null,
      ...botData,
    };

    if (existingIndex >= 0) {
      bots[existingIndex] = { ...bots[existingIndex], ...merged };
    } else {
      bots.unshift(merged);
    }

    saveBotsToDisk(bots);

    // Sync to PostgreSQL
    queryDb(
      `INSERT INTO "Bot" ("id", "organizationId", "name", "description", "primaryColor", "status", "systemPrompt", "welcomeMessage", "allowedDomains", "company", "websiteUrl", "phoneNumber")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT ("id") DO UPDATE SET
         "name" = EXCLUDED."name",
         "description" = EXCLUDED."description",
         "primaryColor" = EXCLUDED."primaryColor",
         "status" = EXCLUDED."status",
         "systemPrompt" = EXCLUDED."systemPrompt",
         "welcomeMessage" = EXCLUDED."welcomeMessage",
         "allowedDomains" = EXCLUDED."allowedDomains",
         "company" = EXCLUDED."company",
         "websiteUrl" = EXCLUDED."websiteUrl",
         "phoneNumber" = EXCLUDED."phoneNumber",
         "updatedAt" = CURRENT_TIMESTAMP;`,
      [
        id,
        orgId,
        merged.name || "AI Assistant",
        merged.description || null,
        merged.primaryColor || "#B68A55",
        merged.status || "Active",
        merged.systemPrompt || null,
        merged.welcomeMessage || "Hello!",
        Array.isArray(merged.allowedDomains) ? merged.allowedDomains : ["*"],
        merged.company || null,
        merged.websiteUrl || null,
        merged.phoneNumber || null,
      ]
    ).catch(() => {});

    try {
      sseBroker.broadcast("bot_updated", merged);
    } catch (e) {}

    return merged;
  },

  deleteBot(id, organizationId = null) {
    const bots = loadBotsFromDisk();
    const target = bots.find(
      (b) => (b.id === id || b.name?.toLowerCase() === id?.toLowerCase()) && (!organizationId || b.organizationId === organizationId)
    );
    const targetOrgId = organizationId || target?.organizationId || null;

    const filtered = bots.filter((b) => {
      if (b.id !== id && b.name?.toLowerCase() !== id?.toLowerCase()) return true;
      if (organizationId && b.organizationId !== organizationId) return true; // keep if different tenant
      return false;
    });

    saveBotsToDisk(filtered);

    if (organizationId) {
      queryDb('DELETE FROM "Bot" WHERE "id" = $1 AND "organizationId" = $2;', [id, organizationId]).catch(() => {});
    } else {
      queryDb('DELETE FROM "Bot" WHERE "id" = $1;', [id]).catch(() => {});
    }

    try {
      sseBroker.broadcast("bot_deleted", { id, organizationId: targetOrgId });
    } catch (e) {}
    return { success: true };
  },
};
