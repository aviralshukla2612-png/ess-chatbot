import fs from "fs";
import path from "path";
import { sseBroker } from "./sseBroker.js";
import { queryDb } from "./dbPool.js";

function resolveDataFile() {
  const directPath = path.join(process.cwd(), "data", "conversations.json");
  if (fs.existsSync(directPath)) return directPath;
  const frontendPath = path.join(process.cwd(), "frontend", "data", "conversations.json");
  if (fs.existsSync(frontendPath)) return frontendPath;
  if (process.cwd().endsWith("frontend")) return directPath;
  return frontendPath;
}

const SEED_CONVERSATIONS = [];
let memoryCache = null;

const DEFAULT_HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Hours

function loadFromDisk() {
  const dataFile = resolveDataFile();
  try {
    if (!fs.existsSync(dataFile)) {
      const dir = path.dirname(dataFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(SEED_CONVERSATIONS, null, 2), "utf8");
      memoryCache = [...SEED_CONVERSATIONS];
      return memoryCache;
    }
    const raw = fs.readFileSync(dataFile, "utf8");

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Normalize any legacy conversations referencing bot_aa or generic 'Website Visitor' to Indian Standard
      let hasChanges = false;
      memoryCache = parsed.map((c) => {
        let isChanged = false;
        let botId = c.botId;
        let botName = c.botName;
        let visitorName = c.visitorName;
        let visitorLocation = c.visitorLocation;

        if (botId === "bot_aa" || !botId) {
          botId = "bot_1791618269632";
          isChanged = true;
        }
        if (botName === "aa" || !botName) {
          botName = "Emperor AI Assistant";
          isChanged = true;
        }
        if (!visitorName || visitorName === "Website Visitor" || visitorName === "Client Inquiry" || visitorName.startsWith("Client (")) {
          if (c.visitorEmail) {
            visitorName = c.visitorEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
          } else {
            visitorName = "";
          }
          isChanged = true;
        }
        if (!visitorLocation || visitorLocation === "Direct Session") {
          visitorLocation = "Ahmedabad, Gujarat (India)";
          isChanged = true;
        }

        if (isChanged) hasChanges = true;
        return {
          ...c,
          botId,
          botName,
          visitorName,
          visitorLocation,
        };
      });
      if (hasChanges) {
        try {
          fs.writeFileSync(dataFile, JSON.stringify(memoryCache, null, 2), "utf8");
        } catch (e) {}
      }
      return memoryCache;
    }
    fs.writeFileSync(dataFile, JSON.stringify(SEED_CONVERSATIONS, null, 2), "utf8");
    memoryCache = [...SEED_CONVERSATIONS];
    return memoryCache;
  } catch (err) {
    console.error("Error loading conversations store:", err);
    return memoryCache || SEED_CONVERSATIONS;
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
    console.error("Error saving conversations store:", err);
  }
}

