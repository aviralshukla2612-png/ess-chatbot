"use client";

import React, { useState, useEffect } from "react";
import CreateBotWizard from "@/components/bots/CreateBotWizard";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Bot, ArrowRight, Lock, Sparkles, CreditCard } from "lucide-react";
import { botsApi } from "@/lib/api/bots";
import Skeleton from "@/components/ui/Skeleton";

export default function CreateBotPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasAutopay, setHasAutopay] = useState(true);

  useEffect(() => {
    async function checkLimitAndBilling() {
      try {
        const [botsList, meRes, subRes] = await Promise.all([
          botsApi.getBots(),
          fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/billing/subscription", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setBots(botsList || []);
        const superAdmin =
          meRes?.user?.role === "SUPER_ADMIN" || meRes?.activeOrgRole === "SUPER_ADMIN";
        setIsSuperAdmin(Boolean(superAdmin));

        const activeSub = Boolean(subRes?.hasActiveSubscription);
        setHasAutopay(activeSub);

        if (!superAdmin && !activeSub) {
          window.dispatchEvent(new CustomEvent("open-trial-modal"));
        }
      } catch (err) {
        console.warn("Error checking bot limit or billing", err);
      } finally {
        setLoading(false);
      }
    }
    checkLimitAndBilling();

    const handleSubUpdated = () => {
      setHasAutopay(true);
    };
    window.addEventListener("subscription-updated", handleSubUpdated);
    return () => window.removeEventListener("subscription-updated", handleSubUpdated);
  }, []);

  const hasReachedLimit = !isSuperAdmin && bots.length >= 1;
  const existingBot = bots[0];
  const isLockedWithoutAutopay = !isSuperAdmin && !hasAutopay;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/bots"
          aria-label="Back to chatbots"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Create AI Chatbot
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Configure your industry template, business profile, knowledge base, and widget persona.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : isLockedWithoutAutopay ? (
        <div className="max-w-xl mx-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-8 shadow-[var(--shadow-sm)] text-center space-y-5 my-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-primary)] mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[11px] font-semibold text-[var(--accent-text)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Subscription Setup Required</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Activate Your Plan to Create Chatbots
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Subscribe to a plan to create, customize, and deploy AI chatbots across your website and WhatsApp.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-trial-modal"))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Activate Plan &amp; Unlock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/bots"
              className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs sm:text-sm font-medium hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Back to Chatbots
            </Link>
          </div>
        </div>
      ) : hasReachedLimit ? (
        <div className="max-w-xl mx-auto bg-[var(--bg-surface)] rounded-2xl border border-amber-200 dark:border-amber-500/30 p-8 shadow-[var(--shadow-sm)] text-center space-y-5 my-8">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/12 border border-amber-200 dark:border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Workspace Chatbot Limit Reached (1/1)
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Your current workspace tier includes 1 active AI chatbot. Manage or retrain your existing assistant below.
            </p>
          </div>

          {existingBot && (
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  {existingBot.avatar || "🤖"}
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                    {existingBot.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {existingBot.company || "Active Chatbot"}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25">
                Active
              </span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {existingBot && (
              <Link
                href={`/bots/${existingBot.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span>Manage {existingBot.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/bots"
              className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs sm:text-sm font-medium hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Back to Chatbots
            </Link>
          </div>
        </div>
      ) : (
        <CreateBotWizard />
      )}
    </div>
  );
}
