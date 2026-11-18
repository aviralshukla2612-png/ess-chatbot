"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertCircle,
  Search,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function WebsiteKnowledgeManager({ botId = "bot_aa" }) {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
    crawlScope: "entire",
    maxPages: 50,
    includePatterns: "",
    excludePatterns: "/admin/*, /cart/*, /login/*",
    syncSchedule: "manual",
    permissionConfirmed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pageSearch, setPageSearch] = useState("");

  const [isTestChatOpen, setIsTestChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! Ask me any question to verify answers grounded in your indexed website pages.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const loadWebsites = async () => {
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(botId)}/websites`);
      const data = await res.json();
      if (data.sources) {
        setWebsites(data.sources);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (botId) loadWebsites();
  }, [botId]);

  useEffect(() => {
    const hasActiveCrawl = websites.some(
      (w) => w.status === "Crawling" || w.status === "Pending"
    );
    if (!hasActiveCrawl) return;
    const timer = setInterval(loadWebsites, 3000);
    return () => clearInterval(timer);
  }, [websites]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedWebsite(null);
        setIsTestChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.baseUrl) {
      setFormError("Please enter a valid website URL.");
      return;
    }
    if (!formData.permissionConfirmed) {
      setFormError("Please confirm you are authorized to index this website.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(botId)}/websites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          baseUrl: formData.baseUrl,
          crawlScope: formData.crawlScope,
          maxPages: Number(formData.maxPages) || 50,
          includePatterns: formData.includePatterns
            ? formData.includePatterns.split(",").map((s) => s.trim())
            : [],
          excludePatterns: formData.excludePatterns
            ? formData.excludePatterns.split(",").map((s) => s.trim())
            : [],
          syncSchedule: formData.syncSchedule,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "Failed to initiate website crawl.");
        setSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      setFormData({
        name: "",
        baseUrl: "",
        crawlScope: "entire",
        maxPages: 50,
        includePatterns: "",
        excludePatterns: "/admin/*, /cart/*, /login/*",
        syncSchedule: "manual",
        permissionConfirmed: false,
      });
      loadWebsites();
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncWebsite = async (websiteId) => {
    try {
      await fetch(`/api/websites/${websiteId}/sync`, { method: "POST" });
      loadWebsites();
    } catch {}
  };

  const handleCancelCrawl = async (websiteId) => {
    try {
      await fetch(`/api/websites/${websiteId}/cancel`, { method: "POST" });
      loadWebsites();
    } catch {}
  };

  const handleDeleteWebsite = (websiteId) => {
    const web = websites.find((w) => w.id === websiteId) || { id: websiteId, name: "this website" };
    setConfirmConfig({
      title: "Delete Website Source?",
      description: `Remove "${web.name || web.baseUrl}" and all indexed pages and vector chunks from this chatbot?`,
      confirmText: "Delete Source",
      badgeText: "Knowledge Base",
      variant: "danger",
      onConfirm: async () => {
        await fetch(`/api/websites/${websiteId}`, { method: "DELETE" });
        loadWebsites();
        if (selectedWebsite?.id === websiteId) setSelectedWebsite(null);
      },
    });
  };

  const handleViewPages = async (website) => {
    setSelectedWebsite(website);
    setLoadingPages(true);
    try {
      const res = await fetch(`/api/websites/${website.id}/pages`);
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleToggleExclusion = async (pageId, currentStatus) => {
    const willExclude = currentStatus !== "Excluded";
    try {
      await fetch(`/api/websites/${selectedWebsite.id}/pages/${pageId}/exclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excluded: willExclude }),
      });
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, crawlStatus: willExclude ? "Excluded" : "Indexed" } : p
        )
      );
    } catch {}
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/public/chat/${encodeURIComponent(botId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatMessages.slice(-4),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "No response received.",
          sources: data.sources || [],
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error querying chatbot knowledge." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
              Website Knowledge Ingestion
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Crawl public web pages, extract clean content, and index vector embeddings automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsTestChatOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Test Knowledge</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Website</span>
          </button>
        </div>
      </div>

      {/* Connected Websites */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-[var(--text-primary)]">
              Connected Websites
            </h4>
            <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums">
              ({websites.length})
            </span>
          </div>
          <button
            type="button"
            onClick={loadWebsites}
            aria-label="Refresh websites"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {websites.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Globe}
              title="No websites connected yet"
              description="Connect your public website URL to index documentation, service pages, pricing, and FAQs."
              actionLabel="Connect Website URL"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {websites.map((web) => (
              <div
                key={web.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-subtle)]/40 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {web.name}
                      </span>
                      <StatusBadge status={web.status || "Pending"} size="sm" />
                    </div>

                    <a
                      href={web.baseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] inline-flex items-center gap-1 hover:underline max-w-full truncate"
                    >
                      <span className="truncate">{web.baseUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-[var(--text-muted)] tabular-nums">
                      <span>
                        Indexed: <strong className="text-[var(--text-secondary)]">{web.pagesIndexed || 0} pages</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Discovered: <strong className="text-[var(--text-secondary)]">{web.pagesDiscovered || 0}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Scope: <strong className="text-[var(--text-secondary)] capitalize">{web.crawlScope}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Synced:{" "}
                        <strong className="text-[var(--text-secondary)]">
                          {web.lastSyncedAt ? new Date(web.lastSyncedAt).toLocaleDateString() : "Pending"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleViewPages(web)}
                    className="h-8 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Pages
                  </button>

                  {web.status === "Crawling" ? (
                    <button
                      type="button"
                      onClick={() => handleCancelCrawl(web.id)}
                      className="h-8 px-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/12 text-amber-800 dark:text-amber-300 text-xs font-medium cursor-pointer"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSyncWebsite(web.id)}
                      aria-label="Re-sync website"
                      title="Re-sync website"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteWebsite(web.id)}
                    aria-label="Delete website"
                    title="Delete website"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Website Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Connect Website Source"
        description="Crawl and index public web pages into your chatbot's RAG knowledge store."
      >
        <form onSubmit={handleAddWebsite} className="space-y-4 text-xs">
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/12 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
              Source Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Official Product Docs"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
              Website URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Protected by SSRF validation — loopback and private network addresses are blocked.
            </p>
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
              Crawl Scope
            </label>
            <select
              value={formData.crawlScope}
              onChange={(e) => setFormData({ ...formData, crawlScope: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              <option value="entire">Entire public website (same-origin links & sitemap)</option>
              <option value="homepage">Single URL / Homepage only</option>
              <option value="selected">Matching URL patterns only</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Max Pages
              </label>
              <select
                value={formData.maxPages}
                onChange={(e) => setFormData({ ...formData, maxPages: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                <option value={10}>10 pages</option>
                <option value={50}>50 pages</option>
                <option value={100}>100 pages</option>
                <option value={250}>250 pages</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Sync Schedule
              </label>
              <select
                value={formData.syncSchedule}
                onChange={(e) => setFormData({ ...formData, syncSchedule: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                <option value="manual">Manual</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
              Exclude URL Glob Patterns
            </label>
            <input
              type="text"
              placeholder="/admin/*, /cart/*, /checkout/*"
              value={formData.excludePatterns}
              onChange={(e) => setFormData({ ...formData, excludePatterns: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.permissionConfirmed}
              onChange={(e) => setFormData({ ...formData, permissionConfirmed: e.target.checked })}
              className="mt-0.5 rounded border-[var(--border-strong)] text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              I confirm that I own or am authorized to crawl and index this public website content.
            </span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="h-9 px-4 rounded-lg border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Starting Crawl..." : "Start Crawl & Index"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Indexed Pages Drawer */}
      {selectedWebsite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/55 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedWebsite(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Indexed pages"
            className="bg-[var(--bg-elevated)] h-full w-full max-w-xl shadow-[var(--shadow-modal)] flex flex-col border-l border-[var(--border-subtle)] animate-slide-left"
          >
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                  Indexed Pages · {selectedWebsite.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {pages.length} pages discovered
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWebsite(null)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter pages by URL or title..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-xs bg-[var(--bg-subtle)]/70 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingPages ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  Loading indexed pages...
                </div>
              ) : pages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  No pages recorded yet. Pages appear as the crawler completes.
                </div>
              ) : (
                pages
                  .filter((p) =>
                    pageSearch
                      ? p.url.toLowerCase().includes(pageSearch.toLowerCase()) ||
                        p.title?.toLowerCase().includes(pageSearch.toLowerCase())
                      : true
                  )
                  .map((page) => (
                    <div
                      key={page.id}
                      className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-[var(--text-primary)] truncate">
                            {page.title || page.url}
                          </div>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] inline-flex items-center gap-1 hover:underline max-w-full truncate"
                          >
                            <span className="truncate">{page.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                        <StatusBadge status={page.crawlStatus || "Indexed"} size="sm" />
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                        <span>
                          Chunks: <strong className="text-[var(--text-secondary)]">{page.chunksCount || 0}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleExclusion(page.id, page.crawlStatus)}
                          className="font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                        >
                          {page.crawlStatus === "Excluded" ? "Include in RAG" : "Exclude from RAG"}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Chat Drawer */}
      {isTestChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/55 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTestChatOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Website knowledge playground"
            className="bg-[var(--bg-elevated)] h-full w-full max-w-md shadow-[var(--shadow-modal)] flex flex-col border-l border-[var(--border-subtle)] animate-slide-left"
          >
            <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <div>
                  <h4 className="font-semibold text-sm">Knowledge Playground</h4>
                  <p className="text-[11px] text-indigo-200">Test Q&A against indexed content</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestChatOpen(false)}
                aria-label="Close playground"
                className="p-1 rounded-lg text-indigo-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--bg-canvas)] text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                        Source:{" "}
                        <span className="font-semibold text-[var(--text-secondary)]">
                          {typeof msg.sources[0] === "string"
                            ? msg.sources[0]
                            : msg.sources[0].title || msg.sources[0].url}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl text-xs text-[var(--text-muted)] w-fit">
                  Searching knowledge base...
                </div>
              )}
            </div>

            <form
              onSubmit={handleSendTestMessage}
              className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask a question about your website..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 h-9 px-3 text-xs bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]"
              />
              <button
                type="submit"
                disabled={chatLoading}
                aria-label="Send test question"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || "Confirm"}
        badgeText={confirmConfig?.badgeText}
        variant={confirmConfig?.variant || "danger"}
      />
    </div>
  );
}
