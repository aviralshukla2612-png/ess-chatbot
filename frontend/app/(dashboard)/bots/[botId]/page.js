"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  Play,
  Share2,
  Settings,
  BookOpen,
  MessageSquare,
  Users2,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  FileText,
  Globe,
  ArrowLeft,
  Sparkles,
  Trash2,
  Building2,
  Palette,
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import { useToast, InlineAlert } from "@/components/ui/Toast";
import BotPreviewWidget from "@/components/bots/BotPreviewWidget";
import WebsiteKnowledgeManager from "@/components/knowledge/WebsiteKnowledgeManager";
import DocumentKnowledgeManager from "@/components/knowledge/DocumentKnowledgeManager";
import CompanyKnowledgeBuilder from "@/components/knowledge/CompanyKnowledgeBuilder";
import { botsApi } from "@/lib/api/bots";
import { knowledgeApi } from "@/lib/api/knowledge";
import DeployWebsiteModal from "@/components/bots/DeployWebsiteModal";
import RedesignBotModal from "@/components/bots/RedesignBotModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

function isCompanyProfileDoc(doc) {
  if (!doc) return false;
  const nameLower = String(doc.name || doc.title || "").toLowerCase();
  const typeLower = String(doc.type || "").toLowerCase();
  return (
    typeLower === "company profile" ||
    nameLower.includes("knowledge_profile") ||
    nameLower.includes("knowledge profile") ||
    nameLower.includes("company_profile") ||
    nameLower.includes("company profile") ||
    nameLower.includes("business_knowledge") ||
    nameLower.includes("profile.pdf")
  );
}

function formatDocumentName(doc) {
  if (!doc) return "Knowledge Document";
  const raw = (doc.title || doc.name || "Knowledge Document").trim();
  return raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
}

