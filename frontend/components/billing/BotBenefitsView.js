"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Zap,
  Users2,
  Globe,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Cpu,
  Lock,
  Layers,
  ChevronRight,
  Crown,
  Headphones,
  Send,
} from "lucide-react";

const STATS = [
  {
    label: "Always-On Sales",
    value: "24/7/365",
    desc: "Captures buyers outside office hours",
    icon: Clock,
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25",
  },
  {
    label: "Response Latency",
    value: "1.2s",
    desc: "Instant answers with zero wait queues",
    icon: Zap,
    color: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25",
  },
  {
    label: "Conversion Boost",
    value: "+35%",
    desc: "Higher visitor-to-lead engagement",
    icon: TrendingUp,
    color: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25",
  },
  {
    label: "Routine Automation",
    value: "80%",
    desc: "Of repetitive inquiries resolved automatically",
    icon: Bot,
    color: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25",
  },
];

const ENTERPRISE_FEATURES = [
  { label: "Multilingual Chat", desc: "English, Hindi & 20+ languages" },
  { label: "Lead Alerts", desc: "Direct Webhook & WhatsApp sync" },
  { label: "Knowledge Gaps", desc: "Auto-detect unanswered questions" },
  { label: "DLT SMS OTP", desc: "100% genuine contact numbers" },
  { label: "ISO 27001 Data", desc: "Dedicated PostgreSQL tenant isolation" },
  { label: "Analytics Suite", desc: "Real-time engagement metrics" },
];

export default function BotBenefitsView({ onGetStarted }) {
  const handleStart = () => {
    if (typeof onGetStarted === "function") {
      onGetStarted();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-trial-modal"));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-8 space-y-10 sm:space-y-14 animate-in fade-in duration-300">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/20 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-indigo-500/20 p-6 sm:p-10 lg:p-14 text-center shadow-xl">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
            <span>AI SALES &amp; CUSTOMER SUPPORT PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
            Deploy Your Custom AI Sales &amp; Support Agent in Minutes
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Transform website visitors into qualified paying customers around the clock. Your AI assistant trains on your company knowledge, answers complex product inquiries in seconds, and captures verified leads automatically.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <button
              type="button"
              onClick={handleStart}
              className="w-full sm:w-auto h-12 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/billing"
              className="w-full sm:w-auto h-12 px-6 rounded-xl border border-[var(--border-default)] hover:border-indigo-500 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>View Plans &amp; Pricing</span>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[var(--text-muted)] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant AI Activation &amp; Setup</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Cancel anytime with 1 click</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full Access to Chatbot &amp; Leads CRM</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATS / ROI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {stat.value}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. CORE BENEFITS (HOW IT HELPS YOUR BUSINESS) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            How Your AI Assistant Powers Business Growth
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Everything you need to automate inquiries, capture high-intent buyers, and scale customer support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-indigo-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Users2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              1. 24/7 Autonomous Lead Capture &amp; Verification
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Never let a potential deal slip through the cracks. The AI assistant warmly welcomes every visitor, identifies buyer intent, and collects verified names, 10-digit phone numbers, and project specifications. Hot leads are instantly dispatched to your CRM or team WhatsApp.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">DLT OTP Verified Numbers</span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">Instant Webhook Sync</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-indigo-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              2. Accurate RAG Knowledge Engine (Zero Hallucinations)
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Train your assistant on your exact company information in minutes. Feed your website URL, product brochures, pricing sheets, and custom FAQs. The bot uses pgvector semantic search to deliver grounded, accurate answers strictly adhering to your policies.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">PDF, DOCX &amp; Website Indexing</span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">Strict Policy Guardrails</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-indigo-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              3. 1-Line Script Website &amp; WhatsApp Integration
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Embedding your custom bot takes less than 60 seconds. Simply paste a single script tag into your website header, Shopify store, WordPress site, or Webflow landing page. Fully responsive, customizable theme colors, and custom avatar branding included.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
              <span className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20">WordPress / Shopify / Next.js</span>
              <span className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20">White-Label Branding</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-indigo-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              4. Real-Time Inbox &amp; 1-Click Human Takeover
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Stay in complete control at all times. The live dashboard streams ongoing visitor chats as they happen. If a high-value customer needs custom negotiation, your sales agents can pause the AI and take over the conversation instantly from any device.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">Live Chat Streaming</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">Instant Agent Handoff</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THREE EASY STEPS */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Fast Onboarding
          </span>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            Up &amp; Running in 3 Simple Steps
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/20">
              1
            </div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">Add Company Knowledge</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Paste your website URL or upload PDF service brochures. Our vector RAG indexes your content in seconds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-purple-500/20">
              2
            </div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">Customize Bot Persona</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Set your bot avatar, brand accent color, tone of voice, and welcome prompt to match your company style.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-emerald-500/20">
              3
            </div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">Embed &amp; Generate Leads</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Copy the embed snippet to your website. Your AI assistant immediately begins qualifying visitors 24/7.
            </p>
          </div>
        </div>
      </div>

      {/* 5. KEY FEATURE HIGHLIGHTS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] text-center">
          Enterprise Features Included in Every Plan
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ENTERPRISE_FEATURES.map((feat, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-center space-y-1"
            >
              <p className="text-xs font-bold text-[var(--text-primary)]">{feat.label}</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. BOTTOM CALL TO ACTION */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/60 via-indigo-950/80 to-purple-950/70 border border-indigo-500/30 p-8 sm:p-12 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Put Your Sales &amp; Support on Autopilot?
          </h3>
          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
            Activate your workspace plan today and launch your custom AI assistant in under 2 minutes. Cancel anytime with one click from your billing dashboard.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStart}
              className="h-12 px-8 rounded-xl bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-sm shadow-xl transition-all transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-indigo-300">
            <span>🔒 Secure Razorpay Payment</span>
            <span>⚡ Instant AI Activation</span>
            <span>🤝 Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
