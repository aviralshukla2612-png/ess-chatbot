"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Play,
  Share2,
  ExternalLink,
  Bot,
  Trash2,
  Copy,
  Check,
  Code,
  Globe,
  Download,
  BookOpen,
  Building2,
  Palette,
} from "lucide-react";
import { botsApi } from "@/lib/api/bots";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import DeployWebsiteModal from "@/components/bots/DeployWebsiteModal";
import RedesignBotModal from "@/components/bots/RedesignBotModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchInput from "@/components/ui/SearchInput";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/Skeleton";

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("All");
  const [search, setSearch] = useState("");

  const [deployModalBot, setDeployModalBot] = useState(null);
  const [deployWebsiteBot, setDeployWebsiteBot] = useState(null);
  const [redesignModalBot, setRedesignModalBot] = useState(null);
  const [deleteTargetBot, setDeleteTargetBot] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [modalEmbedTab, setModalEmbedTab] = useState("html");
  const [modalCmsTab, setModalCmsTab] = useState("html");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.role === "SUPER_ADMIN" || d?.activeOrgRole === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const loadBots = async () => {
    try {
      const data = await botsApi.getBots();
      setBots(data || []);
    } catch (err) {
      console.warn("Bots sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadBots, {
    pollingInterval: 5000,
  });

  const handleConfirmDeleteBot = async () => {
    if (!deleteTargetBot) return;
    const botId = deleteTargetBot.id;
    setBots((prev) => prev.filter((b) => b.id !== botId));
    await botsApi.deleteBot(botId);
    setDeleteTargetBot(null);
    await loadBots();
  };

  const activeCount = bots.filter((b) => b.status === "Active").length;
  const draftCount = bots.filter((b) => b.status === "Draft").length;
  const disabledCount = bots.filter((b) => b.status === "Disabled" || b.status === "Inactive").length;

  const filtered = bots.filter((b) => {
    if (filterTab === "Active" && b.status !== "Active") return false;
    if (filterTab === "Draft" && b.status !== "Draft") return false;
    if (filterTab === "Disabled" && b.status !== "Disabled" && b.status !== "Inactive") return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${b.name || ""} ${b.company || ""} ${b.description || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const appOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://emperornexus.com";

  const getEmbedSnippet = (bot) => {
    if (!bot) return "";
    return `<script src="${appOrigin}/widget.js" data-bot-id="${bot.id}" defer></script>`;
  };

  const getConsoleSnippet = (bot) => {
    if (!bot) return "";
    return `(() => {
  const s = document.createElement("script");
  s.src = "${appOrigin}/widget.js";
  s.setAttribute("data-bot-id", "${bot.id}");
  s.setAttribute("data-color", "${bot.primaryColor || "#4F46E5"}");
  s.setAttribute("data-position", "${bot.launcherPosition || "bottom-right"}");
  document.body.appendChild(s);
})();`;
  };

  const handleCopyScript = (bot) => {
    navigator.clipboard.writeText(getEmbedSnippet(bot));
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyConsole = (bot) => {
    navigator.clipboard.writeText(getConsoleSnippet(bot));
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  const handleDownloadSampleHtml = (bot) => {
    if (!bot) return;
    const code = getEmbedSnippet(bot);
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bot.name} - Chatbot Live Embed</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 48px; }
    .card { max-width: 640px; margin: 40px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.06); }
    p { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${bot.name} — Live Widget Demo</h1>
    <p>Your AI assistant launcher is active in the corner of this page.</p>
  </div>
  ${code}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emperor-nexus-${bot.name.toLowerCase().replace(/\s+/g, "-")}-demo.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Chatbots
            </h1>
            <RealtimeBadge isLive={isLive} lastSynced={lastSync} onRefresh={triggerSync} />
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Configure, train, test, and deploy your workspace AI assistants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!loading && !isSuperAdmin && bots.length >= 1 ? (
            <span
              title="Standard workspaces include 1 active chatbot."
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-xs font-medium select-none"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Workspace Limit (1/1 Chatbot)</span>
            </span>
          ) : (
            <Link
              href="/bots/create"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Chatbot</span>
            </Link>
          )}
        </div>
      </div>

      {/* Toolbar: Status Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          activeTab={filterTab}
          onChange={setFilterTab}
          tabs={[
            { id: "All", label: "All", count: bots.length },
            { id: "Active", label: "Active", count: activeCount },
            { id: "Draft", label: "Draft", count: draftCount },
            { id: "Disabled", label: "Disabled", count: disabledCount },
          ]}
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search chatbots..."
          className="w-full sm:w-64"
        />
      </div>

      {/* Loading State */}
      {loading && <CardGridSkeleton count={2} />}

      {/* Zero State */}
      {!loading && bots.length === 0 && (
        <EmptyState
          icon={Bot}
          title="No chatbots created yet"
          description="Launch the guided setup wizard to configure your assistant's industry profile, knowledge base, and website launcher."
          actionLabel="Create Your First Chatbot"
          onAction={() => router.push("/bots/create")}
        />
      )}

      {/* Search Empty State */}
      {!loading && bots.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={Bot}
          title="No matching chatbots"
          description="No chatbots matched your current filter or search query."
          actionLabel="Reset Filters"
          onAction={() => {
            setFilterTab("All");
            setSearch("");
          }}
        />
      )}

      {/* Bot Cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((bot) => {
            const accentHex = bot.primaryColor || "#4F46E5";
            return (
              <div
                key={bot.id}
                className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-[var(--shadow-xs)] transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                      style={{
                        backgroundColor: `${accentHex}18`,
                        borderColor: `${accentHex}38`,
                      }}
                    >
                      {bot.avatar || "🤖"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/bots/${bot.id}`}
                          className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors truncate"
                        >
                          {bot.name}
                        </Link>
                        <StatusBadge status={bot.status || "Active"} size="sm" />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                        {bot.description || bot.company || "Enterprise AI assistant"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetBot(bot)}
                    aria-label={`Delete ${bot.name}`}
                    title="Delete chatbot"
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[var(--border-subtle)] text-xs">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Conversations</span>
                    <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                      {bot.conversationsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Questions</span>
                    <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                      {bot.questionsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Leads Captured</span>
                    <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                      {bot.leadsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Last Active</span>
                    <span className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 block">
                      {bot.lastActive || "Online"}
                    </span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/bots/${bot.id}`}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-2xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Workspace</span>
                    </Link>

                    <Link
                      href={`/bots/${bot.id}?tab=test`}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Playground</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setRedesignModalBot(bot)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium transition-colors cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Appearance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeployModalBot(bot)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Embed Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeployWebsiteBot(bot)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/12 hover:opacity-90 text-emerald-700 dark:text-emerald-300 font-medium transition-opacity cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Deploy Live</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/bots/${bot.id}?tab=company-profile`}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] font-medium transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Company Profile</span>
                    </Link>

                    <Link
                      href={`/bots/${bot.id}?tab=knowledge`}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)] hover:opacity-90 font-medium transition-opacity"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Knowledge Base</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Embed Code Modal */}
      <Modal
        isOpen={Boolean(deployModalBot)}
        onClose={() => setDeployModalBot(null)}
        title={deployModalBot ? `Embed "${deployModalBot.name}"` : "Embed Chatbot"}
        description="Copy the script tag below and paste it right before the closing </body> tag of your website."
        maxWidth="max-w-2xl"
      >
        {deployModalBot && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2.5">
              <button
                type="button"
                onClick={() => setModalEmbedTab("html")}
                className={`h-8 px-3 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalEmbedTab === "html"
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Embed Tag</span>
              </button>
              <button
                type="button"
                onClick={() => setModalEmbedTab("console")}
                className={`h-8 px-3 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  modalEmbedTab === "console"
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                <span>DevTools Console Test (JS)</span>
              </button>
            </div>

            {modalEmbedTab === "html" ? (
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  {getEmbedSnippet(deployModalBot)}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopyScript(deployModalBot)}
                  className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? "Copied" : "Copy HTML"}</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  {getConsoleSnippet(deployModalBot)}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopyConsole(deployModalBot)}
                  className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
                >
                  {copiedConsole ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedConsole ? "Copied" : "Copy JS"}</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/test-embed.html"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
                  <div>
                    <span className="font-semibold block text-[var(--text-primary)]">
                      Open Demo Page
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Test floating widget live
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </a>

              <button
                type="button"
                onClick={() => handleDownloadSampleHtml(deployModalBot)}
                className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                  <div>
                    <span className="font-semibold block text-[var(--text-primary)]">
                      Download Sample HTML
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Local test page
                    </span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="border border-[var(--border-subtle)] rounded-xl p-3.5 bg-[var(--bg-subtle)]/40 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2">
                <span className="font-semibold text-[var(--text-secondary)] mr-1">CMS Guide:</span>
                {["html", "wordpress", "shopify", "webflow"].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setModalCmsTab(plat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer ${
                      modalCmsTab === plat
                        ? "bg-indigo-600 text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {plat.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {modalCmsTab === "html" &&
                  "Open your HTML layout template and paste the script tag right before the closing </body> tag."}
                {modalCmsTab === "wordpress" &&
                  "Install WPCode (Insert Headers and Footers), navigate to Code Snippets → Header & Footer, paste into Footer, and save."}
                {modalCmsTab === "shopify" &&
                  "In Shopify Admin → Online Store → Themes → Edit code, open theme.liquid and paste above </body>."}
                {modalCmsTab === "webflow" &&
                  "In Webflow Project Settings → Custom Code → Footer Code, paste the script tag and publish."}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <Link
                href={`/bots/${deployModalBot.id}/deploy`}
                onClick={() => setDeployModalBot(null)}
                className="text-[var(--accent-primary)] hover:underline font-medium"
              >
                Open Deployment & Verification Studio →
              </Link>
              <button
                type="button"
                onClick={() => setDeployModalBot(null)}
                className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {deployWebsiteBot && (
        <DeployWebsiteModal
          isOpen={Boolean(deployWebsiteBot)}
          onClose={() => setDeployWebsiteBot(null)}
          bot={deployWebsiteBot}
          onBotUpdated={(updated) => {
            setBots((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
          }}
        />
      )}

      {redesignModalBot && (
        <RedesignBotModal
          isOpen={Boolean(redesignModalBot)}
          onClose={() => setRedesignModalBot(null)}
          bot={redesignModalBot}
          onBotUpdated={(updated) => {
            setBots((prev) =>
              prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
            );
            setRedesignModalBot(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTargetBot)}
        onClose={() => setDeleteTargetBot(null)}
        onConfirm={handleConfirmDeleteBot}
        title="Delete Chatbot?"
        description={`Permanently delete "${deleteTargetBot?.name || "this chatbot"}" and its knowledge sources and widget configuration?`}
        confirmText="Delete Chatbot"
        cancelText="Cancel"
        loadingText="Deleting..."
        variant="danger"
        badgeText="Permanent Action"
      />
    </div>
  );
}
