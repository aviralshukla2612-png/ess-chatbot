"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Search,
  Bot,
  CheckCircle2,
  X,
  User,
  Eye,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { conversationsApi } from "@/lib/api/conversations";

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedConv, setSelectedConv] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const load = async () => {
    setLoading(true);
    try {
      const data = await conversationsApi.getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.visitorName?.toLowerCase().includes(q) ||
        c.visitorEmail?.toLowerCase().includes(q) ||
        c.botName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q);
      const st = String(c.status || "ACTIVE").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "LEADS" ? Boolean(c.isLead) : st === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [conversations, search, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <PageHeader
        badge="Session Audit"
        title="Global Platform Conversations"
        description="Inspect live and historical visitor transcripts across all tenant chatbots."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
            Refresh
          </Button>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-4 shadow-[var(--shadow-xs)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search conversations by visitor, bot, or message..."
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

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
          {[
            { id: "ALL", label: `All (${conversations.length})` },
            { id: "LEADS", label: "Leads" },
            { id: "HUMAN_ACTIVE", label: "Human Takeover" },
            { id: "RESOLVED", label: "Resolved" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setStatusFilter(t.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                statusFilter === t.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations found"
          description="Visitor chat transcripts will stream here as sessions occur across tenant widgets."
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4">Visitor / Client</th>
                  <th className="p-4">Assisting Bot</th>
                  <th className="p-4">Last Message</th>
                  <th className="p-4">Turns</th>
                  <th className="p-4">Lead</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className="hover:bg-[var(--bg-subtle)]/40 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {c.visitorName && c.visitorName !== "Website Visitor"
                          ? c.visitorName
                          : c.visitorEmail
                          ? c.visitorEmail.split("@")[0].replace(/[._]/g, " ")
                          : "Website Visitor"}
                      </p>
                      {c.visitorPhone && (
                        <p className="text-[11px] font-mono text-[var(--text-muted)]">
                          {c.visitorPhone}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium text-xs border border-[var(--border-subtle)]">
                        <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{c.botName || "AI Assistant"}</span>
                      </span>
                    </td>
                    <td className="p-4 text-[var(--text-secondary)] max-w-sm truncate">
                      {c.lastMessage || "(Active Session)"}
                    </td>
                    <td className="p-4 font-mono text-[var(--text-muted)] tabular-nums">
                      {c.messages?.length || 0}
                    </td>
                    <td className="p-4">
                      {c.isLead ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 text-[10px] bg-emerald-500/12 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          LEAD
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.status || "Active"} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConv(c);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-indigo-500/10 text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Transcript</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(next) => setPage(next)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
            pageSizeOptions={[10, 15, 30, 50]}
            itemLabel="conversations"
          />
        </div>
      )}

      {/* Transcript Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedConv)}
        onClose={() => setSelectedConv(null)}
        title={`Transcript · ${selectedConv?.visitorName || "Visitor"}`}
        description={`Bot: ${selectedConv?.botName || "AI Assistant"} · ${selectedConv?.messages?.length || 0} messages`}
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
          {!selectedConv?.messages?.length ? (
            <div className="py-8 text-center text-[var(--text-muted)]">
              No messages recorded in this session.
            </div>
          ) : (
            selectedConv.messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id || idx}
                  className={`flex items-start gap-2.5 ${
                    isUser ? "justify-start" : "justify-end"
                  }`}
                >
                  {isUser && (
                    <div className="w-6 h-6 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-xl max-w-[85%] leading-relaxed break-words ${
                      isUser
                        ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content || m.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
