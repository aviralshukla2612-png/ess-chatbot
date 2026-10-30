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

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Key className="w-7 h-7 text-indigo-600" />
            Groq API Key Pool & Rate Limits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Priority Active-Standby Failover: 1 key actively serves traffic while backup keys remain on standby for automatic 429 failover.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dynamic Sync (3s)</span>
          </div>
          <a
            href="https://console.groq.com/settings/organization/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-xs whitespace-nowrap"
          >
            <span>Groq Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setAddingKey(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-all whitespace-nowrap"
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
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Add Key Modal / Card */}
      {addingKey && (
        <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-md animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Add Another Groq API Key to Pool
            </h3>
            <button
              onClick={() => setAddingKey(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Create another free account on <b>console.groq.com</b>, generate an API key (`gsk_...`), and paste it here. Each key adds <b>14,400 daily requests</b> and <b>30 RPM</b> capacity to your SaaS!
          </p>
          <form onSubmit={handleAddKey} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Key Label / Owner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account #2 - Marketing"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Groq API Key (gsk_...)
                </label>
                <input
                  type="password"
                  required
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddingKey(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
              >
                {submitting ? "Adding..." : "Add to Live Pool"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aggregate Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Pool Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Serving Key</span>
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {stats?.activeKeysCount || 1}
            </span>
            <span className="text-xs text-slate-400">
              active • {stats?.standbyKeysCount || 0} standby {stats?.standbyKeysCount === 1 ? 'backup' : 'backups'}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Priority Failover (1 Live, Rest on Standby)</span>
          </div>
        </div>

        {/* Card 2: Combined Daily Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Daily Requests</span>
            <Server className="w-3.5 h-3.5 text-teal-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {stats?.totalDailyRequests || 0}
            </span>
            <span className="text-xs text-slate-400">
              used / {((stats?.totalCapacityRequests || 14400) / 1000).toFixed(1)}k available
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, stats?.overallDailyPercent || 0))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>
              Left: <b className="text-teal-600 font-semibold">{Math.max(0, (stats?.totalCapacityRequests || 14400) - (stats?.totalDailyRequests || 0)).toLocaleString()}</b> remaining
            </span>
            <span className="text-slate-400 font-medium">
              {((stats?.totalCapacityRequests || 14400) / 1000).toFixed(1)}k Limit ({stats?.activeKeysCount || 1} {stats?.activeKeysCount === 1 ? "key" : "keys"})
            </span>
          </p>
        </div>

        {/* Card 3: Groq Token Usage */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Groq Token Usage</span>
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {((stats?.totalDailyTokens || 0) / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-400">
              used / {((stats?.totalDailyTokenCapacity || 500000) / 1000).toLocaleString()}k available
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(1, stats?.overallTokenPercent || 0))}%`
              }}
            />
          </div>
          <p className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>
              Left: <b className="text-emerald-600 font-semibold">{((Math.max(0, (stats?.totalDailyTokenCapacity || 500000) - (stats?.totalDailyTokens || 0))) / 1000).toFixed(1)}k</b> remaining
            </span>
            <span className="text-emerald-600 font-semibold">
              Free Tier ({((stats?.totalDailyTokenCapacity || 500000) / 1000).toLocaleString()}k/day)
            </span>
          </p>
        </div>

        {/* Card 4: Rate Limited / Cooldown status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Failover & Health</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {stats?.rateLimitedKeysCount || 0}
            </span>
            <span className="text-xs text-slate-400">in cooldown</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Auto-failover enabled: 0 visitor drops
          </p>
        </div>
      </div>

      {/* Keys List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Active Groq API Keys in Rotation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, daily usage, token tracking, and per-key controls.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {stats?.keys?.length || 0} Keys Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Account / Label</th>
                <th className="px-5 py-3.5">API Key (Masked)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Today's Requests (14.4k Limit)</th>
                <th className="px-5 py-3.5">Total Tokens</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!stats?.keys || stats.keys.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No keys in pool yet. Click <b>"Add Groq Key"</b> above to add your first key!
                  </td>
                </tr>
              )}
              {stats?.keys?.map((k, idx) => (
                <tr key={k.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                        #{idx + 1}
                      </div>
                      <span>{k.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-600">
                    <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                      {k.maskedKey}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {k.status === "rate_limited" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Cooldown ({k.cooldownRemainingSec}s)
                      </span>
                    ) : k.status === "error" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Auth Error
                      </span>
                    ) : k.status === "active_serving" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active (Serving)
                      </span>
                    ) : k.status === "standby" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Standby (Backup)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 w-44">
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>{k.dailyRequests || 0} req</span>
                        <span className="font-semibold">{k.dailyPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            (k.dailyPercent || 0) > 85 ? "bg-rose-500" : (k.dailyPercent || 0) > 50 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, k.dailyPercent || 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {(14400 - (k.dailyRequests || 0)).toLocaleString()} remaining today
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    <div>
                      {(k.totalTokens || 0).toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        tokens ({((k.totalTokens || 0) / 1000).toFixed(1)}k)
                      </span>
                    </div>
                    <div className="text-[10px] text-indigo-600 font-medium">
                      {(k.dailyTokens || 0).toLocaleString()} today
                    </div>
                    {k.liveRemainingTokens && (
                      <div className="text-[9px] text-teal-600 font-mono mt-0.5">
                        Live TPM: {(k.liveRemainingTokens).toLocaleString()} rem
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {k.status === "standby" && (
                        <button
                          onClick={() => handleSetPrimary(k.id, k.label)}
                          title="Make this key the Active Serving key"
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                        >
                          Make Active
                        </button>
                      )}
                      {k.status === "rate_limited" && (
                        <button
                          onClick={() => handleResetCooldown(k.id)}
                          title="Reset rate-limit cooldown"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(k.id, k.isActive)}
                        title={k.isActive ? "Pause key" : "Enable key"}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          k.isActive
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {k.isActive ? "Pause" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(k.id, k.label)}
                        title="Delete key"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
