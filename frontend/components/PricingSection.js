"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

const HEADLINE_LINE1 = "SIMPLE PRICING.";
const HEADLINE_LINE2 = "POWERFUL CONVERSATIONS.";

// Precompute deterministic 3D explosion vectors for every letter (Physics scatter inspired by Made With GSAP)
function computeExplosionVectors(text, isTopLine) {
  const chars = text.split("");
  const mid = (chars.length - 1) / 2;

  return chars.map((char, i) => {
    if (char === " ") return null;
    const relX = (i - mid) / mid; // -1 to +1
    const seed = ((i * 7 + (isTopLine ? 13 : 29)) % 11) / 11;
    const seed2 = ((i * 13 + (isTopLine ? 5 : 17)) % 7) / 7;

    const x = Math.round(relX * (isTopLine ? 440 : 500) + (seed - 0.5) * 160);
    const y = isTopLine
      ? Math.round(-190 - Math.abs(relX) * 170 - seed * 150)
      : Math.round(190 + Math.abs(relX) * 170 + seed * 150);
    const z = Math.round((seed2 - 0.5) * 400);
    const rotateZ = Math.round(relX * 65 + (seed - 0.5) * 60);
    const rotateX = Math.round((seed - 0.5) * 100);
    const rotateY = Math.round((seed2 - 0.5) * 100);
    const scale = Number((0.35 + seed * 0.75).toFixed(2));
    const delay = Number((Math.abs(relX) * 0.08 + seed * 0.04).toFixed(3));

    return { char, i, x, y, z, rotateZ, rotateX, rotateY, scale, delay };
  });
}

