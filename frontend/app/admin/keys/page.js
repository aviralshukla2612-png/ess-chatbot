"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function AdminKeysPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState(false);
  const [notification, setNotification] = useState(null);

  // New key form
  const [newLabel, setNewLabel] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/keys", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn("Failed to load key pool stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 3000); // dynamic auto-refresh every 3s
    return () => clearInterval(interval);
  }, []);

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newApiKey.trim()) return;

    setSubmitting(true);
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
        setNotification({ type: "success", message: "New Groq API Key added to pool!" });
        setNewLabel("");
        setNewApiKey("");
        setAddingKey(false);
        loadStats();
      } else {
        setNotification({ type: "error", message: data.error || "Failed to add key." });
      }
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, isActive: !currentStatus }),
      });
      if (res.ok) loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetCooldown = async (id) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", id }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: "Cooldown cleared. Key is active." });
        loadStats();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, label) => {
    if (!confirm(`Are you sure you want to remove '${label}' from the pool?`)) return;
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: "Key removed from pool." });
        loadStats();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPrimary = async (id, label) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_primary", id }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: `'${label}' is now the Active Serving key.` });
        loadStats();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetUsage = async (id, label) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-usage", id }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: `Daily quota reset to 0 for '${label}'.` });
        loadStats();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartCycle = async () => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart_cycle" }),
      });
      if (res.ok) {
        setNotification({ type: "success", message: "Rotation cycle restarted at Key #1!" });
        loadStats();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Groq API Key Pool & Rate Limits
          </h1>
        </div>
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs font-semibold text-emerald-400 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dynamic Sync (3s)</span>
          </div>
          <button
            onClick={handleRestartCycle}
            title="Restart rotation sequence from Key #1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0D0D0D] hover:bg-[#161616] text-neutral-300 border border-neutral-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#B68A55]" />
            <span>Restart Cycle (#1)</span>
          </button>
          <a
            href="https://console.groq.com/settings/organization/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0D0D0D] hover:bg-[#161616] text-[#B68A55] border border-neutral-800 transition-colors shadow-xs whitespace-nowrap"
          >
            <span>Groq Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0D0D0D] border border-neutral-800 text-neutral-300 hover:bg-[#161616] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B68A55]" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setAddingKey(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#B68A55] hover:bg-[#a67c48] text-white shadow-xs cursor-pointer transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Groq Key</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
              : "bg-rose-950/40 border-rose-800/50 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Add Key Modal / Card */}
      {addingKey && (
        <div className="p-5 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-md animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B68A55]" />
              Add Another Groq API Key to Pool
            </h3>
            <button
              onClick={() => setAddingKey(false)}
              className="text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Create another free account on <b>console.groq.com</b>, generate an API key (`gsk_...`), and paste it here. Each key adds <b>14,400 daily requests</b> and <b>30 RPM</b> capacity to your SaaS!
          </p>
          <form onSubmit={handleAddKey} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Key Label / Owner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account #2 - Marketing"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#121212] border border-neutral-800 rounded-xl focus:outline-hidden focus:border-[#B68A55] text-white placeholder:text-neutral-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Groq API Key (gsk_...)
                </label>
                <input
                  type="password"
                  required
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#121212] border border-neutral-800 rounded-xl focus:outline-hidden focus:border-[#B68A55] text-white placeholder:text-neutral-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddingKey(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-semibold bg-[#B68A55] hover:bg-[#a67c48] text-white rounded-xl shadow-xs cursor-pointer"
              >
                {submitting ? "Adding..." : "Add to Live Pool"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aggregate Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Serving Key */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Serving Key</span>
            <Layers className="w-3.5 h-3.5 text-[#B68A55]" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white truncate max-w-[200px]" title={stats?.activeServingKey?.label || "None"}>
              {stats?.activeServingKey ? `#${stats.activeServingKey.sequenceNum || stats.currentServingIndex || 1} ${stats.activeServingKey.label}` : "Key #1 Active"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Sequence: <b className="text-neutral-200">Key {stats?.currentServingIndex || 1} of {stats?.totalKeys || 1}</b></span>
            {stats?.cycleCount > 1 && (
              <span className="text-[#B68A55] font-semibold">Cycle #{stats.cycleCount}</span>
            )}
          </p>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {stats?.nextServingKey
                ? `Switches to #${stats.nextServingKey.sequenceNum} on token limit`
                : "Auto-switches to next key on token limit"}
            </span>
          </div>
        </div>

        {/* Card 2: Combined Daily Capacity */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Daily Requests (API Calls)</span>
            <Server className="w-3.5 h-3.5 text-teal-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {stats?.totalDailyRequests || 0}
            </span>
            <span className="text-xs text-neutral-400">
              used / {((stats?.totalCapacityRequests || 14400) / 1000).toFixed(1)}k requests cap
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, stats?.overallDailyPercent || 0))}%` }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 flex items-center justify-between">
            <span>
              Active Key: <b className="text-teal-400 font-semibold">{Math.max(0, (stats?.activeServingKeyDailyCap || 14400) - (stats?.activeServingKeyRequests || 0)).toLocaleString()}</b> reqs left
            </span>
            <span className="text-neutral-500 font-medium">
              Pool: {((stats?.totalCapacityRequests || 14400) / 1000).toFixed(1)}k reqs ({stats?.totalKeys || 1} keys)
            </span>
          </p>
        </div>

        {/* Card 3: Groq Token Usage */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Daily Tokens (1,000k Total)</span>
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {stats?.totalDailyTokens >= 1000
                ? `${(stats.totalDailyTokens / 1000).toFixed(1)}k`
                : (stats?.totalDailyTokens || 0)}
            </span>
            <span className="text-xs text-neutral-400">
              used ({stats?.totalDailyTokens?.toLocaleString() || 0} tokens)
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(1, stats?.overallTokenPercent || 0))}%`
              }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 flex items-center justify-between">
            <span>
              Active Key: <b className="text-emerald-400 font-semibold">{((Math.max(0, (stats?.activeServingKeyTokenCap || 500000) - (stats?.activeServingKeyTokens || 0))) / 1000).toFixed(1)}k</b> tok left
            </span>
            <span className="text-emerald-400 font-semibold">
              Pool: {((stats?.totalDailyTokenCapacity || 500000) / 1000).toLocaleString()}k tok
            </span>
          </p>
        </div>

        {/* Card 4: Rate Limited / Cooldown status */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Failover & Health</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {stats?.rateLimitedKeysCount || 0}
            </span>
            <span className="text-xs text-neutral-400">in cooldown</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Auto-failover enabled: 0 visitor drops
          </p>
        </div>
      </div>

      {/* Keys List Table */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Active Groq API Keys in Rotation</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live status, daily usage, token tracking, and per-key controls.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#B68A55]/15 text-[#B68A55] border border-[#B68A55]/30">
            {stats?.keys?.length || 0} Keys Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0A0A0A] border-b border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="px-5 py-3.5">Account / Label</th>
                <th className="px-5 py-3.5">API Key (Masked)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Today's Requests (14.4k Limit)</th>
                <th className="px-5 py-3.5">Total Tokens</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {(!stats?.keys || stats.keys.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-400">
                    No keys in pool yet. Click <b>"Add Groq Key"</b> above to add your first key!
                  </td>
                </tr>
              )}
              {stats?.keys?.map((k, idx) => (
                <tr key={k.id || idx} className="hover:bg-neutral-900/60 transition-colors">
                  <td className="px-5 py-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[#B68A55] font-bold text-[10px]">
                        #{idx + 1}
                      </div>
                      <span>{k.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-neutral-300">
                    <span className="px-2 py-1 rounded-md bg-[#121212] border border-neutral-800">
                      {k.maskedKey}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {k.status === "rate_limited" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-400 border border-amber-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        Cooldown ({k.cooldownRemainingSec}s)
                      </span>
                    ) : k.status === "error" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-800/50">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        Auth Error
                      </span>
                    ) : k.status === "limit_completed" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/40 text-purple-400 border border-purple-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Token Completed (Switched)
                      </span>
                    ) : k.status === "active_serving" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active (Serving)
                      </span>
                    ) : k.status === "standby" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                        Standby (Queue #{idx + 1})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 w-44">
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>{k.dailyRequests || 0} req</span>
                        <span className="font-semibold text-white">{k.dailyPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            (k.dailyPercent || 0) > 85 ? "bg-rose-500" : (k.dailyPercent || 0) > 50 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, k.dailyPercent || 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {(14400 - (k.dailyRequests || 0)).toLocaleString()} remaining today
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">
                    <div>
                      {(k.totalTokens || 0).toLocaleString()}{" "}
                      <span className="text-[10px] text-neutral-400 font-normal">
                        tokens ({((k.totalTokens || 0) / 1000).toFixed(1)}k)
                      </span>
                    </div>
                    <div className="text-[10px] text-[#B68A55] font-medium">
                      {(k.dailyTokens || 0).toLocaleString()} today
                    </div>
                    {k.liveRemainingTokens && (
                      <div className="text-[9px] text-teal-400 font-mono mt-0.5" title="Groq per-minute burst limit (6,000 TPM limit). Resets every 60 seconds!">
                        Per-Min Speed: {(k.liveRemainingTokens).toLocaleString()} / 6k TPM (resets in 60s)
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {k.status === "limit_completed" && (
                        <button
                          onClick={() => handleResetUsage(k.id, k.label)}
                          title="Reset daily usage to 0 and re-enable key"
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/50 transition-colors cursor-pointer"
                        >
                          Reset Limit
                        </button>
                      )}
                      {k.status === "standby" && (
                        <button
                          onClick={() => handleSetPrimary(k.id, k.label)}
                          title="Make this key the Active Serving key"
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#B68A55]/15 text-[#B68A55] hover:bg-[#B68A55]/25 border border-[#B68A55]/30 transition-colors cursor-pointer"
                        >
                          Make Active
                        </button>
                      )}
                      {k.status === "rate_limited" && (
                        <button
                          onClick={() => handleResetCooldown(k.id)}
                          title="Reset rate-limit cooldown"
                          className="p-1.5 text-amber-400 hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(k.id, k.isActive)}
                        title={k.isActive ? "Pause key" : "Enable key"}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          k.isActive
                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                            : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50"
                        }`}
                      >
                        {k.isActive ? "Pause" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(k.id, k.label)}
                        title="Delete key"
                        className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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
    </div>
  );
}
