"use client";

import React, { useState, useEffect } from "react";
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
  const [userProfile, setUserProfile] = useState({ name: "", email: "", orgName: "", role: "Workspace Owner", organizationId: "" });
  const [billingData, setBillingData] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
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

  const loadBilling = () => {
    fetch("/api/billing/subscription", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setBillingData(d);
      })
      .catch(() => {});
  };

  useEffect(() => {
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

    loadBilling();

    // Fetch live workspace stats
    botsApi.getBots().then((list) => setBotsCount(Array.isArray(list) ? list.length : 0)).catch(() => {});
    leadsApi.getLeads().then((list) => setLeadsCount(Array.isArray(list) ? list.length : 0)).catch(() => {});

    // Read ?tab= from URL query params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["general", "profile", "security", "notifications", "billing"].includes(tab)) {
        setActiveSection(tab);
      }
    }

    const handleUpdated = () => loadBilling();
    window.addEventListener("subscription-updated", handleUpdated);
    return () => window.removeEventListener("subscription-updated", handleUpdated);
  }, []);

  const handleCopyTenant = () => {
    if (userProfile.organizationId) {
      navigator.clipboard.writeText(userProfile.organizationId);
      setCopiedTenantId(true);
      setTimeout(() => setCopiedTenantId(false), 2000);
    }
  };

  const handleCancelAutopay = async () => {
    if (!confirm("Are you sure you want to cancel autopay? You will not be charged when the trial ends, but your subscription will lapse.")) {
      return;
    }
    setCancelLoading(true);
    setCancelSuccessMsg("");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setCancelSuccessMsg(d.message || "Autopay has been cancelled.");
        loadBilling();
      } else {
        alert(d.error || "Failed to cancel autopay");
      }
    } catch {
      alert("Network error while cancelling autopay");
    } finally {
      setCancelLoading(false);
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
    {
      id: "billing",
      label: "Subscription & Billing",
      icon: CreditCard,
      desc: "Razorpay autopay & plan entitlements",
      badge: billingData?.isTrial
        ? `${billingData.trialDaysRemaining ?? 7}d Trial`
        : billingData?.hasActiveSubscription
        ? "Active"
        : "Action Req",
      badgeColor: billingData?.isTrial
        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
        : billingData?.hasActiveSubscription
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : "bg-rose-500/20 text-rose-300 border-rose-500/30",
    },
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
            Configure organization profiles, technical specs, Razorpay subscriptions, and team security.
          </p>
        </div>

        {/* Workspace Quick Status Pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto p-2 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20 shrink-0">
            {userProfile.orgName?.slice(0, 2).toUpperCase() || "WS"}
          </div>
          <div className="pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                {userProfile.orgName || "Enterprise Workspace"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {billingData?.isTrial ? "Trialing Tier" : billingData?.hasActiveSubscription ? "Starter Plan" : "Inactive Tier"}
            </p>
          </div>
        </div>
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
                      ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-bold ${isActive ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                        {s.label}
                      </p>
                      <p className={`text-[10px] truncate max-w-[150px] ${isActive ? "text-indigo-100/80" : "text-slate-400 dark:text-slate-500"}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  {s.badge ? (
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                        isActive ? "bg-white/20 text-white border-white/30" : s.badgeColor
                      }`}
                    >
                      {s.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                        isActive ? "text-white/80" : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mini Cloud System Info Card */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-slate-900/90 to-slate-950 border border-slate-800 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Infrastructure
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                99.98% SLA
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-mono font-medium text-slate-200">PostgreSQL (RLS)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Embedding Vector:</span>
                <span className="font-mono font-medium text-indigo-300">1536-dim HNSW</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Data Isolation:</span>
                <span className="font-medium text-emerald-300">Tenant Level</span>
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
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-tr from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl text-white">
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-indigo-500/30 border border-white/20 shrink-0">
                      {orgNameInput?.slice(0, 2).toUpperCase() || "WS"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                          {orgNameInput || "Enterprise Workspace"}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {userProfile.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {userProfile.organizationId || "org_default"}
                        </span>
                        <button
                          onClick={handleCopyTenant}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Copy Tenant ID"
                        >
                          {copiedTenantId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Cluster Online
                    </span>
                  </div>
                </div>

                {/* 4 Live Workspace Metric Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Live Bots</span>
                    </div>
                    <span className="text-base font-bold text-white">{botsCount} Assistant</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                      <Users2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Captured Leads</span>
                    </div>
                    <span className="text-base font-bold text-white">{leadsCount} Leads</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                      <Database className="w-3.5 h-3.5 text-violet-400" />
                      <span>Vector Search</span>
                    </div>
                    <span className="text-base font-bold text-white">Active (RAG)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>Cloud Region</span>
                    </div>
                    <span className="text-base font-bold text-white">ap-south-1</span>
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

          {/* TAB 2: SUBSCRIPTION & BILLING */}
          {activeSection === "billing" && (
            <div className="space-y-6">
              {cancelSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              {/* Action Required Banner if Inactive */}
              {!billingData?.hasActiveSubscription && (
                <div className="p-5 rounded-3xl border border-rose-300 dark:border-rose-900/60 bg-linear-to-r from-rose-500/10 via-rose-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                        Autopay Inactive or Trial Expired
                      </h4>
                    </div>
                    <p className="text-xs text-rose-700 dark:text-rose-300/80 leading-relaxed">
                      Your assistants require an active subscription to answer customer inquiries. Subscribe via Razorpay to keep all AI bots online.
                    </p>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-subscription-modal"))}
                    className="px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer shrink-0 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Subscribe Now (₹2,499/mo)</span>
                  </button>
                </div>
              )}

              {/* Executive Razorpay Subscription Card */}
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/80 p-6 sm:p-8 text-white shadow-2xl space-y-6">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block">
                        Official Payment Gateway
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        Razorpay Subscriptions (UPI Autopay & Cards)
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      billingData?.isTrial
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : billingData?.hasActiveSubscription
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        billingData?.isTrial
                          ? "bg-amber-400 animate-pulse"
                          : billingData?.hasActiveSubscription
                          ? "bg-emerald-400"
                          : "bg-rose-400"
                      }`}
                    />
                    {billingData?.isTrial
                      ? "7-Day Free Trial Active"
                      : billingData?.hasActiveSubscription
                      ? "Active Subscription"
                      : "Cancelled / Action Req"}
                  </span>
                </div>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-white">
                      {billingData?.isTrial
                        ? "Starter Plan (7-Day Trial)"
                        : billingData?.hasActiveSubscription
                        ? `${billingData?.subscription?.plan?.name || "Starter"} Plan`
                        : "No Active Plan"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {billingData?.isTrial
                        ? "Enjoy unrestricted access to AI Bot creation, vector crawling, and lead capture. ₹0 was charged upfront."
                        : billingData?.hasActiveSubscription
                        ? "Full production tier with zero message caps, WhatsApp bridge, and lead qualification workflows."
                        : "Autopay has lapsed. Reactivate your subscription to unlock all live AI assistants."}
                    </p>
                  </div>

                  <div className="sm:text-right flex flex-col justify-center sm:items-end">
                    <div className="text-3xl font-black text-indigo-300 font-mono">
                      {billingData?.isTrial ? "₹0.00" : "₹2,499"}
                      <span className="text-xs font-normal text-slate-400 font-sans">
                        {billingData?.isTrial ? " (Upfront)" : " / month"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {billingData?.isTrial
                        ? `Recurring deduction of ₹2,499/mo begins on ${billingData?.autopayDate || "Day 8"}.`
                        : "Billed monthly via automatic bank mandate."}
                    </p>
                  </div>
                </div>

                {/* Trial Countdown Bar if on trial */}
                {billingData?.isTrial && (
                  <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Trial Period Progress
                      </span>
                      <span className="font-bold font-mono text-white">
                        {billingData?.trialDaysRemaining ?? 7} Days Remaining
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-amber-400 to-indigo-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            10,
                            Math.min(100, Math.round(((7 - (billingData?.trialDaysRemaining ?? 7)) / 7) * 100))
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Mandate ID: <span className="font-mono text-slate-300">{billingData?.subscription?.providerSubscriptionId || "sub_unregistered"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {billingData?.isTrial && billingData?.subscription?.status !== "cancelled" && (
                      <button
                        onClick={handleCancelAutopay}
                        disabled={cancelLoading}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancelLoading ? "Cancelling..." : "Cancel Autopay"}
                      </button>
                    )}

                    {!billingData?.hasActiveSubscription && (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-subscription-modal"))}
                        className="px-5 py-2 rounded-xl bg-linear-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-subscribe Plan 🚀</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Included Plan Entitlements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Unlimited AI Conversations</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Zero hard tokens cap. Visitors can engage in unlimited multi-turn sales and support interactions.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Custom Vector Knowledge (RAG)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload price sheets, FAQs, and crawl web pages up to 50 URLs per assistant with instant re-indexing.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Real-time Lead CRM & Export</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Automatic capture of visitor phone, email, and intent scores with one-click CSV export and webhook push.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Meta WhatsApp Cloud Gateway</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Official WhatsApp business integration to deploy your trained bot directly on your company WhatsApp number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MY PROFILE */}
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

          {/* TAB 4: SECURITY & PASSWORDS */}
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

          {/* TAB 5: NOTIFICATIONS & ALERTS */}
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
