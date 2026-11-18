import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

/**
 * POST /api/billing/reset-trial
 * Restricted strictly to Platform SUPER_ADMIN (SEC-13).
 */
export async function POST(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json().catch(() => ({}));
    const targetOrgId = body.organizationId || principal.organizationId;

    await billingService.resetTrialForOrganization(targetOrgId);

    return NextResponse.json({
      success: true,
      message: "Free trial eligibility has been reset by platform administrator.",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
