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
      if (b1Msg1Ref.current) gsap.set(b1Msg1Ref.current, { autoAlpha: 1, x: 0 });
      if (b1Msg2Ref.current) gsap.set(b1Msg2Ref.current, { autoAlpha: 1, x: 0 });
      if (b1BadgeRef.current) gsap.set(b1BadgeRef.current, { scale: 1, autoAlpha: 1 });

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
      if (b2ItemsRef.current) {
        tl.to(
          b2ItemsRef.current.children,
          { autoAlpha: 1, y: 0, duration: 0.10, stagger: 0.03, ease: "power2.out" },
          0.40
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
      if (b3BarsRef.current) {
        tl.to(
          b3BarsRef.current.children,
          { scaleY: 1, duration: 0.12, stagger: 0.02, ease: "power2.out" },
          0.72
        );
      }
      if (b3LeadsRef.current) {
        tl.to(
          b3LeadsRef.current.children,
          { autoAlpha: 1, x: 0, duration: 0.10, stagger: 0.03, ease: "power2.out" },
          0.75
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

            {/* Right: Floating Realistic Chatbot Interface */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-start">
              <div
                className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#00D98B] via-[#00D98B]/40 to-[#55A9FF] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(0,217,139,0.22),0_0_40px_rgba(85,169,255,0.2)] text-left w-full max-w-[380px] sm:max-w-[420px]"
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
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00D98B] to-transparent pointer-events-none" />
                <div className="absolute -bottom-px left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#55A9FF] to-transparent pointer-events-none" />

                {/* Inner Card Body */}
                <div className="relative w-full rounded-[26.5px] p-4 sm:p-5 bg-[#080B15]/95 backdrop-blur-2xl overflow-hidden">
                  {/* Subtle ambient internal gradient sheen */}
                  <div className="absolute top-0 right-0 w-56 h-36 bg-gradient-to-bl from-[#00D98B]/10 via-[#55A9FF]/5 to-transparent pointer-events-none" />

                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3 relative z-10">
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
                  <div className="space-y-2.5 relative z-10">
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
                  <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-white/30 text-[11px] font-sans relative z-10">
                    <span>Ask Emperor Nexus a question...</span>
                    <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                      <ArrowRight className="w-3 h-3" />
                    </div>
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

            {/* Left: Floating Business Knowledge Interface */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-end">
              <div
                className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#963DFF] via-[#C28AFF]/50 to-[#55A9FF] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(150,61,255,0.25),0_0_40px_rgba(85,169,255,0.2)] text-left w-full max-w-[380px] sm:max-w-[420px]"
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
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#963DFF] to-transparent pointer-events-none" />
                <div className="absolute -bottom-px left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#55A9FF] to-transparent pointer-events-none" />

                {/* Inner Card Body */}
                <div className="relative w-full rounded-[26.5px] p-4 sm:p-5 bg-[#080B15]/95 backdrop-blur-2xl overflow-hidden">
                  {/* Subtle ambient internal gradient sheen */}
                  <div className="absolute top-0 right-0 w-56 h-36 bg-gradient-to-bl from-[#963DFF]/10 via-[#55A9FF]/5 to-transparent pointer-events-none" />

                  {/* Knowledge Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3 relative z-10">
                    <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                      Business Knowledge
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#963DFF]/20 text-[#C28AFF] border border-[#963DFF]/40">
                      100% Grounded
                    </span>
                  </div>

                  {/* Document Rows */}
                  <div ref={b2ItemsRef} className="space-y-2 relative z-10">
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

            {/* Right: Floating Business Dashboard Interface (Matching Image 2 Reference) */}
            <div className="w-full lg:w-[58%] flex justify-center lg:justify-start">
              <div
                className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#38BDF8] via-[#818CF8]/50 to-[#C084FC] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(56,189,248,0.22),0_0_40px_rgba(192,132,252,0.25)] text-left w-full max-w-[420px] sm:max-w-[460px]"
                style={{
                  transform: "perspective(1200px) rotateX(2deg)",
                }}
              >
                {/* Top and Bottom edge luminous reflections */}
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent pointer-events-none" />
                <div className="absolute -bottom-px left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#C084FC] to-transparent pointer-events-none" />

                {/* Inner Card Body */}
                <div className="relative w-full rounded-[26.5px] p-4 sm:p-5 bg-[#080B15]/95 backdrop-blur-2xl overflow-hidden">
                  {/* Subtle ambient internal gradient sheen */}
                  <div className="absolute top-0 right-0 w-64 h-40 bg-gradient-to-bl from-[#818CF8]/10 via-[#C084FC]/5 to-transparent pointer-events-none" />

                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-3.5 relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Blue/Indigo Icon Box */}
                      <div
                        ref={b3BadgeRef}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#4338CA] border border-[#60A5FA]/40 shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center will-change-transform shrink-0"
                      >
                        {/* Custom Bar Chart Icon matching target image */}
                        <div className="flex items-end gap-1 h-5">
                          <span className="w-1 h-2.5 bg-white rounded-full" />
                          <span className="w-1 h-5 bg-white rounded-full" />
                          <span className="w-1 h-3.5 bg-white rounded-full" />
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                          Enquiries
                        </h4>
                        <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 font-normal leading-tight">
                          Customer conversations &amp; leads
                        </p>
                      </div>
                    </div>

                    {/* Right: 3 Dots Menu */}
                    <div className="flex items-center gap-1 text-white/30 px-1 py-0.5 shrink-0">
                      <span className="w-1 h-1 rounded-full bg-white/40" />
                      <span className="w-1 h-1 rounded-full bg-white/40" />
                      <span className="w-1 h-1 rounded-full bg-white/40" />
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="relative rounded-2xl bg-[#060812]/90 border border-white/[0.08] p-3 sm:p-3.5 mb-3 overflow-hidden">
                    {/* SVG Trend Wave Curve */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                      viewBox="0 0 350 90"
                      preserveAspectRatio="none"
                      fill="none"
                    >
                      <path
                        d="M 12,66 C 22,64 26,60 32,60 C 52,60 62,40 80,40 C 98,40 108,52 128,52 C 148,52 158,26 176,26 C 196,26 206,40 224,40 C 244,40 254,16 272,16 C 292,16 304,6 320,6"
                        stroke="#38BDF8"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className="opacity-75 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                      />
                    </svg>

                    {/* 7 Bars */}
                    <div
                      ref={b3BarsRef}
                      className="flex items-end justify-between gap-2 sm:gap-2.5 h-20 sm:h-24 px-1 sm:px-2 relative z-0"
                    >
                      {/* Bar 1 */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full max-w-[34px] h-[34%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#1E40AF] to-[#60A5FA] shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                        />
                      </div>

                      {/* Bar 2 */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full max-w-[34px] h-[54%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#2563EB] to-[#60A5FA] shadow-[0_0_12px_rgba(59,130,246,0.35)] transition-all duration-300"
                        />
                      </div>

                      {/* Bar 3 */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full max-w-[34px] h-[40%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#6D28D9] to-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.3)] transition-all duration-300"
                        />
                      </div>

                      {/* Bar 4 */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full max-w-[34px] h-[70%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#7C3AED] to-[#C084FC] shadow-[0_0_14px_rgba(192,132,252,0.4)] transition-all duration-300"
                        />
                      </div>

                      {/* Bar 5 */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full max-w-[34px] h-[52%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#6D28D9] to-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.3)] transition-all duration-300"
                        />
                      </div>

                      {/* Bar 6 */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full max-w-[34px] h-[80%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#2563EB] to-[#60A5FA] shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300"
                        />
                      </div>

                      {/* Bar 7 (Peak with Beacon Dot) */}
                      <div className="flex-1 flex flex-col items-center h-full justify-end relative">
                        {/* Glowing Beacon Dot on Peak */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center z-20 pointer-events-none">
                          <span className="absolute w-4 h-4 rounded-full bg-[#38BDF8]/40 animate-ping" />
                          <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-[#38BDF8] shadow-[0_0_12px_#38BDF8]" />
                        </div>
                        <div
                          className="w-full max-w-[34px] h-[95%] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-[#4F46E5] via-[#2563EB] to-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Enquiry Rows */}
                  <div ref={b3LeadsRef} className="space-y-2 relative z-10">
                    {/* Row 1: John D. */}
                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#55A9FF]/30 transition-colors">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#312E81] to-[#4338CA] border border-[#6366F1]/40 flex items-center justify-center text-white text-[11px] sm:text-xs font-bold tracking-tight shadow-[0_0_10px_rgba(99,102,241,0.3)] shrink-0">
                          JD
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-semibold text-white leading-tight">
                            John D.
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-0.5 leading-none">
                            Request for product demo
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 rounded-full bg-[#1E293B]/80 text-[#60A5FA] border border-[#3B82F6]/30 shadow-sm shrink-0">
                        New Enquiry
                      </span>
                    </div>

                    {/* Row 2: Emily S. */}
                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#00D98B]/30 transition-colors">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#064E3B] to-[#047857] border border-[#10B981]/40 flex items-center justify-center text-white text-[11px] sm:text-xs font-bold tracking-tight shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0">
                          ES
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-semibold text-white leading-tight">
                            Emily S.
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-0.5 leading-none">
                            Pricing and implementation details
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 rounded-full bg-[#064E3B]/60 text-[#34D399] border border-[#10B981]/40 flex items-center gap-1.5 shadow-sm shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Qualified Lead
                      </span>
                    </div>
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
