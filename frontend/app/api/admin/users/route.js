import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { queryDb } from "@/lib/db/dbPool";
import { usersStore } from "@/lib/db/usersStore";

export async function GET(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25", 10)));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const role = (searchParams.get("role") || "ALL").toUpperCase();
    const status = (searchParams.get("status") || "ALL").toUpperCase();

    // 1. Query real PostgreSQL database
    let dbUsers = [];
    try {
      const dataSql = `
        SELECT 
          u.id,
          CASE 
            WHEN u.email = 'admin@emperorsmartsolutions.com' OR u.role = 'SUPER_ADMIN' THEN 'Emperor Smart Solution'
            ELSE u.name
          END as name,
          u.email,
          COALESCE(o.name, 'Emperor Smart Solutions') as organization,
          CASE 
            WHEN u.role = 'SUPER_ADMIN' THEN 'Platform Super Admin'
            WHEN om.role IN ('OWNER', 'ORG_OWNER', 'ADMIN', 'ORG_ADMIN') THEN 'Workspace Owner'
            ELSE 'Team Member'
          END as role,
          u.status,
          (SELECT COUNT(*)::int FROM "Bot" b WHERE b."organizationId" = om."organizationId") as bots,
          'Active now' as "lastLogin",
          u."createdAt"::text as "createdAt"
        FROM "User" u
        LEFT JOIN "OrganizationMembership" om ON om."userId" = u.id
        LEFT JOIN "Organization" o ON o.id = om."organizationId"
        ORDER BY u."createdAt" DESC;
      `;
      const dataRes = await queryDb(dataSql);
      if (dataRes.ok && Array.isArray(dataRes.rows)) {
        dbUsers = dataRes.rows;
      }
    } catch (e) {
      console.warn("[ADMIN_USERS_QUERY_FAIL]", e.message);
    }

    // 2. Merge with durable persistent usersStore (contains Aviral Shukla & verified users)
    const diskUsers = usersStore.getUsers();
    const seenEmails = new Set();
    const merged = [];

    // Add PostgreSQL users first
    for (const u of dbUsers) {
      if (u.email && !seenEmails.has(u.email.toLowerCase())) {
        seenEmails.add(u.email.toLowerCase());
        merged.push(u);
      }
    }

    // Add disk persistent users
    for (const u of diskUsers) {
      if (u.email && !seenEmails.has(u.email.toLowerCase())) {
        seenEmails.add(u.email.toLowerCase());
        merged.push(u);
      }
    }

    // 3. Strict Real-User Filter (Purges all synthetic test and dummy test-suite accounts)
    const DUMMY_DOMAINS = [
      "@company-a.com",
      "@company-b.com",
      "@company.com",
      "@alpha.com",
      "@example.com",
      "@test.com",
      "@eval.test",
      "@mock.com",
      "@dummy.com",
    ];

    const realUsersOnly = merged.filter((u) => {
      if (!u || !u.email) return false;
      const email = u.email.toLowerCase().trim();
      const name = (u.name || "").toLowerCase().trim();

      // Protected real platform accounts
      if (
        email === "admin@emperorsmartsolutions.com" ||
        email.includes("aviral") ||
        email.endsWith("@gmail.com") ||
        email.endsWith("@emperorsmartsolutions.com") ||
        email.endsWith("@vardaansmartsolutions.com")
      ) {
        return true;
      }

      for (const d of DUMMY_DOMAINS) {
        if (email.endsWith(d)) return false;
      }

      if (
        email.startsWith("duplicate@") ||
        email.startsWith("test_") ||
        email.startsWith("mock_") ||
        email.startsWith("dummy_") ||
        name.startsWith("test ") ||
        name.startsWith("user ") ||
        name.includes("founder") ||
        name.includes("cto") ||
        name === "alice" ||
        name === "bob" ||
        name === "security" ||
        name.includes("audit")
      ) {
        return false;
      }

      return true;
    });

    // 4. Filter by search, role, status
    let filtered = realUsersOnly;
    if (search) {
      filtered = filtered.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(search)) ||
          (u.email && u.email.toLowerCase().includes(search)) ||
          (u.organization && u.organization.toLowerCase().includes(search))
      );
    }

    if (role !== "ALL") {
      filtered = filtered.filter((u) => u.role && u.role.toUpperCase().includes(role));
    }

    if (status !== "ALL") {
      filtered = filtered.filter((u) => u.status && u.status.toUpperCase() === status);
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalUsers: totalCount,
        activeUsers: filtered.filter((u) => u.status === "Active" || u.status === "ACTIVE").length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
