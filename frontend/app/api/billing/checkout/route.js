import { NextResponse } from "next/server";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json().catch(() => ({}));
    const { planId = "STARTER", isTrial = true } = body;

    const checkout = await billingService.createSubscriptionCheckout({
      organizationId: principal.organizationId,
      planId,
      customerEmail: principal.email,
      isTrial: Boolean(isTrial),
    });

    return NextResponse.json({
      success: true,
      checkout,
    });
  } catch (err) {
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
