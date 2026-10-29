import { NextResponse } from "next/server";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";

/**
 * POST /api/billing/reset-trial
 * Allows Workspace Owner or Super Admin to reset the 1-time free trial (for testing / demo).
 */
export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.SUPER_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    await billingService.resetTrialForOrganization(principal.organizationId);

    return NextResponse.json({
      success: true,
      message: "Free trial eligibility has been reset. You can now test the 7-day free trial flow again.",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
