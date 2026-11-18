"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  Ban,
  ShieldCheck,
  Activity,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/api/admin";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    blockedUsers: 0,
    onlineNow: 1,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 280);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        limit: pageSize,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });

      if (res?.success) {
        setUsers(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleBlockUser = (userId, currentStatus, userName) => {
    const isBlocked = String(currentStatus).toUpperCase() === "BLOCKED";
    const nextStatus = isBlocked ? "ACTIVE" : "BLOCKED";
    setConfirmConfig({
      title: isBlocked ? "Unblock User Account?" : "Block User Account?",
      description: isBlocked
        ? `Restore full platform access for "${userName || userId}"?`
        : `Block "${userName || userId}" from signing in or accessing workspace endpoints?`,
      confirmText: isBlocked ? "Unblock User" : "Block User",
      badgeText: isBlocked ? "Access Restored" : "Security Action",
      variant: isBlocked ? "info" : "danger",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, action: isBlocked ? "unblock" : "block" }),
          });
          const data = await res.json().catch(() => ({}));
          if (data.success) {
            setUsers((prev) =>
              prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
            );
            toast({
              title: isBlocked ? "User unblocked" : "User blocked",
              variant: "success",
            });
          } else {
            toast({ title: "Action failed", message: data.error, variant: "error" });
          }
        } catch (err) {
          toast({ title: "Error", message: err.message, variant: "error" });
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Identity Governance"
        title="User Directory & Access Control"
        description="Audit registered user accounts, organization memberships, roles, and account block states."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={(stats.totalUsers || pagination.totalCount || users.length).toLocaleString()}
          icon={Users}
          colorScheme="indigo"
        />
        <StatCard
          title="Active Accounts"
          value={(stats.activeUsers || users.filter((u) => String(u.status).toUpperCase() !== "BLOCKED").length).toLocaleString()}
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Blocked Accounts"
          value={(stats.blockedUsers || users.filter((u) => String(u.status).toUpperCase() === "BLOCKED").length).toLocaleString()}
          icon={Ban}
          colorScheme="rose"
        />
        <StatCard
          title="Active Sessions"
          value={stats.onlineNow || 1}
          icon={Activity}
          colorScheme="sky"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users by name, email, or organization..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg outline-hidden focus:border-indigo-500 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by user role"
            className="px-3 py-2 text-xs bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] outline-hidden cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Workspace Owners</option>
            <option value="ADMIN">Admins</option>
            <option value="MEMBER">Team Members</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by account status"
            className="px-3 py-2 text-xs bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No user records matched your current search or role filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchInput("");
            setRoleFilter("ALL");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
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
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {users.map((u) => {
                  const isProtected =
                    u.role === "Platform Super Admin" ||
                    u.role === "SUPER_ADMIN" ||
                    u.email === "admin@emperorsmartsolutions.com";
                  const isBlocked = String(u.status).toUpperCase() === "BLOCKED";

                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                      <td className="p-4 font-semibold text-[var(--text-primary)]">{u.name}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{u.email}</td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">
                        {u.organization}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {u.bots ?? 0}
                      </td>
                      <td className="p-4 text-[var(--text-muted)]">{u.lastLogin || "—"}</td>
                      <td className="p-4">
                        <StatusBadge status={u.status} size="sm" />
                      </td>
                      <td className="p-4 text-right">
                        {isProtected ? (
                          <span className="text-[11px] font-medium text-[var(--text-muted)] italic">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleBlockUser(u.id, u.status, u.name || u.email)
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                              isBlocked
                                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25"
                                : "text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25"
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                <span>Block</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page || page}
            totalPages={Math.max(1, pagination.totalPages || 1)}
            totalItems={pagination.totalCount || users.length}
            pageSize={pageSize}
            onPageChange={(next) => setPage(next)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="users"
          />
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || "Confirm"}
        badgeText={confirmConfig?.badgeText || "Action Required"}
        variant={confirmConfig?.variant || "danger"}
      />
    </div>
  );
}
