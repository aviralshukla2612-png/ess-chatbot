import { NextResponse } from "next/server";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";
import { enforceRateLimit, applyRateLimitHeaders } from "@/lib/security/rateLimitPolicy";

export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const rateCheck = await enforceRateLimit("billing_checkout", principal.organizationId || principal.userId);
    if (!rateCheck.ok) return rateCheck.response;

    const body = await request.json().catch(() => ({}));
    const { planId = "STARTER", isTrial = false, email, name } = body;

    const checkout = await billingService.createSubscriptionCheckout({
      organizationId: principal.organizationId,
      planId,
      customerEmail: email || principal.email,
      customerName: name || principal.name,
      isTrial: Boolean(isTrial),
    });

    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        checkout,
      }),
      rateCheck.result
    );
  } catch (err) {
    if (err.code === "TRIAL_ALREADY_USED") {
      return NextResponse.json(
        {
          success: false,
          code: "TRIAL_ALREADY_USED",
          error: "An active paid subscription is required to continue.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
