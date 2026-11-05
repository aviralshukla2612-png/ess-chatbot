"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const headerRef = useRef(null);
  const bgWaveRef = useRef(null);

  // Scene 1: Customer Engagement (Image 1: bg4.png)
  const scene1Ref = useRef(null);
  const b1CardRef = useRef(null);

  // Scene 2: Intelligent Automation (Image 2: bg5.png)
  const scene2Ref = useRef(null);
  const b2CardRef = useRef(null);

  // Scene 3: Enquiry Visibility (Image 3: bg6.png)
  const scene3Ref = useRef(null);
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
      if (b1CardRef.current) gsap.set(b1CardRef.current, { scale: 1, autoAlpha: 1 });

      // Scene 2: Hidden initially
      if (scene2Ref.current) {
        gsap.set(scene2Ref.current, {
          autoAlpha: 0,
          y: 50,
          scale: 0.95,
          display: "none",
          pointerEvents: "none",
        });
      }
      if (b2CardRef.current) gsap.set(b2CardRef.current, { scale: 0.95, autoAlpha: 0 });

      // Scene 3: Hidden initially
      if (scene3Ref.current) {
        gsap.set(scene3Ref.current, {
          autoAlpha: 0,
          y: 50,
          scale: 0.95,
          display: "none",
          pointerEvents: "none",
        });
      }
      if (b3CardRef.current) gsap.set(b3CardRef.current, { scale: 0.95, autoAlpha: 0 });

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
      if (b2CardRef.current) {
        tl.to(
          b2CardRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.14, ease: "power2.out" },
          0.35
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
      if (b3CardRef.current) {
        tl.to(
          b3CardRef.current,
          { scale: 1, autoAlpha: 1, duration: 0.14, ease: "power2.out" },
          0.67
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
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between pt-14 sm:pt-16 lg:pt-14 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto"
      >
        {/* ===================================================================== */}
        {/* SECTION HEADER: COMPACT, BALANCED EDITORIAL TYPOGRAPHY                */}
        {/* ===================================================================== */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto shrink-0 mb-2 sm:mb-3 will-change-transform"
        >
          {/* Eyebrow (Section label: Space Mono) */}
          <div className="inline-flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="w-5 sm:w-8 h-px bg-white/20" />
            <span className="text-[11px] sm:text-xs font-space-mono font-bold tracking-[0.25em] uppercase text-[#9898A6]">
              EMPEROR NEXUS
            </span>
            <span className="w-5 sm:w-8 h-px bg-white/20" />
          </div>

          {/* Main Headline (Heading: Playfair Display) */}
          <h2 className="font-playfair font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] tracking-normal uppercase leading-tight text-white">
            DON&apos;T LET VALUABLE{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_20px_rgba(150,61,255,0.4)]">
              CONVERSATIONS
            </span>{" "}
            SLIP AWAY.
          </h2>

          {/* Supporting Description (Body: Inter) */}
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#9898A6] max-w-xl mx-auto leading-relaxed font-inter font-normal">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* CENTER STAGE: SCENE SWAPPING CONTAINER (NO CUTOFF, 100% IN VIEW!)     */}
        {/* ===================================================================== */}
        <div className="relative w-full flex-1 flex items-center justify-center my-auto min-h-[300px] sm:min-h-[340px] max-w-[1240px] mx-auto">
          {/* ------------------------------------------------------------------- */}
          {/* SCENE 01: CUSTOMER ENGAGEMENT (IMAGE 1: bg4.png - ONLY IMAGE)       */}
          {/* ------------------------------------------------------------------- */}
          <div
            ref={scene1Ref}
            className="w-full lg:absolute lg:inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 will-change-transform py-2 lg:py-0"
          >
            {/* Left: Editorial Text Block */}
            <div className="w-full lg:w-[46%] text-left pl-2 sm:pl-4 lg:pl-6">
              {/* Section label: Space Mono */}
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="font-space-mono text-xs font-bold tracking-widest text-[#9898A6]/80">
                  01 —
                </span>
                <span className="text-xs font-space-mono font-bold tracking-widest uppercase text-[#00D98B]">
                  CUSTOMER ENGAGEMENT
                </span>
              </div>
              {/* Heading: Playfair Display */}
              <h3 className="font-playfair font-bold text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.35rem] tracking-normal text-white uppercase leading-[1.18]">
                NEVER MISS A{" "}
                <span className="text-[#00D98B] drop-shadow-[0_0_20px_rgba(0,217,139,0.4)]">
                  CONVERSATION.
                </span>
              </h3>
              {/* Body: Inter */}
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-[15px] lg:text-base text-[#9898A6] max-w-md leading-relaxed font-inter font-normal">
                Answer customer questions instantly using your approved business information, even outside working hours.
              </p>
            </div>

            {/* Right: Floating Visual 1 (bg 4 - Only Image) */}
            <div className="w-full lg:w-[54%] flex justify-center lg:justify-start">
              <div
                ref={b1CardRef}
                onClick={onOpenTrial}
                className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-[580px] cursor-pointer group select-none transition-transform duration-500 hover:scale-[1.03]"
                style={{
                  transform: "perspective(1200px) rotateY(4deg) rotateX(2deg)",
                }}
              >
                {/* Ambient glow behind mascot */}
                <div className="absolute inset-0 bg-[#00D98B]/15 blur-[80px] rounded-full scale-75 pointer-events-none group-hover:scale-90 transition-transform duration-700" />
                <img
                  src="/bg4.png"
                  alt="Emperor Nexus Autonomous AI Customer Engagement"
                  className="relative z-10 w-full h-auto object-contain rounded-2xl sm:rounded-3xl drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SCENE 02: INTELLIGENT AUTOMATION (IMAGE 2: bg5.png - ONLY IMAGE)    */}
          {/* ------------------------------------------------------------------- */}
          <div
            ref={scene2Ref}
            className="w-full lg:absolute lg:inset-0 flex flex-col lg:flex-row-reverse items-center justify-center gap-6 sm:gap-8 lg:gap-12 will-change-transform py-2 lg:py-0"
          >
            {/* Right: Editorial Text Block */}
            <div className="w-full lg:w-[46%] text-left lg:text-right pr-2 sm:pr-4 lg:pr-6">
              {/* Section label: Space Mono */}
              <div className="flex items-center lg:justify-end gap-2 mb-1.5 sm:mb-2">
                <span className="font-space-mono text-xs font-bold tracking-widest text-[#9898A6]/80">
                  02 —
                </span>
                <span className="text-xs font-space-mono font-bold tracking-widest uppercase text-[#C28AFF]">
                  INTELLIGENT AUTOMATION
                </span>
              </div>
              {/* Heading: Playfair Display */}
              <h3 className="font-playfair font-bold text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.35rem] tracking-normal text-white uppercase leading-[1.18]">
                LESS REPETITION.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#A855F7] to-[#963DFF] drop-shadow-[0_0_20px_rgba(150,61,255,0.45)]">
                  MORE FOCUS.
                </span>
              </h3>
              {/* Body: Inter */}
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-[15px] lg:text-base text-[#9898A6] max-w-md lg:ml-auto leading-relaxed font-inter font-normal">
                Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business details.
              </p>
            </div>

            {/* Left: Floating Visual 2 (bg5 - Only Image) */}
            <div className="w-full lg:w-[54%] flex justify-center lg:justify-end">
              <div
                ref={b2CardRef}
                onClick={onOpenTrial}
                className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-[580px] cursor-pointer group select-none transition-transform duration-500 hover:scale-[1.03]"
                style={{
                  transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
                }}
              >
                {/* Ambient glow behind mascot */}
                <div className="absolute inset-0 bg-[#963DFF]/20 blur-[80px] rounded-full scale-75 pointer-events-none group-hover:scale-90 transition-transform duration-700" />
                <img
                  src="/bg5.png"
                  alt="Emperor Nexus Intelligent Knowledge Automation"
                  className="relative z-10 w-full h-auto object-contain rounded-2xl sm:rounded-3xl drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SCENE 03: ENQUIRY VISIBILITY (IMAGE 3: bg6.png - ONLY IMAGE)        */}
          {/* ------------------------------------------------------------------- */}
          <div
            ref={scene3Ref}
            className="w-full lg:absolute lg:inset-0 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 will-change-transform py-2 lg:py-0"
          >
            {/* Left: Editorial Text Block */}
            <div className="w-full lg:w-[46%] text-left pl-2 sm:pl-4 lg:pl-6">
              {/* Section label: Space Mono */}
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="font-space-mono text-xs font-bold tracking-widest text-[#9898A6]/80">
                  03 —
                </span>
                <span className="text-xs font-space-mono font-bold tracking-widest uppercase text-[#55A9FF]">
                  ENQUIRY VISIBILITY
                </span>
              </div>
              {/* Heading: Playfair Display */}
              <h3 className="font-playfair font-bold text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.35rem] tracking-normal text-white uppercase leading-[1.18]">
                SEE WHAT YOUR{" "}
                <span className="text-[#55A9FF] drop-shadow-[0_0_20px_rgba(85,169,255,0.45)]">
                  CUSTOMERS NEED.
                </span>
              </h3>
              {/* Body: Inter */}
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-[15px] lg:text-base text-[#9898A6] max-w-md leading-relaxed font-inter font-normal">
                View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for in real-time.
              </p>
            </div>

            {/* Right: Floating Visual 3 (bg6 - Only Image) */}
            <div className="w-full lg:w-[54%] flex justify-center lg:justify-start">
              <div
                ref={b3CardRef}
                onClick={onOpenTrial}
                className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-[580px] cursor-pointer group select-none transition-transform duration-500 hover:scale-[1.03]"
                style={{
                  transform: "perspective(1200px) rotateX(2deg)",
                }}
              >
                {/* Ambient glow behind mascot */}
                <div className="absolute inset-0 bg-[#38BDF8]/20 blur-[80px] rounded-full scale-75 pointer-events-none group-hover:scale-90 transition-transform duration-700" />
                <img
                  src="/bg6.png"
                  alt="Emperor Nexus Enquiry Visibility & Analytics"
                  className="relative z-10 w-full h-auto object-contain rounded-2xl sm:rounded-3xl drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
