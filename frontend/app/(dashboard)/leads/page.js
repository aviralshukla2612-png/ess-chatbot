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
  X,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { leadsApi } from "@/lib/api/leads";
import { botsApi } from "@/lib/api/bots";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { StatCardsSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

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
  const directAnswers =
    lead.answers && Object.keys(lead.answers).length > 0 ? lead.answers : null;
  const qualAnswers =
    lead.qualification?.answers && Object.keys(lead.qualification.answers).length > 0
      ? lead.qualification.answers
      : null;
  if (directAnswers || qualAnswers) {
    return { ...(qualAnswers || {}), ...(directAnswers || {}) };
  }
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

function matchesTimeWindow(lead, timeFilter) {
  if (!timeFilter || timeFilter === "All Time") return true;
  const rawDate = lead.createdAt || lead.created;
  if (!rawDate) return true;
  if (timeFilter === "Today" && String(rawDate).toLowerCase().includes("today")) return true;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return true;
  const diffDays = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  if (timeFilter === "Today") return diffDays <= 1;
  if (timeFilter === "This Week") return diffDays <= 7;
  if (timeFilter === "This Month") return diffDays <= 31;
  return true;
}

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [botFilter, setBotFilter] = useState("All Bots");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteLeadTarget, setDeleteLeadTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, botFilter, statusFilter, timeFilter]);

  useEffect(() => {
    botsApi
      .getBots()
      .then((list) => setBots(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedLead(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedLead]);

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

  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadLeads, {
    pollingInterval: 4000,
  });

  const botOptions = Array.from(
    new Set([
      ...bots.map((b) => b.name).filter(Boolean),
      ...leads.map((l) => l.bot || l.botName).filter(Boolean),
    ])
  );

  const filteredLeads = leads.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.inquiry?.toLowerCase().includes(q);
    const matchesBot =
      botFilter === "All Bots" ||
      item.bot === botFilter ||
      item.botName === botFilter ||
      item.botId === botFilter;
    const matchesStatus = statusFilter === "All Status" || item.status === statusFilter;
    const matchesTime = matchesTimeWindow(item, timeFilter);
    return matchesSearch && matchesBot && matchesStatus && matchesTime;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const contactedLeads = leads.filter((l) => l.status === "Contacted").length;
  const convertedLeads = leads.filter((l) => l.status === "Converted").length;

  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  const toggleSelectAll = () => {
    const pageIds = paginatedLeads.map((l) => l.id);
    const allPageSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const updateStatus = async (id, newStatus) => {
    await leadsApi.updateLeadStatus(id, newStatus);
    toast({ title: `Lead marked ${newStatus}`, variant: "success" });
    loadLeads();
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleExportLeads = () => {
    const listToExport = filteredLeads.length > 0 ? filteredLeads : leads;
    if (!listToExport || listToExport.length === 0) {
      toast({
        title: "Nothing to export",
        message: "No leads have been captured yet.",
        variant: "warning",
      });
      return;
    }

    const headers = [
      "Lead ID",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Bot",
      "Score",
      "Status",
      "Inquiry / Scope",
      "Budget",
      "Created At",
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""').replace(/\r\n|\n|\r/g, " ");
      return `"${val}"`;
    };

    const rows = listToExport.map((l) => [
      escapeCsv(l.id),
      escapeCsv(l.name),
      escapeCsv(l.email),
      escapeCsv(l.phone),
      escapeCsv(l.company),
      escapeCsv(l.bot || l.botName || "AI Assistant"),
      escapeCsv(l.score || "High"),
      escapeCsv(l.status || "New"),
      escapeCsv(l.inquiry || ""),
      escapeCsv(l.budget || ""),
      escapeCsv(l.created || l.createdAt || ""),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV exported", message: `${listToExport.length} lead records downloaded.`, variant: "success" });
  };

  const handleClearAllLeads = async () => {
    await leadsApi.clearAll();
    setSelectedLead(null);
    setSelectedIds([]);
    setShowClearModal(false);
    toast({ title: "Leads cleared", variant: "info" });
    await loadLeads();
  };

  const handleDeleteLeadConfirm = async () => {
    if (!deleteLeadTarget) return;

    if (deleteLeadTarget.type === "batch") {
      await leadsApi.deleteMultiple(selectedIds);
      setSelectedIds([]);
      if (selectedLead && selectedIds.includes(selectedLead.id)) {
        setSelectedLead(null);
      }
      toast({ title: "Selected leads deleted", variant: "info" });
    } else {
      await leadsApi.deleteLead(deleteLeadTarget.id);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteLeadTarget.id));
      if (selectedLead?.id === deleteLeadTarget.id) {
        setSelectedLead(null);
      }
      toast({ title: "Lead deleted", variant: "info" });
    }
    setDeleteLeadTarget(null);
    await loadLeads();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Inbound Pipeline"
        title="Leads & Qualification CRM"
        description="Qualified visitor contacts, project scopes, and intent signals captured automatically across your deployed chatbots."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <RealtimeBadge isLive={isLive} lastSynced={lastSync} onRefresh={triggerSync} />

            {selectedIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setDeleteLeadTarget({ type: "batch", count: selectedIds.length })}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}

            {leads.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowClearModal(true)}>
                Clear All
              </Button>
            )}

            <Button variant="secondary" size="sm" icon={Download} onClick={handleExportLeads}>
              Export CSV
            </Button>
          </div>
        }
      />

      {/* 4 Top KPI Cards */}
      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Leads" value={totalLeads} icon={Users2} colorScheme="indigo" />
          <StatCard title="New Leads" value={newLeads} icon={Flame} colorScheme="rose" />
          <StatCard title="Contacted" value={contactedLeads} icon={PhoneCall} colorScheme="amber" />
          <StatCard title="Converted" value={convertedLeads} icon={CheckCircle2} colorScheme="emerald" />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-3.5 shadow-[var(--shadow-xs)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, company..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg outline-hidden focus:border-indigo-500 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end overflow-x-auto text-xs">
          <div className="relative">
            <select
              value={botFilter}
              onChange={(e) => setBotFilter(e.target.value)}
              aria-label="Filter by chatbot"
              className="appearance-none pl-3 pr-8 py-2 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-xs font-medium text-[var(--text-secondary)] outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Bots">All Bots</option>
              {botOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by lead status"
              className="appearance-none pl-3 pr-8 py-2 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-xs font-medium text-[var(--text-secondary)] outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Converted">Converted</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              aria-label="Filter by time period"
              className="appearance-none pl-3 pr-8 py-2 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-xs font-medium text-[var(--text-secondary)] outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={leads.length === 0 ? "No leads captured yet" : "No leads match your filters"}
          description={
            leads.length === 0
              ? "When website visitors share their phone number, email, or project inquiry in chat, qualified lead records appear here automatically."
              : "Try clearing your search query or adjusting the status and date filters."
          }
          actionLabel={leads.length > 0 ? "Reset Filters" : undefined}
          onAction={
            leads.length > 0
              ? () => {
                  setSearch("");
                  setBotFilter("All Bots");
                  setStatusFilter("All Status");
                  setTimeFilter("All Time");
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 pl-5 pr-2 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all leads on page"
                      checked={
                        paginatedLeads.length > 0 &&
                        paginatedLeads.every((l) => selectedIds.includes(l.id))
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 border-[var(--border-strong)] focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Lead & Inquiry</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Chatbot</th>
                  <th className="py-3.5 px-4">Intent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 pr-5 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                {paginatedLeads.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedLead(item)}
                      className={`hover:bg-[var(--bg-subtle)]/50 cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50/50 dark:bg-indigo-500/10" : ""
                      }`}
                    >
                      <td className="py-4 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-[var(--border-strong)] focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                        {item.inquiry &&
                          item.inquiry !== "Inquired via live chat widget" &&
                          !item.inquiry.startsWith("Visitor introduced") && (
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-xs mt-0.5">
                              {item.inquiry}
                            </p>
                          )}
                      </td>
                      <td className="py-4 px-4 text-[var(--text-secondary)]">
                        <div>{item.email || "—"}</div>
                        {item.phone && (
                          <div className="text-[11px] text-[var(--text-muted)] font-mono">
                            {item.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium">{item.company || "—"}</td>
                      <td className="py-4 px-4 font-medium">{item.bot || item.botName || "—"}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.score || "High"} size="sm" />
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status || "New"} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-[var(--text-muted)] tabular-nums">
                        {item.created || item.createdAt || "—"}
                      </td>
                      <td
                        className="py-4 pr-5 pl-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(item)}
                            className="p-1.5 hover:bg-[var(--bg-subtle)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            aria-label="Inspect lead"
                            title="View Lead Details"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteLeadTarget(item)}
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            aria-label="Delete lead"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => setPageSize(size)}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="leads"
          />
        </div>
      )}

      {/* Lead Profile Drawer */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedLead(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Lead profile details"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-surface)] h-full shadow-2xl border-l border-[var(--border-subtle)] p-6 flex flex-col justify-between overflow-y-auto animate-slide-left text-[var(--text-primary)]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {selectedLead.name?.charAt(0)?.toUpperCase() || "L"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {selectedLead.name}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {selectedLead.company || "Inbound Prospect"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  aria-label="Close drawer"
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Pipeline Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["New", "Contacted", "Converted"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateStatus(selectedLead.id, st)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedLead.status === st
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-[var(--bg-subtle)]/60 hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-[var(--bg-subtle)]/50 rounded-xl border border-[var(--border-subtle)] text-xs">
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="font-medium break-all">{selectedLead.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Phone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="font-medium font-mono">{selectedLead.phone || "No phone provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Building2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="font-medium">{selectedLead.company || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Bot className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="font-medium">Origin: {selectedLead.bot || selectedLead.botName || "AI Bot"}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="font-medium">Created: {selectedLead.created || selectedLead.createdAt || "—"}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Project Scope & Qualification
                  </label>
                  {selectedLead.budget && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      Budget: {selectedLead.budget}
                    </span>
                  )}
                </div>

                {selectedLead.inquiry && (
                  <div className="p-3.5 bg-indigo-500/8 rounded-xl border border-indigo-500/20 space-y-1">
                    <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      Requirements Summary
                    </p>
                    <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                      {selectedLead.inquiry}
                    </p>
                  </div>
                )}

                {(() => {
                  const effectiveAnswers = getLeadEffectiveAnswers(selectedLead);
                  const entries = Object.entries(effectiveAnswers);
                  if (entries.length === 0) {
                    return (
                      <div className="p-4 bg-[var(--bg-subtle)]/40 rounded-xl border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                        No structured scoping questions recorded yet.
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-[var(--bg-subtle)]/50 rounded-xl border border-[var(--border-subtle)] space-y-2">
                      {entries.map(([k, rawVal]) => {
                        const label =
                          ANSWER_LABELS[k] ||
                          k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                        const { text, type } = formatAnswerValue(rawVal);
                        return (
                          <div
                            key={k}
                            className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0 text-xs gap-2"
                          >
                            <span className="text-[var(--text-secondary)] font-medium">{label}</span>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                                type === "yes"
                                  ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                                  : type === "no"
                                  ? "bg-rose-500/12 text-rose-700 dark:text-rose-400"
                                  : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
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

            <div className="pt-4 mt-6 border-t border-[var(--border-subtle)] flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                className="flex-1"
                onClick={() => setDeleteLeadTarget(selectedLead)}
              >
                Delete Lead
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAllLeads}
        title="Clear All Leads?"
        description="Are you sure you want to clear all leads in this workspace? All captured contact details and qualification records will be permanently removed."
        confirmText="Clear All Leads"
        cancelText="Cancel"
        loadingText="Clearing..."
        variant="danger"
        badgeText="Permanent Action"
        count={leads.length}
      />

      <ConfirmModal
        isOpen={Boolean(deleteLeadTarget)}
        onClose={() => setDeleteLeadTarget(null)}
        onConfirm={handleDeleteLeadConfirm}
        title={
          deleteLeadTarget?.type === "batch"
            ? `Delete ${deleteLeadTarget.count} Leads?`
            : "Delete Lead?"
        }
        description={
          deleteLeadTarget?.type === "batch"
            ? `Permanently delete the ${deleteLeadTarget.count} selected lead records?`
            : `Permanently delete ${deleteLeadTarget?.name || deleteLeadTarget?.email || "this lead"}?`
        }
        confirmText={
          deleteLeadTarget?.type === "batch"
            ? `Delete ${deleteLeadTarget.count} Leads`
            : "Delete Lead"
        }
        cancelText="Cancel"
        loadingText="Deleting..."
        variant="danger"
        badgeText="Irreversible"
      />
    </div>
  );
}
