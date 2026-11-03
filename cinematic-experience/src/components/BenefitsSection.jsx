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
  const darkSceneRef = useRef(null);
  const lightSceneRef = useRef(null);
  const stripeRefs = useRef([]);
  const bg3DRef = useRef(null);
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
        if (darkSceneRef.current) gsap.set(darkSceneRef.current, { opacity: 0 });
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

      // 2. Initial State: Dark Scene fully visible, Light Scene hidden behind stripes
      gsap.set(darkSceneRef.current, { opacity: 1, visibility: "visible" });
      gsap.set(lightSceneRef.current, { opacity: 0, visibility: "hidden" });

      // 3. Initial State: Cards folded up at ceiling (rotateX: -92, transformOrigin: center top)
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
      // UNIFIED PINNED SCROLL TIMELINE
      // 0.00 -> 0.45: 5 horizontal stripes expand vertically (bottom -> up)
      // 0.45 -> 0.52: Light Key facts scene reveals smoothly as stripes cover viewport
      // 0.52 -> 0.85: 3 Cards swing DOWN from ceiling (center top) right into view!
      // 0.85 -> 1.00: Cards remain perfectly stable and interactive
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=2600",
          pin: stage,
          pinSpacing: true,
          scrub: 1.0,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Subtle 3D background motion
      if (bg3DRef.current) {
        tl.to(
          bg3DRef.current,
          {
            rotationZ: 50,
            scale: 1.2,
            opacity: 0.3,
            duration: 0.45,
            ease: "none",
          },
          0
        );
      }

      // Trionn's exact stripe animation formula:
      // Bottom stripe expands first, then each higher stripe follows
      tl.addLabel("stripes_start", 0.05);
      for (let i = 0; i < STRIPES_COUNT; i++) {
        const s = (0.28 * (STRIPES_COUNT - 1 - i)) / (STRIPES_COUNT - 1);
        const a = s + 0.32;
        const el = stripeRefs.current[i];
        if (el) {
          tl.to(
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

      // Smooth transition into Light Scene as stripes finish expanding
      tl.to(
        lightSceneRef.current,
        {
          autoAlpha: 1,
          duration: 0.08,
          ease: "power1.out",
        },
        0.45
      );

      // Dark Scene fades out once covered
      tl.to(
        darkSceneRef.current,
        {
          opacity: 0,
          duration: 0.08,
          ease: "power1.out",
        },
        0.48
      );

      // 3 Cards drop DOWN from the top into the viewport (Exact Trionn flip down)
      if (isDesktop) {
        tl.to(
          cardRefs.current,
          {
            rotateX: 0,
            autoAlpha: 1,
            stagger: 0.10,
            ease: "power2.out",
            force3D: true,
            duration: 0.32,
          },
          0.52
        );
      } else {
        tl.to(
          cardRefs.current,
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.08,
            ease: "power2.out",
            duration: 0.28,
          },
          0.52
        );
      }

      // Hold final composition steady through 1.0
      tl.to({}, { duration: 0.15 }, 0.85);
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div id="benefits" ref={containerRef} className="relative w-full bg-[#050507]">
      {/* PINNED STAGE VIEWPORT (Keeps cards perfectly centered in viewport) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      >
        {/* ========================================================================= */}
        {/* LAYER 0 (BEHIND): DARK OPENING SCENE (Minimal, clean, no clutter)        */}
        {/* ========================================================================= */}
        <div
          ref={darkSceneRef}
          className="absolute inset-0 w-full h-full bg-[#050507] text-white flex flex-col justify-between py-12 px-6 sm:px-12 select-none overflow-hidden z-10"
        >
          {/* Subtle 3D Geometric Emblem */}
          <div
            ref={bg3DRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] pointer-events-none will-change-transform"
            style={{ perspective: "1000px" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#963DFF]/25 via-purple-900/10 to-[#55A9FF]/15 blur-[100px]" />
            <div
              className="absolute inset-6 rounded-full border border-white/10 border-dashed"
              style={{ transform: "rotateX(55deg) rotateY(15deg)" }}
            />
            <div
              className="absolute inset-20 rounded-full border border-[#963DFF]/30"
              style={{ transform: "rotateX(-45deg) rotateY(-20deg)" }}
            />
          </div>

          {/* Top Editorial Eyebrow (Matching Trionn) */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-20">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90">
              Focused vision. <br className="sm:hidden" />Measured execution.
            </span>
          </div>

          {/* Empty spacer keeping vertical balance */}
          <div className="w-full max-w-7xl mx-auto h-6" />
        </div>

        {/* ========================================================================= */}
        {/* LAYER 1: 5 HORIZONTAL STRIPES (Exact Trionn Math, expands vertically)     */}
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
        {/* LAYER 2: REVEALED LIGHT KEY FACTS SCENE (Vertically centered, no down gap)*/}
        {/* ========================================================================= */}
        <div
          ref={lightSceneRef}
          className="absolute inset-0 w-full h-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] text-[#0B0B10] flex flex-col justify-center py-6 sm:py-8 lg:py-10 px-4 sm:px-8 z-30 select-none overflow-hidden"
        >
          <div className="max-w-7xl mx-auto w-full my-auto flex flex-col justify-center">
            {/* Centered Title Block (Compact so cards never get pushed down) */}
            <div className="title-block flex flex-col items-center mb-4 sm:mb-6 lg:mb-8 text-center shrink-0">
              <h2 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B0B10] uppercase">
                Key facts
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#0B0B10]/75 max-w-md leading-relaxed">
                A snapshot of our experience and impact.
              </p>
            </div>

            {/* Key Card List with 3D Perspective (Flipping DOWN from the top) */}
            <div
              className="key-card-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7 items-stretch w-full"
              style={{ perspective: "1400px" }}
            >
              {/* ======================================================= */}
              {/* CARD 1 (LEFT — FEATURED & AWARDS / 24/7 AVAILABILITY)   */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[0] = el)}
                className="featured-card group relative rounded-2xl bg-black text-white p-6 sm:p-7 flex flex-col justify-between shadow-2xl overflow-hidden h-[390px] sm:h-[410px] lg:h-[430px] xl:h-[450px] will-change-transform border border-white/[0.08]"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 font-mono">
                    Featured & Awards
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live 24/7
                  </span>
                </div>

                {/* Chat / Assistant UI Mockup */}
                <div className="relative z-10 my-auto py-2.5 bg-[#141418] rounded-xl p-3 sm:p-3.5 border border-white/[0.06] space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-[9px] text-white/50 border-b border-white/[0.05] pb-1">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3 text-[#55A9FF]" />
                      Nexus Intelligence
                    </span>
                    <span className="font-mono">11:42 PM</span>
                  </div>
                  <div className="bg-white/[0.08] text-white/90 rounded-lg p-2 text-[11px] leading-snug max-w-[90%] ml-auto">
                    Can I schedule an executive consultation for tomorrow?
                  </div>
                  <div className="bg-[#963DFF]/20 border border-[#963DFF]/40 text-white rounded-lg p-2 text-[11px] leading-snug max-w-[94%]">
                    Absolutely! I&apos;ve reserved 3:00 PM tomorrow with our senior specialist.
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-3 border-t border-white/10 flex items-end justify-between gap-3">
                  <div className="max-w-[70%]">
                    <div className="font-headline font-black text-base text-white tracking-wide">
                      GSAP Verified
                    </div>
                    <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
                      Featured on top design platforms worldwide. 24/7 edge retrieval.
                    </p>
                  </div>
                  <span className="font-headline font-black text-3xl sm:text-4xl text-white tracking-tight shrink-0">
                    50<span className="text-xl text-[#C28AFF]">+</span>
                  </span>
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 2 (CENTER — PROJECTS COMPLETED / LESS MANUAL WORK) */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[1] = el)}
                className="project-card group relative rounded-2xl bg-[#ECECEC] text-[#0B0B10] p-6 sm:p-7 flex flex-col justify-between shadow-xl overflow-hidden h-[390px] sm:h-[410px] lg:h-[430px] xl:h-[450px] border border-black/5 will-change-transform"
              >
                <div className="relative z-10 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B0B10]/60 font-mono">
                    Projects Completed
                  </span>
                </div>

                {/* Central White Circular Disc with 1.5K+ */}
                <div className="relative z-10 my-auto py-1 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] flex items-center justify-center border border-black/[0.04]">
                    <span className="font-headline font-black text-4xl sm:text-5xl text-[#0B0B10] tracking-tight">
                      1.5K<span className="text-2xl text-[#963DFF]">+</span>
                    </span>
                  </div>
                  <div className="mt-2.5 px-3 py-0.5 rounded-full bg-black/5 text-[10px] font-bold text-[#0B0B10]/80">
                    Less Manual Work
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="relative z-10 pt-3 border-t border-black/10 text-center">
                  <p className="text-[11px] sm:text-xs text-[#0B0B10]/80 font-medium leading-snug max-w-xs mx-auto">
                    90% of our clients seek our services for a second project. Automated query resolution.
                  </p>
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 3 (RIGHT — OUR TEAM MEMBERS / ENQUIRY VISIBILITY)  */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[2] = el)}
                className="team-card group relative rounded-2xl bg-[#222429] text-white p-6 sm:p-7 flex flex-col justify-between shadow-2xl overflow-hidden h-[390px] sm:h-[410px] lg:h-[430px] xl:h-[450px] will-change-transform border border-white/[0.08]"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 font-mono">
                    Our Team Members
                  </span>
                  <span className="text-[10px] font-mono text-[#55A9FF]">
                    CRM Pipeline
                  </span>
                </div>

                {/* Business Dashboard Visual */}
                <div className="relative z-10 my-auto py-2.5 bg-[#18191E] rounded-xl p-3 sm:p-3.5 border border-white/[0.06] space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[9px] text-white/50 border-b border-white/[0.05] pb-1">
                    <span className="font-semibold text-white/90">Lead Visibility Overview</span>
                    <span className="text-emerald-400">98% Intent</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-2 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[11px] font-bold text-white">Commercial Rollout</div>
                      <div className="text-[9px] text-white/60">Enterprise Tier</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                      Hot Lead
                    </span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-2 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[11px] font-bold text-white">Elena Rostova</div>
                      <div className="text-[9px] text-white/60">Consultation Scheduled</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#963DFF]/25 text-[#C28AFF] text-[9px] font-bold uppercase">
                      Qualified
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-3 border-t border-white/10 flex items-end justify-between gap-3">
                  <div className="max-w-[70%]">
                    <div className="font-headline font-bold text-xs sm:text-sm text-white/90">
                      Different skills. One standard.
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                      See customer conversations and generated enquiries.
                    </p>
                  </div>
                  <span className="font-headline font-black text-3xl sm:text-4xl text-white tracking-tight shrink-0">
                    20<span className="text-xl text-[#55A9FF]">+</span>
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
