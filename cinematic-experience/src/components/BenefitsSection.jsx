import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STRIPES_COUNT = 5;

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const lightSceneRef = useRef(null);
  const stripeRefs = useRef([]);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 768;

      if (prefersReducedMotion) {
        stripeRefs.current.forEach((el) => {
          if (el) gsap.set(el, { scaleY: 1 });
        });
        if (lightSceneRef.current) gsap.set(lightSceneRef.current, { opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { rotateX: 0, autoAlpha: 1 });
        });
        return;
      }

      // 1. Initial State: Stripes start at scaleY(0) with transformOrigin: bottom
      stripeRefs.current.forEach((stripe) => {
        if (stripe) {
          gsap.set(stripe, {
            scaleY: 0,
            transformOrigin: "bottom",
            willChange: "transform",
          });
        }
      });

      // 2. Initial State: Light scene ready, cards folded up at ceiling
      gsap.set(lightSceneRef.current, { opacity: 1 });
      cardRefs.current.forEach((card) => {
        if (card) {
          gsap.set(card, {
            autoAlpha: 0,
            rotateX: isDesktop ? -92 : 0,
            y: isDesktop ? 0 : 35,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      // ============================================================
      // DIRECT STRIPES + CARD DROP TIMELINE (Zero Blank Page Waiting)
      // 0.00 -> 0.35: 5 horizontal stripes expand vertically (bottom -> up)
      // 0.35 -> 0.75: 3 Cards swing DOWN from ceiling (center top) into view!
      // 0.75 -> 1.00: Cards remain stable and interactive
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1300",
          pin: stage,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Trionn's stripe animation formula:
      for (let i = 0; i < STRIPES_COUNT; i++) {
        const s = (0.22 * (STRIPES_COUNT - 1 - i)) / (STRIPES_COUNT - 1);
        const a = s + 0.24;
        const el = stripeRefs.current[i];
        if (el) {
          tl.to(
            el,
            {
              scaleY: 1,
              duration: a - s,
              ease: "none",
            },
            s
          );
        }
      }

      // 3 Cards drop DOWN from ceiling right into comfortable view
      if (isDesktop) {
        tl.to(
          cardRefs.current,
          {
            rotateX: 0,
            autoAlpha: 1,
            stagger: 0.08,
            ease: "power2.out",
            force3D: true,
            duration: 0.35,
          },
          0.32
        );
      } else {
        tl.to(
          cardRefs.current,
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.06,
            ease: "power2.out",
            duration: 0.30,
          },
          0.32
        );
      }

      // Settle and hold steady through end of scroll
      tl.to({}, { duration: 0.15 }, 0.80);
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div id="benefits" ref={containerRef} className="relative w-full bg-[#050507]">
      {/* PINNED STAGE VIEWPORT (Centered, perfectly framed below navbar) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#050507]"
      >
        {/* ========================================================================= */}
        {/* 5 HORIZONTAL STRIPES (Exact Trionn Math, expands vertically)              */}
        {/* ========================================================================= */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-20">
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

        {/* ========================================================================= */}
        {/* REVEALED LIGHT SCENE (With User Requested Title & Reduced Card Size)       */}
        {/* ========================================================================= */}
        <div
          ref={lightSceneRef}
          className="absolute inset-0 w-full h-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] text-[#0B0B10] flex flex-col justify-between pt-24 pb-8 sm:pt-28 sm:pb-10 px-4 sm:px-8 z-10 select-none overflow-hidden"
        >
          <div className="max-w-7xl mx-auto w-full my-auto flex flex-col justify-center">
            {/* Title Block with Exact User Requested Title */}
            <div className="title-block flex flex-col items-center mb-5 sm:mb-7 text-center shrink-0 px-4">
              <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-[#0B0B10] uppercase max-w-4xl mx-auto leading-tight">
                Don&apos;t Let Valuable Conversations Slip Away.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#0B0B10]/75 max-w-xl mx-auto leading-relaxed">
                Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
              </p>
            </div>

            {/* Reduced Size 3-Card Grid (Comfortably fits screen without touching taskbar) */}
            <div
              className="key-card-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto"
              style={{ perspective: "1400px" }}
            >
              {/* ======================================================= */}
              {/* CARD 1 (LEFT — FEATURED & AWARDS / 24/7 AVAILABILITY)   */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[0] = el)}
                className="featured-card group relative rounded-2xl bg-black text-white p-5 sm:p-6 flex flex-col justify-between shadow-2xl overflow-hidden h-[330px] sm:h-[350px] lg:h-[365px] xl:h-[380px] will-change-transform border border-white/[0.08]"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/60 font-mono">
                    Featured & Awards
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live 24/7
                  </span>
                </div>

                {/* Compact Chat / Assistant UI Mockup */}
                <div className="relative z-10 my-auto py-2 bg-[#141418] rounded-xl p-3 border border-white/[0.06] space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[9px] text-white/50 border-b border-white/[0.05] pb-1">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3 text-[#55A9FF]" />
                      Nexus Intelligence
                    </span>
                    <span className="font-mono">11:42 PM</span>
                  </div>
                  <div className="bg-white/[0.08] text-white/90 rounded-lg p-2 text-[10px] sm:text-[11px] leading-snug max-w-[92%] ml-auto">
                    Can I schedule an executive consultation for tomorrow?
                  </div>
                  <div className="bg-[#963DFF]/20 border border-[#963DFF]/40 text-white rounded-lg p-2 text-[10px] sm:text-[11px] leading-snug max-w-[95%]">
                    Absolutely! I&apos;ve reserved 3:00 PM tomorrow with our senior specialist.
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-2.5 border-t border-white/10 flex items-end justify-between gap-3">
                  <div className="max-w-[70%]">
                    <div className="font-headline font-black text-sm sm:text-base text-white tracking-wide">
                      GSAP Verified
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-white/70 mt-0.5 leading-snug">
                      Featured on top design platforms worldwide. 24/7 edge retrieval.
                    </p>
                  </div>
                  <span className="font-headline font-black text-2xl sm:text-3xl text-white tracking-tight shrink-0">
                    50<span className="text-lg text-[#C28AFF]">+</span>
                  </span>
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 2 (CENTER — PROJECTS COMPLETED / LESS MANUAL WORK) */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[1] = el)}
                className="project-card group relative rounded-2xl bg-[#ECECEC] text-[#0B0B10] p-5 sm:p-6 flex flex-col justify-between shadow-xl overflow-hidden h-[330px] sm:h-[350px] lg:h-[365px] xl:h-[380px] border border-black/5 will-change-transform"
              >
                <div className="relative z-10 text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#0B0B10]/60 font-mono">
                    Projects Completed
                  </span>
                </div>

                {/* Compact White Circular Disc with 1.5K+ */}
                <div className="relative z-10 my-auto py-1 flex flex-col items-center justify-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] flex items-center justify-center border border-black/[0.04]">
                    <span className="font-headline font-black text-3xl sm:text-4xl text-[#0B0B10] tracking-tight">
                      1.5K<span className="text-xl text-[#963DFF]">+</span>
                    </span>
                  </div>
                  <div className="mt-2 px-2.5 py-0.5 rounded-full bg-black/5 text-[9px] sm:text-[10px] font-bold text-[#0B0B10]/80">
                    Less Manual Work
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="relative z-10 pt-2.5 border-t border-black/10 text-center">
                  <p className="text-[10px] sm:text-[11px] text-[#0B0B10]/80 font-medium leading-snug max-w-xs mx-auto">
                    90% of our clients seek our services for a second project. Automated query resolution.
                  </p>
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 3 (RIGHT — OUR TEAM MEMBERS / ENQUIRY VISIBILITY)  */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[2] = el)}
                className="team-card group relative rounded-2xl bg-[#222429] text-white p-5 sm:p-6 flex flex-col justify-between shadow-2xl overflow-hidden h-[330px] sm:h-[350px] lg:h-[365px] xl:h-[380px] will-change-transform border border-white/[0.08]"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/60 font-mono">
                    Our Team Members
                  </span>
                  <span className="text-[10px] font-mono text-[#55A9FF]">
                    CRM Pipeline
                  </span>
                </div>

                {/* Compact Business Dashboard Visual */}
                <div className="relative z-10 my-auto py-2 bg-[#18191E] rounded-xl p-3 border border-white/[0.06] space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[9px] text-white/50 border-b border-white/[0.05] pb-1">
                    <span className="font-semibold text-white/90">Lead Visibility Overview</span>
                    <span className="text-emerald-400">98% Intent</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-1.5 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-white">Commercial Rollout</div>
                      <div className="text-[8px] sm:text-[9px] text-white/60">Enterprise Tier</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] sm:text-[9px] font-bold uppercase">
                      Hot Lead
                    </span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-1.5 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-white">Elena Rostova</div>
                      <div className="text-[8px] sm:text-[9px] text-white/60">Consultation Scheduled</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#963DFF]/25 text-[#C28AFF] text-[8px] sm:text-[9px] font-bold uppercase">
                      Qualified
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-2.5 border-t border-white/10 flex items-end justify-between gap-3">
                  <div className="max-w-[70%]">
                    <div className="font-headline font-bold text-xs sm:text-sm text-white/90">
                      Different skills. One standard.
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-white/60 mt-0.5 leading-snug">
                      See customer conversations and generated enquiries.
                    </p>
                  </div>
                  <span className="font-headline font-black text-2xl sm:text-3xl text-white tracking-tight shrink-0">
                    20<span className="text-lg text-[#55A9FF]">+</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
