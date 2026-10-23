"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  User,
  Shield,
  Bell,
  Key,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [savedNotice, setSavedNotice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { user, currentOrg, refreshAuth } = useAuth();

  // Controlled form state
  const [orgName, setOrgName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [jurisdiction, setJurisdiction] = useState("India");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Billing state
  const [billingData, setBillingData] = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);

  // Sync state when auth data loads
  useEffect(() => {
    if (currentOrg?.orgName) {
      setOrgName(currentOrg.orgName);
    }
    if (user?.name) {
      setFullName(user.name);
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user, currentOrg]);

  // Load billing subscription data
  useEffect(() => {
    let isMounted = true;
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing/subscription", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setBillingData(data);
          }
        }
      } catch (e) {
        console.warn("[SETTINGS_BILLING_FETCH_WARN]", e);
      } finally {
        if (isMounted) setBillingLoading(false);
      }
    }
    fetchBilling();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          orgName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedNotice(true);
        if (refreshAuth) await refreshAuth();
        setTimeout(() => setSavedNotice(false), 3000);
      } else {
        setSaveError(data.error || "Failed to update settings");
      }
    } catch (err) {
      setSaveError(err.message || "Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: "general", label: "General & Workspace", icon: Settings },
    { id: "profile", label: "My Profile", icon: User },
    { id: "security", label: "Security & Passwords", icon: Shield },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell },
    { id: "billing", label: "Subscription & Billing", icon: CreditCard },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Account & Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Configure organization profiles, notification triggers, and plan subscriptions.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings successfully saved and synchronized.
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {saveError}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  activeSection === s.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-xs">
          {activeSection === "general" && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-4">
                Organization Details
              </h3>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white"
                >
                  <option value="INR">Indian Rupee (INR / ₹)</option>
                  <option value="USD">US Dollar (USD / $)</option>
                  <option value="EUR">Euro (EUR / €)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary Market & Jurisdiction
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. India (GST applicable)"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </form>
          )}

          {activeSection === "profile" && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-4">
                Personal Profile
              </h3>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  title="Contact platform support to update your registered email address"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Email changes require verification and can be requested via support.
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Profile
              </button>
            </form>
          )}

          {activeSection === "billing" && (
            <div className="space-y-6 text-xs">
              {billingLoading ? (
                <div className="py-8 text-center text-neutral-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  Loading subscription and usage quotas...
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-linear-to-tr from-indigo-900 to-violet-900 text-white">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                      Current Subscription
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {billingData?.subscription?.plan?.name || currentOrg?.plan || "Starter Plan"}
                    </h4>
                    <p className="text-xs opacity-80 mt-1">
                      {billingData?.subscription?.plan?.description ||
                        "Vector chunking, lead qualification, and multi-tenant conversational AI."}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-xs">
                      <span>
                        Status:{" "}
                        <strong className="capitalize">
                          {billingData?.subscription?.status || "Active"}
                        </strong>
                      </span>
                      <span className="text-[11px] opacity-90">
                        {billingData?.subscription?.currentPeriodEnd
                          ? `Renews on ${new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()}`
                          : "Standard Billing Cycle"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                    <span className="font-bold text-neutral-900 dark:text-white block text-sm">
                      Usage Quotas (Current Period)
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between text-neutral-500">
                        <span>Monthly Assistant Messages:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {billingData?.usage?.messages?.used ?? 0} /{" "}
                          {billingData?.usage?.messages?.limit
                            ? Number(billingData.usage.messages.limit).toLocaleString()
                            : "10,000"}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{
                            width: `${Math.min(100, billingData?.usage?.messages?.percentage || 0)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-neutral-500">
                        <span>Indexed Knowledge Pages:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {billingData?.usage?.knowledgePages?.used ?? 0} /{" "}
                          {billingData?.usage?.knowledgePages?.limit
                            ? Number(billingData.usage.knowledgePages.limit).toLocaleString()
                            : "50"}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full"
                          style={{
                            width: `${Math.min(100, billingData?.usage?.knowledgePages?.percentage || 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === "security" && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-4">
                Password & Authentication
              </h3>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
                />
              </div>
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer"
              >
                Change Password
              </button>
            </form>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-4">
                Email & Push Notifications
              </h3>
              {[
                { title: "Immediate notification on qualified lead", def: true },
                { title: "Weekly bot performance report", def: true },
                { title: "Alert when knowledge gap is detected (>10 inquiries)", def: true },
                { title: "Monthly quota limit warning (>80%)", def: false },
              ].map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked={item.def}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {item.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
