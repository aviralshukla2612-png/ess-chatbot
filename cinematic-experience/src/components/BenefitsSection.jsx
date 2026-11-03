import React, { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck,
  Check,
  Sparkles,
  TrendingUp,
  Zap,
  Bot,
  Clock,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Explosive vector generator for 3D headline typography shatter
function computeShatterVectors(lineWords, isTopLine) {
  let charCount = 0;
  const list = [];
  lineWords.forEach((word, wIdx) => {
    word.split("").forEach((char) => {
      list.push({ char, wIdx, overallIdx: charCount++ });
    });
  });

  const total = list.length;
  const mid = (total - 1) / 2;

  return list.map(({ char, wIdx, overallIdx }, i) => {
    const relX = (i - mid) / (mid || 1); // -1.0 (far left) to +1.0 (far right)
    const signX = relX >= 0 ? 1 : -1;
    const seed = ((i * 19 + (isTopLine ? 31 : 53)) % 17) / 17;
    const seed2 = ((i * 23 + (isTopLine ? 13 : 47)) % 13) / 13;

    // Physical directional blast: characters fly outward with heavy 3D rotation and depth
    const x = Math.round(signX * (380 + Math.abs(relX) * 480) + (seed - 0.5) * 180);
    const y = Math.round(
      isTopLine
        ? -260 - Math.abs(relX) * 220 - seed * 260
        : 220 + Math.abs(relX) * 180 + seed2 * 240
    );
    const z = Math.round((seed - 0.5) * 600); // 3D depth towards/away from camera
    const rotateX = Math.round((seed - 0.5) * 280);
    const rotateY = Math.round(signX * (60 + seed * 140));
    const rotateZ = Math.round(signX * (45 + seed2 * 120));
    const scale = Number((0.6 + seed * 0.9).toFixed(2));

    return {
      char,
      wIdx,
      overallIdx,
      x,
      y,
      z,
      rotateX,
      rotateY,
      rotateZ,
      scale,
    };
  });
}

const HEADLINE_LINE1 = ["EVERY", "CONVERSATION"];
const HEADLINE_LINE2 = ["CREATES", "REVENUE."];
const SLATS_COUNT = 6;

export default function BenefitsSection({ onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const darkSceneRef = useRef(null);
  const lightSceneRef = useRef(null);
  const bgVisualRef = useRef(null);
  const slatRefs = useRef([]);

  // Headline character refs
  const l1CharRefs = useRef([]);
  const l2CharRefs = useRef([]);

  // Three card refs
  const cardsWrapperRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);

  // Compute character vector physics
  const l1Vectors = useMemo(() => computeShatterVectors(HEADLINE_LINE1, true), []);
  const l2Vectors = useMemo(() => computeShatterVectors(HEADLINE_LINE2, false), []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const ctx = gsap.context(() => {
      // Respect user's motion preferences
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.innerWidth < 1024;

      if (prefersReducedMotion) {
        // Simplified non-scrolling or static state
        gsap.set(darkSceneRef.current, { display: "none" });
        gsap.set(lightSceneRef.current, { opacity: 1 });
        [card1Ref.current, card2Ref.current, card3Ref.current].forEach((card) => {
          if (card) gsap.set(card, { opacity: 1, x: 0, y: 0, scale: 1 });
        });
        return;
      }

      // Initial States
      gsap.set(darkSceneRef.current, { opacity: 1, visibility: "visible" });
      gsap.set(lightSceneRef.current, { opacity: 1 }); // Visible through slats
      if (bgVisualRef.current) {
        gsap.set(bgVisualRef.current, { scale: 1, rotation: 0, opacity: 0.85 });
      }

      // Characters start intact
      l1CharRefs.current.forEach((el) => {
        if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1 });
      });
      l2CharRefs.current.forEach((el) => {
        if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1 });
      });

      // Horizontal shutter slats start flush across the viewport
      slatRefs.current.forEach((slat) => {
        if (slat) gsap.set(slat, { xPercent: 0, rotationZ: 0, skewX: 0 });
      });

      // Cards initial state (Phase A hidden/perspective)
      if (card1Ref.current) {
        gsap.set(card1Ref.current, {
          x: isMobile ? 0 : -220,
          y: isMobile ? 40 : 0,
          z: isMobile ? 0 : -140,
          rotationY: isMobile ? 0 : 28,
          rotationZ: isMobile ? 0 : -3,
          scale: 0.88,
          opacity: 0,
          transformPerspective: 1200,
        });
      }
      if (card2Ref.current) {
        gsap.set(card2Ref.current, {
          x: 0,
          y: isMobile ? 40 : 0,
          z: isMobile ? 0 : -180,
          scale: 0.82,
          opacity: 0,
          transformPerspective: 1200,
        });
      }
      if (card3Ref.current) {
        gsap.set(card3Ref.current, {
          x: isMobile ? 0 : 220,
          y: isMobile ? 40 : 0,
          z: isMobile ? 0 : -140,
          rotationY: isMobile ? 0 : -28,
          rotationZ: isMobile ? 0 : 3,
          scale: 0.88,
          opacity: 0,
          transformPerspective: 1200,
        });
      }

      // ============================================================
      // MASTER COORDINATED GSAP SCROLLTRIGGER TIMELINE
      // Progression:
      //  0% - 15%: Dark hero and oversized headline stable
      // 15% - 35%: Headline fragments begin moving & shutter effect starts
      // 35% - 55%: Dark scene breaks apart and light section is revealed
      // 55% - 75%: Phase A - Three cards emerge with depth and staggered movement
      // 75% - 90%: Phase B - Cards settle into balanced three-column composition
      // 90% - 100%: Phase C - Final composition remains visible and rock-solid
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=3200",
          pin: stage,
          pinSpacing: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // --- 1. SUBTLE 3D VISUAL ELEMENT DYNAMICS (0.05 -> 0.40) ---
      if (bgVisualRef.current) {
        tl.to(
          bgVisualRef.current,
          {
            scale: 1.6,
            rotation: 120,
            opacity: 0,
            duration: 0.35,
            ease: "power2.inOut",
          },
          0.10
        );
      }

      // --- 2. HEADLINE CHARACTER SHATTER ANIMATION (0.15 -> 0.45) ---
      const multX = isMobile ? 0.35 : 1;
      const multY = isMobile ? 0.35 : 1;

      l1Vectors.forEach((v, idx) => {
        const el = l1CharRefs.current[idx];
        if (!el) return;
        const delayOffset = 0.15 + (idx / l1Vectors.length) * 0.08;
        tl.to(
          el,
          {
            x: v.x * multX,
            y: v.y * multY,
            z: v.z,
            rotateX: v.rotateX,
            rotateY: v.rotateY,
            rotateZ: v.rotateZ,
            scale: v.scale,
            opacity: 0,
            filter: "blur(6px)",
            duration: 0.28,
            ease: "power3.in",
          },
          delayOffset
        );
      });

      l2Vectors.forEach((v, idx) => {
        const el = l2CharRefs.current[idx];
        if (!el) return;
        const delayOffset = 0.17 + (idx / l2Vectors.length) * 0.08;
        tl.to(
          el,
          {
            x: v.x * multX,
            y: v.y * multY,
            z: v.z,
            rotateX: v.rotateX,
            rotateY: v.rotateY,
            rotateZ: v.rotateZ,
            scale: v.scale,
            opacity: 0,
            filter: "blur(6px)",
            duration: 0.28,
            ease: "power3.in",
          },
          delayOffset
        );
      });

      // --- 3. HORIZONTAL SHUTTER SLATS BREAKAWAY (0.18 -> 0.52) ---
      slatRefs.current.forEach((slat, idx) => {
        if (!slat) return;
        const isEven = idx % 2 === 0;
        const targetXPercent = isEven ? -112 : 112;
        const targetRotate = isEven ? -2.5 : 2.5;
        const targetSkew = isEven ? -3 : 3;
        const slatStart = 0.18 + idx * 0.038;

        tl.to(
          slat,
          {
            xPercent: targetXPercent,
            rotationZ: targetRotate,
            skewX: targetSkew,
            duration: 0.28,
            ease: "power2.inOut",
          },
          slatStart
        );
      });

      // Dark Scene Root Container fades out completely as slats clear
      tl.to(
        darkSceneRef.current,
        {
          opacity: 0,
          pointerEvents: "none",
          duration: 0.10,
          ease: "power1.out",
        },
        0.50
      );

      // --- 4. PHASE A: THREE-CARD EMERGENCE (0.55 -> 0.75) ---
      // Left Card (Card 1) sweeps in from left with 3D perspective
      if (card1Ref.current) {
        tl.to(
          card1Ref.current,
          {
            x: isMobile ? 0 : -50,
            y: 0,
            z: isMobile ? 0 : -40,
            rotationY: isMobile ? 0 : 12,
            rotationZ: isMobile ? 0 : -1.5,
            scale: isMobile ? 1 : 0.96,
            opacity: 1,
            duration: 0.20,
            ease: "power2.out",
          },
          0.55
        );
      }

      // Middle Card (Card 2 - Hero Light) emerges with scale and depth
      if (card2Ref.current) {
        tl.to(
          card2Ref.current,
          {
            y: 0,
            z: isMobile ? 0 : 30,
            scale: isMobile ? 1 : 1.05,
            opacity: 1,
            duration: 0.20,
            ease: "power2.out",
          },
          0.58
        );
      }

      // Right Card (Card 3) sweeps in from right with 3D perspective
      if (card3Ref.current) {
        tl.to(
          card3Ref.current,
          {
            x: isMobile ? 0 : 50,
            y: 0,
            z: isMobile ? 0 : -40,
            rotationY: isMobile ? 0 : -12,
            rotationZ: isMobile ? 0 : 1.5,
            scale: isMobile ? 1 : 0.96,
            opacity: 1,
            duration: 0.20,
            ease: "power2.out",
          },
          0.61
        );
      }

      // --- 5. PHASE B: SETTLING INTO BALANCED 3-COLUMN COMPOSITION (0.75 -> 0.90) ---
      if (card1Ref.current) {
        tl.to(
          card1Ref.current,
          {
            x: 0,
            y: 0,
            z: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1,
            duration: 0.15,
            ease: "power2.out",
          },
          0.75
        );
      }

      if (card2Ref.current) {
        tl.to(
          card2Ref.current,
          {
            z: 0,
            scale: 1,
            duration: 0.15,
            ease: "power2.out",
          },
          0.76
        );
      }

      if (card3Ref.current) {
        tl.to(
          card3Ref.current,
          {
            x: 0,
            y: 0,
            z: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1,
            duration: 0.15,
            ease: "power2.out",
          },
          0.77
        );
      }

      // --- 6. PHASE C: COMPOSITION STABILIZES SOLIDLY THROUGH 100% (0.90 -> 1.00) ---
      // Timeline maintains final resting composition through end of scroll runway
      tl.to(
        {},
        {
          duration: 0.10,
        },
        0.90
      );
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [l1Vectors, l2Vectors]);

  return (
    <section
      id="benefits"
      ref={sectionRef}
      className="relative w-full bg-[#050507] overflow-hidden"
    >
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      >
        {/* ========================================================= */}
        {/* LAYER 0 (UNDERNEATH): REVEALED CLEAN LIGHT SECTION        */}
        {/* ========================================================= */}
        <div
          ref={lightSceneRef}
          className="absolute inset-0 w-full h-full bg-[#F4F4F6] text-[#0B0B10] flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-8 z-0 overflow-hidden select-none"
        >
          {/* Subtle Ambient Background Polish */}
          <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/[0.04] to-transparent pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-200/35 rounded-full blur-[140px] pointer-events-none" />

          {/* Section Heading & Subtext */}
          <div className="relative z-10 max-w-4xl mx-auto text-center pt-2 sm:pt-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/[0.04] border border-black/[0.08] text-[#963DFF] text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Key Capabilities</span>
            </div>

            <h2 className="font-headline tracking-normal text-[#0B0B10] uppercase text-3xl sm:text-5xl lg:text-6xl font-black leading-tight">
              Every Conversation Creates an Opportunity.
            </h2>

            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-[#52525C] max-w-2xl mx-auto leading-relaxed font-normal">
              Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
            </p>
          </div>

          {/* Three-Card Composition (Trionn-Style: Dark - Light Center - Dark) */}
          <div
            ref={cardsWrapperRef}
            className="relative z-10 max-w-7xl mx-auto w-full my-auto px-2 sm:px-4"
            style={{ perspective: "1400px" }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7 items-stretch">
              {/* ================================================= */}
              {/* CARD 1 — 24/7 AVAILABILITY (DARK CARD)             */}
              {/* ================================================= */}
              <div
                ref={card1Ref}
                className="group relative rounded-3xl bg-[#0B0B10] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 transition-all duration-300 min-h-[380px] lg:h-[460px] xl:h-[475px] overflow-hidden"
              >
                {/* Subtle Ambient Glow */}
                <div className="absolute -top-20 -left-20 w-44 h-44 bg-[#55A9FF]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Category Pill */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#55A9FF]">
                      01 / ALWAYS ON
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Response
                    </span>
                  </div>

                  {/* Large Heading & Title */}
                  <div className="mt-3">
                    <div className="font-headline font-black text-4xl sm:text-5xl text-white tracking-tight">
                      24/7
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-white/95 mt-1">
                      24/7 Availability
                    </h3>
                    <p className="text-xs text-[#9898A6] mt-1.5 leading-relaxed">
                      Your business information stays accessible, even outside working hours.
                    </p>
                  </div>
                </div>

                {/* Premium Chat Interface Mockup */}
                <div className="relative z-10 mt-4 bg-[#12121A] rounded-2xl p-3.5 border border-white/[0.06] space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-[#9898A6] border-b border-white/[0.05] pb-1.5">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3 text-[#55A9FF]" />
                      Emperor Assistant
                    </span>
                    <span className="font-mono text-[9px] text-[#9898A6]/70">11:42 PM</span>
                  </div>

                  {/* Visitor Query Bubble */}
                  <div className="bg-white/[0.08] text-white/90 rounded-xl rounded-tr-xs p-2.5 text-[11px] leading-snug max-w-[90%] ml-auto shadow-sm">
                    Can I schedule an executive consultation for tomorrow at 3 PM?
                  </div>

                  {/* Assistant Response Bubble */}
                  <div className="bg-gradient-to-r from-[#963DFF]/25 to-[#55A9FF]/15 border border-[#963DFF]/30 text-white rounded-xl rounded-tl-xs p-2.5 text-[11px] leading-snug max-w-[94%] shadow-sm">
                    <p>
                      Absolutely! I&apos;ve reserved 3:00 PM tomorrow with our senior specialist. A confirmation is on its way.
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-[#C28AFF] font-medium">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Grounded Vector Retrieval</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* CARD 2 — LESS MANUAL WORK (LIGHT CENTRAL CARD)     */}
              {/* ================================================= */}
              <div
                ref={card2Ref}
                className="group relative rounded-3xl bg-white border-2 border-black/[0.08] p-6 sm:p-7 flex flex-col justify-between shadow-[0_25px_65px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300 min-h-[380px] lg:h-[460px] xl:h-[475px] overflow-hidden"
              >
                {/* Subtle Ambient Radial Highlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center">
                  {/* Category Pill */}
                  <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#963DFF] px-2.5 py-0.5 rounded-full bg-[#963DFF]/10">
                    02 / AUTOMATION
                  </span>

                  {/* Title & Description */}
                  <h3 className="font-headline font-black text-2xl sm:text-3xl text-[#0B0B10] tracking-tight mt-2.5">
                    Less Manual Work
                  </h3>
                  <p className="text-xs text-[#52525C] mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Handle repetitive customer questions without answering every query manually.
                  </p>
                </div>

                {/* Central Visual: Large Typographic AI & Orbital Conversational Chips */}
                <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                    {/* Pulsing Orbital Halo */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#963DFF]/30 bg-gradient-to-tr from-[#963DFF]/15 via-purple-50 to-[#55A9FF]/15 animate-spin-slow" />

                    {/* Core White Circular Disc */}
                    <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] border border-black/[0.06] flex items-center justify-center">
                      <span className="font-headline font-black text-5xl sm:text-6xl text-[#0B0B10] tracking-tighter select-none">
                        AI
                      </span>
                    </div>

                    {/* Integrated Conversational Chips */}
                    <div className="absolute -top-1 -right-2 bg-black text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-[#D6FD84]" />
                      <span>FAQs Handled</span>
                    </div>

                    <div className="absolute -bottom-1 -left-2 bg-white border border-black/10 text-[#0B0B10] text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#963DFF]" />
                      <span>Zero Queue</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Status Pill */}
                <div className="relative z-10 pt-2 border-t border-black/[0.06] text-center">
                  <span className="text-[11px] font-medium text-[#71717A]">
                    Autonomous query resolution & smart escalation
                  </span>
                </div>
              </div>

              {/* ================================================= */}
              {/* CARD 3 — ENQUIRY VISIBILITY (DARK CARD)            */}
              {/* ================================================= */}
              <div
                ref={card3Ref}
                className="group relative rounded-3xl bg-[#0B0B10] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 transition-all duration-300 min-h-[380px] lg:h-[460px] xl:h-[475px] overflow-hidden"
              >
                {/* Subtle Ambient Glow */}
                <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-[#963DFF]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Category Pill */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C28AFF]">
                      03 / CRM PIPELINE
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#55A9FF]">
                      <TrendingUp className="w-3 h-3 text-[#55A9FF]" />
                      Real-Time Sync
                    </span>
                  </div>

                  {/* Large Heading & Title */}
                  <div className="mt-3">
                    <div className="font-headline font-black text-4xl sm:text-5xl text-white tracking-tight">
                      Enquiries
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-white/95 mt-1">
                      Enquiry Visibility
                    </h3>
                    <p className="text-xs text-[#9898A6] mt-1.5 leading-relaxed">
                      See customer conversations and the enquiries generated through your website assistant.
                    </p>
                  </div>
                </div>

                {/* Premium Dashboard Overview Mockup */}
                <div className="relative z-10 mt-4 bg-[#12121A] rounded-2xl p-3.5 border border-white/[0.06] space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-[#9898A6] border-b border-white/[0.05] pb-1.5">
                    <span className="font-semibold text-white/80">Active Lead Feed</span>
                    <span className="font-mono text-[9px] text-[#55A9FF]">CRM Synced</span>
                  </div>

                  {/* Lead Item 1 */}
                  <div className="bg-white/[0.04] rounded-xl p-2.5 flex items-center justify-between gap-2 border border-white/[0.04]">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        Sarah Jenkins
                      </div>
                      <div className="text-[9px] text-[#9898A6] truncate">
                        Executive Demo Requested
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider shrink-0">
                      High Intent
                    </span>
                  </div>

                  {/* Lead Item 2 */}
                  <div className="bg-white/[0.04] rounded-xl p-2.5 flex items-center justify-between gap-2 border border-white/[0.04]">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        Marcus Vance
                      </div>
                      <div className="text-[9px] text-[#9898A6] truncate">
                        Commercial Pricing Inquiry
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#963DFF]/25 text-[#C28AFF] text-[9px] font-bold uppercase tracking-wider shrink-0">
                      Qualified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Line */}
          <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between text-[10px] text-[#52525C] font-semibold uppercase tracking-wider pt-2 border-t border-black/[0.06]">
            <span>Emperor Nexus Conversational Suite</span>
            <span>Zero Risk · Grounded In Your Data</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LAYER 1 (ON TOP): DARK BREAKING SCENE WITH SHUTTER SLATS  */}
        {/* ========================================================= */}
        <div
          ref={darkSceneRef}
          className="absolute inset-0 w-full h-full z-20 pointer-events-none overflow-hidden"
        >
          {/* HORIZONTAL SHUTTER SLATS GRID */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {Array.from({ length: SLATS_COUNT }).map((_, idx) => (
              <div
                key={idx}
                ref={(el) => (slatRefs.current[idx] = el)}
                className="absolute left-0 w-full bg-[#050507] will-change-transform"
                style={{
                  top: `${(idx * 100) / SLATS_COUNT}%`,
                  height: `calc(${100 / SLATS_COUNT}% + 1.5px)`, // +1.5px eliminates any subpixel hairline seam
                }}
              >
                {/* Micro accent seam */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.03]" />
              </div>
            ))}
          </div>

          {/* SUBTLE 3D VISUAL ELEMENT BEHIND THE TYPOGRAPHY */}
          <div
            ref={bgVisualRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] pointer-events-none will-change-transform"
            style={{ perspective: "1000px" }}
          >
            {/* Ambient Radial Color Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#963DFF]/25 via-purple-900/10 to-[#55A9FF]/20 blur-[90px]" />

            {/* Concentric 3D Wireframe Rings */}
            <div
              className="absolute inset-4 rounded-full border border-[#963DFF]/30 border-dashed"
              style={{ transform: "rotateX(55deg) rotateY(15deg)" }}
            />
            <div
              className="absolute inset-16 rounded-full border border-[#55A9FF]/25"
              style={{ transform: "rotateX(-45deg) rotateY(-20deg)" }}
            />
            <div
              className="absolute inset-28 rounded-full border border-white/20 border-dotted"
              style={{ transform: "rotateX(30deg) rotateZ(45deg)" }}
            />
          </div>

          {/* OVERSIZED EDITORIAL TYPOGRAPHY */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
            style={{ perspective: "1200px" }}
          >
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-bold tracking-widest text-[#C28AFF] uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#55A9FF]" />
              <span>04 / System Architecture</span>
            </div>

            <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] select-none">
              {/* Line 1 */}
              <div className="flex items-center justify-center gap-x-3 sm:gap-x-5 flex-wrap">
                {HEADLINE_LINE1.map((word, wIdx) => {
                  const wordChars = l1Vectors.filter((v) => v.wIdx === wIdx);
                  return (
                    <span key={wIdx} className="inline-flex whitespace-nowrap">
                      {wordChars.map((item) => (
                        <span
                          key={item.overallIdx}
                          ref={(el) => (l1CharRefs.current[item.overallIdx] = el)}
                          className="inline-block will-change-transform"
                        >
                          {item.char}
                        </span>
                      ))}
                    </span>
                  );
                })}
              </div>

              {/* Line 2 with Cybernetic Purple Gradient Accent */}
              <div className="flex items-center justify-center gap-x-3 sm:gap-x-5 flex-wrap mt-2 sm:mt-3">
                {HEADLINE_LINE2.map((word, wIdx) => {
                  const wordChars = l2Vectors.filter((v) => v.wIdx === wIdx);
                  return (
                    <span
                      key={wIdx}
                      className="inline-flex whitespace-nowrap text-glow-purple text-gradient-purple-blue"
                    >
                      {wordChars.map((item) => (
                        <span
                          key={item.overallIdx}
                          ref={(el) => (l2CharRefs.current[item.overallIdx] = el)}
                          className="inline-block will-change-transform"
                        >
                          {item.char}
                        </span>
                      ))}
                    </span>
                  );
                })}
              </div>
            </h2>

            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-[#9898A6] max-w-md mx-auto leading-relaxed font-normal">
              Scroll down to witness the transition into Emperor Nexus conversational intelligence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
