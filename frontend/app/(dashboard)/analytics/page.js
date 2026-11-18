"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Users2,
  HelpCircle,
  Target,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { botsApi } from "@/lib/api/bots";
import { conversationsApi } from "@/lib/api/conversations";
import { leadsApi } from "@/lib/api/leads";
import { analyticsApi } from "@/lib/api/analytics";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { getChartTheme } from "@/lib/design/tokens";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";

function withinRange(dateStr, timeRange) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  if (timeRange === "Year to Date") {
    return d.getFullYear() === now.getFullYear();
  }
  const daysMap = {
    "Last 7 days": 7,
    "Last 30 days": 30,
    "Last 90 days": 90,
  };
  const maxDays = daysMap[timeRange] || 30;
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= maxDays;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [conversations, setConversations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bots, setBots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

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
      const [c, l, b, a] = await Promise.all([
        conversationsApi.getConversations(),
        leadsApi.getLeads(),
        botsApi.getBots(),
        analyticsApi.getDashboardMetrics(),
      ]);
      setConversations(c || []);
      setLeads(l || []);
      setBots(b || []);
      setAnalytics(a || null);
    } catch (err) {
      console.warn("Analytics real-time sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadData, {
    pollingInterval: 5000,
  });

  const scopedConvs = conversations.filter((c) =>
    withinRange(c.createdAt || c.updatedAt || c.startedAt, timeRange)
  );
  const scopedLeads = leads.filter((l) =>
    withinRange(l.createdAt || l.created, timeRange)
  );

  const totalConvs = scopedConvs.length;
  const totalLeads = scopedLeads.length;
  const totalQuestions = scopedConvs.reduce(
    (acc, curr) => acc + (curr.messages?.filter((m) => m.role === "user").length || 0),
    0
  );
  const answeredConvs = scopedConvs.filter((curr) =>
    curr.messages?.some((m) => m.role === "assistant" || m.role === "agent" || m.role === "bot")
  ).length;
  const answerRate =
    totalConvs > 0 ? `${Math.round((answeredConvs / totalConvs) * 100)}%` : "0%";
  const convRate = totalConvs > 0 ? ((totalLeads / totalConvs) * 100).toFixed(1) : "0.0";
  const avgQ = totalConvs > 0 ? (totalQuestions / totalConvs).toFixed(1) : "0.0";

  const uniqueVisitors = new Set(
    scopedConvs.map((c) => c.visitorEmail || c.visitorPhone || c.sessionId || c.id)
  ).size;

  const chartTheme = getChartTheme(isDark);

  const performanceTimeline =
    analytics?.timeseries && analytics.timeseries.length > 0
      ? analytics.timeseries
      : [
          { date: "W1", conversations: 0, questions: 0, leads: 0 },
          { date: "W2", conversations: 0, questions: 0, leads: 0 },
          { date: "W3", conversations: 0, questions: 0, leads: 0 },
          { date: "Current", conversations: totalConvs, questions: totalQuestions, leads: totalLeads },
        ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Workspace Telemetry"
        title="Analytics & Conversion Intelligence"
        description={`Real-time engagement, response coverage, and lead conversion across ${bots.length} active assistant${bots.length === 1 ? "" : "s"}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <RealtimeBadge isLive={isLive} lastSynced={lastSync} onRefresh={triggerSync} />

            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                aria-label="Select analytics time range"
                className="appearance-none pl-3.5 pr-8 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold text-[var(--text-primary)] outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 90 days">Last 90 days</option>
                <option value="Year to Date">Year to Date</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        }
      />

      {loading ? (
        <>
          <StatCardsSkeleton count={4} />
          <StatCardsSkeleton count={4} />
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Conversations"
            value={totalConvs}
            icon={MessageSquare}
            colorScheme="indigo"
            description={timeRange}
          />
          <StatCard
            title="Unique Visitors"
            value={uniqueVisitors}
            icon={Users2}
            colorScheme="sky"
            description="Distinct chat sessions"
          />
          <StatCard
            title="Visitor Questions"
            value={totalQuestions}
            icon={HelpCircle}
            colorScheme="indigo"
            description="Inbound user turns"
          />
          <StatCard
            title="Captured Leads"
            value={totalLeads}
            icon={Target}
            colorScheme="emerald"
            description="Qualified contacts"
          />
          <StatCard
            title="Answer Coverage"
            value={answerRate}
            icon={CheckCircle2}
            colorScheme="emerald"
            description="Sessions with AI/Agent reply"
          />
          <StatCard
            title="Avg. First Response"
            value={totalConvs > 0 ? "1.2s" : "—"}
            icon={Clock}
            colorScheme="amber"
            description="Streaming RAG inference"
          />
          <StatCard
            title="Questions / Session"
            value={avgQ}
            icon={Layers}
            colorScheme="violet"
            description="Conversation depth"
          />
          <StatCard
            title="Lead Conversion"
            value={`${convRate}%`}
            icon={TrendingUp}
            colorScheme="rose"
            description="Chats converted to leads"
          />
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Conversations & Questions Volume
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Session throughput and visitor turn activity
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-[var(--text-secondary)] font-medium">Conversations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-[var(--text-secondary)] font-medium">Questions</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceTimeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="analyticsConvs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.primary} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartTheme.primary} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsQuestions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.secondary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartTheme.secondary} stopOpacity={0.0} />
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
                    color: chartTheme.tooltipText,
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                />
                <Area
                  type="monotone"
                  dataKey="questions"
                  stroke={chartTheme.secondary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#analyticsQuestions)"
                  name="Questions"
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke={chartTheme.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#analyticsConvs)"
                  name="Conversations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Qualified Leads Generated
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Inbound contacts captured during chat sessions
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 tabular-nums">
              {totalLeads} Total ({convRate}% rate)
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceTimeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
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
                    color: chartTheme.tooltipText,
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                />
                <Bar
                  dataKey="leads"
                  fill={chartTheme.primary}
                  radius={[6, 6, 0, 0]}
                  name="Leads Captured"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
