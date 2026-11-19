"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldAlert, ArrowRight } from "lucide-react";

export default function TrialBanner({ subscription, onOpenCheckout }) {
  if (!subscription) return null;

  if (!subscription.hasAutopay || subscription.status === "pending_autopay") {
    return (
      <div className="mb-6 px-4 py-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-border)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center shrink-0 text-[var(--accent-primary)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm">
              Activate your workspace subscription
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select a billing plan to unlock AI chatbot creation, RAG vector indexing, and lead capture.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCheckout}
          className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium text-white text-xs shadow-xs transition-colors shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <span>Choose Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const isExpired = subscription.status === "expired";

  if (isExpired) {
    return (
      <div className="mb-6 px-4 py-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <strong className="font-semibold">Your subscription has expired.</strong>{" "}
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

  return null;
}
