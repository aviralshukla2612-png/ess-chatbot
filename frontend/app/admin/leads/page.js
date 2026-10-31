"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users2,
  Mail,
  Phone,
  Building,
  Sparkles,
  Search,
  Filter,
  Flame,
  CheckCircle2,
  X,
  Copy,
  Check,
  MessageSquare,
  Bot,
  Globe,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Trash2,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { leadsApi } from "@/lib/api/leads";

function stripMarkdown(text) {
  if (!text) return "";
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim();
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const loadLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getLeads();
      setLeads(data || []);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleDeleteLead = async (e, leadId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;
    try {
      const res = await fetch(`/api/leads?id=${leadId}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Failed to delete lead: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error deleting lead: " + err.message);
    }
  };

  const handlePurgeDummyLeads = async () => {
    if (!confirm("Purge all dummy and incomplete test leads from the database and storage?")) return;
    setPurging(true);
    try {
      const res = await fetch("/api/leads?purgeDummy=true", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        await loadLeads();
      } else {
        alert("Failed to purge dummy leads: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error purging dummy leads: " + err.message);
    } finally {
      setPurging(false);
    }
  };

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Metrics
  const stats = useMemo(() => {
    const total = leads.length;
    const hotOrHigh = leads.filter(
      (l) => ["HOT", "HIGH"].includes((l.score || "").toUpperCase())
    ).length;
    const qualified = leads.filter(
      (l) => ["QUALIFIED", "CONVERTED"].includes((l.status || "").toUpperCase())
    ).length;
    const newLeads = leads.filter(
      (l) => (l.status || "").toUpperCase() === "NEW"
    ).length;
    return { total, hotOrHigh, qualified, newLeads };
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.inquiry && l.inquiry.toLowerCase().includes(q));

      const matchesScore =
        scoreFilter === "All" ||
        (l.score || "Medium").toLowerCase() === scoreFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        (l.status || "New").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesScore && matchesStatus;
    });
  }, [leads, search, scoreFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#B68A55]/10 text-[#B68A55] border border-[#B68A55]/20">
              <Users2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Global Generated Leads
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                High-commercial-intent leads captured by all customer assistants across all tenants.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLeads}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-200 bg-[#0D0D0D] border border-neutral-800 hover:bg-neutral-900 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B68A55]" : "text-neutral-400"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handlePurgeDummyLeads}
            disabled={purging}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Purge dummy and test leads"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{purging ? "Purging..." : "Purge Dummy Leads"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Leads
            </span>
            <span className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800">
              <Users2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{stats.total}</span>
            <span className="text-[11px] text-neutral-500 font-medium">All-time</span>
          </div>
        </div>

        <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Hot / High Intent
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-400">{stats.hotOrHigh}</span>
            <span className="text-[11px] text-neutral-500 font-medium">Priority</span>
          </div>
        </div>

        <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Qualified
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{stats.qualified}</span>
            <span className="text-[11px] text-neutral-500 font-medium">Verified intent</span>
          </div>
        </div>

        <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              New Leads
            </span>
            <span className="p-1.5 rounded-lg bg-[#B68A55]/10 text-[#B68A55] border border-[#B68A55]/20">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#B68A55]">{stats.newLeads}</span>
            <span className="text-[11px] text-neutral-500 font-medium">Needs action</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, email, or inquiry..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl outline-hidden focus:border-[#B68A55] text-white placeholder:text-neutral-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Score Filter */}
          <div className="flex items-center gap-1.5 bg-[#121212] border border-neutral-800 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-neutral-400">Score:</span>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="text-xs bg-transparent border-0 outline-hidden font-medium text-white cursor-pointer"
            >
              <option value="All" className="bg-[#121212] text-white">All Scores</option>
              <option value="Hot" className="bg-[#121212] text-white">Hot</option>
              <option value="High" className="bg-[#121212] text-white">High</option>
              <option value="Medium" className="bg-[#121212] text-white">Medium</option>
              <option value="Low" className="bg-[#121212] text-white">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#121212] border border-neutral-800 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-neutral-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent border-0 outline-hidden font-medium text-white cursor-pointer"
            >
              <option value="All" className="bg-[#121212] text-white">All Status</option>
              <option value="New" className="bg-[#121212] text-white">New</option>
              <option value="Contacted" className="bg-[#121212] text-white">Contacted</option>
              <option value="Qualified" className="bg-[#121212] text-white">Qualified</option>
              <option value="Converted" className="bg-[#121212] text-white">Converted</option>
              <option value="Lost" className="bg-[#121212] text-white">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0A0A0A] text-neutral-400 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4 min-w-[220px]">Lead Contact</th>
                <th className="p-4 min-w-[140px]">Customer / Tenant</th>
                <th className="p-4 min-w-[110px]">Assisting Bot</th>
                <th className="p-4 min-w-[120px]">Commercial Score</th>
                <th className="p-4 min-w-[110px]">Channel</th>
                <th className="p-4 min-w-[110px]">Pipeline Status</th>
                <th className="p-4 text-right min-w-[100px]">Created</th>
                <th className="p-4 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#B68A55] border-t-transparent rounded-full animate-spin" />
                      <span>Loading platform leads...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-neutral-500">
                    <Users2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="font-semibold text-neutral-300">No matching leads found</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {leads.length === 0
                        ? "Leads captured by customer chatbots will appear here in real time."
                        : "Try adjusting your search query or filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => {
                  const cleanedInquiry = stripMarkdown(l.inquiry);
                  const isRealInquiry =
                    cleanedInquiry &&
                    cleanedInquiry !== "Inquired via live chat widget" &&
                    !cleanedInquiry.startsWith("Visitor introduced");

                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      className="hover:bg-neutral-900/60 transition-colors cursor-pointer group"
                    >
                      {/* Lead Contact */}
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-[#B68A55] transition-colors">
                          {l.name || "Website Prospect"}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          {l.phone ? (
                            <span className="inline-flex items-center gap-1 font-mono text-neutral-300">
                              <Phone className="w-3 h-3 text-neutral-500" />
                              {l.phone}
                            </span>
                          ) : l.email ? (
                            <span className="inline-flex items-center gap-1 text-neutral-300">
                              <Mail className="w-3 h-3 text-neutral-500" />
                              {l.email}
                            </span>
                          ) : (
                            <span className="text-neutral-500 italic">No contact shared yet</span>
                          )}
                        </div>
                        {isRealInquiry && (
                          <p
                            className="text-[11px] text-[#B68A55] font-medium truncate max-w-sm mt-1 bg-[#121212] border border-neutral-800 px-2 py-0.5 rounded-md"
                            title={cleanedInquiry}
                          >
                            {cleanedInquiry}
                          </p>
                        )}
                      </td>

                      {/* Customer / Tenant */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                          <Building className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate max-w-[130px]">{l.company || "Direct Inbound"}</span>
                        </div>
                        {l.organizationId && (
                          <span className="text-[10px] font-mono text-neutral-500 block mt-0.5 truncate max-w-[130px]">
                            {l.organizationId}
                          </span>
                        )}
                      </td>

                      {/* Assisting Bot */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-200 font-medium text-xs border border-neutral-800">
                          <Bot className="w-3.5 h-3.5 text-[#B68A55]" />
                          <span>{l.bot || l.botName || "aa"}</span>
                        </span>
                      </td>

                      {/* Commercial Score */}
                      <td className="p-4">
                        <StatusBadge status={l.score || "Medium"} size="sm" />
                      </td>

                      {/* Channel */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 text-[11px] font-medium border border-neutral-800 whitespace-nowrap">
                          <Globe className="w-3 h-3 text-neutral-500" />
                          <span>{l.source || "Web Widget"}</span>
                        </span>
                      </td>

                      {/* Pipeline Status */}
                      <td className="p-4">
                        <StatusBadge status={l.status || "New"} size="sm" />
                      </td>

                      {/* Created */}
                      <td className="p-4 text-right text-neutral-400 whitespace-nowrap text-[11px] font-mono">
                        {l.created || (l.createdAt ? l.createdAt.split("T")[0] : "Just now")}
                      </td>

                      {/* Action Chevron & Delete */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => handleDeleteLead(e, l.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                          <span className="p-1 rounded-lg text-neutral-500 group-hover:text-[#B68A55] group-hover:bg-neutral-800 transition-colors inline-block">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Slide-over Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 max-w-lg w-full p-6 shadow-xl space-y-5 animate-scale-up text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {selectedLead.name || "Website Prospect"}
                  </h3>
                  <StatusBadge status={selectedLead.score || "Medium"} size="sm" />
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Captured on {selectedLead.created || selectedLead.createdAt || "Recent session"}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact details */}
            <div className="bg-[#121212] rounded-xl p-4 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" /> Phone:
                </span>
                <div className="flex items-center gap-2 font-mono font-semibold text-white">
                  <span>{selectedLead.phone || "Not provided"}</span>
                  {selectedLead.phone && (
                    <button
                      onClick={() => copyToClipboard(selectedLead.phone, "phone")}
                      className="text-neutral-400 hover:text-[#B68A55]"
                      title="Copy phone"
                    >
                      {copiedField === "phone" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" /> Email:
                </span>
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span>{selectedLead.email || "Not provided"}</span>
                  {selectedLead.email && (
                    <button
                      onClick={() => copyToClipboard(selectedLead.email, "email")}
                      className="text-neutral-400 hover:text-[#B68A55]"
                      title="Copy email"
                    >
                      {copiedField === "email" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-neutral-500" /> Company / Tenant:
                </span>
                <span className="font-semibold text-neutral-200">
                  {selectedLead.company || "Direct Inbound"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-neutral-500" /> Assisting Bot:
                </span>
                <span className="font-semibold text-[#B68A55]">
                  {selectedLead.bot || selectedLead.botName || "aa"}
                </span>
              </div>
            </div>

            {/* Requirement / Inquiry */}
            {selectedLead.inquiry && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Lead Requirement & Inquiry
                </label>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-200 leading-relaxed">
                  {stripMarkdown(selectedLead.inquiry)}
                </div>
              </div>
            )}

            {/* Answers Breakdown if present */}
            {selectedLead.answers && Object.keys(selectedLead.answers).length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Qualification Answers
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {Object.entries(selectedLead.answers).map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs"
                    >
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        {k.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-white">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={(e) => {
                  handleDeleteLead(e, selectedLead.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Lead</span>
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#B68A55] text-white rounded-xl hover:bg-[#a67c48] transition-colors cursor-pointer"
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
