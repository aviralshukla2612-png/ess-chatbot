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

// 3 Benefit Cards matching Option 1 Deep Jewel Tint Reference
const BENEFIT_CARDS = [
  {
    step: "01",
    tagline: "Card 01 · 24/7 Availability",
    title: "Customer Engagement",
    subTitle: "Always-On Conversations",
    kicker: "NEVER MISS AN ENQUIRY",
    icon: EngagementIcon,
    topBg: "bg-[#02281D]",
    borderColor: "border-[#00D98B]/35",
    taglineColor: "#6EE7B7",
    iconContainerBg: "bg-[#043828] border border-[#00D98B]/40",
    tags: ["ALWAYS-ON", "24/7 LIVE"],
    description: "Answer customer questions instantly using your approved business information, even outside working hours.",
    feature: "Visitor is guided towards making an enquiry with instant lead capture.",
    waveColor: "#00D98B",
    gradient: "from-[#00D98B] via-[#059669] to-[#003D2B]",
    shadow: "shadow-[0_20px_50px_rgba(0,217,139,0.30)] hover:shadow-[0_25px_65px_rgba(0,217,139,0.50)]",
    footerLeft: "24/7 AI Assistance",
    ctaText: "Explore Engagement",
  },
  {
    step: "02",
    tagline: "Card 02 · Smart Automation",
    title: "Intelligent Automation",
    subTitle: "Less Manual Work",
    kicker: "LET AI HANDLE REPETITIVE QUESTIONS",
    icon: AutomationIcon,
    topBg: "bg-[#1E042A]",
    borderColor: "border-[#C653FF]/35",
    taglineColor: "#E9D5FF",
    iconContainerBg: "bg-[#330847] border border-[#C653FF]/40",
    tags: ["ZERO REPETITION", "AI GROUNDED"],
    description: "Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business information.",
    feature: "Business knowledge interface grounded in approved information only.",
    waveColor: "#C653FF",
    gradient: "from-[#C653FF] via-[#9333EA] to-[#310044]",
    shadow: "shadow-[0_20px_50px_rgba(198,83,255,0.30)] hover:shadow-[0_25px_65px_rgba(198,83,255,0.50)]",
    footerLeft: "More Time For Team",
    ctaText: "Automate Repetitive Work",
  },
  {
    step: "03",
    tagline: "Card 03 · Business Insights",
    title: "Enquiry Visibility",
    subTitle: "Turn Chats Into Opportunities",
    kicker: "STAY CONNECTED TO CUSTOMER INTEREST",
    icon: EnquiryIcon,
    topBg: "bg-[#011D3D]",
    borderColor: "border-[#009DFF]/35",
    taglineColor: "#BAE6FD",
    iconContainerBg: "bg-[#032B59] border border-[#009DFF]/40",
    tags: ["HOT LEADS", "INSTANT SYNC"],
    description: "View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for.",
    feature: "Customer interest and conversation details logged directly into CRM.",
    waveColor: "#009DFF",
    gradient: "from-[#009DFF] via-[#0284C7] to-[#002653]",
    shadow: "shadow-[0_20px_50px_rgba(0,157,255,0.30)] hover:shadow-[0_25px_65px_rgba(0,157,255,0.50)]",
    footerLeft: "Conversations & Enquiries",
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
  const [activeCardIndex, setActiveCardIndex] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        if (visionRef.current) gsap.set(visionRef.current, { display: "none" });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1, y: 0 });
        if (cardsTrackRef.current) gsap.set(cardsTrackRef.current, { opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, rotateX: 0, y: 0, scale: 1 });
        });
        return;
      }

      // Initial visual states
      if (visionRef.current) {
        gsap.set(visionRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });
      }
      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -20 });
      }
      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, { opacity: 0 });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            rotateX: -55,
            y: 40 + idx * 15,
            opacity: 0,
            scale: 0.95,
            transformOrigin: "center top",
            force3D: true,
          });
        }
      });

      // Master ScrollTrigger timeline with smooth scrub (ZERO blank screen!)
      const tl = gsap.timeline({
        scrollTrigger: {
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

      // 1. Opening Vision / Marquee smoothly fades out and scales up
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

      // 2. Persistent Section Header fades in below navbar
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

      // 3. Cards Track fades in and 3D unfolds directly beneath the header
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
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="benefits"
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* Scoped CSS for smooth GPU-accelerated infinite marquee loop */}
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
      `}</style>

      {/* ========================================================================= */}
      {/* PINNED STAGE VIEWPORT (PADDED BELOW NAVBAR — NO CUT-OFF, NO BLACKOUT)      */}
      {/* ========================================================================= */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] max-h-screen overflow-hidden bg-[#050507] flex flex-col justify-between pt-20 sm:pt-24 pb-6 px-4 sm:px-6 lg:px-8"
        style={{ perspective: "1500px" }}
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
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70">
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
          className="relative z-20 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-2"
        >
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-md">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#C5CAD4] font-medium max-w-2xl mx-auto leading-relaxed">
            Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
          </p>
        </div>

        {/* ======================================================================= */}
        {/* THE 3 CARDS MATCHING DRIBBBLE WAVE CARD DESIGN (WITH EXPANDABLE LIQUID DIVIDER) */}
        {/* ======================================================================= */}
        <div
          ref={cardsTrackRef}
          onMouseLeave={() => setActiveCardIndex(1)}
          className="key-card-list relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch will-change-transform"
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
        >
          {BENEFIT_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const isExpanded = activeCardIndex === idx;

            return (
              <div
                key={card.step}
                ref={(el) => (cardRefs.current[idx] = el)}
                data-kf-card="true"
                onMouseEnter={() => setActiveCardIndex(idx)}
                onClick={() => setActiveCardIndex(idx)}
                className={`featured-card group relative rounded-3xl ${card.topBg} text-white overflow-hidden h-[370px] sm:h-[390px] lg:h-[405px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none border ${card.borderColor} will-change-transform backface-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${card.shadow}`}
              >
                {/* TOP SECTION: Deep jewel tone with glowing white typography */}
                <div className="card-wave-top relative z-10 px-5 pt-4 pb-1 flex flex-col items-center text-center transition-all duration-300">
                  {/* Icon Container with subtle halo and decorative sparkle dots */}
                  <div className="relative flex items-center justify-center">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${card.iconContainerBg} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105`}>
                      <Icon className="w-9 h-9 sm:w-10 sm:h-10" />
                    </div>
                    {/* Decorative sparkle dots around icon matched to card accent */}
                    <span
                      className="absolute -top-1 -right-2 w-2 h-2 rounded-full shadow-sm animate-pulse"
                      style={{ backgroundColor: card.waveColor }}
                    />
                    <span
                      className="absolute -bottom-1 -left-2 w-1.5 h-1.5 rounded-full opacity-70"
                      style={{ backgroundColor: card.waveColor }}
                    />
                  </div>

                  {/* Title & Tagline */}
                  <h3
                    style={{ color: "#FFFFFF" }}
                    className="!text-white text-white font-headline font-black text-lg sm:text-xl tracking-tight uppercase mt-2 leading-tight drop-shadow-md"
                  >
                    {card.title}
                  </h3>
                  <span
                    style={{ color: card.taglineColor }}
                    className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider mt-0.5"
                  >
                    {card.tagline}
                  </span>
                </div>

                {/* DYNAMIC WAVE FILL LAYER: Expands smoothly on hover/active */}
                <div
                  className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col ${
                    isExpanded ? "h-[62%] sm:h-[64%]" : "h-[38%] sm:h-[40%]"
                  }`}
                >
                  {/* Liquid Organic Wave SVG Divider */}
                  <div className="relative w-full h-8 sm:h-10 -mt-7 sm:-mt-9 pointer-events-none shrink-0 overflow-visible">
                    {/* Back Wave (translucent) */}
                    <svg
                      viewBox="0 0 500 80"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full opacity-35"
                      style={{ color: card.waveColor }}
                    >
                      <path
                        d="M0,50 Q140,15 280,50 T500,50 L500,80 L0,80 Z"
                        fill="currentColor"
                      />
                    </svg>
                    {/* Front Wave (solid, seamless into body) */}
                    <svg
                      viewBox="0 0 500 80"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full"
                      style={{ color: card.waveColor }}
                    >
                      <path
                        d="M0,35 Q125,70 250,35 T500,35 L500,80 L0,80 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  {/* Wave Gradient Body */}
                  <div
                    className={`flex-1 w-full bg-gradient-to-b ${card.gradient} px-6 pb-6 pt-2 text-white flex flex-col justify-between overflow-hidden`}
                  >
                    {isExpanded ? (
                      /* EXPANDED CONTENT (Matching Card 2 in reference image) */
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-widest block">
                            {card.kicker}
                          </span>
                          <h4 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-tight mt-0.5">
                            {card.subTitle}
                          </h4>
                          <p className="mt-2 text-xs sm:text-[13px] text-white/95 leading-relaxed font-normal">
                            {card.description}
                          </p>
                          <p className="mt-2.5 text-[11px] font-mono text-white/90 bg-black/20 p-2 rounded-lg border border-white/15">
                            ✦ {card.feature}
                          </p>
                        </div>

                        {/* Bottom Action Arrow Button (exact match to screenshot) */}
                        <div className="pt-3 mt-auto flex items-center justify-between border-t border-white/20">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/90">
                            {card.footerLeft}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (card.ctaText === "View Live Dashboard") {
                                window.location.href = "/login";
                              } else {
                                onOpenTrial?.();
                              }
                            }}
                            className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                            aria-label={card.ctaText}
                          >
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* RESTING CONTENT (Matching Card 1 & 3 in reference image) */
                      <div className="flex flex-col h-full justify-between">
                        <div className="my-auto flex items-center justify-center gap-6 text-xs sm:text-sm font-black tracking-wider uppercase text-white">
                          {card.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="border-b-2 border-white/50 pb-0.5 tracking-widest drop-shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-white/75 pt-2 border-t border-white/20">
                          <span>{card.footerLeft}</span>
                          <span className="flex items-center gap-1 font-bold text-white hover:underline">
                            Explore →
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom hint banner */}
        <div className="relative z-10 text-center shrink-0 pt-1 text-xs font-mono text-zinc-400">
          <span>✦ 24/7 Autonomous Sales AI · Instant Inquiry Capture</span>
        </div>
      </div>
    </div>
  );
}