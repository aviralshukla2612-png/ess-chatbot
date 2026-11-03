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
  ArrowRight,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 360-degree 3D explosive shatter trajectories for "DON'T LET VALUABLE CONVERSATIONS SLIP AWAY."
const SHATTER_LETTERS = [
  // DON'T
  { char: "D", x: -450, y: -250, z: 400, rx: 45, ry: -60, rz: -25, s: 2.2 },
  { char: "O", x: -320, y: -300, z: 300, rx: -50, ry: 40, rz: 35, s: 2.0 },
  { char: "N", x: -200, y: -280, z: 450, rx: 60, ry: -30, rz: -30, s: 2.4 },
  { char: "'", x: -120, y: -350, z: 500, rx: -70, ry: 50, rz: 40, s: 2.5 },
  { char: "T", x: -50, y: -260, z: 350, rx: 40, ry: -50, rz: -20, s: 2.1 },
  { char: " ", isSpace: true },
  // LET
  { char: "L", x: 50, y: -260, z: 350, rx: -40, ry: 50, rz: 20, s: 2.1 },
  { char: "E", x: 180, y: -300, z: 420, rx: 55, ry: -40, rz: -35, s: 2.3 },
  { char: "T", x: 300, y: -250, z: 320, rx: -45, ry: 60, rz: 30, s: 2.0 },
  { char: " ", isSpace: true },
  // VALUABLE
  { char: "V", x: -550, y: -80, z: 380, rx: -35, ry: -55, rz: 40, s: 2.2 },
  { char: "A", x: -420, y: -100, z: 280, rx: 45, ry: 35, rz: -25, s: 1.9 },
  { char: "L", x: -300, y: -60, z: 460, rx: -60, ry: -40, rz: 30, s: 2.4 },
  { char: "U", x: -180, y: -90, z: 340, rx: 40, ry: 45, rz: -35, s: 2.0 },
  { char: "A", x: -60, y: -70, z: 500, rx: -50, ry: -30, rz: 25, s: 2.5 },
  { char: "B", x: 60, y: -70, z: 500, rx: 50, ry: 30, rz: -25, s: 2.5 },
  { char: "L", x: 180, y: -90, z: 340, rx: -40, ry: -45, rz: 35, s: 2.0 },
  { char: "E", x: 300, y: -60, z: 460, rx: 60, ry: 40, rz: -30, s: 2.4 },
  { char: " ", isSpace: true },
  // CONVERSATIONS
  { char: "C", x: -600, y: 120, z: 350, rx: 50, ry: -45, rz: -40, s: 2.2 },
  { char: "O", x: -500, y: 160, z: 280, rx: -40, ry: 50, rz: 30, s: 1.9 },
  { char: "N", x: -400, y: 140, z: 420, rx: 65, ry: -35, rz: -25, s: 2.3 },
  { char: "V", x: -300, y: 180, z: 320, rx: -55, ry: 40, rz: 35, s: 2.0 },
  { char: "E", x: -200, y: 150, z: 480, rx: 45, ry: -50, rz: -30, s: 2.4 },
  { char: "R", x: -100, y: 200, z: 380, rx: -60, ry: 35, rz: 40, s: 2.1 },
  { char: "S", x: 0, y: 220, z: 550, rx: 70, ry: -40, rz: -20, s: 2.6 },
  { char: "A", x: 100, y: 200, z: 380, rx: -60, ry: -35, rz: -40, s: 2.1 },
  { char: "T", x: 200, y: 150, z: 480, rx: 45, ry: 50, rz: 30, s: 2.4 },
  { char: "I", x: 300, y: 180, z: 320, rx: -55, ry: -40, rz: -35, s: 2.0 },
  { char: "O", x: 400, y: 140, z: 420, rx: 65, ry: 35, rz: 25, s: 2.3 },
  { char: "N", x: 500, y: 160, z: 280, rx: -40, ry: -50, rz: -30, s: 1.9 },
  { char: "S", x: 600, y: 120, z: 350, rx: 50, ry: 45, rz: 40, s: 2.2 },
  { char: " ", isSpace: true },
  // SLIP
  { char: "S", x: -350, y: 320, z: 360, rx: -50, ry: 60, rz: 45, s: 2.1 },
  { char: "L", x: -220, y: 360, z: 440, rx: 60, ry: -45, rz: -30, s: 2.3 },
  { char: "I", x: -120, y: 340, z: 300, rx: -40, ry: 50, rz: 25, s: 1.9 },
  { char: "P", x: -20, y: 380, z: 520, rx: 70, ry: -35, rz: -40, s: 2.5 },
  { char: " ", isSpace: true },
  // AWAY.
  { char: "A", x: 80, y: 380, z: 520, rx: -70, ry: 35, rz: 40, s: 2.5 },
  { char: "W", x: 180, y: 340, z: 380, rx: 45, ry: -50, rz: -35, s: 2.1 },
  { char: "A", x: 280, y: 360, z: 460, rx: -55, ry: 45, rz: 30, s: 2.4 },
  { char: "Y", x: 380, y: 320, z: 320, rx: 60, ry: -40, rz: -25, s: 2.0 },
  { char: ".", x: 450, y: 400, z: 400, rx: -65, ry: 55, rz: 45, s: 2.2 },
];

