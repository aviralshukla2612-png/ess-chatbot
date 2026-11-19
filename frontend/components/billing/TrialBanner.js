"use client";

import React from "react";
import Link from "next/link";
import { Crown, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

export default function TrialBanner({ subscription, onOpenCheckout }) {
  if (!subscription) return null;

  if (!subscription.hasAutopay || subscription.status === "pending_autopay") {
    return (
      <div className="mb-6 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-indigo-500/30 shadow-md shadow-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30 text-white ring-2 ring-indigo-500/20">
            <Crown className="w-5 h-5 fill-white/20 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">
                Activate Your Workspace Subscription
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-2.5 h-2.5 fill-amber-400" />
                <span>PREMIUM</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select a billing plan to unlock AI chatbot creation, RAG vector indexing, and verified lead capture.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCheckout}
          className="h-9 px-4.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 font-semibold text-white text-xs shadow-md shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
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
      <div className="mb-6 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-rose-500/30 shadow-md shadow-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in text-rose-900 dark:text-rose-200">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 ring-2 ring-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <strong className="font-bold text-sm text-[var(--text-primary)]">Your subscription has expired.</strong>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Reactivate your subscription to keep your AI assistant and automated lead capture online.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCheckout}
          className="h-9 px-4.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white text-xs shadow-md shadow-rose-600/25 transition-all shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <span>Reactivate Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
