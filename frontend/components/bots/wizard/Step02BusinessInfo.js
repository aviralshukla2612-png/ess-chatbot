"use client";

import React, { useState } from "react";
import {
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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function Step02BusinessInfo({
  businessDetails,
  onChangeBusinessDetails,
  onNext,
  onBack,
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!businessDetails.businessName?.trim()) {
      errs.businessName = "Business name is required.";
    }
    if (!businessDetails.description?.trim()) {
      errs.description = "Business description is required.";
    }
    if (!businessDetails.businessEmail?.trim()) {
      errs.businessEmail = "Contact email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessDetails.businessEmail.trim())) {
      errs.businessEmail = "Please enter a valid email address.";
    }
    if (!businessDetails.phoneNumber?.trim()) {
      errs.phoneNumber = "Phone or WhatsApp number is required.";
    }
    if (!businessDetails.businessAddress?.trim()) {
      errs.businessAddress = "Business physical address or city/state is required.";
    }
    if (!businessDetails.workingDaysHours?.trim()) {
      errs.workingDaysHours = "Operating days and hours are required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      onNext();
    }
  };

  const update = (field, val) => {
    onChangeBusinessDetails({
      ...businessDetails,
      [field]: val,
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#55A9FF]/10 border border-[#55A9FF]/30 text-[11px] font-bold text-[#55A9FF] uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>Step 02 · Common Identity</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Business Details & Operations
        </h2>
        <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed">
          Provide your core business information. This data forms the foundational profile that your autonomous assistant will rely on for identity, timings, and verified communication.
        </p>
      </div>

      {/* Form Fields Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-2xl space-y-6">
        {/* Row 1: Business Name + Tagline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span>
                Business / Company Name <span className="text-[#963DFF]">*</span>
              </span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Required</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessDetails.businessName || ""}
                onChange={(e) => update("businessName", e.target.value)}
                placeholder="e.g. Apex Dental & Healthcare"
                className={`w-full px-4 py-3 rounded-xl bg-[#0B0B10] border text-white placeholder-white/30 text-xs focus:outline-none transition-all ${
                  errors.businessName
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-white/10 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
                }`}
              />
            </div>
            {errors.businessName && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.businessName}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span>Short Tagline / Motto</span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Optional</span>
            </label>
            <input
              type="text"
              value={businessDetails.tagline || ""}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="e.g. Gentle Family Dentistry & Modern Smile Care"
              className="w-full px-4 py-3 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all"
            />
          </div>
        </div>

        {/* Business Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center justify-between">
            <span>
              About the Business <span className="text-[#963DFF]">*</span>
            </span>
            <span className="text-[10px] text-[#9898A6] font-normal font-mono">Required</span>
          </label>
          <textarea
            rows={3}
            value={businessDetails.description || ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what your business does, how long you've been operating, and what makes your services unique..."
            className={`w-full px-4 py-3 rounded-xl bg-[#0B0B10] border text-white placeholder-white/30 text-xs focus:outline-none transition-all resize-none ${
              errors.description
                ? "border-rose-500 ring-1 ring-rose-500"
                : "border-white/10 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
            }`}
          />
          {errors.description && (
            <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.description}</span>
            </p>
          )}
        </div>

        {/* Row 2: Website + Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#55A9FF]" />
                <span>Website URL</span>
              </span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Optional</span>
            </label>
            <input
              type="url"
              value={businessDetails.websiteUrl || ""}
              onChange={(e) => update("websiteUrl", e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C28AFF]" />
                <span>Business Email <span className="text-[#963DFF]">*</span></span>
              </span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Required</span>
            </label>
            <input
              type="email"
              value={businessDetails.businessEmail || ""}
              onChange={(e) => update("businessEmail", e.target.value)}
              placeholder="contact@business.com"
              className={`w-full px-4 py-3 rounded-xl bg-[#0B0B10] border text-white placeholder-white/30 text-xs focus:outline-none transition-all ${
                errors.businessEmail
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-white/10 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
              }`}
            />
            {errors.businessEmail && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.businessEmail}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00D98B]" />
                <span>Phone / WhatsApp <span className="text-[#963DFF]">*</span></span>
              </span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Required</span>
            </label>
            <input
              type="tel"
              value={businessDetails.phoneNumber || ""}
              onChange={(e) => update("phoneNumber", e.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full px-4 py-3 rounded-xl bg-[#0B0B10] border text-white placeholder-white/30 text-xs focus:outline-none transition-all ${
                errors.phoneNumber
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-white/10 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
              }`}
            />
            {errors.phoneNumber && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.phoneNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Address & Working Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Business Physical Address <span className="text-[#963DFF]">*</span></span>
              </span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Required</span>
            </label>
            <textarea
              rows={2}
              value={businessDetails.businessAddress || ""}
              onChange={(e) => update("businessAddress", e.target.value)}
              placeholder="e.g. 2nd Floor, City Center Mall, Near Metro Gate 4, Ahmedabad, Gujarat - 380009"
              className={`w-full px-4 py-3 rounded-xl bg-[#0B0B10] border text-white placeholder-white/30 text-xs focus:outline-none transition-all resize-none ${
                errors.businessAddress
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-white/10 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
              }`}
            />
            {errors.businessAddress && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.businessAddress}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Working Days & Hours <span className="text-[#963DFF]">*</span></span>
              </span>
              <span className="text-[10px] text-[#9898A6] font-normal font-mono">Required</span>
            </label>
            <textarea
              rows={2}
              value={businessDetails.workingDaysHours || ""}
              onChange={(e) => update("workingDaysHours", e.target.value)}
              placeholder="e.g. Monday to Saturday: 10:00 AM – 07:00 PM IST (Sundays Closed)"
              className={`w-full px-4 py-3 rounded-xl bg-[#0B0B10] border text-white placeholder-white/30 text-xs focus:outline-none transition-all resize-none ${
                errors.workingDaysHours
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-white/10 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
              }`}
            />
            {errors.workingDaysHours && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.workingDaysHours}</span>
              </p>
            )}
          </div>
        </div>

        {/* Core Products / Services Summary */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#C28AFF]" />
              <span>Main Products or Services Overview</span>
            </span>
            <span className="text-[10px] text-[#9898A6] font-normal font-mono">Optional</span>
          </label>
          <input
            type="text"
            value={businessDetails.mainOfferings || ""}
            onChange={(e) => update("mainOfferings", e.target.value)}
            placeholder="e.g. Root canal therapy, dental implants, teeth whitening, smile makeover"
            className="w-full px-4 py-3 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] transition-all"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#9898A6] hover:text-white bg-[#12121A] hover:bg-[#1A1A24] border border-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Industry</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] to-[#55A9FF] hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#963DFF]/25 transition-all cursor-pointer"
        >
          <span>Continue to Questionnaire</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

