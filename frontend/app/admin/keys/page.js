"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Zap,
  Cpu,
  RotateCcw,
  Server,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import { InlineAlert, useToast } from "@/components/ui/Toast";

export default function AdminKeysPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [newLabel, setNewLabel] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/keys", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setStats(data.stats);
      }
    } catch (err) {
      console.warn("Failed to load key pool stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newApiKey.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          label: newLabel.trim() || undefined,
          apiKey: newApiKey.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Groq API key added", message: "Key registered in rotation pool.", variant: "success" });
        setNewLabel("");
        setNewApiKey("");
        setAddingKey(false);
        loadStats();
      } else {
        setErrorMsg(data.error || "Failed to add key.");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const postKeyAction = async (payload, okTitle) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (okTitle) toast({ title: okTitle, variant: "success" });
        loadStats();
      }
    } catch (err) {
      toast({ title: "Key action failed", message: err.message, variant: "error" });
    }
  };

  const handleDelete = (id, label) => {
    setConfirmConfig({
      title: "Remove API Key?",
      description: `Remove "${label}" from the rotation pool? Inference traffic will automatically fail over to remaining active keys.`,
      confirmText: "Remove Key",
      badgeText: "Key Rotation",
      variant: "danger",
      onConfirm: async () => {
        await postKeyAction({ action: "delete", id }, "Key removed from pool");
        setConfirmConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="LLM Key Rotation"
        title="Groq API Key Pool & Failover"
        description="Manage multi-key LLM rotation, automatic 429 cooldown failover, and daily token/request telemetry."
        actions={
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() =>
                postKeyAction({ action: "restart_cycle" }, "Rotation cycle restarted at Key #1")
              }
            >
              Restart Cycle
            </Button>
            <a
              href="https://console.groq.com/settings/organization/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-indigo-600 dark:text-indigo-400 border border-[var(--border-subtle)] transition-colors"
            >
              <span>Groq Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadStats}>
              Refresh
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setAddingKey(true)}>
              Add Groq Key
            </Button>
          </div>
        }
      />

      {errorMsg && (
        <InlineAlert
          variant="error"
          title="Key Pool Error"
          message={errorMsg}
          onDismiss={() => setErrorMsg("")}
        />
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Serving Key"
          value={
            stats?.activeServingKey
              ? `#${stats.activeServingKey.sequenceNum || stats.currentServingIndex || 1}`
              : "Key #1"
          }
          description={
            stats?.activeServingKey?.label ||
            `Key ${stats?.currentServingIndex || 1} of ${stats?.totalKeys || 1}`
          }
          icon={Layers}
          colorScheme="indigo"
        />
        <StatCard
          title="Daily API Requests"
          value={(stats?.totalDailyRequests || 0).toLocaleString()}
          description={`Pool cap: ${((stats?.totalCapacityRequests || 14400) / 1000).toFixed(1)}k reqs/day`}
          icon={Server}
          colorScheme="sky"
        />
        <StatCard
          title="Daily Tokens Used"
          value={
            stats?.totalDailyTokens >= 1000
              ? `${(stats.totalDailyTokens / 1000).toFixed(1)}k`
              : String(stats?.totalDailyTokens || 0)
          }
          description={`Pool cap: ${((stats?.totalDailyTokenCapacity || 500000) / 1000).toLocaleString()}k tokens`}
          icon={Cpu}
          colorScheme="violet"
        />
        <StatCard
          title="Keys in Cooldown"
          value={stats?.rateLimitedKeysCount || 0}
          description="Automatic zero-drop failover enabled"
          icon={Zap}
          colorScheme="amber"
        />
      </div>

      {/* Keys Table */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
              Configured Groq Keys in Rotation
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Keys are masked server-side; raw credentials are never returned in API responses.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            {stats?.keys?.length || 0} Keys
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--bg-subtle)]/60 border-b border-[var(--border-subtle)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-5 py-3.5">Account / Label</th>
                <th className="px-5 py-3.5">Masked Key</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Daily Requests (14.4k Cap)</th>
                <th className="px-5 py-3.5">Tokens</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {!loading && (!stats?.keys || stats.keys.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[var(--text-muted)]">
                    No keys configured in pool yet. Click <strong>Add Groq Key</strong> above to add one.
                  </td>
                </tr>
              )}
              {stats?.keys?.map((k, idx) => (
                <tr key={k.id || idx} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                  <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <span>{k.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[var(--text-secondary)]">
                    <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      {k.maskedKey}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {k.status === "rate_limited" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/12 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                        Cooldown ({k.cooldownRemainingSec}s)
                      </span>
                    ) : k.status === "error" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/12 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                        <AlertTriangle className="w-3 h-3" />
                        Auth Error
                      </span>
                    ) : k.status === "active_serving" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active (Serving)
                      </span>
                    ) : k.status === "standby" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        Standby (#{idx + 1})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {k.status === "limit_completed" ? "Quota Switched" : "Paused"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 w-44">
                      <div className="flex justify-between text-[10px] text-[var(--text-muted)] tabular-nums">
                        <span>{k.dailyRequests || 0} req</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {k.dailyPercent || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-subtle)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            (k.dailyPercent || 0) > 85
                              ? "bg-rose-500"
                              : (k.dailyPercent || 0) > 50
                              ? "bg-amber-500"
                              : "bg-indigo-600"
                          }`}
                          style={{ width: `${Math.min(100, k.dailyPercent || 0)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[var(--text-primary)] tabular-nums">
                    <div>{(k.totalTokens || 0).toLocaleString()} total</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {(k.dailyTokens || 0).toLocaleString()} today
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {k.status === "limit_completed" && (
                        <button
                          type="button"
                          onClick={() =>
                            postKeyAction(
                              { action: "reset-usage", id: k.id },
                              `Daily usage reset for ${k.label}`
                            )
                          }
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 cursor-pointer"
                        >
                          Reset Quota
                        </button>
                      )}
                      {k.status === "standby" && (
                        <button
                          type="button"
                          onClick={() =>
                            postKeyAction(
                              { action: "set_primary", id: k.id },
                              `${k.label} set as active serving key`
                            )
                          }
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 cursor-pointer"
                        >
                          Make Active
                        </button>
                      )}
                      {k.status === "rate_limited" && (
                        <button
                          type="button"
                          onClick={() =>
                            postKeyAction({ action: "reset", id: k.id }, "Cooldown cleared")
                          }
                          className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md cursor-pointer"
                          title="Clear cooldown"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          postKeyAction({ action: "toggle", id: k.id, isActive: !k.isActive })
                        }
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] cursor-pointer"
                      >
                        {k.isActive ? "Pause" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(k.id, k.label)}
                        aria-label={`Delete ${k.label}`}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Key Modal */}
      <Modal
        isOpen={addingKey}
        onClose={() => setAddingKey(false)}
        title="Add Groq API Key to Pool"
        description="Each key adds 14,400 daily requests and 30 RPM capacity with automatic failover."
      >
        <form onSubmit={handleAddKey} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Key Label / Owner
            </label>
            <input
              type="text"
              placeholder="e.g. Production Node #2"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl outline-hidden focus:border-indigo-500 text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Groq API Key (gsk_...)
            </label>
            <input
              type="password"
              required
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl outline-hidden focus:border-indigo-500 text-[var(--text-primary)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setAddingKey(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Add to Live Pool
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || "Remove"}
        badgeText={confirmConfig?.badgeText || "Action Required"}
        variant={confirmConfig?.variant || "danger"}
      />
    </div>
  );
}
