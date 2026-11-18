"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldAlert, ArrowRight } from "lucide-react";

export default function TrialBanner({ subscription, onOpenCheckout }) {
  if (!subscription) return null;

  if (!subscription.hasAutopay || subscription.status === "pending_autopay") {
    const trialUsed = Boolean(subscription.hasUsedTrial);
    return (
      <div className="mb-6 px-4 py-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-border)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center shrink-0 text-[var(--accent-primary)]">
            {trialUsed ? <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm">
              {trialUsed
                ? "Subscription required — your one-time free trial has ended"
                : "Activate your 7-day free trial (₹0 charged today)"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {trialUsed
                ? "Select a billing plan to unlock chatbot creation, knowledge indexing, and live chat."
                : "Set up Razorpay autopay to unlock AI chatbot creation, RAG indexing, and lead capture."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCheckout}
          className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium text-white text-xs shadow-xs transition-colors shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <span>{trialUsed ? "Choose Plan" : "Start 7-Day Trial"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const isTrial = subscription.status === "trialing";
  const isExpired = subscription.status === "expired";

  if (!isTrial && !isExpired) return null;

  if (isExpired) {
    return (
      <div className="mb-6 px-4 py-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <strong className="font-semibold">Your 7-day free trial has ended.</strong>{" "}
            <span className="opacity-90">
              Reactivate your subscription to keep your AI chatbot and lead capture online.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCheckout}
          className="h-8 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors shrink-0 cursor-pointer text-xs"
        >
          Reactivate Plan
        </button>
      </div>
    );
  }

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

  const recurringLabel = subscription?.plan?.priceMonthly || "₹2,499/mo";

  return (
    <div className="mb-6 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center shrink-0 text-[var(--accent-primary)]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm">
            7-Day Free Trial Active · {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
          </span>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Recurring billing ({recurringLabel}) starts <strong>{chargeDateStr}</strong> via Razorpay. Cancel anytime before Day 7.
          </p>
        </div>
      </div>

      <Link
        href="/billing"
        className="h-8 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium transition-colors inline-flex items-center justify-center text-xs shrink-0 self-start sm:self-auto"
      >
        Manage Billing
      </Link>
    </div>
  );
}
