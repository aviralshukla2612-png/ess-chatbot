import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { getPlans, createPlan } from "@/lib/billing/plans";

/**
 * GET /api/admin/plans
 * Super Admin: List all pricing plans and subscription amounts
 */
export async function GET(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const plans = getPlans();
    return NextResponse.json({ success: true, plans });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/plans
 * Super Admin: Create a new custom Razorpay plan (e.g. ₹2,500/mo, ₹5,000/6-mo)
 */
export async function POST(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const {
      name,
      priceINR,
      interval = "monthly",
      intervalCount = 1,
      trialDays = 7,
      description = "",
      features = [],
      razorpayPlanId = "",
      isDefault = false,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Plan name is required." }, { status: 400 });
    }

    if (isNaN(Number(priceINR)) || Number(priceINR) < 0) {
      return NextResponse.json({ success: false, error: "Valid price in INR is required." }, { status: 400 });
    }

    const newPlan = createPlan({
      name,
      priceINR: Number(priceINR),
      interval,
      intervalCount: Number(intervalCount) || 1,
      trialDays: Number(trialDays) >= 0 ? Number(trialDays) : 7,
      description,
      features,
      razorpayPlanId,
      isDefault: Boolean(isDefault),
    });

    return NextResponse.json({
      success: true,
      plan: newPlan,
      message: `Pricing plan "${newPlan.name}" (${newPlan.priceMonthly} ${newPlan.periodLabel}) created successfully!`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
