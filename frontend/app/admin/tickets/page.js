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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Customer Support Central
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Helpdesk & Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming customer support requests, billing queries, and WhatsApp integration inquiries.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LifeBuoy className="w-4 h-4 text-indigo-600" />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Open & Pending
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {openTicketsCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Requires immediate response</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
              {inProgressCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Under active investigation</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Resolved Tickets
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {resolvedCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0}% Resolution Rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
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
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-hidden focus:border-indigo-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
          Loading support tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
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
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {ticket.id}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {ticket.subject}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : ticket.status === "IN_PROGRESS"
                          ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      <option value="OPEN">Status: OPEN</option>
                      <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                      <option value="RESOLVED">Status: RESOLVED</option>
                      <option value="CLOSED">Status: CLOSED</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setAdminNotes(ticket.adminNotes || "");
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Details & Notes
                    </button>

                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      title="Delete Ticket"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {ticket.message}
                </p>

                {/* Admin Notes Preview if present */}
                {ticket.adminNotes && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                    <span className="font-bold shrink-0">Admin Note:</span>
                    <span>{ticket.adminNotes}</span>
                  </div>
                )}

                {/* Customer Details Footer */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{ticket.userName}</strong>
                    </span>
                    <a
                      href={`mailto:${ticket.userEmail}?subject=Re: [${ticket.id}] ${ticket.subject}`}
                      className="flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{ticket.userEmail}</span>
                    </a>
                    {ticket.organizationId && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Org: {ticket.organizationId}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {selectedTicket.id}
                </span>
                <span className="font-bold text-sm text-slate-900">
                  Ticket Management
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 block text-sm">
                {selectedTicket.subject}
              </span>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                {selectedTicket.message}
              </div>
            </div>

            {/* Quick Email Customer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
              <div>
                <span className="font-bold text-indigo-900 block">{selectedTicket.userName}</span>
                <span className="text-[11px] text-indigo-700">{selectedTicket.userEmail}</span>
              </div>
              <a
                href={`mailto:${selectedTicket.userEmail}?subject=Re: [${selectedTicket.id}] ${selectedTicket.subject}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Customer</span>
              </a>
            </div>

            {/* Admin Notes Form */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">
                Internal Admin Notes / Action Log
              </label>
              <textarea
                rows={3}
                placeholder="Log internal resolution steps, customer replies, or escalated actions..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
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
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
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
