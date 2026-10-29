"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, ArrowRight, ShieldAlert } from "lucide-react";

export default function TrialBanner({ subscription, onOpenCheckout }) {
  if (!subscription || !subscription.hasAutopay || subscription.status === "pending_autopay") {
    const trialUsed = Boolean(subscription?.hasUsedTrial);
    return (
      <div className="mb-6 p-4 rounded-2xl bg-linear-to-r from-indigo-900/90 via-violet-900/90 to-indigo-950 border border-indigo-500/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-indigo-950/40 text-xs animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            {trialUsed ? <ShieldAlert className="w-5 h-5 text-amber-300" /> : <Sparkles className="w-5 h-5 text-indigo-300" />}
          </div>
          <div>
            <span className="font-extrabold text-white text-xs sm:text-sm block sm:inline">
              {trialUsed ? "Subscription Required: 1-Time Free Trial Already Used" : "Mandatory Setup: Start Your 7-Day Free Trial (₹0 Today)"}
            </span>
            <span className="sm:ml-1 text-white/80 block sm:inline">
              {trialUsed
                ? "Your 1-time 7-day trial has ended or was cancelled. Choose a plan to unlock AI Bot Creation & live deployment."
                : "Set up Razorpay autopay to unlock AI Bot Creation, live lead capture & vector knowledge."}
            </span>
          </div>
        </div>
        <button
          onClick={onOpenCheckout}
          className="px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-bold text-white text-xs shadow-md shadow-indigo-500/30 transition-all shrink-0 cursor-pointer"
        >
          {trialUsed ? "Choose a Plan & Subscribe" : "Activate Trial to Create Bot"}
        </button>
      </div>
    );
  }

  const isTrial = subscription.status === "trialing";
  const isExpired = subscription.status === "expired";

  if (!isTrial && !isExpired) return null;

  if (isExpired) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <strong className="font-bold block sm:inline">Your 7-Day Free Trial has ended.</strong>
            <span className="sm:ml-1 opacity-90">Please activate your subscription to resume your AI chatbot and lead capture.</span>
          </div>
        </div>
        <button
          onClick={onOpenCheckout}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all shrink-0 cursor-pointer text-xs"
        >
          Reactivate Subscription
        </button>
      </div>
    );
  }

  // Calculate days left
  let daysLeft = 7;
  let chargeDateStr = "Day 8";
  if (subscription.currentPeriodEnd) {
    const end = new Date(subscription.currentPeriodEnd);
    const ms = end.getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    chargeDateStr = end.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-indigo-900/90 via-violet-900/90 to-indigo-950 border border-indigo-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-indigo-900/20 text-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-300" />
        </div>
        <div>
          <span className="font-bold text-white text-xs sm:text-sm">
            7-Day Free Trial Active: {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
          </span>
          <p className="text-[11px] text-indigo-200 mt-0.5">
            Autopay of ₹2,499/mo scheduled for <strong>{chargeDateStr}</strong> via Razorpay. Cancel anytime before Day 7.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <Link
          href="/settings"
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium transition-all text-xs"
        >
          Manage Autopay
        </Link>
      </div>
    </div>
  );
}
