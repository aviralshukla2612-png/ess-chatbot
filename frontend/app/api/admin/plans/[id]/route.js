import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { updatePlan, deletePlan, setDefaultPlan } from "@/lib/billing/plans";

/**
 * PUT /api/admin/plans/[id]
 * Super Admin: Edit plan details, price, trial days, or toggle default/active
 */
export async function PUT(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { params } = context;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.action === "setDefault") {
      const plan = setDefaultPlan(id);
      return NextResponse.json({ success: true, plan, message: `Plan "${plan.name}" is now the default.` });
    }

    const updated = updatePlan(id, body);
    return NextResponse.json({
      success: true,
      plan: updated,
      message: `Plan "${updated.name}" updated successfully!`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/plans/[id]
 * Super Admin: Delete plan
 */
export async function DELETE(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { params } = context;
    const { id } = await params;

    deletePlan(id);
    return NextResponse.json({ success: true, message: `Plan deleted successfully.` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
