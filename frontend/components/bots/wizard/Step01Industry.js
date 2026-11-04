"use client";

import React from "react";
import {
  Stethoscope,
  Building2,
  GraduationCap,
  UtensilsCrossed,
  Bed,
  Building,
  ShoppingBag,
  Briefcase,
  Sparkles,
  Check,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { INDUSTRIES } from "@/lib/wizard/industryTemplates";

const ICON_MAP = {
  Stethoscope,
  Building2,
  GraduationCap,
  UtensilsCrossed,
  Bed,
  Building,
  ShoppingBag,
  Briefcase,
  Sparkles,
};

export default function Step01Industry({
  selectedIndustry,
  onSelectIndustry,
  customIndustryDesc,
  onChangeCustomDesc,
  onNext,
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Step Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#963DFF]/10 border border-[#963DFF]/30 text-[11px] font-bold text-[#C28AFF] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 01 · Business Sector</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Select Your Business Industry
        </h2>
        <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed">
          Choose the industry that best matches your organization. Emperor Nexus will automatically tailor intelligent questions, verified workflows, and autonomous assistant behaviors.
        </p>
      </div>

      {/* 9 Industry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map((ind) => {
          const Icon = ICON_MAP[ind.iconName] || Sparkles;
          const isSelected = selectedIndustry === ind.id;

          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => onSelectIndustry(ind.id)}
              className={`group relative text-left p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
                isSelected
                  ? "bg-[#161622] border-[#963DFF] shadow-[0_0_30px_rgba(150,61,255,0.25)] ring-1 ring-[#963DFF]"
                  : "bg-[#12121A] hover:bg-[#151520] border-white/[0.08] hover:border-white/20 shadow-sm"
              }`}
            >
              {/* Card Header: Icon + Badge + Check */}
              <div className="flex items-start justify-between w-full mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `${ind.accentColor}18`,
                    border: `1px solid ${ind.accentColor}40`,
                    color: ind.accentColor,
                  }}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${ind.accentColor}15`,
                      color: ind.accentColor,
                    }}
                  >
                    {ind.badge}
                  </span>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#963DFF] text-white shadow-md shadow-[#963DFF]/40"
                        : "border border-white/20 text-transparent group-hover:border-white/40"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 mb-2">
                <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                  <span>{ind.name}</span>
                </h3>
                <p className="text-xs text-[#9898A6] leading-relaxed line-clamp-2">
                  {ind.description}
                </p>
              </div>

              {/* Bottom State Cue */}
              <div className="pt-3 mt-auto border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className={isSelected ? "text-[#C28AFF] font-bold" : "text-[#9898A6]"}>
                  {isSelected ? "Selected Sector" : "Click to select"}
                </span>
                <span
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: ind.accentColor }}
                >
                  →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* If "Other" is selected, ask for custom description */}
      {selectedIndustry === "other" && (
        <div className="p-6 rounded-2xl bg-[#12121A] border border-[#963DFF]/40 shadow-lg space-y-3 animate-fade-in max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C28AFF] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Tell Us About Your Specific Business</span>
          </div>
          <p className="text-xs text-[#9898A6]">
            Since you selected <strong>Other</strong>, please describe your business model, products, and services so we can tailor the questionnaire accordingly.
          </p>
          <textarea
            value={customIndustryDesc || ""}
            onChange={(e) => onChangeCustomDesc(e.target.value)}
            rows={3}
            placeholder="e.g. We are an artisanal leather goods manufacturing workshop offering bespoke corporate gifts and customized personal accessories..."
            className="w-full px-4 py-3 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all resize-none"
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="pt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedIndustry}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] to-[#55A9FF] hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#963DFF]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Business Info</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

