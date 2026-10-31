"use client";

import React, { useEffect, useState } from "react";
import {
  Users2,
  Flame,
  PhoneCall,
  CheckCircle2,
  Search,
  Download,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Calendar,
  Bot,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { leadsApi } from "@/lib/api/leads";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";

const ANSWER_LABELS = {
  is_business: "For Business",
  is_redesign: "Build Type",
  website_type: "Website Type",
  budget: "Project Budget",
  timeline: "Target Timeline",
  non_business_type: "Project Purpose",
  needs_admin: "Admin Panel",
  needs_payment: "Online Payments",
  platform: "Target Platform",
  is_new_app: "App Category",
  needs_backend: "Custom Backend",
  needs_integrations: "Third-party Integrations",
  channel: "Chatbot Channel",
  purpose: "Bot Purpose",
  needs_docs: "Document Training (RAG)",
  needs_crm: "CRM Sync",
  system_type: "System Type",
  has_existing_data: "Data Migration",
  needs_role_access: "Role-Based Access",
  design_target: "Design Scope",
  prototype_depth: "Prototypes Required",
  brand_identity: "Brand Guidelines",
  cloud_platform: "Cloud Infrastructure",
  needs_cicd: "Automated CI/CD",
  needs_db_ha: "High Availability DB",
  website_status: "Current Website",
  target_market: "Target Market",
  scope_focus: "SEO Scope",
};

function formatAnswerValue(val) {
  if (val === true || val === "true") return { text: "Yes", type: "yes" };
  if (val === false || val === "false") return { text: "No", type: "no" };
  if (!val) return { text: "Not specified", type: "neutral" };
  return { text: String(val), type: "value" };
}

function getLeadEffectiveAnswers(lead) {
  if (!lead) return {};
  const directAnswers = lead.answers && Object.keys(lead.answers).length > 0 ? lead.answers : null;
  const qualAnswers = lead.qualification?.answers && Object.keys(lead.qualification.answers).length > 0 ? lead.qualification.answers : null;
  if (directAnswers || qualAnswers) {
    return { ...(qualAnswers || {}), ...(directAnswers || {}) };
  }
  // Fallback: parse from inquiry string if present
  if (lead.inquiry && lead.inquiry.includes(":")) {
    const parsed = {};
    const parts = lead.inquiry.split("|").map((p) => p.trim());
    parts.forEach((p) => {
      const idx = p.indexOf(":");
      if (idx > -1) {
        const k = p.slice(0, idx).trim();
        const v = p.slice(idx + 1).trim();
        if (k && v && !k.toLowerCase().includes("inquiry")) {
          parsed[k] = v;
        }
      }
    });
    if (Object.keys(parsed).length > 0) return parsed;
  }
  return {};
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [botFilter, setBotFilter] = useState("All Bots");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadLeads = async () => {
    try {
      const data = await leadsApi.getLeads();
      setLeads(data || []);
    } catch (err) {
      console.warn("Leads real-time sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time synchronization hook (SSE event stream + background polling)
  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadLeads, {
    pollingInterval: 3000,
  });

  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.company?.toLowerCase().includes(search.toLowerCase());
    const matchesBot =
      botFilter === "All Bots" || item.bot === botFilter;
    const matchesStatus =
      statusFilter === "All Status" || item.status === statusFilter;
    return matchesSearch && matchesBot && matchesStatus;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const contactedLeads = leads.filter((l) => l.status === "Contacted").length;
  const convertedLeads = leads.filter((l) => l.status === "Converted").length;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const updateStatus = async (id, newStatus) => {
    await leadsApi.updateLeadStatus(id, newStatus);
    loadLeads();
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252525] dark:text-white">
            Leads & Pipeline CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time inbound lead capture generated automatically by your live chatbots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <RealtimeBadge isLive={isLive} lastSync={lastSync} onRefresh={triggerSync} />
          {leads.length > 0 && (
            <button
              onClick={async () => {
                await leadsApi.clearAll();
                setSelectedLead(null);
                setSelectedIds([]);
                loadLeads();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={() => {
              if (leads.length === 0) {
                alert("No leads captured yet to export.");
                return;
              }
              alert("Exporting leads to CSV...");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0D0D0D] hover:bg-[#FAF9F6] dark:hover:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-800 text-[#252525] dark:text-neutral-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer w-fit"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              {totalLeads}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-neutral-400 mt-1">
              Total Leads
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              {newLeads}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-neutral-400 mt-1">
              New Leads
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100/60 dark:border-rose-800/40 flex items-center justify-center text-rose-500 dark:text-rose-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Contacted */}
        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              {contactedLeads}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-neutral-400 mt-1">
              Contacted
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Converted */}
        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              {convertedLeads}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-neutral-400 mt-1">
              Converted
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-[#EFE7DC] dark:border-slate-700/80 rounded-xl outline-hidden focus:border-[#B68A55] dark:focus:border-indigo-500 text-[#252525] dark:text-white placeholder:text-slate-400 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end overflow-x-auto text-xs">
          <div className="relative">
            <select
              value={botFilter}
              onChange={(e) => setBotFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-[#EFE7DC] dark:border-slate-700/80 rounded-xl text-xs font-medium text-[#252525] dark:text-slate-300 outline-hidden focus:border-[#B68A55] dark:focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Bots">All Bots</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-[#EFE7DC] dark:border-slate-700/80 rounded-xl text-xs font-medium text-[#252525] dark:text-slate-300 outline-hidden focus:border-[#B68A55] dark:focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Converted">Converted</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-[#EFE7DC] dark:border-slate-700/80 rounded-xl text-xs font-medium text-[#252525] dark:text-slate-300 outline-hidden focus:border-[#B68A55] dark:focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 shadow-xs overflow-hidden">
        {!loading && filteredLeads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <Users2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">
              No leads captured yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When visitors interact with your chatbots and show purchase or booking intent, their details will automatically be qualified and saved here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EFE7DC] dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-3.5 pl-5 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredLeads.length > 0 &&
                        selectedIds.length === filteredLeads.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email / Phone</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Bot</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 pr-5 pl-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DC] dark:divide-slate-800 text-[#252525] dark:text-slate-300">
                {filteredLeads.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedLead(item)}
                      className={`hover:bg-[#FAF9F6] dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected ? "bg-amber-50/40 dark:bg-indigo-950/40" : ""
                      }`}
                    >
                      <td
                        className="py-4 pl-5 pr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#252525] dark:text-white">{item.name}</p>
                        {item.inquiry && item.inquiry !== "Inquired via live chat widget" && !item.inquiry.startsWith("Visitor introduced") && (
                          <p className="text-[11px] text-[#B68A55] dark:text-indigo-400 font-medium truncate max-w-xs mt-0.5">
                            {item.inquiry}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        {item.email || item.phone}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {item.company}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {item.bot}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40">
                          {item.score || "High"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        {item.created}
                      </td>
                      <td
                        className="py-4 pr-5 pl-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedLead(item)}
                          className="p-1.5 hover:bg-[#FAF9F6] dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#252525] dark:hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead Profile Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0D0D0D] h-full shadow-2xl border-l border-[#EFE7DC] dark:border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto animate-slide-left text-[#252525] dark:text-neutral-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE7DC] dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {selectedLead.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#252525] dark:text-white">
                      {selectedLead.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLead.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#252525] dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Update Lead Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["New", "Contacted", "Converted"].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(selectedLead.id, st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedLead.status === st
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#252525] dark:text-slate-300 border-[#EFE7DC] dark:border-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-[#EFE7DC] dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs text-[#252525] dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{selectedLead.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#252525] dark:text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{selectedLead.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#252525] dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{selectedLead.company}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#252525] dark:text-slate-300">
                  <Bot className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">Origin: {selectedLead.bot}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#252525] dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">Created: {selectedLead.created}</span>
                </div>
              </div>

              {/* Project Requirements & Scoping Answers Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Project Scope & Answers
                  </label>
                  {selectedLead.budget && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[#B68A55] border border-amber-500/30">
                      Budget: {selectedLead.budget}
                    </span>
                  )}
                </div>

                {selectedLead.inquiry && (
                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100/80 dark:border-indigo-800/60 space-y-1">
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      Requirements Summary
                    </p>
                    <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">
                      {selectedLead.inquiry}
                    </p>
                  </div>
                )}

                {(() => {
                  const effectiveAnswers = getLeadEffectiveAnswers(selectedLead);
                  const entries = Object.entries(effectiveAnswers);
                  if (entries.length === 0) {
                    return (
                      <div className="p-4 bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl border border-[#EFE7DC] dark:border-slate-800 text-center text-xs text-slate-400">
                        No scoping questions answered yet.
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-[#EFE7DC] dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Customer Answers Breakdown
                      </p>
                      {entries.map(([k, rawVal]) => {
                        const label = ANSWER_LABELS[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                        const { text, type } = formatAnswerValue(rawVal);
                        return (
                          <div
                            key={k}
                            className="flex items-center justify-between py-1.5 border-b border-[#EFE7DC] dark:border-slate-800 last:border-0 text-xs"
                          >
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
                            <span
                              className={`font-semibold px-2.5 py-0.5 rounded-md text-[11px] ${
                                type === "yes"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : type === "no"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                              }`}
                            >
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EFE7DC] dark:border-slate-800 flex items-center gap-3">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#252525] dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-[#EFE7DC] dark:border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
