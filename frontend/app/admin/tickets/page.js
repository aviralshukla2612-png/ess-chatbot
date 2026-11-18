"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Search,
  Clock,
  MessageSquare,
  Mail,
  User,
  Trash2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { InlineAlert, useToast } from "@/components/ui/Toast";

export default function AdminTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tickets", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      } else {
        setError(data.error || "Failed to load support tickets.");
      }
    } catch {
      setError("Network error while loading support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId, newStatus, notes = null) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(notes !== null ? { adminNotes: notes } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `Ticket #${ticketId} updated`, message: `Status: ${newStatus}`, variant: "success" });
        fetchTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(data.ticket);
        }
      } else {
        toast({ title: "Update failed", message: data.error, variant: "error" });
      }
    } catch {
      toast({ title: "Network error", variant: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = (ticketId) => {
    setConfirmConfig({
      title: "Delete Support Ticket?",
      description: `Permanently delete Ticket #${ticketId} and its message log?`,
      confirmText: "Delete Ticket",
      badgeText: "Permanent Action",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/tickets/${ticketId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast({ title: `Ticket #${ticketId} deleted`, variant: "info" });
            fetchTickets();
            if (selectedTicket?.id === ticketId) setSelectedTicket(null);
          }
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const categories = Array.from(new Set(tickets.map((t) => t.category).filter(Boolean)));

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.id?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.userName?.toLowerCase().includes(q) ||
      t.userEmail?.toLowerCase().includes(q) ||
      t.message?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <PageHeader
        badge="Customer Support Central"
        title="Helpdesk & Support Tickets"
        description="Triage incoming tenant support tickets, billing inquiries, and deployment assistance requests."
        actions={
          <Button variant="secondary" size="sm" icon={LifeBuoy} onClick={fetchTickets}>
            Refresh Tickets
          </Button>
        }
      />

      {error && (
        <InlineAlert
          variant="error"
          title="Tickets Error"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Open & Pending"
          value={openTicketsCount}
          description="Awaiting engineering triage"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          description="Active investigation"
          icon={MessageSquare}
          colorScheme="indigo"
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          description={`${
            tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0
          }% resolution rate`}
          icon={ShieldCheck}
          colorScheme="emerald"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: `All (${tickets.length})` },
            { id: "OPEN", label: `Open (${openTicketsCount})` },
            { id: "IN_PROGRESS", label: `In Progress (${inProgressCount})` },
            { id: "RESOLVED", label: `Resolved (${resolvedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by ticket category"
              className="px-3 py-2 text-xs bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket ID, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets found"
          description="Incoming customer support requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isOpen = ticket.status === "OPEN";
            return (
              <div
                key={ticket.id}
                className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all shadow-[var(--shadow-xs)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      {ticket.id}
                    </span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {ticket.subject}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      {ticket.category}
                    </span>
                    {ticket.priority && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                        {ticket.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <select
                      value={ticket.status}
                      disabled={updating}
                      onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                      aria-label={`Status for ${ticket.id}`}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-hidden cursor-pointer ${
                        isOpen
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                          : ticket.status === "IN_PROGRESS"
                          ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                      }`}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setAdminNotes(ticket.adminNotes || "");
                      }}
                    >
                      Details & Notes
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      aria-label={`Delete ticket ${ticket.id}`}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-subtle)]/50 p-3 rounded-lg border border-[var(--border-subtle)]">
                  {ticket.message}
                </p>

                {ticket.adminNotes && (
                  <div className="p-2.5 rounded-lg bg-indigo-500/8 border border-indigo-500/20 text-xs flex items-start gap-2">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                      Admin Note:
                    </span>
                    <span className="text-[var(--text-primary)]">{ticket.adminNotes}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <strong className="text-[var(--text-primary)]">{ticket.userName}</strong>
                    </span>
                    <a
                      href={`mailto:${ticket.userEmail}?subject=Re: [${ticket.id}] ${ticket.subject}`}
                      className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{ticket.userEmail}</span>
                    </a>
                    {ticket.organizationId && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{ticket.organizationId}</span>
                      </span>
                    )}
                  </div>

                  <span>
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Modal */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Ticket ${selectedTicket.id}` : "Ticket Details"}
        description={selectedTicket?.subject}
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] text-[var(--text-primary)] leading-relaxed max-h-48 overflow-y-auto">
              {selectedTicket.message}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-subtle)]/40 border border-[var(--border-subtle)]">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  {selectedTicket.userName}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {selectedTicket.userEmail}
                </span>
              </div>
              <a
                href={`mailto:${selectedTicket.userEmail}?subject=Re: [${selectedTicket.id}] ${selectedTicket.subject}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Customer</span>
              </a>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-secondary)] block">
                Internal Admin Notes
              </label>
              <textarea
                rows={3}
                placeholder="Log internal resolution steps..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="secondary"
                size="sm"
                loading={updating}
                onClick={() => {
                  handleUpdateStatus(selectedTicket.id, "RESOLVED", adminNotes);
                  setSelectedTicket(null);
                }}
              >
                Mark Resolved
              </Button>
              <Button
                size="sm"
                loading={updating}
                onClick={() => {
                  handleUpdateStatus(selectedTicket.id, selectedTicket.status, adminNotes);
                  setSelectedTicket(null);
                }}
              >
                Save Notes
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
