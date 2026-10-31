"use client";

import React, { useState } from "react";
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
import { botsApi } from "@/lib/api/bots";
import RealtimeBadge from "@/components/ui/RealtimeBadge";

export default function AdminOverviewPage() {
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [metrics, setMetrics] = useState(null);
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
  const [topOrgs, setTopOrgs] = useState([
    { name: "Emperor Smart Solutions", bots: 1, conversations: 0, users: 1 }
  ]);
  const [growthData, setGrowthData] = useState([
    { date: "Day 1", orgs: 1, users: 1, bots: 1 },
    { date: "Today", orgs: 1, users: 1, bots: 1 },
  ]);

  const loadData = async () => {
    try {
      const [dashMetrics, statsRes] = await Promise.all([
        analyticsApi.getDashboardMetrics(),
        fetch("/api/admin/stats").then((r) => r.ok ? r.json() : null),
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
    pollingInterval: 4000,
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Platform Overview & Global Monitor
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Real-time multi-tenant platform health and analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <RealtimeBadge isLive={isLive} lastSync={lastSync} onRefresh={triggerSync} />

          {/* Date Filter Dropdown */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 bg-[#0D0D0D] hover:bg-[#141414] border border-neutral-800 rounded-xl text-xs font-semibold text-neutral-200 outline-hidden shadow-xs cursor-pointer transition-colors"
            >
              <option value="Last 7 days" className="bg-[#0D0D0D] text-white">Last 7 days</option>
              <option value="Last 30 days" className="bg-[#0D0D0D] text-white">Last 30 days</option>
              <option value="Last 90 days" className="bg-[#0D0D0D] text-white">Last 90 days</option>
              <option value="All Time" className="bg-[#0D0D0D] text-white">All Time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 8 Platform KPI Cards (2 Rows of 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1, Card 1: Organizations */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {statsData.organizationsCount}
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Organizations
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Row 1, Card 2: Users */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {statsData.usersCount}
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Users
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-950/40 border border-sky-900/50 flex items-center justify-center text-sky-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Row 1, Card 3: Bots */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {statsData.botsCount ?? metrics?.activeBotsCount ?? 1}
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Bots
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-950/40 border border-teal-900/50 flex items-center justify-center text-teal-400">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        {/* Row 1, Card 4: Conversations */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.totalConversations ?? 0}
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Conversations
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Row 2, Card 5: Questions */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.totalQuestions ?? 0}
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Questions
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-violet-950/40 border border-violet-900/50 flex items-center justify-center text-violet-400">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Row 2, Card 6: Leads */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.leadsGenerated ?? 0}
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Leads
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-950/40 border border-amber-900/50 flex items-center justify-center text-amber-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Row 2, Card 7: Platform Uptime */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              99.9%
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Platform Uptime
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-950/40 border border-cyan-900/50 flex items-center justify-center text-cyan-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Row 2, Card 8: Monthly Plan */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              Enterprise
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">
              Active Tier
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#B68A55]/15 border border-[#B68A55]/30 flex items-center justify-center text-[#B68A55]">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Platform Growth & Top Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Platform Growth (7 cols) */}
        <div className="lg:col-span-7 bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-bold text-white">
              Platform Growth
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-neutral-300 font-medium">Organizations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-neutral-300 font-medium">Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span className="text-neutral-300 font-medium">Bots</span>
              </div>
            </div>
          </div>

          <div className="h-68 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBots" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#737373" }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#737373" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0A0A",
                    borderColor: "#262626",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    fontSize: "12px",
                    color: "#ffffff",
                  }}
                  itemStyle={{ color: "#e5e5e5" }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="Users"
                />
                <Area
                  type="monotone"
                  dataKey="bots"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBots)"
                  name="Bots"
                />
                <Area
                  type="monotone"
                  dataKey="orgs"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOrgs)"
                  name="Organizations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Organizations (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">
                Top Organizations
              </h3>
              <Link
                href="/admin/organizations"
                className="text-xs font-semibold text-[#B68A55] hover:text-[#d4af37] flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-500 font-semibold text-[11px] border-b border-neutral-800">
                    <th className="py-2.5 pr-2">Organization</th>
                    <th className="py-2.5 px-2 text-center">Bots</th>
                    <th className="py-2.5 px-2 text-center">Conversations</th>
                    <th className="py-2.5 pl-2 text-right">Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {topOrgs.map((org) => (
                    <tr key={org.name} className="hover:bg-neutral-900/60 transition-colors">
                      <td className="py-3 pr-2 font-semibold text-white">
                        {org.name}
                      </td>
                      <td className="py-3 px-2 text-center text-neutral-300 font-medium">
                        {org.bots}
                      </td>
                      <td className="py-3 px-2 text-center text-neutral-300 font-medium">
                        {metrics?.totalConversations ?? org.conversations ?? 0}
                      </td>
                      <td className="py-3 pl-2 text-right font-medium text-neutral-300">
                        {org.users}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
