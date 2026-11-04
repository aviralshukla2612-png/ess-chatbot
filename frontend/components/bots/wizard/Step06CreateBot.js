"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  Play,
  Share2,
  FileText,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { INDUSTRIES } from "@/lib/wizard/industryTemplates";

export default function Step06CreateBot({
  industry,
  businessDetails,
  assistantConfig,
  uploadedDocuments,
  isSubmitting,
  submitError,
  createdBot,
  creationStage,
  onConfirmCreate,
  onBack,
}) {
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[0];

  const stages = [
    { id: 1, label: "Validating business information & safety policies" },
    { id: 2, label: "Registering assistant entity & organization workspace" },
    { id: 3, label: "Synthesizing approved business knowledge profile" },
    { id: 4, label: "Generating vector chunks & indexing RAG retrieval" },
    { id: 5, label: "Activating live autonomous conversational agent" },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D98B]/10 border border-[#00D98B]/30 text-[11px] font-bold text-[#00D98B] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 06 · Activation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Launch Your Autonomous Assistant
        </h2>
        <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed">
          Ready to deploy. Emperor Nexus will synthesize your approved business questionnaire into a vector-ready knowledge base and activate your AI assistant.
        </p>
      </div>

      {/* State A: In Progress Submission */}
      {isSubmitting && (
        <div className="p-8 sm:p-10 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#963DFF]/20 border border-[#963DFF]/40 text-[#C28AFF] flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Creating & Ingesting Knowledge...
            </h3>
            <p className="text-xs text-[#9898A6]">
              Please wait while the system indexes your business knowledge.
            </p>
          </div>

          {/* Progress Stages Checklist */}
          <div className="max-w-md mx-auto space-y-3 text-left pt-2">
            {stages.map((stg) => {
              const isDone = creationStage > stg.id;
              const isCurrent = creationStage === stg.id;

              return (
                <div
                  key={stg.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : isCurrent
                      ? "bg-[#181828] border-[#963DFF]/60 text-white shadow-md ring-1 ring-[#963DFF]"
                      : "bg-[#0B0B10] border-white/5 text-[#9898A6]/60"
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#C28AFF]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                    )}
                  </div>
                  <span className="font-medium">{stg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* State B: Creation Error with Retry */}
      {!isSubmitting && submitError && (
        <div className="p-8 rounded-3xl bg-[#181216] border border-rose-500/40 shadow-2xl space-y-5 animate-fade-in text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Assistant Creation Failed</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">
              {submitError}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onConfirmCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-xs font-bold shadow-lg shadow-[#963DFF]/30 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Creation</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Edit</span>
            </button>
          </div>
        </div>
      )}

      {/* State C: Celebratory Success State */}
      {!isSubmitting && createdBot && (
        <div className="p-8 sm:p-10 rounded-3xl bg-[#12121A] border border-[#00D98B]/40 shadow-[0_0_50px_rgba(0,217,139,0.15)] space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span>Knowledge Base Synthesized & Indexed</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {createdBot.name || "Assistant"} is Live!
            </h3>
            <p className="text-xs sm:text-sm text-[#9898A6] max-w-md mx-auto leading-relaxed">
              Your autonomous AI assistant has been trained on your verified business questionnaire and is ready to engage visitors.
            </p>
          </div>

          {/* Bot Card Summary */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#0B0B10] border border-white/10 text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-[#161622] border border-white/10">
                {createdBot.avatar || assistantConfig.avatar || "🤖"}
              </span>
              <div>
                <h4 className="font-bold text-xs text-white">
                  {createdBot.name || assistantConfig.name}
                </h4>
                <p className="text-[11px] text-[#9898A6]">
                  {businessDetails.businessName} · {ind.name}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800">
              Active & Indexed
            </span>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/bots/${createdBot.id}?tab=test`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#963DFF] to-[#55A9FF] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#963DFF]/30 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Test Live Chat Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/bots/${createdBot.id}/deploy`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#55A9FF]" />
              <span>Deploy Widget on Website</span>
            </Link>

            <Link
              href={`/bots/${createdBot.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[#9898A6] hover:text-white text-xs font-semibold cursor-pointer"
            >
              <span>Bot Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* State D: Pre-Confirmation Summary Card */}
      {!isSubmitting && !createdBot && !submitError && (
        <div className="p-8 sm:p-10 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-2xl space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{
                backgroundColor: `${assistantConfig.primaryColor || "#963DFF"}25`,
                border: `1px solid ${assistantConfig.primaryColor || "#963DFF"}50`,
              }}
            >
              {assistantConfig.avatar || "🤖"}
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {assistantConfig.name || "AI Assistant"}
              </h3>
              <p className="text-xs text-[#9898A6]">
                {businessDetails.businessName} · {ind.name}
              </p>
            </div>
          </div>

          {/* Ready Check Items */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0B10] border border-white/[0.04]">
              <span className="text-[#9898A6]">Selected Business Sector:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.accentColor }} />
                <span>{ind.name}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0B10] border border-white/[0.04]">
              <span className="text-[#9898A6]">Assistant Personality:</span>
              <span className="font-bold text-[#C28AFF]">
                {assistantConfig.personality || "Helpful & Professional"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0B10] border border-white/[0.04]">
              <span className="text-[#9898A6]">Launcher Styling:</span>
              <span className="font-bold text-white capitalize">
                {assistantConfig.launcherShape || "squircle"} · {assistantConfig.launcherAnimation || "none"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0B10] border border-white/[0.04]">
              <span className="text-[#9898A6]">Attached Custom Documents:</span>
              <span className="font-bold text-white">
                {uploadedDocuments?.length || 0} files
              </span>
            </div>

            {businessDetails.websiteUrl && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0B10] border border-white/[0.04]">
                <span className="text-[#9898A6]">Automatic Web Crawler:</span>
                <span className="font-bold text-emerald-400">
                  Ready ({businessDetails.websiteUrl})
                </span>
              </div>
            )}
          </div>

          {/* Confirmation Action Button */}
          <div className="pt-4 flex items-center justify-between border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#9898A6] hover:text-white bg-[#0B0B10] hover:bg-[#14141E] border border-white/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={onConfirmCreate}
              className="inline-flex items-center gap-2 px-9 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] via-[#7B2CBF] to-[#55A9FF] hover:opacity-95 active:scale-[0.98] shadow-xl shadow-[#963DFF]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm & Create Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
