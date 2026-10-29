import { NextResponse } from "next/server";
import { getActivePlans } from "@/lib/billing/plans";

/**
 * GET /api/billing/plans
 * Public/User: List all active plans configured by Super Admin
 */
export async function GET() {
  try {
    const plans = getActivePlans();
    return NextResponse.json({ success: true, plans });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
