/**
 * Admin Abuse Protection, Traffic Management & IP/Visitor Block API
 *
 * Strictly restricted to platform Super-Admins.
 * Provides live visibility into traffic anomalies, rate-limit triggers,
 * and enables manual temporary/permanent blocking or unblocking of abusive entities.
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { abuseDetectionService } from "@/lib/security/abuseDetectionService";
import { getRateLimitPolicies, getAiResourceLimits } from "@/lib/security/rateLimitPolicy";

export async function GET(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const summary = abuseDetectionService.getAbuseSummary();
    const blocked = abuseDetectionService.getBlockedList();
    const recentEvents = abuseDetectionService.getRecentAbuseEvents(50);
    const policies = getRateLimitPolicies();
    const aiLimits = getAiResourceLimits();

    return NextResponse.json({
      success: true,
      summary,
      blocked,
      recentEvents,
      policies,
      aiLimits,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { action, type, key, durationSec = 3600, reason } = body;
    const adminUser = auth.principal?.email || "SUPER_ADMIN";

    if (action === "block") {
      if (!type || !key) {
        return NextResponse.json({ success: false, error: "Subject type and key are required to block." }, { status: 400 });
      }
      await abuseDetectionService.blockSubject({
        type,
        key,
        durationSec: Number(durationSec) || 3600,
        reason: reason || "Administratively blocked by platform security",
        blockedBy: adminUser,
      });
      return NextResponse.json({
        success: true,
        message: `Successfully blocked ${type} '${key}' for ${durationSec} seconds.`,
      });
    }

    if (action === "unblock") {
      if (!type || !key) {
        return NextResponse.json({ success: false, error: "Subject type and key are required to unblock." }, { status: 400 });
      }
      await abuseDetectionService.unblockSubject({
        type,
        key,
        unblockedBy: adminUser,
      });
      return NextResponse.json({
        success: true,
        message: `Successfully unblocked ${type} '${key}'.`,
      });
    }

    if (action === "clear_events") {
      abuseDetectionService._resetAbuseMemory();
      return NextResponse.json({
        success: true,
        message: "Abuse event logs cleared successfully.",
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: '${action}'` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
