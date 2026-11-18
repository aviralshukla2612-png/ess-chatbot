"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Database,
  Layers,
  Infinity as InfinityIcon,
  RefreshCw,
} from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";
import { adminApi } from "@/lib/api/admin";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminUsagePage() {
  const [metrics, setMetrics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [m, orgRes] = await Promise.all([
        analyticsApi.getDashboardMetrics(),
        adminApi.getOrganizations({ page: 1, limit: 50, status: "ALL" }),
      ]);
      setMetrics(m || null);
      if (orgRes?.success && Array.isArray(orgRes.data)) {
        setOrganizations(orgRes.data);
      }
    } catch (e) {
      console.warn("Failed to load usage metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalQuestions = metrics?.totalQuestions || 0;
  const totalConversations = metrics?.totalConversations || 0;
  const estimatedTokens = totalQuestions * 340 + totalConversations * 180;
  const tokenFormatted =
    estimatedTokens >= 1000
      ? `${(estimatedTokens / 1000).toFixed(1)}k`
      : String(estimatedTokens);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Compute & Quotas"
        title="Platform Compute & Resource Usage"
        description="Monitor LLM token throughput, pgvector knowledge storage, and per-tenant bot allocations."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
            Refresh
          </Button>
        }
      />

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Estimated Inference Tokens"
          value={tokenFormatted}
          description={`${totalQuestions} visitor questions processed across active bots`}
          icon={Cpu}
          colorScheme="indigo"
        />
        <StatCard
          title="Vector Embedding Engine"
          value="768-dim"
          description="Isolated per-organization & per-bot RAG chunks"
          icon={Database}
          colorScheme="sky"
        />
        <StatCard
          title="Active Tenants"
          value={organizations.length}
          description="Enforced per-request rate limits & token guards"
          icon={Layers}
          colorScheme="emerald"
        />
      </div>

      {/* Tenant Breakdown Table */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                Tenant Resource & Bot Allocation
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Live bot counts, conversation volume, and plan quotas across registered organizations.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              {organizations.length} {organizations.length === 1 ? "Tenant" : "Tenants"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Bot Allocation</th>
                  <th className="p-4">Conversations</th>
                  <th className="p-4">Monthly Message Cap</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                    <td className="p-4 font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        {(org.name || "WS").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[200px]">{org.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        {org.plan || "Starter"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                      {org.botsCount ?? 0} / 1
                    </td>
                    <td className="p-4 font-mono text-[var(--text-secondary)] tabular-nums">
                      {(org.conversationsCount ?? 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                        <InfinityIcon className="w-3 h-3" />
                        Unlimited (Rate-Guarded)
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <StatusBadge status={org.status || "ACTIVE"} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
