import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

export async function POST(request) {
  try {
    const principal = await getAuthenticatedPrincipal(request);
    let organizationId = "org_ess_default";
    let customerEmail = "customer@vardaansmartsolutions.com";

    if (principal && principal.authenticated) {
      organizationId = principal.organizationId || organizationId;
      customerEmail = principal.email || customerEmail;
    }

    const body = await request.json().catch(() => ({}));
    const { planId = "monthly", isTrial = false, email, name, phone } = body;

    if (email) customerEmail = email;

    const checkout = await billingService.createSubscriptionCheckout({
      organizationId,
      planId,
      customerEmail,
      customerName: name,
      isTrial: false,
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
