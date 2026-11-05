"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MessageSquare,
  Zap,
  BarChart3,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const headerRef = useRef(null);
  const bgWaveRef = useRef(null);

  // Scene 1: Customer Engagement (Card 1: bg4.png)
  const scene1Ref = useRef(null);
  const b1BadgeRef = useRef(null);
  const b1CardRef = useRef(null);

  // Scene 2: Intelligent Automation (Card 2: bg5.png)
  const scene2Ref = useRef(null);
  const b2BadgeRef = useRef(null);
  const b2CardRef = useRef(null);

  // Scene 3: Enquiry Visibility (Card 3: bg6.png)
  const scene3Ref = useRef(null);
  const b3BadgeRef = useRef(null);
  const b3CardRef = useRef(null);

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
      // Set initial positions: Header, wave, and Scene 1 are FULLY VISIBLE by default!
      if (headerRef.current) gsap.set(headerRef.current, { autoAlpha: 1, y: 0 });
      if (bgWaveRef.current) gsap.set(bgWaveRef.current, { opacity: 0.75, scale: 1 });

      // Scene 1: Starts visible in center stage immediately
      if (scene1Ref.current) {
        gsap.set(scene1Ref.current, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          display: "flex",
          pointerEvents: "auto",
        });
      }
      if (b1BadgeRef.current) gsap.set(b1BadgeRef.current, { scale: 1, autoAlpha: 1 });
      if (b1CardRef.current) gsap.set(b1CardRef.current, { scale: 1, autoAlpha: 1 });

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
      if (b2CardRef.current) gsap.set(b2CardRef.current, { scale: 0.94, autoAlpha: 0 });

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
      if (b3CardRef.current) gsap.set(b3CardRef.current, { scale: 0.94, autoAlpha: 0 });

      // Master Scroll-Driven Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=2200",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.85,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      // -----------------------------------------------------------------------
      // PHASE 1: SCENE 1 IS ALREADY ACTIVE & VISIBLE (0.00 -> 0.28)
      // -----------------------------------------------------------------------

      // -----------------------------------------------------------------------
      // TRANSITION 1 -> 2: SCENE 1 EXITS, SCENE 2 ENTERS CENTER (0.28 -> 0.38)
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
          0.28
        );
        tl.set(scene1Ref.current, { display: "none", pointerEvents: "none" }, 0.38);
      }

      // -----------------------------------------------------------------------
      // PHASE 2: SCENE 2 (INTELLIGENT AUTOMATION - PURPLE) (0.34 -> 0.62)
      // -----------------------------------------------------------------------
      if (scene2Ref.current) {
        tl.set(scene2Ref.current, { display: "flex", pointerEvents: "auto" }, 0.32);
        tl.to(
          scene2Ref.current,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.14, ease: "power3.out" },
          0.34
        );
      }
      if (b2BadgeRef.current) {
        tl.to(
          b2BadgeRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.10, ease: "back.out(1.7)" },
          0.38
        );
      }
      if (b2CardRef.current) {
        tl.to(
          b2CardRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.12, ease: "power2.out" },
          0.36
        );
      }

      // -----------------------------------------------------------------------
      // TRANSITION 2 -> 3: SCENE 2 EXITS, SCENE 3 ENTERS (0.60 -> 0.70)
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
          0.60
        );
        tl.set(scene2Ref.current, { display: "none", pointerEvents: "none" }, 0.70);
      }

      // -----------------------------------------------------------------------
      // PHASE 3: SCENE 3 (ENQUIRY VISIBILITY - ELECTRIC BLUE) (0.66 -> 0.95)
      // -----------------------------------------------------------------------
      if (scene3Ref.current) {
        tl.set(scene3Ref.current, { display: "flex", pointerEvents: "auto" }, 0.64);
        tl.to(
          scene3Ref.current,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.14, ease: "power3.out" },
          0.66
        );
      }
      if (b3BadgeRef.current) {
        tl.to(
          b3BadgeRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.10, ease: "back.out(1.7)" },
          0.70
        );
      }
      if (b3CardRef.current) {
        tl.to(
          b3CardRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.12, ease: "power2.out" },
          0.68
        );
      }

      // Brief hold Scene 3 before release
      tl.to({}, { duration: 0.05 }, 0.90);
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
          <div className="inline-flex items-center gap-2 mb-2 sm:mb-2.5">
            <span className="w-5 sm:w-8 h-px bg-white/20" />
            <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.25em] uppercase text-[#9898A6]">
              EMPEROR NEXUS
            </span>
            <span className="w-5 sm:w-8 h-px bg-white/20" />
          </div>

          {/* Main Headline */}
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] tracking-tight uppercase leading-[1.1] text-white">
            DON&apos;T LET VALUABLE{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_24px_rgba(150,61,255,0.45)]">
              CONVERSATIONS
            </span>{" "}
            SLIP AWAY.
          </h2>

          {/* Supporting Description */}
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-[#C5C5D2] max-w-2xl mx-auto leading-relaxed font-normal">
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
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#9898A6]/80">
                  01 —
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-[#00D98B]">
                  CUSTOMER ENGAGEMENT
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-[2.85rem] xl:text-[3.25rem] tracking-tight text-white uppercase leading-[1.08]">
                NEVER MISS A{" "}
                <span className="text-[#00D98B] drop-shadow-[0_0_24px_rgba(0,217,139,0.45)]">
                  CONVERSATION.
                </span>
              </h3>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-[#C5C5D2] max-w-lg leading-relaxed font-normal">
                Answer customer questions instantly using your approved business information, even outside working hours.
              </p>
            </div>

            {/* Right: Floating Visual Card 1 (bg 4) */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-start">
              <div
                ref={b1CardRef}
                onClick={onOpenTrial}
                className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#00D98B] via-[#00D98B]/40 to-[#55A9FF] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(0,217,139,0.25),0_0_40px_rgba(85,169,255,0.2)] text-left w-full max-w-[460px] sm:max-w-[520px] lg:max-w-[560px] group overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                style={{
                  transform: "perspective(1200px) rotateY(4deg) rotateX(2deg)",
                }}
              >
                {/* Floating Emerald Badge with Chat Icon */}
                <div
                  ref={b1BadgeRef}
                  className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#080B15] border border-[#00D98B]/70 shadow-[0_0_20px_rgba(0,217,139,0.5)] flex items-center justify-center text-[#00D98B] will-change-transform z-20"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Top and Bottom edge reflections */}
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00D98B] to-transparent pointer-events-none z-20" />
                <div className="absolute -bottom-px left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#55A9FF] to-transparent pointer-events-none z-20" />

                {/* Inner Card Body with High-Res Visual bg 4 */}
                <div className="relative w-full rounded-[26.5px] overflow-hidden bg-[#080B15] border border-white/10 aspect-[16/10] sm:aspect-[16/9.5]">
                  <img
                    src="/bg4.png"
                    alt="Emperor Nexus Autonomous AI Customer Engagement"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  {/* Subtle glass reflection & vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/80 via-transparent to-white/5 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-48 h-32 bg-gradient-to-bl from-[#00D98B]/15 via-transparent to-transparent pointer-events-none" />

                  {/* Glass Info Pill */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#080B15]/85 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#00D98B] animate-pulse shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                        24/7 Autonomous AI Assistant
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#00D98B] uppercase tracking-wider shrink-0 ml-2">
                      Always Active
                    </span>
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
              <div className="flex items-center lg:justify-end gap-2 mb-2 sm:mb-3">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#9898A6]/80">
                  02 —
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-[#C28AFF]">
                  INTELLIGENT AUTOMATION
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-[2.85rem] xl:text-[3.25rem] tracking-tight text-white uppercase leading-[1.08]">
                LESS REPETITION.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#A855F7] to-[#963DFF] drop-shadow-[0_0_25px_rgba(150,61,255,0.45)]">
                  MORE FOCUS.
                </span>
              </h3>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-[#C5C5D2] max-w-lg lg:ml-auto leading-relaxed font-normal">
                Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business details.
              </p>
            </div>

            {/* Left: Floating Visual Card 2 (bg5) */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-end">
              <div
                ref={b2CardRef}
                onClick={onOpenTrial}
                className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#963DFF] via-[#C28AFF]/50 to-[#55A9FF] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(150,61,255,0.3),0_0_40px_rgba(85,169,255,0.2)] text-left w-full max-w-[460px] sm:max-w-[520px] lg:max-w-[560px] group overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                style={{
                  transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
                }}
              >
                {/* Floating Purple Badge with Zap Icon */}
                <div
                  ref={b2BadgeRef}
                  className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#080B15] border border-[#963DFF]/70 shadow-[0_0_20px_rgba(150,61,255,0.5)] flex items-center justify-center text-[#C28AFF] will-change-transform z-20"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>

                {/* Top and Bottom edge reflections */}
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#963DFF] to-transparent pointer-events-none z-20" />
                <div className="absolute -bottom-px left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#55A9FF] to-transparent pointer-events-none z-20" />

                {/* Inner Card Body with High-Res Visual bg5 */}
                <div className="relative w-full rounded-[26.5px] overflow-hidden bg-[#080B15] border border-white/10 aspect-[16/10] sm:aspect-[16/9.5]">
                  <img
                    src="/bg5.png"
                    alt="Emperor Nexus Intelligent Knowledge Automation"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  {/* Subtle glass reflection & vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/80 via-transparent to-white/5 pointer-events-none" />
                  <div className="absolute top-0 left-0 w-48 h-32 bg-gradient-to-br from-[#963DFF]/20 via-transparent to-transparent pointer-events-none" />

                  {/* Glass Info Pill */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#080B15]/85 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#C28AFF] animate-pulse shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                        Intelligent Knowledge Engine
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#C28AFF] uppercase tracking-wider shrink-0 ml-2">
                      100% Grounded
                    </span>
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
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#9898A6]/80">
                  03 —
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-[#55A9FF]">
                  ENQUIRY VISIBILITY
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-[2.85rem] xl:text-[3.25rem] tracking-tight text-white uppercase leading-[1.08]">
                SEE WHAT YOUR{" "}
                <span className="text-[#55A9FF] drop-shadow-[0_0_25px_rgba(85,169,255,0.45)]">
                  CUSTOMERS NEED.
                </span>
              </h3>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-[#C5C5D2] max-w-lg leading-relaxed font-normal">
                View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for in real-time.
              </p>
            </div>

            {/* Right: Floating Visual Card 3 (bg6) */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-start">
              <div
                ref={b3CardRef}
                onClick={onOpenTrial}
                className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#38BDF8] via-[#818CF8]/50 to-[#C084FC] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(56,189,248,0.25),0_0_40px_rgba(192,132,252,0.25)] text-left w-full max-w-[460px] sm:max-w-[520px] lg:max-w-[560px] group overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                style={{
                  transform: "perspective(1200px) rotateX(2deg)",
                }}
              >
                {/* Floating Cyan/Blue Badge with BarChart3 Icon */}
                <div
                  ref={b3BadgeRef}
                  className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#080B15] border border-[#38BDF8]/70 shadow-[0_0_20px_rgba(56,189,248,0.5)] flex items-center justify-center text-[#38BDF8] will-change-transform z-20"
                >
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Top and Bottom edge luminous reflections */}
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent pointer-events-none z-20" />
                <div className="absolute -bottom-px left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#C084FC] to-transparent pointer-events-none z-20" />

                {/* Inner Card Body with High-Res Visual bg6 */}
                <div className="relative w-full rounded-[26.5px] overflow-hidden bg-[#080B15] border border-white/10 aspect-[16/10] sm:aspect-[16/9.5]">
                  <img
                    src="/bg6.png"
                    alt="Emperor Nexus Enquiry Visibility & Analytics"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  {/* Subtle glass reflection & vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/80 via-transparent to-white/5 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-48 h-32 bg-gradient-to-bl from-[#38BDF8]/15 via-transparent to-transparent pointer-events-none" />

                  {/* Glass Info Pill */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#080B15]/85 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                        Real-Time Enquiry Intelligence
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider shrink-0 ml-2">
                      Instant Lead Sync
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
