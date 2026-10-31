"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  Lock,
  Calendar,
  AlertCircle,
  FileText,
  Building2,
  Check,
  Loader2,
  Crown,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function BillingPage() {
  const [billingData, setBillingData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
  const [extendingPlanId, setExtendingPlanId] = useState(null);
  const [extensionSuccessMsg, setExtensionSuccessMsg] = useState("");
  const [extensionError, setExtensionError] = useState("");
  const extensionSectionRef = useRef(null);

  const loadBilling = () => {
    setLoading(true);
    fetch("/api/billing/subscription", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setBillingData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    loadBilling();

    const handleUpdated = () => loadBilling();
    window.addEventListener("subscription-updated", handleUpdated);
    return () => window.removeEventListener("subscription-updated", handleUpdated);
  }, []);

  const handleCancelAutopay = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel autopay? You will not be charged when the trial ends, but your subscription will lapse."
      )
    ) {
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleExtendPlan = async (plan) => {
    setExtendingPlanId(plan.id);
    setExtensionError("");
    setExtensionSuccessMsg("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          isTrial: false,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.checkout) {
        throw new Error(data.error || "Failed to create extension checkout order");
      }

      const { checkout } = data;

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not initialized");
      }

      const options = {
        key: checkout.keyId,
        order_id: checkout.orderId,
        name: "NexusAI Platform",
        description: `Plan Extension: ${plan.name} (${plan.periodLabel})`,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscriptionId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                planId: plan.id,
                isTrial: false,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setExtensionSuccessMsg(`🎉 Plan extended successfully! You are now subscribed to ${plan.name}.`);
              loadBilling();
              window.dispatchEvent(new CustomEvent("subscription-updated"));
            } else {
              setExtensionError(verifyData.error || "Payment verification failed.");
            }
          } catch (err) {
            setExtensionError(err.message || "Failed to confirm payment verification.");
          } finally {
            setExtendingPlanId(null);
          }
        },
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            setExtendingPlanId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setExtensionError(resp.error?.description || "Payment was declined or cancelled.");
        setExtendingPlanId(null);
      });
      rzp.open();
    } catch (err) {
      setExtensionError(err.message || "Unable to proceed with plan extension.");
      setExtendingPlanId(null);
    }
  };

  const extensionPackages = [
    {
      id: "PLAN_STARTER_MONTHLY",
      name: "1 Month Renewal",
      badge: "Standard",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30",
      duration: "+30 Days Access",
      price: "₹2,500",
      equivalent: "₹2,500 / month",
      periodLabel: "1 month",
      description: "Extend your active assistant deployment by 1 billing month.",
      features: [
        "1 AI Sales Bot Active",
        "Unlimited Messages & Inquiries",
        "50 Website Knowledge Pages",
        "Lead Capture & Export",
      ],
      isPopular: false,
      cta: "Extend +1 Month",
    },
    {
      id: "PLAN_PRO_6MONTHS",
      name: "Pro (6 Months Pass)",
      badge: "MOST POPULAR • SAVE 66% 🔥",
      badgeColor: "bg-[#B68A55]/15 text-[#B68A55] border-[#B68A55]/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
      duration: "+180 Days Access (6 Months)",
      price: "₹5,000",
      originalPrice: "₹15,000",
      equivalent: "₹833 / month",
      periodLabel: "6 months",
      description: "Lock in uninterrupted AI customer engagement and save ₹10,000 upfront.",
      features: [
        "1 AI Sales Bot (Strict Limit)",
        "Unlimited Messages & Token Inquiries",
        "150 Website Knowledge Pages",
        "WhatsApp Cloud API Integration",
        "Priority AI Inference Queue",
        "Best Value: Save 66%",
      ],
      isPopular: true,
      cta: "Extend +6 Months Pass 🚀",
    },
    {
      id: "PLAN_ENTERPRISE_ANNUAL",
      name: "Annual VIP Pass",
      badge: "MAX SAVINGS • 1 YEAR VIP 👑",
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
      duration: "+365 Days Access (12 Months)",
      price: "₹9,999",
      originalPrice: "₹30,000",
      equivalent: "₹833 / month",
      periodLabel: "12 months",
      description: "Complete full-year coverage with top priority support and maximum knowledge crawl capacity.",
      features: [
        "1 Full Year (12 Months Continuous Access)",
        "Unlimited Messages & Inquiries",
        "500 Knowledge Pages & PDFs",
        "WhatsApp Cloud API Gateway",
        "Dedicated Account Setup Assistance",
        "Save over ₹20,000 Annually",
      ],
      isPopular: false,
      cta: "Extend +1 Year VIP 👑",
    },
  ];

  const planName =
    billingData?.subscription?.plan?.name ||
    (billingData?.isTrial ? "Starter (7-Day Trial)" : "Starter");

  const hasActiveSub = Boolean(billingData?.hasActiveSubscription);
  const isTrial = Boolean(billingData?.isTrial);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Razorpay Autopay Suite
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RBI Compliant E-Mandate
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Billing & Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your active Razorpay subscription, autopay mandates, plan entitlements, and duration extensions.
          </p>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="pr-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {isTrial ? "Trialing" : hasActiveSub ? "Active Plan" : "Action Needed"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {hasActiveSub ? "₹2,499 / month" : "Not Subscribed"}
            </span>
          </div>
        </div>
      </div>

      {cancelSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {extensionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="font-bold">{extensionSuccessMsg}</span>
        </div>
      )}

      {extensionError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium text-xs flex items-center gap-2 shadow-lg shadow-rose-500/10 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{extensionError}</span>
        </div>
      )}

      {/* Action Required Banner if Inactive */}
      {!hasActiveSub && (
        <div className="p-6 rounded-3xl border border-rose-300 dark:border-rose-900/60 bg-linear-to-r from-rose-500/10 via-rose-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-lg shadow-rose-500/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm sm:text-base">
                No Active Subscription or Trial Expired
              </h4>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 leading-relaxed max-w-xl">
              Your AI assistants require an active subscription to answer visitor inquiries and capture leads. Select an extension package below or start autopay via Razorpay.
            </p>
          </div>
          <button
            onClick={() => {
              if (extensionSectionRef.current) {
                extensionSectionRef.current.scrollIntoView({ behavior: "smooth" });
              } else {
                window.dispatchEvent(new CustomEvent("open-subscription-modal"));
              }
            }}
            className="px-6 py-3 rounded-xl bg-[#252525] hover:bg-black dark:bg-[#B68A55] dark:hover:bg-[#9F7645] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Choose Extension Plan ↓</span>
          </button>
        </div>
      )}

      {/* Executive Razorpay Subscription Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 p-6 sm:p-9 text-[#252525] dark:text-white shadow-xs space-y-7">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B68A55]/10 dark:bg-[#B68A55]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE7DC] dark:border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B68A55]/10 border border-[#B68A55]/20 dark:bg-[#B68A55]/15 dark:border-[#B68A55]/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#B68A55]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B68A55] block">
                Official Payment Gateway
              </span>
              <span className="text-base font-extrabold text-[#252525] dark:text-white">
                Razorpay Subscriptions (UPI Autopay & Cards)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border ${
                isTrial
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : hasActiveSub
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTrial
                    ? "bg-amber-500 animate-pulse"
                    : hasActiveSub
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              {isTrial
                ? "7-Day Free Trial Active"
                : hasActiveSub
                ? "Active Subscription"
                : "Inactive / Action Needed"}
            </span>
          </div>
        </div>

        {/* Plan Details & Pricing */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#252525] dark:text-white">
              {planName} Plan
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {isTrial
                ? "Full unrestricted access to custom AI Chatbots, Vector Knowledge, and Leads CRM. ₹0 was charged upfront."
                : hasActiveSub
                ? "Full production tier with zero message caps, WhatsApp bridge, and lead qualification workflows."
                : "Autopay has lapsed. Reactivate your subscription or choose an extension package to continue."}
            </p>
          </div>

          <div className="sm:text-right flex flex-col justify-center sm:items-end">
            <div className="text-3xl sm:text-4xl font-black text-[#B68A55] font-mono">
              {isTrial ? "₹0.00" : "₹2,499"}
              <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-neutral-400 font-sans">
                {isTrial ? " (Upfront)" : " / month"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {isTrial
                ? `Recurring deduction of ₹2,499/mo begins on ${billingData?.autopayDate || "Day 8"}.`
                : "Billed monthly via automatic bank mandate."}
            </p>
          </div>
        </div>

        {/* Trial Progress Bar */}
        {isTrial && (
          <div className="relative z-10 p-5 rounded-2xl bg-[#FAF9F6] dark:bg-white/5 border border-[#EFE7DC] dark:border-white/10 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Trial Period Progress
              </span>
              <span className="font-bold font-mono text-[#252525] dark:text-white text-sm">
                {billingData?.trialDaysRemaining ?? 7} Days Remaining
              </span>
            </div>
            <div className="w-full bg-[#EFE7DC] dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-amber-500 via-amber-400 to-[#B68A55] h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(
                    12,
                    Math.min(100, Math.round(((7 - (billingData?.trialDaysRemaining ?? 7)) / 7) * 100))
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Card Footer Details & Actions */}
        <div className="relative z-10 pt-5 border-t border-[#EFE7DC] dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2">
            <span>Mandate ID:</span>
            <span className="font-mono text-[#252525] dark:text-neutral-200 bg-[#FAF9F6] dark:bg-neutral-900 px-2 py-0.5 rounded-md font-semibold border border-[#EFE7DC] dark:border-neutral-800">
              {billingData?.subscription?.providerSubscriptionId || "sub_unregistered"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                extensionSectionRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-black dark:bg-[#B68A55] dark:hover:bg-[#9F7645] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#B68A55] dark:text-white" />
              <span>Extend Plan Duration ⚡</span>
            </button>

            {isTrial && billingData?.subscription?.status !== "cancelled" && (
              <button
                onClick={handleCancelAutopay}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/30 text-rose-700 dark:text-rose-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? "Cancelling..." : "Cancel Autopay"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EXTEND PLAN SECTION */}
      <div ref={extensionSectionRef} className="space-y-5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                Extension Packages
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                Instant Razorpay Checkout
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Extend Your Active Plan
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Add more duration to your active assistant or upgrade to multi-month passes to save up to 66%.
            </p>
          </div>

          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            Renews immediately upon payment
          </span>
        </div>

        {/* 3 Extension Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {extensionPackages.map((pkg) => {
            const isProcessing = extendingPlanId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                  pkg.isPopular
                    ? "bg-white dark:bg-[#0D0D0D] border-2 border-[#B68A55] shadow-lg shadow-[#B68A55]/10 text-[#252525] dark:text-white scale-[1.02]"
                    : "bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 shadow-xs hover:border-[#B68A55]/40 dark:hover:border-neutral-700 text-[#252525] dark:text-white"
                }`}
              >
                {/* Popular Pill */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${pkg.badgeColor}`}
                  >
                    {pkg.badge}
                  </span>
                  <span className="text-[11px] font-bold text-[#B68A55] flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {pkg.duration}
                  </span>
                </div>

                {/* Plan Info */}
                <div>
                  <h4 className="text-lg font-black tracking-tight text-[#252525] dark:text-white">{pkg.name}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[#EFE7DC] dark:border-neutral-800">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono tracking-tight text-[#252525] dark:text-white">{pkg.price}</span>
                      {pkg.originalPrice && (
                        <span className="text-xs text-neutral-400 line-through font-mono">
                          {pkg.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#B68A55] font-semibold mt-0.5">
                      Equivalent to {pkg.equivalent}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="mt-5 space-y-2 text-xs">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-neutral-600 dark:text-neutral-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA */}
                <div className="mt-6 pt-4 border-t border-[#EFE7DC] dark:border-neutral-800">
                  <button
                    onClick={() => handleExtendPlan(pkg)}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                      pkg.isPopular
                        ? "bg-[#B68A55] hover:bg-[#a07746] text-white shadow-md shadow-[#B68A55]/25 hover:scale-[1.02]"
                        : "bg-[#252525] hover:bg-black dark:bg-[#1A1A1A] dark:hover:bg-[#252525] text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{pkg.cta}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Included Plan Entitlements Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0D0D0D] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-neutral-900 dark:text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Unlimited AI Conversations</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pl-9">
            Zero hard tokens cap. Visitors can engage in unlimited multi-turn sales and support interactions across all deployed bots.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0D0D0D] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-neutral-900 dark:text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Custom Vector Knowledge (RAG)</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pl-9">
            Upload PDF price sheets, FAQs, and crawl web pages up to 50 URLs per assistant with instant re-indexing and strict tenant isolation.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0D0D0D] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-neutral-900 dark:text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Real-time Lead CRM & Export</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pl-9">
            Automatic capture of visitor phone, email, and intent scores with one-click CSV export and webhook push directly to your CRM.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0D0D0D] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-neutral-900 dark:text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Meta WhatsApp Cloud Gateway</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pl-9">
            Official WhatsApp business integration to deploy your trained bot directly on your company WhatsApp number.
          </p>
        </div>
      </div>

      {/* Payment Security & Invoicing Details */}
      <div className="p-6 sm:p-7 rounded-3xl bg-neutral-50 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold text-xs sm:text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Payment Security & Invoicing Compliance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="font-bold text-neutral-900 dark:text-white block">PCI-DSS Level 1 Security</span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed block">
              Payment credentials are never stored on our servers. Razorpay processes all transactions with 256-bit bank grade encryption.
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="font-bold text-neutral-900 dark:text-white block">UPI & Card Autopay</span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed block">
              Supports Google Pay, PhonePe, Paytm, BHIM UPI autopay mandates and all major domestic & international credit/debit cards.
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="font-bold text-neutral-900 dark:text-white block">GST Compliant Invoicing</span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed block">
              Automated invoice receipts with GST breakdown are dispatched to {currentUser?.email || "your registered email"} after each billing cycle.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
