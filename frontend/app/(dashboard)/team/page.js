"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function TeamPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "Member" });

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      const data = await res.json();
      if (data?.success && Array.isArray(data.members)) {
        setMembers(data.members);
      }
    } catch {
      toast({ title: "Failed to load team roster", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newMember.email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to invite member.");
      }
      toast({
        title: "Teammate added",
        message: data.message || `${newMember.email} added to workspace.`,
        variant: "success",
      });
      setNewMember({ name: "", email: "", role: "Member" });
      setInviteModalOpen(false);
      await loadMembers();
    } catch (err) {
      toast({ title: "Invite failed", message: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    try {
      const res = await fetch(`/api/team?memberId=${encodeURIComponent(removeTarget.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to remove member.");
      }
      toast({ title: "Member removed", variant: "info" });
      setRemoveTarget(null);
      await loadMembers();
    } catch (err) {
      toast({ title: "Removal failed", message: err.message, variant: "error" });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Workspace Access Control"
        title="Team & Permissions"
        description="Invite colleagues to collaborate on chatbots, handle live customer takeovers, and manage qualified leads."
        actions={
          <Button icon={UserPlus} size="sm" onClick={() => setInviteModalOpen(true)}>
            Invite Member
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description="Invite your sales or support teammates to share inbox assignments."
          actionLabel="Invite Member"
          onAction={() => setInviteModalOpen(true)}
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)]/60 text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Permissions</th>
                  <th className="p-4">Active Chats</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {(m.name || m.email || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{m.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-md font-semibold bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                        {m.role}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {m.role === "Owner"
                        ? "Full Workspace Access & Billing"
                        : m.role === "Admin"
                        ? "Manage Bots, Knowledge & Leads"
                        : m.role === "Viewer"
                        ? "Read-only Analytics & Transcripts"
                        : "Live Inbox & Lead Management"}
                    </td>
                    <td className="p-4 font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                      {m.activeConversationsCount ?? 0}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={m.status || "ACTIVE"} size="sm" />
                    </td>
                    <td className="p-4 text-[var(--text-muted)] tabular-nums">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "Active"}
                    </td>
                    <td className="p-4 text-right">
                      {m.role !== "Owner" && (
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(m)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Remove ${m.name}`}
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Workspace Member"
        description="Grant role-scoped access to your organization's bots, inbox, and lead pipeline."
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Business Email Address
            </label>
            <input
              type="email"
              required
              placeholder="rahul@company.com"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
              Assigned Role
            </label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            >
              <option value="Admin">Admin (Edit bots, knowledge & team)</option>
              <option value="Member">Member (Handle conversations & leads)</option>
              <option value="Viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Team Member?"
        description={`Revoke workspace access for ${removeTarget?.name || removeTarget?.email || "this member"}?`}
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
