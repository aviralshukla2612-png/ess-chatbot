import { NextResponse } from "next/server";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { leadsStore } from "@/lib/db/leadsStore";
import { botsStore } from "@/lib/db/botsStore";
import { requireAuth, ROLES } from "@/lib/auth/guard";

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { searchParams } = new URL(request.url);
    const requestedOrg = searchParams.get("organizationId");

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const targetOrgId = isSuperAdmin ? (requestedOrg || null) : principal.organizationId;

    const conversations = conversationsStore.getConversations({ organizationId: targetOrgId });
    const leads = leadsStore.getLeads({ organizationId: targetOrgId });
    const bots = botsStore.getBots(targetOrgId);

    const totalConversations = conversations.length;
    const totalLeads = leads.length;

    const totalQuestions = conversations.reduce(
      (sum, c) => sum + (c.messages?.filter((m) => m.role === "user").length || 0),
      0
    );

    const answeredQuestions = conversations.reduce(
      (sum, c) => sum + (c.messages?.filter((m) => m.role === "assistant").length || 0),
      0
    );

    const answerRate =
      totalQuestions > 0
        ? Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100 * 10) / 10)
        : 100;

    const activeBotsCount = bots.filter((b) => b.status === "Active").length;

    // Build real timeseries data (group by date)
    const dateMap = {};
    const now = new Date();
    // Pre-populate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateMap[label] = { date: label, conversations: 0, leads: 0, questions: 0 };
    }

    conversations.forEach((c) => {
      const d = c.createdAt ? new Date(c.createdAt) : now;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dateMap[label]) {
        dateMap[label].conversations += 1;
        const qCount = c.questionsCount ?? c.messages?.filter((m) => m.role === "user").length ?? 0;
        dateMap[label].questions += qCount;
      }
    });

    leads.forEach((l) => {
      const d = l.createdAt ? new Date(l.createdAt) : now;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dateMap[label]) {
        dateMap[label].leads += 1;
      }
    });

    const timeseries = Object.values(dateMap);

    // Calculated average response time between user question and assistant answer
    let totalDiff = 0;
    let pairs = 0;
    conversations.forEach((c) => {
      const msgs = c.messages || [];
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === "user" && msgs[i + 1].role === "assistant") {
          const t1 = new Date(msgs[i].createdAt || msgs[i].timestamp).getTime();
          const t2 = new Date(msgs[i + 1].createdAt || msgs[i + 1].timestamp).getTime();
          if (!isNaN(t1) && !isNaN(t2) && t2 >= t1 && t2 - t1 < 60000) {
            totalDiff += t2 - t1;
            pairs++;
          }
        }
      }
    });

    let avgResponseTime = "—";
    if (pairs > 0) {
      avgResponseTime = `${(totalDiff / pairs / 1000).toFixed(1)}s`;
    } else if (totalConversations > 0) {
      avgResponseTime = "< 1s";
    }

    // Period-over-period comparison (current 7 days vs previous 7 days)
    const MS_PER_DAY = 86400000;
    const nowTime = now.getTime();
    const period7Days = 7 * MS_PER_DAY;
    const period14Days = 14 * MS_PER_DAY;

    const convsCurrentPeriod = conversations.filter((c) => {
      const t = new Date(c.createdAt || now).getTime();
      return t >= nowTime - period7Days && t <= nowTime;
    }).length;
    const convsPriorPeriod = conversations.filter((c) => {
      const t = new Date(c.createdAt || now).getTime();
      return t >= nowTime - period14Days && t < nowTime - period7Days;
    }).length;

    const leadsCurrentPeriod = leads.filter((l) => {
      const t = new Date(l.createdAt || now).getTime();
      return t >= nowTime - period7Days && t <= nowTime;
    }).length;
    const leadsPriorPeriod = leads.filter((l) => {
      const t = new Date(l.createdAt || now).getTime();
      return t >= nowTime - period14Days && t < nowTime - period7Days;
    }).length;

    const computeChange = (current, prior) => {
      if (prior > 0) {
        const pct = Math.round(((current - prior) / prior) * 100);
        return { change: `${pct >= 0 ? "+" : ""}${pct}%`, pos: pct >= 0 };
      }
      if (current > 0 && prior === 0) {
        return { change: "—", pos: true };
      }
      return { change: "0%", pos: true };
    };

    return NextResponse.json({
      success: true,
      metrics: {
        totalConversations,
        uniqueVisitors: totalConversations,
        totalQuestions,
        leadsGenerated: totalLeads,
        answerRate: `${answerRate}%`,
        avgResponseTime,
        activeBotsCount,
        unansweredCount: Math.max(0, totalQuestions - answeredQuestions),
        periodComparison: {
          conversations: computeChange(convsCurrentPeriod, convsPriorPeriod),
          leads: computeChange(leadsCurrentPeriod, leadsPriorPeriod),
        },
      },
      timeseries,
      botsDistribution: bots.map((b) => ({
        name: b.name,
        value: conversations.filter((c) => c.botId === b.id || c.botName === b.name).length,
        color: b.primaryColor || "#4f46e5",
      })),
      recentConversations: conversations.slice(0, 5),
      recentLeads: leads.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
