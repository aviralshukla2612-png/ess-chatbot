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
    const relX = (i - mid) / (mid || 1);
    const seed = ((i * 17 + (isTopLine ? 23 : 41)) % 13) / 13;
    const seed2 = ((i * 29 + (isTopLine ? 11 : 37)) % 11) / 11;

    const signX = relX >= 0 ? 1 : -1;
    const x = Math.round(signX * (420 + Math.abs(relX) * 480) + (seed - 0.5) * 200);
    const y = Math.round(
      isTopLine
        ? -280 - Math.abs(relX) * 220 - seed * 260
        : -160 + (seed > 0.5 ? -200 : 180) - seed2 * 200
    );
    const z = Math.round((seed2 - 0.5) * 550);
    const rotateZ = Math.round(signX * (90 + seed * 160));
    const rotateX = Math.round((seed - 0.5) * 240);
    const rotateY = Math.round((seed2 - 0.5) * 240);
    const scale = Number((0.25 + seed * 0.45).toFixed(2));
    const delay = Number((Math.abs(relX) * 0.05 + seed * 0.03).toFixed(3));

    return { char, i, x, y, z, rotateZ, rotateX, rotateY, scale, delay };
  });
}

export default function PricingSection({ onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const headlineWrapperRef = useRef(null);
  const compactHeaderRef = useRef(null);
  const wheelContainerRef = useRef(null);
  const wheelRef = useRef(null);
  const circleRefs = useRef([]);
  const cardMediaRefs = useRef([]);
  const line1CharRefs = useRef([]);
  const line2CharRefs = useRef([]);

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
          gsap.set(circleRefs.current, { opacity: 1, visibility: "visible", rotation: 0 });
          gsap.set(cardMediaRefs.current, { scale: 1, rotation: 0, x: 0, y: 0, pointerEvents: "auto" });
          gsap.set(compactHeaderRef.current, { opacity: 1, y: 0 });
          gsap.set(headlineWrapperRef.current, { display: "none" });
          return;
        }

        const scrollDist = isDesktop ? "+=3000" : isTablet ? "+=2400" : "+=1800";
        const s = 6.5;

        if (headlineWrapperRef.current) {
          headlineWrapperRef.current.style.display = "flex";
          headlineWrapperRef.current.style.opacity = "1";
        }

        line1CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
        });
        line2CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
        });

        gsap.set(compactHeaderRef.current, { opacity: 0, y: -20 });

        if (isDesktop) {
          if (circleRefs.current[0]) gsap.set(circleRefs.current[0], { rotation: -s, opacity: 0, visibility: "hidden" });
          if (circleRefs.current[1]) gsap.set(circleRefs.current[1], { rotation: 0, opacity: 0, visibility: "hidden" });
          if (circleRefs.current[2]) gsap.set(circleRefs.current[2], { rotation: s, opacity: 0, visibility: "hidden" });

          if (wheelRef.current) gsap.set(wheelRef.current, { rotation: s });

          cardMediaRefs.current.forEach((el) => {
            if (el) gsap.set(el, { scale: 1, x: 0, y: 0, rotation: 0, pointerEvents: "none" });
          });
        }

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

        const distMult = isMobile ? 0.45 : isTablet ? 0.75 : 1.0;

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
            0.12 + v.delay
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
            0.14 + v.delay
          );
        });

        if (headlineWrapperRef.current) {
          tl.to(
            headlineWrapperRef.current,
            {
              opacity: 0,
              duration: 0.08,
              ease: "power1.out",
              onComplete: () => {
                if (headlineWrapperRef.current) headlineWrapperRef.current.style.display = "none";
              },
              onReverseComplete: () => {
                if (headlineWrapperRef.current) headlineWrapperRef.current.style.display = "flex";
              },
            },
            0.26
          );
        }

        tl.to(
          compactHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.18,
            ease: "power2.out",
          },
          0.30
        );

        let activeStep = -1;

        const triggerWheelStep = (step) => {
          if (step === activeStep || !isDesktop) return;
          activeStep = step;

          if (step === 0) {
            const c0 = circleRefs.current[0];
            const m0 = cardMediaRefs.current[0];
            if (c0 && m0) {
              c0.style.visibility = "visible";
              gsap.to(c0, { opacity: 1, duration: 0.22, overwrite: "auto" });
              gsap.from(m0, {
                scale: 0.92,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (wheelRef.current) {
              gsap.to(wheelRef.current, {
                rotation: s,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (circleRefs.current[1]) gsap.to(circleRefs.current[1], { opacity: 0, duration: 0.2 });
            if (circleRefs.current[2]) gsap.to(circleRefs.current[2], { opacity: 0, duration: 0.2 });
          } else if (step === 1) {
            const c1 = circleRefs.current[1];
            const m1 = cardMediaRefs.current[1];
            if (c1 && m1) {
              c1.style.visibility = "visible";
              gsap.to(c1, { opacity: 1, duration: 0.22, overwrite: "auto" });
              gsap.from(m1, {
                scale: 0.92,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (wheelRef.current) {
              gsap.to(wheelRef.current, {
                rotation: s / 2,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (circleRefs.current[0]) {
              circleRefs.current[0].style.visibility = "visible";
              gsap.to(circleRefs.current[0], { opacity: 1, duration: 0.22 });
            }
            if (circleRefs.current[2]) gsap.to(circleRefs.current[2], { opacity: 0, duration: 0.2 });
          } else if (step === 2) {
            const c2 = circleRefs.current[2];
            const m2 = cardMediaRefs.current[2];
            if (c2 && m2) {
              c2.style.visibility = "visible";
              gsap.to(c2, { opacity: 1, duration: 0.22, overwrite: "auto" });
              gsap.from(m2, {
                scale: 0.92,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (wheelRef.current) {
              gsap.to(wheelRef.current, {
                rotation: 0,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (circleRefs.current[0]) {
              circleRefs.current[0].style.visibility = "visible";
              gsap.to(circleRefs.current[0], { opacity: 1, duration: 0.22 });
            }
            if (circleRefs.current[1]) {
              circleRefs.current[1].style.visibility = "visible";
              gsap.to(circleRefs.current[1], { opacity: 1, duration: 0.22 });
            }
          }
        };

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: scrollDist,
          onUpdate: (self) => {
            const p = self.progress;

            if (!isDesktop) return;

            if (headlineWrapperRef.current) {
              if (p >= 0.28) {
                headlineWrapperRef.current.style.opacity = "0";
                headlineWrapperRef.current.style.display = "none";
              } else {
                headlineWrapperRef.current.style.display = "flex";
              }
            }

            if (p < 0.30) {
              if (activeStep !== -1) {
                activeStep = -1;
                circleRefs.current.forEach((el) => {
                  if (el) gsap.to(el, { opacity: 0, duration: 0.2 });
                });
              }
            } else if (p >= 0.30 && p < 0.46) {
              triggerWheelStep(0);
            } else if (p >= 0.46 && p < 0.62) {
              triggerWheelStep(1);
            } else if (p >= 0.62 && p < 0.78) {
              triggerWheelStep(2);
            }
          },
          onLeaveBack: () => {
            activeStep = -1;
            if (headlineWrapperRef.current) {
              headlineWrapperRef.current.style.display = "flex";
              headlineWrapperRef.current.style.opacity = "1";
            }
            if (isDesktop) {
              circleRefs.current.forEach((el) => {
                if (el) {
                  el.style.visibility = "hidden";
                  gsap.set(el, { opacity: 0 });
                }
              });
            }
          },
        });

        if (isDesktop) {
          tl.to(
            cardMediaRefs.current[0],
            {
              x: -390,
              y: 0,
              rotation: s,
              duration: 0.14,
              ease: "power2.out",
              pointerEvents: "auto",
            },
            0.78
          );

          tl.to(
            cardMediaRefs.current[1],
            {
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.14,
              ease: "power2.out",
              pointerEvents: "auto",
            },
            0.78
          );

          tl.to(
            cardMediaRefs.current[2],
            {
              x: 390,
              y: 0,
              rotation: -s,
              duration: 0.14,
              ease: "power2.out",
              pointerEvents: "auto",
            },
            0.78
          );
        } else {
          circleRefs.current.forEach((el) => {
            if (el) {
              el.style.visibility = "visible";
              gsap.set(el, { opacity: 1 });
            }
          });
          cardMediaRefs.current.forEach((el) => {
            if (el) gsap.set(el, { pointerEvents: "auto" });
          });
        }

        tl.to({}, { duration: 0.08 }, 0.92);
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
  }, []);

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
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] bg-[#050507] overflow-hidden flex flex-col justify-between py-4 sm:py-6 px-4 sm:px-8 select-none"
      >
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
            PHASE 1 & 2: MASSIVE EDITORIAL TYPOGRAPHY LAYER
            Wrapped in whitespace-nowrap spans to NEVER break words awkwardly!
            ============================================================ */}
        <div
          ref={headlineWrapperRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4 text-center will-change-transform"
          style={{ perspective: "1200px" }}
        >
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

          <h2 className="font-sans font-extrabold tracking-tight text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] leading-[1.06] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#B379FF] to-[#55A9FF] drop-shadow-[0_0_40px_rgba(194,138,255,0.45)] mt-2 sm:mt-3 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
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

          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#9898A6] max-w-lg font-medium">
            Choose the plan that works for your business.
          </p>
        </div>

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

        <div
          ref={wheelContainerRef}
          className="relative z-20 w-full flex-1 flex items-center justify-center overflow-hidden"
        >
          <div
            ref={wheelRef}
            className="hidden lg:block absolute will-change-transform"
            style={{
              width: "3600px",
              height: "3600px",
              top: "50%",
              left: "50%",
              marginLeft: "-1800px",
              marginTop: "0px",
              transformOrigin: "center center",
            }}
          >
            {PRICING_PLANS.map((plan, idx) => {
              const isAnnual = plan.id === "annual";
              const isSixMonths = plan.id === "six-months";

              return (
                <div
                  key={plan.id}
                  ref={(el) => (circleRefs.current[idx] = el)}
                  className="absolute inset-0 w-full h-full will-change-transform"
                  style={{
                    transformOrigin: "center center",
                    visibility: "hidden",
                    opacity: 0,
                  }}
                >
                  <div
                    ref={(el) => (cardMediaRefs.current[idx] = el)}
                    className="relative w-[340px] xl:w-[360px] mx-auto will-change-transform pointer-events-auto"
                    style={{
                      transform: "translateY(-50%)",
                      transformOrigin: "center center",
                    }}
                  >
                    <div
                      className={`relative rounded-2xl p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 backdrop-blur-2xl overflow-hidden group ${
                        isAnnual
                          ? "bg-[#12121A]/95 border-2 border-[#963DFF] shadow-[0_0_45px_rgba(150,61,255,0.3)]"
                          : isSixMonths
                          ? "bg-[#12121A]/90 border border-[#963DFF]/40 shadow-[0_15px_40px_rgba(0,0,0,0.7)]"
                          : "bg-[#12121A]/85 border border-white/[0.08] hover:border-white/[0.18] shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
                      }`}
                    >
                      <span className="absolute bottom-5 right-6 text-7xl font-mono font-black text-white/[0.04] pointer-events-none select-none">
                        {plan.number}
                      </span>

                      {isAnnual && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                          Best Value — Save ₹2,989
                        </div>
                      )}

                      <div className="relative z-10">
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

          <div className="lg:hidden w-full max-w-md mx-auto flex flex-col justify-center px-4">
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
                      ? "bg-[#12121A]/90 border border-[#963DFF]/40 shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
                      : "bg-[#12121A]/85 border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <span className="absolute bottom-4 right-5 text-6xl font-mono font-black text-white/[0.04] pointer-events-none select-none">
                    {plan.number}
                  </span>

                  {isAnnual && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                      Best Value — Save ₹2,989
                    </div>
                  )}

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
        </div>

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
