"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Loader2,
  Lock,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrialOnboardingModal({
  isOpen,
  onClose,
  onActivated,
  userEmail,
  userName,
  isMandatory = false,
  hasUsedTrial = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availablePlans, setAvailablePlans] = useState([]);
  const [planId, setPlanId] = useState("PLAN_STARTER_MONTHLY");
  const [isTrialExhausted, setIsTrialExhausted] = useState(Boolean(hasUsedTrial));
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsTrialExhausted(Boolean(hasUsedTrial));
  }, [hasUsedTrial]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.plans) && d.plans.length > 0) {
          setAvailablePlans(d.plans);
          const def = d.plans.find((p) => p.isDefault) || d.plans[0];
          if (def) setPlanId(def.id);
        }
      })
      .catch(() => {});

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isMandatory && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isMandatory, onClose]);

  if (!isOpen) return null;

  const selectedPlan = availablePlans.find((p) => p.id === planId) || availablePlans[0] || null;
  const trialDays = selectedPlan?.trialDays ?? 7;
  const recurringAmountText = selectedPlan
    ? `${selectedPlan.priceMonthly} ${selectedPlan.periodLabel || "per month"}`
    : "₹2,499 per month";

  const handleStartTrial = async () => {
    setLoading(true);
    setError("");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading((curr) => {
        if (curr) {
          setError("Payment gateway timed out. Please try again.");
          return false;
        }
        return false;
      });
    }, 15000);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan?.id || planId,
          isTrial: !isTrialExhausted,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        if (data.code === "TRIAL_ALREADY_USED") {
          setIsTrialExhausted(true);
        }
        throw new Error(data.error || "Failed to initiate checkout");
      }

      const { checkout } = data;
      const isLiveGateway = Boolean(
        checkout?.keyId &&
          checkout?.keyId !== "rzp_test_sandbox" &&
          (checkout?.orderId || checkout?.mode === "live")
      );

      if (isLiveGateway && typeof window !== "undefined") {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay payment gateway"));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: checkout.keyId,
          ...(checkout.orderId ? { order_id: checkout.orderId } : {}),
          name: "Emperor Smart Solutions",
          description: checkout.isTrial
            ? `${selectedPlan?.name || "Starter"} - 7-Day Free Trial`
            : `${selectedPlan?.name || "Starter"} Plan (${selectedPlan?.priceMonthly || "₹2,499"})`,
          handler: async function (response) {
            try {
              const verifyRes = await fetch("/api/billing/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscriptionId:
                    response.razorpay_subscription_id ||
                    checkout.subscriptionId ||
                    `sub_order_${response.razorpay_order_id || Date.now()}`,
                  paymentId: response.razorpay_payment_id || "",
                  orderId: response.razorpay_order_id || checkout.orderId || "",
                  signature: response.razorpay_signature || "",
                  planId: selectedPlan?.id || planId,
                  isTrial: Boolean(checkout.isTrial),
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                onActivated?.(verifyData.subscription);
                onClose?.();

                try {
                  const savedInd =
                    typeof window !== "undefined"
                      ? localStorage.getItem("nexus_selected_industry")
                      : null;
                  if (
                    savedInd &&
                    typeof window !== "undefined" &&
                    !window.location.pathname.includes("/bots/create")
                  ) {
                    window.location.href = `/bots/create?industry=${encodeURIComponent(savedInd)}`;
                  }
                } catch {}
              } else {
                setError(verifyData.error || "Payment verification failed.");
              }
            } catch {
              setError("Payment verification request failed. Please check your connection.");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            email: userEmail || "",
            name: userName || "",
          },
          theme: {
            color: "#4F46E5",
          },
          modal: {
            ondismiss: function () {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setError(resp.error?.description || "Payment authorization cancelled or failed.");
          setLoading(false);
        });
        rzp.open();
        return;
      }

      // Sandbox / instant verification mode
      const verifyRes = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: checkout.subscriptionId,
          planId: selectedPlan?.id || planId,
          isTrial: !isTrialExhausted,
        }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (verifyData.success) {
        onActivated?.(verifyData.subscription);
        onClose?.();
      } else {
        throw new Error(verifyData.error || "Subscription verification failed");
      }
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError(err.message || "An unexpected error occurred during setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isMandatory && onClose) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        className="relative w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-modal)] overflow-hidden text-[var(--text-primary)] my-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-[var(--bg-surface)] px-6 py-5 border-b border-[var(--border-subtle)]">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close billing dialog"
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[11px] font-semibold text-[var(--accent-text)] mb-2.5">
            {isTrialExhausted ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {isTrialExhausted
                ? "Subscription Required"
                : "7-Day Free Trial · ₹0 Charged Today"}
            </span>
          </div>

          <h2
            id="trial-modal-title"
            className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight pr-8"
          >
            {isTrialExhausted
              ? "Choose a Plan to Activate Your Chatbot"
              : "Start Your 7-Day Free Trial with Autopay"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
            {isTrialExhausted
              ? "Your one-time 7-day free trial has already been used. Select a billing interval below to activate your workspace."
              : "Configure your Razorpay mandate to create and deploy AI chatbots. You will not be charged today."}
          </p>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/12 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] opacity-85 mt-0.5">
                  {isTrialExhausted
                    ? "Select a paid plan below to unlock chatbot deployment."
                    : "Please verify your payment method or try again."}
                </p>
              </div>
            </div>
          )}

          {/* Plan Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-secondary)] text-[11px] uppercase tracking-wider">
                Select Billing Interval
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-300 dark:border-emerald-500/25">
                {isTrialExhausted ? selectedPlan?.priceMonthly || "Paid Plan" : "₹0 Today"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availablePlans.map((p) => {
                const isSelected = p.id === selectedPlan?.id;
                const isSixMonths = p.intervalCount === 6 || p.id.includes("6M");
                const isAnnual = p.interval === "yearly" || p.id.includes("ANNUAL");

                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                      isSelected
                        ? "border-[var(--accent-primary)] bg-[var(--accent-soft)]/60 ring-2 ring-[var(--focus-ring)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {p.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
                          {p.priceMonthly}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          /{p.periodLabel?.replace(/^per\s+/i, "") || "mo"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      {isSixMonths ? (
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded">
                          Best Value (6-Mo)
                        </span>
                      ) : isAnnual ? (
                        <span className="inline-block text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-1.5 py-0.5 rounded">
                          Annual Pass
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded">
                          Monthly Flexible
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Breakdown */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Due Today</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {isTrialExhausted
                  ? `${selectedPlan?.priceMonthly || "₹2,499"}`
                  : "₹0 (Zero Charged Today)"}
              </span>
            </div>
            {!isTrialExhausted ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Trial Access</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {trialDays} Full Days Included
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Recurring Billing Starts</span>
                  <span className="font-semibold text-[var(--accent-text)]">
                    Day {trialDays + 1} ({recurringAmountText})
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Billing Term</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedPlan?.name} ({selectedPlan?.periodLabel || "per month"})
                </span>
              </div>
            )}
          </div>

          {/* Feature Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--text-secondary)]">
            {[
              "AI Chatbot creation & custom persona",
              "Website & document RAG indexing",
              "Real-time inbox & human handoff",
              "Automated CRM lead qualification",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Cancel anytime:</strong> Cancel in Billing before Day {trialDays} with zero charges.
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Razorpay...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>
                  {isTrialExhausted
                    ? `Subscribe to ${selectedPlan?.name || "Starter"} (${selectedPlan?.priceMonthly || "₹2,499"})`
                    : "Continue to Razorpay Autopay (₹0 Today)"}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-[var(--text-muted)]">
            256-bit TLS encrypted · Supports UPI Autopay, Debit & Credit Cards via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
