"use client";

import React, { useState, useEffect } from "react";
import CreateBotWizard from "@/components/bots/CreateBotWizard";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Bot, ArrowRight, Lock, Sparkles, CreditCard } from "lucide-react";
import { botsApi } from "@/lib/api/bots";
import TrialOnboardingModal from "@/components/billing/TrialOnboardingModal";

export default function CreateBotPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasAutopay, setHasAutopay] = useState(true);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function checkLimitAndBilling() {
      try {
        const [botsList, meRes, subRes] = await Promise.all([
          botsApi.getBots(),
          fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/billing/subscription", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setBots(botsList || []);
        const superAdmin = meRes?.user?.role === "SUPER_ADMIN" || meRes?.activeOrgRole === "SUPER_ADMIN";
        if (superAdmin) {
          setIsSuperAdmin(true);
        }
        if (meRes?.user) {
          setCurrentUser(meRes.user);
        }

        const activeSub = Boolean(subRes?.hasActiveSubscription);
        setHasAutopay(activeSub);

        if (!superAdmin && !activeSub) {
          setTrialModalOpen(true);
        }
      } catch (err) {
        console.warn("Error checking bot limit or billing", err);
      } finally {
        setLoading(false);
      }
    }
    checkLimitAndBilling();
  }, []);

  const hasReachedLimit = !isSuperAdmin && bots.length >= 1;
  const existingBot = bots[0];
  const isLockedWithoutAutopay = !isSuperAdmin && !hasAutopay;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/bots"
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Create AI Assistant
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Build and train an autonomous conversational agent in minutes.
          </p>
        </div>
      </div>

      {!loading && isLockedWithoutAutopay ? (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 p-8 shadow-xs text-center space-y-5 my-8">
          <div className="w-14 h-14 rounded-2xl bg-[#B68A55]/10 dark:bg-[#B68A55]/15 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55] mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B68A55]/10 dark:bg-[#B68A55]/15 border border-[#B68A55]/20 text-[11px] font-bold text-[#B68A55]">
              <Sparkles className="w-3.5 h-3.5" />
              Mandatory Setup
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              7-Day Free Trial Setup Required (₹0 Today)
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              Bot creation is locked until you complete the 7-day free trial onboarding with Razorpay autopay.
              Zero money is charged today. You can create your AI chatbot and test knowledge ingestion immediately after authorization.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setTrialModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#252525] hover:bg-black dark:bg-[#B68A55] dark:hover:bg-[#9F7645] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Set Up Autopay & Unlock Bot Creation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/bots"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-[#1A1A1A] transition-colors"
            >
              Back to Bots List
            </Link>
          </div>
        </div>
      ) : !loading && hasReachedLimit ? (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#0D0D0D] rounded-2xl border border-amber-200 dark:border-amber-800/60 p-8 shadow-xs text-center space-y-5 my-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Bot Creation Limit Reached (1/1)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              User and Sub-Admin accounts are restricted to creating a maximum of <strong>1 bot</strong>.
              You already have an active bot in your organization.
            </p>
          </div>

          {existingBot && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  {existingBot.avatar || "🤖"}
                </span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                    {existingBot.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {existingBot.company || "Active Bot"}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                Active
              </span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {existingBot ? (
              <Link
                href={`/bots/${existingBot.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
              >
                <Bot className="w-4 h-4" />
                <span>Manage {existingBot.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : null}
            <Link
              href="/bots"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Back to Bots List
            </Link>
          </div>
        </div>
      ) : (
        <CreateBotWizard />
      )}

      <TrialOnboardingModal
        isOpen={trialModalOpen}
        isMandatory={!hasAutopay && !isSuperAdmin}
        onClose={() => setTrialModalOpen(false)}
        onActivated={() => {
          setHasAutopay(true);
          setTrialModalOpen(false);
        }}
        userEmail={currentUser?.email}
        userName={currentUser?.name}
      />
    </div>
  );
}
