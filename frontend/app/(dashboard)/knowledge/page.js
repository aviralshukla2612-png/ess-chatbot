"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Globe,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Loader2,
  Bot,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import WebsiteKnowledgeManager from "@/components/knowledge/WebsiteKnowledgeManager";
import { knowledgeApi } from "@/lib/api/knowledge";
import { botsApi } from "@/lib/api/bots";

function KnowledgePageContent() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("documents");
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(searchParams?.get("botId") || "");
  const [documents, setDocuments] = useState([]);
  const [qas, setQas] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Modals state
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [newQA, setNewQA] = useState({ question: "", answer: "" });
  const [qaSubmitting, setQaSubmitting] = useState(false);

  // 1. Load bots on mount
  useEffect(() => {
    async function loadBots() {
      try {
        const fetchedBots = await botsApi.getBots();
        setBots(fetchedBots || []);
        if (fetchedBots && fetchedBots.length > 0) {
          const paramId = searchParams?.get("botId");
          const matched = fetchedBots.find((b) => b.id === paramId);
          setSelectedBotId(matched ? matched.id : fetchedBots[0].id);
        }
      } catch (err) {
        console.warn("[KNOWLEDGE_LOAD_BOTS_WARN]", err);
      } finally {
        setLoading(false);
      }
    }
    loadBots();
  }, [searchParams]);

  // 2. Load bot knowledge when selectedBotId changes
  useEffect(() => {
    if (!selectedBotId) return;

    let isMounted = true;
    async function loadBotKnowledge() {
      try {
        setLoading(true);
        const [docs, qList, webs] = await Promise.all([
          knowledgeApi.getDocuments(selectedBotId),
          knowledgeApi.getQAPairs(selectedBotId),
          knowledgeApi.getWebsites(selectedBotId),
        ]);
        if (isMounted) {
          setDocuments(docs || []);
          setQas(qList || []);
          setWebsites(webs || []);
        }
      } catch (err) {
        console.warn("[KNOWLEDGE_LOAD_DATA_WARN]", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBotKnowledge();

    return () => {
      isMounted = false;
    };
  }, [selectedBotId]);

  const processFiles = async (files) => {
    if (!files || files.length === 0 || !selectedBotId) return;
    setUploading(true);
    setUploadError("");

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);

        const newDoc = await knowledgeApi.addDocument(selectedBotId, formData);
        setDocuments((prev) => [newDoc, ...prev]);
      } catch (err) {
        console.error("[FILE_UPLOAD_ERR]", err);
        setUploadError(err.message || `Failed to process ${file.name}`);
      }
    }
    setUploading(false);
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleAddQA = async (e) => {
    e.preventDefault();
    if (!newQA.question || !newQA.answer || !selectedBotId) return;
    setQaSubmitting(true);
    try {
      const created = await knowledgeApi.addQAPair(selectedBotId, newQA);
      setQas([created, ...qas]);
      setNewQA({ question: "", answer: "" });
      setQaModalOpen(false);
    } catch (err) {
      alert(err.message || "Failed to add Q&A pair");
    } finally {
      setQaSubmitting(false);
    }
  };

  const handleDeleteQA = async (id) => {
    if (!selectedBotId) return;
    try {
      await knowledgeApi.deleteQAPair(selectedBotId, id);
      setQas(qas.filter((q) => q.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete Q&A");
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!selectedBotId) return;
    try {
      await knowledgeApi.deleteDocument(selectedBotId, id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete document");
    }
  };

  if (!loading && bots.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Knowledge Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Train your AI assistants with documents, verified answers, and web pages.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center max-w-lg mx-auto space-y-4">
          <Bot className="w-12 h-12 mx-auto text-indigo-500" />
          <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
            No Assistants Found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            You must create at least one AI assistant in your workspace before uploading training documents.
          </p>
          <Link
            href="/bots/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Assistant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Knowledge Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Train your AI bots with documents, verified answers, web pages, and vector embeddings.
          </p>
        </div>

        {/* Bot selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {bots.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Assistant:
              </span>
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white shadow-2xs cursor-pointer"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.companyName || b.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "qa" && (
            <button
              onClick={() => setQaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Q&A Pair
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError("")}
            className="text-neutral-400 hover:text-neutral-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-xs font-semibold">
        {[
          { id: "documents", label: "Documents", icon: FileText, count: documents.length },
          { id: "qa", label: "Questions & Answers", icon: HelpCircle, count: qas.length },
          { id: "websites", label: "Websites", icon: Globe, count: websites.length },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3.5 relative transition-colors cursor-pointer ${
                activeTab === t.id
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className="text-[10px] text-neutral-400 font-mono">({t.count})</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Documents */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,.docx,.txt,.csv"
            className="hidden"
          />

          {/* Uploader Box */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              uploading
                ? "border-indigo-400 bg-indigo-50/20 cursor-wait"
                : isDragging
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]"
                : "border-neutral-300 dark:border-neutral-800 hover:border-indigo-500 bg-white dark:bg-neutral-900 shadow-2xs"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <h4 className="font-semibold text-sm text-indigo-600">
                  Uploading and indexing document in vector store...
                </h4>
                <p className="text-xs text-neutral-400">
                  Extracting text, generating embeddings, and saving chunks to database.
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-indigo-500 mb-2" />
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                  {isDragging ? "Drop your knowledge files here" : "Click to browse or Drag & Drop Knowledge Files Here"}
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Supports PDF, DOCX, TXT, CSV up to 25MB. Files are chunked and embedded in PostgreSQL vector storage.
                </p>
              </>
            )}
          </div>

          {/* Documents Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-xs">Loading assistant knowledge documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700" />
                <p className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">
                  No documents uploaded for this assistant
                </p>
                <p className="text-neutral-500">
                  Upload PDF manuals, product lists, or company FAQs above to train the AI.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 font-medium uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="p-4">File Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Vector Chunks</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Uploaded</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                        <td className="p-4 font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-xs">{doc.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-sm">
                            {doc.type || "FILE"}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-500">{doc.size || "—"}</td>
                        <td className="p-4 font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          {doc.chunks !== undefined ? `${doc.chunks} chunks` : "—"}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={doc.status || "Ready"} size="sm" />
                        </td>
                        <td className="p-4 text-neutral-400">{doc.uploadedDate || "Recently"}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Q&A */}
      {activeTab === "qa" && (
        <div className="space-y-4">
          {qas.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700" />
              <p className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">
                No verified Q&A pairs yet
              </p>
              <p className="text-neutral-500">
                Add authoritative question-and-answer pairs to give your bot exact responses.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {qas.map((qa) => (
                <div
                  key={qa.id}
                  className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        VERIFIED Q&A
                      </span>
                      <span className="text-neutral-400 text-[11px]">{qa.createdDate || qa.uploadedDate || "Active"}</span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {qa.question ? `Q: ${qa.question}` : qa.name}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {qa.answer ? `A: ${qa.answer}` : qa.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteQA(qa.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Websites */}
      {activeTab === "websites" && (
        <WebsiteKnowledgeManager botId={selectedBotId} />
      )}

      {/* Add Q&A Modal */}
      <Modal
        isOpen={qaModalOpen}
        onClose={() => setQaModalOpen(false)}
        title="Add Verified Q&A Pair"
        description="Provide an exact question and authoritative answer for your bot."
      >
        <form onSubmit={handleAddQA} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              User Question
            </label>
            <input
              type="text"
              required
              placeholder="e.g. What is your refund policy?"
              value={newQA.question}
              onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
            />
          </div>
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Verified Answer
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. We offer a full 14-day money-back guarantee..."
              value={newQA.answer}
              onChange={(e) => setNewQA({ ...newQA, answer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQaModalOpen(false)}
              className="px-3.5 py-2 text-neutral-500 hover:bg-neutral-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={qaSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {qaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Q&A
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading knowledge base...</div>}>
      <KnowledgePageContent />
    </React.Suspense>
  );
}
