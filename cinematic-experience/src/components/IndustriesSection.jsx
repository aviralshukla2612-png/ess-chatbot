import React from "react";
import {
  Building2,
  PlusSquare,
  GraduationCap,
  BedDouble,
  ShoppingBag,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function IndustriesSection({ onOpenExperience }) {
  const industries = [
    {
      id: "real-estate",
      title: "Real Estate & Developers",
      tagline: "High-Ticket Property Discovery",
      icon: Building2,
      description:
        "Guide buyers through unit dimensions, floor plans, payment schedules, and view orientations while pre-qualifying purchasing budgets.",
      questionExample: "What are the floor plans for the 3BHK penthouse with sunset view?",
      metrics: "3.4x Faster Viewing Bookings",
    },
    {
      id: "healthcare",
      title: "Healthcare & Clinics",
      tagline: "Clinical Intake & Navigation",
      icon: PlusSquare,
      description:
        "Instantly answer questions about clinical treatments, insurance eligibility, specialist qualifications, and schedule outpatient consultations.",
      questionExample: "Do you accept international insurance for cardiology consultation?",
      metrics: "88% Reduction in Support Wait Times",
    },
    {
      id: "education",
      title: "Education & Universities",
      tagline: "Admissions & Counseling",
      icon: GraduationCap,
      description:
        "Direct prospective students to course curricula, application deadlines, tuition requirements, and scholarship eligibility criteria.",
      questionExample: "What are the prerequisites and deadlines for the Executive MBA?",
      metrics: "62% Increase in Completed Applications",
    },
    {
      id: "hospitality",
      title: "Hospitality & Resorts",
      tagline: "VIP Concierge & Booking",
      icon: BedDouble,
      description:
        "Upsell suite upgrades, explain resort amenities, coordinate dining reservations, and automate late checkout inquiries 24 hours a day.",
      questionExample: "Can we book an overwater villa with private jacuzzi and late checkout?",
      metrics: "2.1x Boost in Direct Booking Value",
    },
    {
      id: "retail",
      title: "Luxury Retail & E-Commerce",
      tagline: "High-Value Sales Conversion",
      icon: ShoppingBag,
      description:
        "Act as an expert boutique stylist that advises on sizing, material provenance, return guarantees, and expedites high-value checkout.",
      questionExample: "Is this chronograph certified and covered by international warranty?",
      metrics: "41% Higher Average Order Volume",
    },
    {
      id: "and-more",
      title: "B2B SaaS & Financial Services",
      tagline: "Enterprise Lead Discovery",
      icon: Layers,
      description:
        "Equip complex software and wealth advisory firms with assistants that answer security compliance, pricing tiers, and API capabilities.",
      questionExample: "What are your SOC 2 compliance certifications and enterprise SLA terms?",
      metrics: "5.2x Pipeline Acceleration",
    },
  ];

  return (
    <section id="industries" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#0B0B10] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#963DFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-[#55A9FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 nexus-grid-overlay opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versatile Commercial Intelligence</span>
          </div>

          <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
            Tailored For The Specifics Of <br />
            <span className="text-glow-purple text-gradient-purple-blue">
              Your Business Model
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
            Every vertical has unique buyer journeys, terminology, and qualification gates.
            Emperor Nexus adapts instantly to your domain knowledge.
          </p>
        </div>

        {/* 6 Industry Architectural Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.id}
                className="group relative p-7 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden cursor-pointer"
                onClick={() => onOpenExperience(ind.id)}
              >
                {/* Subtle card top gradient glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#963DFF]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  {/* Icon & Category Tagline */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] group-hover:border-[#963DFF]/40 group-hover:bg-[#963DFF]/15 flex items-center justify-center transition-all duration-300 shadow-sm">
                      <Icon className="w-6 h-6 text-[#D9D9E2] group-hover:text-[#C28AFF] transition-colors" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C28AFF] px-2.5 py-1 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/25">
                      {ind.tagline}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-white group-hover:text-[#F5F5F7] transition-colors">
                    {ind.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-[#9898A6] leading-relaxed">
                    {ind.description}
                  </p>

                  {/* Customer Question Sample Box */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#9898A6] tracking-wider block">
                      Common Question Handled:
                    </span>
                    <p className="text-xs text-[#D9D9E2] italic font-medium">
                      "{ind.questionExample}"
                    </p>
                  </div>
                </div>

                {/* Bottom Metric & Action */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    {ind.metrics}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#C28AFF] group-hover:translate-x-1 transition-transform">
                    <span>Try Assistant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
