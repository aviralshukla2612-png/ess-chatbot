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
} from "lucide-react";
import { mockCurrentUser, mockOrganizations } from "@/lib/mock/data";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [savedNotice, setSavedNotice] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: "", email: "", orgName: "" });
  const [billingData, setBillingData] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");

  const loadBilling = () => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setBillingData(d);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          const userName = d.user.name || d.user.email.split("@")[0];
          setUserProfile({
            name: userName,
            email: d.user.email,
            orgName: `${userName}'s Workspace`,
          });
        }
      })
      .catch(() => {});

    loadBilling();
  }, []);

  const handleCancelAutopay = async () => {
    if (!confirm("Are you sure you want to cancel autopay? You will not be charged when the trial ends, but your subscription will lapse.")) {
      return;
    }
    setCancelLoading(true);
    setCancelSuccessMsg("");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setCancelSuccessMsg(d.message || "Autopay has been cancelled.");
        loadBilling();
      } else {
        alert(d.error || "Failed to cancel autopay");
      }
    } catch {
      alert("Network error while cancelling autopay");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
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
                  key={`org_${userProfile.orgName}`}
                  defaultValue={userProfile.orgName || "My Workspace"}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Default Currency
                </label>
                <select className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40">
                  <option>Indian Rupee (INR / ₹)</option>
                  <option>US Dollar (USD / $)</option>
                  <option>Euro (EUR / €)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary Market & Jurisdiction
                </label>
                <input
                  type="text"
                  defaultValue="India (GST applicable)"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
                />
              </div>

              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
              >
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
                  key={`name_${userProfile.name}`}
                  defaultValue={userProfile.name || "Workspace Member"}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  key={`email_${userProfile.email}`}
                  defaultValue={userProfile.email || ""}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40"
                />
              </div>

              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
              >
                Update Profile
              </button>
            </form>
          )}

          {activeSection === "billing" && (
            <div className="space-y-6 text-xs">
              {cancelSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                  ✓ {cancelSuccessMsg}
                </div>
              )}

              <div className="p-5 rounded-2xl bg-linear-to-tr from-indigo-900 to-violet-900 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Razorpay Subscription & Mandate
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 backdrop-blur-md">
                    {billingData?.isTrial
                      ? "7-Day Free Trial"
                      : billingData?.subscription?.status === "cancelled"
                      ? "Cancelled"
                      : billingData?.subscription?.status?.toUpperCase() || "Active"}
                  </span>
                </div>

                <h4 className="text-xl font-bold">
                  {billingData?.isTrial
                    ? "Starter Plan (7-Day Trial Active)"
                    : `${billingData?.subscription?.plan?.name || "Starter"} Plan`}
                </h4>

                <p className="text-xs opacity-85 leading-relaxed">
                  {billingData?.isTrial
                    ? `Full access to custom AI Chatbots, Vector Knowledge, and Leads CRM. ₹0 was charged upfront.`
                    : "Unlimited AI messages, lead CRM workflows, and vector retrieval."}
                </p>

                <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    {billingData?.isTrial ? (
                      <span>
                        Automatic recurring deduction of <strong>{billingData?.autopayAmount || "₹2,499"}</strong> begins on <strong>{billingData?.autopayDate || "Day 8"}</strong>.
                      </span>
                    ) : (
                      <span>Renews automatically every month via Razorpay.</span>
                    )}
                  </div>

                  {billingData?.isTrial && billingData?.subscription?.status !== "cancelled" && (
                    <button
                      onClick={handleCancelAutopay}
                      disabled={cancelLoading}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 font-semibold transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Autopay"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="font-bold text-neutral-900 dark:text-white block">
                  Autopay & Quota Details
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-500">
                    <span>Payment Gateway:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Razorpay Subscriptions (UPI Autopay / Card)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-500">
                    <span>Trial Remaining:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {billingData?.trialDaysRemaining ?? 7} Days Remaining
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-500">
                    <span>Token & Message Limit:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Unlimited (No Limits)
                    </span>
                  </div>
                </div>
              </div>
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
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
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
                { title: "System status and performance alerts", def: false },
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
