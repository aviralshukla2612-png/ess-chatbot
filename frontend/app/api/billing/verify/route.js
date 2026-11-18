import { NextResponse } from "next/server";
import { requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

/**
 * POST /api/billing/verify
 * Confirms Razorpay payment or mandate authorization via HMAC-SHA256 signature and activates subscription.
 */
export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const body = await request.json().catch(() => ({}));
    const {
      orderId,
      subscriptionId,
      paymentId,
      signature,
      planId = "STARTER",
      isTrial = false,
      organizationId: customOrgId,
    } = body;

    // Prevent BOLA: only SUPER_ADMIN can target another organization
    const targetOrgId = isSuperAdmin
      ? (customOrgId || principal.organizationId)
      : principal.organizationId;

    // Verify cryptographic Razorpay signature whenever RAZORPAY_KEY_SECRET is configured (or in production)
    const isSandboxOrder =
      !process.env.RAZORPAY_KEY_SECRET &&
      process.env.NODE_ENV !== "production" &&
      (String(orderId || "").startsWith("order_mock_") || String(subscriptionId || "").startsWith("sub_trial_") || String(subscriptionId || "").startsWith("sub_paid_"));

    if (!isSandboxOrder) {
      const sigValid = billingService.verifyPaymentSignature({
        orderId,
        subscriptionId,
        paymentId,
        signature,
      });

      if (!sigValid) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_PAYMENT_SIGNATURE",
            error: "Payment signature verification failed. Subscription was not activated.",
          },
          { status: 400 }
        );
      }
    }

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
