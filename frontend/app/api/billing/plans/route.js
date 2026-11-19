import { NextResponse, connection } from "next/server";
import { getActivePlans } from "@/lib/billing/plans";

/**
 * GET /api/billing/plans
 * Public/User: Dynamically list all active plans configured in Super Admin (/admin/plans)
 */
export async function GET() {
  await connection();
  try {
    const plans = getActivePlans();
    return NextResponse.json(
      { success: true, plans },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
