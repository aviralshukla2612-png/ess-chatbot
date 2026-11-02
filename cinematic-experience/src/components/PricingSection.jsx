import React, { useState } from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export default function PricingSection({ onOpenTrial }) {
  const [billingCycle, setBillingCycle] = useState("annual"); // annual | monthly

  const plans = [
    {
      name: "Starter",
      tagline: "For Growing Boutiques & Fast Starters",
      priceMonthly: 49,
      priceAnnual: 39,
      description:
        "Essential autonomous sales AI for single-brand websites qualifying daily inquiries.",
      popular: false,
      features: [
        "1 Autonomous Sales Assistant",
        "Up to 2,000 monthly conversations",
        "50 Knowledge Base documents or URLs",
        "19 launcher button animations",
        "Lead capture & email notifications",
        "Standard vector retrieval accuracy",
      ],
      ctaText: "Start Starter Trial",
    },
    {
      name: "Professional",
      tagline: "For Scaling Mid-Market Commercial Firms",
      priceMonthly: 149,
      priceAnnual: 119,
      description:
        "High-performance AI for multi-service businesses demanding priority speed and CRM automation.",
      popular: true,
      features: [
        "Up to 5 Autonomous Sales Assistants",
        "15,000 monthly conversations",
        "Unlimited Knowledge Base documents & URLs",
        "Live website crawler synchronization",
        "Real-time CRM webhook & Zapier sync",
        "Custom branding & white-label removal",
        "Sub-second edge streaming latency",
        "Dedicated account onboarding manager",
      ],
      ctaText: "Start Professional Trial",
    },
    {
      name: "Enterprise",
      tagline: "For Multi-Tenant Enterprises & Large Networks",
      priceMonthly: 499,
      priceAnnual: 399,
      description:
        "Complete enterprise deployment with tenant isolation, custom vector embeddings, and SLA guarantees.",
      popular: false,
      features: [
        "Unlimited Autonomous Sales Assistants",
        "Unlimited monthly conversations",
        "Isolated multi-tenant data governance",
        "Dedicated vector workspace & custom model tuning",
        "Multi-agent sub-admin permission hierarchy",
        "99.9% uptime enterprise SLA",
        "Custom contract, invoice & security audit",
        "24/7 priority VIP engineering channel",
      ],
      ctaText: "Contact Enterprise Sales",
    },
  ];

  return (
    <section id="pricing" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#050507] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#963DFF]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-white text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>Transparent Investment</span>
          </div>

          <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
            Predictable Pricing That Scales With <br />
            <span className="text-glow-purple text-gradient-purple-blue">
              Your Sales Pipeline
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
            Every plan includes our complete grounded retrieval engine, visual launcher designer, and 14-day free evaluation trial.
          </p>

          {/* Billing Toggle (Monthly vs Annual) */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#1E1E2A] text-white shadow-sm"
                  : "text-[#9898A6] hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "annual"
                  ? "bg-gradient-to-r from-[#963DFF] to-[#7928CA] text-white shadow-sm shadow-[#963DFF]/30"
                  : "text-[#9898A6] hover:text-white"
              }`}
            >
              <span>Annual (Save 20%)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                Special
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((pl, idx) => {
            const price = billingCycle === "annual" ? pl.priceAnnual : pl.priceMonthly;
            return (
              <div
                key={idx}
                className={`relative p-8 sm:p-10 rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                  pl.popular
                    ? "bg-[#12121A]/90 border-2 border-[#963DFF] shadow-[0_0_40px_rgba(150,61,255,0.35)] lg:-translate-y-2"
                    : "glass-panel glass-panel-hover"
                }`}
              >
                {pl.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="font-bold text-2xl text-white">{pl.name}</h3>
                    <p className="text-xs text-[#C28AFF] font-medium mt-1">{pl.tagline}</p>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-white/[0.08]">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs text-[#9898A6]">
                      / month {billingCycle === "annual" ? "billed annually" : ""}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed mb-6">
                    {pl.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {pl.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#D9D9E2]">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Button */}
                <button
                  type="button"
                  onClick={onOpenTrial}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    pl.popular
                      ? "btn-primary-gradient text-white shadow-lg"
                      : "btn-secondary-glass"
                  }`}
                >
                  <span>{pl.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

