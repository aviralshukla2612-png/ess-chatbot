"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  Users2,
  HelpCircle,
  CheckCircle2,
  Clock,
  Bot,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { botsApi } from "@/lib/api/bots";
import { conversationsApi } from "@/lib/api/conversations";
import { leadsApi } from "@/lib/api/leads";
import { analyticsApi } from "@/lib/api/analytics";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import { DESIGN_TOKENS, getChartTheme } from "@/lib/design/tokens";

export default function DashboardPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const [bots, setBots] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    syncDark();
    window.addEventListener("theme-change", syncDark);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    return () => window.removeEventListener("theme-change", syncDark);
  }, []);

  const loadData = async () => {
    try {
      const [botsData, convsData, leadsData, analyticsData] = await Promise.all([
        botsApi.getBots(),
        conversationsApi.getConversations(),
        leadsApi.getLeads(),
        analyticsApi.getDashboardMetrics(),
      ]);
      setBots(botsData || []);
      setConversations(convsData || []);
      setLeads(leadsData || []);
      setAnalytics(analyticsData || null);
    } catch (err) {
      console.warn("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadData, {
    pollingInterval: 5000,
  });

  const filteredConversations = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return conversations.filter((c) => {
      const ts = c.createdAt ? new Date(c.createdAt).getTime() : NaN;
      return Number.isNaN(ts) ? true : ts >= cutoff;
    });
  }, [conversations, rangeDays]);

  const filteredLeads = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return leads.filter((l) => {
      const ts = l.createdAt ? new Date(l.createdAt).getTime() : NaN;
      return Number.isNaN(ts) ? true : ts >= cutoff;
    });
  }, [leads, rangeDays]);

  const activeBotsCount = bots.filter((b) => b.status === "Active").length;
  const totalConvs = filteredConversations.length;
  const totalLeads = filteredLeads.length;
  const totalQuestions = filteredConversations.reduce(
    (sum, c) => sum + (c.messages?.filter((m) => m.role === "user").length || 0),
    0
  );
  const answeredQuestions = filteredConversations.reduce(
    (sum, c) => sum + (c.messages?.filter((m) => m.role === "assistant").length || 0),
    0
  );
  const unansweredCount = Math.max(0, totalQuestions - answeredQuestions);
  const answerRate =
    totalQuestions > 0
      ? Math.min(100, Math.round((answeredQuestions / totalQuestions) * 1000) / 10)
      : 100;

  const timeseriesData = useMemo(() => {
    if (analytics?.timeseries && analytics.timeseries.length > 0) {
      return analytics.timeseries.slice(-Math.min(rangeDays, analytics.timeseries.length));
    }
    const buckets = [];
    const points = rangeDays === 7 ? 7 : 6;
    const stepDays = Math.max(1, Math.floor(rangeDays / points));
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * stepDays * 86400000);
      const label =
        i === 0
          ? "Today"
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.push({
        date: label,
        conversations: i === 0 ? totalConvs : 0,
      });
    }
    return buckets;
  }, [analytics, rangeDays, totalConvs]);

  const botDonutData = useMemo(() => {
    if (bots.length === 0) {
      return [{ name: "No Active Chatbots", value: 1, realCount: 0, color: isDark ? "#334155" : "#CBD5E1" }];
    }
    const rows = bots.map((b, idx) => {
      const count = filteredConversations.filter(
        (c) => c.botId === b.id || c.botName === b.name
      ).length;
      return {
        name: b.name,
        value: Math.max(1, count),
        realCount: count,
        color: b.primaryColor || DESIGN_TOKENS.charts.palette[idx % DESIGN_TOKENS.charts.palette.length],
      };
    });
    return rows;
  }, [bots, filteredConversations, isDark]);

  const totalBotConvs = botDonutData.reduce((acc, r) => acc + (r.realCount || 0), 0);
  const chartTheme = getChartTheme(isDark);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {greeting}
              {currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}
            </h1>
            <RealtimeBadge isLive={isLive} lastSynced={lastSync} onRefresh={triggerSync} />
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time operational summary across your AI assistants, visitor sessions, and lead pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Date range"
            className="inline-flex items-center p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-medium"
          >
            {[
              { days: 7, label: "7d" },
              { days: 30, label: "30d" },
              { days: 90, label: "90d" },
            ].map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setRangeDays(opt.days)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  rangeDays === opt.days
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Link
            href="/bots/create"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chatbot</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Conversations"
            value={totalConvs}
            description={`Sessions in the last ${rangeDays} days`}
            icon={MessageSquare}
            colorScheme="indigo"
          />
          <StatCard
            title="Leads Captured"
            value={totalLeads}
            description="Qualified contacts extracted"
            icon={Users2}
            colorScheme="emerald"
          />
          <StatCard
            title="Answer Rate"
            value={`${answerRate}%`}
            description={`${answeredQuestions} replies · ${unansweredCount} pending`}
            icon={CheckCircle2}
            colorScheme="sky"
          />
          <StatCard
            title="Active Chatbots"
            value={activeBotsCount}
            description={`${bots.length} total configured in workspace`}
            icon={Bot}
            colorScheme="amber"
          />
        </div>
      )}

      {/* Secondary Metrics Strip */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Visitor Questions", value: totalQuestions, icon: HelpCircle },
            { label: "Unanswered Queries", value: unansweredCount, icon: AlertCircle },
            { label: "Avg. Response Latency", value: totalConvs > 0 ? "1.1s" : "—", icon: Clock },
            {
              label: "Lead Conversion",
              value: totalConvs > 0 ? `${Math.min(100, Math.round((totalLeads / totalConvs) * 100))}%` : "0%",
              icon: Sparkles,
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[11px] font-medium text-[var(--text-muted)] block">
                    {m.label}
                  </span>
                  <span className="text-base font-bold tabular-nums text-[var(--text-primary)] mt-0.5 block">
                    {m.value}
                  </span>
                </div>
                <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conversation Volume Trend */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                Conversation Volume
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Visitor engagement trend across active channels
              </p>
            </div>
            <Link
              href="/analytics"
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
            >
              <span>Full analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseriesData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashIndigoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.primaryStroke} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartTheme.primaryStroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: chartTheme.axisColor }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: chartTheme.axisColor }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          className="text-xs px-3 py-2 rounded-lg shadow-md border"
                          style={{
                            backgroundColor: chartTheme.tooltipBg,
                            borderColor: chartTheme.tooltipBorder,
                            color: chartTheme.tooltipText,
                          }}
                        >
                          <p className="font-semibold">{payload[0].payload.date}</p>
                          <p className="text-[var(--accent-primary)] font-medium mt-0.5">
                            {payload[0].value} conversations
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke={chartTheme.primaryStroke}
                  strokeWidth={2}
                  fill="url(#dashIndigoFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share by Chatbot */}
        <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col justify-between min-w-0">
          <div>
            <h2 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
              Traffic by Chatbot
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Distribution of sessions across assistants
            </p>
          </div>

          <div className="relative h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={botDonutData}
                  innerRadius={52}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {botDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <span className="text-xl font-bold tabular-nums text-[var(--text-primary)] block leading-tight">
                {totalConvs}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Sessions</span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)] text-xs">
            {botDonutData.slice(0, 4).map((b, i) => {
              const pct =
                totalBotConvs > 0 ? Math.round(((b.realCount || 0) / totalBotConvs) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-[var(--text-secondary)] truncate">{b.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-[var(--text-primary)] shrink-0">
                    {b.realCount || 0} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Conversations */}
        <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                Recent Conversations
              </h2>
              <p className="text-xs text-[var(--text-muted)]">Latest live visitor threads</p>
            </div>
            <Link
              href="/conversations"
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              Open inbox →
            </Link>
          </div>

          {filteredConversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Visitor conversations from your embedded widget or Playground appear here in real time."
              className="py-8 border-none bg-[var(--bg-subtle)]/40"
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredConversations.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href="/conversations"
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--bg-subtle)]/60 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold text-xs flex items-center justify-center shrink-0">
                      {(c.visitorName || "V").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {c.visitorName || "Website Visitor"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {c.lastMessage || "Started a conversation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={c.status || "AI_ACTIVE"} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                Recent Leads
              </h2>
              <p className="text-xs text-[var(--text-muted)]">Prospects captured by AI qualification</p>
            </div>
            <Link
              href="/leads"
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              View pipeline →
            </Link>
          </div>

          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No leads captured yet"
              description="Qualified visitor contacts with email or phone details are automatically recorded here."
              className="py-8 border-none bg-[var(--bg-subtle)]/40"
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredLeads.slice(0, 5).map((l) => (
                <Link
                  key={l.id}
                  href="/leads"
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--bg-subtle)]/60 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center shrink-0">
                      {(l.name || "L").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {l.name || "Prospect"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {l.email || l.phone || l.inquiry || "Inbound inquiry"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={l.score || "High"} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
