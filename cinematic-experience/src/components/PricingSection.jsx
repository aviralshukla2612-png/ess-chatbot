import React, { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export const PRICING_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    tagline: "Flexible Month-to-Month Plan",
    price: "₹999",
    period: "/ month",
    savings: null,
    popular: false,
    features: [
      "1 account",
      "1 chatbot",
      "7-day free trial",
    ],
    ctaText: "Start 7-Day Free Trial",
  },
  {
    id: "six-months",
    name: "Six Months",
    tagline: "Commercial Half-Year Access",
    price: "₹5,999",
    period: "/ 6 months",
    savings: null,
    popular: false,
    features: [
      "1 account",
      "1 chatbot",
      "7-day free trial",
    ],
    ctaText: "Start 7-Day Free Trial",
  },
  {
    id: "annual",
    name: "Annual",
    tagline: "Full Year Maximum Value",
    price: "₹8,999",
    period: "/ year",
    savings: "Save ₹2,989 compared with twelve monthly payments.",
    popular: true,
    features: [
      "1 account",
      "1 chatbot",
      "7-day free trial",
      "Save ₹2,989 compared with twelve monthly payments.",
    ],
    ctaText: "Start 7-Day Free Trial",
  },
];

const HEADLINE_LINE1 = "SIMPLE PRICING.";
const HEADLINE_LINE2 = "POWERFUL CONVERSATIONS.";

// Precompute deterministic 3D explosion vectors for every letter
function computeExplosionVectors(text, isTopLine) {
  const chars = text.split("");
  const mid = (chars.length - 1) / 2;

  return chars.map((char, i) => {
    if (char === " ") return null;
    const relX = (i - mid) / mid; // -1 to +1
    const seed = ((i * 7 + (isTopLine ? 13 : 29)) % 11) / 11;
    const seed2 = ((i * 13 + (isTopLine ? 5 : 17)) % 7) / 7;

    const x = Math.round(relX * (isTopLine ? 420 : 480) + (seed - 0.5) * 140);
    const y = isTopLine
      ? Math.round(-180 - Math.abs(relX) * 160 - seed * 140)
      : Math.round(180 + Math.abs(relX) * 160 + seed * 140);
    const z = Math.round((seed2 - 0.5) * 350);
    const rotateZ = Math.round(relX * 60 + (seed - 0.5) * 55);
    const rotateX = Math.round((seed - 0.5) * 95);
    const rotateY = Math.round((seed2 - 0.5) * 95);
    const scale = Number((0.35 + seed * 0.75).toFixed(2));
    const delay = Number((Math.abs(relX) * 0.08 + seed * 0.04).toFixed(3));

    return { char, i, x, y, z, rotateZ, rotateX, rotateY, scale, delay };
  });
}

