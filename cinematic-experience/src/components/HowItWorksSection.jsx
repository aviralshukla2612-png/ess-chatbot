"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Globe,
  ArrowRight,
  MessageSquare,
  Palette,
  LayoutGrid,
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
    // DESKTOP & LARGE SCREENS (>= 1024px): Connected Single-Screen Fit
    // =========================================================================
    mm.add("(min-width: 1024px)", () => {
      // Initial states
      if (headerRef.current) gsap.set(headerRef.current, { autoAlpha: 0, y: 15 });

      const stages = [stage1Ref.current, stage2Ref.current, stage3Ref.current];
      stages.forEach((st) => {
        if (st) gsap.set(st, { autoAlpha: 0, y: 20 });
      });

      const spheres = [sphere1Ref.current, sphere2Ref.current, sphere3Ref.current];
      spheres.forEach((sp) => {
        if (sp) gsap.set(sp, { scale: 0.9, autoAlpha: 0 });
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
        tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
      }

      // 2. Stage 1 (Purple - Ingestion) entrance
      if (stage1Ref.current && sphere1Ref.current) {
        tl.to(sphere1Ref.current, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" }, 0.15);
        tl.to(stage1Ref.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.25);
      }

      // 3. Beam 1 draws from Stage 1 to Stage 2 & Arrow Node 1 pops
      if (beam1Ref.current) {
        tl.to(beam1Ref.current, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 0.35);
      }
      if (arrowNode1Ref.current) {
        tl.to(arrowNode1Ref.current, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(1.8)" }, 0.5);
      }

      // 4. Stage 2 (Orange - Persona Engine) entrance
      if (stage2Ref.current && sphere2Ref.current) {
        tl.to(sphere2Ref.current, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" }, 0.45);
        tl.to(stage2Ref.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.55);
      }

      // 5. Beam 2 draws from Stage 2 to Stage 3 & Arrow Node 2 pops
      if (beam2Ref.current) {
        tl.to(beam2Ref.current, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 0.65);
      }
      if (arrowNode2Ref.current) {
        tl.to(arrowNode2Ref.current, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(1.8)" }, 0.8);
      }

      // 6. Stage 3 (Cyan - Live Embed) entrance
      if (stage3Ref.current && sphere3Ref.current) {
        tl.to(sphere3Ref.current, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.5)" }, 0.75);
        tl.to(stage3Ref.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.85);
      }

      // 7. Bottom timeline reveals
      if (bottomLineRef.current) {
        tl.to(bottomLineRef.current, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 0.75);
      }
      bNodes.forEach((bn, idx) => {
        if (bn) {
          tl.to(bn, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(1.8)" }, 0.8 + idx * 0.12);
        }
      });

      // Ambient Floating Micro-Animations
      if (docs1Ref.current) {
        gsap.to(docs1Ref.current.children, {
          y: "-=4",
          rotation: "+=1.5",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.3,
        });
      }

      if (robot2Ref.current) {
        gsap.to(robot2Ref.current, {
          y: "-=5",
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (pills2Ref.current) {
        gsap.to(pills2Ref.current.children, {
          x: "+=2.5",
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.25,
        });
      }

      if (browser3Ref.current) {
        gsap.to(browser3Ref.current, {
          y: "-=4",
          rotateY: 2,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (cursor3Ref.current) {
        gsap.to(cursor3Ref.current, {
          scale: 1.12,
          duration: 1.3,
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
            { autoAlpha: 0, y: 25 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.65,
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
      className="relative w-full min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] bg-[#050509] text-[#F5F5F7] overflow-hidden select-none flex flex-col justify-between pt-16 sm:pt-18 lg:pt-12 pb-3 sm:pb-4 px-3 sm:px-6 lg:px-8"
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
        <div className="absolute top-[25%] left-[6%] w-[320px] h-[260px] rounded-full bg-[#963DFF]/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[280px] h-[240px] rounded-full bg-[#FF713D]/12 blur-[100px] pointer-events-none" />
        <div className="absolute top-[25%] right-[6%] w-[320px] h-[260px] rounded-full bg-[#22C8F2]/14 blur-[100px] pointer-events-none" />

        {/* Top/Bottom Edge Fades */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#050509] via-[#050509]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050509] via-[#050509]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1340px] mx-auto w-full flex-1 flex flex-col justify-between my-auto">
        {/* ===================================================================== */}
        {/* 2. SECTION HEADING (COMPACT & HIGH CONTRAST)                          */}
        {/* ===================================================================== */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-2 sm:mb-3 shrink-0 will-change-transform"
        >
          {/* Main Headline */}
          <h2 className="font-sans font-black text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] tracking-tight uppercase leading-tight text-white">
            FROM RAW DOCUMENTS TO AUTONOMOUS SALES{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_15px_rgba(150,61,255,0.55)]">
              IN 5 MINUTES
            </span>
          </h2>

          {/* Supporting Description */}
          <p className="mt-1.5 text-xs sm:text-sm text-[#9898A6] max-w-xl mx-auto leading-relaxed font-normal">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* 3. THREE CONNECTED VISUAL STAGES WITH EQUATOR-ALIGNED FLOWING BEAMS   */}
        {/* ===================================================================== */}
        <div className="relative w-full flex-1 flex flex-col justify-center my-auto">
          {/* ------------------------------------------------------------------- */}
          {/* THREE STAGE COLUMNS WITH INTEGRATED EQUATOR-LOCKED CONNECTING BEAMS */}
          {/* ------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-5 relative z-10 items-stretch">
            {/* ----------------------------------------------------------------- */}
            {/* EQUATOR-ALIGNED FLOWING ENERGY BEAMS (LOCKED TO SPHERES y=100px)  */}
            {/* ----------------------------------------------------------------- */}
            <div className="hidden lg:block absolute inset-x-0 top-0 h-[195px] xl:h-[210px] pointer-events-none z-20 overflow-visible">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 1200 200"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Beam 1 Gradient: Purple -> Magenta -> Orange */}
                  <linearGradient id="beam1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#963DFF" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#C28AFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF713D" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Beam 2 Gradient: Orange -> Magenta -> Cyan */}
                  <linearGradient id="beam2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF713D" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#C28AFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#22C8F2" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Beam Subtle Glow Filter */}
                  <filter id="beamGlow" x="-20%" y="-40%" width="140%" height="180%">
                    <feGaussianBlur stdDeviation="3.5" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Traveling Pure Light Pulse Glow Filter */}
                  <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="4.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* ----------------- BEAM 1 (Sphere 1 -> Sphere 2) ----------------- */}
                {/* Luminous Underlay S-Curve */}
                <path
                  d="M 295,100 C 335,78 370,78 400,100 C 430,122 465,122 505,100"
                  stroke="url(#beam1Grad)"
                  strokeWidth="4"
                  filter="url(#beamGlow)"
                  className="opacity-45"
                />

                {/* Core Line (GSAP Draw/Reveal) */}
                <path
                  ref={beam1Ref}
                  d="M 295,100 C 335,78 370,78 400,100 C 430,122 465,122 505,100"
                  stroke="url(#beam1Grad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Pure Traveling Glowing Light Orb along Beam 1 */}
                <g>
                  <animateMotion
                    path="M 295,100 C 335,78 370,78 400,100 C 430,122 465,122 505,100"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                  <circle r="14" fill="#963DFF" opacity="0.45" filter="url(#pulseGlow)" />
                  <circle r="7" fill="#C28AFF" opacity="0.85" filter="url(#pulseGlow)" />
                  <circle r="3" fill="#FFFFFF" opacity="0.95" />
                </g>

                {/* ----------------- BEAM 2 (Sphere 2 -> Sphere 3) ----------------- */}
                {/* Luminous Underlay S-Curve */}
                <path
                  d="M 695,100 C 735,122 770,122 800,100 C 830,78 865,78 905,100"
                  stroke="url(#beam2Grad)"
                  strokeWidth="4"
                  filter="url(#beamGlow)"
                  className="opacity-45"
                />

                {/* Core Line (GSAP Draw/Reveal) */}
                <path
                  ref={beam2Ref}
                  d="M 695,100 C 735,122 770,122 800,100 C 830,78 865,78 905,100"
                  stroke="url(#beam2Grad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Pure Traveling Glowing Light Orb along Beam 2 */}
                <g>
                  <animateMotion
                    path="M 695,100 C 735,122 770,122 800,100 C 830,78 865,78 905,100"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                  <circle r="14" fill="#22C8F2" opacity="0.45" filter="url(#pulseGlow)" />
                  <circle r="7" fill="#7AE5FF" opacity="0.85" filter="url(#pulseGlow)" />
                  <circle r="3" fill="#FFFFFF" opacity="0.95" />
                </g>
              </svg>

              {/* Floating Arrow Node 1 (Midpoint between Col 1 & 2 at y=100px) */}
              <div
                ref={arrowNode1Ref}
                className="absolute left-[33.33%] top-[100px] xl:top-[105px] -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#160B29] border border-[#963DFF] shadow-[0_0_22px_rgba(150,61,255,0.85)] flex items-center justify-center text-white pointer-events-auto cursor-pointer will-change-transform z-30 group"
              >
                <span className="absolute inset-0 rounded-full bg-[#963DFF]/25 animate-ping pointer-events-none" />
                <ArrowRight className="w-4.5 h-4.5 text-[#C28AFF] transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Floating Arrow Node 2 (Midpoint between Col 2 & 3 at y=100px) */}
              <div
                ref={arrowNode2Ref}
                className="absolute left-[66.66%] top-[100px] xl:top-[105px] -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1E0D28] border border-[#C28AFF] shadow-[0_0_22px_rgba(194,138,255,0.85)] flex items-center justify-center text-white pointer-events-auto cursor-pointer will-change-transform z-30 group"
              >
                <span className="absolute inset-0 rounded-full bg-[#C28AFF]/25 animate-ping pointer-events-none" />
                <ArrowRight className="w-4.5 h-4.5 text-[#C28AFF] transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
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
                className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-[195px] lg:h-[195px] xl:w-[210px] xl:h-[210px] mb-2 sm:mb-2.5 flex items-center justify-center shrink-0"
              >
                {/* Floor Energy Pedestal Disc */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-6 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-[#963DFF]/85 to-transparent blur-[7px]" />
                  <div className="absolute inset-x-2 top-0.5 h-3.5 rounded-[100%] border-2 border-[#C28AFF] shadow-[0_0_18px_#C28AFF]" />
                </div>

                {/* 3D Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#C28AFF]/60 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.45) 0%, rgba(194, 138, 255, 0.35) 20%, rgba(150, 61, 255, 0.15) 50%, rgba(10, 4, 22, 0.85) 80%, rgba(150, 61, 255, 0.6) 100%)",
                    boxShadow:
                      "0 0 55px rgba(150, 61, 255, 0.5), inset 0 0 35px rgba(194, 138, 255, 0.4), inset 0 0 65px rgba(150, 61, 255, 0.25)",
                  }}
                >
                  {/* Glossy Top Glass Specular Arc Reflection */}
                  <div className="absolute top-1 inset-x-5 h-1/3 rounded-t-full bg-gradient-to-b from-white/45 via-white/10 to-transparent blur-[1px] pointer-events-none z-30" />

                  {/* Internal ambient radial glow & bottom pool */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#963DFF]/20 to-[#C28AFF]/25 pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-1/2 rounded-b-full bg-gradient-to-t from-[#963DFF]/40 via-transparent to-transparent pointer-events-none" />

                  {/* 3D Floating Document Cards Inside Sphere */}
                  <div ref={docs1Ref} className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    {/* Back-Left Card: DOCX */}
                    <div
                      className="absolute top-6 left-5 px-2.5 py-1 rounded-md bg-[#0F1E36]/90 border border-sky-400/50 text-sky-300 font-mono text-[9px] font-bold shadow-md"
                      style={{ transform: "rotate(-12deg)" }}
                    >
                      DOCX
                    </div>

                    {/* Back-Right Card: TXT */}
                    <div
                      className="absolute top-7 right-5 px-2.5 py-1 rounded-md bg-[#221035]/90 border border-purple-400/50 text-purple-300 font-mono text-[9px] font-bold shadow-md"
                      style={{ transform: "rotate(14deg)" }}
                    >
                      TXT
                    </div>

                    {/* Front Prominent 3D Document: PDF */}
                    <div
                      className="relative z-20 w-20 sm:w-22 h-26 sm:h-28 rounded-xl bg-gradient-to-b from-white to-neutral-100 p-2.5 shadow-[0_16px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(150,61,255,0.45)] border border-white flex flex-col justify-between"
                      style={{ transform: "rotate(-4deg)" }}
                    >
                      {/* Top Folded Corner Graphic */}
                      <div className="flex items-center justify-between">
                        <FileText className="w-5 h-5 text-[#963DFF]" />
                        <div className="w-3 h-3 bg-neutral-300/80 rounded-bl-sm border-b border-l border-neutral-400" />
                      </div>

                      {/* Content Preview Lines */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-[#963DFF]/35 rounded-full" />
                        <div className="w-4/5 h-1 bg-[#963DFF]/25 rounded-full" />
                        <div className="w-3/5 h-1 bg-[#963DFF]/25 rounded-full" />
                      </div>

                      {/* PDF Label */}
                      <div className="text-center font-mono font-black text-xs text-[#963DFF] tracking-wider">
                        PDF
                      </div>
                    </div>

                    {/* Front-Right Floating URL Link Pill */}
                    <div
                      className="absolute bottom-6 right-5 px-2.5 py-1 rounded-full bg-[#0D242B]/95 border border-teal-400/60 text-teal-300 font-mono text-[9px] font-bold flex items-center gap-1 shadow-md"
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
                  style={{ transform: "rotateX(72deg) rotateZ(-20deg)" }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-t-2 border-[#C28AFF] shadow-[0_0_16px_#C28AFF] pointer-events-none"
                  style={{ transform: "rotateX(72deg) rotateZ(-20deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#963DFF] shadow-[0_0_8px_#963DFF]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-[#C28AFF]">
                  01 — INGESTION
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-base sm:text-lg lg:text-[19px] text-white uppercase tracking-tight mb-1">
                CONNECT KNOWLEDGE BASE
              </h3>

              {/* Stage Description */}
              <p className="text-xs sm:text-[13px] text-[#A5A5B5] max-w-[320px] leading-relaxed mb-2 font-normal line-clamp-2">
                Upload brochures, pricing schedules, FAQs, technical manuals, or provide your website URL for instant indexing.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-2 sm:mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#963DFF]/15 border border-[#963DFF]/35 text-[#C28AFF] shadow-[0_0_10px_rgba(150,61,255,0.2)]">
                  <span>✦ Supports PDF, DOCX, TXT, CSV &amp; live URL crawler sync.</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[210px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2 sm:py-2.5 px-6 rounded-full font-bold text-xs sm:text-sm text-white bg-[#963DFF] shadow-[0_4px_20px_rgba(150,61,255,0.45)] hover:shadow-[0_4px_28px_rgba(150,61,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
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
                className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-[195px] lg:h-[195px] xl:w-[210px] xl:h-[210px] mb-2 sm:mb-2.5 flex items-center justify-center shrink-0"
              >
                {/* Floor Energy Pedestal Disc */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-6 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-[#FF713D]/85 to-transparent blur-[7px]" />
                  <div className="absolute inset-x-2 top-0.5 h-3.5 rounded-[100%] border-2 border-[#FFA07A] shadow-[0_0_18px_#FF713D]" />
                </div>

                {/* 3D Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#FFA07A]/60 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(255, 240, 225, 0.45) 0%, rgba(255, 170, 120, 0.35) 20%, rgba(255, 113, 61, 0.15) 50%, rgba(24, 10, 4, 0.85) 80%, rgba(255, 113, 61, 0.6) 100%)",
                    boxShadow:
                      "0 0 55px rgba(255, 113, 61, 0.5), inset 0 0 35px rgba(255, 180, 130, 0.4), inset 0 0 65px rgba(255, 113, 61, 0.25)",
                  }}
                >
                  {/* Glossy Top Glass Specular Arc Reflection */}
                  <div className="absolute top-1 inset-x-5 h-1/3 rounded-t-full bg-gradient-to-b from-white/45 via-white/10 to-transparent blur-[1px] pointer-events-none z-30" />

                  {/* Internal ambient radial glow & bottom pool */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FF713D]/20 to-[#FFA07A]/25 pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-1/2 rounded-b-full bg-gradient-to-t from-[#FF713D]/40 via-transparent to-transparent pointer-events-none" />

                  {/* Inside: Friendly Robot Avatar + 4 Stacked Configuration Pills */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center px-1 pointer-events-none">
                    {/* Left/Center: Warm Friendly Robot Head */}
                    <div ref={robot2Ref} className="relative shrink-0 flex flex-col items-center mr-2">
                      {/* Antenna */}
                      <div className="w-1 h-2.5 bg-[#FF713D] rounded-full relative">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#FFA07A] shadow-[0_0_8px_#FFA07A]" />
                      </div>

                      {/* Robot Face Container */}
                      <div className="relative w-16 sm:w-18 h-13 sm:h-14 rounded-2xl bg-gradient-to-b from-[#FFA07A] via-[#FF713D] to-[#D84315] p-0.5 shadow-[0_0_20px_rgba(255,113,61,0.75)] flex items-center justify-center">
                        {/* Headset Ears */}
                        <div className="absolute -left-2 w-2 h-5 rounded-full bg-[#FF713D] border border-[#FFA07A]" />
                        <div className="absolute -right-2 w-2 h-5 rounded-full bg-[#FF713D] border border-[#FFA07A]" />

                        {/* Dark Screen Face with Smiling Eyes */}
                        <div className="w-full h-full rounded-xl bg-[#140602] flex flex-col items-center justify-center px-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-2 border-t-2.5 border-[#FFA07A] rounded-t-full shadow-[0_0_5px_#FFA07A]" />
                            <div className="w-3 h-2 border-t-2.5 border-[#FFA07A] rounded-t-full shadow-[0_0_5px_#FFA07A]" />
                          </div>
                          <div className="w-3.5 h-1.5 border-b-2 border-[#FFA07A] rounded-b-full mt-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Right: 4 Floating Configuration Pills */}
                    <div ref={pills2Ref} className="space-y-1 text-left shrink-0">
                      <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-[#140602]/95 border border-[#FF713D]/70 text-white text-[8px] sm:text-[9.5px] font-sans font-medium flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF713D] shadow-[0_0_6px_#FF713D]" />
                        <span>Personality</span>
                      </div>
                      <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-[#140602]/95 border border-[#FF713D]/70 text-white text-[8px] sm:text-[9.5px] font-sans font-medium flex items-center gap-1.5 shadow-md">
                        <MessageSquare className="w-2.5 h-2.5 text-[#FF713D]" />
                        <span>Welcome Msg</span>
                      </div>
                      <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-[#140602]/95 border border-[#FF713D]/70 text-white text-[8px] sm:text-[9.5px] font-sans font-medium flex items-center gap-1.5 shadow-md">
                        <Palette className="w-2.5 h-2.5 text-[#FF713D]" />
                        <span>Brand Style</span>
                      </div>
                      <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-[#140602]/95 border border-[#FF713D]/70 text-white text-[8px] sm:text-[9.5px] font-sans font-medium flex items-center gap-1.5 shadow-md">
                        <LayoutGrid className="w-2.5 h-2.5 text-[#FF713D]" />
                        <span>Launcher</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tilted Luminous Orbital Rings */}
                <div
                  className="absolute inset-[-12px] rounded-full border border-[#FF713D]/40 border-dashed animate-[spin_26s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(72deg) rotateZ(20deg)" }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-t-2 border-[#FFA07A] shadow-[0_0_16px_#FFA07A] pointer-events-none"
                  style={{ transform: "rotateX(72deg) rotateZ(20deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF713D] shadow-[0_0_8px_#FF713D]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-[#FF9E7A]">
                  02 — PERSONA ENGINE
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-base sm:text-lg lg:text-[19px] text-white uppercase tracking-tight mb-1">
                CALIBRATE PERSONA STYLING
              </h3>

              {/* Stage Description */}
              <p className="text-xs sm:text-[13px] text-[#A5A5B5] max-w-[320px] leading-relaxed mb-2 font-normal line-clamp-2">
                Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and attention-grabbing animation.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-2 sm:mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#FF713D]/15 border border-[#FF713D]/35 text-[#FF9E7A] shadow-[0_0_10px_rgba(255,113,61,0.2)]">
                  <span>✦ Custom logo upload, squircle / circle buttons &amp; 19 launcher animations.</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[210px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2 sm:py-2.5 px-6 rounded-full font-bold text-xs sm:text-sm text-white bg-[#FF713D] shadow-[0_4px_20px_rgba(255,113,61,0.45)] hover:shadow-[0_4px_28px_rgba(255,113,61,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
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
                className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-[195px] lg:h-[195px] xl:w-[210px] xl:h-[210px] mb-2 sm:mb-2.5 flex items-center justify-center shrink-0"
              >
                {/* Floor Energy Pedestal Disc */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-6 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-[#22C8F2]/85 to-transparent blur-[7px]" />
                  <div className="absolute inset-x-2 top-0.5 h-3.5 rounded-[100%] border-2 border-[#7AE5FF] shadow-[0_0_18px_#22C8F2]" />
                </div>

                {/* 3D Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#7AE5FF]/60 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(220, 250, 255, 0.45) 0%, rgba(122, 229, 255, 0.35) 20%, rgba(34, 200, 242, 0.15) 50%, rgba(4, 18, 30, 0.85) 80%, rgba(34, 200, 242, 0.6) 100%)",
                    boxShadow:
                      "0 0 55px rgba(34, 200, 242, 0.5), inset 0 0 35px rgba(122, 229, 255, 0.4), inset 0 0 65px rgba(34, 200, 242, 0.25)",
                  }}
                >
                  {/* Glossy Top Glass Specular Arc Reflection */}
                  <div className="absolute top-1 inset-x-5 h-1/3 rounded-t-full bg-gradient-to-b from-white/45 via-white/10 to-transparent blur-[1px] pointer-events-none z-30" />

                  {/* Internal ambient radial glow & bottom pool */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#22C8F2]/20 to-[#80EAFF]/25 pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-1/2 rounded-b-full bg-gradient-to-t from-[#22C8F2]/40 via-transparent to-transparent pointer-events-none" />

                  {/* Inside: 3D Floating Browser Window + Cyan Pointer Cursor */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    {/* Floating Browser Window */}
                    <div
                      ref={browser3Ref}
                      className="relative w-28 sm:w-32 h-20 sm:h-22 rounded-xl bg-[#05111B]/95 border border-[#22C8F2]/70 p-2 shadow-[0_16px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(34,200,242,0.35)] text-left flex flex-col justify-between"
                      style={{ transform: "perspective(800px) rotateY(-5deg) rotateX(4deg)" }}
                    >
                      {/* Window Controls & </> Embed Pill */}
                      <div className="flex items-center justify-between border-b border-white/[0.1] pb-1">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#22C8F2] text-[#050509] shadow-[0_0_8px_#22C8F2]">
                          &lt;/&gt; Embed
                        </span>
                      </div>

                      {/* Center Code Symbol </ > */}
                      <div className="flex items-center justify-center my-auto">
                        <span className="font-mono font-black text-lg sm:text-xl text-[#22C8F2] tracking-widest drop-shadow-[0_0_12px_#22C8F2]">
                          &lt;/&gt;
                        </span>
                      </div>
                    </div>

                    {/* Cyan 3D Pointer Cursor */}
                    <div
                      ref={cursor3Ref}
                      className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 pointer-events-none"
                    >
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_0_14px_#22C8F2]"
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
                  style={{ transform: "rotateX(72deg) rotateZ(-15deg)" }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-t-2 border-[#7AE5FF] shadow-[0_0_16px_#7AE5FF] pointer-events-none"
                  style={{ transform: "rotateX(72deg) rotateZ(-15deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C8F2] shadow-[0_0_8px_#22C8F2]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-[#22C8F2]">
                  03 — LIVE EMBED
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-base sm:text-lg lg:text-[19px] text-white uppercase tracking-tight mb-1">
                DEPLOY SINGLE LINE CODE
              </h3>

              {/* Stage Description */}
              <p className="text-xs sm:text-[13px] text-[#A5A5B5] max-w-[320px] leading-relaxed mb-2 font-normal line-clamp-2">
                Integrate the assistant into your website using the provided script with instant anti-cache live updates.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-2 sm:mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#22C8F2]/15 border border-[#22C8F2]/35 text-[#7AE5FF] shadow-[0_0_10px_rgba(34,200,242,0.2)]">
                  <span>✦ Zero dependencies, anti-cache instant updates &amp; mobile-ready.</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[210px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2 sm:py-2.5 px-6 rounded-full font-bold text-xs sm:text-sm text-[#050509] bg-[#22C8F2] shadow-[0_4px_20px_rgba(34,200,242,0.45)] hover:shadow-[0_4px_28px_rgba(34,200,242,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Get Embed Code</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 4. THE BOTTOM TIMELINE BEAM (COMPACT)                               */}
          {/* =================================================================== */}
          <div className="hidden lg:block relative mt-3 sm:mt-4 max-w-2xl mx-auto shrink-0 pointer-events-none">
            <svg
              className="w-full h-6 overflow-visible"
              viewBox="0 0 600 24"
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
                x1="30"
                y1="12"
                x2="570"
                y2="12"
                stroke="url(#bottomLineGrad)"
                strokeWidth="1.75"
              />

              {/* Node 1: Purple */}
              <g ref={bNode1Ref} transform="translate(30, 12)">
                <circle cx="0" cy="0" r="7" fill="#180D2E" stroke="#963DFF" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#C28AFF" />
              </g>

              {/* Node 2: Orange */}
              <g ref={bNode2Ref} transform="translate(300, 12)">
                <circle cx="0" cy="0" r="7" fill="#1A0A04" stroke="#FF713D" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#FFA07A" />
              </g>

              {/* Node 3: Cyan */}
              <g ref={bNode3Ref} transform="translate(570, 12)">
                <circle cx="0" cy="0" r="7" fill="#081822" stroke="#22C8F2" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#7AE5FF" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