export default function BenefitsSection() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const typographyRef = useRef(null);
  const letterRefs = useRef([]);
  const sectionHeaderRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;

      // 1. Initial State: Letters pristine and intact
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

      if (typographyRef.current) {
        gsap.set(typographyRef.current, { opacity: 1, pointerEvents: "auto" });
      }

      // 2. Initial State: Cards primed in 3D space ready for entrance
      if (cardRefs.current[0]) {
        gsap.set(cardRefs.current[0], {
          opacity: 0,
          x: isDesktop ? -140 : -40,
          y: isDesktop ? 60 : 30,
          rotateY: isDesktop ? 18 : 0,
          scale: 0.85,
          transformOrigin: "center center",
          force3D: true,
        });
      }
      if (cardRefs.current[1]) {
        gsap.set(cardRefs.current[1], {
          opacity: 0,
          x: 0,
          y: isDesktop ? 90 : 40,
          scale: 0.80,
          transformOrigin: "center center",
          force3D: true,
        });
      }
      if (cardRefs.current[2]) {
        gsap.set(cardRefs.current[2], {
          opacity: 0,
          x: isDesktop ? 140 : 40,
          y: isDesktop ? 60 : 30,
          rotateY: isDesktop ? -18 : 0,
          scale: 0.85,
          transformOrigin: "center center",
          force3D: true,
        });
      }

      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -20 });
      }

      // ============================================================
      // MASTER COORDINATED GSAP SCROLL-TRIGGER TIMELINE
      // 0.00 -> 0.04: Headline intact
      // 0.04 -> 0.32: 3D Explosive Shatter: Letters shoot out across entire screen
      // 0.20 -> 0.35: Typography wrapper fades out, persistent header emerges
      // 0.24 -> 0.55: 3 Trionn-style Key Facts cards fan out in 3D perspective
      // 0.55 -> 1.00: Steady hold for full card interaction & hover
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1300",
          pin: stage,
          pinSpacing: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // A. Explosive Letter Shatter: Letters shoot out across entire 3D space
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const cfg = SHATTER_LETTERS[idx] || { x: 0, y: 0, z: 300, rx: 0, ry: 0, rz: 0, s: 2.2 };
          tl.to(
            el,
            {
              x: cfg.x * (isDesktop ? 1.15 : 0.6),
              y: cfg.y * (isDesktop ? 1.15 : 0.6),
              z: cfg.z,
              rotateX: cfg.rx,
              rotateY: cfg.ry,
              rotateZ: cfg.rz,
              scale: cfg.s,
              opacity: 0,
              filter: "blur(14px)",
              duration: 0.28,
              ease: "power2.inOut",
            },
            0.04 + (idx % 5) * 0.012
          );
        }
      });

      // B. Typography Container Fades Out (Clean transition, zero ghosting)
      if (typographyRef.current) {
        tl.to(
          typographyRef.current,
          {
            opacity: 0,
            duration: 0.18,
            ease: "power2.out",
            pointerEvents: "none",
          },
          0.20
        );
      }

      // C. Persistent Section Header Fades In at Top (safely below navbar)
      if (sectionHeaderRef.current) {
        tl.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            ease: "power3.out",
          },
          0.22
        );
      }

      // D. Three Trionn-Style Cards 3D Entrance: Left zooms in, Center scales up, Right zooms in
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
          0.26
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
          0.30
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
          0.34
        );
      }

      // E. Hold composition steady for reading & interaction
      tl.to({}, { duration: 0.40 }, 0.60);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="relative w-full bg-[#050507] select-none text-[#F5F5F7]"
    >
      {/* PINNED STAGE VIEWPORT (Safe top padding: pt-24 sm:pt-28 so nothing is hidden under the 80px navbar) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[660px] overflow-hidden flex flex-col justify-between pt-24 sm:pt-28 pb-6 px-4 sm:px-6 lg:px-8 bg-[#050507]"
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        {/* Subtle Technical Grid Background & Ambient Lighting matching Industries */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35 z-0"
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

        {/* ========================================================================= */}
        {/* PHASE 1: FULLSCREEN 3D SHATTER TYPOGRAPHY (Explodes across entire screen) */}
        {/* ========================================================================= */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4 pt-16"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Autonomous Enterprise Advantages</span>
          </div>

          <h1
            className="font-headline font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-white uppercase text-center max-w-5xl leading-tight flex flex-wrap justify-center gap-x-2 sm:gap-x-3 select-none"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            {SHATTER_LETTERS.map((item, idx) =>
              item.isSpace ? (
                <span key={idx} className="w-2 sm:w-3" />
              ) : (
                <span
                  key={idx}
                  ref={(el) => (letterRefs.current[idx] = el)}
                  className="inline-block will-change-transform text-white drop-shadow-[0_8px_20px_rgba(255,255,255,0.2)]"
                  style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                  {item.char}
                </span>
              )
            )}
          </h1>

          <p className="mt-6 text-xs sm:text-sm text-slate-300 max-w-xl text-center font-medium leading-relaxed">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your team is unavailable.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* PERSISTENT HEADER (Safely below 80px fixed navbar, emerges smoothly)     */}
        {/* ========================================================================= */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-widest text-purple-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Autonomous Enterprise Advantages</span>
          </div>
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-white tracking-tight leading-tight">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto hidden sm:block">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your team is unavailable.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3 TRIONN-INSPIRED TALL MAJESTIC KEY FACTS CARDS                           */}
        {/* ========================================================================= */}
        <div
          className="key-card-list relative z-20 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto my-auto"
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
        >
          {/* ======================================================================= */}
          {/* CARD 01: TRIONN FEATURED / PIPELINE ACCELERATION (Cyber Emerald)         */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="featured-card group relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#032219] via-[#063325] to-[#021811] p-6 sm:p-7 flex flex-col justify-between shadow-[0_24px_55px_rgba(16,185,129,0.35)] hover:shadow-[0_30px_70px_rgba(16,185,129,0.50)] border-2 border-[#10B981] hover:border-[#34D399] overflow-hidden h-[440px] sm:h-[470px] lg:h-[490px] will-change-transform transition-all duration-300 hover:-translate-y-1.5"
          >
            {/* Emerald Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#10B981]/25 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Pill Tag & Live Status */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/25 text-[#A7F3D0] border border-[#10B981]/50 uppercase tracking-wider">
                Card 01 · Velocity
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 bg-black/50 px-2.5 py-1 rounded-full border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live 24/7 Engine
              </span>
            </div>

            {/* Card Title & Value Prop */}
            <div className="relative z-10 mt-2">
              <h3 className="font-headline font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                Pipeline Acceleration
              </h3>
              <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                Convert high-intent enterprise visitors into scheduled consultations instantly — eliminating response delays.
              </p>
            </div>

            {/* Live Interactive Inbound Consultation Mockup */}
            <div className="relative z-10 my-auto bg-black/65 backdrop-blur-md rounded-xl p-3.5 border border-emerald-500/30 space-y-2 text-[11px] shadow-inner">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold shrink-0">
                  INBOUND
                </span>
                <p className="text-slate-200 text-[11px] leading-tight">
                  &quot;Looking for custom Salesforce sync &amp; SOC-2 compliance for 40 reps.&quot;
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

            {/* Bottom Row: Stat on Right + Integration Logos on Left (Identical to Trionn) */}
            <div className="relative z-10 pt-3 border-t border-emerald-500/30 flex items-end justify-between">
              <div>
                <span className="block font-mono text-[9px] font-bold text-emerald-300/80 uppercase tracking-widest mb-1">
                  Integrations
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-100 font-bold">
                  <span>Salesforce</span>
                  <span>·</span>
                  <span>HubSpot</span>
                  <span>·</span>
                  <span>Zapier</span>
                </div>
              </div>

              {/* Big Stat Highlight */}
              <div className="text-right">
                <span className="block font-headline font-black text-4xl sm:text-5xl text-[#34D399] tracking-tight leading-none">
                  4.8x
                </span>
                <span className="block font-mono text-[9px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
                  Pipeline Velocity
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 02: TRIONN PROJECT CIRCLE / AUTONOMOUS RESOLUTION (Royal Purple)    */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="project-card group relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#180A2C] via-[#260E45] to-[#10051E] p-6 sm:p-7 flex flex-col justify-between shadow-[0_24px_55px_rgba(168,85,247,0.35)] hover:shadow-[0_30px_70px_rgba(168,85,247,0.50)] border-2 border-[#A855F7] hover:border-[#C084FC] overflow-hidden h-[440px] sm:h-[470px] lg:h-[490px] will-change-transform transition-all duration-300 hover:-translate-y-1.5"
          >
            {/* Purple Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#A855F7]/25 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Pill Tag & Zero Hallucination */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#A855F7]/25 text-[#E9D5FF] border border-[#A855F7]/50 uppercase tracking-wider">
                Card 02 · Autonomy
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-300 bg-black/50 px-2.5 py-1 rounded-full border border-purple-500/40">
                Zero Hallucination
              </span>
            </div>

            {/* Card Title & Value Prop */}
            <div className="relative z-10 mt-2">
              <h3 className="font-headline font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                Autonomous Resolution
              </h3>
              <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                Resolves complex multi-turn inquiries across pricing, compliance, and custom specs without human rep intervention.
              </p>
            </div>

            {/* Trionn Signature Circular Disc Hub */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-[#341362] to-[#140628] border-2 border-[#C084FC] shadow-[0_0_40px_rgba(168,85,247,0.55)]">
                {/* Subtle outer ping ring */}
                <div className="absolute inset-0 rounded-full border border-purple-400/40 animate-ping opacity-25 pointer-events-none" />
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

            {/* Bottom Row: 94.2% Autonomous Rate + SOC-2 Grounded */}
            <div className="relative z-10 pt-3 border-t border-purple-500/30 flex items-center justify-between">
              <span className="font-mono text-[11px] text-purple-200 font-bold uppercase tracking-wider">
                94.2% Autonomous Rate
              </span>
              <span className="font-mono text-[10px] font-bold text-[#E9D5FF] bg-purple-950/70 px-2.5 py-1 rounded-md border border-purple-500/40">
                SOC-2 Type II
              </span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 03: TRIONN TEAM / SUB-SECOND LATENCY SLA (Cyber Sapphire)           */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="team-card group relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#051A30] via-[#092748] to-[#031120] p-6 sm:p-7 flex flex-col justify-between shadow-[0_24px_55px_rgba(56,189,248,0.35)] hover:shadow-[0_30px_70px_rgba(56,189,248,0.50)] border-2 border-[#38BDF8] hover:border-[#7DD3FC] overflow-hidden h-[440px] sm:h-[470px] lg:h-[490px] will-change-transform transition-all duration-300 hover:-translate-y-1.5"
          >
            {/* Sapphire Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#38BDF8]/25 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Pill Tag & Stream SLA */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#38BDF8]/25 text-[#BAE6FD] border border-[#38BDF8]/50 uppercase tracking-wider">
                Card 03 · SLA Speed
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-300 bg-black/50 px-2.5 py-1 rounded-full border border-sky-500/40">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                Stream SLA
              </span>
            </div>

            {/* Card Title & Value Prop */}
            <div className="relative z-10 mt-2">
              <h3 className="font-headline font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                Sub-Second Intelligence
              </h3>
              <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                Enterprise-grade streaming responses with real-time sentiment scoring and automated objection handling.
              </p>
            </div>

            {/* Live Real-Time Telemetry Radar Console */}
            <div className="relative z-10 my-auto bg-black/65 backdrop-blur-md rounded-xl p-3.5 border border-sky-500/30 space-y-2 text-[11px] shadow-inner">
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

            {/* Bottom Row: Stat on Right + Isolation on Left (Identical to Trionn) */}
            <div className="relative z-10 pt-3 border-t border-sky-500/30 flex items-end justify-between">
              <div>
                <span className="block font-mono text-[9px] font-bold text-sky-300/80 uppercase tracking-widest mb-1">
                  Architecture
                </span>
                <span className="font-mono text-[10px] text-sky-100 font-bold uppercase tracking-wider">
                  Multi-Tenant Isolation
                </span>
              </div>

              {/* Big Stat Highlight */}
              <div className="text-right">
                <span className="block font-headline font-black text-4xl sm:text-5xl text-[#38BDF8] tracking-tight leading-none">
                  &lt; 1.2s
                </span>
                <span className="block font-mono text-[9px] font-bold text-sky-300 uppercase tracking-wider mt-0.5">
                  Streaming Latency
                </span>
              </div>
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
    </section>
  );
}
