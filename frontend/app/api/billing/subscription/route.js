import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";
import { quotaGuard, getCurrentPeriodKey } from "@/lib/billing/quotaGuard";
import { getPlan, PLANS } from "@/lib/billing/plans";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const subscription = await billingService.getSubscription(principal.organizationId);
    const plan = getPlan(subscription?.planId);
    const periodKey = getCurrentPeriodKey();
    const messagesUsed = await quotaGuard.getOrganizationUsage(principal.organizationId, "message", periodKey);
    const pagesCrawled = await quotaGuard.getOrganizationUsage(principal.organizationId, "knowledge_page", periodKey);

    let trialDaysRemaining = 0;
    let isTrial = false;
    let autopayDate = null;

    if (subscription?.status === "trialing" && subscription?.currentPeriodEnd) {
      isTrial = true;
      const msLeft = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      autopayDate = new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    // Autopay is only configured if an official Razorpay subscription ID is present
    const hasAutopay = Boolean(
      subscription &&
      subscription.providerSubscriptionId &&
      !subscription.providerSubscriptionId.startsWith("sub_reg_") &&
      (subscription.status === "active" || subscription.status === "trialing")
    );

    const hasUsedTrial = await billingService.hasOrganizationUsedTrial(principal.organizationId);

    return NextResponse.json({
      success: true,
      hasActiveSubscription: hasAutopay,
      requiresAutopaySetup: !hasAutopay,
      hasUsedTrial,
      isTrial,
      trialDaysRemaining,
      autopayDate,
      autopayAmount: plan.priceMonthly,
      subscription: subscription ? {
        ...subscription,
        plan,
        hasAutopay,
        hasUsedTrial,
      } : null,
      usage: {
        periodKey,
        messages: {
          used: messagesUsed,
          limit: plan.maxMessagesPerMonth,
          percentage: Math.min(100, Math.round((messagesUsed / plan.maxMessagesPerMonth) * 100)),
        },
        knowledgePages: {
          used: pagesCrawled,
          limit: plan.maxKnowledgePages,
          percentage: Math.min(100, Math.round((pagesCrawled / plan.maxKnowledgePages) * 100)),
        },
      },
      availablePlans: Object.values(PLANS),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
