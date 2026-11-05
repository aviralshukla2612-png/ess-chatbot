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
  const bgWaveRef = useRef(null);

  // Scene 1: Customer Engagement
  const scene1Ref = useRef(null);
  const b1Msg1Ref = useRef(null);
  const b1Msg2Ref = useRef(null);
  const b1BadgeRef = useRef(null);

  // Scene 2: Intelligent Automation
  const scene2Ref = useRef(null);
  const b2ItemsRef = useRef(null);
  const b2BadgeRef = useRef(null);

  // Scene 3: Enquiry Visibility
  const scene3Ref = useRef(null);
  const b3BarsRef = useRef(null);
  const b3LeadsRef = useRef(null);
  const b3BadgeRef = useRef(null);

  // Step Indicators (Bottom)
  const indicator1Ref = useRef(null);
  const indicator2Ref = useRef(null);
  const indicator3Ref = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // =========================================================================
    // DESKTOP & LARGE SCREENS (>= 1024px): Pinned Center-Stage Scene Swapping
    // Each benefit takes the prime, full-viewport center stage with zero clipping!
    // =========================================================================
    mm.add("(min-width: 1024px)", () => {
      // Set initial positions
      if (headerRef.current) gsap.set(headerRef.current, { autoAlpha: 0, y: 20 });
      if (bgWaveRef.current) gsap.set(bgWaveRef.current, { opacity: 0.45, scale: 0.98 });

      // Scene 1: Starts visible in center stage
      if (scene1Ref.current) {
        gsap.set(scene1Ref.current, {
          autoAlpha: 0,
          y: 40,
          scale: 0.96,
          display: "flex",
          pointerEvents: "auto",
        });
      }
      if (b1Msg1Ref.current) gsap.set(b1Msg1Ref.current, { autoAlpha: 0, x: 20 });
      if (b1Msg2Ref.current) gsap.set(b1Msg2Ref.current, { autoAlpha: 0, x: -20 });
      if (b1BadgeRef.current) gsap.set(b1BadgeRef.current, { scale: 0, autoAlpha: 0 });

      // Scene 2: Hidden initially
      if (scene2Ref.current) {
        gsap.set(scene2Ref.current, {
          autoAlpha: 0,
          y: 60,
          scale: 0.94,
          display: "none",
          pointerEvents: "none",
        });
      }
      if (b2BadgeRef.current) gsap.set(b2BadgeRef.current, { scale: 0, autoAlpha: 0 });
      if (b2ItemsRef.current) {
        gsap.set(b2ItemsRef.current.children, { autoAlpha: 0, y: 15 });
      }

      // Scene 3: Hidden initially
      if (scene3Ref.current) {
        gsap.set(scene3Ref.current, {
          autoAlpha: 0,
          y: 60,
          scale: 0.94,
          display: "none",
          pointerEvents: "none",
        });
      }
      if (b3BadgeRef.current) gsap.set(b3BadgeRef.current, { scale: 0, autoAlpha: 0 });
      if (b3BarsRef.current) {
        gsap.set(b3BarsRef.current.children, { scaleY: 0.15, transformOrigin: "bottom center" });
      }
      if (b3LeadsRef.current) {
        gsap.set(b3LeadsRef.current.children, { autoAlpha: 0, x: 15 });
      }

      // Step indicators initial styling
      if (indicator1Ref.current) {
        gsap.set(indicator1Ref.current, {
          borderColor: "#00D98B",
          backgroundColor: "rgba(0, 217, 139, 0.18)",
          color: "#00D98B",
          opacity: 1,
        });
      }
      if (indicator2Ref.current) {
        gsap.set(indicator2Ref.current, {
          borderColor: "rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          color: "rgba(255, 255, 255, 0.4)",
          opacity: 0.6,
        });
      }
      if (indicator3Ref.current) {
        gsap.set(indicator3Ref.current, {
          borderColor: "rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          color: "rgba(255, 255, 255, 0.4)",
          opacity: 0.6,
        });
      }

      // Master Scroll-Driven Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=2800",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.85,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      // -----------------------------------------------------------------------
      // PHASE 1: SECTION INTRO (0.00 -> 0.14)
      // -----------------------------------------------------------------------
      if (headerRef.current) {
        tl.to(
          headerRef.current,
          { autoAlpha: 1, y: 0, duration: 0.12, ease: "power3.out" },
          0.02
        );
      }
      if (bgWaveRef.current) {
        tl.to(
          bgWaveRef.current,
          { opacity: 0.85, scale: 1, duration: 0.15, ease: "power2.out" },
          0.02
        );
      }

      // -----------------------------------------------------------------------
      // PHASE 2: SCENE 1 (CUSTOMER ENGAGEMENT - EMERALD GREEN) (0.08 -> 0.36)
      // -----------------------------------------------------------------------
      if (scene1Ref.current) {
        tl.to(
          scene1Ref.current,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.16, ease: "power3.out" },
          0.08
        );
      }
      if (b1BadgeRef.current) {
        tl.to(
          b1BadgeRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.12, ease: "back.out(1.7)" },
          0.12
        );
      }
      if (b1Msg1Ref.current) {
        tl.to(
          b1Msg1Ref.current,
          { autoAlpha: 1, x: 0, duration: 0.12, ease: "power2.out" },
          0.14
        );
      }
      if (b1Msg2Ref.current) {
        tl.to(
          b1Msg2Ref.current,
          { autoAlpha: 1, x: 0, duration: 0.14, ease: "power2.out" },
          0.20
        );
      }

      // Hold Scene 1 for comfortable reading (0.24 -> 0.34)

      // -----------------------------------------------------------------------
      // TRANSITION 1 -> 2: SCENE 1 EXITS, SCENE 2 ENTERS CENTER (0.34 -> 0.44)
      // -----------------------------------------------------------------------
      if (scene1Ref.current) {
        tl.to(
          scene1Ref.current,
          {
            autoAlpha: 0,
            y: -50,
            scale: 0.95,
            duration: 0.10,
            ease: "power2.inOut",
          },
          0.34
        );
        tl.set(scene1Ref.current, { display: "none", pointerEvents: "none" }, 0.44);
      }

      // Indicator 1 fades, Indicator 2 illuminates
      if (indicator1Ref.current) {
        tl.to(
          indicator1Ref.current,
          {
            borderColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            color: "rgba(255, 255, 255, 0.4)",
            opacity: 0.6,
            duration: 0.08,
          },
          0.36
        );
      }
      if (indicator2Ref.current) {
        tl.to(
          indicator2Ref.current,
          {
            borderColor: "#963DFF",
            backgroundColor: "rgba(150, 61, 255, 0.22)",
            color: "#C28AFF",
            opacity: 1,
            duration: 0.08,
          },
          0.38
        );
      }

      // -----------------------------------------------------------------------
      // PHASE 3: SCENE 2 (INTELLIGENT AUTOMATION - PURPLE) (0.38 -> 0.68)
      // -----------------------------------------------------------------------
      if (scene2Ref.current) {
        tl.set(scene2Ref.current, { display: "flex", pointerEvents: "auto" }, 0.36);
        tl.to(
          scene2Ref.current,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.16, ease: "power3.out" },
          0.38
        );
      }
      if (b2BadgeRef.current) {
        tl.to(
          b2BadgeRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.12, ease: "back.out(1.7)" },
          0.42
        );
      }
      if (b2ItemsRef.current) {
        tl.to(
          b2ItemsRef.current.children,
          { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.04, ease: "power2.out" },
          0.44
        );
      }

      // Hold Scene 2 for comfortable reading (0.50 -> 0.64)

      // -----------------------------------------------------------------------
      // TRANSITION 2 -> 3: SCENE 2 EXITS, SCENE 3 ENTERS CENTER (0.64 -> 0.74)
      // -----------------------------------------------------------------------
      if (scene2Ref.current) {
        tl.to(
          scene2Ref.current,
          {
            autoAlpha: 0,
            y: -50,
            scale: 0.95,
            duration: 0.10,
            ease: "power2.inOut",
          },
          0.64
        );
        tl.set(scene2Ref.current, { display: "none", pointerEvents: "none" }, 0.74);
      }

      // Indicator 2 fades, Indicator 3 illuminates
      if (indicator2Ref.current) {
        tl.to(
          indicator2Ref.current,
          {
            borderColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            color: "rgba(255, 255, 255, 0.4)",
            opacity: 0.6,
            duration: 0.08,
          },
          0.66
        );
      }
      if (indicator3Ref.current) {
        tl.to(
          indicator3Ref.current,
          {
            borderColor: "#55A9FF",
            backgroundColor: "rgba(85, 169, 255, 0.22)",
            color: "#55A9FF",
            opacity: 1,
            duration: 0.08,
          },
          0.68
        );
      }

      // -----------------------------------------------------------------------
      // PHASE 4: SCENE 3 (ENQUIRY VISIBILITY - ELECTRIC BLUE) (0.68 -> 0.96)
      // -----------------------------------------------------------------------
      if (scene3Ref.current) {
        tl.set(scene3Ref.current, { display: "flex", pointerEvents: "auto" }, 0.66);
        tl.to(
          scene3Ref.current,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.16, ease: "power3.out" },
          0.68
        );
      }
      if (b3BadgeRef.current) {
        tl.to(
          b3BadgeRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.12, ease: "back.out(1.7)" },
          0.72
        );
      }
      if (b3BarsRef.current) {
        tl.to(
          b3BarsRef.current.children,
          { scaleY: 1, duration: 0.14, stagger: 0.025, ease: "power2.out" },
          0.74
        );
      }
      if (b3LeadsRef.current) {
        tl.to(
          b3LeadsRef.current.children,
          { autoAlpha: 1, x: 0, duration: 0.12, stagger: 0.04, ease: "power2.out" },
          0.78
        );
      }

      // Hold Scene 3 before release (0.84 -> 0.96)
      tl.to({}, { duration: 0.08 }, 0.92);
    });

    // =========================================================================
    // MOBILE & TABLET (< 1024px): Sequential Smooth Stack
    // Clean scroll-triggered reveals without any clipping or overlap
    // =========================================================================
    mm.add("(max-width: 1023px)", () => {
      const elements = [
        headerRef.current,
        scene1Ref.current,
        scene2Ref.current,
        scene3Ref.current,
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
                start: "top 85%",
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
      {/* 1. CONTINUOUS LUMINOUS BACKGROUND WAVE (bg2.png)                        */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          ref={bgWaveRef}
          src="/bg2.png"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen will-change-transform opacity-75"
        />

        {/* Ambient radial glows */}
        <div className="absolute top-[25%] left-[20%] w-[380px] h-[300px] rounded-full bg-[#00D98B]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[45%] right-[15%] w-[420px] h-[340px] rounded-full bg-[#963DFF]/15 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[25%] w-[400px] h-[320px] rounded-full bg-[#55A9FF]/12 blur-[120px] pointer-events-none" />

        {/* Subtle top/bottom edge gradient fades */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050507] via-[#050507]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent pointer-events-none" />
      </div>

      {/* ======================================================================= */}
      {/* 2. STAGE VIEWPORT (PINNED ON DESKTOP 100dvh, FULL VIEWPORT SPACE)       */}
      {/* ======================================================================= */}
      <div
        ref={stageRef}
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between pt-16 sm:pt-20 lg:pt-16 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto"
      >
        {/* ===================================================================== */}
        {/* SECTION HEADER: COMPACT, HIGH-CONTRAST EDITORIAL TYPOGRAPHY           */}
        {/* ===================================================================== */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto shrink-0 mb-3 sm:mb-4 will-change-transform"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="w-5 sm:w-8 h-px bg-white/20" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#9898A6]">
              EMPEROR NEXUS
            </span>
            <span className="w-5 sm:w-8 h-px bg-white/20" />
          </div>

          {/* Main Headline */}
          <h2 className="font-sans font-black text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] tracking-tight uppercase leading-[1.1] text-white">
            DON&apos;T LET VALUABLE{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_20px_rgba(150,61,255,0.45)]">
              CONVERSATIONS
            </span>{" "}
            SLIP AWAY.
          </h2>

          {/* Supporting Description */}
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] md:text-sm text-[#9898A6] max-w-xl mx-auto leading-relaxed font-normal">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* CENTER STAGE: SCENE SWAPPING CONTAINER (NO CUTOFF, 100% IN VIEW!)     */}
        {/* ===================================================================== */}
        <div className="relative w-full flex-1 flex items-center justify-center my-auto min-h-[320px] sm:min-h-[360px] max-w-[1240px] mx-auto">
          {/* ------------------------------------------------------------------- */}
          {/* SCENE 01: CUSTOMER ENGAGEMENT (EMERALD GREEN #00D98B)               */}
          {/* ------------------------------------------------------------------- */}
          <div
            ref={scene1Ref}
            className="w-full lg:absolute lg:inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-14 will-change-transform py-4 lg:py-0"
          >
            {/* Left: Editorial Text Block */}
            <div className="w-full lg:w-[42%] text-left pl-2 sm:pl-4 lg:pl-6">
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
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-start">
              <div
                className="relative w-full max-w-[340px] sm:max-w-[390px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#0B0D14]/90 backdrop-blur-xl border border-[#00D98B]/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(0,217,139,0.18)] text-left"
                style={{
                  transform: "perspective(1200px) rotateY(5deg) rotateX(2deg)",
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
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
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
                <div className="space-y-2.5">
                  <div ref={b1Msg1Ref} className="flex justify-end will-change-transform">
                    <div className="bg-[#1E293B]/80 text-white text-xs sm:text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-xs border border-white/10 max-w-[85%] shadow-sm leading-relaxed">
                      What are your services?
                    </div>
                  </div>

                  <div ref={b1Msg2Ref} className="flex justify-start will-change-transform">
                    <div className="bg-[#0F172A]/90 text-neutral-200 text-xs sm:text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-xs border border-[#00D98B]/30 max-w-[90%] shadow-[0_4px_16px_rgba(0,217,139,0.08)] leading-relaxed">
                      We offer consultation, implementation and ongoing support for enterprises.
                    </div>
                  </div>
                </div>

                {/* Input Bar */}
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-white/30 text-[11px] font-sans">
                  <span>Ask Emperor Nexus a question...</span>
                  <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SCENE 02: INTELLIGENT AUTOMATION (PURPLE #963DFF / #C28AFF)         */}
          {/* ------------------------------------------------------------------- */}
          <div
            ref={scene2Ref}
            className="w-full lg:absolute lg:inset-0 flex flex-col lg:flex-row-reverse items-center justify-center gap-6 sm:gap-10 lg:gap-14 will-change-transform py-4 lg:py-0"
          >
            {/* Right: Editorial Text Block */}
            <div className="w-full lg:w-[42%] text-left lg:text-right pr-2 sm:pr-4 lg:pr-6">
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

            {/* Left: Floating Business Knowledge Interface */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-end">
              <div
                className="relative w-full max-w-[340px] sm:max-w-[390px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#0B0D14]/90 backdrop-blur-xl border border-[#963DFF]/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(150,61,255,0.22)] text-left"
                style={{
                  transform: "perspective(1200px) rotateY(-5deg) rotateX(2deg)",
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
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                    Business Knowledge
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#963DFF]/20 text-[#C28AFF] border border-[#963DFF]/40">
                    100% Grounded
                  </span>
                </div>

                {/* Document Rows */}
                <div ref={b2ItemsRef} className="space-y-2">
                  {/* File 1: PDF */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#963DFF]/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-mono text-[9px] font-black">
                        PDF
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-medium text-white block">
                          Company Profile.pdf
                        </span>
                        <span className="text-[9px] text-white/40">14 pages · Verified</span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-[#00D98B]/15 border border-[#00D98B]/40 flex items-center justify-center text-[#00D98B]">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* File 2: DOCX */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#963DFF]/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-mono text-[9px] font-black">
                        DOC
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-medium text-white block">
                          Services.docx
                        </span>
                        <span className="text-[9px] text-white/40">8 packages · Synced</span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-[#00D98B]/15 border border-[#00D98B]/40 flex items-center justify-center text-[#00D98B]">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* File 3: Website Content */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#963DFF]/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-purple-500/20 text-[#C28AFF] border border-purple-500/30 flex items-center justify-center">
                        <Link2 className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-medium text-white block">
                          Website Content
                        </span>
                        <span className="text-[9px] text-white/40">Live Crawler Active</span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-[#00D98B]/15 border border-[#00D98B]/40 flex items-center justify-center text-[#00D98B]">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SCENE 03: ENQUIRY VISIBILITY (ELECTRIC BLUE #55A9FF)                */}
          {/* ------------------------------------------------------------------- */}
          <div
            ref={scene3Ref}
            className="w-full lg:absolute lg:inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-14 will-change-transform py-4 lg:py-0"
          >
            {/* Left: Editorial Text Block */}
            <div className="w-full lg:w-[42%] text-left pl-2 sm:pl-4 lg:pl-6">
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
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-start">
              <div
                className="relative w-full max-w-[360px] sm:max-w-[420px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#0B0D14]/90 backdrop-blur-xl border border-[#55A9FF]/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(85,169,255,0.22)] text-left"
                style={{
                  transform: "perspective(1200px) rotateX(2deg)",
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
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-2.5">
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
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-2.5">
                  <div
                    ref={b3BarsRef}
                    className="flex items-end justify-between h-10 sm:h-12 px-1 gap-1.5 sm:gap-2"
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
                          className={`w-full rounded-t-xs bg-gradient-to-t ${bar.color} transition-all duration-300 shadow-[0_0_8px_rgba(85,169,255,0.2)]`}
                          style={{ height: bar.h }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Enquiry Rows */}
                <div ref={b3LeadsRef} className="space-y-1.5">
                  <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">
                        JD
                      </div>
                      <div className="space-y-1">
                        <div className="w-20 sm:w-24 h-1.5 bg-white/60 rounded-full" />
                        <div className="w-12 sm:w-16 h-1 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#55A9FF]/15 text-[#55A9FF] border border-[#55A9FF]/40">
                      New Enquiry
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#00D98B]/20 flex items-center justify-center text-[#00D98B] text-[10px] font-bold">
                        ES
                      </div>
                      <div className="space-y-1">
                        <div className="w-24 sm:w-28 h-1.5 bg-white/60 rounded-full" />
                        <div className="w-16 sm:w-20 h-1 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00D98B]/15 text-[#00D98B] border border-[#00D98B]/40">
                      Qualified Lead
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BOTTOM STEP INDICATORS (ILLUMINATE AS USER SCROLLS THROUGH SCENES)    */}
        {/* ===================================================================== */}
        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 shrink-0 pt-2 pb-1">
          <div
            ref={indicator1Ref}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold transition-all duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>01 Engagement</span>
          </div>

          <div
            ref={indicator2Ref}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold transition-all duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>02 Automation</span>
          </div>

          <div
            ref={indicator3Ref}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold transition-all duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>03 Visibility</span>
          </div>
        </div>
      </div>
    </section>
  );
}
