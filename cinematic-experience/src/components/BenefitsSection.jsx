"use client";

import React, { useEffect, useRef, useState } from "react";
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
  ArrowUpRight,
  ArrowRight,
  Headphones,
  Rocket,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Crosshair / Plus icon identical to Trionn
const PlusDivider = () => (
  <span className="mx-6 sm:mx-10 text-[#C653FF] font-light text-2xl sm:text-4xl select-none inline-block">
    +
  </span>
);

// Marquee phrases containing user's exact requested line + chatbot-related terms
const MARQUEE_ITEMS = [
  "Don't Let Valuable Conversations Slip Away",
  "Capture Every Lead",
  "Qualify 24/7",
  "Convert In Real-Time",
  "Autonomous Sales AI",
  "Sub-Second Intelligence",
  "Scale Revenue Pipeline",
  "Zero Hallucination",
];

// Marquee track component where ALL texts uniformly use the purple-to-blue gradient
const MarqueeTrack = () => (
  <div className="shrink-0 flex items-center uppercase font-headline font-black text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[6.25rem] tracking-tight leading-[1.1] py-4 drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
    {MARQUEE_ITEMS.map((item, idx) => (
      <React.Fragment key={idx}>
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF]">
          {item}
        </span>
        <PlusDivider />
      </React.Fragment>
    ))}
  </div>
);

// Bespoke Illustrated SVG Icons matching Dribbble reference style
const EngagementIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" fill="#00D98B" fillOpacity="0.12" />
    <path d="M16 32 C16 21 23 14 32 14 C41 14 48 21 48 32" stroke="#00D98B" strokeWidth="3" strokeLinecap="round" />
    <rect x="13" y="28" width="6" height="12" rx="3" fill="#FFFFFF" stroke="#00D98B" strokeWidth="2.5" />
    <rect x="45" y="28" width="6" height="12" rx="3" fill="#FFFFFF" stroke="#00D98B" strokeWidth="2.5" />
    <path d="M47 38 C47 45 42 48 35 48" stroke="#00D98B" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="33" cy="48" r="3" fill="#00D98B" />
    <g filter="drop-shadow(0px 3px 6px rgba(0, 217, 139, 0.4))">
      <path d="M24 24 H40 C43 24 45 26 45 29 V37 C45 40 43 42 40 42 H32 L27 46 V42 H24 C21 42 19 40 19 37 V29 C19 26 21 24 24 24 Z" fill="#00D98B" />
      <circle cx="27" cy="33" r="2" fill="#FFFFFF" />
      <circle cx="32" cy="33" r="2" fill="#FFFFFF" />
      <circle cx="37" cy="33" r="2" fill="#FFFFFF" />
    </g>
    <circle cx="49" cy="18" r="3" fill="#00D98B" />
    <circle cx="49" cy="18" r="5" stroke="#00D98B" strokeWidth="1" strokeOpacity="0.5" />
  </svg>
);

const AutomationIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" fill="#C653FF" fillOpacity="0.12" />
    <path d="M16 24 H26 M38 24 H48 M16 40 H24 M40 40 H48 M32 14 V22 M32 42 V50" stroke="#C653FF" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
    <rect x="22" y="20" width="20" height="24" rx="5" fill="#FFFFFF" stroke="#C653FF" strokeWidth="2.5" />
    <rect x="26" y="25" width="12" height="14" rx="3" fill="#F3E8FF" stroke="#C653FF" strokeWidth="1.5" />
    <path d="M29 32 C29 30 31 29 32 32 C33 35 35 34 35 32" stroke="#C653FF" strokeWidth="1.8" strokeLinecap="round" />
    <g filter="drop-shadow(0px 3px 6px rgba(198, 83, 255, 0.45))">
      <circle cx="44" cy="44" r="12" fill="#C653FF" />
      <path d="M45 38 L41 44 H45 L43 50 L48 43 H44 L46 38 Z" fill="#FFFFFF" />
    </g>
    <circle cx="15" cy="24" r="2.5" fill="#C653FF" />
    <circle cx="49" cy="24" r="2.5" fill="#C653FF" />
  </svg>
);

const EnquiryIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" fill="#009DFF" fillOpacity="0.12" />
    <rect x="14" y="16" width="36" height="32" rx="6" fill="#FFFFFF" stroke="#009DFF" strokeWidth="2.5" />
    <rect x="20" y="34" width="4" height="8" rx="1.5" fill="#BAE6FD" />
    <rect x="27" y="28" width="4" height="14" rx="1.5" fill="#38BDF8" />
    <rect x="34" y="22" width="4" height="20" rx="1.5" fill="#009DFF" />
    <path d="M19 32 L28 25 L36 21 L43 17" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M39 17 H43 V21" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <g filter="drop-shadow(0px 3px 6px rgba(0, 157, 255, 0.45))">
      <circle cx="44" cy="44" r="12" fill="#009DFF" />
      <circle cx="44" cy="44" r="6" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="44" cy="2" r="2" fill="#FFFFFF" />
    </g>
    <circle cx="12" cy="18" r="1.5" fill="#009DFF" />
    <circle cx="53" cy="28" r="1.5" fill="#38BDF8" />
  </svg>
);

// 3 Benefit Cards matching Shutterstock Numbered Card Architecture
const BENEFIT_CARDS = [
  {
    step: "01",
    accentColor: "#00D98B",
    buttonTextColor: "#000000",
    tagline: "CARD 01 · 24/7 AVAILABILITY",
    title: "Customer Engagement",
    subTitle: "Always-On Conversations",
    kicker: "NEVER MISS AN ENQUIRY",
    icon: EngagementIcon,
    description: "Answer customer questions instantly using your approved business information, even outside working hours. Guide visitors towards qualified leads.",
    feature: "24/7 autonomous engagement & lead capture",
    ctaText: "Explore Engagement",
  },
  {
    step: "02",
    accentColor: "#C653FF",
    buttonTextColor: "#FFFFFF",
    tagline: "CARD 02 · SMART AUTOMATION",
    title: "Intelligent Automation",
    subTitle: "Less Manual Work",
    kicker: "LET AI HANDLE REPETITIVE QUESTIONS",
    icon: AutomationIcon,
    description: "Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business details.",
    feature: "Grounded in approved business knowledge only",
    ctaText: "Automate Repetitive Work",
  },
  {
    step: "03",
    accentColor: "#009DFF",
    buttonTextColor: "#FFFFFF",
    tagline: "CARD 03 · BUSINESS INSIGHTS",
    title: "Enquiry Visibility",
    subTitle: "Turn Chats Into Opportunities",
    kicker: "STAY CONNECTED TO CUSTOMER INTEREST",
    icon: EnquiryIcon,
    description: "View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for in real-time.",
    feature: "Direct CRM sync & instant opportunity logging",
    ctaText: "View Live Dashboard",
  },
];

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const visionRef = useRef(null);
  const sectionHeaderRef = useRef(null);
  const cardsTrackRef = useRef(null);
  const cardRefs = useRef([]);

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const touchStartX = useRef(0);

  const scrollToCard = (index) => {
    const st = ScrollTrigger.getById("benefits-st");
    if (st) {
      const targets = [0.24, 0.58, 0.88];
      const targetY = st.start + targets[index] * (st.end - st.start);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
    setActiveCardIndex(index);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0 && activeCardIndex < 2) {
        scrollToCard(activeCardIndex + 1);
      } else if (diffX < 0 && activeCardIndex > 0) {
        scrollToCard(activeCardIndex - 1);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // =========================================================================
    // MOBILE TIMELINE (< 768px): Card 01 -> Card 02 -> Card 03 sequential scroll
    // =========================================================================
    mm.add("(max-width: 767px)", () => {
      if (visionRef.current) {
        gsap.set(visionRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });
      }
      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -15 });
      }
      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, { opacity: 0, xPercent: 0 });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            opacity: idx === 0 ? 0 : 0.4,
            scale: 0.95,
            y: 20,
            force3D: true,
          });
        }
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "benefits-st",
          trigger: container,
          start: "top top",
          end: "+=1600",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.75,
          pinSpacing: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.44) {
              setActiveCardIndex(0);
            } else if (p < 0.74) {
              setActiveCardIndex(1);
            } else {
              setActiveCardIndex(2);
            }
          },
        },
      });

      // 1. Vision fades out
      if (visionRef.current) {
        tl.to(
          visionRef.current,
          {
            opacity: 0,
            scale: 1.06,
            filter: "blur(6px)",
            duration: 0.12,
            ease: "power2.inOut",
            pointerEvents: "none",
          },
          0.02
        );
      }

      // 2. Header fades in
      if (sectionHeaderRef.current) {
        tl.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.12,
            ease: "power3.out",
          },
          0.08
        );
      }

      // 3. Track & Card 01 enters
      if (cardsTrackRef.current) {
        tl.to(
          cardsTrackRef.current,
          {
            opacity: 1,
            duration: 0.12,
            ease: "power2.out",
          },
          0.10
        );
      }
      if (cardRefs.current[0]) {
        tl.to(
          cardRefs.current[0],
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.14,
            ease: "power3.out",
          },
          0.10
        );
      }

      // Hold on Card 01 (0.24 to 0.38)

      // 4. Slide to Card 02 (Card 02 COMES IN FRONT & CENTER)
      if (cardsTrackRef.current) {
        tl.to(
          cardsTrackRef.current,
          {
            xPercent: -100,
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.38
        );
      }
      if (cardRefs.current[1]) {
        tl.to(
          cardRefs.current[1],
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.16,
            ease: "power3.out",
          },
          0.40
        );
      }

      // Hold on Card 02 (0.54 to 0.68)

      // 5. Slide to Card 03 (Card 03 COMES IN FRONT & CENTER)
      if (cardsTrackRef.current) {
        tl.to(
          cardsTrackRef.current,
          {
            xPercent: -200,
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.68
        );
      }
      if (cardRefs.current[2]) {
        tl.to(
          cardRefs.current[2],
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.16,
            ease: "power3.out",
          },
          0.70
        );
      }

      // Hold on Card 03
      tl.to({}, { duration: 0.16 }, 0.84);
    });

    // =========================================================================
    // DESKTOP & TABLET TIMELINE (>= 768px): All 3 cards side-by-side in 3 cols
    // =========================================================================
    mm.add("(min-width: 768px)", () => {
      if (visionRef.current) {
        gsap.set(visionRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });
      }
      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -20 });
      }
      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, { opacity: 0, xPercent: 0 });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            rotateX: -35,
            y: 30 + idx * 10,
            opacity: 0,
            scale: 0.95,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "benefits-st",
          trigger: container,
          start: "top top",
          end: "+=1200",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.75,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      // 1. Opening Vision fades out
      if (visionRef.current) {
        tl.to(
          visionRef.current,
          {
            opacity: 0,
            scale: 1.08,
            filter: "blur(8px)",
            duration: 0.28,
            ease: "power2.inOut",
            pointerEvents: "none",
          },
          0.06
        );
      }

      // 2. Persistent Section Header fades in
      if (sectionHeaderRef.current) {
        tl.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "power3.out",
          },
          0.14
        );
      }

      // 3. Cards Track fades in and 3D unfolds together
      if (cardsTrackRef.current) {
        tl.to(
          cardsTrackRef.current,
          {
            opacity: 1,
            duration: 0.30,
            ease: "power2.out",
          },
          0.16
        );
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          tl.to(
            card,
            {
              rotateX: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.34,
              ease: "power3.out",
              force3D: true,
            },
            0.18 + idx * 0.08
          );
        }
      });

      // Hold comfortable reading state
      tl.to({}, { duration: 0.4 }, 0.6);
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="benefits"
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* Scoped CSS for smooth infinite marquee and hidden scrollbars */}
      <style>{`
        @keyframes benefitsMarqueeLoop {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .benefits-infinite-track {
          display: flex;
          width: max-content;
          animation: benefitsMarqueeLoop 30s linear infinite;
          will-change: transform;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* PINNED STAGE VIEWPORT (100dvh FOR MOBILE/SAFARI — NO CUT-OFF, NO BLACKOUT) */}
      {/* ========================================================================= */}
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden bg-[#050507] flex flex-col justify-between pt-16 sm:pt-20 lg:pt-22 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8"
        style={{
          minHeight: "100dvh",
          height: "100dvh",
          perspective: "1500px",
        }}
      >
        {/* Subtle Technical Grid Background without any purple tint */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />

        {/* ======================================================================= */}
        {/* PHASE 1: FULLSCREEN MARQUEE & INTRO (LAYER 30 - FADES ON SCROLL)        */}
        {/* ======================================================================= */}
        <div
          ref={visionRef}
          className="absolute inset-0 z-30 flex flex-col justify-between py-12 sm:py-16 px-6 sm:px-14 pointer-events-none select-none"
        >
          {/* Top Vision Title */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-[#A1A1AA] font-bold">
                Focused Intelligence.
              </span>
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-white font-extrabold">
                Measured Commercial Execution.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-mono tracking-widest uppercase text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00D98B] animate-pulse" />
              <span>Scroll To Reveal 24/7 AI Assistance</span>
            </div>
          </div>

          {/* Center Giant Infinite Looping Sliced Marquee */}
          <div className="relative z-10 overflow-hidden w-full py-8 sm:py-12 select-none my-auto">
            <div className="benefits-infinite-track flex whitespace-nowrap will-change-transform py-2">
              <MarqueeTrack />
              <div aria-hidden="true" className="shrink-0 flex items-center">
                <MarqueeTrack />
              </div>
            </div>
          </div>

          {/* Bottom Vision Subtitle */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70 line-clamp-1">
              ✦ Don&apos;t let valuable conversations slip away — autonomous 24/7 sales.
            </span>
            <span className="hidden sm:inline-block font-mono text-xs tracking-widest uppercase text-white/40">
              [ 01 — 03 CORE ADVANTAGES ]
            </span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* PHASE 2: PERSISTENT SECTION HEADER (EXACT USER HEADING & PARAGRAPH)     */}
        {/* ======================================================================= */}
        <div
          ref={sectionHeaderRef}
          className="relative z-20 max-w-4xl mx-auto text-center shrink-0 pt-1 pb-1 sm:pb-2 px-2"
        >
          <h2 className="font-headline font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-md">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-[#C5CAD4] font-medium max-w-2xl mx-auto leading-relaxed">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
          </p>
        </div>

        {/* ======================================================================= */}
        {/* 3 BENEFIT CARDS (SEQUENTIAL SLIDE ON PHONE, 3-COL ON TABLET/DESKTOP)    */}
        {/* ======================================================================= */}
        <div
          className="relative z-20 w-full max-w-[340px] sm:max-w-[380px] md:max-w-7xl mx-auto overflow-hidden md:overflow-visible my-auto px-2 md:px-0 py-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={cardsTrackRef}
            className="key-card-list flex w-full md:grid md:grid-cols-3 gap-0 md:gap-4 lg:gap-6 items-stretch will-change-transform"
            style={{
              perspective: "1400px",
              transformStyle: "preserve-3d",
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
          >
            {BENEFIT_CARDS.map((card, idx) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.step}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  data-kf-card="true"
                  className="featured-card group relative w-full shrink-0 flex-none md:w-auto md:shrink md:flex-initial rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none border-2 will-change-transform backface-hidden"
                  style={{
                    backgroundColor: "#0D0D15",
                    borderColor: card.accentColor,
                    boxShadow: `0 0 25px ${card.accentColor}25, 0 16px 40px rgba(0,0,0,0.8)`,
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    WebkitTransform: "translateZ(0)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = card.accentColor;
                    e.currentTarget.style.boxShadow = `0 0 45px ${card.accentColor}45, 0 20px 50px rgba(0,0,0,0.9)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = card.accentColor;
                    e.currentTarget.style.boxShadow = `0 0 25px ${card.accentColor}25, 0 16px 40px rgba(0,0,0,0.8)`;
                  }}
                >
                  {/* Top Row: Watermark Number (left) + Horizontal Accent Bar (right) */}
                  <div className="flex items-center justify-between w-full mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white/20 group-hover:text-white/40 transition-colors select-none">
                      {card.step}
                    </span>
                    <div
                      className="w-10 sm:w-12 lg:w-14 h-1.5 sm:h-2 rounded-full transition-transform duration-300 group-hover:scale-x-110 shadow-xs"
                      style={{ backgroundColor: card.accentColor }}
                    />
                  </div>

                  {/* Upper Center: Prominent Illustrated Icon */}
                  <div className="my-2 sm:my-3 lg:my-4 flex justify-center w-full">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${card.accentColor}18`,
                        border: `1.5px solid ${card.accentColor}50`,
                        boxShadow: `0 0 25px ${card.accentColor}25`,
                      }}
                    >
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11" />
                    </div>
                  </div>

                  {/* Middle: Centered Heading & Structured Description */}
                  <div className="text-center space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 flex-1 flex flex-col justify-center">
                    <span
                      className="text-[9px] sm:text-[10px] lg:text-[11px] font-mono font-bold uppercase tracking-wider block"
                      style={{ color: card.accentColor }}
                    >
                      {card.tagline}
                    </span>
                    <h3
                      style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                      className="font-extrabold text-xs sm:text-sm lg:text-base tracking-tight uppercase"
                    >
                      {card.title}
                    </h3>
                    <p
                      style={{ color: "#9898A6", WebkitTextFillColor: "#9898A6" }}
                      className="text-[11px] sm:text-xs leading-relaxed line-clamp-3 px-1 font-normal"
                    >
                      {card.description}
                    </p>
                    <div className="pt-0.5">
                      <span
                        style={{ color: "#E4E4E7", backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.12)" }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono border"
                      >
                        ✦ {card.feature}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Solid Colored Button Matching the Top Accent Bar */}
                  <div className="w-full pt-1 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (card.ctaText === "View Live Dashboard") {
                          window.location.href = "/login";
                        } else if (onOpenTrial) {
                          onOpenTrial();
                        } else {
                          window.location.href = "/login";
                        }
                      }}
                      className="w-full py-2 sm:py-2.5 lg:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer hover:brightness-110 active:scale-[0.98]"
                      style={{
                        backgroundColor: card.accentColor,
                        color: card.buttonTextColor || "#FFFFFF",
                        boxShadow: `0 4px 20px ${card.accentColor}35`,
                      }}
                    >
                      <span>{card.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Swipe / Arrow Navigation Controls (visible only on small screens < md) */}
        <div className="flex md:hidden items-center justify-center gap-3 pt-1 pb-1 z-20">
          <button
            type="button"
            onClick={() => scrollToCard(Math.max(0, activeCardIndex - 1))}
            disabled={activeCardIndex === 0}
            className="p-1 rounded-full text-white/50 hover:text-white disabled:opacity-20 transition-opacity cursor-pointer"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {BENEFIT_CARDS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeCardIndex === i ? "w-6" : "w-1.5 opacity-40"
                }`}
                style={{ backgroundColor: c.accentColor }}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollToCard(Math.min(2, activeCardIndex + 1))}
            disabled={activeCardIndex === 2}
            className="p-1 rounded-full text-white/50 hover:text-white disabled:opacity-20 transition-opacity cursor-pointer"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom hint banner */}
        <div className="relative z-10 text-center shrink-0 pt-0.5 pb-1 text-[11px] sm:text-xs font-mono text-zinc-400">
          <span>✦ 24/7 Autonomous Sales AI · Instant Inquiry Capture</span>
        </div>
      </div>
    </div>
  );
}
