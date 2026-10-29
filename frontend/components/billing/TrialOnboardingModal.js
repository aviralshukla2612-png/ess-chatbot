"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function TrialOnboardingModal({
  isOpen,
  onClose,
  onActivated,
  userEmail,
  userName,
  isMandatory = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState("STARTER");

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Create checkout with 7-day trial and future start_at on backend
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          isTrial: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate trial checkout");
      }

      const { checkout } = data;

      // 2. If live Razorpay key is present, open Razorpay Checkout SDK
      if (checkout.keyId && checkout.keyId !== "rzp_test_sandbox" && typeof window !== "undefined") {
        // Load Razorpay script if not loaded
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay payment gateway SDK"));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: checkout.keyId,
          subscription_id: checkout.subscriptionId,
          name: "NexusAI",
          description: "7-Day Free Trial (₹0 today, auto-debits on Day 8)",
          image: "/e-logoicon.webp",
          handler: async function (response) {
            // Verify mandate activation on backend
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscriptionId: response.razorpay_subscription_id || checkout.subscriptionId,
                paymentId: response.razorpay_payment_id || "",
                planId,
                isTrial: true,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              if (onActivated) onActivated(verifyData.subscription);
              if (onClose) onClose();
            } else {
              setError(verifyData.error || "Failed to verify mandate.");
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
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          setError(resp.error?.description || "Autopay authorization failed.");
          setLoading(false);
        });
        rzp.open();
        return;
      }

      // 3. Sandbox / Fallback mode (if Razorpay keys not yet configured in server environment)
      const verifyRes = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: checkout.subscriptionId,
          planId,
          isTrial: true,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        if (onActivated) onActivated(verifyData.subscription);
        if (onClose) onClose();
      } else {
        throw new Error(verifyData.error || "Verification failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!isMandatory && onClose) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Badge */}
        <div className="bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-700 p-6 text-white relative">
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
            {isMandatory ? <Lock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isMandatory ? "Mandatory Setup • Required to Create Bot" : "7-Day Full Access Free Trial"}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {isMandatory ? "Activate 7-Day Free Trial (₹0 Today)" : "Start Your Free Trial with Autopay"}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {isMandatory
              ? "Razorpay autopay mandate is required before you can create and launch your AI chatbots. ₹0 charged upfront today."
              : "Experience unlimited AI conversations and sales automation. Set up autopay today with ₹0 charged upfront."}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Autopay Mechanism Explainer */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100/80 dark:border-indigo-900/60">
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">Due Today</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">₹0 (Zero)</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100/80 dark:border-indigo-900/60">
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">Trial Period</span>
              <span className="font-bold text-neutral-900 dark:text-white">7 Full Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">Auto-Debit Starting Day 8</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">₹2,499 / month</span>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2">
            <p className="font-bold text-neutral-700 dark:text-neutral-300">
              Unlocked with your 7-day trial:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI Bot creation & training</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited AI sales messages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>50 Website & PDF pages indexed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Automated CRM lead extraction</span>
              </div>
            </div>
          </div>

          {/* Guarantee / Cancel info */}
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/60 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              <strong>Cancel anytime with 1 click:</strong> If you cancel before Day 7 in Settings, zero money will be deducted from your account.
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Setting up Razorpay Autopay...</span>
              </>
            ) : (
              <>
                <span>{isMandatory ? "Set Up Autopay (₹0 Today) & Unlock Bot Creation" : "Set Up Autopay & Start 7-Day Free Trial"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-neutral-400">
            🔒 Secured by Razorpay • UPI Autopay (GPay/PhonePe), Debit & Credit Cards supported
          </p>
        </div>
      </div>
    </div>
  );
}
