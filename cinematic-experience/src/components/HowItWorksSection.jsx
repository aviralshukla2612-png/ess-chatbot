"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Globe,
  SlidersHorizontal,
  MessageSquare,
  Palette,
  LayoutGrid,
  Code2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  Bot,
  Zap,
  Check,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STAGES = [
  {
    number: "01",
    badge: "INGESTION",
    title: "Connect Your Business Knowledge",
    description:
      "Provide your business information, brochures, pricing details, FAQs, documents, or website content.",
    accent: "#963DFF",
    glowColor: "rgba(150, 61, 255, 0.25)",
  },
  {
    number: "02",
    badge: "PERSONA ENGINE",
    title: "Shape Your Assistant",
    description:
      "Configure your assistant's personality, welcome message, brand appearance, and launcher settings.",
    accent: "#C28AFF",
    glowColor: "rgba(194, 138, 255, 0.22)",
  },
  {
    number: "03",
    badge: "LIVE EMBED",
    title: "Bring Your Assistant to Your Website",
    description:
      "Integrate your configured assistant into your website using the provided embed code.",
    accent: "#55A9FF",
    glowColor: "rgba(85, 169, 255, 0.25)",
  },
];

export default function HowItWorksSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const activeStageRef = useRef(0);

  // Sync ref with state for event handlers
  useEffect(() => {
    activeStageRef.current = activeStage;
  }, [activeStage]);

  // GSAP ScrollTrigger MatchMedia Setup
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // Desktop & Large Screens (>= 1024px): Pinned Interactive Split Screen
    mm.add("(min-width: 1024px)", () => {
      const pinTrigger = ScrollTrigger.create({
        id: "nexus-process-pin",
        trigger: container,
        start: "top top",
        end: "+=1800",
        pin: stage,
        anticipatePin: 1,
        scrub: 0.5,
        pinSpacing: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          let target = 0;
          if (p >= 0.66) {
            target = 2;
          } else if (p >= 0.33) {
            target = 1;
          } else {
            target = 0;
          }
          if (activeStageRef.current !== target) {
            setActiveStage(target);
          }
        },
      });

      return () => {
        pinTrigger.kill();
      };
    });

    return () => mm.revert();
  }, []);

  const handleStageClick = (index) => {
    setActiveStage(index);
    if (typeof window !== "undefined") {
      const pinTrigger = ScrollTrigger.getById("nexus-process-pin");
      if (pinTrigger) {
        const targetScroll =
          pinTrigger.start + (pinTrigger.end - pinTrigger.start) * (index / 2);
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative w-full bg-[#050507] text-[#F5F5F7] overflow-hidden select-none"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="nexus-grid-overlay opacity-25 absolute inset-0" />
        <div className="absolute top-[20%] left-[10%] w-[450px] h-[350px] rounded-full bg-[#963DFF]/10 blur-[130px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[400px] rounded-full bg-[#55A9FF]/10 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050507] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050507] to-transparent" />
      </div>

      {/* Center Stage Container */}
      <div
        ref={stageRef}
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-[1360px] mx-auto"
      >
        {/* Section Editorial Header */}
        <div className="max-w-3xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-2 sm:mb-3">
            <span className="w-6 h-px bg-white/20" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#963DFF]">
              PROCESS
            </span>
            <span className="w-6 h-px bg-white/20" />
          </div>

          <h2 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] tracking-tight uppercase leading-[1.12] text-white">
            FROM RAW DOCUMENTS TO{" "}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#55A9FF] drop-shadow-[0_0_25px_rgba(150,61,255,0.4)]">
              AUTONOMOUS SALES
            </span>{" "}
            IN 5 MINUTES.
          </h2>
          <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-[#9898A6] max-w-xl leading-relaxed font-normal">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ================================================================= */}
          {/* LEFT COLUMN: INTERACTIVE STAGE NAVIGATION LIST                    */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
            {STAGES.map((st, idx) => {
              const isActive = activeStage === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStageClick(idx)}
                  className={`group relative text-left w-full pl-5 sm:pl-6 pr-4 sm:pr-6 py-4 sm:py-5 rounded-2xl transition-all duration-500 cursor-pointer ${
                    isActive
                      ? "bg-white/[0.04] border border-white/[0.09] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
                      : "bg-transparent border border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Left Accent Bar / Progress Indicator */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-500 ${
                      isActive
                        ? "bg-gradient-to-b from-[#C28AFF] via-[#963DFF] to-[#55A9FF] shadow-[0_0_12px_rgba(150,61,255,0.8)] scale-y-100"
                        : "bg-white/10 group-hover:bg-white/20 scale-y-60"
                    }`}
                  />

                  {/* Stage Label & Number */}
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest transition-colors duration-300 ${
                        isActive ? "text-[#C28AFF]" : "text-[#9898A6]/60"
                      }`}
                    >
                      {st.number} —
                    </span>
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-300 ${
                        isActive ? "text-white" : "text-[#9898A6]/70"
                      }`}
                    >
                      {st.badge}
                    </span>
                  </div>

                  {/* Stage Title */}
                  <h3
                    className={`font-sans font-bold text-base sm:text-lg lg:text-xl tracking-tight transition-colors duration-300 ${
                      isActive
                        ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                        : "text-[#9898A6] group-hover:text-white"
                    }`}
                  >
                    {st.title}
                  </h3>

                  {/* Collapsible / Expanding Description */}
                  <div
                    className={`grid transition-all duration-500 ease-out overflow-hidden ${
                      isActive
                        ? "grid-rows-[1fr] opacity-100 mt-2.5"
                        : "grid-rows-[0fr] opacity-0 mt-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed font-normal">
                        {st.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: LARGE VISUAL PRESENTATION STAGE                      */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 w-full">
            <div className="relative w-full h-[440px] sm:h-[480px] lg:h-[530px] rounded-[28px] sm:rounded-[36px] bg-[#0B0B10]/90 border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none">
              {/* Technical Watermark Ghost Number */}
              <span className="absolute -top-4 right-4 sm:right-8 font-mono font-black text-[130px] sm:text-[180px] lg:text-[220px] leading-none text-white/[0.025] select-none pointer-events-none transition-all duration-700">
                0{activeStage + 1}
              </span>

              {/* Subtle Atmospheric Stage Glow */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${STAGES[activeStage].glowColor} 0%, transparent 70%)`,
                }}
              />

              {/* Stage Breadcrumb Tag Bar */}
              <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: STAGES[activeStage].accent }}
                  />
                  <span className="font-mono text-[11px] font-bold tracking-widest text-[#9898A6] uppercase">
                    STAGE 0{activeStage + 1} • {STAGES[activeStage].badge}
                  </span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-[#9898A6]/70">
                  <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
                  <span>EMPEROR NEXUS RUNTIME</span>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* VISUAL 01: INGESTION (Converging Business Knowledge to Mascot)   */}
              {/* --------------------------------------------------------------- */}
              <div
                className={`absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeStage === 0
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                }`}
              >
                {/* SVG Energy Convergence Beams */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 600 450"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#963DFF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#55A9FF" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#55A9FF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#963DFF" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  {/* Energy Arcs converging into center (300, 225) */}
                  <path
                    d="M 120 110 Q 200 160 300 225"
                    stroke="url(#beam1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                  <path
                    d="M 480 110 Q 400 160 300 225"
                    stroke="url(#beam2)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                  <path
                    d="M 120 340 Q 200 290 300 225"
                    stroke="url(#beam1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                  <path
                    d="M 480 340 Q 400 290 300 225"
                    stroke="url(#beam2)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                </svg>

                {/* Central Subject: Official Emperor Nexus Robot Mascot */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    {/* Concentric ambient pulse rings */}
                    <div className="absolute w-36 h-36 rounded-full border border-[#963DFF]/25 animate-ping opacity-25" />
                    <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-[#963DFF]/30 to-[#55A9FF]/30 blur-[30px]" />
                    <img
                      src="/icon-512.png"
                      alt="Emperor Nexus Autonomous AI"
                      className="relative z-20 w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_12px_35px_rgba(150,61,255,0.5)]"
                    />
                  </div>
                  <div className="mt-4 px-3 py-1 rounded-full bg-[#12121A]/90 border border-white/10 backdrop-blur-md shadow-lg">
                    <span className="font-mono text-[11px] font-bold text-[#C28AFF] tracking-wider uppercase">
                      KNOWLEDGE EMBEDDING ENGINE
                    </span>
                  </div>
                </div>

                {/* Converging Knowledge Badges */}
                {/* 1. PDF Card (Top Left) */}
                <div className="absolute top-16 left-6 sm:left-12 z-20 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">Catalog.pdf</div>
                    <div className="text-[10px] font-mono text-[#9898A6] mt-0.5">14 pages • Grounded</div>
                  </div>
                </div>

                {/* 2. DOCX Card (Top Right) */}
                <div className="absolute top-16 right-6 sm:right-12 z-20 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">Pricing_Tiers.docx</div>
                    <div className="text-[10px] font-mono text-[#9898A6] mt-0.5">Verified Knowledge</div>
                  </div>
                </div>

                {/* 3. URL Crawler Card (Bottom Left) */}
                <div className="absolute bottom-14 left-6 sm:left-12 z-20 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">yourbrand.com/faq</div>
                    <div className="text-[10px] font-mono text-emerald-400/90 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Crawler Active
                    </div>
                  </div>
                </div>

                {/* 4. Text / CSV Card (Bottom Right) */}
                <div className="absolute bottom-14 right-6 sm:right-12 z-20 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">Services_FAQs.txt</div>
                    <div className="text-[10px] font-mono text-[#9898A6] mt-0.5">Vectorized in 5m</div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* VISUAL 02: PERSONA ENGINE (Calibrating Identity & Personality)  */}
              {/* --------------------------------------------------------------- */}
              <div
                className={`absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeStage === 1
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                }`}
              >
                {/* Central Subject: Official Emperor Nexus Robot Mascot */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-36 h-36 rounded-full border border-[#C28AFF]/30 animate-pulse" />
                    <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-[#963DFF]/35 to-[#F59E0B]/20 blur-[30px]" />
                    <img
                      src="/icon-512.png"
                      alt="Emperor Nexus Persona Calibration"
                      className="relative z-20 w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_12px_35px_rgba(194,138,255,0.5)]"
                    />
                  </div>
                  <div className="mt-4 px-3 py-1 rounded-full bg-[#12121A]/90 border border-white/10 backdrop-blur-md shadow-lg">
                    <span className="font-mono text-[11px] font-bold text-[#F59E0B] tracking-wider uppercase">
                      AUTONOMOUS SALES PERSONA
                    </span>
                  </div>
                </div>

                {/* Calibration Control Elements Surrounding Mascot */}
                {/* 1. Personality Sliders (Top Left) */}
                <div className="absolute top-16 left-6 sm:left-12 z-20 p-3 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md max-w-[190px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#C28AFF]" />
                    <span>Tone & Demeanor</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="flex justify-between text-[10px] text-[#9898A6] font-mono">
                        <span>Consultative</span>
                        <span className="text-white">95%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                        <div className="w-[95%] h-full bg-[#C28AFF] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[#9898A6] font-mono">
                        <span>Persuasive</span>
                        <span className="text-white">88%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                        <div className="w-[88%] h-full bg-[#F59E0B] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Welcome Message (Top Right) */}
                <div className="absolute top-16 right-6 sm:right-12 z-20 p-3 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md max-w-[210px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Welcome Greeting</span>
                  </div>
                  <p className="text-[11px] text-[#D9D9E2] italic leading-tight">
                    &ldquo;Hi! Looking for our custom enterprise package?&rdquo;
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Active Opening
                  </span>
                </div>

                {/* 3. Brand Theme & Colors (Bottom Left) */}
                <div className="absolute bottom-14 left-6 sm:left-12 z-20 p-3 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#963DFF]" />
                    <span>Brand Styling</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#963DFF] border border-white/20 shadow-sm" />
                    <span className="w-5 h-5 rounded-full bg-[#55A9FF] border border-white/20 shadow-sm" />
                    <span className="w-5 h-5 rounded-full bg-[#050507] border border-white/40 shadow-sm" />
                    <span className="text-[10px] font-mono text-[#9898A6] ml-1">Deep Velvet</span>
                  </div>
                </div>

                {/* 4. Launcher Preview (Bottom Right) */}
                <div className="absolute bottom-14 right-6 sm:right-12 z-20 p-3 rounded-xl bg-[#12121A]/90 border border-white/10 shadow-xl backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#963DFF] to-[#C28AFF] flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Launcher Shape</div>
                    <div className="text-[10px] font-mono text-[#9898A6]">Squircle • Attention Pulsing</div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* VISUAL 03: LIVE EMBED (Active Assistant on Live Website)         */}
              {/* --------------------------------------------------------------- */}
              <div
                className={`absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeStage === 2
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                }`}
              >
                {/* Realistic Browser Window Frame */}
                <div className="relative w-full max-w-[500px] h-[300px] sm:h-[320px] rounded-2xl bg-[#050507] border border-white/15 shadow-2xl overflow-hidden flex flex-col">
                  {/* Browser Chrome Header */}
                  <div className="h-8 bg-[#12121A] border-b border-white/10 px-3 flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    </div>
                    {/* URL Bar */}
                    <div className="flex-1 mx-2 h-5 bg-[#050507] rounded-md border border-white/10 px-2 flex items-center gap-1.5">
                      <Lock className="w-2.5 h-2.5 text-[#55A9FF]" />
                      <span className="text-[10px] font-mono text-[#9898A6] truncate">
                        https://yourcompany.com
                      </span>
                    </div>
                  </div>

                  {/* Browser Page Body Mockup */}
                  <div className="relative flex-1 p-4 bg-gradient-to-b from-[#0B0B10] to-[#050507] overflow-hidden flex flex-col justify-between">
                    {/* Website Hero Outline */}
                    <div className="space-y-2 opacity-60">
                      <div className="w-24 h-2 bg-white/20 rounded" />
                      <div className="w-48 h-3.5 bg-gradient-to-r from-white/30 to-white/10 rounded" />
                      <div className="w-36 h-2 bg-white/15 rounded" />
                    </div>

                    {/* Live Assistant Widget in Bottom-Right */}
                    <div className="self-end flex flex-col items-end gap-2 relative z-20">
                      {/* Greeting Bubble */}
                      <div className="p-2.5 rounded-xl bg-[#12121A] border border-white/15 shadow-xl max-w-[220px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold text-white">Emperor Nexus AI</span>
                        </div>
                        <p className="text-[11px] text-[#D9D9E2] leading-tight">
                          &ldquo;VIP demo scheduled for Thursday 2 PM. Confirmation sent!&rdquo;
                        </p>
                      </div>

                      {/* Official Mascot Avatar Launcher Button */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[9px] border border-emerald-500/20">
                          24/7 Live
                        </span>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#963DFF] to-[#55A9FF] p-[2px] shadow-lg hover:scale-105 transition-transform cursor-pointer">
                          <div className="w-full h-full bg-[#050507] rounded-2xl flex items-center justify-center overflow-hidden">
                            <img
                              src="/icon-512.png"
                              alt="Live Assistant"
                              className="w-7 h-7 object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Embed Code Pill */}
                <div className="absolute top-6 left-6 sm:left-10 z-30 p-2.5 sm:p-3 rounded-xl bg-[#12121A]/95 border border-white/15 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 max-w-[340px]">
                  <div className="w-7 h-7 rounded-lg bg-[#55A9FF]/20 text-[#55A9FF] flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <span>1-Line Script Integration</span>
                      <span className="text-[9px] font-mono text-emerald-400">Zero Dependencies</span>
                    </div>
                    <code className="text-[10px] font-mono text-[#55A9FF] block truncate mt-0.5">
                      &lt;script src=&quot;https://nexus.ai/widget.js&quot;&gt;&lt;/script&gt;
                    </code>
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