export default function PricingSection({ isAuthenticated = false, onOpenTrial }) {
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

  const line1Vectors = useMemo(() => computeExplosionVectors(HEADLINE_LINE1, true), []);
  const line2Vectors = useMemo(() => computeExplosionVectors(HEADLINE_LINE2, false), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
          gsap.set(circleRefs.current, { opacity: 1, visibility: "visible", rotation: 0 });
          gsap.set(cardMediaRefs.current, { scale: 1, rotation: 0, x: 0, y: 0, pointerEvents: "auto" });
          gsap.set(compactHeaderRef.current, { opacity: 1, y: 0 });
          gsap.set(headlineWrapperRef.current, { display: "none" });
          return;
        }

        const scrollDist = isDesktop ? "+=3000" : isTablet ? "+=2400" : "+=1800";

        // ============================================================
        // 1. INITIAL SETUP
        // ============================================================
        // Reset headline characters
        line1CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
        });
        line2CharRefs.current.forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
        });

        gsap.set(compactHeaderRef.current, { opacity: 0, y: -20 });

        // Wheel step angle (s = 7.2 degrees, matching madewithgsap.com's s = 6.2)
        const s = 7.2;

        if (isDesktop) {
          // Reset wheel & cards
          gsap.set(wheelRef.current, { rotation: 0 });
          circleRefs.current.forEach((el) => {
            if (el) gsap.set(el, { opacity: 0, visibility: "hidden", rotation: 0 });
          });
          cardMediaRefs.current.forEach((el) => {
            if (el) gsap.set(el, { scale: 1, x: 0, y: 0, rotation: 0, pointerEvents: "none" });
          });
        }

        // ============================================================
        // 2. MASTER SCRUBBED TIMELINE (Headline Explosion & Phase Sync)
        // ============================================================
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

        // Phase 1 -> 2 (0.16 -> 0.36): Headline Characters Burst Outward
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
            0.16 + v.delay
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
            0.18 + v.delay
          );
        });

        // Compact top header reveals as headline clears
        tl.to(
          compactHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.20,
            ease: "power2.out",
          },
          0.32
        );

        // ============================================================
        // 3. MADE WITH GSAP ROTATING WHEEL STEP CONTROLLER (0.35 -> 0.78)
        // Dynamically springs cards in with elastic.out(0.6, 0.3)
        // ============================================================
        let activeStep = -1;

        const triggerWheelStep = (step) => {
          if (step === activeStep || !isDesktop) return;
          const prev = activeStep;
          activeStep = step;

          if (step === 0) {
            // Card 0 (Monthly) emerges into apex center
            const c0 = circleRefs.current[0];
            const m0 = cardMediaRefs.current[0];
            if (c0 && m0) {
              c0.style.visibility = "visible";
              gsap.to(c0, { opacity: 1, duration: 0.25, overwrite: "auto" });
              gsap.set(c0, { rotation: 0 });
              gsap.from(m0, {
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
            if (circleRefs.current[1]) gsap.to(circleRefs.current[1], { opacity: 0, duration: 0.2 });
            if (circleRefs.current[2]) gsap.to(circleRefs.current[2], { opacity: 0, duration: 0.2 });
          } else if (step === 1) {
            // Card 1 (Six Months) pops in, wheel counter-rotates to -s/2 (-3.6deg)
            const c1 = circleRefs.current[1];
            const m1 = cardMediaRefs.current[1];
            if (c1 && m1) {
              c1.style.visibility = "visible";
              gsap.to(c1, { opacity: 1, duration: 0.25, overwrite: "auto" });
              gsap.set(c1, { rotation: s });
              gsap.from(m1, {
                scale: 0.92,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (wheelRef.current) {
              gsap.to(wheelRef.current, {
                rotation: -s / 2,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (circleRefs.current[0]) {
              circleRefs.current[0].style.visibility = "visible";
              gsap.to(circleRefs.current[0], { opacity: 1, duration: 0.25 });
            }
            if (circleRefs.current[2]) gsap.to(circleRefs.current[2], { opacity: 0, duration: 0.2 });
          } else if (step === 2) {
            // Card 2 (Annual) pops in, wheel counter-rotates to -s (-7.2deg)
            // Left card at -7.2deg, Center at 0deg, Right at +7.2deg
            const c2 = circleRefs.current[2];
            const m2 = cardMediaRefs.current[2];
            if (c2 && m2) {
              c2.style.visibility = "visible";
              gsap.to(c2, { opacity: 1, duration: 0.25, overwrite: "auto" });
              gsap.set(c2, { rotation: 2 * s });
              gsap.from(m2, {
                scale: 0.92,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (wheelRef.current) {
              gsap.to(wheelRef.current, {
                rotation: -s,
                ease: "elastic.out(0.6, 0.3)",
                duration: 0.55,
                overwrite: "auto",
              });
            }
            if (circleRefs.current[0]) {
              circleRefs.current[0].style.visibility = "visible";
              gsap.to(circleRefs.current[0], { opacity: 1, duration: 0.25 });
            }
            if (circleRefs.current[1]) {
              circleRefs.current[1].style.visibility = "visible";
              gsap.to(circleRefs.current[1], { opacity: 1, duration: 0.25 });
            }
          }
        };

        // ScrollTrigger onUpdate listener coordinating wheel thresholds
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: scrollDist,
          onUpdate: (self) => {
            const p = self.progress;

            if (!isDesktop) return;

            if (p < 0.34) {
              if (activeStep !== -1) {
                activeStep = -1;
                circleRefs.current.forEach((el) => {
                  if (el) gsap.to(el, { opacity: 0, duration: 0.2 });
                });
              }
            } else if (p >= 0.34 && p < 0.48) {
              triggerWheelStep(0);
            } else if (p >= 0.48 && p < 0.62) {
              triggerWheelStep(1);
            } else if (p >= 0.62 && p < 0.78) {
              triggerWheelStep(2);
            }
          },
          onLeaveBack: () => {
            activeStep = -1;
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

        // ============================================================
        // 4. PHASE 4 & 5 (0.78 -> 1.00): UN-TILT & FAN OUT INTO 3 COLUMNS
        // Cards ease from wheel arc into level side-by-side composition
        // ============================================================
        if (isDesktop) {
          // Spread Card 0 horizontally left and un-tilt to 0deg
          tl.to(
            cardMediaRefs.current[0],
            {
              x: -375,
              y: 0,
              rotation: s, // counter-acts wheel rotation -s so card is exactly 0deg level
              duration: 0.14,
              ease: "power2.out",
              pointerEvents: "auto",
            },
            0.78
          );

          // Card 1 stays in center, un-tilts
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

          // Spread Card 2 horizontally right and un-tilt to 0deg
          tl.to(
            cardMediaRefs.current[2],
            {
              x: 375,
              y: 0,
              rotation: -s, // counter-acts wheel rotation so card is exactly 0deg level
              duration: 0.14,
              ease: "power2.out",
              pointerEvents: "auto",
            },
            0.78
          );
        } else {
          // Mobile / Tablet presentation
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

        // Buffer hold (0.92 -> 1.00): Stable reading and interaction
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

  const getCheckoutUrl = (planId) => {
    return isAuthenticated ? `/billing?plan=${planId}` : `/register?plan=${planId}`;
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
            PHASE 1 & 2: MASSIVE TYPOGRAPHY LAYER (EXPLODING CHARACTERS)
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
            PHASE 3, 4 & 5: THE MADE WITH GSAP ROTATING WHEEL
            Radius: 1800px (3600px diameter circle).
            The top edge of the circle is placed right at 50vh (center of pinned stage).
            Each card sits at the apex and swings in an arc with elastic bounce.
            ============================================================ */}
        <div
          ref={wheelContainerRef}
          className="relative z-20 w-full flex-1 flex items-center justify-center overflow-hidden"
        >
          {/* DESKTOP ROTATING WHEEL */}
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
                      {/* Oversized Signature Watermark Number (Inspired by Made With GSAP 1, 2, 3) */}
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
                      <div className="relative z-10 pt-2">
                        <Link
                          href={getCheckoutUrl(plan.id)}
                          className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                            isAnnual
                              ? "bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] text-white hover:shadow-[0_0_24px_rgba(150,61,255,0.45)]"
                              : "bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1]"
                          }`}
                        >
                          <span>{plan.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLET & MOBILE RESPONSIVE STACK (Clean, swipeable & switcher compatible) */}
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
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
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
                    <Link
                      href={getCheckoutUrl(plan.id)}
                      className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                        isAnnual
                          ? "bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] text-white"
                          : "bg-white/[0.06] text-white border border-white/[0.1]"
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
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
