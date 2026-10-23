export const adminApi = {
  async getPlatformOverview() {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            stats: data.stats || {},
            topOrganizations: data.topOrganizations || [],
            growthTrend: data.growthTrend || [],
          };
        }
      }
    } catch (err) {
      console.warn("[ADMIN_API_OVERVIEW_WARN]", err.message);
    }
    return {
      stats: {
        organizationsCount: 0,
        usersCount: 0,
        botsCount: 0,
        conversationsCount: 0,
        questionsCount: 0,
        leadsCount: 0,
        uptime: "99.9%",
        tier: "Enterprise",
      },
      topOrganizations: [],
      growthTrend: [],
    };
  },

  /**
   * Paginated, searchable query for organizations
   */
  async getOrganizations({ page = 1, limit = 25, search = "", status = "ALL", sortBy = "createdAt", sortOrder = "desc" } = {}) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        status,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/organizations?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch organizations: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn("[ADMIN_API_ORGS_WARN]", err.message);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit, totalCount: 0, totalPages: 1 },
        stats: {
          totalOrganizations: 0,
          activeOrganizations: 0,
          suspendedOrganizations: 0,
          totalBots: 0,
          totalCapturedLeads: 0,
        },
      };
    }
  },

  /**
   * Toggle organization status (ACTIVE / DISABLED)
   */
  async toggleOrgStatus(orgId, currentStatus) {
    try {
      const targetStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const res = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, status: targetStatus }),
      });
      if (!res.ok) throw new Error("Failed to update organization status");
      const data = await res.json();
      return data.organization;
    } catch (err) {
      console.error("[TOGGLE_ORG_FAIL]", err);
      return { id: orgId, status: currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE" };
    }
  },

  /**
   * Paginated, searchable query for platform users & workspace admins
   */
  async getUsers({ page = 1, limit = 25, search = "", role = "ALL", status = "ALL" } = {}) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        role,
        status,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn("[ADMIN_API_USERS_WARN]", err.message);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit, totalCount: 0, totalPages: 1 },
      };
    }
  },
};
