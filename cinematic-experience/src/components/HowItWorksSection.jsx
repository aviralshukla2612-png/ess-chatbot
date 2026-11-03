import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Sliders,
  Code2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Upload,
  Globe,
  Bot,
  Copy,
  Check,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// "HOW IT WORKS" letters split for character-by-character shatter
const HEADLINE_LETTERS = [
  { char: "H", x: -280, y: -200, z: 280, rx: 45, ry: -60, rz: -35, s: 2.0 },
  { char: "O", x: -160, y: -260, z: 180, rx: -50, ry: 40, rz: 55, s: 1.8 },
  { char: "W", x: -60, y: 220, z: 350, rx: 65, ry: -30, rz: -40, s: 2.2 },
  { char: " ", isSpace: true },
  { char: "I", x: 40, y: -220, z: 240, rx: -40, ry: 50, rz: 30, s: 1.8 },
  { char: "T", x: 120, y: 220, z: 300, rx: 55, ry: -45, rz: -30, s: 1.9 },
  { char: " ", isSpace: true },
  { char: "W", x: -220, y: 200, z: 260, rx: -35, ry: 65, rz: 45, s: 2.1 },
  { char: "O", x: 160, y: -200, z: 180, rx: 50, ry: -50, rz: -20, s: 1.7 },
  { char: "R", x: 260, y: 160, z: 340, rx: -60, ry: 35, rz: 50, s: 2.0 },
  { char: "K", x: 340, y: -150, z: 190, rx: 40, ry: -60, rz: -50, s: 2.2 },
  { char: "S", x: 400, y: 220, z: 280, rx: -70, ry: 55, rz: 40, s: 1.9 },
];

