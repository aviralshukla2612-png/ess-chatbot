import { NextResponse } from "next/server";
import { leadsStore } from "@/lib/db/leadsStore";
import { requireAuth, requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const lead = leadsStore.getLead(id, isSuperAdmin ? null : principal.organizationId);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const lead = leadsStore.getLead(id, isSuperAdmin ? null : principal.organizationId);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = leadsStore.updateLeadStatus(id, body.status);
    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const existing = leadsStore.getLead(id, isSuperAdmin ? null : principal.organizationId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // deleteLead already executes scoped Postgres DELETE WHERE id = $1 AND organizationId = $2
    leadsStore.deleteLead(id, isSuperAdmin ? null : principal.organizationId);

    return NextResponse.json({ success: true, message: "Lead deleted successfully." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
