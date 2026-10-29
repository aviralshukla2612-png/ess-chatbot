import { NextResponse } from "next/server";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

/**
 * POST /api/billing/cancel
 * Cancels active autopay or subscription so future charges will not deduct.
 */
export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const result = await billingService.cancelSubscription(principal.organizationId);

    return NextResponse.json({
      success: true,
      message: result.message || "Autopay cancelled successfully. You will not be charged.",
    });
  } catch (err) {
    console.error("[BILLING_CANCEL_ERR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