export default function HowItWorksSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const typographyRef = useRef(null);
  const letterRefs = useRef([]);
  const cardRefs = useRef([]);
  const cardsTrackRef = useRef(null);
  const glowOrbRef = useRef(null);
  const sectionHeaderRef = useRef(null);
  const [activeCardIndex, setActiveCardIndex] = useState(1); // Default middle card

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 1024;

      // Handle Reduced Motion preferences
      if (prefersReducedMotion) {
        if (typographyRef.current) gsap.set(typographyRef.current, { display: "none" });
        if (cardsTrackRef.current) gsap.set(cardsTrackRef.current, { x: 0, opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 });
        });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1, y: 0 });
        return;
      }

      // =======================================================================
      // INITIAL 3D SCENE CONFIGURATION
      // =======================================================================
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

      // Right-to-Left Carousel Track starts off-screen to the right
      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, {
          xPercent: isDesktop ? 45 : 30,
          opacity: 0,
        });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            x: 100 + idx * 60,
            opacity: 0,
            scale: 0.9,
          });
        }
      });

      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -15 });
      }

      if (glowOrbRef.current) {
        gsap.set(glowOrbRef.current, { scale: 0.8, opacity: 0.4 });
      }

      // =======================================================================
      // MASTER COORDINATED GSAP TIMELINE
      // 1. Letters shatter in 3D
      // 2. Fullscreen typography FADES OUT (Eliminates ghost text overlap!)
      // 3. Right-to-Left Carousel Track glides in from right to left
      // 4. Cards fan out smoothly into final balanced layout
      // =======================================================================
      const masterTL = gsap.timeline({
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

      // 1. Letters shatter outwards in 3D
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const config = HEADLINE_LETTERS[idx] || { x: 0, y: 0, z: 200, rx: 0, ry: 0, rz: 0, s: 2 };
          masterTL.to(
            el,
            {
              x: config.x * (isDesktop ? 1.2 : 0.7),
              y: config.y * (isDesktop ? 1.2 : 0.7),
              z: config.z,
              rotateX: config.rx,
              rotateY: config.ry,
              rotateZ: config.rz,
              scale: config.s,
              opacity: 0,
              filter: "blur(12px)",
              duration: 0.28,
              ease: "power2.inOut",
            },
            0.08 + (idx % 4) * 0.015
          );
        }
      });

      // 2. WIPE OUT FULLSCREEN TYPOGRAPHY (Fixes overlapping text completely!)
      if (typographyRef.current) {
        masterTL.to(
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

      // 3. Persistent Section Header fades in cleanly at top
      if (sectionHeaderRef.current) {
        masterTL.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            ease: "power2.out",
          },
          0.12
        );
      }

      if (glowOrbRef.current) {
        masterTL.to(
          glowOrbRef.current,
          {
            scale: 1.25,
            opacity: 0.9,
            duration: 0.30,
            ease: "power1.out",
          },
          0.12
        );
      }

      // 4. RIGHT-TO-LEFT CAROUSEL ENTRANCE:
      // The track glides smoothly from RIGHT to LEFT into view
      if (cardsTrackRef.current) {
        masterTL.to(
          cardsTrackRef.current,
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
          },
          0.15
        );
      }

      // 5. Individual cards stagger and glide from right to left into their spots
      cardRefs.current.forEach((card, idx) => {
        if (card) {
          masterTL.to(
            card,
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.32,
              ease: "power3.out",
            },
            0.20 + idx * 0.08
          );
        }
      });

      // Settle and hold steady for interactive browsing
      masterTL.to({}, { duration: 0.35 }, 0.65);
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex flex-col justify-between pt-16 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-[#050507]"
        style={{ perspective: "1500px" }}
      >
        {/* Ambient Purple Central Glow */}
        <div
          ref={glowOrbRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#963DFF]/20 rounded-full blur-[140px] pointer-events-none z-0"
        />

        {/* ===================================================================== */}
        {/* FULLSCREEN TYPOGRAPHY & CHARACTER SHATTER (LAYER 30 - FADES AT 0.10s) */}
        {/* ===================================================================== */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
        >
          {/* Top Kicker */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>Fast Three-Step Setup</span>
          </div>

          {/* Oversized Centered "HOW IT WORKS" Typography */}
          <h1
            className="font-headline font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white uppercase text-center flex flex-wrap justify-center items-center gap-x-4 md:gap-x-6"
            style={{ perspective: "1200px" }}
          >
            {/* Word: HOW */}
            <span className="inline-flex">
              {HEADLINE_LETTERS.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  ref={(el) => (letterRefs.current[idx] = el)}
                  className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-white via-[#EDEDF2] to-[#888898] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                >
                  {item.char}
                </span>
              ))}
            </span>

            {/* Word: IT */}
            <span className="inline-flex">
              {HEADLINE_LETTERS.slice(4, 6).map((item, idx) => (
                <span
                  key={idx + 4}
                  ref={(el) => (letterRefs.current[idx + 4] = el)}
                  className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-white via-[#EDEDF2] to-[#888898] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                >
                  {item.char}
                </span>
              ))}
            </span>

            {/* Word: WORKS */}
            <span className="inline-flex">
              {HEADLINE_LETTERS.slice(7).map((item, idx) => (
                <span
                  key={idx + 7}
                  ref={(el) => (letterRefs.current[idx + 7] = el)}
                  className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-[0_15px_30px_rgba(150,61,255,0.4)]"
                >
                  {item.char}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-[#9898A6] max-w-lg text-center tracking-wide font-mono uppercase">
            Scroll to reveal architecture & deployment
          </p>
        </div>

        {/* ===================================================================== */}
        {/* PERSISTENT HEADER (Appears smoothly as letters scatter)               */}
        {/* ===================================================================== */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#C28AFF]" />
            <span>Fast Three-Step Setup</span>
          </div>
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-white tracking-tight">
            From Raw Documents To{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#55A9FF]">
              Autonomous Sales In 5 Minutes
            </span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#9898A6] max-w-2xl mx-auto hidden sm:block">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT-TO-LEFT CAROUSEL TRACK (COLORFUL ON HOVER!)                     */}
        {/* ===================================================================== */}
        <div
          ref={cardsTrackRef}
          className="relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch will-change-transform"
        >
          {/* =================================================================== */}
          {/* CARD 01: CONNECT YOUR KNOWLEDGE BASE (COLORFUL ON HOVER)            */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            onMouseEnter={() => setActiveCardIndex(0)}
            className="group relative rounded-2xl bg-gradient-to-b from-[#0B1528] via-[#091120] to-[#060B14] hover:from-[#0B2A4A] hover:via-[#09223D] hover:to-[#051626] border-2 border-[#38BDF8]/40 hover:border-[#38BDF8] shadow-[0_15px_40px_rgba(56,189,248,0.18)] hover:shadow-[0_25px_60px_rgba(56,189,248,0.45)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-500 hover:-translate-y-1.5 cursor-pointer"
          >
            {/* Ambient Cyan Flare — Blooms into vibrant color on hover */}
            <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#38BDF8]/15 group-hover:bg-[#38BDF8]/40 rounded-full blur-3xl pointer-events-none transition-all duration-500" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#0284C7]/0 group-hover:bg-[#0284C7]/30 rounded-full blur-3xl pointer-events-none transition-all duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#38BDF8]/15 group-hover:bg-[#38BDF8] text-[#38BDF8] group-hover:text-black border border-[#38BDF8]/30 group-hover:border-[#38BDF8] transition-all duration-300">
                    Step 01 · Ingestion
                  </span>
                  <span className="font-headline font-black text-2xl text-white/30 group-hover:text-[#38BDF8] group-hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] transition-all duration-300">
                    01
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-snug group-hover:text-[#BAE6FD] transition-colors">
                  CONNECT YOUR KNOWLEDGE BASE
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-[#CBD5E1] group-hover:text-white leading-relaxed transition-colors">
                  Upload brochures, pricing schedules, FAQs, technical manuals, or provide a website URL.
                </p>
              </div>

              {/* Visual Graphic: Interactive Ingestion Dropzone */}
              <div className="my-auto py-2 bg-[#040C1A]/90 group-hover:bg-[#06182E] rounded-xl p-3 border border-[#38BDF8]/20 group-hover:border-[#38BDF8]/50 space-y-2 shadow-inner transition-all duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 text-[#38BDF8] font-bold">
                    <Globe className="w-3 h-3 text-[#38BDF8]" />
                    URL & Docs Sync
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-white/80 group-hover:text-white bg-white/[0.05] group-hover:bg-[#38BDF8]/10 p-1.5 rounded border border-white/[0.05] group-hover:border-[#38BDF8]/30 transition-colors">
                  <Upload className="w-3 h-3 text-[#38BDF8] shrink-0" />
                  <span className="truncate font-mono">brochure_v2.pdf, faqs.docx</span>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-[#38BDF8]/20 group-hover:border-[#38BDF8]/40 flex items-start gap-2 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#94A3B8] group-hover:text-[#E0F2FE] font-medium leading-tight transition-colors">
                  Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 02: CALIBRATE PERSONA & LAUNCHER STYLING (COLORFUL ON HOVER)   */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            onMouseEnter={() => setActiveCardIndex(1)}
            className="group relative rounded-2xl bg-gradient-to-b from-[#1C0E36] via-[#120824] to-[#0A0414] hover:from-[#3B1266] hover:via-[#2A0C4A] hover:to-[#170529] border-2 border-[#963DFF]/60 hover:border-[#C28AFF] shadow-[0_20px_50px_rgba(150,61,255,0.32)] hover:shadow-[0_25px_65px_rgba(194,138,255,0.55)] ring-1 ring-[#C28AFF]/40 hover:ring-[#C28AFF] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-500 hover:-translate-y-1.5 cursor-pointer"
          >
            {/* Ambient Purple Flare — Blooms into vibrant color on hover */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#963DFF]/25 group-hover:bg-[#963DFF]/50 rounded-full blur-3xl pointer-events-none transition-all duration-500" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#C28AFF]/0 group-hover:bg-[#C28AFF]/30 rounded-full blur-3xl pointer-events-none transition-all duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#963DFF]/20 group-hover:bg-[#C28AFF] text-[#C28AFF] group-hover:text-black border border-[#963DFF]/40 group-hover:border-[#C28AFF] transition-all duration-300">
                    Step 02 · Persona Engine
                  </span>
                  <span className="font-headline font-black text-2xl text-[#963DFF] group-hover:text-[#C28AFF] group-hover:drop-shadow-[0_0_15px_rgba(194,138,255,0.9)] transition-all duration-300">
                    02
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-snug group-hover:text-[#F3E8FF] transition-colors">
                  CALIBRATE PERSONA & LAUNCHER STYLING
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-[#E2E8F0] group-hover:text-white leading-relaxed transition-colors">
                  Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and animation.
                </p>
              </div>

              {/* Visual Graphic: Interactive Persona Selector */}
              <div className="my-auto py-2 bg-[#0D051A]/90 group-hover:bg-[#200A38] rounded-xl p-3 border border-[#963DFF]/30 group-hover:border-[#C28AFF]/50 space-y-2 shadow-inner transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#C28AFF] font-bold">
                    Tone Preset:
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white bg-[#963DFF]/40 group-hover:bg-[#963DFF] px-2 py-0.5 rounded border border-[#963DFF]/50 group-hover:border-[#C28AFF] transition-colors shadow-sm">
                    Consultative AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#963DFF] to-[#55A9FF] border border-white/40 shadow-sm flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 bg-white/[0.06] group-hover:bg-white/[0.12] rounded px-2 py-1 text-[9px] text-[#E2E8F0] group-hover:text-white truncate font-mono transition-colors">
                    &quot;Welcome! How can I accelerate your goals today?&quot;
                  </div>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-[#963DFF]/30 group-hover:border-[#C28AFF]/40 flex items-start gap-2 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-[#C28AFF] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#CBD5E1] group-hover:text-[#F3E8FF] font-medium leading-tight transition-colors">
                  Custom logo upload, squircle / circle / pill buttons, and 19 launcher animations.
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 03: DEPLOY WITH A SINGLE LINE OF CODE (COLORFUL ON HOVER)      */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            onMouseEnter={() => setActiveCardIndex(2)}
            className="group relative rounded-2xl bg-gradient-to-b from-[#0E1528] via-[#090F1C] to-[#060A14] hover:from-[#102B5C] hover:via-[#0D2147] hover:to-[#071329] border-2 border-[#55A9FF]/40 hover:border-[#55A9FF] shadow-[0_15px_40px_rgba(85,169,255,0.18)] hover:shadow-[0_25px_60px_rgba(85,169,255,0.45)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-500 hover:-translate-y-1.5 cursor-pointer"
          >
            {/* Ambient Blue Flare — Blooms into vibrant color on hover */}
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#55A9FF]/15 group-hover:bg-[#55A9FF]/40 rounded-full blur-3xl pointer-events-none transition-all duration-500" />
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#2563EB]/0 group-hover:bg-[#2563EB]/30 rounded-full blur-3xl pointer-events-none transition-all duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#55A9FF]/15 group-hover:bg-[#55A9FF] text-[#55A9FF] group-hover:text-black border border-[#55A9FF]/30 group-hover:border-[#55A9FF] transition-all duration-300">
                    Step 03 · Live Embed
                  </span>
                  <span className="font-headline font-black text-2xl text-white/30 group-hover:text-[#55A9FF] group-hover:drop-shadow-[0_0_15px_rgba(85,169,255,0.8)] transition-all duration-300">
                    03
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-snug group-hover:text-[#DBEAFE] transition-colors">
                  DEPLOY WITH A SINGLE LINE OF CODE
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-[#CBD5E1] group-hover:text-white leading-relaxed transition-colors">
                  Integrate the assistant into the website using the provided script.
                </p>
              </div>

              {/* Visual Graphic: Code Embed Terminal Snippet */}
              <div className="my-auto py-2 bg-[#040814]/90 group-hover:bg-[#071933] rounded-xl p-3 border border-[#55A9FF]/20 group-hover:border-[#55A9FF]/50 space-y-1.5 shadow-inner transition-all duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                  <span className="flex items-center gap-1.5 text-[#55A9FF] font-bold">
                    <Code2 className="w-3 h-3 text-[#55A9FF]" />
                    HTML Embed
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-[#55A9FF] font-mono">
                    <Copy className="w-2.5 h-2.5" />
                    One-line
                  </span>
                </div>
                <div className="bg-black/60 group-hover:bg-black/80 p-2 rounded text-[9px] font-mono text-emerald-400 group-hover:text-emerald-300 overflow-hidden text-ellipsis whitespace-nowrap border border-white/[0.04] group-hover:border-[#55A9FF]/30 transition-colors">
                  <code>&lt;script src=&quot;nexus.js&quot; data-bot=&quot;nx_892&quot;&gt;&lt;/script&gt;</code>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-[#55A9FF]/20 group-hover:border-[#55A9FF]/40 flex items-start gap-2 transition-colors">
                <Zap className="w-3.5 h-3.5 text-[#55A9FF] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#94A3B8] group-hover:text-[#DBEAFE] font-medium leading-tight transition-colors">
                  Zero dependencies, anti-cache instant updates, and mobile-optimized viewport.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BOTTOM ACTION CTA BANNER                                              */}
        {/* ===================================================================== */}
        <div className="relative z-10 text-center shrink-0 pt-2">
          <button
            type="button"
            onClick={onOpenTrial}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-xs sm:text-sm text-white btn-primary-gradient cursor-pointer shadow-[0_0_25px_rgba(150,61,255,0.4)] hover:shadow-[0_0_35px_rgba(150,61,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Launch Your Autonomous Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
