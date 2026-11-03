"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 3D Shatter trajectory coordinates for "DON'T LET VALUABLE CONVERSATIONS SLIP AWAY."
const SHATTER_LETTERS = [
  { char: "D", x: 210, y: 65, z: 180, rx: -60, ry: -75, rz: -45, s: 1.8 },
  { char: "O", x: 267, y: -41, z: 240, rx: -30, ry: -50, rz: -15, s: 2.0 },
  { char: "N", x: 266, y: 179, z: 300, rx: 0, ry: -25, rz: 15, s: 2.3 },
  { char: "'", x: 366, y: 51, z: 180, rx: 30, ry: 0, rz: 45, s: 1.8 },
  { char: "T", x: 139, y: 170, z: 240, rx: 60, ry: 25, rz: -45, s: 2.0 },
  { char: " ", isSpace: true },
  { char: "L", x: 123, y: 295, z: 180, rx: -30, ry: 75, rz: 15, s: 1.8 },
  { char: "E", x: 277, y: 245, z: 240, rx: 0, ry: -75, rz: 45, s: 2.0 },
  { char: "T", x: 22, y: 219, z: 300, rx: 30, ry: -50, rz: -45, s: 2.3 },
  { char: " ", isSpace: true },
  { char: "V", x: -61, y: 314, z: 240, rx: -60, ry: 0, rz: 15, s: 2.0 },
  { char: "A", x: 96, y: 357, z: 300, rx: -30, ry: 25, rz: 45, s: 2.3 },
  { char: "L", x: -102, y: 195, z: 180, rx: 0, ry: 50, rz: -45, s: 1.8 },
  { char: "U", x: -8, y: 270, z: 240, rx: 30, ry: 75, rz: -15, s: 2.0 },
  { char: "A", x: -224, y: 229, z: 300, rx: 60, ry: -75, rz: 15, s: 2.3 },
  { char: "B", x: -117, y: 351, z: 180, rx: -60, ry: -50, rz: 45, s: 1.8 },
  { char: "L", x: -193, y: 106, z: 240, rx: -30, ry: -25, rz: -45, s: 2.0 },
  { char: "E", x: -155, y: 221, z: 300, rx: 0, ry: 0, rz: -15, s: 2.3 },
  { char: " ", isSpace: true },
  { char: "C", x: -291, y: 228, z: 240, rx: 60, ry: 50, rz: 45, s: 2.0 },
  { char: "O", x: -219, y: -18, z: 300, rx: -60, ry: 75, rz: -45, s: 2.3 },
  { char: "N", x: -251, y: 98, z: 180, rx: -30, ry: -75, rz: -15, s: 1.8 },
  { char: "V", x: -298, y: -117, z: 240, rx: 0, ry: -50, rz: 15, s: 2.0 },
  { char: "E", x: -369, y: 30, z: 300, rx: 30, ry: -25, rz: 45, s: 2.3 },
  { char: "R", x: -173, y: -136, z: 180, rx: 60, ry: 0, rz: -45, s: 1.8 },
  { char: "S", x: -264, y: -57, z: 240, rx: -60, ry: 25, rz: -15, s: 2.0 },
  { char: "A", x: -184, y: -262, z: 300, rx: -30, ry: 50, rz: 15, s: 2.3 },
  { char: "T", x: -324, y: -179, z: 180, rx: 0, ry: 75, rz: 45, s: 1.8 },
  { char: "I", x: -69, y: -209, z: 240, rx: 30, ry: -75, rz: -45, s: 2.0 },
  { char: "O", x: -189, y: -193, z: 300, rx: 60, ry: -50, rz: -15, s: 2.3 },
  { char: "N", x: -9, y: -320, z: 180, rx: -60, ry: -25, rz: 15, s: 1.8 },
  { char: "S", x: -172, y: -328, z: 240, rx: -30, ry: 0, rz: 45, s: 2.0 },
  { char: " ", isSpace: true },
  { char: "S", x: -51, y: -265, z: 180, rx: 30, ry: 50, rz: -15, s: 1.8 },
  { char: "L", x: 169, y: -272, z: 240, rx: 60, ry: 75, rz: 15, s: 2.0 },
  { char: "I", x: 38, y: -368, z: 300, rx: -60, ry: -75, rz: 45, s: 2.3 },
  { char: "P", x: 165, y: -146, z: 180, rx: -30, ry: -50, rz: -45, s: 1.8 },
  { char: " ", isSpace: true },
  { char: "A", x: 291, y: -134, z: 300, rx: 30, ry: 0, rz: 15, s: 2.3 },
  { char: "W", x: 234, y: -286, z: 180, rx: 60, ry: 25, rz: 45, s: 1.8 },
  { char: "A", x: 218, y: -30, z: 240, rx: -60, ry: 50, rz: -45, s: 2.0 },
  { char: "Y", x: 224, y: -151, z: 300, rx: -30, ry: 75, rz: -15, s: 2.3 },
  { char: ".", x: 316, y: 49, z: 180, rx: 0, ry: -75, rz: 15, s: 1.8 },
];

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const typographyRef = useRef(null);
  const letterRefs = useRef([]);
  const cardRefs = useRef([]);
  const sectionHeaderRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 768;

      if (prefersReducedMotion) {
        if (typographyRef.current) gsap.set(typographyRef.current, { display: "none" });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, y: 0, scale: 1 });
        });
        return;
      }

      // 1. Initial State: Headline centered in viewport
      letterRefs.current.forEach((el) => {
        if (el) {
          gsap.set(el, {
            x: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            transformOrigin: "center center",
            force3D: true,
          });
        }
      });

      // Cards start prepared in background depth
      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            opacity: 0,
            y: isDesktop ? -50 : 30,
            z: -160,
            rotateX: isDesktop ? -15 : 0,
            scale: 0.88,
            transformOrigin: "center center",
            force3D: true,
          });
        }
      });

      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -15 });
      }

      // ============================================================
      // COORDINATED SHATTER + CARD REVEAL TIMELINE
      // 0.00 -> 0.10: Big headline visible
      // 0.08 -> 0.38: Letters shatter apart in 3D + typography container fades out
      // 0.16 -> 0.46: Persistent header appears and cards emerge smoothly
      // 0.46 -> 1.00: Cards remain rock-solid, fully interactive
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1200",
          pin: stage,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // A. Headline Letters Shatter in 3D
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const cfg = SHATTER_LETTERS[idx] || { x: 0, y: 0, z: 200, rx: 0, ry: 0, rz: 0, s: 2 };
          tl.to(
            el,
            {
              x: cfg.x * (isDesktop ? 1.3 : 0.7),
              y: cfg.y * (isDesktop ? 1.3 : 0.7),
              z: cfg.z,
              rotateX: cfg.rx,
              rotateY: cfg.ry,
              rotateZ: cfg.rz,
              scale: cfg.s,
              opacity: 0,
              filter: "blur(12px)",
              duration: 0.28,
              ease: "power2.inOut",
            },
            0.08 + (idx % 4) * 0.015
          );
        }
      });

      // B. Fade out the initial shatter typography layer completely
      if (typographyRef.current) {
        tl.to(
          typographyRef.current,
          {
            opacity: 0,
            duration: 0.20,
            ease: "power2.out",
            pointerEvents: "none",
          },
          0.10
        );
      }

      // C. Persistent Header Fades In
      if (sectionHeaderRef.current) {
        tl.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            ease: "power2.out",
          },
          0.14
        );
      }

      // D. 3 Bright Cards Emerge & Fan Out
      cardRefs.current.forEach((card, idx) => {
        if (card) {
          tl.to(
            card,
            {
              opacity: 1,
              y: 0,
              z: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.32,
              ease: "power3.out",
            },
            0.18 + idx * 0.08
          );
        }
      });

      // Hold steady for interaction
      tl.to({}, { duration: 0.35 }, 0.65);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="relative w-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] select-none"
    >
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex flex-col justify-between pt-16 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)]"
        style={{ perspective: "1500px" }}
      >
        {/* ========================================================================= */}
        {/* PHASE 1: FULLSCREEN SHATTER TYPOGRAPHY (LAYER 30 - Shatters in 3D)        */}
        {/* ========================================================================= */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.06] border border-black/[0.12] text-[#2A2A32] text-xs font-mono font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Autonomous Enterprise Advantages</span>
          </div>

          <h1
            className="font-headline font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-[#0B0B10] uppercase text-center max-w-5xl leading-tight flex flex-wrap justify-center gap-x-2 sm:gap-x-3"
            style={{ perspective: "1200px" }}
          >
            {SHATTER_LETTERS.map((item, idx) =>
              item.isSpace ? (
                <span key={idx} className="w-2 sm:w-3" />
              ) : (
                <span
                  key={idx}
                  ref={(el) => (letterRefs.current[idx] = el)}
                  className="inline-block will-change-transform text-[#0B0B10] drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
                >
                  {item.char}
                </span>
              )
            )}
          </h1>

          <p className="mt-6 text-xs sm:text-sm text-[#374151] max-w-xl text-center font-semibold leading-relaxed">
            Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* PERSISTENT HEADER (Appears smoothly as letters shatter)                   */}
        {/* ========================================================================= */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.06] border border-black/[0.1] text-xs font-mono font-bold uppercase tracking-widest text-[#2A2A32] mb-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Autonomous Enterprise Advantages</span>
          </div>
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-[#0B0B10] tracking-tight leading-tight">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#1F2937] font-semibold max-w-xl mx-auto hidden sm:block">
            Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3 BRIGHT COLORFUL CARDS (EACH CARD HAS A BRIGHT, DIFFERENT COLOR)          */}
        {/* ========================================================================= */}
        <div
          className="key-card-list relative z-20 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto my-auto"
          style={{ perspective: "1400px" }}
        >
          {/* ======================================================================= */}
          {/* CARD 01: BRIGHT NEON MINT / EMERALD GREEN                               */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#E6FDF4] via-[#D1FAE5] to-[#A7F3D0] p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_35px_rgba(16,185,129,0.30)] hover:shadow-[0_20px_45px_rgba(16,185,129,0.45)] border-2 border-[#10B981] hover:border-[#059669] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Mint Glow */}
            <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#10B981]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/25 text-[#064E3B] border border-[#10B981]/40">
                  Card 01 · Mint AI
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#064E3B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live 24/7
                </span>
              </div>

              {/* Heading & Subtitle in Deep Dark Green */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#064E3B] tracking-tight mt-3 uppercase">
                24/7 AI ASSISTANCE
              </h3>
              <p className="text-xs text-[#065F46] mt-1.5 leading-relaxed font-semibold">
                Let customers get answers to their questions anytime, even outside business hours.
              </p>
            </div>

            {/* Interactive Chat Preview */}
            <div className="relative z-10 my-3 py-2 bg-white/95 rounded-xl p-3 border border-[#10B981]/30 space-y-1.5 shadow-sm">
              <div className="bg-[#ECFDF5] text-[#064E3B] border border-[#10B981]/20 rounded-lg p-2 text-[10px] leading-snug max-w-[92%] ml-auto font-medium">
                Can I schedule an executive consultation for tomorrow?
              </div>
              <div className="bg-[#10B981] text-white rounded-lg p-2 text-[10px] leading-snug max-w-[95%] font-medium shadow-xs">
                Absolutely! Reserved 3:00 PM tomorrow with our senior specialist.
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-2.5 border-t border-[#10B981]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#064E3B] uppercase">
                ALWAYS AVAILABLE
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 02: BRIGHT ROYAL LAVENDER / LILAC VIOLET                           */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#F5F0FF] via-[#EDE4FF] to-[#D8B4FE] p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_35px_rgba(150,61,255,0.30)] hover:shadow-[0_20px_45px_rgba(150,61,255,0.45)] border-2 border-[#963DFF] hover:border-[#7C2CE8] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Purple Glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#963DFF]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#963DFF]/25 text-[#2E0854] border border-[#963DFF]/40">
                  Card 02 · Auto Assist
                </span>
                <span className="text-[11px] font-bold text-[#2E0854]">
                  AI Assistant
                </span>
              </div>

              {/* Heading & Subtitle in Deep Dark Purple (High Contrast!) */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#2E0854] tracking-tight mt-3 uppercase">
                LESS MANUAL WORK
              </h3>
              <p className="text-xs text-[#4A157A] mt-1.5 leading-relaxed font-semibold">
                Reduce repetitive customer interactions and give your team more time for important work.
              </p>
            </div>

            {/* Central Metric Ring */}
            <div className="relative z-10 my-3 flex flex-col items-center justify-center">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white shadow-[0_8px_25px_rgba(150,61,255,0.25)] border-2 border-[#963DFF]/30 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <span className="font-headline font-black text-2xl text-[#2E0854] tracking-tight">
                  1.5K<span className="text-[#963DFF]">+</span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase text-[#4A157A] mt-0.5">
                  Automated
                </span>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-2.5 border-t border-[#963DFF]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#2E0854] uppercase">
                AUTOMATED QUERY RESOLUTION
              </span>
              <Sparkles className="w-4 h-4 text-[#963DFF] shrink-0" />
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 03: BRIGHT ELECTRIC AZURE / SKY BLUE                               */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD] p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_35px_rgba(2,132,199,0.30)] hover:shadow-[0_20px_45px_rgba(2,132,199,0.45)] border-2 border-[#0284C7] hover:border-[#0369A1] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Azure Glow */}
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#0284C7]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0284C7]/25 text-[#082F49] border border-[#0284C7]/40">
                  Card 03 · Pipeline
                </span>
                <span className="text-[11px] font-bold text-[#082F49]">
                  Enquiries
                </span>
              </div>

              {/* Heading & Subtitle in Deep Navy */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#082F49] tracking-tight mt-3 uppercase">
                LEAD VISIBILITY
              </h3>
              <p className="text-xs text-[#0C4A6E] mt-1.5 leading-relaxed font-semibold">
                See customer conversations and enquiries generated through your website assistant.
              </p>
            </div>

            {/* Pipeline Rows Preview */}
            <div className="relative z-10 my-3 py-2 bg-white/95 rounded-xl p-3 border border-[#0284C7]/30 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[#0284C7]/15">
                <span className="font-mono text-[#0369A1] font-bold">Lead Pipeline</span>
                <span className="text-[#0284C7] font-bold">98% Match</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-[#082F49] truncate max-w-[140px]">
                  Commercial Rollout
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 font-mono text-[9px] font-bold border border-emerald-500/40">
                  HOT LEAD
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-[#082F49] truncate max-w-[140px]">
                  Elena Rostova
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-800 font-mono text-[9px] font-bold border border-purple-500/40">
                  QUALIFIED
                </span>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-2.5 border-t border-[#0284C7]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#082F49] uppercase">
                CONVERSATIONS & ENQUIRIES
              </span>
              <TrendingUp className="w-4 h-4 text-[#0284C7] shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
