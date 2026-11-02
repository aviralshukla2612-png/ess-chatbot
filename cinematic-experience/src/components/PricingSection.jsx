import React, { useEffect, useRef, useState } from "react";
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
    billingNote: "Cancel according to subscription terms",
    savings: null,
    popular: false,
    features: [
      "1 account",
      "1 chatbot",
      "7-day free trial",
      "Cancel according to subscription terms",
    ],
    ctaText: "Start 7-Day Free Trial",
  },
  {
    id: "six-months",
    name: "Six Months",
    tagline: "Commercial Half-Year Access",
    price: "₹5,999",
    period: "/ 6 months",
    billingNote: "Billed every 6 months",
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
    billingNote: "Billed annually",
    savings: "Save ₹2,989 compared with twelve monthly payments",
    popular: true,
    features: [
      "1 account",
      "1 chatbot",
      "7-day free trial",
      "Save ₹2,989 compared with twelve monthly payments",
    ],
    ctaText: "Start 7-Day Free Trial",
  },
];

export default function PricingSection({ onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const introHeadlineRef = useRef(null);
  const introLine1Ref = useRef(null);
  const introLine2Ref = useRef(null);
  const introSubRef = useRef(null);
  const compactHeaderRef = useRef(null);
  const cardsWrapperRef = useRef(null);
  const cardRefs = useRef([]);

  const [activePlan, setActivePlan] = useState("annual");

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
          // Keep static readable layout without animation
          return;
        }

        const scrollDist = isDesktop ? "+=2600" : isTablet ? "+=2000" : "+=1600";

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
        // PHASE 1 (0.00 -> 0.20): Full intro visible in center
        // ============================================================

        // Set initial card states (hidden, overlapped in center with slight rotation)
        gsap.set(cardRefs.current[0], {
          xPercent: isDesktop ? 60 : 0,
          yPercent: isDesktop ? 20 : 40,
          rotation: isDesktop ? -10 : -4,
          scale: 0.82,
          opacity: 0,
          zIndex: 1,
        });

        gsap.set(cardRefs.current[1], {
          xPercent: 0,
          yPercent: isDesktop ? -10 : 0,
          rotation: 0,
          scale: 0.88,
          opacity: 0,
          zIndex: 3,
        });

        gsap.set(cardRefs.current[2], {
          xPercent: isDesktop ? -60 : 0,
          yPercent: isDesktop ? 20 : -40,
          rotation: isDesktop ? 10 : 4,
          scale: 0.82,
          opacity: 0,
          zIndex: 2,
        });

        gsap.set(compactHeaderRef.current, {
          opacity: 0,
          y: -20,
        });

        // ============================================================
        // PHASE 2 (0.20 -> 0.45): Headline Separates & Panels Emerge
        // ============================================================
        // Headline line 1 splits up-left
        tl.to(
          introLine1Ref.current,
          {
            x: isDesktop ? -120 : -40,
            y: isDesktop ? -60 : -30,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.28,
            ease: "power2.inOut",
          },
          0.18
        );

        // Headline line 2 splits up-right
        tl.to(
          introLine2Ref.current,
          {
            x: isDesktop ? 120 : 40,
            y: isDesktop ? -60 : -30,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.28,
            ease: "power2.inOut",
          },
          0.18
        );

        // Subtitle fades out
        tl.to(
          introSubRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 0.2,
            ease: "power2.out",
          },
          0.16
        );

        // Compact header fades in at top
        tl.to(
          compactHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          0.32
        );

        // Three panels emerge from the headline composition with different timings & rotation
        // Card 1 (Monthly) enters from left-center
        tl.to(
          cardRefs.current[0],
          {
            opacity: 1,
            xPercent: isDesktop ? 40 : 0,
            yPercent: isDesktop ? 15 : 25,
            rotation: isDesktop ? -8 : -3,
            scale: 0.86,
            duration: 0.28,
            ease: "power1.out",
          },
          0.22
        );

        // Card 2 (Six Months) enters center
        tl.to(
          cardRefs.current[1],
          {
            opacity: 1,
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 0.92,
            duration: 0.26,
            ease: "power1.out",
          },
          0.26
        );

        // Card 3 (Annual) enters from right-center
        tl.to(
          cardRefs.current[2],
          {
            opacity: 1,
            xPercent: isDesktop ? -40 : 0,
            yPercent: isDesktop ? 15 : -25,
            rotation: isDesktop ? 8 : 3,
            scale: 0.86,
            duration: 0.28,
            ease: "power1.out",
          },
          0.24
        );

        // ============================================================
        // PHASE 3 (0.45 -> 0.75): Cards rotate, overlap & spread apart
        // ============================================================
        tl.to(
          cardRefs.current[0],
          {
            xPercent: isDesktop ? 15 : 0,
            yPercent: 0,
            rotation: isDesktop ? -3 : 0,
            scale: 0.95,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.45
        );

        tl.to(
          cardRefs.current[1],
          {
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 1.0,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.45
        );

        tl.to(
          cardRefs.current[2],
          {
            xPercent: isDesktop ? -15 : 0,
            yPercent: 0,
            rotation: isDesktop ? 3 : 0,
            scale: 0.95,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.45
        );

        // ============================================================
        // PHASE 4 (0.72 -> 0.92): Final Assembly into Balanced Layout
        // ============================================================
        tl.to(
          cardRefs.current[0],
          {
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 1.0,
            pointerEvents: "auto",
            duration: 0.25,
            ease: "power2.out",
          },
          0.72
        );

        tl.to(
          cardRefs.current[1],
          {
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 1.0,
            pointerEvents: "auto",
            duration: 0.25,
            ease: "power2.out",
          },
          0.72
        );

        tl.to(
          cardRefs.current[2],
          {
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 1.0,
            pointerEvents: "auto",
            duration: 0.25,
            ease: "power2.out",
          },
          0.72
        );

        // Buffer hold: (0.92 -> 1.00) Cards remain completely stable and readable
        tl.to({}, { duration: 0.15 }, 0.92);
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
      {/* PINNED STAGE (Controlled by ScrollTrigger scrub) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] max-h-[1080px] bg-[#050507] overflow-hidden flex flex-col justify-between py-6 sm:py-8 lg:py-10 px-4 sm:px-8 lg:px-12 select-none"
      >
        {/* Subtle Technical Grid Background & Ambient Purple Lighting */}
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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#963DFF]/15 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#55A9FF]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Eyebrow Badge (Always visible at top) */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF]">
            <span>/ TRANSPARENT PRICING</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>7-Day Evaluation Included</span>
          </div>
        </div>

        {/* ============================================================
            PHASE 1: EDITORIAL HEADLINE INTRODUCTION (Center Screen)
            Separates and transforms as user scrolls
            ============================================================ */}
        <div
          ref={introHeadlineRef}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4 text-center"
        >
          <h2 className="font-sans font-extrabold tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.98] uppercase">
            <span
              ref={introLine1Ref}
              className="inline-block text-white will-change-transform drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
            >
              Simple Pricing.
            </span>
            <br />
            <span
              ref={introLine2Ref}
              className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#B379FF] to-[#55A9FF] will-change-transform drop-shadow-[0_0_35px_rgba(194,138,255,0.45)] mt-1 sm:mt-2"
            >
              Powerful Conversations.
            </span>
          </h2>

          <p
            ref={introSubRef}
            className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#9898A6] max-w-lg font-medium will-change-transform"
          >
            Choose the plan that works for your business.
          </p>
        </div>

        {/* ============================================================
            COMPACT HEADER (Fades in at top during Phase 2-4)
            ============================================================ */}
        <div
          ref={compactHeaderRef}
          className="relative z-20 w-full max-w-4xl mx-auto text-center will-change-transform pt-2"
        >
          <h3 className="font-sans font-extrabold tracking-tight text-2xl sm:text-3xl md:text-4xl text-white uppercase leading-tight">
            <span>Simple Pricing. </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] to-[#55A9FF]">
              Powerful Conversations.
            </span>
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#9898A6]">
            Choose the plan that works for your business.
          </p>
        </div>

        {/* Mobile Plan Quick Switcher (Visible on small screens) */}
        <div className="relative z-20 sm:hidden flex justify-center mt-2 mb-1">
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
            PHASE 3 & 4: THREE-CARD ASSEMBLY (3 Column Layout)
            Cards emerge, overlap, rotate and settle into 3 columns
            ============================================================ */}
        <div
          ref={cardsWrapperRef}
          className="relative z-20 w-full max-w-6xl mx-auto my-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-stretch px-2 sm:px-4"
        >
          {PRICING_PLANS.map((plan, idx) => {
            const isAnnual = plan.id === "annual";
            const isMobileHidden = activePlan !== plan.id;
            return (
              <div
                key={plan.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                className={`relative rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 will-change-transform backdrop-blur-xl ${
                  isAnnual
                    ? "bg-[#12121A]/95 border-2 border-[#963DFF] shadow-[0_0_40px_rgba(150,61,255,0.25)]"
                    : "bg-[#12121A]/80 border border-white/[0.08] hover:border-white/[0.18] shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
                } ${isMobileHidden ? "hidden sm:flex" : "flex"}`}
              >
                {/* Popular Savings Badge for Annual */}
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

                  {/* Feature Checklist (Exact user specifications) */}
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

        {/* Bottom Security / Trial Assurance Bar */}
        <div className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold pt-2 px-2">
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
