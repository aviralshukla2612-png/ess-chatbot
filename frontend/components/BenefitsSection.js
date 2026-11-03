"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STRIPES_COUNT = 5;

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const lightSceneRef = useRef(null);
  const stripeRefs = useRef([]);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 768;

      if (prefersReducedMotion) {
        stripeRefs.current.forEach((el) => {
          if (el) gsap.set(el, { scaleY: 1 });
        });
        if (lightSceneRef.current) gsap.set(lightSceneRef.current, { opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { rotateX: 0, autoAlpha: 1 });
        });
        return;
      }

      // 1. Initial State: Stripes start at scaleY(0) with transformOrigin: bottom
      stripeRefs.current.forEach((stripe) => {
        if (stripe) {
          gsap.set(stripe, {
            scaleY: 0,
            transformOrigin: "bottom",
            willChange: "transform",
          });
        }
      });

      // 2. Initial State: Light scene ready, cards folded up at ceiling
      gsap.set(lightSceneRef.current, { opacity: 1 });
      cardRefs.current.forEach((card) => {
        if (card) {
          gsap.set(card, {
            autoAlpha: 0,
            rotateX: isDesktop ? -92 : 0,
            y: isDesktop ? 0 : 35,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      // ============================================================
      // DIRECT STRIPES + CARD DROP TIMELINE
      // 0.00 -> 0.35: 5 horizontal stripes expand vertically (bottom -> up)
      // 0.35 -> 0.75: 3 Colorful Cards swing DOWN from ceiling into view!
      // 0.75 -> 1.00: Cards remain stable and interactive
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1300",
          pin: stage,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Trionn's stripe animation formula:
      for (let i = 0; i < STRIPES_COUNT; i++) {
        const s = (0.22 * (STRIPES_COUNT - 1 - i)) / (STRIPES_COUNT - 1);
        const a = s + 0.24;
        const el = stripeRefs.current[i];
        if (el) {
          tl.to(
            el,
            {
              scaleY: 1,
              duration: a - s,
              ease: "none",
            },
            s
          );
        }
      }

      // 3 Cards drop DOWN from ceiling right into view
      if (isDesktop) {
        tl.to(
          cardRefs.current,
          {
            rotateX: 0,
            autoAlpha: 1,
            stagger: 0.08,
            ease: "power2.out",
            force3D: true,
            duration: 0.35,
          },
          0.32
        );
      } else {
        tl.to(
          cardRefs.current,
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.06,
            ease: "power2.out",
            duration: 0.30,
          },
          0.32
        );
      }

      // Settle and hold steady through end of scroll
      tl.to({}, { duration: 0.15 }, 0.80);
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div id="benefits" ref={containerRef} className="relative w-full bg-[#050507]">
      {/* PINNED STAGE VIEWPORT (Centered, perfectly framed below navbar) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#050507]"
      >
        {/* ========================================================================= */}
        {/* 5 HORIZONTAL STRIPES (Exact Trionn Math, expands vertically)              */}
        {/* ========================================================================= */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-20">
          {Array.from({ length: STRIPES_COUNT }).map((_, idx) => (
            <div
              key={idx}
              ref={(el) => (stripeRefs.current[idx] = el)}
              className="stripe-item flex-1 w-full h-full"
              style={{
                backgroundColor: "#D2D2D2",
                willChange: "transform",
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                marginTop: idx > 0 ? "-1px" : undefined,
                paddingBottom: "1px",
              }}
            />
          ))}
        </div>

        {/* ========================================================================= */}
        {/* REVEALED LIGHT SCENE (Exact User Requested Data & Colorful Cards)         */}
        {/* ========================================================================= */}
        <div
          ref={lightSceneRef}
          className="absolute inset-0 w-full h-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] text-[#0B0B10] flex flex-col justify-between pt-24 pb-8 sm:pt-28 sm:pb-10 px-4 sm:px-8 z-10 select-none overflow-hidden"
        >
          <div className="max-w-7xl mx-auto w-full my-auto flex flex-col justify-center">
            {/* Title Block with Exact User Requested Title */}
            <div className="title-block flex flex-col items-center mb-5 sm:mb-6 text-center shrink-0 px-4">
              <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-[#0B0B10] uppercase max-w-4xl mx-auto leading-tight">
                Don&apos;t Let Valuable Conversations Slip Away.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#0B0B10]/75 max-w-xl mx-auto leading-relaxed">
                Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
              </p>
            </div>

            {/* COLORFUL 3-CARD COMPOSITION (Exact User Data & Proportions) */}
            <div
              className="key-card-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto"
              style={{ perspective: "1400px" }}
            >
              {/* ======================================================= */}
              {/* CARD 01 · DARK (EMERALD CYBERNETIC NEON GLOW)           */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[0] = el)}
                className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#071F17] via-[#091512] to-[#050B08] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_40px_rgba(16,185,129,0.22)] border-2 border-emerald-500/40 hover:border-emerald-400 overflow-hidden h-[335px] sm:h-[350px] lg:h-[365px] xl:h-[380px] will-change-transform transition-all duration-300"
              >
                {/* Ambient Emerald Orb */}
                <div className="absolute -top-16 -left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

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
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-2.5 uppercase">
                    24/7 AI ASSISTANCE
                  </h3>
                  <p className="text-xs text-[#D1D5DB] mt-1.5 leading-relaxed">
                    Let customers get answers to their questions anytime, even outside business hours.
                  </p>
                </div>

                {/* Compact Interactive Chat Preview */}
                <div className="relative z-10 my-auto py-1.5 bg-[#03110C]/80 rounded-xl p-2.5 border border-emerald-500/20 space-y-1 shadow-inner">
                  <div className="bg-white/[0.08] text-white/90 rounded-lg p-1.5 text-[10px] leading-snug max-w-[92%] ml-auto">
                    Can I schedule an executive consultation for tomorrow?
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/30 text-white rounded-lg p-1.5 text-[10px] leading-snug max-w-[95%]">
                    Absolutely! Reserved 3:00 PM tomorrow with our senior specialist.
                  </div>
                </div>

                {/* Bottom Label (Exact User Requested Label) */}
                <div className="relative z-10 pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                    ALWAYS AVAILABLE
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 02 · LIGHT (LUMINOUS ROYAL PURPLE / LILAC NEON)     */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[1] = el)}
                className="project-card group relative rounded-2xl bg-gradient-to-br from-[#FAF5FF] via-[#F3E8FF] to-[#EDE9FE] text-[#0B0B10] p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_45px_rgba(150,61,255,0.22)] border-2 border-[#963DFF]/50 hover:border-[#963DFF] overflow-hidden h-[335px] sm:h-[350px] lg:h-[365px] xl:h-[380px] will-change-transform transition-all duration-300"
              >
                {/* Ambient Lilac Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#963DFF]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#963DFF]/15 text-[#7C3AED] border border-[#963DFF]/30">
                      Card 02 · Light
                    </span>
                    <span className="text-[11px] font-bold text-[#963DFF]">
                      AI Assistant
                    </span>
                  </div>

                  {/* Heading & Subtitle */}
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-[#0B0B10] tracking-tight mt-2.5 uppercase">
                    LESS MANUAL WORK
                  </h3>
                  <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Reduce repetitive customer interactions and give your team more time for important work.
                  </p>
                </div>

                {/* Central Luminous Circular Disc */}
                <div className="relative z-10 my-auto py-1 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-[0_10px_25px_rgba(150,61,255,0.18)] flex items-center justify-center border-2 border-[#963DFF]/30">
                    <span className="font-headline font-black text-3xl sm:text-4xl text-[#7C3AED] tracking-tight">
                      1.5K<span className="text-xl text-[#55A9FF]">+</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Label (Exact User Requested Label) */}
                <div className="relative z-10 pt-2 border-t border-[#963DFF]/20 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#7C3AED] uppercase">
                    AUTOMATED QUERY RESOLUTION
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 03 · DARK (ELECTRIC SAPPHIRE / ROYAL BLUE GLOW)    */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[2] = el)}
                className="team-card group relative rounded-2xl bg-gradient-to-br from-[#08152B] via-[#0A111F] to-[#060B14] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_40px_rgba(56,189,248,0.22)] border-2 border-[#38BDF8]/50 hover:border-[#38BDF8] overflow-hidden h-[335px] sm:h-[350px] lg:h-[365px] xl:h-[380px] will-change-transform transition-all duration-300"
              >
                {/* Ambient Blue Orb */}
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#38BDF8]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Card 03 · Dark
                    </span>
                    <span className="text-[11px] font-bold text-[#38BDF8]">
                      Enquiries
                    </span>
                  </div>

                  {/* Heading & Subtitle */}
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-2.5 uppercase">
                    LEAD VISIBILITY
                  </h3>
                  <p className="text-xs text-[#D1D5DB] mt-1.5 leading-relaxed">
                    See customer conversations and enquiries generated through your website assistant.
                  </p>
                </div>

                {/* Compact Business Lead Overview */}
                <div className="relative z-10 my-auto py-1.5 bg-[#040C1A]/80 rounded-xl p-2.5 border border-[#38BDF8]/20 space-y-1 shadow-inner">
                  <div className="bg-white/[0.04] rounded-lg p-1.5 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] font-bold text-white">Commercial Rollout</div>
                      <div className="text-[8px] text-white/60">Enterprise Tier</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] sm:text-[9px] font-bold uppercase">
                      Hot Lead
                    </span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-1.5 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] font-bold text-white">Elena Rostova</div>
                      <div className="text-[8px] text-white/60">Consultation Scheduled</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#963DFF]/25 text-[#C28AFF] text-[8px] sm:text-[9px] font-bold uppercase">
                      Qualified
                    </span>
                  </div>
                </div>

                {/* Bottom Label (Exact User Requested Label) */}
                <div className="relative z-10 pt-2 border-t border-[#38BDF8]/20 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#38BDF8] uppercase">
                    CONVERSATIONS & ENQUIRIES
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
