"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, y: 0 });
        });
        return;
      }

      // Smooth card entrance on scroll
      gsap.fromTo(
        cardRefs.current.filter(Boolean),
        {
          opacity: 0,
          y: 35,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="relative w-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] py-20 sm:py-28 px-4 sm:px-8 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col justify-center">
        {/* Title Block with High Contrast Dark Typography */}
        <div className="title-block flex flex-col items-center mb-10 sm:mb-14 text-center shrink-0 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.06] border border-black/[0.1] text-xs font-mono font-bold uppercase tracking-widest text-[#2A2A32] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Autonomous Enterprise Advantages</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[2.85rem] font-black tracking-tight text-[#0B0B10] uppercase max-w-4xl mx-auto leading-tight drop-shadow-sm">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-3.5 text-xs sm:text-sm text-[#1F2937] font-semibold max-w-xl mx-auto leading-relaxed">
            Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
          </p>
        </div>

        {/* COLORFUL 3-CARD COMPOSITION */}
        <div className="key-card-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 items-stretch w-full max-w-6xl mx-auto">
          {/* ======================================================= */}
          {/* CARD 01 · DARK (EMERALD CYBERNETIC NEON GLOW)           */}
          {/* ======================================================= */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#071F17] via-[#091512] to-[#050B08] text-white p-6 sm:p-7 flex flex-col justify-between shadow-[0_15px_40px_rgba(16,185,129,0.22)] border-2 border-emerald-500/40 hover:border-emerald-400 overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Emerald Orb */}
            <div className="absolute -top-16 -left-16 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Card 01 · Dark
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live 24/7
                </span>
              </div>

              {/* Heading & Subtitle */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-3 uppercase">
                24/7 AI ASSISTANCE
              </h3>
              <p className="text-xs text-[#D1D5DB] mt-2 leading-relaxed font-normal">
                Let customers get answers to their questions anytime, even outside business hours.
              </p>
            </div>

            {/* Interactive Chat Preview */}
            <div className="relative z-10 my-4 py-2 bg-[#03110C]/80 rounded-xl p-3 border border-emerald-500/20 space-y-1.5 shadow-inner">
              <div className="bg-white/[0.08] text-white/90 rounded-lg p-2 text-[10px] leading-snug max-w-[92%] ml-auto">
                Can I schedule an executive consultation for tomorrow?
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-white rounded-lg p-2 text-[10px] leading-snug max-w-[95%]">
                Absolutely! Reserved 3:00 PM tomorrow with our senior specialist.
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                ALWAYS AVAILABLE
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>

          {/* ======================================================= */}
          {/* CARD 02 · LIGHT (LILAC / LAVENDER WITH DEEP PURPLE TEXT)*/}
          {/* ======================================================= */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#EDE4FF] via-[#E2D4FF] to-[#D5C2FF] p-6 sm:p-7 flex flex-col justify-between shadow-[0_15px_40px_rgba(150,61,255,0.22)] border-2 border-[#963DFF]/40 hover:border-[#963DFF] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Purple Bloom */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#963DFF]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#963DFF]/20 text-[#150524] border border-[#963DFF]/40">
                  Card 02 · Light
                </span>
                <span className="text-[11px] font-bold text-[#150524]">
                  AI Assistant
                </span>
              </div>

              {/* Heading & Subtitle in Deep High-Contrast Colors */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#150524] tracking-tight mt-3 uppercase">
                LESS MANUAL WORK
              </h3>
              <p className="text-xs text-[#2A1638] mt-2 leading-relaxed font-semibold">
                Reduce repetitive customer interactions and give your team more time for important work.
              </p>
            </div>

            {/* Central Metric Ring */}
            <div className="relative z-10 my-4 flex flex-col items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-[0_8px_25px_rgba(150,61,255,0.25)] border-2 border-white flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <span className="font-headline font-black text-2xl sm:text-3xl text-[#150524] tracking-tight">
                  1.5K<span className="text-[#963DFF]">+</span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase text-[#4A2868] mt-0.5">
                  Automated
                </span>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-3 border-t border-[#963DFF]/25 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#150524] uppercase">
                AUTOMATED QUERY RESOLUTION
              </span>
              <Sparkles className="w-4 h-4 text-[#963DFF] shrink-0" />
            </div>
          </div>

          {/* ======================================================= */}
          {/* CARD 03 · DARK (SAPPHIRE NEON HIGH-TECH GLOW)           */}
          {/* ======================================================= */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#061324] via-[#091629] to-[#040C18] text-white p-6 sm:p-7 flex flex-col justify-between shadow-[0_15px_40px_rgba(59,130,246,0.22)] border-2 border-blue-500/40 hover:border-blue-400 overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Sapphire Orb */}
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Card 03 · Dark
                </span>
                <span className="text-[11px] font-bold text-blue-400">
                  Enquiries
                </span>
              </div>

              {/* Heading & Subtitle */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-3 uppercase">
                LEAD VISIBILITY
              </h3>
              <p className="text-xs text-[#D1D5DB] mt-2 leading-relaxed font-normal">
                See customer conversations and enquiries generated through your website assistant.
              </p>
            </div>

            {/* Pipeline Rows Preview */}
            <div className="relative z-10 my-4 py-2 bg-[#020B14]/80 rounded-xl p-3 border border-blue-500/20 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-white/[0.06]">
                <span className="font-mono text-neutral-400">Lead Pipeline</span>
                <span className="text-blue-400 font-bold">98% Match</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-white truncate max-w-[140px]">
                  Commercial Rollout
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
                  HOT LEAD
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-neutral-300 truncate max-w-[140px]">
                  Elena Rostova
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold border border-purple-500/30">
                  QUALIFIED
                </span>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-3 border-t border-blue-500/20 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                CONVERSATIONS & ENQUIRIES
              </span>
              <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
