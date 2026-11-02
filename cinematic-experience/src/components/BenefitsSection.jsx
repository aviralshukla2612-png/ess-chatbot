import React from "react";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Lock,
  CheckCircle2,
  Cpu,
  ArrowRight,
} from "lucide-react";

export default function BenefitsSection({ onOpenTrial }) {
  const benefits = [
    {
      icon: Zap,
      title: "24/7 Sub-Second Response Latency",
      badge: "Real-Time Speed",
      description:
        "Never leave a prospective buyer waiting. Emperor Nexus delivers verified, contextual answers in under 600 milliseconds, turning nighttime traffic into booked appointments.",
      points: [
        "Instant concurrent multi-visitor handling",
        "Zero queue bottlenecks during peak campaigns",
        "Optimized global edge streaming deployment",
      ],
      gradient: "from-[#963DFF]/20 via-[#5318A8]/10 to-transparent",
      accentColor: "#C28AFF",
    },
    {
      icon: Cpu,
      title: "Grounded Vector Precision (0% Hallucination)",
      badge: "Strict Citation Retrieval",
      description:
        "Every response is strictly anchored to your uploaded PDFs, contracts, pricing sheets, and website URLs. If the answer is not in your knowledge base, the bot escalates safely without inventing details.",
      points: [
        "Multi-chunk vector similarity matching",
        "Deterministic guardrails against rogue prompt injection",
        "Strict compliance with corporate discounting rules",
      ],
      gradient: "from-[#55A9FF]/20 via-[#1853A8]/10 to-transparent",
      accentColor: "#55A9FF",
    },
    {
      icon: TrendingUp,
      title: "Automated High-Intent CRM Lead Pipeline",
      badge: "Revenue Acceleration",
      description:
        "Identify high-intent visitors through natural conversational cues. The assistant automatically captures contact details, budget ranges, and project scopes, pushing them straight into your sales CRM.",
      points: [
        "BANT (Budget, Authority, Need, Timeline) scoring",
        "Instant webhook dispatch to HubSpot, Salesforce, & Zapier",
        "Real-time SMS & email hot-lead notification alerts",
      ],
      gradient: "from-[#963DFF]/20 via-[#55A9FF]/10 to-transparent",
      accentColor: "#C28AFF",
    },
    {
      icon: Lock,
      title: "Enterprise Multi-Tenant Security & Governance",
      badge: "Bank-Grade Privacy",
      description:
        "Designed for regulated enterprises. Complete tenant workspace isolation ensures proprietary manuals, client records, and documents never cross organization boundaries.",
      points: [
        "End-to-end encrypted document storage",
        "Granular role-based sub-admin & admin controls",
        "Complete GDPR, SOC 2, and CCPA audit compliance",
      ],
      gradient: "from-[#55A9FF]/20 via-[#5318A8]/10 to-transparent",
      accentColor: "#55A9FF",
    },
  ];

  return (
    <section id="benefits" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#050507] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#963DFF]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-white text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#55A9FF]" />
            <span>Architecture & Performance</span>
          </div>

          <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
            Engineered For Precision, <br />
            <span className="text-glow-purple text-gradient-purple-blue">
              Security & High Conversion
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
            Unlike generic AI chat wrappers, Emperor Nexus combines enterprise vector retrieval,
            customizable sales personas, and real-time lead qualification workflows.
          </p>
        </div>

        {/* 4 Pillars Grid (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="group relative p-8 sm:p-10 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden"
              >
                {/* Ambient glow in card background */}
                <div
                  className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${b.gradient} rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center group-hover:border-[#963DFF]/50 group-hover:bg-[#963DFF]/20 transition-all duration-300 shadow-md">
                      <Icon className="w-7 h-7 text-[#D9D9E2] group-hover:text-white transition-colors" />
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border"
                      style={{
                        color: b.accentColor,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      {b.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-2xl text-white group-hover:text-[#F5F5F7] transition-colors">
                    {b.title}
                  </h3>

                  <p className="mt-4 text-sm text-[#9898A6] leading-relaxed">
                    {b.description}
                  </p>

                  {/* Bullet Points */}
                  <div className="mt-6 space-y-2.5">
                    {b.points.map((pt, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-[#D9D9E2]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-[#9898A6] font-medium">Enterprise Guaranteed SLA</span>
                  <button
                    type="button"
                    onClick={onOpenTrial}
                    className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#C28AFF] transition-colors cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