export const conversationsStore = {
  getConversations(filters = {}) {
    let list = loadFromDisk();
    if (filters.organizationId) {
      list = list.filter((c) => 
        !c.organizationId || 
        c.organizationId === "org_ess_default" || 
        c.organizationId === filters.organizationId
      );
    }
    if (filters.botId && filters.botId !== "All") {
      list = list.filter((c) => c.botId === filters.botId || c.botName === filters.botId);
    }
    if (filters.status && filters.status !== "All") {
      const s = filters.status.toLowerCase();
      if (s === "open" || s === "active") {
        list = list.filter((c) => c.status !== "Closed" && c.status !== "Resolved" && c.status !== "RESOLVED" && c.status !== "Expired");
      } else if (s === "resolved" || s === "closed") {
        list = list.filter((c) => c.status === "Closed" || c.status?.toUpperCase() === "RESOLVED");
      } else if (s === "human_active" || s === "human") {
        list = list.filter((c) => c.handlingMode === "HUMAN" || c.status === "HUMAN_ACTIVE");
      } else if (s === "waiting_for_human" || s === "waiting") {
        list = list.filter((c) => c.status === "WAITING_FOR_HUMAN");
      } else {
        list = list.filter((c) => c.status?.toLowerCase() === s);
      }
    }
    if (filters.handlingMode && filters.handlingMode !== "All") {
      list = list.filter((c) => (c.handlingMode || "AI").toUpperCase() === filters.handlingMode.toUpperCase());
    }
    if (filters.assignedToId) {
      if (filters.assignedToId === "unassigned") {
        list = list.filter((c) => !c.assignedToId);
      } else {
        list = list.filter((c) => c.assignedToId === filters.assignedToId);
      }
    }
    if (filters.view) {
      const v = filters.view.toLowerCase();
      if (v === "assigned_to_me" && filters.currentUserId) {
        list = list.filter((c) => c.assignedToId === filters.currentUserId);
      } else if (v === "unassigned") {
        list = list.filter((c) => !c.assignedToId && c.status !== "Resolved" && c.status !== "RESOLVED" && c.status !== "Closed");
      } else if (v === "resolved") {
        list = list.filter((c) => c.status === "Closed" || c.status?.toUpperCase() === "RESOLVED");
      } else if (v === "human_active") {
        list = list.filter((c) => c.handlingMode === "HUMAN" || c.status === "HUMAN_ACTIVE");
      } else if (v === "waiting_for_human") {
        list = list.filter((c) => c.status === "WAITING_FOR_HUMAN");
      }
    }
    if (filters.onlyLeads) {
      list = list.filter((c) => c.isLead);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.visitorName?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q) ||
          c.visitorEmail?.toLowerCase().includes(q) ||
          c.visitorPhone?.toLowerCase().includes(q) ||
          c.assignedToName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      );
    }
    // Return sorted newest first
    return [...list].sort(
      (a, b) => new Date(b.updatedAt || b.lastActivityAt || b.createdAt || 0) - new Date(a.updatedAt || a.lastActivityAt || a.createdAt || 0)
    );
  },

  getConversation(id, organizationId = null) {
    const list = loadFromDisk();
    return list.find((c) => {
      if (c.id !== id) return false;
      if (!organizationId) return true;
      const cOrg = c.organizationId || "org_ess_default";
      return cOrg === organizationId || cOrg === "org_ess_default" || organizationId === "org_ess_default";
    }) || null;
  },

  /**
   * Retrieve active conversation for a visitor if within the 24-hour inactivity window
   */
  getActiveConversationForVisitor(visitorId, botId, options = {}) {
    if (!visitorId || !botId) return null;
    const list = loadFromDisk();
    const now = options.now instanceof Date ? options.now : (options.now ? new Date(options.now) : new Date());
    const windowMs = options.windowMs || DEFAULT_HISTORY_WINDOW_MS;

    const matches = list.filter(
      (c) => c.visitorId === visitorId &&
             (c.botId === botId || c.botId === `bot_${botId}` || (botId.startsWith("bot_") && c.botId === botId.replace("bot_", ""))) &&
             c.status !== "Closed"
    );

    if (matches.length === 0) return null;

    // Sort newest activity first
    matches.sort((a, b) => {
      const tA = new Date(a.lastActivityAt || a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.lastActivityAt || b.updatedAt || b.createdAt || 0).getTime();
      return tB - tA;
    });

    const latest = matches[0];
    const lastActivityTime = new Date(latest.lastActivityAt || latest.updatedAt || latest.createdAt || 0).getTime();
    const expiryTime = latest.historyExpiresAt
      ? new Date(latest.historyExpiresAt).getTime()
      : (lastActivityTime + windowMs);

    // If current time exceeds expiration or 24-hour window from last activity, history has expired
    if (now.getTime() > expiryTime || (now.getTime() - lastActivityTime) > windowMs) {
      return null;
    }

    return latest;
  },

  /**
   * Retrieve the latest conversation regardless of 24h visibility expiry
   * Used to restore qualification and contact state for recognized returning visitors
   */
  getLatestConversationForVisitor(visitorId, botId) {
    if (!visitorId || !botId) return null;
    const list = loadFromDisk();
    const matches = list.filter(
      (c) => c.visitorId === visitorId &&
             (c.botId === botId || c.botId === `bot_${botId}` || (botId.startsWith("bot_") && c.botId === botId.replace("bot_", "")))
    );
    if (matches.length === 0) return null;
    matches.sort((a, b) => {
      const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tB - tA;
    });
    return matches[0];
  },

  createConversation(data) {
    const list = loadFromDisk();
    const now = data.now instanceof Date ? data.now : (data.now ? new Date(data.now) : new Date());
    const id = data.id || `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const lastActivityAt = data.lastActivityAt || now.toISOString();
    const historyExpiresAt = data.historyExpiresAt || new Date(now.getTime() + DEFAULT_HISTORY_WINDOW_MS).toISOString();

    const newConv = {
      id,
      organizationId: data.organizationId || "org_ess_default",
      botId: data.botId || "bot_1791618269632",
      botName: data.botName || "Emperor AI Assistant",
      visitorId: data.visitorId || null,
      leadId: data.leadId || null,
      visitorName:
        data.visitorName && data.visitorName !== "Website Visitor" && data.visitorName !== "Client Inquiry"
          ? data.visitorName
          : (data.visitorEmail ? data.visitorEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()) : ""),
      visitorEmail: data.visitorEmail || "",
      visitorPhone: data.visitorPhone || "",
      visitorLocation:
        data.visitorLocation && data.visitorLocation !== "Direct Session"
          ? data.visitorLocation
          : "Ahmedabad, Gujarat (India)",
      status: data.status || "AI_ACTIVE",
      handlingMode: data.handlingMode || "AI",
      assignedToId: data.assignedToId || null,
      assignedToName: data.assignedToName || null,
      assignedAt: data.assignedAt || null,
      resolvedAt: data.resolvedAt || null,
      unreadCount: data.unreadCount || 0,
      isLead: Boolean(data.isLead || data.visitorEmail || data.visitorPhone),
      leadScore: data.leadScore || (data.visitorEmail ? "High" : "Medium"),
      startedAt: now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST",
      duration: "1 min",
      messagesCount: data.messages?.length || 1,
      questionsCount: data.messages?.filter((m) => m.role === "user").length || 1,
      lastMessage: data.lastMessage || (data.messages?.[data.messages.length - 1]?.content) || "",
      lastActivityAt,
      historyExpiresAt,
      qualification: data.qualification || null,
      notes: data.notes || [],
      assignmentHistory: data.assignmentHistory || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      messages: data.messages || [],
    };

    list.unshift(newConv);
    saveToDisk(list);

    // Broadcast in real-time
    sseBroker.broadcast("conversation_created", newConv);

    // Sync to PostgreSQL
    try {
      queryDb(
        `INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorId", "leadId", "visitorName", "visitorEmail", "visitorPhone", "visitorLocation", "status", "handlingMode", "assignedToId", "assignedToName", "assignedAt", "unreadCount", "isLead", "leadScore", "lastMessage", "qualificationState", "lastActivityAt", "historyExpiresAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
         ON CONFLICT ("id") DO UPDATE 
         SET "visitorId" = COALESCE(EXCLUDED."visitorId", "Conversation"."visitorId"),
             "handlingMode" = COALESCE(EXCLUDED."handlingMode", "Conversation"."handlingMode"),
             "assignedToId" = COALESCE(EXCLUDED."assignedToId", "Conversation"."assignedToId"),
             "assignedToName" = COALESCE(EXCLUDED."assignedToName", "Conversation"."assignedToName"),
             "lastActivityAt" = EXCLUDED."lastActivityAt",
             "historyExpiresAt" = EXCLUDED."historyExpiresAt",
             "qualificationState" = EXCLUDED."qualificationState",
             "updatedAt" = NOW();`,
        [
          newConv.id,
          newConv.organizationId,
          newConv.botId,
          newConv.visitorId,
          newConv.leadId,
          newConv.visitorName,
          newConv.visitorEmail,
          newConv.visitorPhone,
          newConv.visitorLocation,
          newConv.status,
          newConv.handlingMode,
          newConv.assignedToId,
          newConv.assignedToName,
          newConv.assignedAt,
          newConv.unreadCount,
          newConv.isLead,
          newConv.leadScore,
          newConv.lastMessage,
          JSON.stringify(newConv.qualification || {}),
          newConv.lastActivityAt,
          newConv.historyExpiresAt,
          newConv.createdAt,
          newConv.updatedAt,
        ]
      ).catch((err) => console.warn("[DB_CONVERSATION_INSERT_FAIL]", err.message));
    } catch (e) {}

    return newConv;
  },

  addMessage(conversationId, message, options = {}) {
    const list = loadFromDisk();
    let conv = list.find((c) => c.id === conversationId);
    const now = options.now instanceof Date ? options.now : (options.now ? new Date(options.now) : new Date());

    if (!conv) {
      conv = this.createConversation({
        id: conversationId,
        botId: options.botId || message.botId || "bot_1791618269632",
        botName: options.botName || message.botName || "Emperor AI Assistant",
        organizationId: options.organizationId || message.organizationId || "org_ess_default",
        visitorId: options.visitorId || null,
        visitorName: message.role === "user" ? (options.visitorName || "Client Inquiry") : (options.botName || "Emperor AI Assistant"),
        messages: [],
        now,
      });
      if (!list.some((c) => c.id === conversationId)) {
        list.unshift(conv);
      }
    }

    const role = message.role || "user";
    const senderType = message.senderType || (role === "agent" ? "human" : role === "user" ? "visitor" : role === "system" ? "system" : "bot");
    const senderId = message.senderId || (senderType === "human" ? (options.agentId || null) : null);
    const senderName = message.senderName || (senderType === "human" ? (options.agentName || "Agent") : null);

    const newMsg = {
      id: message.id || `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role,
      senderType,
      senderId,
      senderName,
      content: message.content || message.text || "",
      quickReplies: message.quickReplies || [],
      sources: message.sources || [],
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };

    conv.messages = [...(conv.messages || []), newMsg];
    conv.messagesCount = conv.messages.length;
    conv.questionsCount = conv.messages.filter((m) => m.role === "user").length;
    conv.lastMessage = newMsg.content;
    conv.lastActivityAt = now.toISOString();
    conv.historyExpiresAt = new Date(now.getTime() + DEFAULT_HISTORY_WINDOW_MS).toISOString();
    conv.updatedAt = now.toISOString();

    // Manage unread count
    if (role === "user") {
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    } else if (senderType === "human") {
      conv.unreadCount = 0;
    }

    if (options.visitorId && !conv.visitorId) {
      conv.visitorId = options.visitorId;
    }
    if (options.qualification) {
      conv.qualification = options.qualification;
    }

    saveToDisk(list);

    // Broadcast in real-time to all connected dashboards and visitors
    sseBroker.broadcast("message_added", {
      conversationId: conv.id,
      organizationId: conv.organizationId,
      message: newMsg,
      conversation: conv,
    });
    sseBroker.broadcast("message:new", {
      conversationId: conv.id,
      organizationId: conv.organizationId,
      message: newMsg,
      conversation: conv,
    });

    // Dual-write message to PostgreSQL
    try {
      (async () => {
        // Ensure parent Conversation exists before inserting child Message
        await queryDb(
          `INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorId", "visitorName", "status", "handlingMode", "assignedToId", "assignedToName", "unreadCount", "lastActivityAt", "historyExpiresAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT ("id") DO NOTHING;`,
          [
            conv.id,
            conv.organizationId || "org_ess_default",
            conv.botId || "bot_1791618269632",
            conv.visitorId || null,
            conv.visitorName || "Client Inquiry",
            conv.status || "Active",
            conv.handlingMode || "AI",
            conv.assignedToId || null,
            conv.assignedToName || null,
            conv.unreadCount || 0,
            conv.lastActivityAt,
            conv.historyExpiresAt,
            conv.createdAt,
            conv.updatedAt,
          ]
        );

        await queryDb(
          `INSERT INTO "Message" ("id", "conversationId", "role", "senderType", "senderId", "senderName", "content", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT ("id") DO NOTHING;`,
          [newMsg.id, conv.id, newMsg.role, newMsg.senderType, newMsg.senderId, newMsg.senderName, newMsg.content, newMsg.createdAt]
        );

        await queryDb(
          `UPDATE "Conversation"
           SET "lastMessage" = $1,
               "lastActivityAt" = $2,
               "historyExpiresAt" = $3,
               "visitorId" = COALESCE($4, "visitorId"),
               "qualificationState" = COALESCE($5, "qualificationState"),
               "unreadCount" = $6,
               "updatedAt" = $7
           WHERE "id" = $8;`,
          [
            newMsg.content,
            conv.lastActivityAt,
            conv.historyExpiresAt,
            conv.visitorId,
            conv.qualification ? JSON.stringify(conv.qualification) : null,
            conv.unreadCount || 0,
            conv.updatedAt,
            conv.id,
          ]
        );
      })().catch((err) => console.warn("[DB_MESSAGE_INSERT_FAIL]", err.message));
    } catch (e) {}

    return { message: newMsg, conversation: conv };
  },

  updateConversation(id, updates = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: now.toISOString(),
    };

    saveToDisk(list);
    sseBroker.broadcast("conversation_updated", list[index]);

    try {
      const c = list[index];
      queryDb(
        `UPDATE "Conversation"
         SET "visitorName" = COALESCE($1, "visitorName"),
             "visitorEmail" = COALESCE($2, "visitorEmail"),
             "visitorPhone" = COALESCE($3, "visitorPhone"),
             "status" = COALESCE($4, "status"),
             "qualificationState" = COALESCE($5, "qualificationState"),
             "visitorId" = COALESCE($6, "visitorId"),
             "updatedAt" = NOW()
         WHERE "id" = $7;`,
        [
          c.visitorName,
          c.visitorEmail,
          c.visitorPhone,
          c.status,
          c.qualification ? JSON.stringify(c.qualification) : null,
          c.visitorId,
          id,
        ]
      ).catch((err) => console.warn("[DB_CONVERSATION_UPDATE_FAIL]", err.message));
    } catch (e) {}

    return list[index];
  },

  closeConversation(id) {
    return this.updateConversation(id, { status: "Closed" });
  },

  /**
   * Scheduled cleanup process for expired conversations past retention window
   * Safe, idempotent, observable
   */
  cleanupExpiredConversations(options = {}) {
    const list = loadFromDisk();
    const now = options.now instanceof Date ? options.now : (options.now ? new Date(options.now) : new Date());
    let modified = 0;

    list.forEach((c) => {
      const exp = c.historyExpiresAt ? new Date(c.historyExpiresAt).getTime() : 0;
      if (exp > 0 && now.getTime() > exp && c.status === "Active") {
        c.status = "Expired";
        c.updatedAt = now.toISOString();
        modified++;
      }
    });

    if (modified > 0) {
      saveToDisk(list);
    }

    try {
      queryDb(
        `UPDATE "Conversation"
         SET "status" = 'Expired', "updatedAt" = NOW()
         WHERE "status" = 'Active' AND "historyExpiresAt" < NOW();`
      ).catch((e) => {});
    } catch (e) {}

    return { cleanedCount: modified };
  },

  deleteConversation(id, organizationId = null) {
    const list = loadFromDisk();
    const target = list.find((c) => c.id === id && (!organizationId || c.organizationId === organizationId));
    const targetOrgId = organizationId || target?.organizationId || null;

    const filtered = list.filter((c) => {
      if (c.id !== id) return true;
      if (organizationId && c.organizationId !== organizationId) return true;
      return false;
    });
    saveToDisk(filtered);
    sseBroker.broadcast("conversation_deleted", { id, organizationId: targetOrgId });

    try {
      if (organizationId) {
        queryDb('DELETE FROM "Conversation" WHERE "id" = $1 AND "organizationId" = $2;', [id, organizationId]).catch((e) => {});
      } else {
        queryDb('DELETE FROM "Conversation" WHERE "id" = $1;', [id]).catch((e) => {});
      }
    } catch (e) {}

    return { success: true };
  },

  demoteLead(conversationId) {
    const list = loadFromDisk();
    const conv = list.find((c) => c.id === conversationId);
    if (conv) {
      conv.isLead = false;
      saveToDisk(list);
      try {
        queryDb('UPDATE "Conversation" SET "isLead" = false, "updatedAt" = NOW() WHERE "id" = $1;', [conversationId]).catch(() => {});
      } catch (e) {}
    }
  },

  clearAllLeads() {
    const list = loadFromDisk();
    list.forEach((c) => {
      c.isLead = false;
    });
    saveToDisk(list);
    try {
      queryDb('UPDATE "Conversation" SET "isLead" = false, "updatedAt" = NOW();').catch(() => {});
    } catch (e) {}
  },

  takeoverConversation(id, agentUser = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    const agentId = agentUser.id || "agent_admin";
    const agentName = agentUser.name || agentUser.email || "Support Agent";

    const prevConv = list[index];

    // Atomically change handlingMode and status
    list[index] = {
      ...prevConv,
      handlingMode: "HUMAN",
      status: "HUMAN_ACTIVE",
      assignedToId: agentId,
      assignedToName: agentName,
      assignedAt: now.toISOString(),
      unreadCount: 0,
      updatedAt: now.toISOString(),
    };

    // Add a system event message in chat history
    const sysMsg = {
      id: `m_sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: "system",
      senderType: "system",
      content: `Human takeover active. Agent ${agentName} is now handling this conversation.`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };
    list[index].messages = [...(list[index].messages || []), sysMsg];
    list[index].lastActivityAt = now.toISOString();

    saveToDisk(list);

    // Broadcast real-time SSE events
    sseBroker.broadcast("conversation_takeover", {
      conversationId: id,
      organizationId: list[index].organizationId,
      agentId,
      agentName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation:takeover", {
      conversationId: id,
      organizationId: list[index].organizationId,
      agentId,
      agentName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation_updated", list[index]);
    sseBroker.broadcast("conversation:updated", list[index]);

    // Dual-write to PostgreSQL
    try {
      queryDb(
        `UPDATE "Conversation"
         SET "handlingMode" = 'HUMAN',
             "status" = 'HUMAN_ACTIVE',
             "assignedToId" = $1,
             "assignedToName" = $2,
             "assignedAt" = $3,
             "unreadCount" = 0,
             "updatedAt" = $4
         WHERE "id" = $5;`,
        [agentId, agentName, now.toISOString(), now.toISOString(), id]
      ).catch(() => {});

      queryDb(
        `INSERT INTO "Message" ("id", "conversationId", "role", "senderType", "content", "createdAt")
         VALUES ($1, $2, 'system', 'system', $3, $4);`,
        [sysMsg.id, id, sysMsg.content, sysMsg.createdAt]
      ).catch(() => {});

      queryDb(
        `INSERT INTO "ConversationAssignment" ("id", "conversationId", "assignedToId", "assignedToName", "assignedById", "assignedByName", "assignedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [`asg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, id, agentId, agentName, agentId, agentName, now.toISOString()]
      ).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  resumeBot(id, agentUser = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    const agentName = agentUser.name || agentUser.email || "Support Agent";

    list[index] = {
      ...list[index],
      handlingMode: "AI",
      status: "AI_RESUMED",
      updatedAt: now.toISOString(),
    };

    const sysMsg = {
      id: `m_sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: "system",
      senderType: "system",
      content: `AI Assistant resumed by ${agentName}. The bot will handle incoming customer inquiries.`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };
    list[index].messages = [...(list[index].messages || []), sysMsg];
    list[index].lastActivityAt = now.toISOString();

    saveToDisk(list);

    sseBroker.broadcast("conversation_resume", {
      conversationId: id,
      organizationId: list[index].organizationId,
      agentName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation:resume", {
      conversationId: id,
      organizationId: list[index].organizationId,
      agentName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation_updated", list[index]);
    sseBroker.broadcast("conversation:updated", list[index]);

    try {
      queryDb(
        `UPDATE "Conversation"
         SET "handlingMode" = 'AI',
             "status" = 'AI_RESUMED',
             "updatedAt" = $1
         WHERE "id" = $2;`,
        [now.toISOString(), id]
      ).catch(() => {});

      queryDb(
        `INSERT INTO "Message" ("id", "conversationId", "role", "senderType", "content", "createdAt")
         VALUES ($1, $2, 'system', 'system', $3, $4);`,
        [sysMsg.id, id, sysMsg.content, sysMsg.createdAt]
      ).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  assignConversation(id, targetUser = {}, assignedByUser = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    const targetId = targetUser.id;
    const targetName = targetUser.name || targetUser.email || "Team Member";
    const byName = assignedByUser.name || assignedByUser.email || "Admin";

    list[index] = {
      ...list[index],
      assignedToId: targetId,
      assignedToName: targetName,
      assignedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const sysMsg = {
      id: `m_sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: "system",
      senderType: "system",
      content: `Conversation assigned to ${targetName} by ${byName}.`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };
    list[index].messages = [...(list[index].messages || []), sysMsg];

    saveToDisk(list);

    sseBroker.broadcast("conversation_assigned", {
      conversationId: id,
      organizationId: list[index].organizationId,
      targetId,
      targetName,
      assignedBy: byName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation:assigned", {
      conversationId: id,
      organizationId: list[index].organizationId,
      targetId,
      targetName,
      assignedBy: byName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation_updated", list[index]);
    sseBroker.broadcast("conversation:updated", list[index]);

    try {
      queryDb(
        `UPDATE "Conversation"
         SET "assignedToId" = $1, "assignedToName" = $2, "assignedAt" = $3, "updatedAt" = $3
         WHERE "id" = $4;`,
        [targetId, targetName, now.toISOString(), id]
      ).catch(() => {});

      queryDb(
        `INSERT INTO "ConversationAssignment" ("id", "conversationId", "assignedToId", "assignedToName", "assignedById", "assignedByName", "assignedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [`asg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, id, targetId, targetName, assignedByUser.id || null, byName, now.toISOString()]
      ).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  unassignConversation(id, unassignedByUser = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    const byName = unassignedByUser.name || unassignedByUser.email || "Admin";

    list[index] = {
      ...list[index],
      assignedToId: null,
      assignedToName: null,
      status: "WAITING_FOR_HUMAN",
      updatedAt: now.toISOString(),
    };

    const sysMsg = {
      id: `m_sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: "system",
      senderType: "system",
      content: `Conversation unassigned by ${byName}.`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };
    list[index].messages = [...(list[index].messages || []), sysMsg];

    saveToDisk(list);

    sseBroker.broadcast("conversation_unassigned", {
      conversationId: id,
      organizationId: list[index].organizationId,
      unassignedBy: byName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation:unassigned", {
      conversationId: id,
      organizationId: list[index].organizationId,
      unassignedBy: byName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation_updated", list[index]);
    sseBroker.broadcast("conversation:updated", list[index]);

    try {
      queryDb(
        `UPDATE "Conversation"
         SET "assignedToId" = NULL, "assignedToName" = NULL, "status" = 'WAITING_FOR_HUMAN', "updatedAt" = $1
         WHERE "id" = $2;`,
        [now.toISOString(), id]
      ).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  releaseConversation(id, agentUser = {}) {
    return this.unassignConversation(id, agentUser);
  },

  resolveConversation(id, agentUser = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    const agentName = agentUser.name || agentUser.email || "Agent";

    list[index] = {
      ...list[index],
      status: "RESOLVED",
      resolvedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const sysMsg = {
      id: `m_sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: "system",
      senderType: "system",
      content: `Conversation marked as resolved by ${agentName}.`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };
    list[index].messages = [...(list[index].messages || []), sysMsg];

    saveToDisk(list);

    sseBroker.broadcast("conversation_resolved", {
      conversationId: id,
      organizationId: list[index].organizationId,
      resolvedBy: agentName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation:resolved", {
      conversationId: id,
      organizationId: list[index].organizationId,
      resolvedBy: agentName,
      conversation: list[index],
    });
    sseBroker.broadcast("conversation_updated", list[index]);
    sseBroker.broadcast("conversation:updated", list[index]);

    try {
      queryDb(
        `UPDATE "Conversation"
         SET "status" = 'RESOLVED', "resolvedAt" = $1, "updatedAt" = $1
         WHERE "id" = $2;`,
        [now.toISOString(), id]
      ).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  reopenConversation(id, agentUser = {}) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const now = new Date();
    const agentName = agentUser.name || agentUser.email || "Agent";

    list[index] = {
      ...list[index],
      status: list[index].handlingMode === "HUMAN" ? "HUMAN_ACTIVE" : "Active",
      resolvedAt: null,
      updatedAt: now.toISOString(),
    };

    const sysMsg = {
      id: `m_sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      role: "system",
      senderType: "system",
      content: `Conversation reopened by ${agentName}.`,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.toISOString(),
    };
    list[index].messages = [...(list[index].messages || []), sysMsg];

    saveToDisk(list);

    sseBroker.broadcast("conversation_updated", list[index]);
    sseBroker.broadcast("conversation:updated", list[index]);

    try {
      queryDb(
        `UPDATE "Conversation"
         SET "status" = $1, "resolvedAt" = NULL, "updatedAt" = $2
         WHERE "id" = $3;`,
        [list[index].status, now.toISOString(), id]
      ).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  markRead(id) {
    const list = loadFromDisk();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    list[index].unreadCount = 0;
    saveToDisk(list);

    try {
      queryDb('UPDATE "Conversation" SET "unreadCount" = 0, "updatedAt" = NOW() WHERE "id" = $1;', [id]).catch(() => {});
    } catch (e) {}

    return list[index];
  },

  addInternalNote(conversationId, { authorId, authorName, content, organizationId }) {
    if (!content || !content.trim()) return null;
    const list = loadFromDisk();
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) return null;

    const now = new Date();
    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      conversationId,
      organizationId: organizationId || conv.organizationId || "org_ess_default",
      authorId: authorId || null,
      authorName: authorName || "Team Member",
      content: content.trim(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    conv.notes = [...(conv.notes || []), note];
    saveToDisk(list);

    // Broadcast internal note ONLY to dashboard subscribers (never delivered to visitors)
    sseBroker.broadcast("internal_note_added", {
      conversationId,
      organizationId: conv.organizationId,
      note,
    });
    sseBroker.broadcast("internal_note:new", {
      conversationId,
      organizationId: conv.organizationId,
      note,
    });

    try {
      queryDb(
        `INSERT INTO "InternalNote" ("id", "conversationId", "organizationId", "authorId", "authorName", "content", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [note.id, note.conversationId, note.organizationId, note.authorId, note.authorName, note.content, note.createdAt, note.updatedAt]
      ).catch(() => {});
    } catch (e) {}

    return note;
  },

  getInternalNotes(conversationId) {
    const list = loadFromDisk();
    const conv = list.find((c) => c.id === conversationId);
    return conv?.notes || [];
  },

  clearAll() {
    saveToDisk([]);
    sseBroker.broadcast("conversations_cleared", {});
    try {
      queryDb('DELETE FROM "Message";').catch(() => {});
      queryDb('DELETE FROM "InternalNote";').catch(() => {});
      queryDb('DELETE FROM "ConversationAssignment";').catch(() => {});
      queryDb('DELETE FROM "Conversation";').catch(() => {});
    } catch (e) {}
    return { success: true };
  },
};
