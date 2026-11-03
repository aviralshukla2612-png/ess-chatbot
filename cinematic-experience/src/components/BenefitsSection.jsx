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

// 3 Benefit Cards matching Dribbble Wave Card Design Reference
const BENEFIT_CARDS = [
  {
    step: "01",
    tagline: "Card 01 · 24/7 Availability",
    title: "Customer Engagement",
    subTitle: "Always-On Conversations",
    kicker: "NEVER MISS AN ENQUIRY",
    icon: Headphones,
    iconBg: "bg-emerald-100/70 text-[#00D98B]",
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
    icon: Rocket,
    iconBg: "bg-purple-100/70 text-[#C653FF]",
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
    icon: Lightbulb,
    iconBg: "bg-blue-100/70 text-[#009DFF]",
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
                className={`featured-card group relative rounded-3xl bg-white text-slate-900 overflow-hidden h-[415px] sm:h-[435px] lg:h-[455px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none border border-white/20 will-change-transform backface-hidden ${card.shadow}`}
              >
                {/* TOP SECTION: Always visible, clean crisp white background */}
                <div className="relative z-10 px-6 pt-6 pb-2 flex flex-col items-center text-center transition-all duration-300">
                  {/* Icon Container with subtle halo and decorative sparkle dots */}
                  <div className="relative flex items-center justify-center">
                    <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="w-7 h-7 stroke-[2]" />
                    </div>
                    {/* Decorative sparkle dots around icon like the reference image */}
                    <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="absolute -bottom-1 -left-2 w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-slate-900 tracking-tight uppercase mt-3 leading-snug">
                    {card.title}
                  </h3>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {card.tagline}
                  </span>
                </div>

                {/* DYNAMIC WAVE FILL LAYER: Expands smoothly on hover/active */}
                <div
                  className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col ${
                    isExpanded ? "h-[74%] sm:h-[76%]" : "h-[45%] sm:h-[47%]"
                  }`}
                >
                  {/* Liquid Organic Wave SVG Divider */}
                  <div className="relative w-full h-10 sm:h-12 -mt-9 sm:-mt-11 pointer-events-none shrink-0 overflow-visible">
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
                              onOpenTrial?.();
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