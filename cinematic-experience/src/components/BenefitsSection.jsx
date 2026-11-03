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

// Crosshair SVG icon identical to Trionn
const Crosshair = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-8 sm:mx-14 w-6 h-6 sm:w-9 sm:h-9 shrink-0 text-purple-400/60"
  >
    <line x1="20" y1="0" x2="20" y2="40" stroke="currentColor" strokeWidth="1.5" />
    <line x1="0" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function BenefitsSection() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const visionRef = useRef(null);
  const marqueeRef = useRef(null);
  const stripeRefs = useRef([]);
  const keyfactsRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    const vision = visionRef.current;
    const keyfacts = keyfactsRef.current;
    if (!container || !stage || !vision || !keyfacts) return;

    const ctx = gsap.context(() => {
      const stripes = stripeRefs.current.filter(Boolean);
      const cards = cardRefs.current.filter(Boolean);

      // Initial visual states
      gsap.set(stripes, {
        scaleY: 0,
        transformOrigin: "bottom",
        willChange: "transform",
      });
      gsap.set(vision, { autoAlpha: 1 });
      gsap.set(keyfacts, { autoAlpha: 0 });
      gsap.set(cards, {
        rotateX: -92,
        autoAlpha: 0,
        transformOrigin: "center top",
        force3D: true,
      });

      // Unified single coordinated pinned stage (ZERO GAP between shutter and cards)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1300",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.75,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });

      // 1. Horizontal Marquee glide across Vision phase (duration 3.5)
      if (marqueeRef.current) {
        tl.to(
          marqueeRef.current,
          {
            x: -360,
            duration: 3.5,
            ease: "none",
          },
          0
        );
      }

      // 2. Trionn Shutter Slats scale up from bottom, slicing through text
      stripes.forEach((stripe, i) => {
        const s = ((0.3 * (4 - i)) / 4) * 4.0; // staggered from 0 to 3.0
        const a = s + 1.4;
        tl.to(
          stripe,
          {
            scaleY: 1,
            duration: a - s,
            ease: "power1.inOut",
          },
          s
        );
      });

      // 3. Peak shutter coverage (at ~3.3): seamlessly swap vision for key facts behind closed slats
      tl.to(vision, { autoAlpha: 0, duration: 0.1 }, 3.3);
      tl.to(keyfacts, { autoAlpha: 1, duration: 0.1 }, 3.3);

      // 4. Change transformOrigin of slats to top
      tl.set(stripes, { transformOrigin: "top" }, 3.4);

      // 5. Slats wipe open from top to bottom (like blinds opening)
      stripes.forEach((stripe, i) => {
        const delay = 3.5 + i * 0.14;
        tl.to(
          stripe,
          {
            scaleY: 0,
            duration: 1.3,
            ease: "power2.inOut",
          },
          delay
        );
      });

      // 6. Trionn 3D Card Flip-Down (rotateX: -92 -> 0) directly unfolds as slats wipe open
      tl.to(
        cards,
        {
          rotateX: 0,
          autoAlpha: 1,
          duration: 1.8,
          stagger: 0.25,
          ease: "power2.out",
          force3D: true,
        },
        4.4
      );

      // 7. Settled comfortable hold (from 6.8 to 10.0) so user can comfortably read metrics
      tl.to({}, { duration: 3.2 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="benefits"
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* ========================================================================= */}
      {/* UNIFIED PINNED STAGE (ZERO SCROLL GAP — VISION + SHUTTER + KEY FACTS)      */}
      {/* ========================================================================= */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] max-h-screen overflow-hidden bg-[#050507] flex flex-col justify-center items-center"
      >
        {/* Subtle Technical Grid Background & Ambient Lighting */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 z-0"
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
        {/* LAYER 1: VISION SECTION (Scrubbed Marquee + Slicing Typography)          */}
        {/* ======================================================================= */}
        <div
          ref={visionRef}
          className="absolute inset-0 z-20 flex flex-col justify-between py-10 sm:py-14 px-6 sm:px-14 pointer-events-none select-none"
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
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm text-xs font-mono tracking-widest uppercase text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Scroll To Reveal Key Facts</span>
            </div>
          </div>

          {/* Center Giant Sliced Marquee */}
          <div className="relative z-10 overflow-hidden w-full py-4 select-none my-auto">
            <div
              ref={marqueeRef}
              className="flex whitespace-nowrap will-change-transform"
            >
              <div className="shrink-0 flex items-center uppercase font-headline font-black text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-tight leading-none text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.25)]">
                <span>Capture</span>
                <Crosshair />
                <span>Qualify</span>
                <Crosshair />
                <span>Convert</span>
                <Crosshair />
                <span>Scale</span>
                <Crosshair />
                <span>Capture</span>
                <Crosshair />
                <span>Qualify</span>
                <Crosshair />
                <span>Convert</span>
                <Crosshair />
                <span>Scale</span>
              </div>
            </div>
          </div>

          {/* Bottom Vision Subtitle */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70">
              ✦ From visitor curiosity to committed enterprise pipeline.
            </span>
            <span className="hidden sm:inline-block font-mono text-xs tracking-widest uppercase text-white/40">
              [ 01 — 03 KEY METRICS ]
            </span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* LAYER 2: KEY FACTS SECTION & 3 VIBRANT 3D FLIP-DOWN CARDS               */}
        {/* ======================================================================= */}
        <div
          ref={keyfactsRef}
          className="absolute inset-0 z-10 flex flex-col justify-center items-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 select-none opacity-0"
        >
          <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-col justify-center my-auto">
            {/* Section Header */}
            <div className="title-block flex flex-col items-center mb-6 sm:mb-8 gap-2 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-widest text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Key Facts &amp; Measured Impact</span>
              </div>
              <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-white tracking-tight leading-tight">
                A Snapshot of Real-World Commercial Impact.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
                Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
              </p>
            </div>

            {/* 3D PERSPECTIVE CARD LIST (Trionn rotateX: -92 -> 0 flip-down animation) */}
            <div
              className="key-card-list flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 w-full px-2 no-scrollbar md:grid md:grid-cols-3 md:gap-5 lg:gap-6 items-stretch justify-center"
              style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
            >
              {/* =================================================================== */}
              {/* CARD 01: VIBRANT CYBER EMERALD GREEN (Pipeline Acceleration)        */}
              {/* =================================================================== */}
              <div
                ref={(el) => (cardRefs.current[0] = el)}
                data-kf-card="true"
                className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#04281E] via-[#08382A] to-[#021A12] p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(16,185,129,0.35)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.55)] border-2 border-[#10B981] hover:border-[#34D399] overflow-hidden w-[84vw] shrink-0 snap-center sm:w-auto md:w-full min-h-[400px] sm:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Emerald Ambient Glow */}
                <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#10B981]/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/25 text-[#A7F3D0] border border-[#10B981]/50 uppercase tracking-wider">
                      Key Metric 01 · Velocity
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live 24/7
                    </span>
                  </div>

                  {/* Big Stat & Headline */}
                  <div className="mt-3.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline font-black text-4xl sm:text-5xl text-[#34D399] tracking-tight">
                        4.8x
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-300/80 uppercase">
                        Velocity
                      </span>
                    </div>
                    <h3 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-tight mt-1">
                      Pipeline Acceleration
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-200 leading-relaxed font-medium">
                      Convert high-intent enterprise visitors into scheduled consultations instantly — eliminating sales rep response delays and dropped leads.
                    </p>
                  </div>

                  {/* Simulated Inbound Consultation Feed */}
                  <div className="mt-3 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-emerald-500/30 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold shrink-0">
                        INBOUND
                      </span>
                      <p className="text-slate-200 text-[10px] sm:text-[11px] leading-tight">
                        &quot;Need SOC-2 compliance &amp; automated CRM sync for 40 reps.&quot;
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-emerald-500/20 text-[10px]">
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Consultation Booked
                      </span>
                      <span className="text-slate-300 font-mono">Tomorrow 3:00 PM</span>
                    </div>
                  </div>
                </div>

                {/* Bottom KPIs & Integrations */}
                <div className="relative z-10 pt-3 border-t border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-200/90 font-bold">
                    <span>Salesforce</span>
                    <span>·</span>
                    <span>HubSpot</span>
                    <span>·</span>
                    <span>Zapier</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#6EE7B7] bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                    +73% After-Hours
                  </span>
                </div>
              </div>

              {/* =================================================================== */}
              {/* CARD 02: VIBRANT ROYAL INDIGO / PURPLE (Autonomous Resolution)     */}
              {/* =================================================================== */}
              <div
                ref={(el) => (cardRefs.current[1] = el)}
                data-kf-card="true"
                className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#1E0D36] via-[#2D1252] to-[#140826] p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(168,85,247,0.35)] hover:shadow-[0_25px_60px_rgba(168,85,247,0.55)] border-2 border-[#A855F7] hover:border-[#C084FC] overflow-hidden w-[84vw] shrink-0 snap-center sm:w-auto md:w-full min-h-[400px] sm:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Purple Ambient Glow */}
                <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#A855F7]/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#A855F7]/25 text-[#E9D5FF] border border-[#A855F7]/50 uppercase tracking-wider">
                      Key Metric 02 · Autonomy
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-black/40 px-2 py-0.5 rounded-full border border-purple-500/40">
                      Zero Hallucination
                    </span>
                  </div>

                  <h3 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-tight mt-3">
                    Autonomous Resolution
                  </h3>
                  <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                    Handles complex multi-turn inquiries across enterprise pricing, compliance, and custom requirements using verified knowledge graphs.
                  </p>
                </div>

                {/* Central Iconic Radial Hub (Trionn-inspired central circle) */}
                <div className="relative z-10 my-3 flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#32135D] to-[#140726] border-2 border-[#C084FC] shadow-[0_0_35px_rgba(168,85,247,0.55)]">
                    {/* Subtle pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border border-purple-400/40 animate-ping opacity-25" />
                    <div className="text-center">
                      <span className="block font-headline font-black text-3xl sm:text-4xl text-white tracking-tight leading-none drop-shadow-md">
                        1.5M+
                      </span>
                      <span className="block font-mono text-[9px] font-bold tracking-widest uppercase text-purple-200 mt-1">
                        Queries Solved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom KPIs & Verification */}
                <div className="relative z-10 pt-3 border-t border-purple-500/30 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-purple-200 font-bold uppercase tracking-wider">
                    94.2% Autonomous Rate
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#D8B4FE] bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                    SOC-2 Grounded
                  </span>
                </div>
              </div>

              {/* =================================================================== */}
              {/* CARD 03: VIBRANT CYBER SAPPHIRE / BLUE (Sub-Second Latency)         */}
              {/* =================================================================== */}
              <div
                ref={(el) => (cardRefs.current[2] = el)}
                data-kf-card="true"
                className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#061F38] via-[#0A2E54] to-[#041427] p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(56,189,248,0.35)] hover:shadow-[0_25px_60px_rgba(56,189,248,0.55)] border-2 border-[#38BDF8] hover:border-[#7DD3FC] overflow-hidden w-[84vw] shrink-0 snap-center sm:w-auto md:w-full min-h-[400px] sm:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Sapphire Ambient Glow */}
                <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#38BDF8]/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#38BDF8]/25 text-[#BAE6FD] border border-[#38BDF8]/50 uppercase tracking-wider">
                      Key Metric 03 · SLA Speed
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-sky-300 bg-black/40 px-2 py-0.5 rounded-full border border-sky-500/40">
                      <Zap className="w-3 h-3 text-sky-400" />
                      Stream SLA
                    </span>
                  </div>

                  {/* Big Stat & Headline */}
                  <div className="mt-3.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline font-black text-4xl sm:text-5xl text-[#38BDF8] tracking-tight">
                        &lt; 1.2s
                      </span>
                      <span className="text-xs font-mono font-bold text-sky-300/80 uppercase">
                        Latency
                      </span>
                    </div>
                    <h3 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-tight mt-1">
                      Sub-Second Intelligence
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-200 leading-relaxed font-medium">
                      Enterprise-grade streaming responses with real-time sentiment scoring and automated commercial objection handling.
                    </p>
                  </div>

                  {/* Live Real-Time Telemetry Feed */}
                  <div className="mt-3 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-sky-500/30 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-[10px] font-mono">Commercial Intent</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        98.6% MATCH
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-[10px] font-mono">Response First Token</span>
                      <span className="text-sky-300 font-mono font-bold text-[10px]">
                        0.84s Average
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-[10px] font-mono">High Availability</span>
                      <span className="text-emerald-400 font-mono font-bold text-[10px]">
                        99.98% Uptime SLA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom KPIs */}
                <div className="relative z-10 pt-3 border-t border-sky-500/30 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-sky-200 font-bold uppercase tracking-wider">
                    Zero-Buffer Edge Mesh
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#7DD3FC] bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/30">
                    &lt; 600ms TTFT
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile swipe hint */}
            <div className="flex md:hidden items-center justify-center gap-2 mt-3 text-xs font-mono text-purple-300/80">
              <span>Swipe cards to explore all metrics →</span>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* LAYER 3: THE 5 HORIZONTAL SHUTTER STRIPES (Sleek dark obsidian slats)   */}
        {/* ======================================================================= */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-30">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              ref={(el) => (stripeRefs.current[i] = el)}
              className="stripe-item flex-1 w-full bg-[#08090E] border-b border-purple-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                willChange: "transform",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