function BotDetailContent() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const botId = routeParams?.botId || "";
  const queryTab = searchParams?.get("tab");

  const [bot, setBot] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [qas, setQas] = useState([]);
  const [activeTab, setActiveTab] = useState(queryTab || "overview");
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [redesignModalOpen, setRedesignModalOpen] = useState(false);
  const [knowledgeSubtab, setKnowledgeSubtab] = useState("websites");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editable Behavior & Settings state
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    description: "",
    personality: "Professional",
    instructions: "",
    fallbackBehavior: "",
    webhookUrl: "",
    allowedDomains: "",
    status: "Active",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  // Q&A quick add state
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [addingQa, setAddingQa] = useState(false);

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
  }, [queryTab]);

  useEffect(() => {
    let active = true;
    async function loadBotData() {
      setLoading(true);
      setNotFound(false);
      try {
        const [b, docs, qList] = await Promise.all([
          botsApi.getBotById(botId),
          knowledgeApi.getDocuments(botId),
          knowledgeApi.getQAPairs(botId),
        ]);
        if (!active) return;

        if (!b) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const safeDocs = Array.isArray(docs) ? docs : [];
        const safeQas = Array.isArray(qList) ? qList : [];
        setBot(b);
        setDocuments(safeDocs);
        setQas(safeQas);
        setSettingsForm({
          name: b.name || "",
          description: b.description || "",
          personality: b.personality || "Professional",
          instructions: b.instructions || b.systemPrompt || "",
          fallbackBehavior:
            b.fallbackBehavior ||
            "Offer live team callback and capture visitor contact details.",
          webhookUrl: b.webhookUrl || "",
          allowedDomains: Array.isArray(b.allowedDomains)
            ? b.allowedDomains.join(", ")
            : b.allowedDomains || "",
          status: b.status || "Active",
        });

        const hasProfile = safeDocs.some(isCompanyProfileDoc) || safeDocs.length > 0;
        if (!hasProfile && !queryTab) {
          setActiveTab("company-profile");
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (botId) loadBotData();
    return () => {
      active = false;
    };
  }, [botId, queryTab]);

  const handleConfirmDeleteBot = async () => {
    if (!bot) return;
    await botsApi.deleteBot(bot.id);
    router.push("/bots");
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!bot) return;
    setSavingSettings(true);
    setSettingsError("");
    try {
      const parsedDomains = settingsForm.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const res = await fetch(`/api/bots/${encodeURIComponent(bot.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsForm.name.trim() || bot.name,
          description: settingsForm.description.trim(),
          personality: settingsForm.personality,
          instructions: settingsForm.instructions,
          fallbackBehavior: settingsForm.fallbackBehavior,
          webhookUrl: settingsForm.webhookUrl.trim() || "",
          allowedDomains: parsedDomains,
          status: settingsForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save chatbot settings.");
      }
      setBot((prev) => ({ ...prev, ...(data.bot || settingsForm) }));
      toast({
        variant: "success",
        title: "Settings saved",
        message: "Chatbot behavior, instructions, and domain settings updated.",
      });
    } catch (err) {
      setSettingsError(err.message || "Unable to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddQaPair = async (e) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim() || !bot) return;
    setAddingQa(true);
    try {
      await knowledgeApi.addDocument(bot.id, {
        name: `FAQ: ${qaQuestion.trim().slice(0, 60)}`,
        type: "FAQ",
        content: `Q: ${qaQuestion.trim()}\nA: ${qaAnswer.trim()}`,
      });
      setQas((prev) => [
        {
          id: `qa_${Date.now()}`,
          question: qaQuestion.trim(),
          answer: qaAnswer.trim(),
        },
        ...prev,
      ]);
      const updatedDocs = await knowledgeApi.getDocuments(bot.id);
      if (Array.isArray(updatedDocs)) setDocuments(updatedDocs);
      setQaQuestion("");
      setQaAnswer("");
      toast({
        variant: "success",
        title: "Q&A pair indexed",
        message: "Added to your chatbot's vector knowledge base.",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Failed to save Q&A",
        message: err.message || "Please try again.",
      });
    } finally {
      setAddingQa(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl w-1/2 animate-pulse" />
        <StatCardsSkeleton count={4} />
      </div>
    );
  }

  if (notFound || !bot) {
    return (
      <EmptyState
        icon={Bot}
        title="Chatbot not found"
        description="This chatbot does not exist or belongs to a different organization workspace."
        actionLabel="Return to Chatbots"
        onAction={() => router.push("/bots")}
      />
    );
  }

  const hasCompanyProfile = documents.some(isCompanyProfileDoc) || documents.length > 0;

  const handleTabClick = (tabId) => {
    if (
      !hasCompanyProfile &&
      tabId !== "company-profile" &&
      tabId !== "appearance" &&
      tabId !== "overview"
    ) {
      toast({
        variant: "warning",
        title: "Knowledge setup required",
        message: "Complete your Company Profile or add knowledge first so your chatbot can answer accurately.",
      });
      setActiveTab("company-profile");
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 min-w-0 max-w-full">
      {/* Bot Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/bots"
            aria-label="Back to chatbots"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
            style={{
              backgroundColor: `${bot.primaryColor || "#4F46E5"}18`,
              borderColor: `${bot.primaryColor || "#4F46E5"}38`,
            }}
          >
            {bot.avatar || "🤖"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                {bot.name}
              </h1>
              <StatusBadge status={bot.status || "Active"} size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 truncate">
              {bot.description || bot.company || "Workspace AI Assistant"}
            </p>
          </div>
        </div>

        {/* Clean Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabClick("test")}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Playground</span>
          </button>

          <button
            type="button"
            onClick={() => setRedesignModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!hasCompanyProfile) {
                handleTabClick("company-profile");
                return;
              }
              setDeployModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Deploy</span>
          </button>

          <Link
            href={`/bots/${bot.id}/deploy`}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Deploy Widget</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            aria-label="Delete chatbot"
            title="Delete chatbot"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onboarding Alert if No Knowledge Yet */}
      {!hasCompanyProfile && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/12 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm">
                Complete your Company Knowledge Profile
              </h4>
              <p className="text-xs opacity-85 mt-0.5">
                Provide business hours, services, pricing, and FAQs so your chatbot responds with verified facts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("company-profile")}
            className="h-8 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer transition-colors"
          >
            Complete Profile →
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        role="tablist"
        className="border-b border-[var(--border-subtle)] flex items-center gap-5 overflow-x-auto no-scrollbar"
      >
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "knowledge", label: "Knowledge Base", icon: BookOpen, badge: documents.length },
          { id: "company-profile", label: "Company Profile", icon: Building2 },
          { id: "test", label: "Playground", icon: Sparkles },
          { id: "settings", label: "Settings & Instructions", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(t.id)}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "text-[var(--accent-primary)] border-[var(--accent-primary)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] tabular-nums">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Company Profile */}
      {activeTab === "company-profile" && (
        <CompanyKnowledgeBuilder
          initialBotId={bot.id}
          isMandatory={!hasCompanyProfile}
          onDocumentTrained={() => {
            knowledgeApi.getDocuments(bot.id).then((d) => {
              if (Array.isArray(d)) setDocuments(d);
            });
          }}
        />
      )}

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Conversations"
              value={bot.conversationsCount || 0}
              icon={MessageSquare}
              colorScheme="indigo"
            />
            <StatCard
              title="Questions Asked"
              value={bot.questionsCount || 0}
              icon={HelpCircle}
              colorScheme="sky"
            />
            <StatCard
              title="Leads Captured"
              value={bot.leadsCount || 0}
              icon={Users2}
              colorScheme="emerald"
            />
            <StatCard
              title="Knowledge Sources"
              value={documents.length}
              icon={CheckCircle2}
              colorScheme="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                  Indexed Knowledge Sources
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabClick("knowledge")}
                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  Manage sources →
                </button>
              </div>
              {documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents indexed yet"
                  description="Add website URLs, upload PDFs, or write custom notes in the Knowledge Base tab."
                  actionLabel="Add Knowledge"
                  onAction={() => setActiveTab("company-profile")}
                  className="py-8 border-none bg-[var(--bg-subtle)]/40"
                />
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 6).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                        <span
                          className="font-medium text-[var(--text-primary)] truncate"
                          title={d.name}
                        >
                          {formatDocumentName(d)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] font-mono shrink-0">
                        {Array.isArray(d.chunks) ? d.chunks.length : d.chunksCount || 1} chunks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                  System Persona & Behavior
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabClick("settings")}
                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  Edit rules →
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] text-xs space-y-2.5">
                <p className="text-[var(--text-secondary)]">
                  <strong className="font-semibold text-[var(--text-primary)]">Tone:</strong>{" "}
                  {bot.personality || "Professional"}
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                  <strong className="font-semibold text-[var(--text-primary)]">Instructions:</strong>{" "}
                  {bot.instructions ||
                    bot.systemPrompt ||
                    "Ground every response in verified company knowledge and capture visitor commercial intent."}
                </p>
                <p className="text-[var(--text-secondary)]">
                  <strong className="font-semibold text-[var(--text-primary)]">Fallback:</strong>{" "}
                  {bot.fallbackBehavior ||
                    "Offer live team callback and capture visitor contact details."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Knowledge Base */}
      {activeTab === "knowledge" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "websites", label: "Websites", icon: Globe },
              { id: "documents", label: `Documents & Notes (${documents.length})`, icon: FileText },
              { id: "qa", label: `Q&A Pairs (${qas.length})`, icon: HelpCircle },
            ].map((st) => {
              const SubIcon = st.icon;
              const active = knowledgeSubtab === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setKnowledgeSubtab(st.id)}
                  className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    active
                      ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)] font-semibold"
                      : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <SubIcon className="w-4 h-4" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {knowledgeSubtab === "websites" && <WebsiteKnowledgeManager botId={bot.id} />}
          {knowledgeSubtab === "documents" && <DocumentKnowledgeManager botId={bot.id} />}

          {knowledgeSubtab === "qa" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <form
                onSubmit={handleAddQaPair}
                className="lg:col-span-5 bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-3.5 h-fit text-xs"
              >
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                  Add Direct Q&A Pair
                </h3>
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Visitor Question
                  </label>
                  <input
                    type="text"
                    required
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    placeholder="e.g. Do you offer weekend appointments?"
                    className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Verified Answer
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={qaAnswer}
                    onChange={(e) => setQaAnswer(e.target.value)}
                    placeholder="Write the exact answer your assistant should deliver..."
                    className="w-full p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingQa}
                  className="w-full h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingQa ? "Indexing..." : "Save & Index Q&A"}</span>
                </button>
              </form>

              <div className="lg:col-span-7 bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3.5">
                  Indexed Q&A Pairs ({qas.length})
                </h3>
                {qas.length === 0 ? (
                  <EmptyState
                    icon={HelpCircle}
                    title="No Q&A pairs yet"
                    description="Add high-priority visitor questions on the left to guarantee exact, instant answers."
                    className="py-8 border-none bg-[var(--bg-subtle)]/40"
                  />
                ) : (
                  <div className="space-y-2.5">
                    {qas.map((q) => (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 text-xs space-y-1"
                      >
                        <p className="font-semibold text-[var(--text-primary)]">Q: {q.question}</p>
                        <p className="text-[var(--text-secondary)] leading-relaxed">A: {q.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Playground */}
      {activeTab === "test" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col items-center p-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
            <BotPreviewWidget
              botId={bot.id}
              botName={bot.name}
              avatar={bot.avatar}
              primaryColor={bot.primaryColor || "#4F46E5"}
              welcomeMessage={bot.welcomeMessage}
              placeholderText={bot.placeholderText}
              starterQuestions={bot.quickReplies || bot.starterQuestions || []}
              showLeadForm={bot.collectLeads}
            />
          </div>

          <div className="lg:col-span-5 bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-3 text-xs">
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">
              Playground Diagnostics
            </h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Messages sent here stream directly through the production RAG pipeline, semantic search index, and lead qualification engine.
            </p>
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Bot ID</span>
                <code className="font-mono text-[var(--text-primary)]">{bot.id}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Knowledge Sources</span>
                <span className="font-semibold text-[var(--text-primary)]">{documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Persona</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {bot.personality || "Professional"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Streaming Mode</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  SSE Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Editable Settings & Instructions */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] max-w-3xl space-y-5 text-xs"
        >
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Chatbot Behavior, Security & Webhooks
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Update system instructions, fallback rules, domain locking, and lead webhook delivery.
            </p>
          </div>

          {settingsError && <InlineAlert variant="error" message={settingsError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Chatbot Name
              </label>
              <input
                type="text"
                required
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Operational Status
              </label>
              <select
                value={settingsForm.status}
                onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                <option value="Active">Active (Accepting Chats)</option>
                <option value="Draft">Draft</option>
                <option value="Disabled">Disabled (Paused)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Conversational Tone
              </label>
              <select
                value={settingsForm.personality}
                onChange={(e) => setSettingsForm({ ...settingsForm, personality: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                <option value="Professional">Professional & Corporate</option>
                <option value="Helpful & Professional">Helpful & Professional</option>
                <option value="Friendly & Warm">Friendly & Warm</option>
                <option value="Consultative & Advisory">Consultative & Sales-Focused</option>
                <option value="Technical Specialist">Technical Specialist</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Short Description
              </label>
              <input
                type="text"
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                placeholder="Internal workspace description..."
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
              System Instructions & Guardrails
            </label>
            <textarea
              rows={5}
              value={settingsForm.instructions}
              onChange={(e) => setSettingsForm({ ...settingsForm, instructions: e.target.value })}
              placeholder="Define how this assistant should greet visitors, answer domain questions, and qualify leads..."
              className="w-full p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] leading-relaxed font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
              Fallback Behavior (When Answer Is Unknown)
            </label>
            <input
              type="text"
              value={settingsForm.fallbackBehavior}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, fallbackBehavior: e.target.value })
              }
              className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Authorized Widget Domains (CORS Lock)
              </label>
              <input
                type="text"
                value={settingsForm.allowedDomains}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, allowedDomains: e.target.value })
                }
                placeholder="example.com, app.example.com"
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Comma-separated hostnames allowed to embed this chatbot.
              </p>
            </div>

            <div>
              <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Outbound Lead Webhook URL (Optional)
              </label>
              <input
                type="url"
                value={settingsForm.webhookUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, webhookUrl: e.target.value })}
                placeholder="https://crm.yourcompany.com/webhooks/leads"
                className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Receives HMAC-signed JSON payloads when leads are captured.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingSettings ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      )}

      <DeployWebsiteModal
        isOpen={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        bot={bot}
        onBotUpdated={(updated) => setBot((prev) => ({ ...prev, ...updated }))}
      />

      <RedesignBotModal
        isOpen={redesignModalOpen || activeTab === "appearance"}
        onClose={() => {
          setRedesignModalOpen(false);
          if (activeTab === "appearance") setActiveTab("overview");
        }}
        bot={bot}
        onBotUpdated={(updated) => {
          setBot((prev) => ({ ...prev, ...updated }));
          setRedesignModalOpen(false);
          if (activeTab === "appearance") setActiveTab("overview");
        }}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteBot}
        title="Delete Chatbot?"
        description={`Permanently delete "${bot?.name || "this chatbot"}" and all indexed knowledge and widget integrations?`}
        confirmText="Delete Chatbot"
        cancelText="Cancel"
        loadingText="Deleting..."
        variant="danger"
        badgeText="Permanent Action"
      />
    </div>
  );
}

export default function BotDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">
          Loading chatbot workspace...
        </div>
      }
    >
      <BotDetailContent />
    </Suspense>
  );
}
