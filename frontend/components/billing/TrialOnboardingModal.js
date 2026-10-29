"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  Loader2,
  Lock,
  X,
  AlertCircle,
  Check,
  Zap,
} from "lucide-react";

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
    if (hasUsedTrial) setIsTrialExhausted(true);
  }, [hasUsedTrial]);

  useEffect(() => {
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
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const selectedPlan = availablePlans.find((p) => p.id === planId) || availablePlans[0] || null;
  const trialDays = selectedPlan?.trialDays ?? 7;
  const recurringAmountText = selectedPlan
    ? `${selectedPlan.priceMonthly} ${selectedPlan.periodLabel || "per month"}`
    : "₹2,500 per month";

  const handleStartTrial = async () => {
    setLoading(true);
    setError("");

    // Safety timeout: Never leave the user stuck on loading if an external script hangs
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading((curr) => {
        if (curr) {
          setError("Gateway response timed out. Please try again or contact support.");
          return false;
        }
        return false;
      });
    }, 12000);

    try {
      // 1. Create checkout with trial and future start_at on backend
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
        throw new Error(data.error || "Failed to initiate trial checkout");
      }

      const { checkout } = data;

      // 2. LIVE Razorpay Gateway Mode (Opens Razorpay Checkout for subscription mandate or verification order)
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
          ...(checkout.subscriptionId && !checkout.subscriptionId.startsWith("sub_trial_") ? { subscription_id: checkout.subscriptionId } : {}),
          name: "Emperor Smart Solutions",
          description: `${selectedPlan?.name || "Starter"} - 7-Day Free Trial (₹1 Verification)`,
          image: "/e-logoicon.webp",
          currency: "INR",
          amount: 100,
          handler: async function (response) {
            try {
              const verifyRes = await fetch("/api/billing/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscriptionId: response.razorpay_subscription_id || checkout.subscriptionId || `sub_order_${response.razorpay_order_id || Date.now()}`,
                  paymentId: response.razorpay_payment_id || "",
                  orderId: response.razorpay_order_id || checkout.orderId || "",
                  signature: response.razorpay_signature || "",
                  planId: selectedPlan?.id || planId,
                  isTrial: true,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                if (onActivated) onActivated(verifyData.subscription);
                if (onClose) onClose();
              } else {
                setError(verifyData.error || "Failed to verify mandate.");
              }
            } catch (err) {
              setError("Verification request failed. Please check your connection.");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            email: userEmail || "",
            name: userName || "",
          },
          theme: {
            color: "#4f46e5",
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

      // 3. Fallback Instant Trial Activation (Sandbox or Test environment)
      const verifyRes = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: checkout.subscriptionId,
          planId: selectedPlan?.id || planId,
          isTrial: true,
        }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (verifyData.success) {
        if (onActivated) onActivated(verifyData.subscription);
        if (onClose) onClose();
      } else {
        throw new Error(verifyData.error || "Instant trial verification failed");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={() => {
        if (onClose) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-6 border-b border-indigo-500/20">
          <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close (X) button - Always visible and clickable */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer z-30 border border-slate-700/80 shadow-md group"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-2.5">
            {isTrialExhausted ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : isMandatory ? <Lock className="w-3.5 h-3.5 text-indigo-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{isTrialExhausted ? "1-Time Free Trial Already Used • Subscribe to Continue" : "7-Day Free Trial • ₹0 Charged Today"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isTrialExhausted ? "Choose a Plan to Activate Chatbot" : isMandatory ? "Activate 7-Day Free Trial (₹0 Today)" : "Start Your Free Trial with Autopay"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
            {isTrialExhausted
              ? "Your 1-time 7-day free trial has expired or was cancelled. Select a plan below to unlock your bot and resume live chat."
              : isMandatory
              ? "Set up your Razorpay autopay mandate to create and deploy your AI chatbots. No money is deducted from your account today."
              : "Unlock full AI conversation and lead qualification capabilities. Zero charges today."}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/80 text-rose-300 flex items-start gap-2.5 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-rose-400/80 mt-0.5">Please check your network connection or try again.</p>
              </div>
            </div>
          )}

          {/* Plan Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                Select Your Plan & Billing Interval
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ₹0 Today
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-500 bg-gradient-to-b from-indigo-950/50 to-slate-900 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-950/50"
                        : "border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-white truncate">
                          {p.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-base font-black text-indigo-300">
                          {p.priceMonthly}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          /{p.periodLabel?.replace(/^per\s+/i, "") || "mo"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      {isSixMonths ? (
                        <span className="inline-block text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                          Best Value (6-Mo)
                        </span>
                      ) : isAnnual ? (
                        <span className="inline-block text-[9px] font-bold text-violet-400 bg-violet-950/80 border border-violet-500/30 px-1.5 py-0.5 rounded-md">
                          VIP Annual Pass
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md">
                          Monthly Flexible
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Autopay Schedule Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Due Today</span>
              <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ₹0 (Zero Charged Today)
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Trial Access</span>
              <span className="font-semibold text-slate-200">{trialDays} Full Days Unlimited</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Recurring Billing Starts</span>
              <span className="font-bold text-indigo-400">Day {trialDays + 1} ({recurringAmountText})</span>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Full AI Bot creation & training</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Unlimited customer sales messages</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Full website & PDF scraping</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Automated CRM lead extraction</span>
            </div>
          </div>

          {/* Guarantee / Cancel info */}
          <div className="flex items-center gap-2.5 text-[11px] text-slate-300 bg-indigo-950/30 border border-indigo-500/20 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>1-Click Cancel Guarantee:</strong> Cancel anytime in Settings before Day {trialDays}. Zero money will ever be deducted from your account.
            </span>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Connecting to Razorpay Autopay...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>
                  {isTrialExhausted
                    ? `Subscribe to ${selectedPlan?.name || "Starter"} (${selectedPlan?.priceMonthly || "₹2,499"})`
                    : isMandatory
                    ? "Set Up Autopay (₹0 Today) & Unlock Bot Creation"
                    : "Set Up Autopay & Start 7-Day Free Trial"}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-500">
            🔒 Secured with 256-bit encryption • Supports UPI Autopay (Google Pay, PhonePe, Paytm), Debit & Credit Cards
          </p>
        </div>
      </div>
    </div>
  );
}

