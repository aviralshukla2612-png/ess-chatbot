import fs from "fs";
import path from "path";
import { sseBroker } from "./sseBroker.js";
import { queryDb } from "./dbPool.js";
import { conversationsStore } from "./conversationsStore.js";
import { formatQualificationInquiry } from "../ai/salesFlowManager.js";

function resolveDataFile() {
  const directPath = path.join(process.cwd(), "data", "leads.json");
  if (fs.existsSync(directPath)) return directPath;
  const frontendPath = path.join(process.cwd(), "frontend", "data", "leads.json");
  if (fs.existsSync(frontendPath)) return frontendPath;
  if (process.cwd().endsWith("frontend")) return directPath;
  return frontendPath;
}

const SEED_LEADS = [];

let memoryCache = null;

function loadFromDisk() {
  const dataFile = resolveDataFile();
  try {
    if (!fs.existsSync(dataFile)) {
      const dir = path.dirname(dataFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(SEED_LEADS, null, 2), "utf8");
      memoryCache = [...SEED_LEADS];
      return memoryCache;
    }
    const raw = fs.readFileSync(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryCache = parsed;
      return memoryCache;
    }
    fs.writeFileSync(dataFile, JSON.stringify(SEED_LEADS, null, 2), "utf8");
    memoryCache = [...SEED_LEADS];
    return memoryCache;
  } catch (err) {
    console.error("Error loading leads store:", err);
    return memoryCache || SEED_LEADS;
  }
}

function saveToDisk(data) {
  const dataFile = resolveDataFile();
  try {
    memoryCache = data;
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving leads store:", err);
  }
}

