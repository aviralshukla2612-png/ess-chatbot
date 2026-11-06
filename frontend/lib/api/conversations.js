export const conversationsApi = {
  async getConversations(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "All") params.set("status", filters.status);
      if (filters.handlingMode && filters.handlingMode !== "All") params.set("handlingMode", filters.handlingMode);
      if (filters.view) params.set("view", filters.view);
      if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
      if (filters.onlyLeads) params.set("onlyLeads", "true");
      if (filters.search) params.set("search", filters.search);
      if (filters.botId && filters.botId !== "All") params.set("botId", filters.botId);
      if (filters.organizationId) params.set("organizationId", filters.organizationId);

      const res = await fetch(`/api/conversations?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return data.conversations || [];
    } catch (err) {
      console.warn("Falling back to local cache for conversations:", err);
      return [];
    }
  },

  async getConversationsWithCounts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "All") params.set("status", filters.status);
      if (filters.handlingMode && filters.handlingMode !== "All") params.set("handlingMode", filters.handlingMode);
      if (filters.view) params.set("view", filters.view);
      if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
      if (filters.onlyLeads) params.set("onlyLeads", "true");
      if (filters.search) params.set("search", filters.search);
      if (filters.botId && filters.botId !== "All") params.set("botId", filters.botId);
      if (filters.organizationId) params.set("organizationId", filters.organizationId);

      const res = await fetch(`/api/conversations?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return {
        conversations: data.conversations || [],
        counts: data.counts || null,
      };
    } catch (err) {
      return { conversations: [], counts: null };
    }
  },

  async getConversationById(id) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.conversation || null;
    } catch (err) {
      return null;
    }
  },

  async createConversation(data) {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      return resData.conversation;
    } catch (err) {
      console.error("Failed to create conversation via API:", err);
      return null;
    }
  },

  async addMessage(conversationId, message) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      const data = await res.json();
      return data.message;
    } catch (err) {
      console.error("Failed to add message via API:", err);
      return null;
    }
  },

  async markResolved(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      });
      const data = await res.json();
      return data.conversation;
    } catch (err) {
      return null;
    }
  },

  async deleteConversation(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  async clearAll() {
    try {
      const res = await fetch("/api/conversations?clearAll=true", {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  async takeover(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/takeover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async resume(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async assign(conversationId, payload = {}) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async release(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async resolve(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async reopen(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async markRead(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async getNotes(conversationId) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/notes`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.notes || [];
    } catch (err) {
      return [];
    }
  },

  async addNote(conversationId, content) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async getBotControl(botId) {
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(botId)}/bot-control`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async updateBotControl(botId, payload) {
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(botId)}/bot-control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async getTeam() {
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.members || [];
    } catch (err) {
      return [];
    }
  },
};
