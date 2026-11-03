import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck,
  Check,
  Sparkles,
  TrendingUp,
  Zap,
  Bot,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Trionn's signature cross separator
function TrionnCross() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-6 sm:mx-10 lg:mx-14 w-6 sm:w-8 h-6 sm:h-8 inline-block opacity-60"
    >
      <line x1="20" y1="0" x2="20" y2="40" stroke="currentColor" strokeWidth="2.5" />
      <line x1="40" y1="20" x2="0" y2="20" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

const STRIPES_COUNT = 5;

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const visionSectionRef = useRef(null);
  const stripeRefs = useRef([]);
  const marqueeTrackRef = useRef(null);
  const bg3DRef = useRef(null);

  // Key facts section and cards
  const keyfactsRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const visionSec = visionSectionRef.current;
    const keyfactsSec = keyfactsRef.current;
    if (!container || !visionSec || !keyfactsSec) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 768;

      if (prefersReducedMotion) {
        stripeRefs.current.forEach((el) => {
          if (el) gsap.set(el, { scaleY: 1 });
        });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { rotateX: 0, autoAlpha: 1 });
        });
        return;
      }

      // 1. Continuous Marquee Velocity
      if (marqueeTrackRef.current) {
        gsap.to(marqueeTrackRef.current, {
          xPercent: -50,
          repeat: -1,
          duration: 22,
          ease: "none",
        });
      }

      // 2. Initial Setup: Stripe Items start at scaleY(0) with transformOrigin: bottom
      stripeRefs.current.forEach((stripe) => {
        if (stripe) {
          gsap.set(stripe, {
            scaleY: 0,
            transformOrigin: "bottom",
            willChange: "transform",
          });
        }
      });

      // 3. Initial Setup: Cards start folded up against ceiling (rotateX: -92, transformOrigin: center top)
      cardRefs.current.forEach((card) => {
        if (card) {
          gsap.set(card, {
            autoAlpha: 0,
            rotateX: isDesktop ? -92 : 0,
            y: isDesktop ? 0 : 40,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      // ============================================================
      // PHASE 1: PINNED VISION STRIPES TIMELINE (Exact Trionn Math)
      // ============================================================
      const visionTl = gsap.timeline({
        scrollTrigger: {
          trigger: visionSec,
          start: "top top",
          end: "+=180%",
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });

      // 3D background element reacts subtly to scroll
      if (bg3DRef.current) {
        visionTl.to(
          bg3DRef.current,
          {
            rotationZ: 45,
            scale: 1.15,
            opacity: 0.4,
            duration: 0.6,
          },
          0
        );
      }

      // Trionn's exact stripe animation formula:
      // Strip items expand from bottom upward, creating the horizontal banding effect
      visionTl.addLabel("stripes_start", 0.1);
      for (let i = 0; i < STRIPES_COUNT; i++) {
        const s = (0.3 * (STRIPES_COUNT - 1 - i)) / (STRIPES_COUNT - 1);
        const a = s + 0.35;
        const el = stripeRefs.current[i];
        if (el) {
          visionTl.to(
            el,
            {
              scaleY: 1,
              duration: a - s,
              ease: "none",
            },
            `stripes_start+=${s}`
          );
        }
      }

      // Slight hold at the end of stripes before scrolling into key facts
      visionTl.to({}, { duration: 0.1 });

      // ============================================================
      // PHASE 2: KEY FACTS 3-CARDS FLIP DOWN FROM UP (Exact Trionn Math)
      // Cards start at rotateX: -92deg (folded at top) and swing DOWN into place!
      // ============================================================
      const cardsTl = gsap.timeline({
        scrollTrigger: {
          trigger: keyfactsSec,
          start: isDesktop ? "top 70%" : "top 80%",
          end: isDesktop ? "top 10%" : "top 20%",
          scrub: 1.4,
          invalidateOnRefresh: true,
        },
      });

      if (isDesktop) {
        cardsTl.to(cardRefs.current, {
          rotateX: 0,
          autoAlpha: 1,
          stagger: {
            each: 0.35,
            from: "start",
          },
          ease: "power2.out",
          force3D: true,
          duration: 2.2,
        });
      } else {
        cardsTl.to(cardRefs.current, {
          y: 0,
          autoAlpha: 1,
          stagger: 0.25,
          ease: "power2.out",
          duration: 1.5,
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div id="benefits" ref={containerRef} className="relative w-full bg-[#050507]">
      {/* ========================================================================= */}
      {/* 1. VISION SECTION (Dark hero + 3D emblem + mix-blend marquee + 5 stripes)  */}
      {/* ========================================================================= */}
      <section
        ref={visionSectionRef}
        id="vision-section"
        className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#050507]"
      >
        {/* Subtle 3D Geometric Emblem in Background */}
        <div
          ref={bg3DRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[520px] sm:h-[520px] pointer-events-none z-10 will-change-transform"
          style={{ perspective: "1000px" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#963DFF]/20 via-purple-900/10 to-[#55A9FF]/15 blur-[100px]" />
          <div
            className="absolute inset-6 rounded-full border border-white/10 border-dashed"
            style={{ transform: "rotateX(55deg) rotateY(15deg)" }}
          />
          <div
            className="absolute inset-20 rounded-full border border-[#963DFF]/30"
            style={{ transform: "rotateX(-45deg) rotateY(-20deg)" }}
          />
        </div>

        {/* Text Content Layer with mix-blend-difference (Slices dynamically over stripes!) */}
        <div
          className="relative z-40 w-full h-full flex flex-col justify-between py-12 sm:py-16 px-6 sm:px-12 text-white mix-blend-difference pointer-events-none select-none"
        >
          {/* Top Editorial Eyebrow (Matching Trionn) */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest">
              Focused vision. <br className="sm:hidden" />Measured execution.
            </span>
          </div>

          {/* Central Oversized Marquee Typography (INNOVATE ✦ IMPACT ✦ INSPIRE) */}
          <div className="relative overflow-hidden w-full my-auto py-8">
            <div
              ref={marqueeTrackRef}
              className="flex whitespace-nowrap will-change-transform items-center"
              style={{ width: "fit-content" }}
            >
              {[1, 2].map((loopIdx) => (
                <div
                  key={loopIdx}
                  className="flex items-center font-headline font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter uppercase shrink-0"
                >
                  <span className="px-2">INNOVATE</span>
                  <TrionnCross />
                  <span className="px-2">IMPACT</span>
                  <TrionnCross />
                  <span className="px-2">INSPIRE</span>
                  <TrionnCross />
                  <span className="px-2">CONVERT</span>
                  <TrionnCross />
                </div>
              ))}
            </div>
          </div>

          {/* Empty spacer to keep central marquee perfectly balanced */}
          <div className="w-full max-w-7xl mx-auto h-6" />
        </div>

        {/* 5 HORIZONTAL STRIPES (Exact Trionn Architecture) */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-30">
          {Array.from({ length: STRIPES_COUNT }).map((_, idx) => (
            <div
              key={idx}
              ref={(el) => (stripeRefs.current[idx] = el)}
              className="stripe-item flex-1 w-full h-full"
              style={{
                backgroundColor: "#D2D2D2",
                willChange: "transform",
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                marginTop: idx > 0 ? "-1px" : undefined,
                paddingBottom: "1px",
              }}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. KEY FACTS SECTION (Exact Trionn Layout & 3-Card Drop Down Animation)   */}
      {/* ========================================================================= */}
      <section
        ref={keyfactsRef}
        id="keyfacts-section"
        className="relative z-20 w-full min-h-screen py-20 lg:py-32 px-4 sm:px-8 bg-[linear-gradient(180deg,#D2D2D2_0%,#E4E4E8_40%,#ECECEF_100%)] text-[#0B0B10] overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Centered Title Block (Exact Trionn Hierarchy) */}
          <div className="title-block flex flex-col items-center mb-12 lg:mb-20 text-center">
            <h2 className="font-headline text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0B0B10] uppercase">
              Key facts
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#0B0B10]/75 max-w-lg leading-relaxed">
              A snapshot of our experience and impact.
            </p>
          </div>

          {/* Key Card List with 3D Perspective (Exact Trionn 3-Card Structure) */}
          <div
            className="key-card-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full"
            style={{ perspective: "1400px" }}
          >
            {/* ======================================================= */}
            {/* CARD 1 (LEFT — FEATURED & AWARDS / 24/7 AVAILABILITY)   */}
            {/* ======================================================= */}
            <div
              ref={(el) => (cardRefs.current[0] = el)}
              className="featured-card group relative rounded-2xl bg-black text-white p-7 lg:p-9 flex flex-col justify-between shadow-2xl overflow-hidden min-h-[460px] lg:h-[500px] will-change-transform"
            >
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Featured & Awards
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live 24/7
                </span>
              </div>

              {/* Chat / Assistant UI Mockup */}
              <div className="relative z-10 my-auto py-3 bg-[#121216] rounded-xl p-4 border border-white/[0.08] space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-white/50 border-b border-white/[0.06] pb-1.5">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3 text-[#55A9FF]" />
                    Nexus Intelligence
                  </span>
                  <span className="font-mono text-[9px]">11:42 PM</span>
                </div>
                <div className="bg-white/[0.08] text-white/90 rounded-lg p-2.5 text-xs leading-snug max-w-[90%] ml-auto">
                  Can I schedule an executive consultation for tomorrow?
                </div>
                <div className="bg-[#963DFF]/20 border border-[#963DFF]/40 text-white rounded-lg p-2.5 text-xs leading-snug max-w-[94%]">
                  Absolutely! I&apos;ve reserved 3:00 PM tomorrow with our senior specialist.
                </div>
              </div>

              {/* Bottom Row (GSAP + Description + Huge 50+ / 24/7 Number) */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-end justify-between gap-4">
                <div className="max-w-[70%]">
                  <div className="font-headline font-black text-lg text-white tracking-wide">
                    GSAP Verified
                  </div>
                  <p className="text-xs text-white/70 mt-1 leading-snug">
                    Featured on top design platforms worldwide. 24/7 continuous edge retrieval.
                  </p>
                </div>
                <span className="font-headline font-black text-4xl sm:text-5xl text-white tracking-tight shrink-0">
                  50<span className="text-2xl text-[#C28AFF]">+</span>
                </span>
              </div>
            </div>

            {/* ======================================================= */}
            {/* CARD 2 (CENTER — PROJECTS COMPLETED / LESS MANUAL WORK) */}
            {/* ======================================================= */}
            <div
              ref={(el) => (cardRefs.current[1] = el)}
              className="project-card group relative rounded-2xl bg-[#ECECEC] text-[#0B0B10] p-7 lg:p-9 flex flex-col justify-between shadow-xl overflow-hidden min-h-[460px] lg:h-[500px] border border-black/5 will-change-transform"
            >
              <div className="relative z-10 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B0B10]/60">
                  Projects Completed
                </span>
              </div>

              {/* Central White Circular Disc with 1.5K+ (Exact Trionn Iconography) */}
              <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex items-center justify-center border border-black/[0.04]">
                  <span className="font-headline font-black text-5xl sm:text-6xl text-[#0B0B10] tracking-tight">
                    1.5K<span className="text-3xl text-[#963DFF]">+</span>
                  </span>
                </div>
                <div className="mt-3 px-3 py-1 rounded-full bg-black/5 text-[11px] font-bold text-[#0B0B10]/80">
                  Less Manual Work
                </div>
              </div>

              {/* Bottom Copy (Exact Trionn Proportion) */}
              <div className="relative z-10 pt-4 border-t border-black/10 text-center">
                <p className="text-xs sm:text-sm text-[#0B0B10]/80 font-medium leading-relaxed max-w-xs mx-auto">
                  90% of our clients seek our services for a second project. Automated query resolution.
                </p>
              </div>
            </div>

            {/* ======================================================= */}
            {/* CARD 3 (RIGHT — OUR TEAM MEMBERS / ENQUIRY VISIBILITY)  */}
            {/* ======================================================= */}
            <div
              ref={(el) => (cardRefs.current[2] = el)}
              className="team-card group relative rounded-2xl bg-[#23252A] text-white p-7 lg:p-9 flex flex-col justify-between shadow-2xl overflow-hidden min-h-[460px] lg:h-[500px] will-change-transform"
            >
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Our Team Members
                </span>
                <span className="text-[10px] font-mono text-[#55A9FF]">
                  CRM Pipeline
                </span>
              </div>

              {/* Business Dashboard Visual */}
              <div className="relative z-10 my-auto py-3 bg-[#18191E] rounded-xl p-4 border border-white/[0.06] space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-white/50 border-b border-white/[0.06] pb-1.5">
                  <span className="font-semibold text-white/90">Lead Visibility Overview</span>
                  <span className="text-emerald-400">98% Intent</span>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-2 flex items-center justify-between border border-white/[0.04]">
                  <div>
                    <div className="text-xs font-bold text-white">Commercial Rollout</div>
                    <div className="text-[10px] text-white/60">Enterprise Tier</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                    Hot Lead
                  </span>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-2 flex items-center justify-between border border-white/[0.04]">
                  <div>
                    <div className="text-xs font-bold text-white">Elena Rostova</div>
                    <div className="text-[10px] text-white/60">Consultation Scheduled</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#963DFF]/25 text-[#C28AFF] text-[9px] font-bold uppercase">
                    Qualified
                  </span>
                </div>
              </div>

              {/* Bottom Row (Different skills + Huge 20+ Number) */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-end justify-between gap-4">
                <div className="max-w-[70%]">
                  <div className="font-headline font-bold text-sm text-white/90">
                    Different skills. One standard.
                  </div>
                  <p className="text-xs text-white/60 mt-0.5 leading-snug">
                    See customer conversations and the enquiries generated through your assistant.
                  </p>
                </div>
                <span className="font-headline font-black text-4xl sm:text-5xl text-white tracking-tight shrink-0">
                  20<span className="text-2xl text-[#55A9FF]">+</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
