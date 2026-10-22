import { NextResponse } from "next/server";
import { websitesDb } from "@/lib/db/websites";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";

export async function POST(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { websiteId, pageId } = await params;
    const source = await websitesDb.getWebsiteSourceById(websiteId);
    if (!source) {
      return NextResponse.json({ success: false, error: "Website source not found" }, { status: 404 });
    }

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    if (!isSuperAdmin && source.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Website source not found" }, { status: 404 });
    }

    const body = await request.json();
    const { excluded } = body;

    const updated = await websitesDb.togglePageExclusion(websiteId, pageId, Boolean(excluded));
    if (!updated) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, page: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
