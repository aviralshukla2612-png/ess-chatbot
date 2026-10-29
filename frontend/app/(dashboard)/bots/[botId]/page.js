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
  AlertCircle,
  HelpCircle,
  FileText,
  Globe,
  ArrowLeft,
  Sparkles,
  Trash2,
  Building2,
  ShieldAlert,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import BotPreviewWidget from "@/components/bots/BotPreviewWidget";
import WebsiteKnowledgeManager from "@/components/knowledge/WebsiteKnowledgeManager";
import DocumentKnowledgeManager from "@/components/knowledge/DocumentKnowledgeManager";
import CompanyKnowledgeBuilder from "@/components/knowledge/CompanyKnowledgeBuilder";
import { botsApi } from "@/lib/api/bots";
import { knowledgeApi } from "@/lib/api/knowledge";
import DeployWebsiteModal from "@/components/bots/DeployWebsiteModal";

function BotDetailContent() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const botId = routeParams?.botId || "bot_sales_01";
  const queryTab = searchParams?.get("tab");

  const [bot, setBot] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [qas, setQas] = useState([]);
  const [activeTab, setActiveTab] = useState(queryTab || "overview");
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [knowledgeSubtab, setKnowledgeSubtab] = useState("websites");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
  }, [queryTab]);

  useEffect(() => {
    async function loadBotData() {
      const b = await botsApi.getBotById(botId);
      const docs = await knowledgeApi.getDocuments(botId);
      const qList = await knowledgeApi.getQAPairs(botId);
      setBot(b);
      setDocuments(docs);
      setQas(qList);

      const hasProfile = docs.some(
        (d) =>
          d.name?.toLowerCase().includes("knowledge_profile") ||
          d.name?.toLowerCase().includes("company_profile") ||
          d.name?.toLowerCase().includes("business_knowledge") ||
          d.name?.toLowerCase().includes("profile.pdf")
      );
      if (!hasProfile) {
        setActiveTab("company-profile");
      }
      setLoading(false);
    }
    loadBotData();
  }, [botId, queryTab]);

  const router = useRouter();

  const handleDeleteBot = async () => {
    if (confirm(`Are you sure you want to permanently delete "${bot.name}"?`)) {
      await botsApi.deleteBot(bot.id);
      router.push("/bots");
    }
  };

  if (loading || !bot) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-neutral-200/60 dark:bg-neutral-800 rounded-2xl w-1/2" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-200/60 dark:bg-neutral-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasCompanyProfile = documents.some(
    (d) =>
      d.name?.toLowerCase().includes("knowledge_profile") ||
      d.name?.toLowerCase().includes("company_profile") ||
      d.name?.toLowerCase().includes("business_knowledge") ||
      d.name?.toLowerCase().includes("profile.pdf")
  );

  const handleTabClick = (tabId) => {
    if (!hasCompanyProfile && tabId !== "company-profile") {
      alert("⚠️ Mandatory Setup: Please complete and approve your Company Profile Intake form before accessing this section.");
      setActiveTab("company-profile");
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-sans">
      {/* Bot Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/bots"
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs"
            style={{ backgroundColor: `${bot.primaryColor || "#4f46e5"}20` }}
          >
            {bot.avatar || "🤖"}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {bot.name}
              </h1>
              <StatusBadge status={bot.status} />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {bot.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Live Website Deploy Button */}
          <button
            type="button"
            onClick={() => {
              if (!hasCompanyProfile) {
                alert("⚠️ Mandatory Setup: Complete and approve your Company Profile Intake form first.");
                setActiveTab("company-profile");
                return;
              }
              setDeployModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Configure and open live website with chatbot active"
          >
            <Globe className="w-3.5 h-3.5" />
            Live Website Deploy 🚀
          </button>

          {/* Direct Add Information / Knowledge Button */}
          <button
            type="button"
            onClick={() => {
              handleTabClick("knowledge");
              setKnowledgeSubtab("documents");
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
            title="Add website URLs, write custom documents, or upload files"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>+ Add Information 📚</span>
          </button>

          <button
            onClick={() => handleTabClick("test")}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Bot {!hasCompanyProfile && "🔒"}</span>
          </button>

          {!hasCompanyProfile ? (
            <button
              type="button"
              onClick={() => handleTabClick("deploy")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-500 cursor-not-allowed"
              title="Complete Company Profile First"
            >
              <Share2 className="w-4 h-4" />
              <span>Deploy Widget 🔒</span>
            </button>
          ) : (
            <Link
              href={`/bots/${bot.id}/deploy`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Deploy Widget
            </Link>
          )}

          {/* Delete Bot Button */}
          <button
            type="button"
            onClick={handleDeleteBot}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            title="Permanently delete this bot"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Delete Bot
          </button>
        </div>
      </div>

      {/* Mandatory Company Profile Banner if Not Configured */}
      {!hasCompanyProfile && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
              <Building2 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 dark:text-amber-100">
                Mandatory Setup Step: Company Profile & Business Hours Required
              </h4>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 mt-0.5">
                Before this bot can answer visitor questions on your live site, complete and approve your company profile form below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("company-profile")}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 shadow-xs cursor-pointer transition-colors"
          >
            Complete Profile Now &rarr;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-xs font-semibold overflow-x-auto">
        {[
          {
            id: "company-profile",
            label: "Company Profile Intake",
            icon: Building2,
            badge: !hasCompanyProfile ? "Mandatory ⚠️" : "Approved ✅",
          },
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
          { id: "test", label: "Interactive Playground", icon: Sparkles },
          { id: "settings", label: "Behavior & Instructions", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              className={`flex items-center gap-2 pb-3.5 relative transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              } ${!hasCompanyProfile && t.id !== "company-profile" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.badge.includes("Mandatory")
                      ? "bg-amber-500 text-slate-950"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {t.badge}
                </span>
              )}
              {!hasCompanyProfile && t.id !== "company-profile" && (
                <span className="text-[10px] text-amber-500 font-mono">🔒</span>
              )}
            </button>
          );
        })}

        <Link
          href={`/bots/${bot.id}/deploy`}
          className="flex items-center gap-1.5 pb-3.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-auto whitespace-nowrap"
        >
          <Share2 className="w-4 h-4 text-indigo-600" />
          <span>External Site Deploy &rarr;</span>
        </Link>
      </div>

      {/* Tab: Company Profile Intake (Mandatory Setup) */}
      {activeTab === "company-profile" && (
        <CompanyKnowledgeBuilder
          initialBotId={bot.id}
          isMandatory={!hasCompanyProfile}
          onDocumentTrained={(doc) => {
            knowledgeApi.getDocuments(bot.id).then(setDocuments);
          }}
        />
      )}

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Conversations"
              value={bot.conversationsCount}
              change="+18%"
              icon={MessageSquare}
              colorScheme="indigo"
            />
            <StatCard
              title="Questions Asked"
              value={bot.questionsCount}
              change="+22%"
              icon={HelpCircle}
              colorScheme="violet"
            />
            <StatCard
              title="Leads Generated"
              value={bot.leadsCount}
              change="+14%"
              icon={Users2}
              colorScheme="emerald"
            />
            <StatCard
              title="Answer Accuracy"
              value={`${bot.answerRate}%`}
              change="+1.5%"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-3">
                Active Knowledge Ingested
              </h3>
              <div className="space-y-2">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {d.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {d.chunks} chunks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-3">
                System Persona & Rules
              </h3>
              <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
                <p className="text-neutral-600 dark:text-neutral-300">
                  <span className="font-bold text-neutral-800 dark:text-white">Style:</span>{" "}
                  {bot.personality} ({bot.responseLength} responses)
                </p>
                <p className="text-neutral-600 dark:text-neutral-300">
                  <span className="font-bold text-neutral-800 dark:text-white">Instructions:</span>{" "}
                  "{bot.instructions}"
                </p>
                <p className="text-neutral-600 dark:text-neutral-300">
                  <span className="font-bold text-neutral-800 dark:text-white">Fallback:</span>{" "}
                  "{bot.fallbackBehavior}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Knowledge */}
      {activeTab === "knowledge" && (
        <div className="space-y-6">
          {/* Subtabs Toolbar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            {[
              { id: "websites", label: "Websites", icon: Globe },
              { id: "documents", label: "Documents & Written Notes", icon: FileText },
              { id: "qa", label: `Q&A Pairs (${qas.length})`, icon: HelpCircle },
            ].map((st) => {
              const SubIcon = st.icon;
              return (
                <button
                  key={st.id}
                  onClick={() => setKnowledgeSubtab(st.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    knowledgeSubtab === st.id
                      ? "bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <SubIcon className="w-4 h-4" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {knowledgeSubtab === "websites" && (
            <WebsiteKnowledgeManager botId={bot.id} />
          )}

          {knowledgeSubtab === "documents" && (
            <DocumentKnowledgeManager botId={bot.id} />
          )}

          {knowledgeSubtab === "qa" && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-4">
                Direct Q&A Pairs ({qas.length})
              </h3>
              <div className="space-y-3">
                {qas.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-xs space-y-1.5"
                  >
                    <p className="font-bold text-neutral-900 dark:text-white">
                      Q: {q.question}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      A: {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Test & Interactive Playground */}
      {activeTab === "test" && (
        <div className="flex flex-col items-center justify-center p-6 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-center mb-6">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Interactive Test Environment
            </h3>
            <p className="text-xs text-neutral-500">
              Converse with {bot.name} directly using the active vector knowledge base.
            </p>
          </div>
          <BotPreviewWidget
            botId={bot.id}
            botName={bot.name}
            avatar={bot.avatar}
            primaryColor={bot.primaryColor}
            welcomeMessage={bot.welcomeMessage}
            placeholderText={bot.placeholderText}
            showLeadForm={bot.collectLeads}
          />
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs max-w-2xl space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Bot Personality
            </label>
            <input
              type="text"
              readOnly
              value={bot.personality}
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              System Instructions
            </label>
            <textarea
              rows={4}
              readOnly
              value={bot.instructions}
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Fallback Behavior
            </label>
            <input
              type="text"
              readOnly
              value={bot.fallbackBehavior}
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
            />
          </div>
        </div>
      )}

      {bot && (
        <DeployWebsiteModal
          isOpen={deployModalOpen}
          onClose={() => setDeployModalOpen(false)}
          bot={bot}
          onBotUpdated={(updated) => setBot(updated)}
        />
      )}
    </div>
  );
}

export default function BotDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading Assistant...</div>}>
      <BotDetailContent />
    </Suspense>
  );
}
