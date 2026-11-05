"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Globe,
  Code2,
  Check,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Palette,
  Sliders,
  Layers,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HowItWorksSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const energyLineRef = useRef(null);
  const energyPulseRef = useRef(null);

  // Stage 1 Refs (Ingestion - Purple)
  const stage1Ref = useRef(null);
  const sphere1Ref = useRef(null);
  const docs1Ref = useRef(null);

  // Stage 2 Refs (Persona Engine - Orange)
  const stage2Ref = useRef(null);
  const sphere2Ref = useRef(null);
  const pills2Ref = useRef(null);

  // Stage 3 Refs (Live Embed - Cyan)
  const stage3Ref = useRef(null);
  const sphere3Ref = useRef(null);
  const embed3Ref = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // =========================================================================
    // DESKTOP & LARGE SCREENS (>= 1024px): Connected 3-Stage Composition
    // =========================================================================
    mm.add("(min-width: 1024px)", () => {
      // 1. Set initial states
      if (headerRef.current) gsap.set(headerRef.current, { autoAlpha: 0, y: 30 });

      const stages = [stage1Ref.current, stage2Ref.current, stage3Ref.current];
      stages.forEach((st) => {
        if (st) gsap.set(st, { autoAlpha: 0, y: 40 });
      });

      const spheres = [sphere1Ref.current, sphere2Ref.current, sphere3Ref.current];
      spheres.forEach((sp) => {
        if (sp) gsap.set(sp, { scale: 0.88, autoAlpha: 0 });
      });

      if (energyLineRef.current) {
        gsap.set(energyLineRef.current, { strokeDashoffset: 1200, strokeDasharray: 1200 });
      }

      // 2. Coordinated Scroll-Driven Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 75%",
          end: "bottom 85%",
          toggleActions: "play none none reverse",
        },
      });

      // Header reveal
      if (headerRef.current) {
        tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0);
      }

      // Draw horizontal energy line connecting all 3 spheres
      if (energyLineRef.current) {
        tl.to(
          energyLineRef.current,
          { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" },
          0.2
        );
      }

      // Reveal Stage 1 (Purple - Ingestion)
      if (stage1Ref.current && sphere1Ref.current) {
        tl.to(
          sphere1Ref.current,
          { scale: 1, autoAlpha: 1, duration: 0.8, ease: "back.out(1.4)" },
          0.3
        );
        tl.to(stage1Ref.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.4);
      }

      // Reveal Stage 2 (Orange - Persona Engine)
      if (stage2Ref.current && sphere2Ref.current) {
        tl.to(
          sphere2Ref.current,
          { scale: 1, autoAlpha: 1, duration: 0.8, ease: "back.out(1.4)" },
          0.6
        );
        tl.to(stage2Ref.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.7);
      }

      // Reveal Stage 3 (Cyan - Live Embed)
      if (stage3Ref.current && sphere3Ref.current) {
        tl.to(
          sphere3Ref.current,
          { scale: 1, autoAlpha: 1, duration: 0.8, ease: "back.out(1.4)" },
          0.9
        );
        tl.to(stage3Ref.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 1.0);
      }

      // Floating ambient animations inside spheres
      if (docs1Ref.current) {
        gsap.to(docs1Ref.current.children, {
          y: "-=6",
          rotation: "+=2",
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.35,
        });
      }

      if (pills2Ref.current) {
        gsap.to(pills2Ref.current.children, {
          y: "-=5",
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.4,
        });
      }

      if (embed3Ref.current) {
        gsap.to(embed3Ref.current, {
          y: "-=6",
          rotateX: 4,
          rotateY: -3,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });

    // =========================================================================
    // MOBILE & TABLET (< 1024px): Sequential Vertical Flow
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
            { autoAlpha: 0, y: 35 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.75,
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
      className="relative w-full bg-[#050509] text-[#F5F5F7] overflow-hidden select-none py-16 sm:py-24 lg:py-28"
    >
      {/* ======================================================================= */}
      {/* 1. AMBIENT BACKGROUND WITH BG3.PNG GRAPHIC                              */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* User-supplied bg3.png ambient wave artwork */}
        <img
          src="/bg3.png"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen opacity-65 will-change-transform"
        />

        {/* Ambient colored lighting glows matching the 3 stages */}
        {/* Purple glow on left */}
        <div className="absolute top-[35%] left-[8%] w-[420px] h-[340px] rounded-full bg-[#963DFF]/15 blur-[130px] pointer-events-none" />
        {/* Orange glow in center */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[340px] h-[300px] rounded-full bg-[#FF713D]/10 blur-[120px] pointer-events-none" />
        {/* Cyan glow on right */}
        <div className="absolute top-[35%] right-[8%] w-[420px] h-[340px] rounded-full bg-[#22C8F2]/12 blur-[130px] pointer-events-none" />

        {/* Subtle top & bottom edge gradient transitions */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050509] via-[#050509]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050509] via-[#050509]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===================================================================== */}
        {/* 2. SECTION HEADING: EDITORIAL TYPOGRAPHY & PURPLE GRADIENT HIGHLIGHT  */}
        {/* ===================================================================== */}
        <div
          ref={headerRef}
          className="text-center max-w-4xl mx-auto mb-14 sm:mb-20 lg:mb-24 will-change-transform"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-6 sm:w-10 h-px bg-white/20" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#A5A5B5]">
              EMPEROR NEXUS ARCHITECTURE
            </span>
            <span className="w-6 sm:w-10 h-px bg-white/20" />
          </div>

          {/* Main Headline */}
          <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] uppercase tracking-tight leading-[1.12] text-[#F5F5F7]">
            FROM RAW DOCUMENTS TO AUTONOMOUS SALES{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#C28AFF] drop-shadow-[0_0_25px_rgba(150,61,255,0.45)]">
              IN 5 MINUTES
            </span>
          </h2>

          {/* Supporting Description */}
          <p className="mt-3 text-xs sm:text-sm md:text-base text-[#A5A5B5] max-w-2xl mx-auto leading-relaxed font-normal">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* 3. THREE CONNECTED VISUAL STAGES (PURPLE → ORANGE → CYAN)             */}
        {/* ===================================================================== */}
        <div className="relative w-full">
          {/* ------------------------------------------------------------------- */}
          {/* CONNECTING ENERGY LINE (DESKTOP: HORIZONTAL THROUGH SPHERES)        */}
          {/* ------------------------------------------------------------------- */}
          <div className="hidden lg:block absolute top-[108px] inset-x-[14%] h-12 pointer-events-none z-0">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 48"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Multi-stop gradient connecting Stage 1 to 2 to 3 */}
                <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#963DFF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#FF713D" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#22C8F2" stopOpacity="0.9" />
                </linearGradient>

                <filter id="energyGlow" x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Glowing underlying energy wave path */}
              <path
                d="M 50,24 C 250,24 250,24 500,24 C 750,24 750,24 950,24"
                stroke="url(#energyGradient)"
                strokeWidth="2.5"
                filter="url(#energyGlow)"
                className="opacity-70"
              />

              {/* Fine animated particle dashed trace */}
              <path
                ref={energyLineRef}
                d="M 50,24 C 250,24 250,24 500,24 C 750,24 750,24 950,24"
                stroke="url(#energyGradient)"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="opacity-90"
              />

              {/* Connection Node 1 (Purple - Ingestion) */}
              <circle cx="50" cy="24" r="6" fill="#963DFF" filter="url(#energyGlow)" />
              <circle cx="50" cy="24" r="2.5" fill="#FFFFFF" />

              {/* Connection Node 2 (Orange - Persona) */}
              <circle cx="500" cy="24" r="6" fill="#FF713D" filter="url(#energyGlow)" />
              <circle cx="500" cy="24" r="2.5" fill="#FFFFFF" />

              {/* Connection Node 3 (Cyan - Embed) */}
              <circle cx="950" cy="24" r="6" fill="#22C8F2" filter="url(#energyGlow)" />
              <circle cx="950" cy="24" r="2.5" fill="#FFFFFF" />
            </svg>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* THREE STAGE COLUMNS                                                 */}
          {/* ------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-14 lg:gap-8 relative z-10 items-stretch">
            {/* ================================================================= */}
            {/* STAGE 01: INGESTION (PURPLE #963DFF)                              */}
            {/* ================================================================= */}
            <div
              ref={stage1Ref}
              className="flex flex-col items-center text-center will-change-transform"
            >
              {/* Visual 3D Energy Sphere */}
              <div
                ref={sphere1Ref}
                className="relative w-48 h-48 sm:w-56 sm:h-56 mb-8 flex items-center justify-center shrink-0"
              >
                {/* Outer Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#963DFF]/50 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(194, 138, 255, 0.45), rgba(150, 61, 255, 0.18) 50%, rgba(13, 10, 26, 0.75) 80%, rgba(150, 61, 255, 0.45) 100%)",
                    boxShadow:
                      "0 0 45px rgba(150, 61, 255, 0.38), inset 0 0 30px rgba(194, 138, 255, 0.25)",
                  }}
                >
                  {/* Internal ambient radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#963DFF]/15 to-[#C28AFF]/20 pointer-events-none" />

                  {/* Pulsing Luminous Center Core */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#963DFF] to-[#C28AFF] shadow-[0_0_25px_rgba(150,61,255,0.85)] animate-pulse flex items-center justify-center z-10">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>

                  {/* Floating Document Badges Inside Sphere */}
                  <div ref={docs1Ref} className="absolute inset-0 z-20 pointer-events-none">
                    {/* PDF Badge */}
                    <div className="absolute top-5 left-5 bg-rose-500/25 border border-rose-500/50 text-rose-300 px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.35)] backdrop-blur-xs">
                      <FileText className="w-2.5 h-2.5" />
                      <span>PDF</span>
                    </div>

                    {/* DOCX Badge */}
                    <div className="absolute top-6 right-5 bg-sky-500/25 border border-sky-500/50 text-sky-300 px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(14,165,233,0.35)] backdrop-blur-xs">
                      <FileText className="w-2.5 h-2.5" />
                      <span>DOCX</span>
                    </div>

                    {/* TXT Badge */}
                    <div className="absolute bottom-6 left-6 bg-purple-500/25 border border-purple-500/50 text-purple-300 px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(168,85,247,0.35)] backdrop-blur-xs">
                      <FileText className="w-2.5 h-2.5" />
                      <span>TXT</span>
                    </div>

                    {/* Website URL Badge */}
                    <div className="absolute bottom-5 right-5 bg-teal-500/25 border border-teal-500/50 text-teal-300 px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(20,184,166,0.35)] backdrop-blur-xs">
                      <Globe className="w-2.5 h-2.5" />
                      <span>URL</span>
                    </div>
                  </div>
                </div>

                {/* Tilted Glowing Orbital Ring */}
                <div
                  className="absolute inset-[-14px] rounded-full border border-[#963DFF]/40 border-dashed animate-[spin_24s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(68deg) rotateZ(-25deg)" }}
                />
                <div
                  className="absolute inset-[-14px] rounded-full border-t-2 border-[#C28AFF] shadow-[0_0_15px_#C28AFF] pointer-events-none"
                  style={{ transform: "rotateX(68deg) rotateZ(-25deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#963DFF] shadow-[0_0_8px_#963DFF]" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C28AFF]">
                  01 — INGESTION
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-xl sm:text-2xl text-white uppercase tracking-tight mb-2.5">
                CONNECT KNOWLEDGE BASE
              </h3>

              {/* Stage Description */}
              <p className="text-xs sm:text-sm text-[#A5A5B5] max-w-sm leading-relaxed mb-4 font-normal">
                Upload brochures, pricing schedules, FAQs, technical manuals, or provide your website URL for instant indexing.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono bg-[#963DFF]/10 border border-[#963DFF]/30 text-[#C28AFF] shadow-[0_0_10px_rgba(150,61,255,0.15)]">
                  <span>✦ Supports PDF, DOCX, TXT, CSV &amp; live URL crawler sync</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[260px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2.5 sm:py-3 px-6 rounded-full font-bold text-xs sm:text-sm text-white bg-[#963DFF] shadow-[0_4px_22px_rgba(150,61,255,0.45)] hover:shadow-[0_4px_32px_rgba(150,61,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Ingestion</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
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
              {/* Visual 3D Energy Sphere */}
              <div
                ref={sphere2Ref}
                className="relative w-48 h-48 sm:w-56 sm:h-56 mb-8 flex items-center justify-center shrink-0"
              >
                {/* Outer Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#FF713D]/50 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(255, 170, 130, 0.45), rgba(255, 113, 61, 0.18) 50%, rgba(26, 12, 8, 0.75) 80%, rgba(255, 113, 61, 0.45) 100%)",
                    boxShadow:
                      "0 0 45px rgba(255, 113, 61, 0.38), inset 0 0 30px rgba(255, 150, 100, 0.25)",
                  }}
                >
                  {/* Internal ambient radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FF713D]/15 to-[#FFA07A]/20 pointer-events-none" />

                  {/* Center: Friendly AI Assistant Character */}
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <img
                      src="/e-logoicon.webp"
                      alt="Emperor Nexus AI Assistant"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_25px_rgba(255,113,61,0.75)] animate-pulse"
                    />
                  </div>

                  {/* Floating Orbiting Configuration Pills */}
                  <div ref={pills2Ref} className="absolute inset-0 z-20 pointer-events-none">
                    {/* Personality Pill */}
                    <div className="absolute top-4 left-3 bg-[#1A0E08]/90 border border-[#FF713D]/60 text-[#FF9E7A] text-[8px] sm:text-[9px] font-mono px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,113,61,0.35)] flex items-center gap-1 backdrop-blur-xs">
                      <Sparkles className="w-2 h-2 text-[#FF713D]" />
                      <span>Personality</span>
                    </div>

                    {/* Welcome Message Pill */}
                    <div className="absolute top-5 right-3 bg-[#1A0E08]/90 border border-[#FF713D]/60 text-[#FF9E7A] text-[8px] sm:text-[9px] font-mono px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,113,61,0.35)] flex items-center gap-1 backdrop-blur-xs">
                      <MessageSquare className="w-2 h-2 text-[#FF713D]" />
                      <span>Welcome Msg</span>
                    </div>

                    {/* Brand Style Pill */}
                    <div className="absolute bottom-5 left-3 bg-[#1A0E08]/90 border border-[#FF713D]/60 text-[#FF9E7A] text-[8px] sm:text-[9px] font-mono px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,113,61,0.35)] flex items-center gap-1 backdrop-blur-xs">
                      <Palette className="w-2 h-2 text-[#FF713D]" />
                      <span>Brand Style</span>
                    </div>

                    {/* Launcher Pill */}
                    <div className="absolute bottom-4 right-3 bg-[#1A0E08]/90 border border-[#FF713D]/60 text-[#FF9E7A] text-[8px] sm:text-[9px] font-mono px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,113,61,0.35)] flex items-center gap-1 backdrop-blur-xs">
                      <Sliders className="w-2 h-2 text-[#FF713D]" />
                      <span>Launcher</span>
                    </div>
                  </div>
                </div>

                {/* Tilted Glowing Orbital Ring */}
                <div
                  className="absolute inset-[-14px] rounded-full border border-[#FF713D]/40 border-dashed animate-[spin_26s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(68deg) rotateZ(25deg)" }}
                />
                <div
                  className="absolute inset-[-14px] rounded-full border-t-2 border-[#FFA07A] shadow-[0_0_15px_#FFA07A] pointer-events-none"
                  style={{ transform: "rotateX(68deg) rotateZ(25deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF713D] shadow-[0_0_8px_#FF713D]" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#FF9E7A]">
                  02 — PERSONA ENGINE
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-xl sm:text-2xl text-white uppercase tracking-tight mb-2.5">
                CALIBRATE PERSONA STYLING
              </h3>

              {/* Stage Description */}
              <p className="text-xs sm:text-sm text-[#A5A5B5] max-w-sm leading-relaxed mb-4 font-normal">
                Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and attention-grabbing animation.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono bg-[#FF713D]/10 border border-[#FF713D]/30 text-[#FF9E7A] shadow-[0_0_10px_rgba(255,113,61,0.15)]">
                  <span>✦ Custom logo upload, squircle / circle buttons &amp; 19 launcher animations</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[260px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2.5 sm:py-3 px-6 rounded-full font-bold text-xs sm:text-sm text-white bg-[#FF713D] shadow-[0_4px_22px_rgba(255,113,61,0.45)] hover:shadow-[0_4px_32px_rgba(255,113,61,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Calibrate Persona</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
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
              {/* Visual 3D Energy Sphere */}
              <div
                ref={sphere3Ref}
                className="relative w-48 h-48 sm:w-56 sm:h-56 mb-8 flex items-center justify-center shrink-0"
              >
                {/* Outer Glass Energy Sphere Body */}
                <div
                  className="w-full h-full rounded-full border border-[#22C8F2]/50 relative flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(130, 235, 255, 0.45), rgba(34, 200, 242, 0.18) 50%, rgba(6, 20, 28, 0.75) 80%, rgba(34, 200, 242, 0.45) 100%)",
                    boxShadow:
                      "0 0 45px rgba(34, 200, 242, 0.38), inset 0 0 30px rgba(100, 220, 255, 0.25)",
                  }}
                >
                  {/* Internal ambient radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#22C8F2]/15 to-[#80EAFF]/20 pointer-events-none" />

                  {/* Center: Floating Mini Browser / Code Interface */}
                  <div
                    ref={embed3Ref}
                    className="relative z-10 w-32 sm:w-36 rounded-xl bg-[#07131D]/92 border border-[#22C8F2]/40 p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(34,200,242,0.25)] text-left will-change-transform"
                  >
                    {/* Browser Window Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[8px] font-mono text-[#22C8F2]/80">index.html</span>
                    </div>

                    {/* Script Tag Snippet */}
                    <div className="space-y-0.5 font-mono text-[8px]">
                      <div className="text-white/30">&lt;!-- Nexus Widget --&gt;</div>
                      <div className="text-[#22C8F2] flex items-center gap-1 truncate font-semibold">
                        <Code2 className="w-2.5 h-2.5 shrink-0" />
                        <span>&lt;script src=&quot;nexus.js&quot;&gt;</span>
                      </div>
                    </div>

                    {/* Embed Indicator with Animated Live Pointer */}
                    <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                        Live Active
                      </span>

                      {/* Beacon Pulse Target Pointer */}
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-4 h-4 rounded-full bg-[#22C8F2]/40 animate-ping" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#22C8F2] text-[#050509] flex items-center justify-center shadow-[0_0_10px_#22C8F2]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tilted Glowing Orbital Ring */}
                <div
                  className="absolute inset-[-14px] rounded-full border border-[#22C8F2]/40 border-dashed animate-[spin_20s_linear_infinite] pointer-events-none"
                  style={{ transform: "rotateX(68deg) rotateZ(-15deg)" }}
                />
                <div
                  className="absolute inset-[-14px] rounded-full border-t-2 border-[#7AE5FF] shadow-[0_0_15px_#7AE5FF] pointer-events-none"
                  style={{ transform: "rotateX(68deg) rotateZ(-15deg)" }}
                />
              </div>

              {/* Stage Step Label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C8F2] shadow-[0_0_8px_#22C8F2]" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#22C8F2]">
                  03 — LIVE EMBED
                </span>
              </div>

              {/* Stage Heading */}
              <h3 className="font-sans font-black text-xl sm:text-2xl text-white uppercase tracking-tight mb-2.5">
                DEPLOY SINGLE LINE CODE
              </h3>

              {/* Stage Description */}
              <p className="text-xs sm:text-sm text-[#A5A5B5] max-w-sm leading-relaxed mb-4 font-normal">
                Integrate the assistant into your website using the provided script with instant anti-cache live updates.
              </p>

              {/* Supporting Feature Pill */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono bg-[#22C8F2]/10 border border-[#22C8F2]/30 text-[#7AE5FF] shadow-[0_0_10px_rgba(34,200,242,0.15)]">
                  <span>✦ Zero dependencies, anti-cache instant updates &amp; mobile-ready</span>
                </span>
              </div>

              {/* Solid Accent CTA Button */}
              <div className="w-full max-w-[260px] mt-auto">
                <button
                  type="button"
                  onClick={handleAction}
                  className="group w-full py-2.5 sm:py-3 px-6 rounded-full font-bold text-xs sm:text-sm text-[#050509] bg-[#22C8F2] shadow-[0_4px_22px_rgba(34,200,242,0.45)] hover:shadow-[0_4px_32px_rgba(34,200,242,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Get Embed Code</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 4. BOTTOM ACTION CTA BANNER                                           */}
        {/* ===================================================================== */}
        <div className="text-center pt-14 sm:pt-18 lg:pt-20">
          <button
            type="button"
            onClick={handleAction}
            className="inline-flex items-center gap-2.5 px-6 sm:px-9 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] via-[#7C3AED] to-[#22C8F2] shadow-[0_0_30px_rgba(150,61,255,0.4)] hover:shadow-[0_0_45px_rgba(150,61,255,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <span>Launch Your Autonomous Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
