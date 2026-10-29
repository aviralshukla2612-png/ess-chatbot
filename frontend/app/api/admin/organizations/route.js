import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { queryDb } from "@/lib/db/dbPool";
import { usersStore, isDummyOrTestAccount } from "@/lib/db/usersStore";

// Single authoritative default platform organization (No dummy data)
function getDefaultPlatformOrgs() {
  return [
    {
      id: "org_ess_01",
      name: "Emperor Smart Solutions",
      slug: "emperor-solutions",
      owner: "Emperor Smart Solution",
      ownerEmail: "admin@emperorsmartsolutions.com",
      plan: "Enterprise",
      status: "ACTIVE",
      botsCount: 1,
      usersCount: 1,
      conversationsCount: 0,
      leadsCount: 0,
      createdAt: "2026-01-15T09:00:00Z",
      lastActive: "Just now",
    },
  ];
}

export async function GET(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25", 10)));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const status = (searchParams.get("status") || "ALL").toUpperCase();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // 1. Query real PostgreSQL database
    let dbOrgs = [];
    let totalCount = 0;

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM "Organization" o
      LEFT JOIN "OrganizationMembership" om ON om."organizationId" = o.id AND om.role IN ('OWNER', 'ORG_OWNER', 'ADMIN', 'ORG_ADMIN')
      LEFT JOIN "User" u ON u.id = om."userId"
      WHERE ($1 = '' OR o.name ILIKE $2 OR o.slug ILIKE $2 OR u.name ILIKE $2 OR u.email ILIKE $2)
        AND ($3 = 'ALL' OR o.status = $3);
    `;
    const searchPattern = `%${search}%`;
    const offset = (page - 1) * limit;

    const countRes = await queryDb(countSql, [search, searchPattern, status]);
    if (countRes.ok && countRes.rows[0]?.total > 0) {
      totalCount = countRes.rows[0].total;

      const dataSql = `
        SELECT 
          o.id,
          o.name,
          o.slug,
          o.status,
          o."createdAt",
          COALESCE(u.name, 'Emperor Smart Solution') as owner,
          COALESCE(u.email, 'admin@emperorsmartsolutions.com') as "ownerEmail",
          'Enterprise' as plan,
          (SELECT COUNT(*)::int FROM "Bot" b WHERE b."organizationId" = o.id) as "botsCount",
          (SELECT COUNT(*)::int FROM "Conversation" c WHERE c."organizationId" = o.id) as "conversationsCount",
          (SELECT COUNT(*)::int FROM "Lead" l WHERE l."organizationId" = o.id) as "leadsCount",
          (SELECT COUNT(*)::int FROM "OrganizationMembership" om WHERE om."organizationId" = o.id) as "usersCount"
        FROM "Organization" o
        LEFT JOIN "OrganizationMembership" om ON om."organizationId" = o.id AND om.role IN ('OWNER', 'ORG_OWNER', 'ADMIN', 'ORG_ADMIN')
        LEFT JOIN "User" u ON u.id = om."userId"
        WHERE ($1 = '' OR o.name ILIKE $2 OR o.slug ILIKE $2 OR u.name ILIKE $2 OR u.email ILIKE $2)
          AND ($3 = 'ALL' OR o.status = $3)
        ORDER BY o."createdAt" DESC
        LIMIT $4 OFFSET $5;
      `;
      const dataRes = await queryDb(dataSql, [search, searchPattern, status, limit, offset]);
      if (dataRes.ok) {
        dbOrgs = dataRes.rows;
      }
    }

    // 2. Merge with persistent usersStore organizations (survives rebuilds)
    const diskUsers = usersStore.getUsers();
    const seenOrgNames = new Set(dbOrgs.map((o) => (o.name || "").toLowerCase()));

    for (const u of diskUsers) {
      const orgName = u.organization || `${u.name}'s Workspace`;
      if (!seenOrgNames.has(orgName.toLowerCase())) {
        seenOrgNames.add(orgName.toLowerCase());
        dbOrgs.push({
          id: `org_${(u.email || "").replace(/[^a-z0-9]/gi, "_")}`,
          name: orgName,
          slug: (u.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-"),
          owner: u.name,
          ownerEmail: u.email,
          plan: "Starter (Trial)",
          status: "ACTIVE",
          botsCount: u.bots || 1,
          usersCount: 1,
          conversationsCount: 0,
          leadsCount: 0,
          createdAt: u.createdAt || new Date().toISOString(),
          lastActive: "Active now",
        });
      }
    }

    // 3. Strict Real-Organization Filter (Purges synthetic test orgs)
    const realOrgsOnly = dbOrgs.filter((org) => {
      if (!org) return false;
      const name = (org.name || "").toLowerCase().trim();
      const email = (org.ownerEmail || "").toLowerCase().trim();

      // Protected platform default org
      if (org.id === "org_ess_01" || org.id === "org_ess_default") {
        return true;
      }

      if (isDummyOrTestAccount(email, name)) {
        return false;
      }

      if (
        name.includes("company a") ||
        name.includes("company b") ||
        name.includes("alpha corp") ||
        name.startsWith("user 1") ||
        name.includes("security") ||
        name.includes("audit") ||
        name.includes("dummy") ||
        name.startsWith("test")
      ) {
        return false;
      }

      return true;
    });

    let items = realOrgsOnly;
    totalCount = items.length;

    const totalPages = Math.ceil(totalCount / limit) || 1;

    const stats = {
      totalOrganizations: totalCount,
      activeOrganizations: items.filter((o) => o.status === "ACTIVE").length,
      suspendedOrganizations: items.filter((o) => o.status === "DISABLED").length,
      totalBots: items.reduce((acc, o) => acc + (o.botsCount || 0), 0),
      totalCapturedLeads: items.reduce((acc, o) => acc + (o.leadsCount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
    });
  } catch (err) {
    console.error("[ADMIN_ORGS_GET_FAIL]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load organizations" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { organizationId, status } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing organizationId" },
        { status: 400 }
      );
    }

    const targetStatus = status || "ACTIVE";

    await queryDb('UPDATE "Organization" SET status = $1, "updatedAt" = NOW() WHERE id = $2;', [
      targetStatus,
      organizationId,
    ]);

    return NextResponse.json({
      success: true,
      message: `Organization ${organizationId} status updated to ${targetStatus}`,
      organization: { id: organizationId, status: targetStatus },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
