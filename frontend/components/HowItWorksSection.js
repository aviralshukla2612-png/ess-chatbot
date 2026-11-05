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
    glowColor: "rgba(150, 61, 255, 0.22)",
  },
  {
    number: "02",
    badge: "PERSONA ENGINE",
    title: "Shape Your Assistant",
    description:
      "Configure your assistant's personality, welcome message, brand appearance, and launcher settings.",
    accent: "#C28AFF",
    glowColor: "rgba(194, 138, 255, 0.20)",
  },
  {
    number: "03",
    badge: "LIVE EMBED",
    title: "Bring Your Assistant to Your Website",
    description:
      "Integrate your configured assistant into your website using the provided embed code.",
    accent: "#55A9FF",
    glowColor: "rgba(85, 169, 255, 0.22)",
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
        end: "+=1700",
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
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050507] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050507] to-transparent" />
      </div>

      {/* Center Stage Container: perfectly balanced inside 100dvh without vertical cutoff */}
      <div
        ref={stageRef}
        className="relative z-10 w-full min-h-[100dvh] flex items-center py-6 sm:py-8 lg:py-6 px-4 sm:px-6 lg:px-10 max-w-[1360px] mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center w-full">
          {/* ================================================================= */}
          {/* LEFT COLUMN: EDITORIAL HEADER + INTERACTIVE STAGES LIST           */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Editorial Header (Integrated inside left column per reference) */}
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 mb-2 sm:mb-2.5">
                <span className="w-5 h-px bg-white/20" />
                <span className="text-[11px] font-space-mono font-bold tracking-[0.25em] uppercase text-[#963DFF]">
                  PROCESS
                </span>
                <span className="w-5 h-px bg-white/20" />
              </div>

              <h2 className="font-playfair font-bold text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.35rem] tracking-normal uppercase leading-[1.14] text-white">
                FROM RAW DOCUMENTS TO{" "}
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#55A9FF] drop-shadow-[0_0_20px_rgba(150,61,255,0.4)]">
                  AUTONOMOUS SALES
                </span>{" "}
                IN 5 MINUTES.
              </h2>
              <p className="mt-2 text-xs sm:text-[13px] text-[#9898A6] leading-relaxed font-inter font-normal max-w-md">
                No machine learning engineers, vector database setups, or prompt writing required.
              </p>
            </div>

            {/* Interactive Stages Navigation List */}
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {STAGES.map((st, idx) => {
                const isActive = activeStage === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStageClick(idx)}
                    className={`group relative text-left w-full pl-5 sm:pl-6 pr-4 sm:pr-6 py-3.5 sm:py-4 rounded-2xl transition-all duration-400 cursor-pointer ${
                      isActive
                        ? "bg-white/[0.05] border border-white/[0.1] shadow-[0_10px_25px_-8px_rgba(0,0,0,0.6)]"
                        : "bg-transparent border border-transparent hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Left Accent Bar / Progress Indicator */}
                    <div
                      className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-400 ${
                        isActive
                          ? "bg-gradient-to-b from-[#C28AFF] via-[#963DFF] to-[#55A9FF] shadow-[0_0_12px_rgba(150,61,255,0.85)] scale-y-100"
                          : "bg-white/10 group-hover:bg-white/20 scale-y-60"
                      }`}
                    />

                    {/* Stage Title */}
                    <h3
                      className={`font-playfair font-bold text-base sm:text-lg lg:text-[1.28rem] tracking-normal transition-colors duration-300 ${
                        isActive
                          ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                          : "text-[#9898A6] group-hover:text-white"
                      }`}
                    >
                      {st.title}
                    </h3>

                    {/* Collapsible Description Accordion */}
                    <div
                      className={`grid transition-all duration-400 ease-out overflow-hidden ${
                        isActive
                          ? "grid-rows-[1fr] opacity-100 mt-2"
                          : "grid-rows-[0fr] opacity-0 mt-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs text-[#9898A6] leading-relaxed font-inter font-normal">
                          {st.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: LARGE VISUAL PRESENTATION STAGE                      */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 w-full flex items-center justify-center">
            <div className="relative w-full h-[420px] sm:h-[460px] lg:h-[490px] xl:h-[510px] rounded-[24px] sm:rounded-[32px] bg-[#0B0B10]/95 border border-white/[0.08] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-2xl flex items-center justify-center select-none">
              {/* Atmospheric Radial Stage Lighting */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${STAGES[activeStage].glowColor} 0%, transparent 70%)`,
                }}
              />

              {/* Stage Breadcrumb Bar */}
              <div className="absolute top-4 sm:top-5 inset-x-4 sm:inset-x-6 flex items-center justify-between z-30 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: STAGES[activeStage].accent }}
                  />
                  <span className="font-space-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#9898A6] uppercase">
                    {STAGES[activeStage].badge}
                  </span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-space-mono text-[#9898A6]/70">
                  <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
                  <span>EMPEROR NEXUS RUNTIME</span>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* VISUAL 01: INGESTION (Converging Business Knowledge to Mascot)   */}
              {/* --------------------------------------------------------------- */}
              <div
                className={`absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeStage === 0
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-5 scale-95 pointer-events-none"
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
                    d="M 140 100 Q 200 150 280 210"
                    stroke="url(#beam1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                  <path
                    d="M 460 100 Q 400 150 320 210"
                    stroke="url(#beam2)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                  <path
                    d="M 140 330 Q 200 280 280 240"
                    stroke="url(#beam1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                  <path
                    d="M 460 330 Q 400 280 320 240"
                    stroke="url(#beam2)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_15s_linear_infinite]"
                  />
                </svg>

                {/* Central Subject: Official Emperor Nexus Robot Mascot */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-32 h-32 rounded-full border border-[#963DFF]/25 animate-ping opacity-25" />
                    <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-[#963DFF]/30 to-[#55A9FF]/30 blur-[28px]" />
                    <img
                      src="/icon-512.png"
                      alt="Emperor Nexus Autonomous AI"
                      className="relative z-20 w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_30px_rgba(150,61,255,0.5)]"
                    />
                  </div>
                  <div className="mt-3 px-3 py-0.5 rounded-full bg-[#12121A]/95 border border-white/10 backdrop-blur-md shadow-lg">
                    <span className="font-space-mono text-[10px] sm:text-[11px] font-bold text-[#C28AFF] tracking-wider uppercase">
                      KNOWLEDGE EMBEDDING ENGINE
                    </span>
                  </div>
                </div>

                {/* Converging Knowledge Badges (Positioned cleanly inside bounds) */}
                {/* 1. PDF Card (Top Left) */}
                <div className="absolute top-14 left-4 sm:left-7 z-20 flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-inter font-bold text-white leading-none">Catalog.pdf</div>
                    <div className="text-[9px] sm:text-[10px] font-space-mono text-[#9898A6] mt-0.5">14 pages • Grounded</div>
                  </div>
                </div>

                {/* 2. DOCX Card (Top Right) */}
                <div className="absolute top-14 right-4 sm:right-7 z-20 flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-inter font-bold text-white leading-none">Pricing_Tiers.docx</div>
                    <div className="text-[9px] sm:text-[10px] font-space-mono text-[#9898A6] mt-0.5">Verified Knowledge</div>
                  </div>
                </div>

                {/* 3. URL Crawler Card (Bottom Left) */}
                <div className="absolute bottom-8 sm:bottom-10 left-4 sm:left-7 z-20 flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-inter font-bold text-white leading-none">yourbrand.com/faq</div>
                    <div className="text-[9px] sm:text-[10px] font-space-mono text-emerald-400/90 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Crawler Active
                    </div>
                  </div>
                </div>

                {/* 4. Text / CSV Card (Bottom Right) */}
                <div className="absolute bottom-8 sm:bottom-10 right-4 sm:right-7 z-20 flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-inter font-bold text-white leading-none">Services_FAQs.txt</div>
                    <div className="text-[9px] sm:text-[10px] font-space-mono text-[#9898A6] mt-0.5">Vectorized in 5m</div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* VISUAL 02: PERSONA ENGINE (Calibrating Identity & Personality)  */}
              {/* --------------------------------------------------------------- */}
              <div
                className={`absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeStage === 1
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-5 scale-95 pointer-events-none"
                }`}
              >
                {/* Central Subject: Official Emperor Nexus Robot Mascot */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-32 h-32 rounded-full border border-[#C28AFF]/30 animate-pulse" />
                    <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-[#963DFF]/35 to-[#F59E0B]/20 blur-[28px]" />
                    <img
                      src="/icon-512.png"
                      alt="Emperor Nexus Persona Calibration"
                      className="relative z-20 w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_30px_rgba(194,138,255,0.5)]"
                    />
                  </div>
                  <div className="mt-3 px-3 py-0.5 rounded-full bg-[#12121A]/95 border border-white/10 backdrop-blur-md shadow-lg">
                    <span className="font-space-mono text-[10px] sm:text-[11px] font-bold text-[#F59E0B] tracking-wider uppercase">
                      AUTONOMOUS SALES PERSONA
                    </span>
                  </div>
                </div>

                {/* Calibration Control Elements */}
                {/* 1. Personality Sliders (Top Left) */}
                <div className="absolute top-14 left-4 sm:left-7 z-20 p-2.5 sm:p-3 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md max-w-[170px] sm:max-w-[190px]">
                  <div className="flex items-center gap-1.5 text-xs font-inter font-bold text-white mb-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#C28AFF]" />
                    <span>Tone & Demeanor</span>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <div className="flex justify-between text-[9px] sm:text-[10px] text-[#9898A6] font-space-mono">
                        <span>Consultative</span>
                        <span className="text-white">95%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                        <div className="w-[95%] h-full bg-[#C28AFF] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] sm:text-[10px] text-[#9898A6] font-space-mono">
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
                <div className="absolute top-14 right-4 sm:right-7 z-20 p-2.5 sm:p-3 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md max-w-[180px] sm:max-w-[210px]">
                  <div className="flex items-center gap-1.5 text-xs font-inter font-bold text-white mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Welcome Greeting</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-inter text-[#D9D9E2] italic leading-tight">
                    &ldquo;Hi! Looking for our custom enterprise package?&rdquo;
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-space-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Active Opening
                  </span>
                </div>

                {/* 3. Brand Theme & Colors (Bottom Left) */}
                <div className="absolute bottom-8 sm:bottom-10 left-4 sm:left-7 z-20 p-2.5 sm:p-3 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-xs font-inter font-bold text-white mb-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#963DFF]" />
                    <span>Brand Styling</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#963DFF] border border-white/20 shadow-sm" />
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#55A9FF] border border-white/20 shadow-sm" />
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#050507] border border-white/40 shadow-sm" />
                    <span className="text-[9px] sm:text-[10px] font-space-mono text-[#9898A6] ml-1">Deep Velvet</span>
                  </div>
                </div>

                {/* 4. Launcher Preview (Bottom Right) */}
                <div className="absolute bottom-8 sm:bottom-10 right-4 sm:right-7 z-20 p-2.5 sm:p-3 rounded-xl bg-[#12121A]/95 border border-white/10 shadow-xl backdrop-blur-md flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#963DFF] to-[#C28AFF] flex items-center justify-center shadow-lg">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-inter font-bold text-white">Launcher Widget</div>
                    <div className="text-[9px] sm:text-[10px] font-space-mono text-[#9898A6]">Squircle • Pulse</div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* VISUAL 03: LIVE EMBED (Active Assistant on Live Website)         */}
              {/* --------------------------------------------------------------- */}
              <div
                className={`absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  activeStage === 2
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-5 scale-95 pointer-events-none"
                }`}
              >
                {/* Realistic Browser Window Frame */}
                <div className="relative w-full max-w-[460px] h-[270px] sm:h-[290px] rounded-2xl bg-[#050507] border border-white/15 shadow-2xl overflow-hidden flex flex-col">
                  {/* Browser Chrome Header */}
                  <div className="h-7 sm:h-8 bg-[#12121A] border-b border-white/10 px-3 flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#FF5F56]" />
                      <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#FFBD2E]" />
                      <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#27C93F]" />
                    </div>
                    {/* URL Bar */}
                    <div className="flex-1 mx-2 h-4 sm:h-5 bg-[#050507] rounded-md border border-white/10 px-2 flex items-center gap-1.5">
                      <Lock className="w-2.5 h-2.5 text-[#55A9FF]" />
                      <span className="text-[9px] sm:text-[10px] font-space-mono text-[#9898A6] truncate">
                        https://yourcompany.com
                      </span>
                    </div>
                  </div>

                  {/* Browser Page Body Mockup */}
                  <div className="relative flex-1 p-3.5 bg-gradient-to-b from-[#0B0B10] to-[#050507] overflow-hidden flex flex-col justify-between">
                    {/* Website Hero Outline */}
                    <div className="space-y-1.5 opacity-60">
                      <div className="w-20 h-2 bg-white/20 rounded" />
                      <div className="w-40 h-3 bg-gradient-to-r from-white/30 to-white/10 rounded" />
                      <div className="w-28 h-1.5 bg-white/15 rounded" />
                    </div>

                    {/* Live Assistant Widget in Bottom-Right */}
                    <div className="self-end flex flex-col items-end gap-1.5 relative z-20">
                      {/* Greeting Bubble */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-[#12121A] border border-white/15 shadow-xl max-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] sm:text-[10px] font-space-mono font-bold text-white">Emperor Nexus AI</span>
                        </div>
                        <p className="text-[10px] font-inter text-[#D9D9E2] leading-tight">
                          &ldquo;VIP demo scheduled for Thursday 2 PM. Confirmation sent!&rdquo;
                        </p>
                      </div>

                      {/* Official Mascot Avatar Launcher Button */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-space-mono text-[9px] border border-emerald-500/20">
                          24/7 Live
                        </span>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#963DFF] to-[#55A9FF] p-[2px] shadow-lg hover:scale-105 transition-transform cursor-pointer">
                          <div className="w-full h-full bg-[#050507] rounded-2xl flex items-center justify-center overflow-hidden">
                            <img
                              src="/icon-512.png"
                              alt="Live Assistant"
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Embed Code Pill */}
                <div className="absolute top-5 left-4 sm:left-7 z-30 p-2 sm:p-2.5 rounded-xl bg-[#12121A]/95 border border-white/15 shadow-2xl backdrop-blur-xl flex items-center gap-2 max-w-[320px]">
                  <div className="w-6 h-6 rounded-lg bg-[#55A9FF]/20 text-[#55A9FF] flex items-center justify-center shrink-0">
                    <Code2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] sm:text-[11px] font-inter font-bold text-white flex items-center gap-1.5">
                      <span>1-Line Script Integration</span>
                      <span className="text-[8px] sm:text-[9px] font-space-mono text-emerald-400">Zero Dependencies</span>
                    </div>
                    <code className="text-[9px] sm:text-[10px] font-space-mono text-[#55A9FF] block truncate mt-0.5">
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
