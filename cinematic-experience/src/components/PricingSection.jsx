import React, { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export const PRICING_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    number: "01",
    tagline: "Flexible Month-to-Month Plan",
    price: "₹999",
    period: "/ month",
    savings: null,
    popular: false,
    accent: "#55A9FF",
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
    number: "02",
    tagline: "Commercial Half-Year Access",
    price: "₹5,999",
    period: "/ 6 months",
    savings: null,
    popular: false,
    accent: "#C28AFF",
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
    number: "03",
    tagline: "Full Year Maximum Value",
    price: "₹8,999",
    period: "/ year",
    savings: "Save ₹2,989 compared with twelve monthly payments.",
    popular: true,
    accent: "#963DFF",
    features: [
      "1 account",
      "1 chatbot",
      "7-day free trial",
      "Save ₹2,989 compared with twelve monthly payments.",
    ],
    ctaText: "Start 7-Day Free Trial",
  },
];

const WORDS_LINE1 = ["SIMPLE", "PRICING."];
const WORDS_LINE2 = ["POWERFUL", "CONVERSATIONS."];

// Compute powerful radial firework blast vectors for each character
function computeExplosionVectors(words, isTopLine) {
  let charIdx = 0;
  const list = [];
  words.forEach((w, wIdx) => {
    w.split("").forEach((char) => {
      list.push({ char, wIdx, overallIdx: charIdx++ });
    });
  });

  const total = list.length;
  const mid = (total - 1) / 2;

  return list.map(({ char, wIdx, overallIdx }, i) => {
    const relX = (i - mid) / (mid || 1); // -1.0 to +1.0
    const seed = ((i * 17 + (isTopLine ? 23 : 41)) % 13) / 13;
    const seed2 = ((i * 29 + (isTopLine ? 11 : 37)) % 11) / 11;

    // Explosive horizontal blast: left characters shoot left, right shoot right
    const signX = relX >= 0 ? 1 : -1;
    const x = Math.round(signX * (440 + Math.abs(relX) * 520) + (seed - 0.5) * 220);
    // Powerful upward firework detonation
    const y = Math.round(
      isTopLine
        ? -320 - Math.abs(relX) * 250 - seed * 280
        : -180 + (seed > 0.5 ? -220 : 200) - seed2 * 220
    );
    const z = Math.round((seed2 - 0.5) * 600);
    const rotateZ = Math.round(signX * (100 + seed * 180));
    const rotateX = Math.round((seed - 0.5) * 260);
    const rotateY = Math.round((seed2 - 0.5) * 260);
    const scale = Number((0.15 + seed * 0.35).toFixed(2));
    const delay = Number((Math.abs(relX) * 0.04 + seed * 0.025).toFixed(3));

    return { char, i, x, y, z, rotateZ, rotateX, rotateY, scale, delay };
  });
}

