"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
  Calendar,
  Loader2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { InlineAlert, useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";

const EXTENSION_PACKAGES = [
  {
    id: "monthly",
    name: "Monthly Pass",
    badge: "Flexible",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    duration: "+30 Days Access",
    price: "₹999",
    equivalent: "₹999 / month",
    periodLabel: "1 month",
    description: "Prepaid 30-day workspace extension with full autonomous AI assistant access.",
    features: [
      "1 workspace & chatbot",
      "Full autonomous AI access",
      "Unlimited visitor conversations",
      "50 Website Knowledge Pages",
      "Lead Capture & CSV Export",
    ],
    isPopular: false,
    cta: "Activate Monthly (₹999)",
  },
  {
    id: "annual",
    name: "Annual VIP Pass",
    badge: "RECOMMENDED · SAVE ₹2,989",
    badgeClass:
      "bg-indigo-600 text-white border-indigo-600 shadow-xs",
    duration: "+365 Days Access",
    price: "₹8,999",
    equivalent: "₹749 / month",
    periodLabel: "12 months",
    description: "Best annual value — save ₹2,989 compared with twelve monthly renewals.",
    features: [
      "1 workspace & chatbot",
      "Full autonomous AI access",
      "Save ₹2,989 vs monthly renewals",
      "500 Knowledge Pages & PDFs",
      "Priority onboarding support",
    ],
    isPopular: true,
    cta: "Activate Annual VIP (₹8,999)",
  },
  {
    id: "six-months",
    name: "Six Months Pass",
    badge: "Half-Year Value",
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
    duration: "+180 Days Access",
    price: "₹5,999",
    equivalent: "₹999 / month",
    periodLabel: "6 months",
    description: "Uninterrupted commercial AI customer engagement for 6 full months.",
    features: [
      "1 workspace & chatbot",
      "Full autonomous AI access",
      "Unlimited visitor conversations",
      "150 Website Knowledge Pages",
      "WhatsApp Cloud API Webhook",
    ],
    isPopular: false,
    cta: "Activate 6 Months (₹5,999)",
  },
];

export default function BillingPage() {
  const { toast } = useToast();
  const [billingData, setBillingData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [extendingPlanId, setExtendingPlanId] = useState(null);
  const [extensionSuccessMsg, setExtensionSuccessMsg] = useState("");
  const [extensionError, setExtensionError] = useState("");
  const extensionSectionRef = useRef(null);
  const autoCheckoutTriggered = useRef(false);

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

  const handleConfirmCancelAutopay = async () => {
    setCancelLoading(true);
    setCancelSuccessMsg("");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setCancelSuccessMsg(d.message || "Autopay mandate has been cancelled.");
        toast({ title: "Autopay cancelled", message: "No future recurring charges will occur.", variant: "info" });
        loadBilling();
      } else {
        setExtensionError(d.error || "Failed to cancel autopay");
      }
    } catch {
      setExtensionError("Network error while cancelling autopay.");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleExtendPlan = async (plan) => {
    setExtendingPlanId(plan.id);
    setExtensionError("");
    setExtensionSuccessMsg("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment gateway. Check your connection.");
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
        throw new Error(data.error || "Failed to create checkout order");
      }

      const { checkout } = data;
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not initialized");
      }

      const options = {
        key: checkout.keyId,
        order_id: checkout.orderId,
        name: "Emperor Nexus",
        description: `Plan Extension: ${plan.name} (${plan.periodLabel})`,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id || checkout.orderId,
                subscriptionId:
                  response.razorpay_subscription_id || response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: plan.id,
                isTrial: false,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setExtensionSuccessMsg(
                `Plan extended! Your workspace is now active on ${plan.name}.`
              );
              toast({
                title: "Subscription activated",
                message: `${plan.name} has been verified and applied.`,
                variant: "success",
              });
              loadBilling();
              window.dispatchEvent(new CustomEvent("subscription-updated"));

              try {
                const params = new URLSearchParams(window.location.search);
                const targetInd =
                  params.get("industry") ||
                  localStorage.getItem("nexus_selected_industry");
                if (targetInd) {
                  setTimeout(() => {
                    window.location.href = `/bots/create?industry=${encodeURIComponent(targetInd)}`;
                  }, 1200);
                }
              } catch {}
            } else {
              setExtensionError(verifyData.error || "Payment signature verification failed.");
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
          color: "#4F46E5",
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

  useEffect(() => {
    if (typeof window === "undefined" || autoCheckoutTriggered.current) return;
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const checkoutParam = params.get("checkout");

    if (checkoutParam === "true" && planParam) {
      autoCheckoutTriggered.current = true;
      const targetPackage =
        EXTENSION_PACKAGES.find(
          (p) =>
            p.id.toLowerCase() === planParam.toLowerCase() ||
            (planParam.includes("month") && !planParam.includes("six") && p.id === "monthly") ||
            (planParam.includes("six") && p.id === "six-months") ||
            (planParam.includes("annual") && p.id === "annual")
        ) || EXTENSION_PACKAGES[0];

      if (targetPackage) {
        setTimeout(() => {
          handleExtendPlan(targetPackage);
        }, 400);
      }
    }
  }, []);

  const planName =
    billingData?.subscription?.plan?.name || "Starter Plan";

  const hasActiveSub = Boolean(billingData?.hasActiveSubscription);
  const isTrial = false;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fade-in">
      <PageHeader
        badge="Razorpay Autopay & Passes"
        title="Billing & Subscription"
        description="Manage your active subscription, RBI-compliant UPI/Card autopay mandate, and prepaid multi-month duration passes."
        actions={
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                {hasActiveSub ? "Active Plan" : "Action Needed"}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {hasActiveSub
                  ? billingData?.subscription?.plan?.priceINR
                    ? `₹${Number(billingData.subscription.plan.priceINR).toLocaleString("en-IN")}`
                    : "Active"
                  : "Not Subscribed"}
              </span>
            </div>
          </div>
        }
      />

      {cancelSuccessMsg && (
        <InlineAlert
          variant="success"
          title="Autopay Cancelled"
          message={cancelSuccessMsg}
          onDismiss={() => setCancelSuccessMsg("")}
        />
      )}

      {extensionSuccessMsg && (
        <InlineAlert
          variant="success"
          title="Subscription Updated"
          message={extensionSuccessMsg}
          onDismiss={() => setExtensionSuccessMsg("")}
        />
      )}

      {extensionError && (
        <InlineAlert
          variant="error"
          title="Billing Notice"
          message={extensionError}
          onDismiss={() => setExtensionError("")}
        />
      )}

      {!loading && !hasActiveSub && (
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-rose-800 dark:text-rose-200 text-sm sm:text-base">
              No Active Subscription or Trial Expired
            </h4>
            <p className="text-xs text-rose-700/90 dark:text-rose-300/90 leading-relaxed max-w-xl">
              Your AI assistants require an active subscription or prepaid pass to answer visitor inquiries and capture leads. Choose a prepaid pass below or activate a trial mandate.
            </p>
          </div>
          <Button
            icon={Sparkles}
            onClick={() => extensionSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Choose Plan Pass
          </Button>
        </div>
      )}

      {/* Active Subscription Summary Card */}
      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-[var(--shadow-sm)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Official Payment Gateway
                </span>
                <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Razorpay Subscriptions & Prepaid Passes
                </span>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-fit ${
                isTrial
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                  : hasActiveSub
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25"
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
              {hasActiveSub
                ? "Active Subscription"
                : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {planName}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {hasActiveSub
                  ? "Production workspace tier with unlimited conversational turns, RAG indexing, and CRM lead sync."
                  : "Activate a plan below to start automating visitor assistance and capturing leads."}
              </p>
            </div>

            <div className="sm:text-right flex flex-col justify-center sm:items-end">
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
                {"₹2,499"}
                <span className="text-xs sm:text-sm font-normal text-[var(--text-muted)] font-sans">
                  {" / month"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {isTrial
                  ? `Starter Autopay mandate (₹2,499/mo) schedules after ${billingData?.autopayDate || "Day 7"}, or switch to a ₹999/mo prepaid pass below.`
                  : "Starter Autopay Mandate · or extend anytime with prepaid passes below."}
              </p>
            </div>
          </div>

          {isTrial && (
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Trial Period Remaining
                </span>
                <span className="font-bold font-mono text-[var(--text-primary)] tabular-nums">
                  {billingData?.trialDaysRemaining ?? 7} Days Left
                </span>
              </div>
              <div className="w-full bg-[var(--border-subtle)] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      14,
                      Math.min(100, Math.round(((7 - (billingData?.trialDaysRemaining ?? 7)) / 7) * 100))
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
              <span>Subscription Ref:</span>
              <span className="font-mono text-[var(--text-primary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                {billingData?.subscription?.providerSubscriptionId || "sub_unregistered"}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                size="sm"
                icon={Zap}
                onClick={() => extensionSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                Extend Plan Duration
              </Button>

              {isTrial && billingData?.subscription?.status !== "cancelled" && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelLoading}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Autopay
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prepaid Duration Extension Packages */}
      <div ref={extensionSectionRef} className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              Prepaid Duration Passes
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mt-0.5">
              Extend Your Workspace Access
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              One-time Razorpay checkout passes with zero recurring mandate lock-in.
            </p>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Activates immediately after signature verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {EXTENSION_PACKAGES.map((pkg) => {
            const isProcessing = extendingPlanId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-6 transition-all flex flex-col justify-between bg-[var(--bg-surface)] ${
                  pkg.isPopular
                    ? "border-2 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 md:-translate-y-1.5 z-10 ring-1 ring-indigo-500/25"
                    : "border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${pkg.badgeClass}`}
                    >
                      {pkg.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {pkg.duration}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[var(--text-primary)]">{pkg.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="text-3xl font-extrabold font-mono tracking-tight text-[var(--text-primary)] tabular-nums">
                      {pkg.price}
                    </div>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      Equivalent to {pkg.equivalent}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2 text-xs">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[var(--text-secondary)]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                  <Button
                    variant={pkg.isPopular ? "primary" : "secondary"}
                    className="w-full"
                    disabled={isProcessing}
                    onClick={() => handleExtendPlan(pkg)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <span>{pkg.cta}</span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Security & Invoicing Compliance */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-4">
        <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs sm:text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Payment Security & Invoicing Compliance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="font-bold text-[var(--text-primary)] block">
              PCI-DSS Level 1 Gateway
            </span>
            <span className="text-[11px] text-[var(--text-muted)] leading-relaxed block">
              Card and UPI credentials are processed directly by Razorpay and never stored on workspace servers.
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="font-bold text-[var(--text-primary)] block">
              HMAC-SHA256 Verified
            </span>
            <span className="text-[11px] text-[var(--text-muted)] leading-relaxed block">
              Every payment callback is cryptographically verified before subscription entitlements are activated.
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="font-bold text-[var(--text-primary)] block">
              GST Compliant Receipts
            </span>
            <span className="text-[11px] text-[var(--text-muted)] leading-relaxed block">
              Payment confirmations are dispatched to {currentUser?.email || "your workspace email"}.
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancelAutopay}
        title="Cancel Autopay Mandate?"
        description="You will not be charged when your trial or current billing cycle ends, and your subscription will not auto-renew."
        confirmText="Cancel Autopay"
        cancelText="Keep Subscription"
        loadingText="Cancelling..."
        variant="warning"
        badgeText="Subscription Notice"
      />
    </div>
  );
}
