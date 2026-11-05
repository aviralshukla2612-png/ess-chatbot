"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MessageSquare,
  Zap,
  BarChart3,
  Check,
  ArrowRight,
  TrendingUp,
  Link2,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const headerRef = useRef(null);

  // Benefit 01 Refs
  const b1TextRef = useRef(null);
  const b1CardRef = useRef(null);
  const b1Msg1Ref = useRef(null);
  const b1Msg2Ref = useRef(null);
  const b1BadgeRef = useRef(null);

  // Benefit 02 Refs
  const b2TextRef = useRef(null);
  const b2CardRef = useRef(null);
  const b2ItemsRef = useRef(null);
  const b2BadgeRef = useRef(null);

  // Benefit 03 Refs
  const b3TextRef = useRef(null);
  const b3CardRef = useRef(null);
  const b3BarsRef = useRef(null);
  const b3LeadsRef = useRef(null);
  const b3BadgeRef = useRef(null);

  // Wave Background Ref
  const bgWaveRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // =========================================================================
    // DESKTOP & LARGE SCREENS (>= 1024px): Pinned Immersive Storytelling Stage
    // Continuous flowing emerald-purple-blue wave composition connecting all 3
    // =========================================================================
    mm.add("(min-width: 1024px)", () => {
      // 1. Initial State
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: 25 });
      }
      if (bgWaveRef.current) {
        gsap.set(bgWaveRef.current, { opacity: 0.45, scale: 0.98 });
      }

      // Benefit 1 Initial
      if (b1TextRef.current) gsap.set(b1TextRef.current, { opacity: 0, x: -35 });
      if (b1CardRef.current) {
        gsap.set(b1CardRef.current, {
          opacity: 0,
          y: 40,
          scale: 0.92,
          rotateY: 8,
          rotateX: 4,
          force3D: true,
        });
      }
      if (b1BadgeRef.current) gsap.set(b1BadgeRef.current, { scale: 0, opacity: 0 });
      if (b1Msg1Ref.current) gsap.set(b1Msg1Ref.current, { opacity: 0, x: 20 });
      if (b1Msg2Ref.current) gsap.set(b1Msg2Ref.current, { opacity: 0, x: -20 });

      // Benefit 2 Initial
      if (b2TextRef.current) gsap.set(b2TextRef.current, { opacity: 0, x: 35 });
      if (b2CardRef.current) {
        gsap.set(b2CardRef.current, {
          opacity: 0,
          y: 40,
          scale: 0.92,
          rotateY: -8,
          rotateX: 4,
          force3D: true,
        });
      }
      if (b2BadgeRef.current) gsap.set(b2BadgeRef.current, { scale: 0, opacity: 0 });
      if (b2ItemsRef.current) {
        gsap.set(b2ItemsRef.current.children, { opacity: 0, y: 15 });
      }

      // Benefit 3 Initial
      if (b3TextRef.current) gsap.set(b3TextRef.current, { opacity: 0, x: -35 });
      if (b3CardRef.current) {
        gsap.set(b3CardRef.current, {
          opacity: 0,
          y: 40,
          scale: 0.92,
          rotateX: 4,
          force3D: true,
        });
      }
      if (b3BadgeRef.current) gsap.set(b3BadgeRef.current, { scale: 0, opacity: 0 });
      if (b3BarsRef.current) {
        gsap.set(b3BarsRef.current.children, { scaleY: 0.15, transformOrigin: "bottom center" });
      }
      if (b3LeadsRef.current) {
        gsap.set(b3LeadsRef.current.children, { opacity: 0, x: 15 });
      }

      // Master Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=2600",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.85,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      // PHASE 1: SECTION INTRO (0.00 -> 0.18)
      if (headerRef.current) {
        tl.to(
          headerRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.16,
            ease: "power3.out",
          },
          0.02
        );
      }
      if (bgWaveRef.current) {
        tl.to(
          bgWaveRef.current,
          {
            opacity: 0.85,
            scale: 1,
            duration: 0.22,
            ease: "power2.out",
          },
          0.02
        );
      }

      // PHASE 2: CUSTOMER ENGAGEMENT (0.16 -> 0.44)
      if (b1TextRef.current) {
        tl.to(
          b1TextRef.current,
          { opacity: 1, x: 0, duration: 0.18, ease: "power3.out" },
          0.16
        );
      }
      if (b1CardRef.current) {
        tl.to(
          b1CardRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateY: 4,
            rotateX: 2,
            duration: 0.22,
            ease: "power3.out",
          },
          0.18
        );
      }
      if (b1BadgeRef.current) {
        tl.to(
          b1BadgeRef.current,
          { scale: 1, opacity: 1, duration: 0.14, ease: "back.out(1.7)" },
          0.22
        );
      }
      if (b1Msg1Ref.current) {
        tl.to(
          b1Msg1Ref.current,
          { opacity: 1, x: 0, duration: 0.14, ease: "power2.out" },
          0.24
        );
      }
      if (b1Msg2Ref.current) {
        tl.to(
          b1Msg2Ref.current,
          { opacity: 1, x: 0, duration: 0.16, ease: "power2.out" },
          0.30
        );
      }

      // PHASE 3: INTELLIGENT AUTOMATION (0.42 -> 0.70)
      if (b2TextRef.current) {
        tl.to(
          b2TextRef.current,
          { opacity: 1, x: 0, duration: 0.18, ease: "power3.out" },
          0.42
        );
      }
      if (b2CardRef.current) {
        tl.to(
          b2CardRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateY: -4,
            rotateX: 2,
            duration: 0.22,
            ease: "power3.out",
          },
          0.44
        );
      }
      if (b2BadgeRef.current) {
        tl.to(
          b2BadgeRef.current,
          { scale: 1, opacity: 1, duration: 0.14, ease: "back.out(1.7)" },
          0.48
        );
      }
      if (b2ItemsRef.current) {
        tl.to(
          b2ItemsRef.current.children,
          { opacity: 1, y: 0, duration: 0.14, stagger: 0.05, ease: "power2.out" },
          0.50
        );
      }

      // PHASE 4: ENQUIRY VISIBILITY (0.68 -> 0.94)
      if (b3TextRef.current) {
        tl.to(
          b3TextRef.current,
          { opacity: 1, x: 0, duration: 0.18, ease: "power3.out" },
          0.68
        );
      }
      if (b3CardRef.current) {
        tl.to(
          b3CardRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            duration: 0.22,
            ease: "power3.out",
          },
          0.70
        );
      }
      if (b3BadgeRef.current) {
        tl.to(
          b3BadgeRef.current,
          { scale: 1, opacity: 1, duration: 0.14, ease: "back.out(1.7)" },
          0.74
        );
      }
      if (b3BarsRef.current) {
        tl.to(
          b3BarsRef.current.children,
          { scaleY: 1, duration: 0.18, stagger: 0.03, ease: "power2.out" },
          0.76
        );
      }
      if (b3LeadsRef.current) {
        tl.to(
          b3LeadsRef.current.children,
          { opacity: 1, x: 0, duration: 0.14, stagger: 0.05, ease: "power2.out" },
          0.80
        );
      }

      // PHASE 5: SECTION EXIT HOLD (0.94 -> 1.00)
      tl.to({}, { duration: 0.12 }, 0.94);
    });

    // =========================================================================
    // MOBILE & TABLET (< 1024px): Seamless Vertical Storytelling
    // Stacked layout with scroll-triggered staggered reveals
    // =========================================================================
    mm.add("(max-width: 1023px)", () => {
      const elements = [
        headerRef.current,
        b1TextRef.current,
        b1CardRef.current,
        b2TextRef.current,
        b2CardRef.current,
        b3TextRef.current,
        b3CardRef.current,
      ];

      elements.forEach((el) => {
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="benefits"
      className="relative w-full bg-[#050507] text-[#F5F5F7] overflow-hidden select-none"
    >
      {/* ======================================================================= */}
      {/* 1. CONTINUOUS LUMINOUS BACKGROUND WAVE (bg2.png + SOFT NEON AMBIENCE)   */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* User Provided Master Glowing Ribbon Wave: bg2.png */}
        <img
          ref={bgWaveRef}
          src="/bg2.png"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen will-change-transform opacity-75"
        />

        {/* Subtle Ambient Radial Glows anchored to Benefit Color Anchors */}
        <div className="absolute top-[28%] left-[22%] w-[420px] h-[340px] rounded-full bg-[#00D98B]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[48%] right-[18%] w-[480px] h-[380px] rounded-full bg-[#963DFF]/15 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[18%] left-[30%] w-[460px] h-[360px] rounded-full bg-[#55A9FF]/12 blur-[130px] pointer-events-none" />

        {/* Subtle vignette for smooth top/bottom section blending */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050507] via-[#050507]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent pointer-events-none" />
      </div>

      {/* ======================================================================= */}
      {/* 2. STAGE VIEWPORT (PINNED ON DESKTOP 100dvh, FLUID STACK ON MOBILE)      */}
      {/* ======================================================================= */}
      <div
        ref={stageRef}
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between pt-20 sm:pt-24 lg:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto"
      >
        {/* ===================================================================== */}
        {/* SECTION HEADER: OVERSIZED EDITORIAL TYPOGRAPHY & GLOWING PURPLE TITLE */}
        {/* ===================================================================== */}
        <div
          ref={headerRef}
          className="text-center max-w-4xl mx-auto shrink-0 mb-6 lg:mb-4 will-change-transform"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-2 sm:mb-3">
            <span className="w-6 sm:w-10 h-px bg-white/20" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#9898A6]">
              EMPEROR NEXUS
            </span>
            <span className="w-6 sm:w-10 h-px bg-white/20" />
          </div>

          {/* Main Headline */}
          <h2 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl lg:text-[2.85rem] tracking-tight uppercase leading-[1.08] text-white">
            DON&apos;T LET VALUABLE{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_25px_rgba(150,61,255,0.45)]">
              CONVERSATIONS
            </span>{" "}
            SLIP AWAY.
          </h2>

          {/* Supporting Description */}
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-[#9898A6] max-w-2xl mx-auto leading-relaxed font-normal">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* ASYMMETRICAL THREE-BENEFIT COMPOSITION (DESKTOP GRID / MOBILE STACK)   */}
        {/* ===================================================================== */}
        <div className="relative w-full flex-1 flex flex-col justify-around gap-10 lg:gap-2 my-auto max-w-[1320px] mx-auto">
          {/* ------------------------------------------------------------------- */}
          {/* BENEFIT 01: CUSTOMER ENGAGEMENT (EMERALD GREEN #00D98B)             */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left: Editorial Text Block */}
            <div
              ref={b1TextRef}
              className="lg:col-span-5 text-left pl-2 sm:pl-6 lg:pl-8 will-change-transform"
            >
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#9898A6]">
                  01 —
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase text-[#00D98B]">
                  CUSTOMER ENGAGEMENT
                </span>
              </div>
              <h3 className="font-sans font-black text-xl sm:text-2xl lg:text-3xl tracking-tight text-white uppercase leading-tight">
                NEVER MISS A{" "}
                <span className="text-[#00D98B] drop-shadow-[0_0_20px_rgba(0,217,139,0.35)]">
                  CONVERSATION.
                </span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#9898A6] max-w-md leading-relaxed font-normal">
                Answer customer questions instantly using your approved business information, even outside working hours.
              </p>
            </div>

            {/* Right: Floating Realistic Chatbot Interface */}
            <div className="lg:col-span-7 flex justify-center lg:justify-start lg:pl-6">
              <div
                ref={b1CardRef}
                className="relative w-full max-w-[340px] sm:max-w-[400px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#0B0D14]/90 backdrop-blur-xl border border-[#00D98B]/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(0,217,139,0.18)] will-change-transform text-left"
                style={{
                  transform: "perspective(1200px) rotateY(6deg) rotateX(3deg)",
                }}
              >
                {/* Floating Emerald Badge with Chat Icon */}
                <div
                  ref={b1BadgeRef}
                  className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0B0D14] border border-[#00D98B]/60 shadow-[0_0_20px_rgba(0,217,139,0.45)] flex items-center justify-center text-[#00D98B] will-change-transform"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#963DFF] to-[#55A9FF] flex items-center justify-center text-white text-[10px] font-black shadow-[0_0_10px_rgba(150,61,255,0.4)]">
                      E
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-white tracking-tight block">
                        Emperor Nexus
                      </span>
                      <span className="text-[9px] text-[#00D98B] flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D98B] animate-pulse" />
                        Online · Approved Knowledge
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">24/7 Live</span>
                </div>

                {/* Chat Bubbles */}
                <div className="space-y-3">
                  {/* Visitor message */}
                  <div ref={b1Msg1Ref} className="flex justify-end will-change-transform">
                    <div className="bg-[#1E293B]/80 text-white text-xs sm:text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-xs border border-white/10 max-w-[85%] shadow-sm leading-relaxed">
                      What are your services?
                    </div>
                  </div>

                  {/* Assistant response */}
                  <div ref={b1Msg2Ref} className="flex justify-start will-change-transform">
                    <div className="bg-[#0F172A]/90 text-neutral-200 text-xs sm:text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-xs border border-[#00D98B]/30 max-w-[90%] shadow-[0_4px_16px_rgba(0,217,139,0.08)] leading-relaxed">
                      We offer consultation, implementation and ongoing support for enterprises.
                    </div>
                  </div>
                </div>

                {/* Subtle Input Footer */}
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-white/30 text-[11px] font-sans">
                  <span>Ask Emperor Nexus a question...</span>
                  <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* BENEFIT 02: INTELLIGENT AUTOMATION (PURPLE #963DFF / #C28AFF)       */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left (on Desktop): Floating Business Knowledge UI */}
            <div className="order-2 lg:order-1 lg:col-span-7 flex justify-center lg:justify-end lg:pr-6">
              <div
                ref={b2CardRef}
                className="relative w-full max-w-[340px] sm:max-w-[400px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#0B0D14]/90 backdrop-blur-xl border border-[#963DFF]/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(150,61,255,0.22)] will-change-transform text-left"
                style={{
                  transform: "perspective(1200px) rotateY(-6deg) rotateX(3deg)",
                }}
              >
                {/* Floating Purple Badge with Zap Icon */}
                <div
                  ref={b2BadgeRef}
                  className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0B0D14] border border-[#963DFF]/60 shadow-[0_0_20px_rgba(150,61,255,0.45)] flex items-center justify-center text-[#C28AFF] will-change-transform"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>

                {/* Knowledge Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5">
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                    Business Knowledge
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#963DFF]/20 text-[#C28AFF] border border-[#963DFF]/40">
                    100% Grounded
                  </span>
                </div>

                {/* Source documents list */}
                <div ref={b2ItemsRef} className="space-y-2.5">
                  {/* File 1: PDF */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#963DFF]/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-mono text-[9px] font-black">
                        PDF
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-medium text-white block">
                          Company Profile.pdf
                        </span>
                        <span className="text-[10px] text-white/40">14 pages · Verified</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#00D98B]/15 border border-[#00D98B]/40 flex items-center justify-center text-[#00D98B]">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* File 2: DOCX */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#963DFF]/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-mono text-[9px] font-black">
                        DOC
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-medium text-white block">
                          Services.docx
                        </span>
                        <span className="text-[10px] text-white/40">8 packages · Synced</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#00D98B]/15 border border-[#00D98B]/40 flex items-center justify-center text-[#00D98B]">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* File 3: Website Content */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#963DFF]/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-[#C28AFF] border border-purple-500/30 flex items-center justify-center">
                        <Link2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-medium text-white block">
                          Website Content
                        </span>
                        <span className="text-[10px] text-white/40">Live Crawler Active</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#00D98B]/15 border border-[#00D98B]/40 flex items-center justify-center text-[#00D98B]">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right (on Desktop): Editorial Text Block */}
            <div
              ref={b2TextRef}
              className="order-1 lg:order-2 lg:col-span-5 text-left lg:text-right pr-2 sm:pr-6 lg:pr-8 will-change-transform"
            >
              <div className="flex items-center lg:justify-end gap-2 mb-1.5 sm:mb-2">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#9898A6]">
                  02 —
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase text-[#C28AFF]">
                  INTELLIGENT AUTOMATION
                </span>
              </div>
              <h3 className="font-sans font-black text-xl sm:text-2xl lg:text-3xl tracking-tight text-white uppercase leading-tight">
                LESS REPETITION.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] to-[#963DFF] drop-shadow-[0_0_20px_rgba(150,61,255,0.35)]">
                  MORE FOCUS.
                </span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#9898A6] max-w-md lg:ml-auto leading-relaxed font-normal">
                Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business details.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* BENEFIT 03: ENQUIRY VISIBILITY (ELECTRIC BLUE #55A9FF)              */}
          {/* ------------------------------------------------------------------- */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left: Editorial Text Block */}
            <div
              ref={b3TextRef}
              className="lg:col-span-5 text-left pl-2 sm:pl-6 lg:pl-8 will-change-transform"
            >
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#9898A6]">
                  03 —
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase text-[#55A9FF]">
                  ENQUIRY VISIBILITY
                </span>
              </div>
              <h3 className="font-sans font-black text-xl sm:text-2xl lg:text-3xl tracking-tight text-white uppercase leading-tight">
                SEE WHAT YOUR{" "}
                <span className="text-[#55A9FF] drop-shadow-[0_0_20px_rgba(85,169,255,0.35)]">
                  CUSTOMERS NEED.
                </span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#9898A6] max-w-md leading-relaxed font-normal">
                View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for in real-time.
              </p>
            </div>

            {/* Right: Floating Business Dashboard Interface */}
            <div className="lg:col-span-7 flex justify-center lg:justify-start lg:pl-6">
              <div
                ref={b3CardRef}
                className="relative w-full max-w-[360px] sm:max-w-[430px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#0B0D14]/90 backdrop-blur-xl border border-[#55A9FF]/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(85,169,255,0.22)] will-change-transform text-left"
                style={{
                  transform: "perspective(1200px) rotateX(4deg)",
                }}
              >
                {/* Floating Electric Blue Badge with BarChart Icon */}
                <div
                  ref={b3BadgeRef}
                  className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0B0D14] border border-[#55A9FF]/60 shadow-[0_0_20px_rgba(85,169,255,0.45)] flex items-center justify-center text-[#55A9FF] will-change-transform"
                >
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Dashboard Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#55A9FF]" />
                    <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                      Enquiries
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +42% This Week
                  </span>
                </div>

                {/* Mini Bar Chart Graphic */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-3">
                  <div
                    ref={b3BarsRef}
                    className="flex items-end justify-between h-12 sm:h-14 px-1 gap-1.5 sm:gap-2"
                  >
                    {[
                      { h: "35%", color: "from-[#55A9FF]/40 to-[#55A9FF]" },
                      { h: "55%", color: "from-[#55A9FF]/40 to-[#55A9FF]" },
                      { h: "45%", color: "from-[#55A9FF]/40 to-[#963DFF]" },
                      { h: "70%", color: "from-[#963DFF]/40 to-[#963DFF]" },
                      { h: "60%", color: "from-[#963DFF]/40 to-[#C28AFF]" },
                      { h: "90%", color: "from-[#55A9FF]/60 to-[#55A9FF]" },
                      { h: "100%", color: "from-[#55A9FF] to-[#00D98B]" },
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className={`w-full rounded-t-sm bg-gradient-to-t ${bar.color} transition-all duration-300 shadow-[0_0_8px_rgba(85,169,255,0.2)]`}
                          style={{ height: bar.h }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Conversation / Enquiry Previews */}
                <div ref={b3LeadsRef} className="space-y-2">
                  {/* Lead 1 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-[11px] font-bold">
                        JD
                      </div>
                      <div className="space-y-1">
                        <div className="w-24 sm:w-28 h-2 bg-white/60 rounded-full" />
                        <div className="w-16 sm:w-20 h-1.5 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#55A9FF]/15 text-[#55A9FF] border border-[#55A9FF]/40">
                      New Enquiry
                    </span>
                  </div>

                  {/* Lead 2 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#00D98B]/20 flex items-center justify-center text-[#00D98B] text-[11px] font-bold">
                        ES
                      </div>
                      <div className="space-y-1">
                        <div className="w-28 sm:w-32 h-2 bg-white/60 rounded-full" />
                        <div className="w-20 sm:w-24 h-1.5 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#00D98B]/15 text-[#00D98B] border border-[#00D98B]/40">
                      Qualified Lead
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom subtle footnote */}
        <div className="relative z-10 text-center shrink-0 pt-4 text-[10px] sm:text-xs font-mono text-white/30">
          <span>✦ 24/7 Autonomous Sales AI · Instant Inquiry Capture · Grounded Business Intelligence</span>
        </div>
      </div>
    </section>
  );
}
