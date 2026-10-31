"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Mail,
  Building2,
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck,
  Ban,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/api/admin";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleToggleBlockUser = async (userId, currentStatus, userName) => {
    const isBlocked = String(currentStatus).toUpperCase() === "BLOCKED";
    const nextStatus = isBlocked ? "ACTIVE" : "BLOCKED";
    const confirmMsg = isBlocked
      ? `Unblock user "${userName || userId}"? They will regain access to their account.`
      : `BLOCK user "${userName || userId}"? They will immediately be denied access across the platform.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: isBlocked ? "unblock" : "block" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)));
      } else {
        alert("Failed to update user: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error updating user status: " + err.message);
    }
  };

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
  });

  const loadData = useCallback(async (targetPage = page, search = searchTerm, role = roleFilter, status = statusFilter, limit = pageSize) => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: targetPage,
        limit,
        search,
        role,
        status,
      });

      if (res && res.success) {
        setUsers(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter, pageSize]);

  useEffect(() => {
    loadData(page, searchTerm, roleFilter, statusFilter, pageSize);
  }, [page, roleFilter, statusFilter, pageSize, loadData]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadData(1, searchTerm, roleFilter, statusFilter, pageSize);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, roleFilter, statusFilter, pageSize, loadData]);

  // Background realtime sync (SSE + adaptive background polling)
  const syncBackground = useCallback(async () => {
    try {
      const res = await adminApi.getUsers({
        page,
        limit: pageSize,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      });
      if (res && res.success) {
        setUsers(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (e) {}
  }, [page, pageSize, searchTerm, roleFilter, statusFilter]);

  const { isLive } = useRealtimeSync(syncBackground, {
    pollingInterval: 3000,
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Platform Users & Administrators
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit user accounts, organization assignments, and permission roles across all tenant domains.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Realtime Live</span>
          </span>
          <button
            onClick={() => loadData(page, searchTerm, roleFilter, statusFilter, pageSize)}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Role Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search thousands of users by name, email, or organization..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-600 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Workspace Owners</option>
            <option value="ADMIN">Admins</option>
            <option value="MEMBER">Team Members</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Role</th>
                <th className="p-4">Bots</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm">No users found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No matching records for "{searchTerm}".
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-600 font-medium">{u.organization}</td>
                    <td className="p-4">
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600">{u.bots}</td>
                    <td className="p-4 text-slate-500">{u.lastLogin}</td>
                    <td className="p-4">
                      <StatusBadge status={u.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      {u.role === "Platform Super Admin" ||
                      u.role === "SUPER_ADMIN" ||
                      u.email === "admin@emperorsmartsolutions.com" ? (
                        <span className="text-[11px] font-medium text-slate-400 italic">
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleBlockUser(u.id, u.status, u.name || u.email)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            String(u.status).toUpperCase() === "BLOCKED"
                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                              : "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                          }`}
                          title={String(u.status).toUpperCase() === "BLOCKED" ? "Unblock User" : "Block User"}
                        >
                          {String(u.status).toUpperCase() === "BLOCKED" ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>Block</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {pagination.totalCount.toLocaleString()}
            </span>{" "}
            users
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-lg">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
