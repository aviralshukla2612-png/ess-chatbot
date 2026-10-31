"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Users,
  Bot,
  MessageSquare,
  Users2,
  Power,
  PowerOff,
  UserCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/api/admin";

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalBots: 0,
    totalCapturedLeads: 0,
  });

  const loadData = useCallback(async (targetPage = page, search = searchTerm, status = statusFilter, limit = pageSize) => {
    setLoading(true);
    try {
      const res = await adminApi.getOrganizations({
        page: targetPage,
        limit,
        search,
        status,
      });

      if (res && res.success) {
        setOrganizations(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, pageSize]);

  useEffect(() => {
    loadData(page, searchTerm, statusFilter, pageSize);
  }, [page, statusFilter, pageSize, loadData]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadData(1, searchTerm, statusFilter, pageSize);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter, pageSize, loadData]);

  const handleToggleStatus = async (org) => {
    setUpdatingId(org.id);
    try {
      const updated = await adminApi.toggleOrgStatus(org.id, org.status);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, status: updated.status } : o))
      );
    } catch (err) {
      console.error("Status toggle failed:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleImpersonate = async (orgId) => {
    try {
      await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      window.location.href = "/dashboard";
    } catch {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tenant Organizations & Admins
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage thousands of client workspaces, audit active bots, and impersonate any workspace securely.
          </p>
        </div>

        <button
          onClick={() => loadData(page, searchTerm, statusFilter, pageSize)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-300 bg-[#0D0D0D] border border-neutral-800 hover:bg-[#161616] rounded-xl shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B68A55]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium">Total Workspaces</span>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalOrganizations.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">
            {stats.activeOrganizations.toLocaleString()} active tenants
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-medium">Deployed AI Bots</span>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalBots.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500">Across all tenant domains</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Users2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium">Total Leads Captured</span>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalCapturedLeads.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">High commercial intent</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium">Suspended</span>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.suspendedOrganizations.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500">Access revoked</span>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-[#0D0D0D] p-4 rounded-2xl border border-neutral-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search 1,000s of workspaces by company, admin name, email, or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#121212] border border-neutral-800 rounded-xl outline-hidden focus:border-[#B68A55] text-white transition-all placeholder:text-neutral-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#121212] border border-neutral-800 text-xs">
            <button
              onClick={() => { setStatusFilter("ALL"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "ALL" ? "bg-[#B68A55] text-white shadow-xs font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setStatusFilter("ACTIVE"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "ACTIVE" ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => { setStatusFilter("DISABLED"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "DISABLED" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              Suspended
            </button>
          </div>

          {/* Page Size selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#121212] border border-neutral-800 rounded-xl text-neutral-200 outline-hidden cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0A0A] text-neutral-400 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4">Organization & Domain</th>
                <th className="p-4">Workspace Admin</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Bots</th>
                <th className="p-4">Chats</th>
                <th className="p-4">Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#B68A55]" />
                      <span>Loading workspaces...</span>
                    </div>
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400">
                    <p className="font-semibold text-sm text-white">No organizations found</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      No matching records found for "{searchTerm}". Try clearing your filter.
                    </p>
                    <button
                      onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#B68A55] bg-[#B68A55]/10 hover:bg-[#B68A55]/20 rounded-lg cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{org.name}</p>
                      <p className="text-[10px] font-mono text-neutral-500">{org.id} • {org.slug}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-neutral-200">{org.owner}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{org.ownerEmail}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#B68A55]/15 text-[#B68A55] border border-[#B68A55]/30">
                        {org.plan}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#B68A55] font-bold">{org.botsCount || 0}</td>
                    <td className="p-4 font-mono text-neutral-300">{(org.conversationsCount || 0).toLocaleString()}</td>
                    <td className="p-4 font-mono text-emerald-400 font-bold">{(org.leadsCount || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <StatusBadge status={org.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleImpersonate(org.id)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Impersonate Workspace (Enter as Admin)"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(org)}
                          disabled={updatingId === org.id}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                          title={org.status === "ACTIVE" ? "Suspend Workspace Access" : "Activate Workspace"}
                        >
                          {org.status === "ACTIVE" ? (
                            <PowerOff className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div>
            Showing{" "}
            <span className="font-semibold text-white">
              {pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-white">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-white">
              {pagination.totalCount.toLocaleString()}
            </span>{" "}
            workspaces
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
