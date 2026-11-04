import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

/**
 * POST /api/billing/verify
 * Confirms Razorpay payment or mandate authorization and activates paid subscription.
 */
export async function POST(request) {
  try {
    const principal = await getAuthenticatedPrincipal(request);
    let organizationId = "org_ess_default";

    if (principal && principal.authenticated && principal.organizationId) {
      organizationId = principal.organizationId;
    }

    const body = await request.json().catch(() => ({}));
    const {
      subscriptionId,
      paymentId,
      planId = "monthly",
      isTrial = false,
      organizationId: customOrgId,
    } = body;

    const targetOrgId = customOrgId || organizationId;

    const result = await billingService.activateSubscription({
      organizationId: targetOrgId,
      subscriptionId: subscriptionId || `sub_paid_${Date.now()}`,
      paymentId,
      planId,
      isTrial: Boolean(isTrial),
    });

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      message: "Subscription activated successfully!",
    });
  } catch (err) {
    console.error("[BILLING_VERIFY_ERR]", err);
    if (err.code === "TRIAL_ALREADY_USED") {
      return NextResponse.json(
        {
          success: false,
          code: "TRIAL_ALREADY_USED",
          error: "Your organization has already used its 1-time 7-day free trial. Please subscribe to a paid plan to continue.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
