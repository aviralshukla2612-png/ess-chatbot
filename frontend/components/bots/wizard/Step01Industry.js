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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="space-y-1.5 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[11px] font-semibold text-[var(--accent-text)] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 01 · Industry Template</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Select Your Business Industry
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          Choose the sector that best fits your business to pre-configure domain questions, workflows, and assistant behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map((ind, idx) => {
          const Icon = ICON_MAP[ind.iconName] || Sparkles;
          const isSelected = selectedIndustry === ind.id;
          const numberStr = String(idx + 1).padStart(2, "0");

          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => onSelectIndustry(ind.id)}
              className={`group relative text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[var(--bg-surface)] border-[var(--accent-primary)] ring-2 ring-[var(--focus-ring)] shadow-[var(--shadow-md)]"
                  : "bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]/40 border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-[var(--shadow-xs)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-[var(--bg-subtle)] text-[var(--accent-primary)] border-[var(--border-subtle)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-[var(--text-muted)]">
                    {numberStr}
                  </span>
                </div>

                <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] tracking-tight">
                  {ind.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1.5 line-clamp-3">
                  {ind.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}>
                  {isSelected ? "Selected" : "Select sector"}
                </span>
                {isSelected ? (
                  <Check className="w-4 h-4 text-[var(--accent-primary)]" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedIndustry === "other" && (
        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-2.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]">
            <Sparkles className="w-4 h-4" />
            <span>Describe Your Business Sector</span>
          </div>
          <textarea
            value={customIndustryDesc || ""}
            onChange={(e) => onChangeCustomDesc(e.target.value)}
            rows={3}
            placeholder="Describe your products, target audience, and typical customer questions..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
          />
        </div>
      )}

      <div className="pt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedIndustry}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <span>Continue to Business Info</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
