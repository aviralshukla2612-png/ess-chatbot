import React from "react";
import {
  FileText,
  Sliders,
  Code2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HowItWorksSection({ onOpenTrial }) {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Connect Your Knowledge Base",
      tagline: "Instant Document & Web Crawler Ingestion",
      description:
        "Upload brochures, pricing schedules, FAQs, technical manuals, or simply enter your website URL. Emperor Nexus automatically splits, vectors, and indexes your proprietary knowledge.",
      highlight: "Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.",
    },
    {
      number: "02",
      icon: Sliders,
      title: "Calibrate Persona & Launcher Styling",
      tagline: "Executive Tone & Motion Customizer",
      description:
        "Select your assistant's personality (Corporate, Consultative, Warm), set custom welcome greetings, pick brand colors, and choose from 19 attention-grabbing button animations.",
      highlight: "Custom logo upload, squircle / circle / pill buttons, and 19 launcher animations.",
    },
    {
      number: "03",
      icon: Code2,
      title: "Deploy with a Single Line of Code",
      tagline: "Instant Embed on Any Website",
      description:
        "Paste a lightweight single-line script before the closing body tag of your website. Emperor Nexus immediately goes live on WordPress, Shopify, Webflow, Next.js, or custom HTML.",
      highlight: "Zero dependencies, anti-cache instant updates, and mobile-optimized viewport.",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#0B0B10] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#963DFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#55A9FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 nexus-grid-overlay opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast Three-Step Setup</span>
          </div>

          <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
            From Raw Documents To <br />
            <span className="text-glow-purple text-gradient-purple-blue">
              Autonomous Sales In 5 Minutes
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
            No machine learning engineers, vector database setups, or prompt writing required.
            Your AI sales assistant trains itself on your materials automatically.
          </p>
        </div>

        {/* 3 Step Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="group relative p-8 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden"
              >
                {/* Large Translucent Step Number Watermark */}
                <span className="absolute top-4 right-6 font-headline text-7xl font-bold text-white/[0.04] group-hover:text-[#963DFF]/15 transition-colors select-none">
                  {st.number}
                </span>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] group-hover:border-[#963DFF]/40 group-hover:bg-[#963DFF]/20 flex items-center justify-center transition-all duration-300 shadow-sm mb-6">
                    <Icon className="w-7 h-7 text-[#D9D9E2] group-hover:text-[#C28AFF] transition-colors" />
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C28AFF] block mb-2">
                    {st.tagline}
                  </span>

                  <h3 className="font-bold text-2xl text-white group-hover:text-[#F5F5F7] transition-colors">
                    {st.title}
                  </h3>

                  <p className="mt-4 text-xs sm:text-sm text-[#9898A6] leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.06]">
                  <div className="flex items-start gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{st.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={onOpenTrial}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm sm:text-base text-white btn-primary-gradient cursor-pointer shadow-[0_0_30px_rgba(150,61,255,0.4)] hover:shadow-[0_0_40px_rgba(150,61,255,0.6)]"
          >
            <span>Launch Your Autonomous Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
