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
      // MASTER GSAP TIMELINE — Awwwards Character Shatter + Cards Sequence
      // =======================================================================
      const masterTL = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1200",
          pin: stage,
          pinSpacing: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // PHASE 1: Dramatic Character-by-Character Shatter in 3D Space
      HEADLINE_LETTERS.forEach((item, idx) => {
        if (!item.isSpace && letterRefs.current[idx]) {
          masterTL.to(
            letterRefs.current[idx],
            {
              x: item.x * (isDesktop ? 1.6 : 0.9),
              y: item.y * (isDesktop ? 1.4 : 0.8),
              z: item.z * (isDesktop ? 1.8 : 1.0),
              rotateX: item.rx,
              rotateY: item.ry,
              rotateZ: item.rz,
              scale: item.s,
              opacity: 0,
              filter: "blur(14px)",
              duration: 0.42,
              ease: "power2.inOut",
            },
            idx * 0.015
          );
        }
      });

      // Ambient background flare expansion
      if (glowOrbRef.current) {
        masterTL.to(
          glowOrbRef.current,
          {
            scale: 1.4,
            opacity: 0.85,
            duration: 0.5,
            ease: "power2.out",
          },
          0.05
        );
      }

      // Typography container gracefully collapses
      if (typographyRef.current) {
        masterTL.to(
          typographyRef.current,
          {
            opacity: 0,
            duration: 0.28,
            ease: "power2.in",
          },
          0.12
        );
      }

      // PHASE 2: Persistent Architecture Header Fades In
      if (sectionHeaderRef.current) {
        masterTL.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.28,
            ease: "power3.out",
          },
          0.18
        );
      }

      // PHASE 3: Right-to-Left Carousel Slides Into Center Screen
      if (cardsTrackRef.current) {
        masterTL.to(
          cardsTrackRef.current,
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.45,
            ease: "power3.out",
          },
          0.16
        );
      }

      // Staggered reveal of the three architectural cards
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
        {/* Ambient Dark Canvas */}
        <div
          ref={glowOrbRef}
          className="hidden"
        />

        {/* ===================================================================== */}
        {/* FULLSCREEN TYPOGRAPHY & CHARACTER SHATTER (LAYER 30 - FADES AT 0.10s) */}
        {/* ===================================================================== */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
        >
          {/* Top Kicker */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/20 text-zinc-300 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
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
            Scroll to reveal architecture &amp; deployment
          </p>
        </div>

        {/* ===================================================================== */}
        {/* PERSISTENT HEADER (Appears smoothly as letters scatter)               */}
        {/* ===================================================================== */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/20 text-zinc-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-zinc-300" />
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
        {/* RIGHT-TO-LEFT CAROUSEL TRACK (WHOLE COLOR CARDS!)                     */}
        {/* ===================================================================== */}
        <div
          ref={cardsTrackRef}
          className="relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch will-change-transform"
        >
          {/* =================================================================== */}
          {/* CARD 01: CONNECT YOUR KNOWLEDGE BASE (FULL VIBRANT ICE TEAL)         */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            onMouseEnter={() => setActiveCardIndex(0)}
            className="group relative rounded-2xl bg-[#5EEAD4] text-black border-2 border-[#2DD4BF] shadow-[0_20px_50px_rgba(94,234,212,0.35)] hover:shadow-[0_25px_60px_rgba(94,234,212,0.55)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-[#5EEAD4] uppercase tracking-wider">
                    Step 01 · Ingestion
                  </span>
                  <span className="font-headline font-black text-2xl text-black/40">
                    01
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-black tracking-tight uppercase leading-snug">
                  CONNECT YOUR KNOWLEDGE BASE
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-black/85 leading-relaxed font-semibold">
                  Upload brochures, pricing schedules, FAQs, technical manuals, or provide a website URL.
                </p>
              </div>

              {/* Visual Graphic: Interactive Ingestion Dropzone */}
              <div className="my-auto py-2 bg-black/10 backdrop-blur-md rounded-xl p-3 border border-black/15 space-y-2 text-black">
                <div className="flex items-center justify-between text-[10px] font-mono text-black">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Globe className="w-3 h-3 text-black" />
                    URL &amp; Docs Sync
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black text-[#5EEAD4] font-bold text-[9px]">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-black bg-black/5 p-1.5 rounded border border-black/10 font-mono">
                  <Upload className="w-3 h-3 text-black shrink-0" />
                  <span className="truncate">brochure_v2.pdf, faqs.docx</span>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-black/15 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                <span className="text-[11px] text-black/85 font-semibold leading-tight">
                  Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 02: CALIBRATE PERSONA (FULL VIBRANT ELECTRIC LAVENDER)         */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            onMouseEnter={() => setActiveCardIndex(1)}
            className="group relative rounded-2xl bg-[#D8B4FE] text-black border-2 border-[#C084FC] shadow-[0_20px_50px_rgba(216,180,254,0.35)] hover:shadow-[0_25px_60px_rgba(216,180,254,0.55)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-[#D8B4FE] uppercase tracking-wider">
                    Step 02 · Persona Engine
                  </span>
                  <span className="font-headline font-black text-2xl text-black/40">
                    02
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-black tracking-tight uppercase leading-snug">
                  CALIBRATE PERSONA &amp; LAUNCHER STYLING
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-black/85 leading-relaxed font-semibold">
                  Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and animation.
                </p>
              </div>

              {/* Visual Graphic: Interactive Persona Selector */}
              <div className="my-auto py-2 bg-black/10 backdrop-blur-md rounded-xl p-3 border border-black/15 space-y-2 text-black">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-black font-bold">
                    Tone Preset:
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white bg-black px-2 py-0.5 rounded">
                    Consultative AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 bg-black/5 rounded px-2 py-1 text-[9px] text-black truncate font-mono font-semibold">
                    &quot;Welcome! How can I accelerate your goals today?&quot;
                  </div>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-black/15 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                <span className="text-[11px] text-black/85 font-semibold leading-tight">
                  Custom logo upload, squircle / circle / pill buttons, and 19 launcher animations.
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 03: DEPLOY WITH CODE (FULL VIBRANT WARM CORAL PEACH)            */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            onMouseEnter={() => setActiveCardIndex(2)}
            className="group relative rounded-2xl bg-[#FED7AA] text-black border-2 border-[#FB923C] shadow-[0_20px_50px_rgba(254,215,170,0.35)] hover:shadow-[0_25px_60px_rgba(254,215,170,0.55)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-[360px] sm:h-[385px] lg:h-[410px] will-change-transform transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-[#F97316] uppercase tracking-wider">
                    Step 03 · Live Embed
                  </span>
                  <span className="font-headline font-black text-2xl text-black/40">
                    03
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-headline font-black text-lg sm:text-xl text-black tracking-tight uppercase leading-snug">
                  DEPLOY WITH A SINGLE LINE OF CODE
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-black/85 leading-relaxed font-semibold">
                  Integrate the assistant into the website using the provided script.
                </p>
              </div>

              {/* Visual Graphic: Code Embed Terminal Snippet */}
              <div className="my-auto py-2 bg-black/10 backdrop-blur-md rounded-xl p-3 border border-black/15 space-y-1.5 text-black">
                <div className="flex items-center justify-between text-[10px] font-mono text-black font-semibold">
                  <span className="flex items-center gap-1.5 text-black font-bold">
                    <Code2 className="w-3 h-3 text-black" />
                    HTML Embed
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-black font-mono font-bold">
                    <Copy className="w-2.5 h-2.5" />
                    One-line
                  </span>
                </div>
                <div className="bg-black text-[#86EFAC] p-2 rounded text-[9px] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  <code>&lt;script src=&quot;nexus.js&quot; data-bot=&quot;nx_892&quot;&gt;&lt;/script&gt;</code>
                </div>
              </div>

              {/* Card Footer Highlight */}
              <div className="pt-2.5 border-t border-black/15 flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                <span className="text-[11px] text-black/85 font-semibold leading-tight">
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