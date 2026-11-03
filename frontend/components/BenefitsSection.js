"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Bot,
  CalendarCheck,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Crosshair / Plus icon identical to Trionn
const PlusDivider = () => (
  <span className="mx-6 sm:mx-10 text-[#C653FF] font-light text-2xl sm:text-4xl select-none inline-block">
    +
  </span>
);

// Marquee track component containing user's exact requested line + chatbot-related terms
const MarqueeTrack = () => (
  <div className="shrink-0 flex items-center uppercase font-headline font-black text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[6.25rem] tracking-tight leading-[1.1] py-4 text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
    <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF]">
      Don&apos;t Let Valuable Conversations Slip Away
    </span>
    <PlusDivider />
    <span>Capture Every Lead</span>
    <PlusDivider />
    <span>Qualify 24/7</span>
    <PlusDivider />
    <span>Convert In Real-Time</span>
    <PlusDivider />
    <span>Autonomous Sales AI</span>
    <PlusDivider />
    <span>Sub-Second Intelligence</span>
    <PlusDivider />
    <span>Scale Revenue Pipeline</span>
    <PlusDivider />
    <span>Zero Hallucination</span>
    <PlusDivider />
  </div>
);

export default function BenefitsSection() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const visionRef = useRef(null);
  const sectionHeaderRef = useRef(null);
  const cardsTrackRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        if (visionRef.current) gsap.set(visionRef.current, { display: "none" });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1, y: 0 });
        if (cardsTrackRef.current) gsap.set(cardsTrackRef.current, { opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, rotateX: 0, y: 0, scale: 1 });
        });
        return;
      }

      // Initial visual states
      if (visionRef.current) {
        gsap.set(visionRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });
      }
      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -20 });
      }
      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, { opacity: 0 });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            rotateX: -55,
            y: 40 + idx * 15,
            opacity: 0,
            scale: 0.95,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      // Master ScrollTrigger timeline with smooth scrub (ZERO blank screen!)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1200",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.75,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      // 1. Opening Vision / Marquee smoothly fades out and scales up
      if (visionRef.current) {
        tl.to(
          visionRef.current,
          {
            opacity: 0,
            scale: 1.08,
            filter: "blur(8px)",
            duration: 0.28,
            ease: "power2.inOut",
            pointerEvents: "none",
          },
          0.06
        );
      }

      // 2. Persistent Section Header fades in below navbar
      if (sectionHeaderRef.current) {
        tl.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "power3.out",
          },
          0.14
        );
      }

      // 3. Cards Track fades in and 3D unfolds directly beneath the header
      if (cardsTrackRef.current) {
        tl.to(
          cardsTrackRef.current,
          {
            opacity: 1,
            duration: 0.30,
            ease: "power2.out",
          },
          0.16
        );
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          tl.to(
            card,
            {
              rotateX: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.34,
              ease: "power3.out",
              force3D: true,
            },
            0.18 + idx * 0.08
          );
        }
      });

      // Hold comfortable reading state
      tl.to({}, { duration: 0.4 }, 0.6);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="benefits"
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* Scoped CSS for smooth GPU-accelerated infinite marquee loop */}
      <style>{`
        @keyframes benefitsMarqueeLoop {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .benefits-infinite-track {
          display: flex;
          width: max-content;
          animation: benefitsMarqueeLoop 30s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* PINNED STAGE VIEWPORT (PADDED BELOW NAVBAR — NO CUT-OFF, NO BLACKOUT)      */}
      {/* ========================================================================= */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] max-h-screen overflow-hidden bg-[#050507] flex flex-col justify-between pt-20 sm:pt-24 pb-6 px-4 sm:px-6 lg:px-8"
        style={{ perspective: "1500px" }}
      >
        {/* Subtle Technical Grid Background without any purple tint */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />

        {/* ======================================================================= */}
        {/* PHASE 1: FULLSCREEN MARQUEE & INTRO (LAYER 30 - FADES ON SCROLL)        */}
        {/* ======================================================================= */}
        <div
          ref={visionRef}
          className="absolute inset-0 z-30 flex flex-col justify-between py-12 sm:py-16 px-6 sm:px-14 pointer-events-none select-none"
        >
          {/* Top Vision Title */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-[#A1A1AA] font-bold">
                Focused Intelligence.
              </span>
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-white font-extrabold">
                Measured Commercial Execution.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-mono tracking-widest uppercase text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00D98B] animate-pulse" />
              <span>Scroll To Reveal 24/7 AI Assistance</span>
            </div>
          </div>

          {/* Center Giant Infinite Looping Sliced Marquee */}
          <div className="relative z-10 overflow-hidden w-full py-8 sm:py-12 select-none my-auto">
            <div className="benefits-infinite-track flex whitespace-nowrap will-change-transform py-2">
              <MarqueeTrack />
              <div aria-hidden="true" className="shrink-0 flex items-center">
                <MarqueeTrack />
              </div>
            </div>
          </div>

          {/* Bottom Vision Subtitle */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70">
              ✦ Don&apos;t let valuable conversations slip away — autonomous 24/7 sales.
            </span>
            <span className="hidden sm:inline-block font-mono text-xs tracking-widest uppercase text-white/40">
              [ 01 — 03 CORE ADVANTAGES ]
            </span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* PHASE 2: PERSISTENT SECTION HEADER (EXACT USER HEADING & PARAGRAPH)     */}
        {/* ======================================================================= */}
        <div
          ref={sectionHeaderRef}
          className="relative z-20 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-2"
        >
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-md">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#C5CAD4] font-medium max-w-2xl mx-auto leading-relaxed">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
          </p>
        </div>

        {/* ======================================================================= */}
        {/* THE 3 DARK JEWEL TONE CARDS WITH NEON ACCENTS (NO GLASSMORPHISM)        */}
        {/* ======================================================================= */}
        <div
          ref={cardsTrackRef}
          className="key-card-list relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch will-change-transform"
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
        >
          {/* =================================================================== */}
          {/* CARD 01: CUSTOMER ENGAGEMENT (DEEP EMERALD GREEN #003D2B + #00D98B)*/}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            data-kf-card="true"
            className="featured-card group relative rounded-2xl bg-[#003D2B] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,217,139,0.22)] hover:shadow-[0_25px_60px_rgba(0,217,139,0.40)] border-2 border-[#00D98B] overflow-hidden min-h-[380px] sm:min-h-[400px] lg:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Pill Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/50 text-[#00D98B] border border-[#00D98B]/40 uppercase tracking-wider">
                    Card 01 — Customer Engagement
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-white bg-black/50 border border-[#00D98B]/40 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D98B] animate-pulse" />
                    Available 24/7
                  </span>
                </div>

                {/* Kicker & Headlines */}
                <div className="mt-3">
                  <span className="text-[11px] font-mono font-black text-[#00D98B] uppercase tracking-widest block">
                    CUSTOMER EXPERIENCE
                  </span>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-[#FFFFFF] uppercase tracking-tight mt-0.5 leading-tight">
                    ALWAYS-ON CONVERSATIONS
                  </h3>
                  <h4 className="font-headline font-bold text-xs sm:text-sm text-[#00D98B] uppercase tracking-tight mt-0.5">
                    NEVER MISS AN ENQUIRY
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#C5CAD4] leading-relaxed font-normal">
                    Answer customer questions instantly using your approved business information, even outside working hours.
                  </p>
                </div>
              </div>

              {/* Visual element: Customer question -> Nexus response -> Guided towards enquiry */}
              <div className="my-3 bg-[#050507]/60 rounded-xl p-3 border border-[#00D98B]/30 space-y-2 text-white">
                {/* Customer asks a question */}
                <div className="flex items-start gap-2 bg-[#003D2B] rounded-lg p-2 border border-[#00D98B]/30 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-[#00D98B] text-black text-[9px] font-mono font-black flex items-center justify-center shrink-0">
                    Q
                  </span>
                  <p className="text-[#FFFFFF] font-medium text-[10px] sm:text-[11px] leading-tight">
                    &quot;Can I get details on your enterprise packages and setup time?&quot;
                  </p>
                </div>
                {/* Emperor Nexus assistant responds */}
                <div className="flex items-start gap-2 bg-[#050507] border border-[#00D98B]/50 rounded-lg p-2 text-[11px]">
                  <Bot className="w-3.5 h-3.5 text-[#00D98B] shrink-0 mt-0.5" />
                  <p className="text-[#00D98B] font-mono font-medium text-[10px] sm:text-[11px] leading-tight">
                    &quot;Emperor Nexus deploys in 5 minutes with verified answers and CRM sync.&quot;
                  </p>
                </div>
                {/* Visitor guided towards making an enquiry */}
                <div className="flex items-center justify-between pt-1 border-t border-[#00D98B]/20 text-[10px] font-mono font-bold text-white">
                  <span className="inline-flex items-center gap-1 text-[#C5CAD4]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D98B]" />
                    Guided Towards Enquiry
                  </span>
                  <span className="bg-[#00D98B] text-black px-2 py-0.5 rounded text-[9px] font-bold">
                    Lead Captured
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-[#00D98B]/30 flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-[11px] text-[#00D98B] font-black uppercase tracking-wider">
                  24/7 AI ASSISTANCE
                </span>
                <span className="font-mono text-[10px] font-bold text-[#00D98B] bg-black/50 border border-[#00D98B]/40 px-2.5 py-0.5 rounded">
                  Instant Setup
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 02: INTELLIGENT AUTOMATION (RICH ELECTRIC PURPLE #310044 + #C653FF) */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            data-kf-card="true"
            className="featured-card group relative rounded-2xl bg-[#310044] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(198,83,255,0.22)] hover:shadow-[0_25px_60px_rgba(198,83,255,0.40)] border-2 border-[#C653FF] overflow-hidden min-h-[380px] sm:min-h-[400px] lg:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Pill Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/50 text-[#C653FF] border border-[#C653FF]/40 uppercase tracking-wider">
                    Card 02 — Intelligent Automation
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white bg-black/50 border border-[#C653FF]/40 px-2.5 py-0.5 rounded-full">
                    Business Knowledge
                  </span>
                </div>

                {/* Kicker & Headlines */}
                <div className="mt-3">
                  <span className="text-[11px] font-mono font-black text-[#C653FF] uppercase tracking-widest block">
                    SMART AUTOMATION
                  </span>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-[#FFFFFF] uppercase tracking-tight mt-0.5 leading-tight">
                    LESS MANUAL WORK
                  </h3>
                  <h4 className="font-headline font-bold text-xs sm:text-sm text-[#C653FF] uppercase tracking-tight mt-0.5">
                    LET AI HANDLE REPETITIVE QUESTIONS
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#C5CAD4] leading-relaxed font-normal">
                    Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business information.
                  </p>
                </div>
              </div>

              {/* Visual element: Business info transforms into AI knowledge interface -> Assistant uses approved info */}
              <div className="my-3 bg-[#050507]/60 rounded-xl p-3 border border-[#C653FF]/30 space-y-2 text-white">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-[#C5CAD4]">
                    <Cpu className="w-3.5 h-3.5 text-[#C653FF]" />
                    Knowledge Interface
                  </span>
                  <span className="bg-[#C653FF] text-black px-2 py-0.5 rounded text-[9px] font-bold">
                    100% Approved
                  </span>
                </div>
                <div className="bg-[#310044] border border-[#C653FF]/30 rounded-lg p-2 text-[10px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-[#C653FF]">
                    <span>• Services &amp; Packages</span>
                    <span className="text-white">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[#C653FF]">
                    <span>• Pricing &amp; Business Info</span>
                    <span className="text-white">Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#C5CAD4] pt-1 border-t border-[#C653FF]/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C653FF] shrink-0" />
                  <span>Assistant uses approved information only</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-[#C653FF]/30 flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-[11px] text-[#C653FF] font-black uppercase tracking-wider">
                  MORE TIME FOR YOUR TEAM
                </span>
                <span className="font-mono text-[10px] font-bold text-[#C653FF] bg-black/50 border border-[#C653FF]/40 px-2.5 py-0.5 rounded">
                  Zero Repetition
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* CARD 03: ENQUIRY VISIBILITY (MIDNIGHT NAVY BLUE #002653 + #009DFF)  */}
          {/* =================================================================== */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            data-kf-card="true"
            className="featured-card group relative rounded-2xl bg-[#002653] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,157,255,0.22)] hover:shadow-[0_25px_60px_rgba(0,157,255,0.40)] border-2 border-[#009DFF] overflow-hidden min-h-[380px] sm:min-h-[400px] lg:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Top Pill Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/50 text-[#009DFF] border border-[#009DFF]/40 uppercase tracking-wider">
                    Card 03 — Enquiry Visibility
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white bg-black/50 border border-[#009DFF]/40 px-2.5 py-0.5 rounded-full">
                    Conversation Overview
                  </span>
                </div>

                {/* Kicker & Headlines */}
                <div className="mt-3">
                  <span className="text-[11px] font-mono font-black text-[#009DFF] uppercase tracking-widest block">
                    BUSINESS INSIGHTS
                  </span>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-[#FFFFFF] uppercase tracking-tight mt-0.5 leading-tight">
                    TURN CHATS INTO OPPORTUNITIES
                  </h3>
                  <h4 className="font-headline font-bold text-xs sm:text-sm text-[#009DFF] uppercase tracking-tight mt-0.5">
                    STAY CONNECTED TO CUSTOMER INTEREST
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#C5CAD4] leading-relaxed font-normal">
                    View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for.
                  </p>
                </div>
              </div>

              {/* Visual element: Chat conversation preview + Enquiry overview panel */}
              <div className="my-3 bg-[#050507]/60 rounded-xl p-3 border border-[#009DFF]/30 space-y-2 text-white">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-[#C5CAD4]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#009DFF]" />
                    Business Enquiry Panel
                  </span>
                  <span className="bg-[#009DFF] text-black px-2 py-0.5 rounded text-[9px] font-bold">
                    98% Match
                  </span>
                </div>
                <div className="bg-[#002653] border border-[#009DFF]/30 rounded-lg p-2 text-[10px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#FFFFFF] font-bold">Elena Rostova</span>
                    <span className="bg-[#009DFF] text-black font-bold px-1.5 py-0.2 rounded text-[9px]">
                      Hot Enquiry
                    </span>
                  </div>
                  <p className="text-[#C5CAD4] text-[9px] truncate">
                    &quot;Looking for automated sales assistant for 3 domains&quot;
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#009DFF]/20 text-[10px] font-mono font-bold">
                  <span className="text-[#C5CAD4]">Customer Details &amp; Intent Logged</span>
                  <span className="text-[#009DFF]">Instant Sync</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-[#009DFF]/30 flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-[11px] text-[#009DFF] font-black uppercase tracking-wider">
                  CONVERSATIONS &amp; ENQUIRIES
                </span>
                <span className="font-mono text-[10px] font-bold text-[#009DFF] bg-black/50 border border-[#009DFF]/40 px-2.5 py-0.5 rounded">
                  Live Dashboard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom hint banner */}
        <div className="relative z-10 text-center shrink-0 pt-1 text-xs font-mono text-zinc-400">
          <span>✦ 24/7 Autonomous Sales AI · Instant Inquiry Capture</span>
        </div>
      </div>
    </div>
  );
}