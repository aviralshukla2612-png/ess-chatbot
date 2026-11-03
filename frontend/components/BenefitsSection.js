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
  const visionRef = useRef(null);
  const marqueeRef = useRef(null);
  const stripeRefs = useRef([]);
  const keyfactsRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const vision = visionRef.current;
    const keyfacts = keyfactsRef.current;
    if (!vision || !keyfacts) return;

    const ctx = gsap.context(() => {
      // ============================================================
      // 1. TRIONN SHUTTER STRIPES ANIMATION ON VISION SECTION
      // ============================================================
      const stripes = stripeRefs.current.filter(Boolean);
      gsap.set(stripes, {
        scaleY: 0,
        transformOrigin: "bottom",
        willChange: "transform",
      });

      const visionTl = gsap.timeline({
        scrollTrigger: {
          trigger: vision,
          start: "top top",
          end: "+=100%",
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });

      // Horizontal marquee scrub
      if (marqueeRef.current) {
        visionTl.to(
          marqueeRef.current,
          {
            x: -360,
            duration: 1,
            ease: "none",
          },
          0
        );
      }

      // Trionn exact shutter formula: staggered bottom-up vertical slats
      visionTl.addLabel("stripes_start", 0.05);
      for (let e = 0; e < 5; e++) {
        if (stripes[e]) {
          const s = (0.3 * (4 - e)) / 4;
          const a = s + 0.35;
          visionTl.to(
            stripes[e],
            {
              scaleY: 1,
              duration: a - s,
              ease: "none",
            },
            `stripes_start+=${s}`
          );
        }
      }

      // ============================================================
      // 2. TRIONN KEY FACTS 3D CARD FLIP ANIMATION (rotateX: -92 -> 0)
      // ============================================================
      const cards = cardRefs.current.filter(Boolean);
      gsap.set(cards, { autoAlpha: 0, force3D: true });

      const mm = gsap.matchMedia();

      // Desktop: 3D Flip down on perspective axis
      mm.add("(min-width: 768px)", () => {
        gsap.set(cards, {
          rotateX: -92,
          transformOrigin: "center top",
        });

        gsap.timeline({
          scrollTrigger: {
            id: "keyfacts-cards-desktop",
            trigger: keyfacts,
            start: "top 75%",
            end: "top 18%",
            scrub: 1.4,
          },
        }).to(cards, {
          rotateX: 0,
          autoAlpha: 1,
          stagger: { each: 0.3, from: "start" },
          ease: "power2.out",
          force3D: true,
          overwrite: true,
        });
      });

      // Mobile: Clean fade up
      mm.add("(max-width: 767px)", () => {
        gsap.set(cards, { rotateX: 0, autoAlpha: 1 });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} id="benefits" className="relative w-full bg-[#050507] text-[#F5F5F7] select-none">
      {/* ========================================================================= */}
      {/* 1. TRIONN VISION & HORIZONTAL SHUTTER STRIPES SECTION                     */}
      {/* ========================================================================= */}
      <section
        ref={visionRef}
        id="vision-section"
        className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#050507] flex flex-col justify-between py-12 sm:py-16 px-6 sm:px-14 border-b border-white/[0.04]"
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
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#963DFF]/15 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#55A9FF]/15 rounded-full blur-[140px] pointer-events-none z-0" />

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
        <div className="relative z-10 overflow-hidden w-full py-4 select-none">
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

        {/* THE 5 HORIZONTAL SHUTTER STRIPES (Sleek dark obsidian slats that close over section) */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-30">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              ref={(el) => (stripeRefs.current[i] = el)}
              className="stripe-item flex-1 w-full bg-[#0D0E16] border-b border-purple-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                willChange: "transform",
              }}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRIONN KEY FACTS SECTION & 3 VIBRANT 3D FLIP-DOWN CARDS                */}
      {/* ========================================================================= */}
      <section
        ref={keyfactsRef}
        id="keyfacts-section"
        className="relative z-20 pt-20 pb-24 lg:py-32 bg-[#050507] overflow-hidden border-b border-white/[0.04]"
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
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#963DFF]/15 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#55A9FF]/15 rounded-full blur-[140px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="title-block flex flex-col items-center mb-12 lg:mb-16 gap-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-widest text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Key Facts &amp; Measured Impact</span>
            </div>
            <h2 className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl uppercase text-white tracking-tight leading-tight">
              A Snapshot of Real-World Commercial Impact.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
              Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
            </p>
          </div>

          {/* 3D PERSPECTIVE CARD LIST (Trionn rotateX: -92 -> 0 flip-down animation) */}
          <div
            className="key-card-list flex gap-6 justify-center flex-wrap lg:flex-nowrap w-full"
            style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
          >
            {/* =================================================================== */}
            {/* CARD 01: VIBRANT CYBER EMERALD GREEN (Pipeline Acceleration)        */}
            {/* =================================================================== */}
            <div
              ref={(el) => (cardRefs.current[0] = el)}
              data-kf-card="true"
              className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#04281E] via-[#08382A] to-[#021A12] p-7 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(16,185,129,0.35)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.55)] border-2 border-[#10B981] hover:border-[#34D399] overflow-hidden w-full md:w-[380px] lg:w-full min-h-[440px] sm:min-h-[460px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
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
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline font-black text-5xl sm:text-6xl text-[#34D399] tracking-tight">
                      4.8x
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300/80 uppercase">
                      Velocity
                    </span>
                  </div>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-white uppercase tracking-tight mt-1">
                    Pipeline Acceleration
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    Convert high-intent enterprise visitors into scheduled consultations instantly — eliminating sales rep response delays and dropped leads.
                  </p>
                </div>

                {/* Simulated Inbound Consultation Feed */}
                <div className="mt-4 bg-black/60 backdrop-blur-md rounded-xl p-3.5 border border-emerald-500/30 space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold shrink-0">
                      INBOUND
                    </span>
                    <p className="text-slate-200 text-[11px] leading-tight">
                      &quot;Need SOC-2 compliance &amp; automated CRM sync for 40 reps.&quot;
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-[10px]">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Consultation Booked
                    </span>
                    <span className="text-slate-300 font-mono">Tomorrow 3:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Bottom KPIs & Integrations */}
              <div className="relative z-10 pt-4 border-t border-emerald-500/30 flex items-center justify-between">
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
              className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#1E0D36] via-[#2D1252] to-[#140826] p-7 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(168,85,247,0.35)] hover:shadow-[0_25px_60px_rgba(168,85,247,0.55)] border-2 border-[#A855F7] hover:border-[#C084FC] overflow-hidden w-full md:w-[380px] lg:w-full min-h-[440px] sm:min-h-[460px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
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

                <h3 className="font-headline font-black text-xl sm:text-2xl text-white uppercase tracking-tight mt-4">
                  Autonomous Resolution
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  Handles complex multi-turn inquiries across enterprise pricing, compliance, and custom requirements using verified knowledge graphs.
                </p>
              </div>

              {/* Central Iconic Radial Hub (Trionn-inspired central circle) */}
              <div className="relative z-10 my-4 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-[#32135D] to-[#140726] border-2 border-[#C084FC] shadow-[0_0_40px_rgba(168,85,247,0.55)]">
                  {/* Subtle pulsing outer ring */}
                  <div className="absolute inset-0 rounded-full border border-purple-400/40 animate-ping opacity-25" />
                  <div className="text-center">
                    <span className="block font-headline font-black text-4xl sm:text-5xl text-white tracking-tight leading-none drop-shadow-md">
                      1.5M+
                    </span>
                    <span className="block font-mono text-[9px] font-bold tracking-widest uppercase text-purple-200 mt-1">
                      Queries Solved
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom KPIs & Verification */}
              <div className="relative z-10 pt-4 border-t border-purple-500/30 flex items-center justify-between">
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
              className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#061F38] via-[#0A2E54] to-[#041427] p-7 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(56,189,248,0.35)] hover:shadow-[0_25px_60px_rgba(56,189,248,0.55)] border-2 border-[#38BDF8] hover:border-[#7DD3FC] overflow-hidden w-full md:w-[380px] lg:w-full min-h-[440px] sm:min-h-[460px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
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
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline font-black text-5xl sm:text-6xl text-[#38BDF8] tracking-tight">
                      &lt; 1.2s
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-300/80 uppercase">
                      Latency
                    </span>
                  </div>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-white uppercase tracking-tight mt-1">
                    Sub-Second Intelligence
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    Enterprise-grade streaming responses with real-time sentiment scoring and automated commercial objection handling.
                  </p>
                </div>

                {/* Live Real-Time Telemetry Feed */}
                <div className="mt-4 bg-black/60 backdrop-blur-md rounded-xl p-3.5 border border-sky-500/30 space-y-1.5 text-[11px]">
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

              {/* Bottom KPIs & Isolation */}
              <div className="relative z-10 pt-4 border-t border-sky-500/30 flex items-center justify-between">
                <span className="font-mono text-[10px] text-sky-200 font-bold uppercase tracking-wider">
                  Multi-Tenant Isolation
                </span>
                <span className="font-mono text-[10px] font-bold text-[#7DD3FC] bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/30">
                  Global Edge
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
