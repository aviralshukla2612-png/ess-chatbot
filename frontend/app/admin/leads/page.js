"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Users2,
  Mail,
  Phone,
  Building,
  Sparkles,
  Search,
  Flame,
  CheckCircle2,
  X,
  Copy,
  Check,
  Bot,
  Globe,
  ChevronRight,
  Trash2,
  RefreshCw,
  Download,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { leadsApi } from "@/lib/api/leads";

function stripMarkdown(text) {
  if (!text) return "";
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim();
}

export default function AdminLeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, scoreFilter, statusFilter]);

  const loadLeads = useCallback(async () => {
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

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.inquiry?.toLowerCase().includes(q);

      const matchesScore =
        scoreFilter === "All" ||
        (l.score || "Medium").toLowerCase() === scoreFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        (l.status || "New").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesScore && matchesStatus;
    });
  }, [leads, search, scoreFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const hotOrHigh = leads.filter((l) =>
      ["HOT", "HIGH"].includes((l.score || "").toUpperCase())
    ).length;
    const qualified = leads.filter((l) =>
      ["QUALIFIED", "CONVERTED"].includes((l.status || "").toUpperCase())
    ).length;
    const newLeads = leads.filter((l) => (l.status || "").toUpperCase() === "NEW").length;
    return { total, hotOrHigh, qualified, newLeads };
  }, [leads]);

  const handleExportCsv = () => {
    if (filteredLeads.length === 0) {
      toast({ title: "No leads to export", variant: "warning" });
      return;
    }
    const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const headers = ["ID", "Name", "Phone", "Email", "Company", "Organization", "Bot", "Score", "Status", "Inquiry", "Created"];
    const rows = filteredLeads.map((l) => [
      escapeCsv(l.id),
      escapeCsv(l.name),
      escapeCsv(l.phone),
      escapeCsv(l.email),
      escapeCsv(l.company),
      escapeCsv(l.organizationId),
      escapeCsv(l.bot || l.botName),
      escapeCsv(l.score),
      escapeCsv(l.status),
      escapeCsv(stripMarkdown(l.inquiry)),
      escapeCsv(l.created || l.createdAt),
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `platform_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV downloaded", message: `${filteredLeads.length} leads exported.`, variant: "success" });
  };

  const handleDeleteLead = (e, leadId) => {
    e?.stopPropagation?.();
    const lead = leads.find((l) => l.id === leadId) || { id: leadId, name: "this lead" };
    setConfirmConfig({
      title: "Delete Lead?",
      description: `Permanently delete "${lead.name || lead.phone || lead.email || "this lead"}"?`,
      confirmText: "Delete Lead",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/leads?id=${encodeURIComponent(leadId)}`, { method: "DELETE" });
          if (res.ok) {
            setLeads((prev) => prev.filter((l) => l.id !== leadId));
            if (selectedLead?.id === leadId) setSelectedLead(null);
            toast({ title: "Lead deleted", variant: "info" });
          }
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handlePurgeDummyLeads = () => {
    setConfirmConfig({
      title: "Purge Test & Dummy Leads?",
      description:
        "Remove incomplete/dummy test leads while keeping verified customer leads intact?",
      confirmText: "Purge Dummy Leads",
      badgeText: "Admin Cleanup",
      variant: "danger",
      onConfirm: async () => {
        setPurging(true);
        try {
          const res = await fetch("/api/leads?purgeDummy=true", { method: "DELETE" });
          const data = await res.json().catch(() => ({}));
          if (data.success) {
            toast({ title: "Dummy leads purged", variant: "success" });
            await loadLeads();
          }
        } finally {
          setPurging(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLeads = filteredLeads.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <PageHeader
        badge="Cross-Tenant Pipeline"
        title="Global Generated Leads"
        description="Qualified commercial leads captured by customer assistants across all tenant workspaces."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="secondary" size="sm" icon={Download} onClick={handleExportCsv}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadLeads}>
              Refresh
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              loading={purging}
              onClick={handlePurgeDummyLeads}
            >
              Purge Dummy Leads
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={stats.total} icon={Users2} colorScheme="indigo" />
        <StatCard title="Hot / High Intent" value={stats.hotOrHigh} icon={Flame} colorScheme="rose" />
        <StatCard title="Qualified / Converted" value={stats.qualified} icon={CheckCircle2} colorScheme="emerald" />
        <StatCard title="New Actionable" value={stats.newLeads} icon={Sparkles} colorScheme="amber" />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-4 shadow-[var(--shadow-xs)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, email, or inquiry..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg outline-hidden focus:border-indigo-500 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            aria-label="Filter by lead score"
            className="px-3 py-2 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] outline-hidden cursor-pointer"
          >
            <option value="All">All Scores</option>
            <option value="Hot">Hot</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by lead status"
            className="px-3 py-2 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] outline-hidden cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No leads matched"
          description={
            leads.length === 0
              ? "Leads captured by tenant chatbots will appear here automatically."
              : "Try adjusting your search or score/status filters."
          }
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4">Lead Contact</th>
                  <th className="p-4">Customer / Tenant</th>
                  <th className="p-4">Assisting Bot</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Created</th>
                  <th className="p-4 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {paginatedLeads.map((l) => {
                  const cleanedInquiry = stripMarkdown(l.inquiry);
                  const isRealInquiry =
                    cleanedInquiry &&
                    cleanedInquiry !== "Inquired via live chat widget" &&
                    !cleanedInquiry.startsWith("Visitor introduced");

                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      className="hover:bg-[var(--bg-subtle)]/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {l.name || "Website Prospect"}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                          {l.phone ? (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3" />
                              {l.phone}
                            </span>
                          ) : l.email ? (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {l.email}
                            </span>
                          ) : (
                            <span className="italic">No contact shared</span>
                          )}
                        </div>
                        {isRealInquiry && (
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-sm mt-1">
                            {cleanedInquiry}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                          <Building className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {l.company || "Direct Inbound"}
                          </span>
                        </div>
                        {l.organizationId && (
                          <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5 truncate max-w-[130px]">
                            {l.organizationId}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium text-xs border border-[var(--border-subtle)]">
                          <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{l.bot || l.botName || "AI Bot"}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={l.score || "Medium"} size="sm" />
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-[11px] font-medium border border-[var(--border-subtle)] whitespace-nowrap">
                          <Globe className="w-3 h-3" />
                          <span>{l.source || "Web Widget"}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={l.status || "New"} size="sm" />
                      </td>

                      <td className="p-4 text-right text-[var(--text-muted)] whitespace-nowrap text-[11px] font-mono">
                        {l.created || (l.createdAt ? l.createdAt.split("T")[0] : "Recently")}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLead(e, l.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            aria-label="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
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

      {/* Lead Detail Modal */}
      <Modal
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name || "Website Prospect"}
        description={`Captured on ${selectedLead?.created || selectedLead?.createdAt || "Recent session"}`}
      >
        {selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="bg-[var(--bg-subtle)]/60 rounded-xl p-4 border border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </span>
                <div className="flex items-center gap-2 font-mono font-semibold text-[var(--text-primary)]">
                  <span>{selectedLead.phone || "Not provided"}</span>
                  {selectedLead.phone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLead.phone, "phone")}
                      className="text-[var(--text-muted)] hover:text-indigo-600 cursor-pointer"
                      aria-label="Copy phone"
                    >
                      {copiedField === "phone" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <span>{selectedLead.email || "Not provided"}</span>
                  {selectedLead.email && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLead.email, "email")}
                      className="text-[var(--text-muted)] hover:text-indigo-600 cursor-pointer"
                      aria-label="Copy email"
                    >
                      {copiedField === "email" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Company
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedLead.company || "Direct Inbound"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> Assisting Bot
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedLead.bot || selectedLead.botName || "AI Bot"}
                </span>
              </div>
            </div>

            {selectedLead.inquiry && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Requirement & Inquiry
                </label>
                <div className="p-3 bg-[var(--bg-subtle)]/50 rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] leading-relaxed">
                  {stripMarkdown(selectedLead.inquiry)}
                </div>
              </div>
            )}

            {selectedLead.answers && Object.keys(selectedLead.answers).length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Qualification Answers
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {Object.entries(selectedLead.answers).map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg p-2"
                    >
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                        {k.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={(e) => handleDeleteLead(e, selectedLead.id)}
              >
                Delete Lead
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || "Confirm"}
        badgeText={confirmConfig?.badgeText || "Permanent Action"}
        variant={confirmConfig?.variant || "danger"}
      />
    </div>
  );
}
