import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
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
    className="mx-8 sm:mx-14 w-6 h-6 sm:w-9 sm:h-9 shrink-0 text-white/50"
  >
    <line x1="20" y1="0" x2="20" y2="40" stroke="currentColor" strokeWidth="1.5" />
    <line x1="0" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default function BenefitsSection() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const marqueeRef = useRef(null);
  const visionContentRef = useRef(null);
  const stripesWrapperRef = useRef(null);
  const stripeRefs = useRef([]);
  const keyfactsSectionRef = useRef(null);
  const keyfactsHeaderRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;

      // 1. Initial State for Vision Marquee & Stripes
      if (marqueeRef.current) {
        gsap.set(marqueeRef.current, { x: 0 });
      }
      if (visionContentRef.current) {
        gsap.set(visionContentRef.current, { opacity: 1 });
      }

      // Stripes begin at scaleY 0 from bottom
      stripeRefs.current.forEach((stripe) => {
        if (stripe) {
          gsap.set(stripe, {
            scaleY: 0,
            transformOrigin: "bottom",
            willChange: "transform",
          });
        }
      });

      // 2. Initial State for Key Facts & 3 Cards
      if (keyfactsSectionRef.current) {
        gsap.set(keyfactsSectionRef.current, { opacity: 0 });
      }
      if (keyfactsHeaderRef.current) {
        gsap.set(keyfactsHeaderRef.current, { opacity: 0, y: 30 });
      }

      if (cardRefs.current[0]) {
        gsap.set(cardRefs.current[0], {
          opacity: 0,
          x: isDesktop ? -120 : -40,
          y: isDesktop ? 40 : 20,
          rotateY: isDesktop ? 16 : 0,
          scale: 0.88,
          transformOrigin: "center center",
          force3D: true,
        });
      }
      if (cardRefs.current[1]) {
        gsap.set(cardRefs.current[1], {
          opacity: 0,
          x: 0,
          y: isDesktop ? 60 : 30,
          scale: 0.82,
          transformOrigin: "center center",
          force3D: true,
        });
      }
      if (cardRefs.current[2]) {
        gsap.set(cardRefs.current[2], {
          opacity: 0,
          x: isDesktop ? 120 : 40,
          y: isDesktop ? 40 : 20,
          rotateY: isDesktop ? -16 : 0,
          scale: 0.88,
          transformOrigin: "center center",
          force3D: true,
        });
      }

      // ============================================================
      // MASTER COORDINATED GSAP SCROLL-TRIGGER TIMELINE (Trionn Shutter)
      // 0.00 -> 0.35: Horizontal marquee scrub + 5 horizontal shutter stripes expand (slicing text)
      // 0.35 -> 0.48: Vision text fades out, shutters complete coverage
      // 0.45 -> 0.65: Shutters open/wipe away revealing Key Facts section
      // 0.55 -> 0.78: 3 Bright colorful enterprise cards fan out in 3D perspective
      // 0.78 -> 1.00: Steady interactive hold for reading & hover
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1600",
          pin: stage,
          pinSpacing: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // A. Horizontal Marquee Scroll during shutter expansion
      if (marqueeRef.current) {
        tl.to(
          marqueeRef.current,
          {
            x: isDesktop ? -380 : -180,
            duration: 0.45,
            ease: "none",
          },
          0
        );
      }

      // B. Trionn Shutter Slats Expand (ScaleY 0 -> 1 with staggered timing)
      stripeRefs.current.forEach((stripe, idx) => {
        if (stripe) {
          tl.to(
            stripe,
            {
              scaleY: 1,
              duration: 0.34,
              ease: "power2.inOut",
            },
            0.05 + idx * 0.045
          );
        }
      });

      // C. Vision content fades out under shutters
      if (visionContentRef.current) {
        tl.to(
          visionContentRef.current,
          {
            opacity: 0,
            duration: 0.15,
            ease: "power2.out",
          },
          0.32
        );
      }

      // D. Key Facts background becomes active
      if (keyfactsSectionRef.current) {
        tl.to(
          keyfactsSectionRef.current,
          {
            opacity: 1,
            duration: 0.15,
            ease: "power1.inOut",
          },
          0.38
        );
      }

      // E. Shutters Wipe/Open from Top to reveal Key Facts stage
      stripeRefs.current.forEach((stripe, idx) => {
        if (stripe) {
          tl.to(
            stripe,
            {
              scaleY: 0,
              transformOrigin: "top",
              duration: 0.30,
              ease: "power2.inOut",
            },
            0.44 + idx * 0.035
          );
        }
      });

      // F. Key Facts Section Header Fades In
      if (keyfactsHeaderRef.current) {
        tl.to(
          keyfactsHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            ease: "power3.out",
          },
          0.50
        );
      }

      // G. The 3 Vibrant Enterprise Cards Fly in with 3D Perspective
      if (cardRefs.current[0]) {
        tl.to(
          cardRefs.current[0],
          {
            opacity: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.32,
            ease: "power3.out",
          },
          0.54
        );
      }

      if (cardRefs.current[1]) {
        tl.to(
          cardRefs.current[1],
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.34,
            ease: "power3.out",
          },
          0.58
        );
      }

      if (cardRefs.current[2]) {
        tl.to(
          cardRefs.current[2],
          {
            opacity: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.32,
            ease: "power3.out",
          },
          0.62
        );
      }

      // H. Interactive reading hold
      tl.to({}, { duration: 0.38 }, 0.62);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="relative w-full bg-[#08090D] select-none"
    >
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden bg-[#08090D]"
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        {/* ========================================================================= */}
        {/* PHASE 1: TRIONN VISION & HORIZONTAL SHUTTER TRANSITION                   */}
        {/* ========================================================================= */}
        <div
          ref={visionContentRef}
          className="absolute inset-0 z-20 flex flex-col justify-between py-12 sm:py-16 px-6 sm:px-14 pointer-events-none text-white"
          style={{ mixBlendMode: "difference" }}
        >
          {/* Top Vision Title */}
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-[#A1A1AA] font-bold">
                Focused Intelligence.
              </span>
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-white font-extrabold">
                Measured Commercial Execution.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-mono tracking-widest uppercase text-white/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Scroll To Reveal Impact</span>
            </div>
          </div>

          {/* Center Giant Sliced Marquee */}
          <div className="relative overflow-hidden w-full py-4 select-none">
            <div
              ref={marqueeRef}
              className="flex whitespace-nowrap will-change-transform"
            >
              <div className="shrink-0 flex items-center uppercase font-headline font-black text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-tight leading-none text-white">
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
          <div className="w-full flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70">
              From visitor curiosity to committed enterprise pipeline.
            </span>
            <span className="hidden sm:inline-block font-mono text-xs tracking-widest uppercase text-white/40">
              [ 01 — 03 KEY METRICS ]
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE 5 HORIZONTAL SHUTTER STRIPES (Slices across viewport like blinds)     */}
        {/* ========================================================================= */}
        <div
          ref={stripesWrapperRef}
          className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-30"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              ref={(el) => (stripeRefs.current[i] = el)}
              className="stripe-item flex-1 w-full bg-[#DCDCE2] border-b border-[#C8C8D0]/50"
              style={{
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                willChange: "transform",
              }}
            />
          ))}
        </div>

        {/* ========================================================================= */}
        {/* PHASE 2: KEY FACTS SECTION & 3 VIBRANT HIGH-IMPACT ENTERPRISE CARDS       */}
        {/* ========================================================================= */}
        <div
          ref={keyfactsSectionRef}
          className="absolute inset-0 z-40 flex flex-col justify-between pt-14 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-8 bg-[linear-gradient(180deg,#090A0F_0%,#10121A_50%,#090A0F_100%)]"
        >
          {/* Section Header */}
          <div
            ref={keyfactsHeaderRef}
            className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-widest text-purple-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Autonomous Enterprise Advantages</span>
            </div>
            <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-white tracking-tight leading-tight">
              Don&apos;t Let Valuable Conversations Slip Away.
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto">
              Your website should be ready to answer, qualify, and capture enterprise interest — even when your team is unavailable.
            </p>
          </div>

          {/* The 3 Cards Container */}
          <div
            className="key-card-list relative z-20 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto my-auto"
            style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
          >
            {/* =================================================================== */}
            {/* CARD 01: VIBRANT CYBER EMERALD GREEN (Pipeline Acceleration)        */}
            {/* =================================================================== */}
            <div
              ref={(el) => (cardRefs.current[0] = el)}
              className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#04281E] via-[#08382A] to-[#021A12] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(16,185,129,0.35)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.50)] border-2 border-[#10B981] hover:border-[#34D399] overflow-hidden min-h-[360px] sm:min-h-[380px] will-change-transform transition-all duration-300 hover:-translate-y-1"
            >
              {/* Emerald Ambient Glow */}
              <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#10B981]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Top Pill Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/25 text-[#A7F3D0] border border-[#10B981]/50 uppercase tracking-wider">
                    Card 01 · Velocity
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live 24/7
                  </span>
                </div>

                {/* Big Stat & Headline */}
                <div className="mt-3">
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
                <div className="mt-3.5 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-emerald-500/30 space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold shrink-0">
                      INBOUND
                    </span>
                    <p className="text-slate-200 text-[11px] leading-tight">
                      &quot;Need SOC-2 compliance &amp; automated CRM sync for 40 reps.&quot;
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-emerald-500/20 text-[10px]">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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
              className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#1E0D36] via-[#2D1252] to-[#140826] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(168,85,247,0.35)] hover:shadow-[0_25px_60px_rgba(168,85,247,0.50)] border-2 border-[#A855F7] hover:border-[#C084FC] overflow-hidden min-h-[360px] sm:min-h-[380px] will-change-transform transition-all duration-300 hover:-translate-y-1"
            >
              {/* Purple Ambient Glow */}
              <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#A855F7]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Top Pill Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#A855F7]/25 text-[#E9D5FF] border border-[#A855F7]/50 uppercase tracking-wider">
                    Card 02 · Autonomy
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
                <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#2E1256] to-[#120724] border-2 border-[#C084FC] shadow-[0_0_35px_rgba(168,85,247,0.55)]">
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
              className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#061F38] via-[#0A2E54] to-[#041427] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(56,189,248,0.35)] hover:shadow-[0_25px_60px_rgba(56,189,248,0.50)] border-2 border-[#38BDF8] hover:border-[#7DD3FC] overflow-hidden min-h-[360px] sm:min-h-[380px] will-change-transform transition-all duration-300 hover:-translate-y-1"
            >
              {/* Sapphire Ambient Glow */}
              <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#38BDF8]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Top Pill Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#38BDF8]/25 text-[#BAE6FD] border border-[#38BDF8]/50 uppercase tracking-wider">
                    Card 03 · SLA Speed
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-sky-300 bg-black/40 px-2 py-0.5 rounded-full border border-sky-500/40">
                    <Zap className="w-3 h-3 text-sky-400" />
                    Stream SLA
                  </span>
                </div>

                {/* Big Stat & Headline */}
                <div className="mt-3">
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

              {/* Bottom KPIs & Isolation */}
              <div className="relative z-10 pt-3 border-t border-sky-500/30 flex items-center justify-between">
                <span className="font-mono text-[10px] text-sky-200 font-bold uppercase tracking-wider">
                  Multi-Tenant Isolation
                </span>
                <span className="font-mono text-[10px] font-bold text-[#7DD3FC] bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/30">
                  Global Edge
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Inspection Hint */}
          <div className="relative z-10 max-w-xl mx-auto text-center shrink-0">
            <p className="font-mono text-[11px] text-slate-400 tracking-widest uppercase font-bold flex items-center justify-center gap-2">
              <span>Hover over any card to inspect commercial parameters</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
