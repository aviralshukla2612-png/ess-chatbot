"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileText,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  UtensilsCrossed,
  Bed,
  Building,
  ShoppingBag,
} from "lucide-react";
import { INDUSTRIES, getIndustryQuestions } from "@/lib/wizard/industryTemplates";

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

export default function Step04Review({
  industry,
  businessDetails,
  questionnaireAnswers,
  uploadedDocuments,
  onEditStep,
  onNext,
  onBack,
}) {
  const [confirmed, setConfirmed] = useState(true);
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[0];
  const Icon = ICON_MAP[ind.iconName] || Sparkles;
  const questions = getIndustryQuestions(industry);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D98B]/10 border border-[#00D98B]/30 text-[11px] font-bold text-[#00D98B] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Step 04 · Verification</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Review Your Business Knowledge
        </h2>
        <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed">
          Verify your business information before proceeding to assistant configuration. Your assistant will answer customer questions strictly based on this approved knowledge.
        </p>
      </div>

      <div className="space-y-5">
        {/* Section 1: Industry Selection */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#12121A] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${ind.accentColor}18`,
                border: `1px solid ${ind.accentColor}40`,
                color: ind.accentColor,
              }}
            >
              <Icon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{ind.name}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${ind.accentColor}15`,
                    color: ind.accentColor,
                  }}
                >
                  {ind.badge}
                </span>
              </div>
              <p className="text-xs text-[#9898A6] mt-0.5">{ind.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>Change</span>
          </button>
        </div>

        {/* Section 2: Core Business Information */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#55A9FF]" />
              <span>Business Information</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="inline-flex items-center gap-1.5 text-xs text-[#C28AFF] hover:underline font-semibold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#9898A6] block text-[11px]">Business Name</span>
              <span className="font-bold text-white text-sm">{businessDetails.businessName || "—"}</span>
            </div>

            {businessDetails.tagline && (
              <div>
                <span className="text-[#9898A6] block text-[11px]">Tagline</span>
                <span className="text-white">{businessDetails.tagline}</span>
              </div>
            )}

            <div>
              <span className="text-[#9898A6] block text-[11px]">Contact Email</span>
              <span className="text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C28AFF]" />
                <span>{businessDetails.businessEmail || "—"}</span>
              </span>
            </div>

            <div>
              <span className="text-[#9898A6] block text-[11px]">Phone / WhatsApp</span>
              <span className="text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00D98B]" />
                <span>{businessDetails.phoneNumber || "—"}</span>
              </span>
            </div>

            {businessDetails.websiteUrl && (
              <div>
                <span className="text-[#9898A6] block text-[11px]">Official Website</span>
                <span className="text-[#55A9FF] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{businessDetails.websiteUrl}</span>
                </span>
              </div>
            )}

            <div>
              <span className="text-[#9898A6] block text-[11px]">Physical Address</span>
              <span className="text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{businessDetails.businessAddress || "—"}</span>
              </span>
            </div>
          </div>

          {businessDetails.description && (
            <div className="pt-2 border-t border-white/[0.06] text-xs">
              <span className="text-[#9898A6] block text-[11px] mb-1">About the Business</span>
              <p className="text-white/90 leading-relaxed bg-[#0B0B10] p-3 rounded-xl border border-white/[0.04]">
                {businessDetails.description}
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Working Hours & Schedule */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Working Days & Hours</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="inline-flex items-center gap-1.5 text-xs text-[#C28AFF] hover:underline font-semibold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
          <p className="text-xs text-white bg-[#0B0B10] p-3 rounded-xl border border-white/[0.04] leading-relaxed">
            {businessDetails.workingDaysHours || "Standard business hours."}
          </p>
        </div>

        {/* Section 4: Industry-Specific Details & Catalog */}
        <div className="p-6 rounded-2xl bg-[#12121A] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-[#C28AFF]" />
              <span>Industry-Specific Details</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="inline-flex items-center gap-1.5 text-xs text-[#C28AFF] hover:underline font-semibold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Questionnaire</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q) => {
              const val = questionnaireAnswers[q.id];
              if (!val || (Array.isArray(val) && val.length === 0)) return null;

              return (
                <div key={q.id} className="p-3.5 rounded-xl bg-[#0B0B10] border border-white/[0.04] space-y-2">
                  <span className="text-[11px] font-bold text-[#C28AFF] font-mono block">
                    {q.label}
                  </span>

                  {/* Multiselect chips */}
                  {Array.isArray(val) && typeof val[0] === "string" && (
                    <div className="flex flex-wrap gap-1.5">
                      {val.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-[#161622] border border-[#963DFF]/30 text-white text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Repeater items table/cards */}
                  {Array.isArray(val) && typeof val[0] === "object" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {val.map((item, itemIdx) => (
                        <div key={itemIdx} className="p-3 rounded-lg bg-[#141420] border border-white/[0.06] text-[11px] space-y-1">
                          <span className="text-[#C28AFF] font-bold block">
                            {q.itemTitle || "Item"} #{itemIdx + 1}
                          </span>
                          {Object.entries(item).map(([k, v]) => {
                            if (!v) return null;
                            const label = q.fields?.find((f) => f.key === k)?.label || k;
                            return (
                              <div key={k} className="flex items-center justify-between gap-2">
                                <span className="text-[#9898A6]">{label}:</span>
                                <span className="text-white font-medium text-right">{v}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text value */}
                  {typeof val === "string" && (
                    <p className="text-xs text-white/90 whitespace-pre-line leading-relaxed">
                      {val}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Attached Documents (if any) */}
        {uploadedDocuments && uploadedDocuments.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#12121A] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#55A9FF]" />
                <span>Attached Knowledge Documents ({uploadedDocuments.length})</span>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(3)}
                className="inline-flex items-center gap-1.5 text-xs text-[#C28AFF] hover:underline font-semibold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {uploadedDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0B10] border border-white/[0.04] text-xs text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-[#55A9FF] shrink-0" />
                  <span className="truncate">{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accuracy Confirmation Checkbox */}
        <div className="p-5 rounded-2xl bg-[#161624] border border-[#963DFF]/40 flex items-start gap-3">
          <input
            type="checkbox"
            id="confirmKnowledge"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-white/20 text-[#963DFF] focus:ring-[#963DFF] cursor-pointer"
          />
          <label htmlFor="confirmKnowledge" className="text-xs text-white/90 leading-relaxed cursor-pointer select-none">
            <strong>Approved Business Information Confirmation:</strong> I confirm that the details provided above represent accurate business information. The AI assistant will adhere strictly to these verified facts and policies.
          </label>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#9898A6] hover:text-white bg-[#12121A] hover:bg-[#1A1A24] border border-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Questionnaire</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!confirmed}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] to-[#55A9FF] hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#963DFF]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Assistant Config</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
