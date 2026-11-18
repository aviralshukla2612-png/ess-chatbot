"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Bot,
  Users2,
  Power,
  PowerOff,
  UserCheck,
  Search,
  XCircle,
  RefreshCw,
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

export default function AdminOrganizationsPage() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
      const res = await adminApi.getOrganizations({
        page,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter,
      });

      if (res?.success) {
        setOrganizations(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const executeToggleStatus = async (org) => {
    setUpdatingId(org.id);
    try {
      const updated = await adminApi.toggleOrgStatus(org.id, org.status);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, status: updated.status } : o))
      );
      toast({
        title: updated.status === "ACTIVE" ? "Workspace activated" : "Workspace suspended",
        message: `${org.name} is now ${updated.status}.`,
        variant: "success",
      });
    } catch (err) {
      toast({ title: "Status update failed", message: err.message, variant: "error" });
    } finally {
      setUpdatingId(null);
      setSuspendTarget(null);
    }
  };

  const handleImpersonate = async (orgId) => {
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        toast({ title: "Switch failed", message: "Unable to enter workspace.", variant: "error" });
      }
    } catch {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Tenant Management"
        title="Organizations & Workspaces"
        description="Audit client workspaces, inspect deployed bots and leads, or switch context into any tenant workspace."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Workspaces"
          value={stats.totalOrganizations.toLocaleString()}
          description={`${stats.activeOrganizations.toLocaleString()} active tenants`}
          icon={Building2}
          colorScheme="indigo"
        />
        <StatCard
          title="Deployed AI Bots"
          value={stats.totalBots.toLocaleString()}
          description="Across all tenant domains"
          icon={Bot}
          colorScheme="sky"
        />
        <StatCard
          title="Captured Leads"
          value={stats.totalCapturedLeads.toLocaleString()}
          description="Qualified visitor contacts"
          icon={Users2}
          colorScheme="emerald"
        />
        <StatCard
          title="Suspended"
          value={stats.suspendedOrganizations.toLocaleString()}
          description="Access restricted"
          icon={XCircle}
          colorScheme="rose"
        />
      </div>

      {/* Control Bar */}
      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search workspaces by company, owner, email, or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg outline-hidden focus:border-indigo-500 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
            {[
              { id: "ALL", label: "All" },
              { id: "ACTIVE", label: "Active" },
              { id: "DISABLED", label: "Suspended" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStatusFilter(item.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === item.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description={
            searchInput || statusFilter !== "ALL"
              ? "No workspaces match your current search or filter."
              : "No tenant organizations registered yet."
          }
          actionLabel={searchInput || statusFilter !== "ALL" ? "Clear Filters" : undefined}
          onAction={
            searchInput || statusFilter !== "ALL"
              ? () => {
                  setSearchInput("");
                  setStatusFilter("ALL");
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Workspace Owner</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Bots</th>
                  <th className="p-4">Chats</th>
                  <th className="p-4">Leads</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-[var(--text-primary)]">{org.name}</p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">
                        {org.id} · {org.slug}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-[var(--text-secondary)]">{org.owner}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        {org.ownerEmail}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        {org.plan}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                      {org.botsCount || 0}
                    </td>
                    <td className="p-4 font-mono text-[var(--text-secondary)] tabular-nums">
                      {(org.conversationsCount || 0).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {(org.leadsCount || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={org.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(org.id)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                          title="Enter Workspace as Admin"
                          aria-label={`Enter ${org.name}`}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            org.status === "ACTIVE"
                              ? setSuspendTarget(org)
                              : executeToggleStatus(org)
                          }
                          disabled={updatingId === org.id}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer disabled:opacity-50"
                          title={
                            org.status === "ACTIVE"
                              ? "Suspend Workspace"
                              : "Activate Workspace"
                          }
                          aria-label={`Toggle status for ${org.name}`}
                        >
                          {org.status === "ACTIVE" ? (
                            <PowerOff className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page || page}
            totalPages={Math.max(1, pagination.totalPages || 1)}
            totalItems={pagination.totalCount || organizations.length}
            pageSize={pageSize}
            onPageChange={(next) => setPage(next)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="workspaces"
          />
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onConfirm={() => suspendTarget && executeToggleStatus(suspendTarget)}
        title="Suspend Organization Workspace?"
        description={`Suspending "${suspendTarget?.name || ""}" will pause dashboard access for its members until re-activated.`}
        confirmText="Suspend Workspace"
        cancelText="Cancel"
        variant="warning"
        badgeText="Tenant Governance"
      />
    </div>
  );
}
