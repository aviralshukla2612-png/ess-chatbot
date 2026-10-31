"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bot,
  Building2,
  Trash2,
  Search,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Ban,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { botsApi } from "@/lib/api/bots";

export default function AdminBotsPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

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

  const handleToggleBlockBot = async (botId, currentStatus) => {
    const isBlocked = String(currentStatus).toLowerCase() === "blocked";
    const nextStatus = isBlocked ? "Active" : "Blocked";
    const confirmMsg = isBlocked
      ? `Unblock bot "${botId}"? It will resume serving chats.`
      : `BLOCK bot "${botId}"? It will immediately stop responding to visitor chats.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setBots((prev) => prev.map((b) => (b.id === botId ? { ...b, status: nextStatus } : b)));
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Failed to update bot: " + (data.error || res.statusText));
      }
    } catch (err) {
      alert("Error updating bot status: " + err.message);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!confirm(`Are you sure you want to permanently delete bot "${botId}"?`)) return;
    try {
      await fetch(`/api/bots/${botId}`, { method: "DELETE" });
      setBots((prev) => prev.filter((b) => b.id !== botId));
    } catch (err) {
      alert("Failed to delete bot: " + err.message);
    }
  };

  const handlePurgeTestData = async () => {
    if (!confirm("This will permanently remove all test/dummy bots created during development. Proceed?")) return;
    setPurging(true);
    try {
      const res = await fetch("/api/admin/clean-dummy", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadBots();
      } else {
        alert("Failed to purge test data: " + data.error);
      }
    } catch (err) {
      alert("Error purging test data: " + err.message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Global Bot Registry
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Inspect, evaluate performance, and audit every AI assistant created across all tenants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadBots}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-200 bg-[#0D0D0D] border border-neutral-800 hover:bg-neutral-900 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B68A55]" : "text-neutral-400"}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePurgeTestData}
            disabled={purging}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Purge all legacy test bots"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{purging ? "Purging..." : "Purge Dummy Bots"}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0A0A] text-neutral-400 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-800">
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
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#B68A55]" />
                      <span>Loading registry...</span>
                    </div>
                  </td>
                </tr>
              ) : bots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400">
                    <p className="font-semibold text-sm text-neutral-200">No bots registered yet</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Real bots will appear here when created by workspace administrators.
                    </p>
                  </td>
                </tr>
              ) : (
                bots.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{b.avatar || "🤖"}</span>
                        <div>
                          <p className="font-bold text-white">{b.name}</p>
                          <p className="text-[10px] font-mono text-neutral-500">{b.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300 font-medium">
                      {b.organizationName || b.company || b.organizationId || "Emperor Smart Solutions"}
                    </td>
                    <td className="p-4 text-neutral-400">{b.personality || "Professional"}</td>
                    <td className="p-4 font-mono font-bold text-white">
                      {b.questionsCount || 0}
                    </td>
                    <td className="p-4 font-mono text-neutral-300">{b.conversationsCount || 0}</td>
                    <td className="p-4 font-mono text-emerald-400 font-bold">{b.leadsCount || 0}</td>
                    <td className="p-4">
                      <StatusBadge status={b.status || "Active"} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleBlockBot(b.id, b.status)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            String(b.status).toLowerCase() === "blocked"
                              ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                              : "text-amber-400 hover:text-rose-400 hover:bg-rose-950/40"
                          }`}
                          title={String(b.status).toLowerCase() === "blocked" ? "Unblock Bot" : "Block Bot"}
                        >
                          {String(b.status).toLowerCase() === "blocked" ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Ban className="w-4 h-4 text-amber-400" />
                          )}
                        </button>
                        <a
                          href={`/bots/${b.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-neutral-400 hover:text-[#B68A55] rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Inspect Bot"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteBot(b.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Delete Bot"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
