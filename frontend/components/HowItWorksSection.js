"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Globe,
  Code2,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Palette,
  LayoutGrid,
  Check,
  MousePointer2,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HowItWorksSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);

  // Connecting Curved Beams & Nodes
  const beam1Ref = useRef(null);
  const beam2Ref = useRef(null);
  const arrowNode1Ref = useRef(null);
  const arrowNode2Ref = useRef(null);

  // Stage 1 (Ingestion - Purple)
  const stage1Ref = useRef(null);
  const sphere1Ref = useRef(null);
  const docs1Ref = useRef(null);

  // Stage 2 (Persona Engine - Orange)
  const stage2Ref = useRef(null);
  const sphere2Ref = useRef(null);
  const robot2Ref = useRef(null);
  const pills2Ref = useRef(null);

  // Stage 3 (Live Embed - Cyan)
  const stage3Ref = useRef(null);
  const sphere3Ref = useRef(null);
  const browser3Ref = useRef(null);
  const cursor3Ref = useRef(null);

  // Bottom Timeline Nodes & Line
  const bottomLineRef = useRef(null);
  const bNode1Ref = useRef(null);
  const bNode2Ref = useRef(null);
  const bNode3Ref = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // =========================================================================
    // DESKTOP & LARGE SCREENS (>= 1024px): Connected Cinematic Experience
    // =========================================================================
    mm.add("(min-width: 1024px)", () => {
      // Initial states
      if (headerRef.current) gsap.set(headerRef.current, { autoAlpha: 0, y: 20 });

      const stages = [stage1Ref.current, stage2Ref.current, stage3Ref.current];
      stages.forEach((st) => {
        if (st) gsap.set(st, { autoAlpha: 0, y: 30 });
      });

      const spheres = [sphere1Ref.current, sphere2Ref.current, sphere3Ref.current];
      spheres.forEach((sp) => {
        if (sp) gsap.set(sp, { scale: 0.88, autoAlpha: 0 });
      });

      if (beam1Ref.current) gsap.set(beam1Ref.current, { strokeDashoffset: 500, strokeDasharray: 500 });
      if (beam2Ref.current) gsap.set(beam2Ref.current, { strokeDashoffset: 500, strokeDasharray: 500 });
      if (arrowNode1Ref.current) gsap.set(arrowNode1Ref.current, { scale: 0, autoAlpha: 0 });
      if (arrowNode2Ref.current) gsap.set(arrowNode2Ref.current, { scale: 0, autoAlpha: 0 });

      if (bottomLineRef.current) gsap.set(bottomLineRef.current, { strokeDashoffset: 1000, strokeDasharray: 1000 });
      const bNodes = [bNode1Ref.current, bNode2Ref.current, bNode3Ref.current];
      bNodes.forEach((bn) => {
        if (bn) gsap.set(bn, { scale: 0, autoAlpha: 0 });
      });

      // Master Coordinated Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 75%",
          end: "bottom 85%",
          toggleActions: "play none none reverse",
        },
      });

      // 1. Header reveal
      if (headerRef.current) {
        tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0);
      }

      // 2. Stage 1 (Purple - Ingestion) entrance
      if (stage1Ref.current && sphere1Ref.current) {
        tl.to(sphere1Ref.current, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.5)" }, 0.2);
        tl.to(stage1Ref.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.3);
      }

      // 3. Beam 1 draws from Stage 1 to Stage 2 & Arrow Node 1 pops
      if (beam1Ref.current) {
        tl.to(beam1Ref.current, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 0.4);
      }
      if (arrowNode1Ref.current) {
        tl.to(arrowNode1Ref.current, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(1.8)" }, 0.6);
      }

      // 4. Stage 2 (Orange - Persona Engine) entrance
      if (stage2Ref.current && sphere2Ref.current) {
        tl.to(sphere2Ref.current, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.5)" }, 0.5);
        tl.to(stage2Ref.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.6);
      }

      // 5. Beam 2 draws from Stage 2 to Stage 3 & Arrow Node 2 pops
      if (beam2Ref.current) {
        tl.to(beam2Ref.current, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 0.7);
      }
      if (arrowNode2Ref.current) {
        tl.to(arrowNode2Ref.current, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(1.8)" }, 0.9);
      }

      // 6. Stage 3 (Cyan - Live Embed) entrance
      if (stage3Ref.current && sphere3Ref.current) {
        tl.to(sphere3Ref.current, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.5)" }, 0.8);
        tl.to(stage3Ref.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.9);
      }

      // 7. Bottom timeline reveals
      if (bottomLineRef.current) {
        tl.to(bottomLineRef.current, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, 0.8);
      }
      bNodes.forEach((bn, idx) => {
        if (bn) {
          tl.to(bn, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(1.8)" }, 0.85 + idx * 0.15);
        }
      });

      // Ambient Floating Micro-Animations
      if (docs1Ref.current) {
        gsap.to(docs1Ref.current.children, {
          y: "-=5",
          rotation: "+=2",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.3,
        });
      }

      if (robot2Ref.current) {
        gsap.to(robot2Ref.current, {
          y: "-=6",
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (pills2Ref.current) {
        gsap.to(pills2Ref.current.children, {
          x: "+=3",
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.25,
        });
      }

      if (browser3Ref.current) {
        gsap.to(browser3Ref.current, {
          y: "-=5",
          rotateY: 2,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (cursor3Ref.current) {
        gsap.to(cursor3Ref.current, {
          scale: 1.15,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        });
      }
    });

    // =========================================================================
    // MOBILE & TABLET (< 1024px): Smooth Vertical Sequential Stacking
    // =========================================================================
    mm.add("(max-width: 1023px)", () => {
      const items = [
        headerRef.current,
        stage1Ref.current,
        stage2Ref.current,
        stage3Ref.current,
      ];

      items.forEach((item) => {
        if (item) {
          gsap.fromTo(
            item,
            { autoAlpha: 0, y: 30 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: {
                trigger: item,
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

  const handleAction = () => {
    if (onOpenTrial) {
      onOpenTrial();
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative w-full bg-[#050509] text-[#F5F5F7] overflow-hidden select-none pt-10 sm:pt-14 lg:pt-12 pb-10 sm:pb-14 lg:pb-12"
    >
      {/* ======================================================================= */}
      {/* 1. CONTINUOUS AMBIENT BACKGROUND WITH BG3.PNG                           */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/bg3.png"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen opacity-70 will-change-transform"
        />

        {/* Ambient radial color glows matching the 3 stages */}
        <div className="absolute top-[30%] left-[6%] w-[380px] h-[300px] rounded-full bg-[#963DFF]/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[320px] h-[280px] rounded-full bg-[#FF713D]/12 blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[6%] w-[380px] h-[300px] rounded-full bg-[#22C8F2]/14 blur-[120px] pointer-events-none" />

        {/* Top/Bottom Edge Fades */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050509] via-[#050509]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050509] via-[#050509]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===================================================================== */}
        {/* 2. SECTION HEADING (EXACT TYPOGRAPHY & PURPLE GRADIENT)               */}
        {/* ===================================================================== */}
        <div
          ref={headerRef}
          className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 lg:mb-10 will-change-transform"
        >
          {/* Main Headline */}
          <h2 className="font-sans font-black text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] tracking-tight uppercase leading-[1.15] text-white">
            FROM RAW DOCUMENTS TO AUTONOMOUS SALES{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_20px_rgba(150,61,255,0.55)]">
              IN 5 MINUTES
            </span>
          </h2>

          {/* Supporting Description */}
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#9898A6] max-w-2xl mx-auto leading-relaxed font-normal">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* 3. THREE CONNECTED VISUAL STAGES WITH FLOATING ENERGY SPHERES         */}
        {/* ===================================================================== */}
        <div className="relative w-full">
          {/* ------------------------------------------------------------------- */}
          {/* FLOWING CURVED ENERGY BEAMS WITH FLOATING ( → ) ARROW NODES         */}
          {/* ------------------------------------------------------------------- */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-20 overflow-visible">
            {/* Beam 1: Between Sphere 1 and Sphere 2 */}
            <div className="absolute top-[100px] left-[27%] w-[16%] h-[70px]">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 70" fill="none">
                <defs>
                  <linearGradient id="beam1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#963DFF" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#C28AFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF713D" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="beamGlow1" x="-20%" y="-40%" width="140%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Glowing underlay path */}
                <path
                  d="M 10,25 C 70,5 120,55 190,35"
                  stroke="url(#beam1Grad)"
                  strokeWidth="3"
                  filter="url(#beamGlow1)"
                  className="opacity-60"
                />
                {/* Animated foreground beam */}
                <path
                  ref={beam1Ref}
                  d="M 10,25 C 70,5 120,55 190,35"
                  stroke="url(#beam1Grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              {/* Floating Arrow Node 1: Purple Circular Button */}
              <div
                ref={arrowNode1Ref}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#160B29] border border-[#963DFF] shadow-[0_0_18px_rgba(150,61,255,0.7)] flex items-center justify-center text-white pointer-events-auto cursor-pointer will-change-transform"
              >
                <ArrowRight className="w-4 h-4 text-[#C28AFF]" />
              </div>
            </div>

            {/* Beam 2: Between Sphere 2 and Sphere 3 */}
            <div className="absolute top-[100px] right-[27%] w-[16%] h-[70px]">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 70" fill="none">
                <defs>
                  <linearGradient id="beam2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF713D" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#C28AFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#22C8F2" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="beamGlow2" x="-20%" y="-40%" width="140%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Glowing underlay path */}
                <path
                  d="M 10,35 C 80,55 130,5 190,25"
                  stroke="url(#beam2Grad)"
                  strokeWidth="3"
                  filter="url(#beamGlow2)"
                  className="opacity-60"
                />
                {/* Animated foreground beam */}
                <path
                  ref={beam2Ref}
                  d="M 10,35 C 80,55 130,5 190,25"
                  stroke="url(#beam2Grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              {/* Floating Arrow Node 2: Magenta/Purple Circular Button */}
              <div
                ref={arrowNode2Ref}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1E0D28] border border-[#C28AFF] shadow-[0_0_18px_rgba(194,138,255,0.7)] flex items-center justify-center text-white pointer-events-auto cursor-pointer will-change-transform"
              >
                <ArrowRight className="w-4 h-4 text-[#C28AFF]" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* THREE STAGE COLUMNS                                                 */}
          {/* ------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-6 relative z-10 items-stretch">
            {/* ================================================================= */}
            {/* STAGE 01: INGESTION (PURPLE #963DFF)                              */}
            {/* ================================================================= */}
            <div
              ref={stage1Ref}
              className="flex flex-col items-center text-center will-change-transform"
            >
              {/* Visual 3D Energy Sphere & Pedestal */}
              <div
                ref={sphere1Ref}
                className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 mb-5 flex items-center justify-center shrink-0"
              >
                {/* Floor Energy Pedestal Disc */}
                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-6 sm:h-7 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-[#963DFF]/70 to-transparent blur-[7px]" />
                  <div className="absolute inset-x-4 top-1 h-3 rounded-[100%] border border-[#C28AFF]/80 shadow-[0_0_15px_#C28AFF]" />
                </div>

                {/* 3D Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#963DFF]/50 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.4) 0%, rgba(194, 138, 255, 0.3) 25%, rgba(150, 61, 255, 0.12) 55%, rgba(8, 4, 18, 0.75) 80%, rgba(150, 61, 255, 0.5) 100%)",
                    boxShadow:
                      "0 0 50px rgba(150, 61, 255, 0.45), inset 0 0 30px rgba(194, 138, 255, 0.35), inset 0 0 60px rgba(150, 61, 255, 0.2)",
                  }}
                >
                  {/* Internal ambient radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#963DFF]/15 to-[#C28AFF]/20 pointer-events-none" />

                  {/* 3D Floating Document Cards Inside Sphere */}
                  <div ref={docs1Ref} className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    {/* Back-Left Card: DOCX */}
                    <div
                      className="absolute top-7 left-8 px-2.5 py-1.5 rounded-lg bg-[#0F1E36]/90 border border-sky-400/40 text-sky-300 font-mono text-[9px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.6)]"
                      style={{ transform: "rotate(-12deg)" }}
                    >
                      DOCX
                    </div>

                    {/* Back-Right Card: TXT */}
                    <div
                      className="absolute top-9 right-8 px-2.5 py-1.5 rounded-lg bg-[#221035]/90 border border-purple-400/40 text-purple-300 font-mono text-[9px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.6)]"
                      style={{ transform: "rotate(14deg)" }}
                    >
                      TXT
                    </div>

                    {/* Front Prominent 3D Document: PDF */}
                    <div
                      className="relative z-20 w-20 sm:w-22 h-26 sm:h-28 rounded-xl bg-gradient-to-b from-white/90 to-white/70 p-2.5 shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_25px_rgba(150,61,255,0.4)] border border-white flex flex-col justify-between"
                      style={{ transform: "rotate(-4deg)" }}
                    >
                      {/* Top Folded Corner Graphic */}
                      <div className="flex items-center justify-between">
                        <FileText className="w-5 h-5 text-[#963DFF]" />
                        <div className="w-3.5 h-3.5 bg-neutral-300/80 rounded-bl-md border-b border-l border-neutral-400" />
                      </div>

                      {/* Content Preview Lines */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-[#963DFF]/30 rounded-full" />
                        <div className="w-3/4 h-1 bg-[#963DFF]/20 rounded-full" />
                        <div className="w-1/2 h-1 bg-[#963DFF]/20 rounded-full" />
                      </div>

                      {/* PDF Label */}
                      <div className="text-center font-mono font-black text-xs text-[#963DFF] tracking-wider">
                        PDF
                      </div>
                    </div>

                    {/* Front-Right Floating URL Link Pill */}
                    <div
                      className="absolute bottom-7 right-7 px-2.5 py-1 rounded-full bg-[#0D242B]/90 border border-teal-400/50 text-teal-300 font-mono text-[9px] font-bold flex items-center gap-1 shadow-[0_4px_14px_rgba(0,0,0,0.6)]"
                      style={{ transform: "rotate(6deg)" }}
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span>URL</span>
                    </div>
                  </div>
                </div>

                {/* Tilted Luminous Orbital Rings */}
                <div
                  className="absolute inset-[-12px] rounded-full border border-[#963DFF]/40 border-dashed animate-[spin_24s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(70deg) rotateZ(-20deg)" }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-t-2 border-[#C28AFF] shadow-[0_0_15px_#C28AFF] pointer-events-none"
                  style={{ transform: "rotateX(70deg) rotateZ(-20deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#963DFF] shadow-[0_0_8px_#963DFF]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase text-[#C28AFF]">
                  01 — INGESTION
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-lg sm:text-xl text-white uppercase tracking-tight mb-2">
                CONNECT KNOWLEDGE BASE
              </h3>

              {/* Stage Description */}
              <p className="text-[11px] sm:text-xs text-[#9898A6] max-w-xs leading-relaxed mb-3 font-normal">
                Upload brochures, pricing schedules, FAQs, technical manuals, or provide your website URL for instant indexing.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#963DFF]/10 border border-[#963DFF]/30 text-[#C28AFF] shadow-[0_0_10px_rgba(150,61,255,0.15)]">
                  <span>✦ Supports PDF, DOCX, TXT, CSV &amp; live URL crawler synchronization.</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[220px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2.5 px-6 rounded-full font-bold text-xs text-white bg-[#963DFF] shadow-[0_4px_20px_rgba(150,61,255,0.45)] hover:shadow-[0_4px_30px_rgba(150,61,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Start Ingestion</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* STAGE 02: PERSONA ENGINE (ORANGE #FF713D)                         */}
            {/* ================================================================= */}
            <div
              ref={stage2Ref}
              className="flex flex-col items-center text-center will-change-transform"
            >
              {/* Visual 3D Energy Sphere & Pedestal */}
              <div
                ref={sphere2Ref}
                className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 mb-5 flex items-center justify-center shrink-0"
              >
                {/* Floor Energy Pedestal Disc */}
                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-6 sm:h-7 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-[#FF713D]/70 to-transparent blur-[7px]" />
                  <div className="absolute inset-x-4 top-1 h-3 rounded-[100%] border border-[#FFA07A]/80 shadow-[0_0_15px_#FF713D]" />
                </div>

                {/* 3D Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#FF713D]/50 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255, 235, 215, 0.4) 0%, rgba(255, 170, 120, 0.3) 25%, rgba(255, 113, 61, 0.12) 55%, rgba(20, 10, 6, 0.75) 80%, rgba(255, 113, 61, 0.5) 100%)",
                    boxShadow:
                      "0 0 50px rgba(255, 113, 61, 0.45), inset 0 0 30px rgba(255, 180, 130, 0.35), inset 0 0 60px rgba(255, 113, 61, 0.2)",
                  }}
                >
                  {/* Internal ambient radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FF713D]/15 to-[#FFA07A]/20 pointer-events-none" />

                  {/* Inside: Friendly Robot Avatar + 4 Stacked Configuration Pills */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center px-2 pointer-events-none">
                    {/* Left/Center: Warm Friendly Robot Head */}
                    <div ref={robot2Ref} className="relative shrink-0 flex flex-col items-center mr-2">
                      {/* Antenna */}
                      <div className="w-1 h-2.5 bg-[#FF713D] rounded-full relative">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#FFA07A] shadow-[0_0_8px_#FFA07A]" />
                      </div>

                      {/* Robot Face Container */}
                      <div className="relative w-16 sm:w-18 h-13 sm:h-14 rounded-2xl bg-gradient-to-b from-[#FFA07A] via-[#FF713D] to-[#E65100] p-1 shadow-[0_0_20px_rgba(255,113,61,0.7)] flex items-center justify-center">
                        {/* Headset Ears */}
                        <div className="absolute -left-2 w-2 h-5 rounded-full bg-[#FF713D] border border-[#FFA07A]" />
                        <div className="absolute -right-2 w-2 h-5 rounded-full bg-[#FF713D] border border-[#FFA07A]" />

                        {/* Dark Screen Face with Smiling Eyes */}
                        <div className="w-full h-full rounded-xl bg-[#1A0A04] flex flex-col items-center justify-center px-1">
                          <div className="flex items-center gap-3">
                            {/* Smiling Arc Eyes */}
                            <div className="w-3 h-2 border-t-2 border-[#FFA07A] rounded-t-full shadow-[0_0_5px_#FFA07A]" />
                            <div className="w-3 h-2 border-t-2 border-[#FFA07A] rounded-t-full shadow-[0_0_5px_#FFA07A]" />
                          </div>
                          {/* Cute Curved Smile */}
                          <div className="w-3.5 h-1.5 border-b-2 border-[#FFA07A] rounded-b-full mt-1" />
                        </div>
                      </div>
                    </div>

                    {/* Right: 4 Floating Configuration Pills (Exact match to reference) */}
                    <div ref={pills2Ref} className="space-y-1 text-left shrink-0">
                      {/* Pill 1: Personality */}
                      <div className="px-2 py-0.5 rounded-md bg-[#180A04]/90 border border-[#FF713D]/60 text-white text-[8px] sm:text-[9px] font-sans flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF713D] shadow-[0_0_5px_#FF713D]" />
                        <span>Personality</span>
                      </div>

                      {/* Pill 2: Welcome Message */}
                      <div className="px-2 py-0.5 rounded-md bg-[#180A04]/90 border border-[#FF713D]/60 text-white text-[8px] sm:text-[9px] font-sans flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                        <MessageSquare className="w-2.5 h-2.5 text-[#FF713D]" />
                        <span>Welcome Message</span>
                      </div>

                      {/* Pill 3: Brand Style */}
                      <div className="px-2 py-0.5 rounded-md bg-[#180A04]/90 border border-[#FF713D]/60 text-white text-[8px] sm:text-[9px] font-sans flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                        <Palette className="w-2.5 h-2.5 text-[#FF713D]" />
                        <span>Brand Style</span>
                      </div>

                      {/* Pill 4: Launcher */}
                      <div className="px-2 py-0.5 rounded-md bg-[#180A04]/90 border border-[#FF713D]/60 text-white text-[8px] sm:text-[9px] font-sans flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                        <LayoutGrid className="w-2.5 h-2.5 text-[#FF713D]" />
                        <span>Launcher</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tilted Luminous Orbital Rings */}
                <div
                  className="absolute inset-[-12px] rounded-full border border-[#FF713D]/40 border-dashed animate-[spin_26s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(70deg) rotateZ(20deg)" }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-t-2 border-[#FFA07A] shadow-[0_0_15px_#FFA07A] pointer-events-none"
                  style={{ transform: "rotateX(70deg) rotateZ(20deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF713D] shadow-[0_0_8px_#FF713D]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase text-[#FF9E7A]">
                  02 — PERSONA ENGINE
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-lg sm:text-xl text-white uppercase tracking-tight mb-2">
                CALIBRATE PERSONA STYLING
              </h3>

              {/* Stage Description */}
              <p className="text-[11px] sm:text-xs text-[#9898A6] max-w-xs leading-relaxed mb-3 font-normal">
                Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and attention-grabbing animation.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#FF713D]/10 border border-[#FF713D]/30 text-[#FF9E7A] shadow-[0_0_10px_rgba(255,113,61,0.15)]">
                  <span>✦ Custom logo upload, squircle / circle buttons, and 19 launcher animations.</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[220px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2.5 px-6 rounded-full font-bold text-xs text-white bg-[#FF713D] shadow-[0_4px_20px_rgba(255,113,61,0.45)] hover:shadow-[0_4px_30px_rgba(255,113,61,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Calibrate Persona</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* STAGE 03: LIVE EMBED (CYAN #22C8F2)                               */}
            {/* ================================================================= */}
            <div
              ref={stage3Ref}
              className="flex flex-col items-center text-center will-change-transform"
            >
              {/* Visual 3D Energy Sphere & Pedestal */}
              <div
                ref={sphere3Ref}
                className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 mb-5 flex items-center justify-center shrink-0"
              >
                {/* Floor Energy Pedestal Disc */}
                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-6 sm:h-7 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-[#22C8F2]/70 to-transparent blur-[7px]" />
                  <div className="absolute inset-x-4 top-1 h-3 rounded-[100%] border border-[#7AE5FF]/80 shadow-[0_0_15px_#22C8F2]" />
                </div>

                {/* 3D Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#22C8F2]/50 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(220, 250, 255, 0.4) 0%, rgba(120, 230, 255, 0.3) 25%, rgba(34, 200, 242, 0.12) 55%, rgba(6, 18, 26, 0.75) 80%, rgba(34, 200, 242, 0.5) 100%)",
                    boxShadow:
                      "0 0 50px rgba(34, 200, 242, 0.45), inset 0 0 30px rgba(130, 235, 255, 0.35), inset 0 0 60px rgba(34, 200, 242, 0.2)",
                  }}
                >
                  {/* Internal ambient radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#22C8F2]/15 to-[#80EAFF]/20 pointer-events-none" />

                  {/* Inside: 3D Floating Browser Window + Cyan Pointer Cursor */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    {/* Floating Browser Window (Exact match to reference) */}
                    <div
                      ref={browser3Ref}
                      className="relative w-30 sm:w-34 h-22 sm:h-24 rounded-xl bg-[#07131D]/95 border border-[#22C8F2]/60 p-2 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(34,200,242,0.3)] text-left flex flex-col justify-between"
                      style={{ transform: "perspective(800px) rotateY(-5deg) rotateX(4deg)" }}
                    >
                      {/* Window Controls & </> Embed Pill */}
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[7px] sm:text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#22C8F2] text-[#050509] shadow-[0_0_8px_#22C8F2]">
                          &lt;/&gt; Embed
                        </span>
                      </div>

                      {/* Center Code Symbol </ > */}
                      <div className="flex items-center justify-center my-auto">
                        <span className="font-mono font-black text-xl sm:text-2xl text-[#22C8F2] tracking-widest drop-shadow-[0_0_12px_#22C8F2]">
                          &lt;/&gt;
                        </span>
                      </div>
                    </div>

                    {/* Cyan 3D Pointer Cursor (Pointing at the window) */}
                    <div
                      ref={cursor3Ref}
                      className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 pointer-events-none"
                    >
                      <svg
                        className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_0_15px_#22C8F2]"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M6 3 L26 15 L16 17 L21 28 L17 30 L12 19 L6 25 Z"
                          fill="#22C8F2"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tilted Luminous Orbital Rings */}
                <div
                  className="absolute inset-[-12px] rounded-full border border-[#22C8F2]/40 border-dashed animate-[spin_22s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(70deg) rotateZ(-15deg)" }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-t-2 border-[#7AE5FF] shadow-[0_0_15px_#7AE5FF] pointer-events-none"
                  style={{ transform: "rotateX(70deg) rotateZ(-15deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C8F2] shadow-[0_0_8px_#22C8F2]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase text-[#22C8F2]">
                  03 — LIVE EMBED
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-lg sm:text-xl text-white uppercase tracking-tight mb-2">
                DEPLOY SINGLE LINE CODE
              </h3>

              {/* Stage Description */}
              <p className="text-[11px] sm:text-xs text-[#9898A6] max-w-xs leading-relaxed mb-3 font-normal">
                Integrate the assistant into your website using the provided script with instant anti-cache live updates.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#22C8F2]/10 border border-[#22C8F2]/30 text-[#7AE5FF] shadow-[0_0_10px_rgba(34,200,242,0.15)]">
                  <span>✦ Zero dependencies, anti-cache instant updates, and mobile-optimized viewport.</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[220px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2.5 px-6 rounded-full font-bold text-xs text-[#050509] bg-[#22C8F2] shadow-[0_4px_20px_rgba(34,200,242,0.45)] hover:shadow-[0_4px_30px_rgba(34,200,242,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Get Embed Code</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 4. THE BOTTOM TIMELINE BEAM (EXACT MATCH TO REFERENCE)              */}
          {/* =================================================================== */}
          <div className="hidden lg:block relative mt-10 max-w-4xl mx-auto pointer-events-none">
            <svg
              className="w-full h-8 overflow-visible"
              viewBox="0 0 800 32"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="bottomLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#963DFF" />
                  <stop offset="50%" stopColor="#FF713D" />
                  <stop offset="100%" stopColor="#22C8F2" />
                </linearGradient>
              </defs>

              {/* Connecting line */}
              <line
                ref={bottomLineRef}
                x1="40"
                y1="16"
                x2="760"
                y2="16"
                stroke="url(#bottomLineGrad)"
                strokeWidth="2"
              />

              {/* Node 1: Purple */}
              <g ref={bNode1Ref} transform="translate(40, 16)">
                <circle cx="0" cy="0" r="7" fill="#180D2E" stroke="#963DFF" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#C28AFF" shadow="0 0 8px #C28AFF" />
              </g>

              {/* Node 2: Orange */}
              <g ref={bNode2Ref} transform="translate(400, 16)">
                <circle cx="0" cy="0" r="7" fill="#1A0A04" stroke="#FF713D" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#FFA07A" shadow="0 0 8px #FFA07A" />
              </g>

              {/* Node 3: Cyan */}
              <g ref={bNode3Ref} transform="translate(760, 16)">
                <circle cx="0" cy="0" r="7" fill="#081822" stroke="#22C8F2" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#7AE5FF" shadow="0 0 8px #7AE5FF" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
