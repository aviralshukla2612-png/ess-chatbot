import { NextResponse } from "next/server";
import { leadsStore } from "@/lib/db/leadsStore";
import { requireAuth, ROLES } from "@/lib/auth/guard";

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

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const lead = leadsStore.getLead(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (!isSuperAdmin && (lead.organizationId || "org_ess_default") !== principal.organizationId) {
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

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const lead = leadsStore.getLead(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (!isSuperAdmin && (lead.organizationId || "org_ess_default") !== principal.organizationId) {
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
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN ||
      principal.platformRole === "Platform Super Admin" ||
      principal.platformRole === "SUPER_ADMIN" ||
      principal.orgRole === "SUPER_ADMIN" ||
      (principal.email && principal.email.toLowerCase().includes("admin@emperorsmartsolutions.com"));

    leadsStore.deleteLead(id, isSuperAdmin ? null : principal.organizationId);

    const { queryDb } = await import("@/lib/db/dbPool");
    await queryDb('DELETE FROM "Lead" WHERE "id" = $1;', [id]).catch(() => {});

    return NextResponse.json({ success: true, message: "Lead deleted successfully." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