export default function PricingSection({ onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const headlineWrapperRef = useRef(null);
  const sublineRef = useRef(null);
  const line1CharRefs = useRef([]);
  const line2CharRefs = useRef([]);
  const wheelRef = useRef(null);
  const circleRefs = useRef([]);
  const cardMediaRefs = useRef([]);
  const mobileCardsRef = useRef(null);

  const [activePlan, setActivePlan] = useState("annual");

  const line1Vectors = useMemo(() => computeExplosionVectors(WORDS_LINE1, true), []);
  const line2Vectors = useMemo(() => computeExplosionVectors(WORDS_LINE2, false), []);

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
          gsap.set(headlineWrapperRef.current, { autoAlpha: 0 });
          circleRefs.current.forEach((el, idx) => {
            if (el) {
              el.style.visibility = "visible";
              gsap.set(el, { opacity: 1, rotation: (idx - 1) * 8.5 });
            }
          });
          return;
        }

        // Paced scroll runway distance: reduced speed for relaxed cinematic progression
        const scrollDist = isDesktop ? "+=4200" : isTablet ? "+=3400" : "+=2600";
        const distMult = isMobile ? 0.45 : isTablet ? 0.75 : 1.0;

        // Reset headline & character starting states
        if (headlineWrapperRef.current) {
          gsap.set(headlineWrapperRef.current, { autoAlpha: 1, opacity: 1 });
        }
        line1CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 0, y: 8, scale: 0.96, x: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, filter: "blur(0px)" });
        });
        line2CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 0, y: 8, scale: 0.96, x: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, filter: "blur(0px)" });
        });
        if (sublineRef.current) gsap.set(sublineRef.current, { opacity: 0, y: 12, filter: "blur(0px)" });

        // Reset Made With GSAP Wheel state
        if (wheelRef.current) {
          gsap.set(wheelRef.current, { rotation: 0 });
        }
        circleRefs.current.forEach((el) => {
          if (el) {
            el.style.visibility = "hidden";
            gsap.set(el, { opacity: 0, rotation: 0 });
          }
        });

        // ============================================================
        // MASTER SCRUBBED TIMELINE (Headline Typewriter + 3D Word Blast)
        // ============================================================
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: scrollDist,
            pin: stageRef.current,
            pinSpacing: true,
            scrub: 1.1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1. TYPING TEXT EFFECT (0.00 -> 0.16) - Clean character reveal without any cursor line
        const totalL1 = line1Vectors.length;
        const totalL2 = line2Vectors.length;

        line1Vectors.forEach((v, idx) => {
          const el = line1CharRefs.current[idx];
          if (!el) return;
          const startTime = (idx / totalL1) * 0.065;
          tl.to(
            el,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.006,
              ease: "power1.out",
            },
            startTime
          );
        });

        line2Vectors.forEach((v, idx) => {
          const el = line2CharRefs.current[idx];
          if (!el) return;
          const startTime = 0.07 + (idx / totalL2) * 0.075;
          tl.to(
            el,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.006,
              ease: "power1.out",
            },
            startTime
          );
        });

        if (sublineRef.current) {
          tl.to(
            sublineRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.035,
              ease: "power2.out",
            },
            0.15
          );
        }

        // Reading hold between 0.16 and 0.22 (headline fully visible, editorial, centered)

        // 2. KINETIC WORD BLAST (0.22 -> 0.38) - Radial 3D firework explosion
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
              filter: "blur(14px)",
              duration: 0.16,
              ease: "power2.in",
            },
            0.22 + v.delay
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
              filter: "blur(14px)",
              duration: 0.16,
              ease: "power2.in",
            },
            0.23 + v.delay
          );
        });

        if (sublineRef.current) {
          tl.to(
            sublineRef.current,
            {
              opacity: 0,
              y: 40,
              filter: "blur(8px)",
              duration: 0.11,
              ease: "power2.in",
            },
            0.24
          );
        }

        // Clean autoAlpha fade out for headline layer
        if (headlineWrapperRef.current) {
          tl.to(
            headlineWrapperRef.current,
            {
              autoAlpha: 0,
              duration: 0.04,
              ease: "power1.out",
            },
            0.36
          );
        }

        // Mobile Cards Fade-in
        if (!isDesktop && mobileCardsRef.current) {
          tl.fromTo(
            mobileCardsRef.current,
            { opacity: 0, y: 50, scale: 0.92 },
            { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power2.out" },
            0.42
          );
        }

        // Hold till end of scroll
        tl.to({}, { duration: 0.20 }, 0.80);

        // ============================================================
        // EXACT MADE WITH GSAP CARDS ROTATING WHEEL STEP CONTROLLER
        // Step angle: s = 8.5deg. Cards pop in 1 by 1 with elastic bounce!
        // ============================================================
        if (isDesktop) {
          const s = 8.5;
          let a = -1;

          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top top",
            end: scrollDist,
            onUpdate: (self) => {
              const p = self.progress;

              // Before word blast clears, keep cards inactive
              if (p < 0.36) {
                if (a !== -1) {
                  circleRefs.current.forEach((el) => {
                    if (el) {
                      el.style.visibility = "hidden";
                      gsap.set(el, { opacity: 0 });
                    }
                  });
                  if (wheelRef.current) {
                    gsap.to(wheelRef.current, { rotation: 0, duration: 0.3, overwrite: "auto" });
                  }
                  a = -1;
                }
                return;
              }

              // Normalize progress for the 3 cards (0.36 -> 0.84)
              const cardProgress = Math.min(0.999, Math.max(0, (p - 0.36) / 0.48));
              const t = Math.floor(cardProgress * 3); // 0, 1, or 2

              if (t !== a && t < 3) {
                if (t > a) {
                  // Reveal new card(s) sequentially with elastic spring bounce
                  for (let i = a + 1; i <= t; i++) {
                    const circle = circleRefs.current[i];
                    const media = cardMediaRefs.current[i];
                    if (circle) {
                      circle.style.visibility = "visible";
                      gsap.set(circle, { rotation: i * s, opacity: 1 });
                    }
                    if (media) {
                      gsap.from(media, {
                        scale: 0.94,
                        ease: "elastic.out(0.6, 0.3)",
                        duration: 0.5,
                        overwrite: "auto",
                      });
                    }
                  }
                } else if (t < a) {
                  // Revert scroll: hide cards that were left behind
                  for (let i = a; i > t; i--) {
                    const circle = circleRefs.current[i];
                    if (circle) {
                      circle.style.visibility = "hidden";
                      gsap.set(circle, { opacity: 0 });
                    }
                  }
                }

                // Exact Made With GSAP wheel rotation formula: -t*s + (s/2)*t
                if (wheelRef.current) {
                  gsap.to(wheelRef.current, {
                    rotation: -t * s + (s / 2) * t,
                    ease: "elastic.out(0.6, 0.3)",
                    duration: 0.5,
                    overwrite: "auto",
                  });
                }

                a = t;
              }
            },
            onLeaveBack: () => {
              a = -1;
              circleRefs.current.forEach((el) => {
                if (el) {
                  el.style.visibility = "hidden";
                  gsap.set(el, { opacity: 0 });
                }
              });
              if (wheelRef.current) {
                gsap.set(wheelRef.current, { rotation: 0 });
              }
            },
          });
        }
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

  const handleAction = (planId) => {
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
        className="relative w-full h-screen min-h-[640px] bg-[#050507] overflow-hidden flex flex-col justify-between py-4 sm:py-6 px-4 sm:px-8 select-none"
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

        {/* Top Eyebrow Badge */}
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
            PHASE 1 & 2: MASSIVE EDITORIAL TYPOGRAPHY WITH TYPING EFFECT
            Pure crisp white characters, clean without any trailing line!
            ============================================================ */}
        <div
          ref={headlineWrapperRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4 text-center will-change-transform"
          style={{ perspective: "1200px" }}
        >
          {/* Line 1: SIMPLE PRICING. (Individual character spans) */}
          <h2 className="font-sans font-extrabold tracking-tight text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] leading-[1.06] uppercase text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {WORDS_LINE1.map((word, wIdx) => {
              const startIdx = wIdx === 0 ? 0 : WORDS_LINE1[0].length;
              return (
                <span key={wIdx} className="inline-flex whitespace-nowrap">
                  {word.split("").map((char, cIdx) => {
                    const idx = startIdx + cIdx;
                    return (
                      <span
                        key={cIdx}
                        ref={(el) => (line1CharRefs.current[idx] = el)}
                        className="inline-block will-change-transform transform-gpu"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </h2>

          {/* Line 2: POWERFUL CONVERSATIONS. (Pure white without any trailing cursor) */}
          <h2 className="font-sans font-extrabold tracking-tight text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] leading-[1.06] uppercase text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] mt-2 sm:mt-3 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {WORDS_LINE2.map((word, wIdx) => {
              const startIdx = wIdx === 0 ? 0 : WORDS_LINE2[0].length;
              return (
                <span key={wIdx} className="inline-flex whitespace-nowrap">
                  {word.split("").map((char, cIdx) => {
                    const idx = startIdx + cIdx;
                    return (
                      <span
                        key={cIdx}
                        ref={(el) => (line2CharRefs.current[idx] = el)}
                        className="inline-block will-change-transform transform-gpu"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </h2>

          <p
            ref={sublineRef}
            className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#9898A6] max-w-lg font-medium will-change-transform"
          >
            Choose the plan that works for your business.
          </p>
        </div>

        {/* Mobile Plan Quick Switcher (Visible on small screens) */}
        <div className="relative z-30 lg:hidden flex justify-center mt-2 mb-1">
          <div className="inline-flex p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            {PRICING_PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePlan(p.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
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
            DESKTOP: EXACT MADE WITH GSAP ROTATING WHEEL
            Center at 45vh (upper-middle, NO bottom cut-off).
            Cards emerge 1 by 1 with elastic spring bounce!
            ============================================================ */}
        <div className="hidden lg:block absolute inset-0 z-20 pointer-events-none overflow-hidden">
          <div
            ref={wheelRef}
            className="absolute will-change-transform pointer-events-none"
            style={{
              width: "3675px",
              height: "3675px",
              top: "45vh",
              left: "50%",
              marginLeft: "-1837.5px",
              transformOrigin: "center center",
            }}
          >
            {PRICING_PLANS.map((plan, idx) => {
              const isAnnual = plan.id === "annual";
              const isSixMonths = plan.id === "six-months";

              // Stacking order: Annual (03) sits on top, then Six Months (02), then Monthly (01)
              const zIndex = isAnnual ? 30 : isSixMonths ? 20 : 10;

              return (
                <div
                  key={plan.id}
                  ref={(el) => (circleRefs.current[idx] = el)}
                  className="absolute inset-0 w-full h-full will-change-transform pointer-events-none"
                  style={{
                    transformOrigin: "center center",
                    visibility: "hidden",
                    opacity: 0,
                    zIndex,
                  }}
                >
                  <div
                    ref={(el) => (cardMediaRefs.current[idx] = el)}
                    className="relative w-[325px] xl:w-[340px] mx-auto will-change-transform pointer-events-auto transition-transform duration-300 hover:scale-[1.03] hover:z-50 select-text"
                    style={{
                      transform: "translateY(-50%)",
                      transformOrigin: "center center",
                    }}
                  >
                    <div
                      className={`relative rounded-2xl p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 backdrop-blur-2xl overflow-hidden group shadow-2xl ${
                        isAnnual
                          ? "bg-[#12121A]/95 border-2 border-[#963DFF] shadow-[0_0_45px_rgba(150,61,255,0.35)]"
                          : isSixMonths
                          ? "bg-[#12121A]/90 border border-[#963DFF]/40 shadow-[0_15px_40px_rgba(0,0,0,0.7)]"
                          : "bg-[#12121A]/85 border border-white/[0.08] hover:border-white/[0.18] shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
                      }`}
                    >
                      {/* Oversized Signature Watermark Number */}
                      <span className="absolute bottom-5 right-6 text-7xl font-mono font-black text-white/[0.04] pointer-events-none select-none">
                        {plan.number}
                      </span>

                      {/* Best Value Badge for Annual */}
                      {isAnnual && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                          Best Value — Save ₹2,989
                        </div>
                      )}

                      <div className="relative z-10">
                        {/* Plan Header */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#9898A6]">
                              {plan.number} / PLAN
                            </span>
                            {isAnnual && (
                              <span className="px-2 py-0.5 rounded bg-[#963DFF]/20 text-[#C28AFF] text-[10px] font-bold uppercase tracking-wider">
                                Recommended
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-2xl text-white tracking-tight mt-1">
                            {plan.name}
                          </h4>
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
                      <div className="relative z-10 pt-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleAction(plan.id)}
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABLET & MOBILE RESPONSIVE STACK (Clean, switcher compatible) */}
        <div
          ref={mobileCardsRef}
          className="lg:hidden w-full max-w-md mx-auto flex flex-col justify-center px-4 my-auto will-change-transform"
        >
          {PRICING_PLANS.map((plan) => {
            const isAnnual = plan.id === "annual";
            const isSixMonths = plan.id === "six-months";
            const isHidden = activePlan !== plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur-2xl overflow-hidden ${
                  isHidden ? "hidden" : "flex"
                } ${
                  isAnnual
                    ? "bg-[#12121A]/95 border-2 border-[#963DFF] shadow-[0_0_35px_rgba(150,61,255,0.3)]"
                    : isSixMonths
                    ? "bg-[#12121A]/90 border border-[#963DFF]/40"
                    : "bg-[#12121A]/85 border border-white/[0.08]"
                }`}
              >
                <div className="relative z-10">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9898A6]">
                        {plan.number} / PLAN
                      </span>
                      {isAnnual && (
                        <span className="px-2 py-0.5 rounded bg-[#963DFF]/20 text-[#C28AFF] text-[10px] font-bold uppercase tracking-wider">
                          Recommended
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-2xl text-white tracking-tight mt-1">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-[#9898A6] mt-0.5">{plan.tagline}</p>
                  </div>

                  <div className="mb-4 pb-4 border-b border-white/[0.08]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white tracking-tight">
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

                  <div className="space-y-2.5 mb-6">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#D9D9E2]">
                        <Check className="w-3.5 h-3.5 text-[#C28AFF] mt-0.5 shrink-0" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAction(plan.id)}
                    className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                      isAnnual
                        ? "bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] text-white"
                        : "bg-white/[0.06] text-white border border-white/[0.1]"
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

        {/* Bottom Guarantee Banner */}
        <div className="relative z-30 w-full max-w-5xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold pt-1 px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full 7-Day Free Evaluation on Every Plan</span>
          </div>
          <div className="text-[#C28AFF] hidden sm:block">
            Autonomous Enterprise AI • Zero Risk
          </div>
        </div>
      </div>
    </section>
  );
}
