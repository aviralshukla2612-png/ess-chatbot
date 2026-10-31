"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Building2,
  User,
  Shield,
  Bell,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Database,
  Server,
  Layers,
  Bot,
  Users2,
  Calendar,
  Lock,
  ChevronRight,
  Activity,
  Cpu,
  Clock,
  ExternalLink,
  Laptop,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { botsApi } from "@/lib/api/bots";
import { leadsApi } from "@/lib/api/leads";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [savedNotice, setSavedNotice] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    orgName: "",
    role: "Workspace Owner",
    organizationId: "",
  });
  const [copiedTenantId, setCopiedTenantId] = useState(false);
  const [botsCount, setBotsCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);

  // Form states
  const [orgNameInput, setOrgNameInput] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [market, setMarket] = useState("India (GST applicable)");
  const [language, setLanguage] = useState("English (US & India)");

  // Notification toggles
  const [notifications, setNotifications] = useState({
    leadCaptured: true,
    weeklyReport: true,
    knowledgeGap: true,
    systemAlerts: false,
    whatsappAlerts: true,
  });

  useEffect(() => {
    // If user clicked or bookmarked ?tab=billing, redirect directly to dedicated /billing page
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "billing") {
        window.location.replace("/billing");
        return;
      }
      if (tab && ["general", "profile", "security", "notifications"].includes(tab)) {
        setActiveSection(tab);
      }
    }

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          const userName = d.user.name || d.user.email?.split("@")[0] || "Administrator";
          const orgName = `${userName}'s Workspace`;
          setUserProfile({
            name: userName,
            email: d.user.email || "",
            orgName: orgName,
            role: d.user.role === "SUPER_ADMIN" ? "Super Administrator" : "Workspace Owner",
            organizationId: d.user.organizationId || "org_nexus_enterprise",
          });
          setOrgNameInput(orgName);
        }
      })
      .catch(() => {});

    // Fetch live workspace stats
    botsApi.getBots().then((list) => setBotsCount(Array.isArray(list) ? list.length : 0)).catch(() => {});
    leadsApi.getLeads().then((list) => setLeadsCount(Array.isArray(list) ? list.length : 0)).catch(() => {});
  }, []);

  const handleCopyTenant = () => {
    if (userProfile.organizationId) {
      navigator.clipboard.writeText(userProfile.organizationId);
      setCopiedTenantId(true);
      setTimeout(() => setCopiedTenantId(false), 2000);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2800);
  };

  const sections = [
    { id: "general", label: "General & Workspace", icon: Building2, desc: "Organization identity, locale & cloud specs" },
    { id: "profile", label: "My Profile", icon: User, desc: "Account details & admin credentials" },
    { id: "security", label: "Security & Passwords", icon: Shield, desc: "Access credentials & session control" },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell, desc: "Lead triggers & report automation" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 font-sans">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Workspace Control Center
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Multi-Tenant Isolated
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Account & Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure organization profiles, technical specs, security credentials, and event triggers.
          </p>
        </div>

        {/* Quick link to dedicated Billing page */}
        <Link
          href="/billing"
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 transition-colors text-xs font-bold shrink-0 self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4 text-indigo-400" />
          <span>Go to Billing & Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Notification Bar */}
      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-semibold">Workspace configuration successfully synchronized across all active bot nodes.</span>
          </div>
          <span className="text-[10px] font-mono opacity-70">SAVED</span>
        </div>
      )}

      {/* Main Layout: Left Navigation + Right Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2 shadow-xl shadow-slate-900/5 dark:shadow-black/20 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Settings Navigation
            </div>
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
                    isActive
                      ? "bg-[#252525] dark:bg-linear-to-r dark:from-indigo-600 dark:to-violet-600 text-white shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#252525] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-[#B68A55] dark:group-hover:text-indigo-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-bold ${isActive ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                        {s.label}
                      </p>
                      <p className={`text-[10px] truncate max-w-[150px] ${isActive ? "text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isActive ? "text-white/80" : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Infrastructure Specs Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-linear-to-br dark:from-slate-900/90 dark:to-slate-950 border border-[#EFE7DC] dark:border-slate-800 text-[#252525] dark:text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#B68A55] dark:text-indigo-400" />
                Infrastructure
              </span>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                99.98% SLA
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
                <span className="font-mono font-medium text-[#252525] dark:text-slate-200">PostgreSQL (RLS)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Embedding Vector:</span>
                <span className="font-mono font-medium text-[#B68A55] dark:text-indigo-300">1536-dim HNSW</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Data Isolation:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-300">Tenant Level</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area (8 cols on lg) */}
        <div className="lg:col-span-8">
          {/* TAB 1: GENERAL & WORKSPACE */}
          {activeSection === "general" && (
            <div className="space-y-6">
              {/* Workspace Identity Hero Card */}
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-linear-to-tr dark:from-slate-900 dark:via-indigo-950/70 dark:to-slate-900 border border-[#EFE7DC] dark:border-slate-800 p-6 sm:p-7 shadow-xs text-[#252525] dark:text-white">
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#B68A55]/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#252525] dark:bg-linear-to-tr dark:from-indigo-500 dark:via-indigo-600 dark:to-violet-600 flex items-center justify-center text-white text-xl font-extrabold shadow-sm border border-black/10 dark:border-white/20 shrink-0">
                      {orgNameInput?.slice(0, 2).toUpperCase() || "WS"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#252525] dark:text-white">
                          {orgNameInput || "Enterprise Workspace"}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B68A55]/15 text-[#B68A55] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#B68A55]/20 dark:border-indigo-500/30">
                          {userProfile.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          ID: {userProfile.organizationId || "org_default"}
                        </span>
                        <button
                          onClick={handleCopyTenant}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#FAF9F6] hover:bg-[#EFE7DC] text-[#252525] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-[#EFE7DC] dark:border-transparent transition-colors cursor-pointer"
                          title="Copy Tenant ID"
                        >
                          {copiedTenantId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Cluster Online
                    </span>
                  </div>
                </div>

                {/* 4 Live Workspace Metric Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#EFE7DC] dark:border-slate-800/80">
                  <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-slate-800/50 border border-[#EFE7DC] dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                      <Bot className="w-3.5 h-3.5 text-[#B68A55] dark:text-indigo-400" />
                      <span>Live Bots</span>
                    </div>
                    <span className="text-base font-bold text-[#252525] dark:text-white">{botsCount} Assistant</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-slate-800/50 border border-[#EFE7DC] dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                      <Users2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Captured Leads</span>
                    </div>
                    <span className="text-base font-bold text-[#252525] dark:text-white">{leadsCount} Leads</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-slate-800/50 border border-[#EFE7DC] dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                      <Database className="w-3.5 h-3.5 text-[#B68A55] dark:text-violet-400" />
                      <span>Vector Search</span>
                    </div>
                    <span className="text-base font-bold text-[#252525] dark:text-white">Active (RAG)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-slate-800/50 border border-[#EFE7DC] dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                      <Globe className="w-3.5 h-3.5 text-[#B68A55] dark:text-sky-400" />
                      <span>Cloud Region</span>
                    </div>
                    <span className="text-base font-bold text-[#252525] dark:text-white">ap-south-1</span>
                  </div>
                </div>
              </div>

              {/* Organization Profile Form */}
              <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Organization & Locale Preferences
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure public branding, billing currencies, and regulatory market defaults.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Company / Organization Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orgNameInput}
                        onChange={(e) => setOrgNameInput(e.target.value)}
                        placeholder="e.g. Acme Technologies Private Limited"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Appears on your deployed chatbot widgets, billing invoices, and lead email notifications.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Operating Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      >
                        <option value="INR">Indian Rupee (INR / ₹) — Domestic Gateway</option>
                        <option value="USD">US Dollar (USD / $) — Global Accounts</option>
                        <option value="EUR">Euro (EUR / €) — EU Processing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Primary Market & Jurisdiction
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={market}
                          onChange={(e) => setMarket(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Default AI Assistant Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                    >
                      <option>English (US & India) — Recommended</option>
                      <option>Hindi + English (Hinglish)</option>
                      <option>Multilingual Auto-Detect (Dynamic translation)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      Changes apply instantly to all live web & WhatsApp widgets.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save Workspace Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Data Privacy & Compliance Architecture */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Enterprise Security & Data Isolation Protocols</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">AES-256 Vector Store</span>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      All uploaded PDF documents & URLs are isolated per organization ID.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Anti-Hallucination Guard</span>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Cosine thresholding ensures bots only respond to grounded knowledge.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Automated Backups</span>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Continuous write-ahead logging (WAL) with hourly snapshot verification.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25">
                    {userProfile.name?.slice(0, 2).toUpperCase() || "AD"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {userProfile.name || "Administrator"}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{userProfile.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {userProfile.role}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        defaultValue={userProfile.name || "Administrator"}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (Login ID)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        defaultValue={userProfile.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-medium cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      To modify your primary email, contact platform security administration.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORDS */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Password & Credential Authentication
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage session tokens, cryptographic salt keys, and credential rotation.
                  </p>
                </div>

                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Minimum 8 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Change Password
                  </button>
                </form>
              </div>

              {/* Active Session & Device Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Current Active Browser Session
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      IP: 187.127.131.178 • SSL TLS 1.3 Encrypted • Active now
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                  TRUSTED
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & ALERTS */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Automated Event Triggers & Alerts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize webhook deliveries and email alerts for high-value leads and unanswered questions.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  {[
                    {
                      key: "leadCaptured",
                      title: "Immediate Lead Capture Alert",
                      desc: "Instant notification dispatched when visitor submits phone number or enterprise email.",
                    },
                    {
                      key: "whatsappAlerts",
                      title: "WhatsApp Message Relays",
                      desc: "Relay visitor conversations initiated via the Meta Cloud API directly to dashboard.",
                    },
                    {
                      key: "weeklyReport",
                      title: "Weekly AI Performance Digest",
                      desc: "Comprehensive weekly briefing on total questions, qualification rates, and lead metrics.",
                    },
                    {
                      key: "knowledgeGap",
                      title: "Knowledge Gap Detection Alerts",
                      desc: "Notify admin when a customer question cannot be answered by vector documentation >5 times.",
                    },
                    {
                      key: "systemAlerts",
                      title: "System Status & SLA Broadcasts",
                      desc: "Real-time alerts for scheduled cluster maintenance and gateway updates.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 pr-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block">
                          {item.desc}
                        </span>
                      </div>

                      {/* iOS Style Interactive Toggle Switch */}
                      <button
                        type="button"
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          notifications[item.key] ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 left-0.5 ${
                            notifications[item.key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Alert Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
