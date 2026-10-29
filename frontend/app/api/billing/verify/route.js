import { NextResponse } from "next/server";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

/**
 * POST /api/billing/verify
 * Confirms Razorpay mandate authorization or trial setup and activates trialing subscription.
 */
export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json().catch(() => ({}));
    const {
      subscriptionId,
      paymentId,
      planId = "STARTER",
      isTrial = true,
    } = body;

    const result = await billingService.activateSubscription({
      organizationId: principal.organizationId,
      subscriptionId: subscriptionId || `sub_trial_${Date.now()}`,
      paymentId,
      planId,
      isTrial: Boolean(isTrial),
    });

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      message: isTrial
        ? "7-Day Free Trial activated successfully! Autopay scheduled."
        : "Subscription activated successfully!",
    });
  } catch (err) {
    console.error("[BILLING_VERIFY_ERR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
