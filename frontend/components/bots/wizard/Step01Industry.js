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
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
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

      {/* 9 Industry Cards Grid (Shutterstock-inspired Layout: 01 watermark, top bar, centered icon, title, description, bottom accent button) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {INDUSTRIES.map((ind, idx) => {
          const Icon = ICON_MAP[ind.iconName] || Sparkles;
          const isSelected = selectedIndustry === ind.id;
          const numberStr = String(idx + 1).padStart(2, "0");

          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => onSelectIndustry(ind.id)}
              className={`group relative text-left p-6 sm:p-7 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? "bg-[#0E0E18] border-2 shadow-[0_16px_50px_rgba(0,0,0,0.9)] scale-[1.01]"
                  : "bg-[#0B0B12] hover:bg-[#10101A] border border-white/10 hover:border-white/20 shadow-lg hover:-translate-y-1"
              }`}
              style={{
                borderColor: isSelected ? ind.accentColor : undefined,
                boxShadow: isSelected
                  ? `0 0 35px ${ind.accentColor}35, 0 16px 50px rgba(0,0,0,0.9)`
                  : undefined,
              }}
            >
              {/* Top Row: Left Watermark Number + Right Colored Accent Bar */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white/20 group-hover:text-white/35 transition-colors select-none">
                  {numberStr}
                </span>

                <div
                  className="w-12 sm:w-14 h-2 rounded-full transition-transform duration-300 group-hover:scale-x-110 shadow-xs"
                  style={{ backgroundColor: ind.accentColor }}
                />
              </div>

              {/* Upper Center: Prominent Line-Art Outline Icon */}
              <div className="my-4 sm:my-5 flex justify-center w-full">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isSelected ? "scale-110 shadow-lg" : "group-hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: `${ind.accentColor}15`,
                    border: `1.5px solid ${ind.accentColor}50`,
                    color: ind.accentColor,
                    boxShadow: isSelected ? `0 0 25px ${ind.accentColor}40` : undefined,
                  }}
                >
                  <Icon className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.8]" />
                </div>
              </div>

              {/* Middle: Centered Heading & Structured Description */}
              <div className="text-center space-y-2 mb-6 flex-1 flex flex-col justify-center">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight group-hover:text-white">
                  {ind.name}
                </h3>
                <p className="text-xs text-[#9898A6] leading-relaxed line-clamp-3 px-1">
                  {ind.description}
                </p>
              </div>

              {/* Bottom: Solid Colored Button Matching the Top Accent Bar */}
              <div className="w-full pt-2 mt-auto">
                <div
                  className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                    isSelected
                      ? "text-white shadow-lg"
                      : "text-white/90 group-hover:brightness-110"
                  }`}
                  style={{
                    backgroundColor: ind.accentColor,
                    boxShadow: isSelected
                      ? `0 4px 20px ${ind.accentColor}60`
                      : `0 2px 10px ${ind.accentColor}25`,
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Selected Sector</span>
                    </>
                  ) : (
                    <>
                      <span>Select Industry</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* If "Other" is selected, ask for custom description */}
      {selectedIndustry === "other" && (
        <div className="p-6 rounded-2xl bg-[#0B0B14] border border-[#963DFF]/40 shadow-lg space-y-3 animate-fade-in max-w-2xl mx-auto">
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
            className="w-full px-4 py-3 rounded-xl bg-[#06060A] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all resize-none shadow-inner"
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
