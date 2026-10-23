export const knowledgeApi = {
  async getDocuments(botId) {
    if (!botId) return [];
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId}/documents`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          return data.documents;
        }
      } catch (e) {
        console.warn("[KNOWLEDGE_API_GET_DOCS_WARN]", e);
      }
    }
    return [];
  },

  async getDocument(botId, docId) {
    if (!botId || !docId) return null;
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId}/documents/${docId}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.document) {
          return data.document;
        }
      } catch (e) {
        console.warn("[KNOWLEDGE_API_GET_DOC_WARN]", e);
      }
    }
    return null;
  },

  async addDocument(botId, docData) {
    if (!botId) throw new Error("Bot ID is required to upload knowledge");
    if (typeof window !== "undefined") {
      const isFormData = docData instanceof FormData;
      const res = await fetch(`/api/bots/${botId}/documents`, {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body: isFormData ? docData : JSON.stringify(docData),
      });
      const data = await res.json();
      if (data.success && data.document) {
        return data.document;
      }
      throw new Error(data.error || "Failed to add document to knowledge base");
    }
    throw new Error("Client context required to upload documents");
  },

  async updateDocument(botId, docId, docData) {
    if (!botId || !docId) throw new Error("Bot ID and Document ID are required");
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/bots/${botId}/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });
      const data = await res.json();
      if (data.success && data.document) {
        return data.document;
      }
      throw new Error(data.error || "Failed to update document");
    }
    return null;
  },

  async deleteDocument(botId, id) {
    if (!botId || !id) return { success: false, error: "Missing parameters" };
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId}/documents/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          return { success: true };
        }
        throw new Error(data.error || "Failed to delete document");
      } catch (e) {
        console.warn("[KNOWLEDGE_API_DELETE_DOC_WARN]", e);
        throw e;
      }
    }
    return { success: true };
  },

  async getQAPairs(botId) {
    if (!botId) return [];
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId}/documents`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          return data.documents.filter((d) => d.type === "FAQ" || d.type === "Q&A");
        }
      } catch (e) {
        console.warn("[KNOWLEDGE_API_GET_QA_WARN]", e);
      }
    }
    return [];
  },

  async addQAPair(botId, { question, answer }) {
    if (!botId || !question || !answer) throw new Error("Bot ID, question, and answer are required");
    const docData = {
      name: `Q&A: ${question.slice(0, 40)}`,
      type: "FAQ",
      content: `Question: ${question}\nAnswer: ${answer}`,
    };
    return this.addDocument(botId, docData);
  },

  async deleteQAPair(botId, id) {
    return this.deleteDocument(botId, id);
  },

  async getWebsites(botId) {
    if (!botId) return [];
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId}/websites`, { cache: "no-store" });
        const data = await res.json();
        if (data.sources) return data.sources;
      } catch (e) {
        console.warn("[KNOWLEDGE_API_GET_WEBSITES_WARN]", e);
      }
    }
    return [];
  },

  async addWebsite(botId, url) {
    if (!botId || !url) throw new Error("Bot ID and website URL are required");
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/bots/${botId}/websites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: url }),
      });
      const data = await res.json();
      if (data.success && data.source) return data.source;
      throw new Error(data.error || "Failed to add website source");
    }
    throw new Error("Client context required to add website");
  },

  async getKnowledgeGaps(botId) {
    // In production, returns empty or genuine gap queries when implemented
    return [];
  },

  async resolveKnowledgeGap(botId, gapId, answer) {
    return { success: true };
  },

  async ignoreKnowledgeGap(gapId) {
    return { success: true };
  },
};
