"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Shield,
  Bell,
  CreditCard,
  Globe,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Database,
  Server,
  Bot,
  Users2,
  Lock,
  ChevronRight,
  Laptop,
  Mail,
} from "lucide-react";
import { botsApi } from "@/lib/api/bots";
import { leadsApi } from "@/lib/api/leads";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { InlineAlert, useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("general");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    orgName: "",
    role: "Workspace Owner",
    organizationId: "",
  });
  const [copiedTenantId, setCopiedTenantId] = useState(false);
  const [botsCount, setBotsCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);

  const [orgNameInput, setOrgNameInput] = useState("");
  const [profileNameInput, setProfileNameInput] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [market, setMarket] = useState("India (GST applicable)");
  const [language, setLanguage] = useState("English (US & India) — Recommended");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifications, setNotifications] = useState({
    leadCaptured: true,
    weeklyReport: true,
    knowledgeGap: true,
    systemAlerts: false,
    whatsappAlerts: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "billing") {
        window.location.replace("/billing");
        return;
      }
      if (tab && ["general", "profile", "security", "notifications"].includes(tab)) {
        setActiveSection(tab);
      }
      try {
        const storedPrefs = localStorage.getItem("nexus_workspace_prefs");
        if (storedPrefs) {
          const parsed = JSON.parse(storedPrefs);
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.market) setMarket(parsed.market);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.notifications) setNotifications((prev) => ({ ...prev, ...parsed.notifications }));
        }
      } catch {}
    }

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          const userName = d.user.name || d.user.email?.split("@")[0] || "Administrator";
          const orgName = d.activeOrgName || `${userName}'s Workspace`;
          setUserProfile({
            name: userName,
            email: d.user.email || "",
            orgName,
            role:
              d.user.role === "SUPER_ADMIN"
                ? "Super Administrator"
                : d.activeOrgRole === "ORG_ADMIN"
                ? "Workspace Admin"
                : "Workspace Owner",
            organizationId: d.activeOrganizationId || "org_default",
          });
          setOrgNameInput(orgName);
          setProfileNameInput(userName);
        }
      })
      .catch(() => {});

    botsApi
      .getBots()
      .then((list) => setBotsCount(Array.isArray(list) ? list.length : 0))
      .catch(() => {});
    leadsApi
      .getLeads()
      .then((list) => setLeadsCount(Array.isArray(list) ? list.length : 0))
      .catch(() => {});
  }, []);

  const handleCopyTenant = () => {
    if (userProfile.organizationId) {
      navigator.clipboard.writeText(userProfile.organizationId);
      setCopiedTenantId(true);
      setTimeout(() => setCopiedTenantId(false), 2000);
    }
  };

  const handleSaveGeneralOrProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          name: profileNameInput.trim() || userProfile.name,
          organizationName: orgNameInput.trim() || userProfile.orgName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update settings.");
      }

      try {
        localStorage.setItem(
          "nexus_workspace_prefs",
          JSON.stringify({ currency, market, language, notifications })
        );
      } catch {}

      setUserProfile((prev) => ({
        ...prev,
        name: profileNameInput.trim() || prev.name,
        orgName: orgNameInput.trim() || prev.orgName,
      }));
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast({
        title: "Settings saved",
        message: data.message || "Workspace and profile configuration updated.",
        variant: "success",
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        message: "Your account password has been rotated securely.",
        variant: "success",
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    try {
      localStorage.setItem(
        "nexus_workspace_prefs",
        JSON.stringify({ currency, market, language, notifications })
      );
    } catch {}
    toast({
      title: "Notification triggers saved",
      message: "Alert preferences updated for this workspace.",
      variant: "success",
    });
  };

  const sections = [
    {
      id: "general",
      label: "General & Workspace",
      icon: Building2,
      desc: "Organization identity & locale",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      desc: "Personal account details",
    },
    {
      id: "security",
      label: "Security & Password",
      icon: Shield,
      desc: "Credential rotation & sessions",
    },
    {
      id: "notifications",
      label: "Notifications & Alerts",
      icon: Bell,
      desc: "Lead & gap triggers",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      <PageHeader
        badge="Workspace Configuration"
        title="Account & Workspace Settings"
        description="Manage organization identity, account profile, password credentials, and automated alert preferences."
        actions={
          <Link href="/billing">
            <Button variant="secondary" size="sm" icon={CreditCard} iconRight={ArrowRight}>
              Billing & Plans
            </Button>
          </Link>
        }
      />

      {errorMsg && (
        <InlineAlert
          variant="error"
          title="Update Error"
          message={errorMsg}
          onDismiss={() => setErrorMsg("")}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-2 shadow-[var(--shadow-xs)] space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Settings Sections
            </div>
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(s.id);
                    setErrorMsg("");
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-bold ${isActive ? "text-white" : "text-[var(--text-primary)]"}`}>
                        {s.label}
                      </p>
                      <p
                        className={`text-[11px] truncate max-w-[165px] ${
                          isActive ? "text-indigo-100" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ${isActive ? "text-white/80" : "text-[var(--text-muted)]"}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Infrastructure Summary */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Tenant Isolation
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                ENFORCED
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--text-muted)]">Session Auth</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  HMAC-SHA256
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--text-muted)]">Vector Isolation</span>
                <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  Org + Bot Scoped
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8">
          {activeSection === "general" && (
            <div className="space-y-6">
              <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base font-bold shrink-0">
                      {orgNameInput?.slice(0, 2).toUpperCase() || "WS"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                          {orgNameInput || "Workspace"}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          {userProfile.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          ID: {userProfile.organizationId || "org_default"}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTenant}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        >
                          {copiedTenantId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--border-subtle)]">
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] mb-1">
                      <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Active Bots</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {botsCount} {botsCount === 1 ? "Assistant" : "Assistants"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] mb-1">
                      <Users2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Captured Leads</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {leadsCount} Leads
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] mb-1">
                      <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Knowledge Store</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      RAG Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] space-y-5">
                <div className="border-b border-[var(--border-subtle)] pb-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Organization & Locale Preferences
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Configure workspace branding and default assistant locale.
                  </p>
                </div>

                <form onSubmit={handleSaveGeneralOrProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                      Company / Organization Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orgNameInput}
                        onChange={(e) => setOrgNameInput(e.target.value)}
                        placeholder="e.g. Acme Technologies Private Limited"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                        Operating Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500 font-medium"
                      >
                        <option value="INR">Indian Rupee (INR / ₹)</option>
                        <option value="USD">US Dollar (USD / $)</option>
                        <option value="EUR">Euro (EUR / €)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                        Primary Market
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={market}
                          onChange={(e) => setMarket(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                      Default AI Assistant Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500 font-medium"
                    >
                      <option>English (US & India) — Recommended</option>
                      <option>Hindi + English (Hinglish)</option>
                      <option>Multilingual Auto-Detect</option>
                    </select>
                  </div>

                  <div className="pt-3 flex items-center justify-end border-t border-[var(--border-subtle)]">
                    <Button type="submit" loading={saving}>
                      Save Workspace Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] space-y-6">
              <div className="flex items-center gap-4 pb-5 border-b border-[var(--border-subtle)]">
                <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  {profileNameInput?.slice(0, 2).toUpperCase() || "AD"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {userProfile.name || "Administrator"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">{userProfile.email}</p>
                </div>
              </div>

              <form onSubmit={handleSaveGeneralOrProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                    Login Email / Identifier
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userProfile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" loading={saving}>
                    Update Profile
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-5">
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] space-y-5">
                <div className="border-b border-[var(--border-subtle)] pb-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Password & Credential Rotation
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Update your account password using PBKDF2-SHA256 / scrypt hashed storage.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" loading={saving}>
                      Change Password
                    </Button>
                  </div>
                </form>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">
                      Current Authenticated Browser Session
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      HttpOnly SameSite=Lax Cookie · Signed Session Token · Active now
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                  VERIFIED
                </span>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] space-y-5">
              <div className="border-b border-[var(--border-subtle)] pb-4">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Automated Event Triggers & Alerts
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Configure workspace notifications for lead capture, WhatsApp relays, and knowledge gaps.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  {
                    key: "leadCaptured",
                    title: "Immediate Lead Capture Alert",
                    desc: "Alert when a visitor submits a phone number or business email in chat.",
                  },
                  {
                    key: "whatsappAlerts",
                    title: "WhatsApp Message Relays",
                    desc: "Highlight conversations initiated via the Meta WhatsApp Cloud API.",
                  },
                  {
                    key: "weeklyReport",
                    title: "Weekly Performance Summary",
                    desc: "Digest of conversation volume, answer coverage, and lead conversion.",
                  },
                  {
                    key: "knowledgeGap",
                    title: "Knowledge Gap Detection",
                    desc: "Flag repeated visitor questions lacking high-confidence vector answers.",
                  },
                  {
                    key: "systemAlerts",
                    title: "System & Billing Notices",
                    desc: "Subscription renewal reminders and platform maintenance notices.",
                  },
                ].map((item) => {
                  const enabled = Boolean(notifications[item.key]);
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 pr-4">
                        <span className="font-bold text-[var(--text-primary)] block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] leading-relaxed block">
                          {item.desc}
                        </span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={item.title}
                        className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transform transition-transform absolute top-0.5 left-0.5 ${
                            enabled ? "translate-x-4.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSaveNotifications}>Save Alert Preferences</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
