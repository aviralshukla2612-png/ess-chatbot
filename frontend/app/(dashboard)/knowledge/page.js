"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FileText,
  HelpCircle,
  Globe,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Building2,
  Bot,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import KnowledgeGapsModal from "@/components/knowledge/KnowledgeGapsModal";
import WebsiteKnowledgeManager from "@/components/knowledge/WebsiteKnowledgeManager";
import CompanyKnowledgeBuilder from "@/components/knowledge/CompanyKnowledgeBuilder";
import { knowledgeApi } from "@/lib/api/knowledge";
import { botsApi } from "@/lib/api/bots";

export default function KnowledgePage() {
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const [bots, setBots] = useState([]);
  const [activeBotId, setActiveBotId] = useState("");
  const [activeTab, setActiveTab] = useState("documents");
  const [documents, setDocuments] = useState([]);
  const [qas, setQas] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [newQA, setNewQA] = useState({ question: "", answer: "" });
  const [webModalOpen, setWebModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedGap, setSelectedGap] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadKnowledgeForBot = async (botId) => {
    setLoading(true);
    try {
      const [docs, qList, webs, gpList] = await Promise.all([
        knowledgeApi.getDocuments(botId),
        knowledgeApi.getQAPairs(botId),
        knowledgeApi.getWebsites(botId),
        knowledgeApi.getKnowledgeGaps(botId),
      ]);
      setDocuments(docs || []);
      setQas(qList || []);
      setWebsites(webs || []);
      setGaps(gpList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const botList = await botsApi.getBots();
        const safeBots = Array.isArray(botList) ? botList : [];
        if (!mounted) return;
        setBots(safeBots);
        const initialBotId = safeBots[0]?.id || "bot_aa";
        setActiveBotId(initialBotId);
        await loadKnowledgeForBot(initialBotId);
      } catch {
        if (mounted) await loadKnowledgeForBot("bot_aa");
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectBot = async (nextBotId) => {
    setActiveBotId(nextBotId);
    await loadKnowledgeForBot(nextBotId);
  };

  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    const targetBot = activeBotId || "bot_aa";
    setUploading(true);

    try {
      const uploadedDocs = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File exceeds 5 MB limit",
            message: `${file.name} is larger than 5 MB.`,
            variant: "error",
          });
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const saved = await knowledgeApi.addDocument(targetBot, formData);
        if (saved) uploadedDocs.push(saved);
      }
      if (uploadedDocs.length > 0) {
        await loadKnowledgeForBot(targetBot);
        toast({
          title: "Knowledge indexed",
          message: `${uploadedDocs.length} document${uploadedDocs.length > 1 ? "s" : ""} added to vector store.`,
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        message: err.message || "Unable to index uploaded file.",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
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

  const handleAddQA = async (e) => {
    e.preventDefault();
    if (!newQA.question.trim() || !newQA.answer.trim()) return;
    const created = await knowledgeApi.addQAPair(activeBotId || "bot_aa", newQA);
    setQas((prev) => [created, ...prev]);
    setNewQA({ question: "", answer: "" });
    setQaModalOpen(false);
    toast({ title: "Verified Q&A added", variant: "success" });
  };

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    const created = await knowledgeApi.addWebsite(activeBotId || "bot_aa", newUrl.trim());
    setWebsites((prev) => [created, ...prev]);
    setNewUrl("");
    setWebModalOpen(false);
    toast({ title: "Website queued for indexing", variant: "success" });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "document") {
      await knowledgeApi.deleteDocument(activeBotId || "bot_aa", deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast({ title: "Document removed", variant: "info" });
    } else if (deleteTarget.kind === "qa") {
      await knowledgeApi.deleteQAPair(deleteTarget.id);
      setQas((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      toast({ title: "Q&A pair removed", variant: "info" });
    }
    setDeleteTarget(null);
  };

  const handleGapResolved = (gapId) => {
    setGaps((prev) => prev.filter((g) => g.id !== gapId));
    toast({ title: "Knowledge gap resolved", variant: "success" });
  };

  const tabs = [
    {
      id: "company-profile",
      label: "Company Profile Intake",
      icon: Building2,
      badge: "Structured Train",
    },
    { id: "documents", label: "Documents", icon: FileText, count: documents.length },
    { id: "qa", label: "Questions & Answers", icon: HelpCircle, count: qas.length },
    { id: "websites", label: "Websites", icon: Globe, count: websites.length },
    {
      id: "gaps",
      label: "Knowledge Gaps",
      icon: AlertCircle,
      badge: gaps.length > 0 ? `${gaps.length} Open` : null,
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="RAG Vector Knowledge"
        title="Knowledge Engine"
        description="Ground your AI chatbots with verified company profiles, documents, Q&A pairs, crawled websites, and gap resolutions."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {bots.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
                <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <select
                  value={activeBotId}
                  onChange={(e) => handleSelectBot(e.target.value)}
                  aria-label="Select chatbot knowledge base"
                  className="bg-transparent font-semibold text-[var(--text-primary)] outline-hidden cursor-pointer"
                >
                  {bots.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === "qa" && (
              <Button size="sm" icon={Plus} onClick={() => setQaModalOpen(true)}>
                Add Q&A Pair
              </Button>
            )}
            {activeTab === "websites" && (
              <Button size="sm" icon={Plus} onClick={() => setWebModalOpen(true)}>
                Add Website URL
              </Button>
            )}
            <Button
              variant={activeTab === "company-profile" ? "primary" : "secondary"}
              size="sm"
              icon={Building2}
              onClick={() => setActiveTab("company-profile")}
            >
              Company Profile Intake
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-[var(--border-subtle)] flex items-center gap-5 text-xs font-semibold overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3 relative transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                active
                  ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge ? (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {t.badge}
                </span>
              ) : t.count !== undefined ? (
                <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                  ({t.count})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB: Company Profile Intake */}
      {activeTab === "company-profile" && (
        <CompanyKnowledgeBuilder
          botId={activeBotId || "bot_aa"}
          onDocumentTrained={() => {
            loadKnowledgeForBot(activeBotId || "bot_aa");
          }}
        />
      )}

      {/* TAB: Documents */}
      {activeTab === "documents" && (
        <div className="space-y-5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,.docx,.txt,.csv,.md"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-500/8 ring-4 ring-indigo-500/15"
                : "border-[var(--border-strong)] hover:border-indigo-500 bg-[var(--bg-surface)]"
            }`}
          >
            <Upload className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
            <h4 className="font-semibold text-sm text-[var(--text-primary)]">
              {uploading
                ? "Indexing documents into vector store..."
                : isDragging
                ? "Drop your knowledge files here"
                : "Click to browse or drag & drop knowledge files"}
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Supports PDF, DOCX, TXT, MD, CSV up to 5 MB per file. Automatically chunked for RAG retrieval.
            </p>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents indexed yet"
              description="Upload brochures, pricing sheets, or SOP documents above so your chatbot can answer detailed product questions accurately."
              actionLabel="Upload First Document"
              onAction={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider border-b border-[var(--border-subtle)]">
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
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                        <td className="p-4 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate max-w-xs">{doc.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-[10px] bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            {doc.type || "DOC"}
                          </span>
                        </td>
                        <td className="p-4 text-[var(--text-muted)]">{doc.size || "—"}</td>
                        <td className="p-4 font-mono font-semibold text-[var(--text-secondary)] tabular-nums">
                          {doc.chunks ?? 1} chunks
                        </td>
                        <td className="p-4">
                          <StatusBadge status={doc.status || "Ready"} size="sm" />
                        </td>
                        <td className="p-4 text-[var(--text-muted)]">
                          {doc.uploadedDate || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Recently")}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ kind: "document", id: doc.id, label: doc.name })
                            }
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Delete ${doc.name}`}
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
            </div>
          )}
        </div>
      )}

      {/* TAB: Q&A */}
      {activeTab === "qa" && (
        <div className="space-y-4">
          {qas.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No Q&A pairs configured"
              description="Add authoritative question-and-answer pairs for high-frequency pricing, refund, or onboarding inquiries."
              actionLabel="Add Q&A Pair"
              onAction={() => setQaModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {qas.map((qa) => (
                <div
                  key={qa.id}
                  className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded">
                        VERIFIED Q&A
                      </span>
                      <span className="text-[var(--text-muted)] text-[11px]">{qa.createdDate}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      Q: {qa.question}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      A: {qa.answer}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ kind: "qa", id: qa.id, label: qa.question })
                    }
                    className="p-2 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    aria-label="Delete Q&A pair"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Websites */}
      {activeTab === "websites" && (
        <WebsiteKnowledgeManager botId={activeBotId || "bot_aa"} />
      )}

      {/* TAB: Knowledge Gaps */}
      {activeTab === "gaps" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                Automated Gap Detection Engine
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                Questions repeatedly asked by visitors without high-confidence vector matches appear here for 1-click resolution.
              </p>
            </div>
          </div>

          {gaps.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="All visitor queries are covered"
              description="No unresolved knowledge gaps detected across recent conversations."
            />
          ) : (
            <div className="space-y-3">
              {gaps.map((gap) => (
                <div
                  key={gap.id}
                  className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        Asked {gap.askedCount} Times
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Category: {gap.suggestedCategory}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      &ldquo;{gap.question}&rdquo;
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      First detected: {gap.firstAsked}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" icon={Sparkles} onClick={() => setSelectedGap(gap)}>
                      Add Answer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await knowledgeApi.ignoreKnowledgeGap(gap.id);
                        setGaps((prev) => prev.filter((g) => g.id !== gap.id));
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Q&A Modal */}
      <Modal
        isOpen={qaModalOpen}
        onClose={() => setQaModalOpen(false)}
        title="Add Verified Q&A Pair"
        description="Provide an exact question and authoritative answer for your chatbot."
      >
        <form onSubmit={handleAddQA} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              User Question
            </label>
            <input
              type="text"
              required
              placeholder="e.g. What is your refund policy?"
              value={newQA.question}
              onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Verified Answer
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. We offer a full 14-day money-back guarantee..."
              value={newQA.answer}
              onChange={(e) => setNewQA({ ...newQA, answer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setQaModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Q&A
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Website Modal */}
      <Modal
        isOpen={webModalOpen}
        onClose={() => setWebModalOpen(false)}
        title="Add Website Source"
        description="Our crawler will extract text content and index reachable public pages."
      >
        <form onSubmit={handleAddWebsite} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/docs"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setWebModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Start Crawling
            </Button>
          </div>
        </form>
      </Modal>

      <KnowledgeGapsModal
        gap={selectedGap}
        isOpen={!!selectedGap}
        onClose={() => setSelectedGap(null)}
        onResolved={handleGapResolved}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.kind === "qa" ? "Delete Q&A Pair?" : "Delete Document?"}
        description={`Are you sure you want to remove "${deleteTarget?.label || "this item"}" from your chatbot's knowledge store?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
