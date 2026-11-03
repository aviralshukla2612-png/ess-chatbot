import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STRIPES_COUNT = 5;

// Headline split for 3D character shatter transition
const SHATTER_LETTERS = [
  { char: "D", x: -260, y: -180, rx: 45, ry: -50, rz: -30, s: 2.0 },
  { char: "O", x: -180, y: -240, rx: -40, ry: 40, rz: 45, s: 1.8 },
  { char: "N", x: -100, y: 200, rx: 60, ry: -30, rz: -35, s: 2.1 },
  { char: "'", x: -40, y: -260, rx: -50, ry: 60, rz: 20, s: 1.6 },
  { char: "T", x: 20, y: 220, rx: 50, ry: -40, rz: -25, s: 1.9 },
  { char: " ", isSpace: true },
  { char: "L", x: 80, y: -200, rx: -35, ry: 45, rz: 30, s: 1.8 },
  { char: "E", x: 160, y: 190, rx: 55, ry: -50, rz: -20, s: 2.0 },
  { char: "T", x: 240, y: -220, rx: -45, ry: 50, rz: 35, s: 1.9 },
  { char: " ", isSpace: true },
  { char: "S", x: -220, y: 240, rx: 40, ry: -60, rz: -45, s: 2.2 },
  { char: "L", x: -120, y: -190, rx: -55, ry: 35, rz: 50, s: 1.8 },
  { char: "I", x: 140, y: 230, rx: 60, ry: -45, rz: -30, s: 1.7 },
  { char: "P", x: 280, y: -180, rx: -65, ry: 55, rz: 40, s: 2.1 },
];

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const darkHeroRef = useRef(null);
  const letterRefs = useRef([]);
  const stripeRefs = useRef([]);
  const cardRefs = useRef([]);
  const lightSceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 768;

      if (prefersReducedMotion) {
        if (darkHeroRef.current) gsap.set(darkHeroRef.current, { display: "none" });
        stripeRefs.current.forEach((el) => el && gsap.set(el, { scaleY: 1 }));
        if (lightSceneRef.current) gsap.set(lightSceneRef.current, { opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, y: 0, rotateX: 0 });
        });
        return;
      }

      // 1. Initial State: Dark hero typography visible
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

      // 2. Initial State: Stripes start at scaleY(0) with bottom origin
      stripeRefs.current.forEach((stripe) => {
        if (stripe) {
          gsap.set(stripe, {
            scaleY: 0,
            transformOrigin: "bottom",
            willChange: "transform",
          });
        }
      });

      // 3. Initial State: Light scene & cards prepared in 3D ceiling drop position
      if (lightSceneRef.current) {
        gsap.set(lightSceneRef.current, { opacity: 0 });
      }

      cardRefs.current.forEach((card) => {
        if (card) {
          gsap.set(card, {
            opacity: 0,
            y: isDesktop ? -70 : 35,
            rotateX: isDesktop ? -28 : 0,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      // ============================================================
      // COORDINATED SHATTER + STRIPES + CARD DROP TIMELINE
      // 0.00 -> 0.15: Dark Hero with big typography
      // 0.12 -> 0.42: Letters shatter in 3D + 5 Stripes expand bottom-to-top
      // 0.32 -> 0.65: Light scene appears & 3 colorful cards drop down
      // 0.65 -> 1.00: Cards remain settled, rock-solid & interactive
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1200",
          pin: stage,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // A. Dark Hero Letters Shatter in 3D
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const cfg = SHATTER_LETTERS[idx] || { x: 0, y: 0, rx: 0, ry: 0, rz: 0, s: 2 };
          tl.to(
            el,
            {
              x: cfg.x * (isDesktop ? 1.3 : 0.7),
              y: cfg.y * (isDesktop ? 1.3 : 0.7),
              rotateX: cfg.rx,
              rotateY: cfg.ry,
              rotateZ: cfg.rz,
              scale: cfg.s,
              opacity: 0,
              filter: "blur(12px)",
              duration: 0.28,
              ease: "power2.inOut",
            },
            0.10 + (idx % 4) * 0.02
          );
        }
      });

      // B. 5 Horizontal Stripes Expand Vertically (Trionn math)
      for (let i = 0; i < STRIPES_COUNT; i++) {
        const s = 0.12 + (0.18 * (STRIPES_COUNT - 1 - i)) / (STRIPES_COUNT - 1);
        const a = s + 0.22;
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

      // C. Fade out dark hero container completely
      if (darkHeroRef.current) {
        tl.to(
          darkHeroRef.current,
          {
            opacity: 0,
            duration: 0.20,
            ease: "power1.out",
          },
          0.30
        );
      }

      // D. Reveal Light Scene with deep black typography
      if (lightSceneRef.current) {
        tl.to(
          lightSceneRef.current,
          {
            opacity: 1,
            duration: 0.22,
            ease: "power2.out",
          },
          0.32
        );
      }

      // E. 3 Colorful Cards Drop DOWN from Top
      if (isDesktop) {
        tl.to(
          cardRefs.current,
          {
            rotateX: 0,
            y: 0,
            opacity: 1,
            stagger: 0.08,
            ease: "power3.out",
            force3D: true,
            duration: 0.32,
          },
          0.34
        );
      } else {
        tl.to(
          cardRefs.current,
          {
            y: 0,
            opacity: 1,
            stagger: 0.06,
            ease: "power2.out",
            duration: 0.28,
          },
          0.34
        );
      }

      // F. Settle and hold steady for rest of scroll
      tl.to({}, { duration: 0.35 }, 0.65);
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div id="benefits" ref={containerRef} className="relative w-full bg-[#050507]">
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#050507]"
        style={{ perspective: "1400px" }}
      >
        {/* ========================================================================= */}
        {/* PHASE 1: DARK HERO SHATTER TYPOGRAPHY (LAYER 30 - Breaks apart in 3D)     */}
        {/* ========================================================================= */}
        <div
          ref={darkHeroRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4 bg-[#050507]"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>Autonomous Enterprise Advantages</span>
          </div>

          <h2
            className="font-headline font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white uppercase text-center max-w-5xl leading-tight flex flex-wrap justify-center gap-x-3 sm:gap-x-4"
            style={{ perspective: "1000px" }}
          >
            {SHATTER_LETTERS.map((item, idx) => (
              <span
                key={idx}
                ref={(el) => (letterRefs.current[idx] = el)}
                className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-white via-[#EDEDF2] to-[#9898A6] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
              >
                {item.char}
              </span>
            ))}
          </h2>

          <p className="mt-6 text-xs sm:text-sm text-[#9898A6] max-w-xl text-center font-mono uppercase tracking-wider">
            Scroll to break transition and reveal capabilities ↓
          </p>
        </div>

        {/* ========================================================================= */}
        {/* PHASE 2: 5 HORIZONTAL STRIPES (LAYER 10 - Expands vertically to reveal)   */}
        {/* ========================================================================= */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-10">
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
        {/* PHASE 3: REVEALED LIGHT SCENE (LAYER 20 - HIGH CONTRAST, DEEP TEXT)       */}
        {/* ========================================================================= */}
        <div
          ref={lightSceneRef}
          className="absolute inset-0 w-full h-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] flex flex-col justify-between pt-20 pb-6 sm:pt-24 sm:pb-8 px-4 sm:px-8 z-20 select-none overflow-hidden"
        >
          <div className="max-w-7xl mx-auto w-full my-auto flex flex-col justify-center">
            {/* Title Block with High Contrast Dark Typography */}
            <div className="title-block flex flex-col items-center mb-6 sm:mb-8 text-center shrink-0 px-4">
              <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-black tracking-tight text-[#0B0B10] uppercase max-w-4xl mx-auto leading-tight drop-shadow-sm">
                Don&apos;t Let Valuable Conversations Slip Away.
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-[#1F2937] font-semibold max-w-xl mx-auto leading-relaxed">
                Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
              </p>
            </div>

            {/* COLORFUL 3-CARD COMPOSITION */}
            <div
              className="key-card-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto"
              style={{ perspective: "1400px" }}
            >
              {/* ======================================================= */}
              {/* CARD 01 · DARK (EMERALD CYBERNETIC NEON GLOW)           */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[0] = el)}
                className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#071F17] via-[#091512] to-[#050B08] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_40px_rgba(16,185,129,0.22)] border-2 border-emerald-500/40 hover:border-emerald-400 overflow-hidden h-[335px] sm:h-[350px] lg:h-[365px] will-change-transform transition-all duration-300"
              >
                {/* Ambient Emerald Orb */}
                <div className="absolute -top-16 -left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Card 01 · Dark
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live 24/7
                    </span>
                  </div>

                  {/* Heading & Subtitle */}
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-2.5 uppercase">
                    24/7 AI ASSISTANCE
                  </h3>
                  <p className="text-xs text-[#D1D5DB] mt-1.5 leading-relaxed font-normal">
                    Let customers get answers to their questions anytime, even outside business hours.
                  </p>
                </div>

                {/* Compact Interactive Chat Preview */}
                <div className="relative z-10 my-auto py-1.5 bg-[#03110C]/80 rounded-xl p-2.5 border border-emerald-500/20 space-y-1 shadow-inner">
                  <div className="bg-white/[0.08] text-white/90 rounded-lg p-1.5 text-[10px] leading-snug max-w-[92%] ml-auto">
                    Can I schedule an executive consultation for tomorrow?
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/30 text-white rounded-lg p-1.5 text-[10px] leading-snug max-w-[95%]">
                    Absolutely! Reserved 3:00 PM tomorrow with our senior specialist.
                  </div>
                </div>

                {/* Bottom Label */}
                <div className="relative z-10 pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                    ALWAYS AVAILABLE
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 02 · LIGHT (LUMINOUS ROYAL PURPLE / ULTRA CONTRAST) */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[1] = el)}
                className="project-card group relative rounded-2xl bg-gradient-to-br from-[#F5EEFF] via-[#EDE0FF] to-[#E5D4FF] text-[#150524] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(150,61,255,0.28)] border-2 border-[#963DFF]/70 hover:border-[#7C3AED] overflow-hidden h-[335px] sm:h-[350px] lg:h-[365px] will-change-transform transition-all duration-300"
              >
                {/* Ambient Lilac Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#963DFF]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center">
                  {/* Top Pill Tag with Rich High Contrast */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED] text-white border border-[#6D28D9] shadow-sm">
                      Card 02 · Light
                    </span>
                    <span className="text-[11px] font-bold text-[#6D28D9]">
                      AI Assistant
                    </span>
                  </div>

                  {/* Heading & Subtitle - DEEP SOLID CONTRAST (NOT WHITE!) */}
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-[#150524] tracking-tight mt-2.5 uppercase drop-shadow-sm">
                    LESS MANUAL WORK
                  </h3>
                  <p className="text-xs text-[#3B1261] font-semibold mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Reduce repetitive customer interactions and give your team more time for important work.
                  </p>
                </div>

                {/* Central Luminous Circular Disc */}
                <div className="relative z-10 my-auto py-1 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-[0_12px_28px_rgba(124,58,237,0.25)] flex items-center justify-center border-2 border-[#7C3AED]/40">
                    <span className="font-headline font-black text-3xl sm:text-4xl text-[#6D28D9] tracking-tight">
                      1.5K<span className="text-xl text-[#9333EA]">+</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Label with Strong Purple Color */}
                <div className="relative z-10 pt-2 border-t border-[#7C3AED]/30 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#6D28D9] uppercase">
                    AUTOMATED QUERY RESOLUTION
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" />
                </div>
              </div>

              {/* ======================================================= */}
              {/* CARD 03 · DARK (ELECTRIC SAPPHIRE / ROYAL BLUE GLOW)    */}
              {/* ======================================================= */}
              <div
                ref={(el) => (cardRefs.current[2] = el)}
                className="team-card group relative rounded-2xl bg-gradient-to-br from-[#08152B] via-[#0A111F] to-[#060B14] text-white p-5 sm:p-6 flex flex-col justify-between shadow-[0_15px_40px_rgba(56,189,248,0.22)] border-2 border-[#38BDF8]/50 hover:border-[#38BDF8] overflow-hidden h-[335px] sm:h-[350px] lg:h-[365px] will-change-transform transition-all duration-300"
              >
                {/* Ambient Blue Orb */}
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#38BDF8]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Pill Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Card 03 · Dark
                    </span>
                    <span className="text-[11px] font-bold text-[#38BDF8]">
                      Enquiries
                    </span>
                  </div>

                  {/* Heading & Subtitle */}
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-2.5 uppercase">
                    LEAD VISIBILITY
                  </h3>
                  <p className="text-xs text-[#D1D5DB] mt-1.5 leading-relaxed font-normal">
                    See customer conversations and enquiries generated through your website assistant.
                  </p>
                </div>

                {/* Compact Business Lead Overview */}
                <div className="relative z-10 my-auto py-1.5 bg-[#040C1A]/80 rounded-xl p-2.5 border border-[#38BDF8]/20 space-y-1 shadow-inner">
                  <div className="bg-white/[0.04] rounded-lg p-1.5 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] font-bold text-white">Commercial Rollout</div>
                      <div className="text-[8px] text-white/60">Enterprise Tier</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase">
                      Hot Lead
                    </span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-1.5 flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] font-bold text-white">Elena Rostova</div>
                      <div className="text-[8px] text-white/60">Consultation Scheduled</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#963DFF]/25 text-[#C28AFF] text-[8px] font-bold uppercase">
                      Qualified
                    </span>
                  </div>
                </div>

                {/* Bottom Label */}
                <div className="relative z-10 pt-2 border-t border-[#38BDF8]/20 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#38BDF8] uppercase">
                    CONVERSATIONS & ENQUIRIES
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
