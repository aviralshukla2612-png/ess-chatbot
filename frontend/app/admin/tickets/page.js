"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Mail,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selected Ticket for Details/Notes Drawer
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
        setSuccessMsg(`Ticket #${ticketId} status updated to ${newStatus}.`);
        fetchTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        alert(data.error || "Failed to update ticket status");
      }
    } catch {
      alert("Error updating ticket status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm(`Are you sure you want to permanently delete Ticket #${ticketId}?`)) return;

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Ticket #${ticketId} deleted.`);
        fetchTickets();
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to delete ticket");
      }
    } catch {
      alert("Error deleting ticket");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B68A55]/10 border border-[#B68A55]/20 text-[#B68A55] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Customer Support Central
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Helpdesk & Support Tickets
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage incoming customer support requests, billing queries, and WhatsApp integration inquiries.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-800 bg-[#0D0D0D] hover:bg-neutral-900 text-neutral-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LifeBuoy className="w-4 h-4 text-[#B68A55]" />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Open & Pending
            </span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {openTicketsCount}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">Requires immediate response</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-2xl font-extrabold text-[#B68A55] mt-1 block">
              {inProgressCount}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">Under active investigation</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55]">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Resolved Tickets
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {resolvedCount}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0}% Resolution Rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0D0D0D] p-3.5 rounded-2xl border border-neutral-800 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: `All (${tickets.length})` },
            { id: "OPEN", label: `Open (${openTicketsCount})` },
            { id: "IN_PROGRESS", label: `In Progress (${inProgressCount})` },
            { id: "RESOLVED", label: `Resolved (${resolvedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#B68A55] text-white shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-800 bg-[#121212] text-xs text-white outline-hidden focus:border-[#B68A55]"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-400 bg-[#0D0D0D] rounded-2xl border border-neutral-800">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#B68A55] mb-2" />
          Loading support tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-400 bg-[#0D0D0D] rounded-2xl border border-dashed border-neutral-800">
          No support tickets found matching criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const isOpen = ticket.status === "OPEN";

            return (
              <div
                key={ticket.id}
                className="p-5 rounded-2xl bg-[#0D0D0D] border border-neutral-800 hover:border-neutral-700 transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-200 border border-neutral-800">
                      {ticket.id}
                    </span>
                    <span className="font-bold text-sm text-white">
                      {ticket.subject}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#B68A55]/10 text-[#B68A55] border border-[#B68A55]/20">
                      {ticket.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Status Dropdown */}
                    <select
                      value={ticket.status}
                      disabled={updating}
                      onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border outline-hidden cursor-pointer ${
                        isOpen
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : ticket.status === "IN_PROGRESS"
                          ? "bg-[#B68A55]/15 text-[#B68A55] border-[#B68A55]/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      <option value="OPEN" className="bg-[#121212] text-white">Status: OPEN</option>
                      <option value="IN_PROGRESS" className="bg-[#121212] text-white">Status: IN PROGRESS</option>
                      <option value="RESOLVED" className="bg-[#121212] text-white">Status: RESOLVED</option>
                      <option value="CLOSED" className="bg-[#121212] text-white">Status: CLOSED</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setAdminNotes(ticket.adminNotes || "");
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#121212] hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer border border-neutral-800"
                    >
                      Details & Notes
                    </button>

                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      title="Delete Ticket"
                      className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#121212] p-3 rounded-xl border border-neutral-800">
                  {ticket.message}
                </p>

                {/* Admin Notes Preview if present */}
                {ticket.adminNotes && (
                  <div className="p-2.5 rounded-xl bg-[#1a1714] border border-[#B68A55]/30 text-[11px] text-[#B68A55] flex items-start gap-2">
                    <span className="font-bold shrink-0">Admin Note:</span>
                    <span className="text-neutral-200">{ticket.adminNotes}</span>
                  </div>
                )}

                {/* Customer Details Footer */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1 gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-neutral-500" />
                      <strong className="text-white">{ticket.userName}</strong>
                    </span>
                    <a
                      href={`mailto:${ticket.userEmail}?subject=Re: [${ticket.id}] ${ticket.subject}`}
                      className="flex items-center gap-1 text-[#B68A55] hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{ticket.userEmail}</span>
                    </a>
                    {ticket.organizationId && (
                      <span className="flex items-center gap-1 text-neutral-500">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Org: {ticket.organizationId}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-neutral-500">
                    Submitted: {new Date(ticket.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details & Admin Notes Drawer/Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0D0D0D] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden text-white space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-neutral-200 border border-neutral-800">
                  {selectedTicket.id}
                </span>
                <span className="font-bold text-sm text-white">
                  Ticket Management
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-white block text-sm">
                {selectedTicket.subject}
              </span>
              <div className="p-3 rounded-xl bg-[#121212] border border-neutral-800 text-neutral-300 leading-relaxed max-h-48 overflow-y-auto">
                {selectedTicket.message}
              </div>
            </div>

            {/* Quick Email Customer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-neutral-800 text-xs">
              <div>
                <span className="font-bold text-white block">{selectedTicket.userName}</span>
                <span className="text-[11px] text-neutral-400">{selectedTicket.userEmail}</span>
              </div>
              <a
                href={`mailto:${selectedTicket.userEmail}?subject=Re: [${selectedTicket.id}] ${selectedTicket.subject}`}
                className="px-3 py-1.5 rounded-lg bg-[#B68A55] hover:bg-[#a67c48] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Customer</span>
              </a>
            </div>

            {/* Admin Notes Form */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-neutral-300">
                Internal Admin Notes / Action Log
              </label>
              <textarea
                rows={3}
                placeholder="Log internal resolution steps, customer replies, or escalated actions..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-[#121212] text-xs text-white outline-hidden focus:border-[#B68A55]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, "RESOLVED", adminNotes)}
                disabled={updating}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Mark as Resolved
              </button>

              <button
                onClick={() => {
                  handleUpdateStatus(selectedTicket.id, selectedTicket.status, adminNotes);
                  setSelectedTicket(null);
                }}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-[#B68A55] hover:bg-[#a67c48] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
