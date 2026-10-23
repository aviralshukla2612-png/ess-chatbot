"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Mail, Shield, Check, Trash2, Plus, Loader2, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "Member" });
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/team", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMembers(data.members || []);
          return;
        }
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load team members");
    } catch (err) {
      console.warn("[TEAM_PAGE_FETCH_WARN]", err);
      setError(err.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newMember.email) return;

    setSubmitting(true);
    setInviteError("");

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      const data = await res.json();
      if (data.success && data.member) {
        setMembers((prev) => [...prev, data.member]);
        setNewMember({ name: "", email: "", role: "Member" });
        setInviteModalOpen(false);
      } else {
        setInviteError(data.error || "Failed to send invitation");
      }
    } catch (err) {
      setInviteError(err.message || "Network error while inviting team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch(`/api/team?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      alert(err.message || "Error removing team member");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Team & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Invite colleagues to collaborate on bots, review conversations, and manage captured leads.
          </p>
        </div>

        <button
          onClick={() => {
            setInviteError("");
            setInviteModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadMembers}
            className="font-semibold underline hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-xs">Loading team roster...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs space-y-2">
            <UserPlus className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">
              No team members yet
            </p>
            <p className="text-neutral-500">
              Invite administrators and agents to help oversee your AI chatbots.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 font-medium uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Added Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {members.map((m) => {
                  const initials = (m.name || m.email || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">{m.name}</p>
                            <p className="text-[11px] text-neutral-400">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-neutral-800 dark:text-neutral-200">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-500">
                        {m.role === "Owner"
                          ? "Full Tenant Access & Billing"
                          : m.role === "Admin"
                          ? "Manage Bots, Knowledge & Leads"
                          : "View Analytics & Inbox"}
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400">{m.addedDate}</td>
                      <td className="p-4 text-right">
                        {m.role !== "Owner" && (
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Teammate"
        description="Your team member will receive an invitation to access this workspace."
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          {inviteError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {inviteError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Business Email Address
            </label>
            <input
              type="email"
              required
              placeholder="rahul@company.com"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Assigned Role
            </label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
            >
              <option value="Admin">Admin (Can edit bots and train knowledge)</option>
              <option value="Member">Member (Can view conversations & leads)</option>
              <option value="Viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-3.5 py-2 text-neutral-500 hover:bg-neutral-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