export default function PricingSection({ onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const headlineWrapperRef = useRef(null);
  const compactHeaderRef = useRef(null);
  const cardsStageRef = useRef(null);
  const cardRefs = useRef([]);
  const line1CharRefs = useRef([]);
  const line2CharRefs = useRef([]);

  const [activePlan, setActivePlan] = useState("annual");

  const line1Vectors = useMemo(() => computeExplosionVectors(HEADLINE_LINE1, true), []);
  const line2Vectors = useMemo(() => computeExplosionVectors(HEADLINE_LINE2, false), []);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isTablet: "(min-width: 641px) and (max-width: 1023px)",
        isMobile: "(max-width: 640px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, isTablet, isMobile, reduceMotion } = context.conditions;

        if (reduceMotion) {
          // Static layout for reduced motion
          gsap.set(cardRefs.current, {
            opacity: 1,
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            rotationY: 0,
            rotationZ: 0,
            z: 0,
            pointerEvents: "auto",
          });
          gsap.set(compactHeaderRef.current, { opacity: 1, y: 0 });
          gsap.set(headlineWrapperRef.current, { display: "none" });
          return;
        }

        const scrollDist = isDesktop ? "+=2800" : isTablet ? "+=2200" : "+=1800";

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: scrollDist,
            pin: stageRef.current,
            pinSpacing: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // ============================================================
        // INITIAL STATES (Phase 1: 0.00 -> 0.15)
        // Typography is crisp & centered.
        // Cards are hidden in deep 3D background.
        // ============================================================
        gsap.set(cardRefs.current[0], {
          opacity: 0,
          z: -450,
          scale: 0.55,
          rotationY: isDesktop ? 25 : 0,
          rotationZ: isDesktop ? -12 : -4,
          xPercent: isDesktop ? 40 : 0,
          yPercent: isDesktop ? 18 : 30,
          pointerEvents: "none",
          transformOrigin: "center center",
          zIndex: 1,
        });

        gsap.set(cardRefs.current[1], {
          opacity: 0,
          z: -350,
          scale: 0.65,
          rotationY: 0,
          rotationZ: 0,
          xPercent: 0,
          yPercent: 0,
          pointerEvents: "none",
          transformOrigin: "center center",
          zIndex: 10, // Center card on top in deck
        });

        gsap.set(cardRefs.current[2], {
          opacity: 0,
          z: -450,
          scale: 0.55,
          rotationY: isDesktop ? -25 : 0,
          rotationZ: isDesktop ? 12 : 4,
          xPercent: isDesktop ? -40 : 0,
          yPercent: isDesktop ? 18 : -30,
          pointerEvents: "none",
          transformOrigin: "center center",
          zIndex: 2,
        });

        gsap.set(compactHeaderRef.current, {
          opacity: 0,
          y: -25,
        });

        // Reset all exploding letters
        line1CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
        });
        line2CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
        });

        // ============================================================
        // PHASE 2 (0.15 -> 0.35): INDIVIDUAL LETTER EXPLOSION
        // Characters burst outward with distinct 3D trajectories
        // ============================================================
        const distMult = isMobile ? 0.42 : isTablet ? 0.72 : 1.0;

        line1Vectors.forEach((v) => {
          if (!v) return;
          const el = line1CharRefs.current[v.i];
          if (!el) return;

          tl.to(
            el,
            {
              x: v.x * distMult,
              y: v.y * distMult,
              z: v.z * distMult,
              rotationZ: v.rotateZ,
              rotationX: v.rotateX,
              rotationY: v.rotateY,
              scale: v.scale,
              opacity: 0,
              filter: "blur(10px)",
              duration: 0.18,
              ease: "power2.in",
            },
            0.15 + v.delay
          );
        });

        line2Vectors.forEach((v) => {
          if (!v) return;
          const el = line2CharRefs.current[v.i];
          if (!el) return;

          tl.to(
            el,
            {
              x: v.x * distMult,
              y: v.y * distMult,
              z: v.z * distMult,
              rotationZ: v.rotateZ,
              rotationX: v.rotateX,
              rotationY: v.rotateY,
              scale: v.scale,
              opacity: 0,
              filter: "blur(10px)",
              duration: 0.18,
              ease: "power2.in",
            },
            0.16 + v.delay
          );
        });

        // Compact top header reveals as characters disperse
        tl.to(
          compactHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.28,
            ease: "power2.out",
          },
          0.32
        );

        // ============================================================
        // PHASE 3 (0.30 -> 0.50): PRICING CARDS EMERGE (Compact Overlapping Fan)
        // Three cards surge forward from the depth like a premium card deck
        // Middle card is more prominent in front
        // ============================================================
        // Center Card (Six Months) rises forward first
        tl.to(
          cardRefs.current[1],
          {
            opacity: 1,
            z: 60,
            scale: isDesktop ? 0.92 : 0.88,
            xPercent: 0,
            yPercent: -5,
            rotationY: 0,
            rotationZ: 0,
            duration: 0.20,
            ease: "power2.out",
          },
          0.30
        );

        // Left Card (Monthly) peeks in behind left
        tl.to(
          cardRefs.current[0],
          {
            opacity: 1,
            z: -25,
            scale: isDesktop ? 0.84 : 0.80,
            xPercent: isDesktop ? 38 : 0,
            yPercent: isDesktop ? 12 : 20,
            rotationY: isDesktop ? 14 : 0,
            rotationZ: isDesktop ? -8 : -3,
            duration: 0.20,
            ease: "power2.out",
          },
          0.33
        );

        // Right Card (Annual) peeks in behind right
        tl.to(
          cardRefs.current[2],
          {
            opacity: 1,
            z: -20,
            scale: isDesktop ? 0.84 : 0.80,
            xPercent: isDesktop ? -38 : 0,
            yPercent: isDesktop ? 12 : -20,
            rotationY: isDesktop ? -14 : 0,
            rotationZ: isDesktop ? 8 : 3,
            duration: 0.20,
            ease: "power2.out",
          },
          0.35
        );

        // ============================================================
        // PHASE 4 (0.45 -> 0.70): CARDS FAN OUT
        // Left card moves left, center settles, right moves right
        // Rotations ease back towards 0, scale increases
        // ============================================================
        tl.to(
          cardRefs.current[0],
          {
            z: -10,
            scale: 0.95,
            xPercent: isDesktop ? 14 : 0,
            yPercent: 4,
            rotationY: isDesktop ? 4 : 0,
            rotationZ: isDesktop ? -2 : 0,
            duration: 0.25,
            ease: "power1.inOut",
          },
          0.48
        );

        tl.to(
          cardRefs.current[1],
          {
            z: 10,
            scale: 0.98,
            xPercent: 0,
            yPercent: 0,
            duration: 0.25,
            ease: "power1.inOut",
          },
          0.48
        );

        tl.to(
          cardRefs.current[2],
          {
            z: -10,
            scale: 0.95,
            xPercent: isDesktop ? -14 : 0,
            yPercent: 4,
            rotationY: isDesktop ? -4 : 0,
            rotationZ: isDesktop ? 2 : 0,
            duration: 0.25,
            ease: "power1.inOut",
          },
          0.48
        );

        // ============================================================
        // PHASE 5 (0.70 -> 0.90): FINAL THREE-COLUMN ASSEMBLY
        // Perspective depth disappears, cards lock flush into columns
        // Pointer events enable for full interactivity
        // ============================================================
        tl.to(
          cardRefs.current[0],
          {
            z: 0,
            scale: 1.0,
            xPercent: 0,
            yPercent: 0,
            rotationY: 0,
            rotationZ: 0,
            pointerEvents: "auto",
            duration: 0.20,
            ease: "power2.out",
          },
          0.70
        );

        tl.to(
          cardRefs.current[1],
          {
            z: 0,
            scale: 1.0,
            xPercent: 0,
            yPercent: 0,
            rotationY: 0,
            rotationZ: 0,
            pointerEvents: "auto",
            duration: 0.20,
            ease: "power2.out",
          },
          0.70
        );

        tl.to(
          cardRefs.current[2],
          {
            z: 0,
            scale: 1.0,
            xPercent: 0,
            yPercent: 0,
            rotationY: 0,
            rotationZ: 0,
            pointerEvents: "auto",
            duration: 0.20,
            ease: "power2.out",
          },
          0.70
        );

        // Buffer hold: (0.90 -> 1.00) Layout remains 100% stable and readable
        tl.to({}, { duration: 0.10 }, 0.90);
      },
      sectionRef
    );

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      mm.revert();
    };
  }, [line1Vectors, line2Vectors]);

  const handleSelectPlan = (planId) => {
    setActivePlan(planId);
    if (onOpenTrial) {
      onOpenTrial(planId);
    } else {
      window.location.href = `/register?plan=${planId}`;
    }
  };

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative w-full bg-[#050507] text-[#F5F5F7] overflow-hidden"
    >
      {/* PINNED STAGE (Controlled by GSAP ScrollTrigger scrub) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[660px] max-h-[1080px] bg-[#050507] overflow-hidden flex flex-col justify-between py-5 sm:py-7 lg:py-9 px-4 sm:px-8 lg:px-12 select-none"
      >
        {/* Technical Grid Background & Ambient Lighting */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-[#963DFF]/15 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#55A9FF]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Eyebrow Badge (Always visible) */}
        <div className="relative z-30 w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF]">
            <span>/ TRANSPARENT PRICING</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>7-Day Free Evaluation Included</span>
          </div>
        </div>

        {/* ============================================================
            PHASE 1 & 2: MASSIVE TYPOGRAPHY LAYER (EXPLODING CHARACTERS)
            Absolute positioned layer so individual letter transforms do not cause layout shift
            ============================================================ */}
        <div
          ref={headlineWrapperRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4 text-center"
          style={{ perspective: "1200px" }}
        >
          {/* Line 1: SIMPLE PRICING. (Individual character spans) */}
          <h2 className="font-sans font-extrabold tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.25rem] leading-[0.98] uppercase text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] flex items-center justify-center flex-wrap">
            {HEADLINE_LINE1.split("").map((char, idx) => {
              if (char === " ") {
                return (
                  <span key={idx} className="inline-block w-[0.28em]">
                    &nbsp;
                  </span>
                );
              }
              return (
                <span
                  key={idx}
                  ref={(el) => (line1CharRefs.current[idx] = el)}
                  className="inline-block will-change-transform transform-gpu"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {char}
                </span>
              );
            })}
          </h2>

          {/* Line 2: POWERFUL CONVERSATIONS. (Individual character spans in gradient) */}
          <h2 className="font-sans font-extrabold tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.25rem] leading-[0.98] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#B379FF] to-[#55A9FF] drop-shadow-[0_0_40px_rgba(194,138,255,0.4)] mt-2 sm:mt-3 flex items-center justify-center flex-wrap">
            {HEADLINE_LINE2.split("").map((char, idx) => {
              if (char === " ") {
                return (
                  <span key={idx} className="inline-block w-[0.28em]">
                    &nbsp;
                  </span>
                );
              }
              return (
                <span
                  key={idx}
                  ref={(el) => (line2CharRefs.current[idx] = el)}
                  className="inline-block will-change-transform transform-gpu"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {char}
                </span>
              );
            })}
          </h2>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#9898A6] max-w-lg font-medium">
            Choose the plan that works for your business.
          </p>
        </div>

        {/* ============================================================
            COMPACT HEADER (Reveals during Phase 2-5 at top)
            ============================================================ */}
        <div
          ref={compactHeaderRef}
          className="relative z-30 w-full max-w-4xl mx-auto text-center will-change-transform pt-1"
        >
          <h3 className="font-sans font-extrabold tracking-tight text-xl sm:text-3xl text-white uppercase leading-tight">
            <span>Simple Pricing. </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] to-[#55A9FF]">
              Powerful Conversations.
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-[#9898A6]">
            Choose the plan that works for your business.
          </p>
        </div>

        {/* Mobile Plan Quick Switcher (Visible on small screens) */}
        <div className="relative z-30 sm:hidden flex justify-center mt-2 mb-1">
          <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            {PRICING_PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePlan(p.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  activePlan === p.id
                    ? "bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white shadow-sm"
                    : "text-[#9898A6]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
            PHASE 3, 4 & 5: 3D PRICING CARDS PERSPECTIVE STAGE
            Cards emerge from depth in an overlapping fan, then fan out into 3 columns
            ============================================================ */}
        <div
          ref={cardsStageRef}
          className="relative z-20 w-full max-w-6xl mx-auto my-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-stretch px-2 sm:px-4 will-change-transform"
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
        >
          {PRICING_PLANS.map((plan, idx) => {
            const isAnnual = plan.id === "annual";
            const isSixMonths = plan.id === "six-months";
            const isMobileHidden = activePlan !== plan.id;

            return (
              <div
                key={plan.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                className={`relative rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 will-change-transform backdrop-blur-xl ${
                  isAnnual
                    ? "bg-[#12121A]/95 border-2 border-[#963DFF] shadow-[0_0_40px_rgba(150,61,255,0.28)]"
                    : isSixMonths
                    ? "bg-[#12121A]/90 border border-[#963DFF]/40 shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
                    : "bg-[#12121A]/80 border border-white/[0.08] hover:border-white/[0.18] shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
                } ${isMobileHidden ? "hidden sm:flex" : "flex"}`}
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
              >
                {/* Best Value Badge for Annual */}
                {isAnnual && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                    Best Value — Save ₹2,989
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                        {plan.name}
                      </h4>
                      {isAnnual && (
                        <span className="px-2 py-0.5 rounded bg-[#963DFF]/20 text-[#C28AFF] text-[10px] font-bold uppercase tracking-wider">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9898A6] mt-0.5">{plan.tagline}</p>
                  </div>

                  {/* Price Block */}
                  <div className="mb-4 pb-4 border-b border-white/[0.08]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs text-[#9898A6] font-medium">
                        {plan.period}
                      </span>
                    </div>
                    {plan.savings && (
                      <p className="text-[11px] font-semibold text-[#55A9FF] mt-1.5 leading-snug">
                        {plan.savings}
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist (Exact User Specifications) */}
                  <div className="space-y-2.5 mb-6">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#D9D9E2]">
                        <Check className="w-3.5 h-3.5 text-[#C28AFF] mt-0.5 shrink-0" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                      isAnnual
                        ? "bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] text-white hover:shadow-[0_0_24px_rgba(150,61,255,0.45)]"
                        : "bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1]"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Evaluation / Security Assurance Bar */}
        <div className="relative z-30 w-full max-w-5xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold pt-1 px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full 7-Day Free Evaluation on Every Plan</span>
          </div>
          <span className="text-[#C28AFF]">
            Autonomous Enterprise AI • Zero Risk
          </span>
        </div>
      </div>
    </section>
  );
}