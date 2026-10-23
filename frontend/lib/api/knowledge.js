import { mockDocuments, mockQAPairs, mockWebsites, mockKnowledgeGaps } from "@/lib/mock/data";

let docsStore = [...mockDocuments];
let qaStore = [...mockQAPairs];
let websitesStore = [...mockWebsites];
let gapsStore = [...mockKnowledgeGaps];

export const knowledgeApi = {
  async getDocuments(botId) {
    if (typeof window !== "undefined" && botId) {
      try {
        const res = await fetch(`/api/bots/${botId}/documents`);
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          return data.documents;
        }
      } catch (e) {
        console.warn("Failed to fetch documents from API:", e);
      }
    }
    return docsStore.filter((d) => !botId || d.botId === botId);
  },

  async getDocument(botId, docId) {
    if (typeof window !== "undefined" && botId && docId) {
      try {
        const res = await fetch(`/api/bots/${botId}/documents/${docId}`);
        const data = await res.json();
        if (data.success && data.document) {
          return data.document;
        }
      } catch (e) {
        console.warn("Failed to fetch single document:", e);
      }
    }
    return docsStore.find((d) => d.id === docId) || null;
  },

  async addDocument(botId, docData) {
    if (typeof window !== "undefined" && botId) {
      try {
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
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (e) {
        if (e.message && !e.message.includes("fetch")) throw e;
      }
    }
    const newDoc = {
      id: `doc_${Date.now()}`,
      botId,
      name: docData.name || "Custom Knowledge Note",
      type: docData.type || "Document",
      content: docData.content || "",
      chunks: Math.floor(Math.random() * 8) + 2,
      status: "Ready",
      uploadedDate: new Date().toISOString().split("T")[0],
    };
    docsStore = [newDoc, ...docsStore];
    return newDoc;
  },

  async updateDocument(botId, docId, docData) {
    if (typeof window !== "undefined" && botId && docId) {
      try {
        const res = await fetch(`/api/bots/${botId}/documents/${docId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(docData),
        });
        const data = await res.json();
        if (data.success && data.document) {
          return data.document;
        }
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (e) {
        if (e.message && !e.message.includes("fetch")) throw e;
      }
    }
    const idx = docsStore.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      docsStore[idx] = { ...docsStore[idx], ...docData, updatedAt: new Date().toISOString() };
      return docsStore[idx];
    }
    return null;
  },

  async deleteDocument(botId, id) {
    const docId = id || botId;
    const realBotId = id ? botId : null;
    if (typeof window !== "undefined" && realBotId && docId) {
      try {
        const res = await fetch(`/api/bots/${realBotId}/documents/${docId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          docsStore = docsStore.filter((d) => d.id !== docId);
          return { success: true };
        }
      } catch (e) {
        console.warn("Failed to delete document via API:", e);
      }
    }
    docsStore = docsStore.filter((d) => d.id !== docId);
    return { success: true };
  },

  async getQAPairs(botId) {
    return qaStore.filter((q) => !botId || q.botId === botId);
  },

  async addQAPair(botId, { question, answer }) {
    const newQA = {
      id: `qa_${Date.now()}`,
      botId,
      question,
      answer,
      status: "Active",
      createdDate: new Date().toISOString().split("T")[0],
    };
    qaStore = [newQA, ...qaStore];
    return newQA;
  },

  async deleteQAPair(id) {
    qaStore = qaStore.filter((q) => q.id !== id);
    return { success: true };
  },

  async getWebsites(botId) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId || "bot_sales_01"}/websites`);
        const data = await res.json();
        if (data.sources) return data.sources;
      } catch (e) {}
    }
    return websitesStore.filter((w) => !botId || w.botId === botId);
  },

  async addWebsite(botId, url) {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/bots/${botId || "bot_sales_01"}/websites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseUrl: url }),
        });
        const data = await res.json();
        if (data.source) return data.source;
      } catch (e) {}
    }
    const newWeb = {
      id: `web_${Date.now()}`,
      botId,
      url,
      pagesIndexed: Math.floor(Math.random() * 20) + 5,
      lastCrawled: new Date().toISOString().split("T")[0],
      status: "Ready",
    };
    websitesStore = [newWeb, ...websitesStore];
    return newWeb;
  },

  async getKnowledgeGaps(botId) {
    return gapsStore.filter((g) => !botId || g.botId === botId);
  },

  async resolveKnowledgeGap(gapId, answer) {
    const gap = gapsStore.find((g) => g.id === gapId);
    if (!gap) return null;
    
    // Add to Q&A collection
    const newQA = {
      id: `qa_${Date.now()}`,
      botId: gap.botId,
      question: gap.question,
      answer,
      status: "Active",
      createdDate: new Date().toISOString().split("T")[0],
    };
    qaStore = [newQA, ...qaStore];
    
    // Remove from gaps
    gapsStore = gapsStore.filter((g) => g.id !== gapId);
    return { success: true, newQA };
  },

  async ignoreKnowledgeGap(gapId) {
    gapsStore = gapsStore.filter((g) => g.id !== gapId);
    return { success: true };
  },
};
