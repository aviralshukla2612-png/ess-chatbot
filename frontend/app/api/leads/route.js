import { NextResponse } from "next/server";
import { leadsStore } from "@/lib/db/leadsStore";
import { requireAuth, ROLES } from "@/lib/auth/guard";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "All";
    const score = searchParams.get("score") || "All";
    const bot = searchParams.get("bot") || "All Bots";
    const search = searchParams.get("search") || "";
    const requestedOrg = searchParams.get("organizationId");

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN ||
      principal.platformRole === "Platform Super Admin" ||
      principal.platformRole === "SUPER_ADMIN" ||
      principal.orgRole === "SUPER_ADMIN" ||
      (principal.email && principal.email.toLowerCase().includes("admin@emperorsmartsolutions.com"));
    const targetOrgId = isSuperAdmin ? (requestedOrg || null) : principal.organizationId;

    // Filter leads by target organizationId (null for superadmin viewing all tenant leads)
    const leads = await leadsStore.getLeadsAsync({
      organizationId: targetOrgId,
      status,
      score,
      bot,
      search,
    });

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json();

    // Bind lead to caller's organizationId
    body.organizationId = principal.organizationId;
    const newLead = leadsStore.createLead(body);

    return NextResponse.json({
      success: true,
      lead: newLead,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN ||
      principal.platformRole === "Platform Super Admin" ||
      principal.platformRole === "SUPER_ADMIN" ||
      principal.orgRole === "SUPER_ADMIN" ||
      (principal.email && principal.email.toLowerCase().includes("admin@emperorsmartsolutions.com"));

    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("clearAll") === "true" || searchParams.get("purgeAll") === "true";
    const purgeDummy = searchParams.get("purgeDummy") === "true";
    const leadId = searchParams.get("id");

    const { queryDb } = await import("@/lib/db/dbPool");

    if (purgeDummy) {
      if (!isSuperAdmin) {
        return NextResponse.json({ success: false, error: "Only platform administrators can purge dummy leads." }, { status: 403 });
      }

      await queryDb(`
        DELETE FROM "Lead"
        WHERE ("email" IS NULL OR "email" = '' OR "email" LIKE '%@eval.test%' OR "email" LIKE '%@example.com%')
          AND ("phone" IS NULL OR "phone" = '');
      `).catch(() => {});

      const list = leadsStore.getLeads();
      const cleaned = list.filter((l) => Boolean((l.email && l.email.trim()) || (l.phone && l.phone.trim())));
      const fs = await import("fs");
      const path = await import("path");
      const p1 = path.join(process.cwd(), "frontend", "data", "leads.json");
      if (fs.existsSync(p1)) fs.writeFileSync(p1, JSON.stringify(cleaned, null, 2), "utf8");
      const p2 = path.join(process.cwd(), "data", "leads.json");
      if (fs.existsSync(p2)) fs.writeFileSync(p2, JSON.stringify(cleaned, null, 2), "utf8");

      return NextResponse.json({ success: true, message: "Dummy leads purged successfully." });
    }

    if (clearAll) {
      leadsStore.clearAll(isSuperAdmin ? null : principal.organizationId);
      return NextResponse.json({ success: true, message: "All leads cleared successfully." });
    }

    // Support JSON body for batch deletion: { ids: ["lead_1", "lead_2"] }
    let body = null;
    try {
      body = await request.json();
    } catch (e) {}

    if (body && Array.isArray(body.ids) && body.ids.length > 0) {
      for (const id of body.ids) {
        leadsStore.deleteLead(id, isSuperAdmin ? null : principal.organizationId);
        await queryDb('DELETE FROM "Lead" WHERE "id" = $1;', [id]).catch(() => {});
      }
      return NextResponse.json({ success: true, message: `${body.ids.length} leads deleted successfully.` });
    }

    if (leadId) {
      leadsStore.deleteLead(leadId, isSuperAdmin ? null : principal.organizationId);
      await queryDb('DELETE FROM "Lead" WHERE "id" = $1;', [leadId]).catch(() => {});
      return NextResponse.json({ success: true, message: "Lead deleted successfully." });
    }

    return NextResponse.json({ success: false, error: "Missing parameter: id, ids, or clearAll" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

