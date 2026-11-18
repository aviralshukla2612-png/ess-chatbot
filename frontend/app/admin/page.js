"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Bot,
  MessageSquare,
  HelpCircle,
  Target,
  CheckCircle2,
  CreditCard,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { analyticsApi } from "@/lib/api/analytics";
import { getChartTheme } from "@/lib/design/tokens";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";

export default function AdminOverviewPage() {
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [metrics, setMetrics] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [statsData, setStatsData] = useState({
    organizationsCount: 1,
    usersCount: 1,
    botsCount: 1,
    conversationsCount: 0,
    questionsCount: 0,
    leadsCount: 0,
    uptime: "99.9%",
    tier: "Enterprise",
  });
  const [topOrgs, setTopOrgs] = useState([]);
  const [growthData, setGrowthData] = useState([
    { date: "Day 1", orgs: 1, users: 1, bots: 1 },
    { date: "Today", orgs: 1, users: 1, bots: 1 },
  ]);

  useEffect(() => {
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const loadData = async () => {
    try {
      const [dashMetrics, statsRes] = await Promise.all([
        analyticsApi.getDashboardMetrics(),
        fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)),
      ]);
      setMetrics(dashMetrics);
      if (statsRes?.success) {
        if (statsRes.stats) setStatsData(statsRes.stats);
        if (statsRes.topOrganizations) setTopOrgs(statsRes.topOrganizations);
        if (statsRes.growthTrend?.length > 0) setGrowthData(statsRes.growthTrend);
      }
    } catch (err) {
      console.warn("Admin real-time sync error:", err);
    }
  };

  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadData, {
    pollingInterval: 6000,
  });

  const chartTheme = getChartTheme(isDark);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Super Admin Control Plane"
        title="Platform Overview & Global Monitor"
        description="Real-time multi-tenant workspace health, global AI throughput, and top tenant activity."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <RealtimeBadge isLive={isLive} lastSynced={lastSync} onRefresh={triggerSync} />

            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                aria-label="Select platform time window"
                className="appearance-none pl-3.5 pr-8 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold text-[var(--text-primary)] outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 90 days">Last 90 days</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* 8 Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Organizations"
          value={statsData.organizationsCount}
          icon={Building2}
          colorScheme="indigo"
        />
        <StatCard
          title="Registered Users"
          value={statsData.usersCount}
          icon={Users}
          colorScheme="sky"
        />
        <StatCard
          title="Deployed Bots"
          value={statsData.botsCount ?? metrics?.activeBotsCount ?? 0}
          icon={Bot}
          colorScheme="emerald"
        />
        <StatCard
          title="Conversations"
          value={statsData.conversationsCount || metrics?.totalConversations || 0}
          icon={MessageSquare}
          colorScheme="indigo"
        />
        <StatCard
          title="Visitor Questions"
          value={statsData.questionsCount || metrics?.totalQuestions || 0}
          icon={HelpCircle}
          colorScheme="violet"
        />
        <StatCard
          title="Generated Leads"
          value={statsData.leadsCount || metrics?.leadsGenerated || 0}
          icon={Target}
          colorScheme="amber"
        />
        <StatCard
          title="Platform Uptime"
          value={statsData.uptime || "99.9%"}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Control Tier"
          value={statsData.tier || "Enterprise"}
          icon={CreditCard}
          colorScheme="slate"
        />
      </div>

      {/* Bottom Grid: Platform Growth & Top Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Multi-Tenant Platform Growth
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Workspaces, users, and active chatbots over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[var(--text-secondary)] font-medium">Orgs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-[var(--text-secondary)] font-medium">Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[var(--text-secondary)] font-medium">Bots</span>
              </div>
            </div>
          </div>

          <div className="h-68 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={growthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adminUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.secondary} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartTheme.secondary} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="adminBots" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.tertiary} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartTheme.tertiary} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="adminOrgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.primary} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartTheme.primary} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartTheme.grid}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: chartTheme.axisText }}
                  axisLine={{ stroke: chartTheme.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTheme.axisText }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: chartTheme.tooltipText,
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={chartTheme.secondary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#adminUsers)"
                  name="Users"
                />
                <Area
                  type="monotone"
                  dataKey="bots"
                  stroke={chartTheme.tertiary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#adminBots)"
                  name="Bots"
                />
                <Area
                  type="monotone"
                  dataKey="orgs"
                  stroke={chartTheme.primary}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#adminOrgs)"
                  name="Organizations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Top Organizations
              </h3>
              <Link
                href="/admin/organizations"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                    <th className="py-2.5 pr-2">Organization</th>
                    <th className="py-2.5 px-2 text-center">Bots</th>
                    <th className="py-2.5 px-2 text-center">Chats</th>
                    <th className="py-2.5 pl-2 text-right">Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {topOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                        No organizations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    topOrgs.map((org, idx) => (
                      <tr
                        key={org.id || `${org.name}-${idx}`}
                        className="hover:bg-[var(--bg-subtle)]/40 transition-colors"
                      >
                        <td className="py-3 pr-2 font-semibold text-[var(--text-primary)] truncate max-w-[160px]">
                          {org.name}
                        </td>
                        <td className="py-3 px-2 text-center text-[var(--text-secondary)] font-mono tabular-nums">
                          {org.bots ?? org.botsCount ?? 0}
                        </td>
                        <td className="py-3 px-2 text-center text-[var(--text-secondary)] font-mono tabular-nums">
                          {org.conversations ?? org.conversationsCount ?? 0}
                        </td>
                        <td className="py-3 pl-2 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                          {org.users ?? org.usersCount ?? 1}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