export const leadsStore = {
  getLeads(filters = {}) {
    let list = loadFromDisk();

    // Auto-sync leads from conversationsStore: any conversation marked as isLead or with phone/email MUST be in the lead CRM
    try {
      const allConvs = conversationsStore.getConversations();
      let hasNewLeads = false;
      const cleanDigits = (p) => (p || "").replace(/\D/g, "");

      allConvs.forEach((conv) => {
        const hasContact = Boolean(conv.visitorPhone || conv.visitorEmail);
        const isMarkedLead = Boolean(conv.isLead || hasContact);
        if (!isMarkedLead) return;

        // Check if lead already tracked in list
        const exists = list.some((l) =>
          (l.sessionId && l.sessionId === conv.id) ||
          (conv.visitorPhone && l.phone && cleanDigits(l.phone) === cleanDigits(conv.visitorPhone) && cleanDigits(conv.visitorPhone).length >= 10) ||
          (conv.visitorEmail && l.email && l.email.toLowerCase() === conv.visitorEmail.toLowerCase())
        );

        if (!exists) {
          const qual = conv.qualification || null;
          const qualAnswers = qual?.answers || {};
          const qualInquiry = qual ? formatQualificationInquiry(qual) : (conv.lastMessage || "Inquired via live chat widget");

          const newLead = {
            id: `lead_${conv.id.replace(/^c_/, "")}`,
            visitorId: conv.visitorId || null,
            sessionId: conv.id,
            organizationId: conv.organizationId || "org_ess_default",
            name: conv.visitorName && !/^(?:website\s+visitor|website\s+prospect|client\s+inquiry|client\s+lead|prospective\s+client|direct\s+session|visitor|prospect|user|guest|client(?:\s*\(.*|\s*#\d+)?)$/i.test(conv.visitorName.trim())
              ? conv.visitorName
              : (conv.visitorEmail ? conv.visitorEmail.split("@")[0].replace(/[._]/g, " ") : (conv.visitorPhone ? `Client (${conv.visitorPhone})` : "Client Lead")),
            email: conv.visitorEmail || "",
            phone: conv.visitorPhone || "",
            company: conv.company || "Direct Inbound",
            botId: conv.botId || "bot_1791618269632",
            bot: conv.botName || "Emperor AI Assistant",
            score: (conv.visitorPhone && conv.visitorEmail) ? "High" : (conv.leadScore || "High"),
            status: conv.status === "Resolved" ? "Converted" : "New",
            created: new Date(conv.createdAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            createdAt: conv.createdAt || new Date().toISOString(),
            updatedAt: conv.updatedAt || new Date().toISOString(),
            inquiry: qualInquiry,
            budget: qualAnswers.budget || "₹50,000+",
            answers: qualAnswers,
            qualification: qual,
            source: "Web Chatbot Widget",
          };

          list.unshift(newLead);
          hasNewLeads = true;
        }
      });

      if (hasNewLeads) {
        saveToDisk(list);
      }
    } catch (syncErr) {
      console.warn("Conversations to Leads auto-sync warning:", syncErr.message);
    }

    // Auto-enrich answers, qualification, and inquiry from conversationsStore if missing
    list.forEach((l) => {
      const cleanDigits = (p) => (p || "").replace(/\D/g, "");
      const conv = (l.sessionId && conversationsStore.getConversation(l.sessionId, l.organizationId)) ||
        conversationsStore.getConversations({ organizationId: l.organizationId, botId: l.botId }).find((c) =>
          (l.phone && c.visitorPhone && cleanDigits(c.visitorPhone) === cleanDigits(l.phone)) ||
          (l.name && !/^(?:website\s+visitor|website\s+prospect|client\s+inquiry|client\s+lead|prospective\s+client)$/i.test(l.name.trim()) && c.visitorName && c.visitorName.toLowerCase() === l.name.toLowerCase())
        );

      if (conv?.qualification) {
        if (!l.qualification) l.qualification = conv.qualification;
        if (conv.qualification.answers) {
          l.answers = { ...(conv.qualification.answers || {}), ...(l.answers || {}) };
        }
        if (!l.inquiry || l.inquiry === "Inquired via live chat widget" || l.inquiry.startsWith("Visitor introduced")) {
          l.inquiry = formatQualificationInquiry(conv.qualification);
        }
      }
    });

    // Sanitize: filter out invalid entries without contact info, real name, or qualification answers, or bogus question names
    list = list.filter((l) => {
      const hasContact = Boolean(l.email || l.phone);
      const hasAnswers = Boolean(l.answers && Object.keys(l.answers).length > 0);
      const isPlaceholder = !l.name || /^(?:website\s+visitor|website\s+prospect|client\s+inquiry|client\s+lead|prospective\s+client|direct\s+session|visitor|prospect|user|guest|client(?:\s*\(.*|\s*#\d+)?)$/i.test(l.name.trim());
      const hasRealName = Boolean(l.name && !isPlaceholder);
      const isBogusName = /^(?:who\s+is|what\s+is|can\s+you|tell\s+me|i\s+want|how\s+much|hello|hi)\b/i.test(l.name || "");
      if (isBogusName) return false;
      if (!hasContact && !hasAnswers && !hasRealName) return false;
      return true;
    });

    if (filters.organizationId) {
      list = list.filter(
        (l) =>
          !l.organizationId ||
          l.organizationId === filters.organizationId ||
          l.organizationId === "org_ess_default" ||
          filters.organizationId === "org_ess_default"
      );
    }
    if (filters.status && filters.status !== "All" && filters.status !== "All Status") {
      list = list.filter((l) => l.status?.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.score && filters.score !== "All") {
      list = list.filter((l) => l.score?.toLowerCase() === filters.score.toLowerCase());
    }
    if (filters.botId && filters.botId !== "All") {
      list = list.filter((l) => l.botId === filters.botId || l.bot === filters.botId);
    }
    if (filters.bot && filters.bot !== "All Bots" && filters.bot !== "All") {
      list = list.filter((l) => l.bot?.toLowerCase() === filters.bot.toLowerCase() || l.botId?.toLowerCase() === filters.bot.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.phone?.includes(q)
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  },

  getLead(id, organizationId = null) {
    const list = loadFromDisk();
    return list.find((l) => l.id === id && (!organizationId || (l.organizationId || "org_ess_default") === organizationId || organizationId === "org_ess_default")) || null;
  },

  async getLeadsAsync(filters = {}) {
    const diskLeads = this.getLeads(filters);

    try {
      let query = 'SELECT * FROM "Lead"';
      const params = [];
      const conditions = [];

      if (filters.organizationId && filters.organizationId !== "org_ess_default") {
        params.push(filters.organizationId);
        conditions.push(`("organizationId" = $${params.length} OR "organizationId" = 'org_ess_default' OR "organizationId" IS NULL)`);
      }
      if (filters.status && filters.status !== "All" && filters.status !== "All Status") {
        params.push(filters.status);
        conditions.push(`LOWER("status") = LOWER($${params.length})`);
      }
      if (filters.botId && filters.botId !== "All") {
        params.push(filters.botId);
        conditions.push(`"botId" = $${params.length}`);
      }
      if (filters.score && filters.score !== "All") {
        params.push(filters.score);
        conditions.push(`LOWER("score") = LOWER($${params.length})`);
      }
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += ' ORDER BY "createdAt" DESC;';

      const dbRes = await queryDb(query, params);
      if (dbRes.ok && Array.isArray(dbRes.rows)) {
        let dbRows = dbRes.rows.filter((l) => {
          const hasContact = Boolean((l.email && l.email.trim()) || (l.phone && l.phone.trim()));
          const hasAnswers = Boolean(l.answers && typeof l.answers === "object" && Object.keys(l.answers).length > 0);
          const hasRealName = Boolean(l.name && l.name !== "Website Prospect" && l.name !== "Website Visitor");
          const isBogusName = /^(?:who\s+is|what\s+is|can\s+you|tell\s+me|i\s+want|how\s+much|hello|hi)\b/i.test(l.name || "");
          if (isBogusName) return false;
          if (!hasContact && !hasAnswers && !hasRealName) return false;
          return true;
        });

        // Merge DB rows with disk/auto-synced leads
        const cleanDigits = (p) => (p || "").replace(/\D/g, "");
        const combined = [...dbRows];
        for (const dl of diskLeads) {
          const exists = combined.some(
            (c) =>
              c.id === dl.id ||
              (c.sessionId && dl.sessionId && c.sessionId === dl.sessionId) ||
              (dl.phone && c.phone && cleanDigits(dl.phone) === cleanDigits(c.phone) && cleanDigits(dl.phone).length >= 10) ||
              (dl.email && c.email && dl.email.toLowerCase() === c.email.toLowerCase())
          );
          if (!exists) {
            combined.push(dl);
          }
        }
        return combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
    } catch (err) {
      console.warn("DB leads query failed:", err);
    }
    return diskLeads;
  },

  createLead(data) {
    const list = loadFromDisk();
    const now = new Date();
    const targetOrgId = data.organizationId || "org_ess_default";
    data.organizationId = targetOrgId;

    // Check if lead already exists within this bot and organization
    const cleanDigits = (p) => (p || "").replace(/\D/g, "");
    const existing = list.find(
      (l) =>
        (l.organizationId === targetOrgId) &&
        (l.botId === data.botId || !l.botId) &&
        ((data.visitorId && l.visitorId && l.visitorId === data.visitorId) ||
         (data.sessionId && l.sessionId && l.sessionId === data.sessionId) ||
         (data.email && l.email && l.email.toLowerCase() === data.email.toLowerCase()) ||
         (data.phone && l.phone && cleanDigits(l.phone) === cleanDigits(data.phone) && cleanDigits(data.phone).length >= 10))
    );
    if (existing) {
      if (data.visitorId && !existing.visitorId) existing.visitorId = data.visitorId;
      if (data.organizationId && (!existing.organizationId || existing.organizationId === "org_ess_default")) {
        existing.organizationId = data.organizationId;
      }
      if (data.sessionId) existing.sessionId = data.sessionId;
      if (data.name && data.name !== "Website Prospect" && data.name !== "Website Visitor") {
        existing.name = data.name;
      } else if (!existing.name || existing.name === "Website Prospect" || existing.name === "Website Visitor") {
        if (data.name) existing.name = data.name;
      }
      if (data.phone) existing.phone = data.phone;
      if (data.email) existing.email = data.email;
      if (data.sessionId && !existing.sessionId) existing.sessionId = data.sessionId;
      if (data.inquiry && data.inquiry !== "Inquired via live chat widget" && !data.inquiry.startsWith("Visitor introduced")) {
        existing.inquiry = data.inquiry;
      } else if (!existing.inquiry) {
        existing.inquiry = data.inquiry || "Inquired via live chat widget";
      }
      if (data.budget && data.budget !== "₹50,000+") {
        existing.budget = data.budget;
      } else if (!existing.budget) {
        existing.budget = data.budget || "₹50,000+";
      }
      if (data.qualification) {
        existing.qualification = data.qualification;
        if (data.qualification.answers) {
          existing.answers = { ...(existing.answers || {}), ...data.qualification.answers };
        }
      }
      if (data.answers && Object.keys(data.answers).length > 0) {
        existing.answers = { ...(existing.answers || {}), ...data.answers };
      }
      if (existing.phone && existing.email) existing.score = "Hot";
      existing.updatedAt = now.toISOString();
      saveToDisk(list);
      sseBroker.broadcast("lead_updated", existing);

      // Upsert to PostgreSQL so records missing in DB are guaranteed created
      try {
        const targetBotId = (existing.bot === "aa" || !existing.botId) ? "bot_aa" : (existing.botId || existing.bot);
        const resolvedOrg = existing.organizationId || targetOrgId;
        queryDb(
          `INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
           ON CONFLICT ("id") DO UPDATE 
           SET "organizationId" = EXCLUDED."organizationId", "name" = EXCLUDED."name", "phone" = EXCLUDED."phone", "email" = EXCLUDED."email", "score" = EXCLUDED."score", "inquiry" = EXCLUDED."inquiry", "updatedAt" = NOW()`,
          [
            existing.id,
            resolvedOrg,
            targetBotId,
            existing.name,
            existing.email || "",
            existing.phone || "",
            existing.company || "Direct Inbound",
            existing.score || "Hot",
            existing.status || "New",
            existing.inquiry || "",
            existing.budget || "₹50,000+",
            existing.source || "Web Chatbot Widget",
          ]
        );
      } catch (e) {}

      return existing;
    }

    const newLead = {
      id: data.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      visitorId: data.visitorId || null,
      sessionId: data.sessionId || "",
      organizationId: targetOrgId,
      name: data.name || "Website Prospect",
      email: data.email || "",
      phone: data.phone || "",
      company: data.company || "Direct Inbound",
      botId: data.botId || data.bot || "bot_default",
      bot: data.bot || data.botId || "AI Assistant",
      score: data.score || (data.phone && data.email ? "High" : "Medium"),
      status: data.status || "New",
      created: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      inquiry: data.inquiry || "Inquired via live chat widget",
      budget: data.budget || "₹50,000+",
      answers: data.answers || {},
      qualification: data.qualification || null,
      source: data.source || "Web Chatbot Widget",
    };

    list.unshift(newLead);
    saveToDisk(list);

    // Broadcast lead in real-time
    sseBroker.broadcast("lead_created", newLead);

    // Async dual-write to PostgreSQL
    try {
      const targetBotId = (data.bot === "aa" || !data.botId) ? "bot_aa" : (data.botId || data.bot);
      queryDb(
        `INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT ("id") DO UPDATE SET "organizationId" = EXCLUDED."organizationId", "name" = EXCLUDED."name", "email" = EXCLUDED."email", "phone" = EXCLUDED."phone", "updatedAt" = NOW()`,
        [
          newLead.id,
          targetOrgId,
          targetBotId,
          newLead.name,
          newLead.email,
          newLead.phone,
          newLead.company,
          newLead.score,
          newLead.status,
          newLead.inquiry,
          newLead.budget,
          newLead.source,
          newLead.createdAt,
          newLead.updatedAt,
        ]
      ).catch((err) => console.warn("[DB_LEAD_INSERT_FAIL]", err.message));
    } catch (e) {}

    return newLead;
  },

  updateLeadStatus(id, newStatus) {
    const list = loadFromDisk();
    const lead = list.find((l) => l.id === id);
    if (!lead) return null;

    lead.status = newStatus;
    lead.updatedAt = new Date().toISOString();
    saveToDisk(list);

    sseBroker.broadcast("lead_updated", lead);

    try {
      queryDb('UPDATE "Lead" SET "status" = $1, "updatedAt" = NOW() WHERE "id" = $2', [newStatus, id])
        .catch((err) => console.warn("[DB_LEAD_STATUS_FAIL]", err.message));
    } catch (e) {}

    return lead;
  },

  deleteLead(id, organizationId = null) {
    const list = loadFromDisk();
    const target = list.find((l) => l.id === id && (!organizationId || l.organizationId === organizationId));
    const targetOrgId = organizationId || target?.organizationId || null;

    const filtered = list.filter((l) => {
      if (l.id !== id) return true;
      if (organizationId && l.organizationId !== organizationId) return true;
      return false;
    });
    saveToDisk(filtered);
    sseBroker.broadcast("lead_deleted", { id, organizationId: targetOrgId });

    try {
      if (organizationId) {
        queryDb('DELETE FROM "Lead" WHERE "id" = $1 AND "organizationId" = $2', [id, organizationId])
          .catch((err) => console.warn("[DB_LEAD_DELETE_FAIL]", err.message));
      } else {
        queryDb('DELETE FROM "Lead" WHERE "id" = $1', [id])
          .catch((err) => console.warn("[DB_LEAD_DELETE_FAIL]", err.message));
      }
    } catch (e) {}

    return { success: true };
  },

  clearAll() {
    saveToDisk([]);
    sseBroker.broadcast("leads_cleared", {});
    try {
      queryDb('DELETE FROM "Lead";').catch((err) => console.warn("[DB_CLEAR_LEADS_FAIL]", err.message));
    } catch (e) {}
    return { success: true };
  },
};
