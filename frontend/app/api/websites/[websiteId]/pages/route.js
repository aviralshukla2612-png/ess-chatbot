import { NextResponse } from "next/server";
import { websitesDb } from "@/lib/db/websites";
import { requireAuth, ROLES } from "@/lib/auth/guard";

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { websiteId } = await params;
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

    const pages = await websitesDb.getPagesForWebsite(websiteId);
    return NextResponse.json({ success: true, pages });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
