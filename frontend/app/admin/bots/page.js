"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Bot,
  Trash2,
  Search,
  ExternalLink,
  RefreshCw,
  Ban,
  ShieldCheck,
  Palette,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { botsApi } from "@/lib/api/bots";
import RedesignBotModal from "@/components/bots/RedesignBotModal";

export default function AdminBotsPage() {
  const { toast } = useToast();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [redesignBot, setRedesignBot] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const loadBots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await botsApi.getBots();
      setBots(data || []);
    } catch (err) {
      console.error("Failed to load bots:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  const filteredBots = useMemo(() => {
    return bots.filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q) ||
        b.organizationName?.toLowerCase().includes(q) ||
        b.company?.toLowerCase().includes(q);
      const st = String(b.status || "Active").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || st === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bots, search, statusFilter]);

  const totalItems = filteredBots.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedBots = filteredBots.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleToggleBlockBot = (botId, currentStatus) => {
    const isBlocked = String(currentStatus).toLowerCase() === "blocked";
    const nextStatus = isBlocked ? "Active" : "Blocked";
    setConfirmConfig({
      title: isBlocked ? "Unblock Chatbot?" : "Block Chatbot?",
      description: isBlocked
        ? `Resume live visitor responses for chatbot "${botId}"?`
        : `Block chatbot "${botId}" from responding to visitor widget queries?`,
      confirmText: isBlocked ? "Unblock Bot" : "Block Bot",
      badgeText: isBlocked ? "Status Change" : "Security Restriction",
      variant: isBlocked ? "info" : "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/bots/${botId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          });
          if (res.ok) {
            setBots((prev) =>
              prev.map((b) => (b.id === botId ? { ...b, status: nextStatus } : b))
            );
            toast({ title: `Bot marked ${nextStatus}`, variant: "success" });
          }
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleDeleteBot = (botId) => {
    const bot = bots.find((b) => b.id === botId) || { id: botId, name: botId };
    setConfirmConfig({
      title: "Delete Chatbot?",
      description: `Permanently delete chatbot "${bot.name || botId}" and its associated widget configuration?`,
      confirmText: "Delete Bot",
      badgeText: "Permanent Action",
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/bots/${botId}`, { method: "DELETE" });
          setBots((prev) => prev.filter((b) => b.id !== botId));
          toast({ title: "Chatbot deleted", variant: "info" });
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handlePurgeTestData = () => {
    setConfirmConfig({
      title: "Purge Test & Development Bots?",
      description:
        "Permanently remove dummy/test bots created during development while keeping active production bots intact?",
      confirmText: "Purge Test Bots",
      badgeText: "Cleanup Action",
      variant: "danger",
      onConfirm: async () => {
        setPurging(true);
        try {
          const res = await fetch("/api/admin/clean-dummy", { method: "POST" });
          const data = await res.json();
          if (data.success) {
            toast({ title: "Dummy bots purged", variant: "success" });
            await loadBots();
          }
        } finally {
          setPurging(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Assistant Registry"
        title="Global Bot Registry"
        description="Inspect, style, block, or audit AI assistants deployed across all tenant workspaces."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadBots}>
              Refresh
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              loading={purging}
              onClick={handlePurgeTestData}
            >
              Purge Dummy Bots
            </Button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search bots by name, ID, or tenant..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
          {["ALL", "ACTIVE", "BLOCKED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {st === "ALL" ? `All (${bots.length})` : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : filteredBots.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No bots matched"
          description={
            bots.length === 0
              ? "Chatbots created by workspace owners will appear in this registry."
              : "Try clearing your search or status filter."
          }
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4">Bot Assistant</th>
                  <th className="p-4">Tenant Org</th>
                  <th className="p-4">Style</th>
                  <th className="p-4">Questions</th>
                  <th className="p-4">Chats</th>
                  <th className="p-4">Leads</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {paginatedBots.map((b) => {
                  const blocked = String(b.status).toLowerCase() === "blocked";
                  return (
                    <tr key={b.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm shrink-0">
                            {b.avatar && !String(b.avatar).startsWith("/") && !String(b.avatar).startsWith("http")
                              ? b.avatar
                              : "🤖"}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{b.name}</p>
                            <p className="text-[10px] font-mono text-[var(--text-muted)]">{b.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">
                        {b.organizationName || b.company || b.organizationId || "Workspace"}
                      </td>
                      <td className="p-4 text-[var(--text-muted)]">
                        {b.personality || "Professional"}
                      </td>
                      <td className="p-4 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                        {b.questionsCount || 0}
                      </td>
                      <td className="p-4 font-mono text-[var(--text-secondary)] tabular-nums">
                        {b.conversationsCount || 0}
                      </td>
                      <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        {b.leadsCount || 0}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={b.status || "Active"} size="sm" />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleBlockBot(b.id, b.status)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                            title={blocked ? "Unblock Bot" : "Block Bot"}
                            aria-label={blocked ? "Unblock bot" : "Block bot"}
                          >
                            {blocked ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Ban className="w-4 h-4 text-amber-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRedesignBot(b)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                            title="Customize Bot Theme"
                            aria-label="Customize bot theme"
                          >
                            <Palette className="w-4 h-4" />
                          </button>
                          <a
                            href={`/bots/${b.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                            title="Open Bot Console"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteBot(b.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Bot"
                            aria-label="Delete bot"
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
            itemLabel="bots"
          />
        </div>
      )}

      <RedesignBotModal
        isOpen={Boolean(redesignBot)}
        onClose={() => setRedesignBot(null)}
        bot={redesignBot}
        onBotUpdated={(updated) => {
          setBots((prev) =>
            prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
          );
          setRedesignBot(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || "Confirm"}
        badgeText={confirmConfig?.badgeText || "Action Required"}
        variant={confirmConfig?.variant || "danger"}
      />
    </div>
  );
}
