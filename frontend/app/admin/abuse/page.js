"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Activity,
  RefreshCw,
  Unlock,
  AlertTriangle,
  Clock,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";

export default function AdminAbuseProtectionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockType, setBlockType] = useState("ip");
  const [blockKey, setBlockKey] = useState("");
  const [blockDuration, setBlockDuration] = useState("3600");
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/abuse", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (e) {
      console.warn("Failed to load abuse monitoring data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!blockKey.trim()) return;
    setActionLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/admin/abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block",
          type: blockType,
          key: blockKey.trim(),
          durationSec: parseInt(blockDuration, 10),
          reason: blockReason.trim() || "Manual security block by platform admin",
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setStatusMessage(`Successfully blocked ${blockType} '${blockKey.trim()}'.`);
        setBlockKey("");
        setBlockReason("");
        await loadData();
      } else {
        setStatusMessage(`Error: ${resJson.error}`);
      }
    } catch (err) {
      setStatusMessage(`Failed to block: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (type, key) => {
    setActionLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/admin/abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unblock",
          type,
          key,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setStatusMessage(`Successfully unblocked ${type} '${key}'.`);
        await loadData();
      }
    } catch (err) {
      setStatusMessage(`Failed to unblock: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const summary = data?.summary || {};
  const blockedList = data?.blocked || [];
  const events = data?.recentEvents || [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Security & Traffic"
        title="Abuse Prevention & Traffic Management"
        description="Monitor multi-layer rate limiting, automated progressive cooldowns, and manage active IP / Visitor blocklists."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh Feed
          </Button>
        }
      />

      {statusMessage && (
        <div className="p-3 text-xs rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          {statusMessage}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Security Events"
          value={summary.totalRecordedEvents ?? 0}
          icon={Activity}
          subtext="Rate-limit triggers & suspicious probes"
        />
        <StatCard
          label="Throttled Requests"
          value={summary.throttledCount ?? 0}
          icon={Clock}
          subtext="HTTP 429 rate limit interventions"
        />
        <StatCard
          label="Blocked Entities"
          value={summary.blockedCount ?? 0}
          icon={Ban}
          subtext="Progressive cooldowns & manual blocks"
        />
        <StatCard
          label="Active Blocks"
          value={summary.activeMemoryBlocks ?? 0}
          icon={ShieldAlert}
          subtext="Currently restricted IPs & visitors"
        />
      </div>

      {/* Manual Block Form */}
      <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Ban className="w-4 h-4 text-rose-500" />
          Enforce Manual Restriction
        </h3>
        <form onSubmit={handleBlock} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Target Type
            </label>
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="ip">IP Address</option>
              <option value="visitor">Visitor ID / Token</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              IP or Visitor Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. 203.0.113.195 or vis_abc123"
              value={blockKey}
              onChange={(e) => setBlockKey(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Duration
            </label>
            <select
              value={blockDuration}
              onChange={(e) => setBlockDuration(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="900">15 Minutes</option>
              <option value="3600">1 Hour</option>
              <option value="86400">24 Hours</option>
              <option value="0">Permanent</option>
            </select>
          </div>
          <div>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={actionLoading || !blockKey}
              className="w-full h-9"
              icon={<ShieldAlert className="w-4 h-4" />}
            >
              Apply Restriction
            </Button>
          </div>
        </form>
      </div>

      {/* Active Restrictions Table */}
      <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Active Entity Restrictions ({blockedList.length})
          </span>
        </h3>
        {blockedList.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
            No active restrictions. All traffic is flowing normally within standard rate limits.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Identifier</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">Remaining</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {blockedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-subtle)]">
                    <td className="py-2 px-3 font-semibold uppercase">{item.type}</td>
                    <td className="py-2 px-3 font-mono text-indigo-400">{item.key}</td>
                    <td className="py-2 px-3 text-[var(--text-secondary)]">{item.reason}</td>
                    <td className="py-2 px-3">
                      {item.remainingSec ? `${Math.ceil(item.remainingSec / 60)} mins` : "Permanent"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleUnblock(item.type, item.key)}
                        disabled={actionLoading}
                        icon={<Unlock className="w-3.5 h-3.5 text-emerald-500" />}
                      >
                        Release
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Abuse & Rate-Limit Events Log */}
      <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Live Security & Rate-Limit Event Stream (Last 50)
        </h3>
        {events.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
            No abuse events recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
                <tr className="text-[var(--text-secondary)]">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Event Type</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[var(--bg-subtle)]">
                    <td className="py-2 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-semibold">{evt.type}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.severity === "CRITICAL" || evt.severity === "HIGH"
                            ? "bg-rose-500/15 text-rose-400"
                            : evt.severity === "MEDIUM"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-indigo-500/15 text-indigo-400"
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{evt.subjectKey}</td>
                    <td className="py-2 px-3 font-semibold">{evt.actionTaken}</td>
                    <td className="py-2 px-3 text-[var(--text-secondary)] max-w-xs truncate">{evt.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
