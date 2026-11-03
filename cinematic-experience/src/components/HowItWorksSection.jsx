import React, { useEffect, useRef } from "react";
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
  const cardInnerRefs = useRef([]);
  const glowOrbRef = useRef(null);
  const sectionHeaderRef = useRef(null);

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
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0, rotateZ: 0 });
        });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1, y: 0 });
        return;
      }

      // =======================================================================
      // INITIAL 3D SCENE CONFIGURATION
      // Zero blank frames: Typography starts centered, Cards emerge seamlessly
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

      // Cards start prepared in background depth, ready to fly in
      if (isDesktop) {
        if (cardRefs.current[0]) {
          gsap.set(cardRefs.current[0], {
            xPercent: -80,
            yPercent: 0,
            z: -180,
            rotateY: 35,
            rotateZ: -8,
            scale: 0.82,
            opacity: 0,
            transformOrigin: "center center",
            force3D: true,
          });
        }

        if (cardRefs.current[1]) {
          gsap.set(cardRefs.current[1], {
            xPercent: 0,
            yPercent: 10,
            z: -300,
            rotateX: 18,
            scale: 0.70,
            opacity: 0,
            transformOrigin: "center center",
            force3D: true,
          });
        }

        if (cardRefs.current[2]) {
          gsap.set(cardRefs.current[2], {
            xPercent: 80,
            yPercent: 0,
            z: -180,
            rotateY: -35,
            rotateZ: 8,
            scale: 0.82,
            opacity: 0,
            transformOrigin: "center center",
            force3D: true,
          });
        }
      } else {
        cardRefs.current.forEach((card, idx) => {
          if (card) {
            gsap.set(card, {
              opacity: 0,
              y: 30 + idx * 15,
              scale: 0.95,
            });
          }
        });
      }

      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -15 });
      }

      if (glowOrbRef.current) {
        gsap.set(glowOrbRef.current, { scale: 0.8, opacity: 0.4 });
      }

      // =======================================================================
      // MASTER COORDINATED GSAP TIMELINE (Crisp, zero-empty-space scrub)
      // 0.00 - 0.12: Big Typography "HOW IT WORKS" displayed
      // 0.10 - 0.40: Letters shatter in 3D WHILE cards immediately fly into view
      // 0.35 - 0.70: Cards fan out into final balanced 3-column layout
      // 0.70 - 1.00: Cards remain rock-solid in place and interactive
      // =======================================================================
      const masterTL = gsap.timeline({
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

      // 2. Persistent Section Header fades in as letters disperse
      if (sectionHeaderRef.current) {
        masterTL.to(
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

      // 3. Three Cards EMERGE IMMEDIATELY through moving letters (No empty space!)
      if (isDesktop) {
        // Card 02 (Center Hero) emerges from depth
        if (cardRefs.current[1]) {
          masterTL.to(
            cardRefs.current[1],
            {
              z: 20,
              yPercent: 0,
              rotateX: 0,
              scale: 0.96,
              opacity: 1,
              duration: 0.24,
              ease: "power2.out",
            },
            0.12
          );
        }

        // Card 01 (Left) flies in with 3D perspective
        if (cardRefs.current[0]) {
          masterTL.to(
            cardRefs.current[0],
            {
              xPercent: -25,
              z: 0,
              rotateY: 16,
              rotateZ: -4,
              scale: 0.92,
              opacity: 1,
              duration: 0.26,
              ease: "power2.out",
            },
            0.15
          );
        }

        // Card 03 (Right) flies in with 3D perspective
        if (cardRefs.current[2]) {
          masterTL.to(
            cardRefs.current[2],
            {
              xPercent: 25,
              z: 0,
              rotateY: -16,
              rotateZ: 4,
              scale: 0.92,
              opacity: 1,
              duration: 0.26,
              ease: "power2.out",
            },
            0.17
          );
        }

        // 4. Cards fan out smoothly into balanced 3-column composition
        if (cardRefs.current[0]) {
          masterTL.to(
            cardRefs.current[0],
            {
              xPercent: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.28,
              ease: "power3.out",
            },
            0.40
          );
        }

        if (cardRefs.current[1]) {
          masterTL.to(
            cardRefs.current[1],
            {
              z: 0,
              scale: 1,
              opacity: 1,
              duration: 0.28,
              ease: "power3.out",
            },
            0.40
          );
        }

        if (cardRefs.current[2]) {
          masterTL.to(
            cardRefs.current[2],
            {
              xPercent: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.28,
              ease: "power3.out",
            },
            0.42
          );
        }
      } else {
        masterTL.to(
          cardRefs.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.08,
            duration: 0.30,
            ease: "power2.out",
          },
          0.14
        );
      }

      // Settle and hold steady for interactive browsing
      masterTL.to({}, { duration: 0.32 }, 0.68);
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
        {/* FULLSCREEN TYPOGRAPHY & CHARACTER SHATTER                             */}
        {/* ===================================================================== */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
        >
          {/* Subtle Top Kicker */}
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
        {/* THREE-CARD REVEAL & BALANCED 3-COLUMN COMPOSITION (LAYER 20)          */}
        {/* ===================================================================== */}
        <div
          className="relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* =================================================================== */}
          {/* CARD 01: CONNECT YOUR KNOWLEDGE BASE                               */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="group relative rounded-2xl bg-gradient-to-b from-[#0B1528] via-[#091120] to-[#060B14] border-2 border-[#38BDF8]/40 hover:border-[#38BDF8] shadow-[0_15px_40px_rgba(56,189,248,0.18)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-300"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Ambient Cyan Flare */}
            <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#38BDF8]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                    Step 01 · Ingestion
                  </span>
                  <span className="font-headline font-black text-2xl text-white/30 group-hover:text-[#38BDF8] transition-colors">
                    01
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-snug">
                  CONNECT YOUR KNOWLEDGE BASE
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-[#CBD5E1] leading-relaxed">
                  Upload brochures, pricing schedules, FAQs, technical manuals, or provide a website URL.
                </p>
              </div>

              {/* Visual Graphic: Interactive Ingestion Dropzone */}
              <div className="my-auto py-2 bg-[#040C1A]/90 rounded-xl p-3 border border-[#38BDF8]/20 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                  <span className="flex items-center gap-1.5 text-[#38BDF8] font-bold">
                    <Globe className="w-3 h-3 text-[#38BDF8]" />
                    URL & Docs Sync
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-white/80 bg-white/[0.05] p-1.5 rounded border border-white/[0.05]">
                  <Upload className="w-3 h-3 text-[#38BDF8] shrink-0" />
                  <span className="truncate font-mono">brochure_v2.pdf, faqs.docx</span>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-[#38BDF8]/20 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#94A3B8] font-medium leading-tight">
                  Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 02: CALIBRATE PERSONA & LAUNCHER STYLING (Luminous Hero)       */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="group relative rounded-2xl bg-gradient-to-b from-[#1C0E36] via-[#120824] to-[#0A0414] border-2 border-[#963DFF]/60 hover:border-[#C28AFF] shadow-[0_20px_50px_rgba(150,61,255,0.32)] ring-1 ring-[#C28AFF]/40 p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-300 md:-translate-y-1"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Ambient Purple Flare */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#963DFF]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#963DFF]/20 text-[#C28AFF] border border-[#963DFF]/40">
                    Step 02 · Persona Engine
                  </span>
                  <span className="font-headline font-black text-2xl text-[#963DFF] group-hover:text-[#C28AFF] transition-colors">
                    02
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-snug">
                  CALIBRATE PERSONA & LAUNCHER STYLING
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-[#E2E8F0] leading-relaxed">
                  Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and animation.
                </p>
              </div>

              {/* Visual Graphic: Interactive Persona Selector */}
              <div className="my-auto py-2 bg-[#0D051A]/90 rounded-xl p-3 border border-[#963DFF]/30 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#C28AFF] font-bold">
                    Tone Preset:
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white bg-[#963DFF]/40 px-2 py-0.5 rounded border border-[#963DFF]/50">
                    Consultative AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#963DFF] to-[#55A9FF] border border-white/40 shadow-sm flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 bg-white/[0.06] rounded px-2 py-1 text-[9px] text-[#E2E8F0] truncate font-mono">
                    "Welcome! How can I accelerate your goals today?"
                  </div>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-[#963DFF]/30 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C28AFF] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#CBD5E1] font-medium leading-tight">
                  Custom logo upload, squircle / circle / pill buttons, and 19 launcher animations.
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 03: DEPLOY WITH A SINGLE LINE OF CODE                         */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="group relative rounded-2xl bg-gradient-to-b from-[#0E1528] via-[#090F1C] to-[#060A14] border-2 border-[#55A9FF]/40 hover:border-[#55A9FF] shadow-[0_15px_40px_rgba(85,169,255,0.18)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-300"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Ambient Blue Flare */}
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#55A9FF]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#55A9FF]/15 text-[#55A9FF] border border-[#55A9FF]/30">
                    Step 03 · Live Embed
                  </span>
                  <span className="font-headline font-black text-2xl text-white/30 group-hover:text-[#55A9FF] transition-colors">
                    03
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-snug">
                  DEPLOY WITH A SINGLE LINE OF CODE
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-[#CBD5E1] leading-relaxed">
                  Integrate the assistant into the website using the provided script.
                </p>
              </div>

              {/* Visual Graphic: Code Embed Terminal Snippet */}
              <div className="my-auto py-2 bg-[#040814]/90 rounded-xl p-3 border border-[#55A9FF]/20 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                  <span className="flex items-center gap-1.5 text-[#55A9FF]">
                    <Code2 className="w-3 h-3" />
                    HTML Embed
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-[#55A9FF]/80">
                    <Copy className="w-2.5 h-2.5" />
                    One-line
                  </span>
                </div>
                <div className="bg-black/50 p-2 rounded text-[9px] font-mono text-emerald-400 overflow-hidden text-ellipsis whitespace-nowrap border border-white/[0.04]">
                  <code>&lt;script src=&quot;nexus.js&quot; data-bot=&quot;nx_892&quot;&gt;&lt;/script&gt;</code>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-[#55A9FF]/20 flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-[#55A9FF] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#94A3B8] font-medium leading-tight">
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
