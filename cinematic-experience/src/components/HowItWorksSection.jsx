import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Sliders,
  Code2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Upload,
  Globe,
  Bot,
  Copy,
  Check,
  Zap,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Rocket,
  Lightbulb,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// "HOW IT WORKS" letters split for character-by-character shatter
const HEADLINE_LETTERS = [
  { char: "H", x: -280, y: -200, z: 280, rx: 45, ry: -60, rz: -35, s: 2.0 },
  { char: "O", x: -160, y: -260, z: 180, rx: -50, ry: 40, rz: 55, s: 1.8 },
  { char: "W", x: -60, y: 220, z: 350, rx: 65, ry: -30, rz: -40, s: 2.2 },
  { char: " ", isSpace: true },
  { char: "I", x: 40, y: -220, z: 240, rx: -40, ry: 50, rz: 30, s: 1.8 },
  { char: "T", x: 120, y: 220, z: 300, rx: 55, ry: -45, rz: -30, s: 1.9 },
  { char: " ", isSpace: true },
  { char: "W", x: -220, y: 200, z: 260, rx: -35, ry: 65, rz: 45, s: 2.1 },
  { char: "O", x: 160, y: -200, z: 180, rx: 50, ry: -50, rz: -20, s: 1.7 },
  { char: "R", x: 260, y: 160, z: 340, rx: -60, ry: 35, rz: 50, s: 2.0 },
  { char: "K", x: 340, y: -150, z: 190, rx: 40, ry: -60, rz: -50, s: 2.2 },
  { char: "S", x: 400, y: 220, z: 280, rx: -70, ry: 55, rz: 40, s: 1.9 },
];

// 3 Process Cards matching Dribbble Wave Card Design Reference
const PROCESS_CARDS = [
  {
    step: "01",
    tagline: "Step 01 · Ingestion",
    title: "Connect Knowledge Base",
    subTitle: "Instant Ingestion",
    icon: Headphones,
    iconBg: "bg-purple-100/70 text-[#8B5CF6]",
    tags: ["PDF · DOCX", "URL SYNC"],
    description: "Upload brochures, pricing schedules, FAQs, technical manuals, or provide your website URL for instant indexing.",
    feature: "Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.",
    waveColor: "#8B5CF6",
    gradient: "from-[#8B5CF6] via-[#9333EA] to-[#7E22CE]",
    shadow: "shadow-[0_20px_50px_rgba(139,92,246,0.30)] hover:shadow-[0_25px_65px_rgba(139,92,246,0.50)]",
    footerLeft: "Ingestion Engine",
    ctaText: "Start Ingestion",
  },
  {
    step: "02",
    tagline: "Step 02 · Persona Engine",
    title: "Calibrate Persona Styling",
    subTitle: "Persona Engine",
    icon: Rocket,
    iconBg: "bg-orange-100/70 text-[#FF5E3A]",
    tags: ["BRAND VOICE", "19 MOTIONS"],
    description: "Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and attention-grabbing animation.",
    feature: "Custom logo upload, squircle / circle / pill buttons, and 19 launcher animations.",
    waveColor: "#FF5E3A",
    gradient: "from-[#FF5E3A] via-[#F97316] to-[#EA580C]",
    shadow: "shadow-[0_20px_50px_rgba(255,94,58,0.30)] hover:shadow-[0_25px_65px_rgba(255,94,58,0.50)]",
    footerLeft: "Persona Engine",
    ctaText: "Calibrate Persona",
  },
  {
    step: "03",
    tagline: "Step 03 · Live Embed",
    title: "Deploy Single Line Code",
    subTitle: "Universal Live Embed",
    icon: Lightbulb,
    iconBg: "bg-cyan-100/70 text-[#06B6D4]",
    tags: ["ONE-LINE", "ZERO CONFIG"],
    description: "Integrate the assistant into your website using the provided script with instant anti-cache live updates.",
    feature: "Zero dependencies, anti-cache instant updates, and mobile-optimized viewport.",
    waveColor: "#06B6D4",
    gradient: "from-[#06B6D4] via-[#0EA5E9] to-[#0284C7]",
    shadow: "shadow-[0_20px_50px_rgba(6,182,212,0.30)] hover:shadow-[0_25px_65px_rgba(6,182,212,0.50)]",
    footerLeft: "Edge Deploy",
    ctaText: "Get Embed Code",
  },
];

export default function HowItWorksSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const typographyRef = useRef(null);
  const letterRefs = useRef([]);
  const cardRefs = useRef([]);
  const cardsTrackRef = useRef(null);
  const glowOrbRef = useRef(null);
  const sectionHeaderRef = useRef(null);
  const [activeCardIndex, setActiveCardIndex] = useState(1); // Default middle card

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 1024;

      // Handle Reduced Motion preferences
      if (prefersReducedMotion) {
        if (typographyRef.current) gsap.set(typographyRef.current, { display: "none" });
        if (cardsTrackRef.current) gsap.set(cardsTrackRef.current, { x: 0, opacity: 1 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 });
        });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1, y: 0 });
        return;
      }

      // =======================================================================
      // INITIAL 3D SCENE CONFIGURATION
      // =======================================================================
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

      // Right-to-Left Carousel Track starts off-screen to the right
      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, {
          xPercent: isDesktop ? 45 : 30,
          opacity: 0,
        });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            x: 100 + idx * 60,
            opacity: 0,
            scale: 0.9,
          });
        }
      });

      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -15 });
      }

      if (glowOrbRef.current) {
        gsap.set(glowOrbRef.current, { scale: 0.8, opacity: 0.4 });
      }

      // =======================================================================
      // MASTER GSAP TIMELINE — Awwwards Character Shatter + Cards Sequence
      // =======================================================================
      const masterTL = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1200",
          pin: stage,
          pinSpacing: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // PHASE 1: Dramatic Character-by-Character Shatter in 3D Space
      HEADLINE_LETTERS.forEach((item, idx) => {
        if (!item.isSpace && letterRefs.current[idx]) {
          masterTL.to(
            letterRefs.current[idx],
            {
              x: item.x * (isDesktop ? 1.6 : 0.9),
              y: item.y * (isDesktop ? 1.4 : 0.8),
              z: item.z * (isDesktop ? 1.8 : 1.0),
              rotateX: item.rx,
              rotateY: item.ry,
              rotateZ: item.rz,
              scale: item.s,
              opacity: 0,
              filter: "blur(14px)",
              duration: 0.42,
              ease: "power2.inOut",
            },
            idx * 0.015
          );
        }
      });

      // Ambient background flare expansion
      if (glowOrbRef.current) {
        masterTL.to(
          glowOrbRef.current,
          {
            scale: 1.4,
            opacity: 0.85,
            duration: 0.5,
            ease: "power2.out",
          },
          0.05
        );
      }

      // Typography container gracefully collapses
      if (typographyRef.current) {
        masterTL.to(
          typographyRef.current,
          {
            opacity: 0,
            duration: 0.28,
            ease: "power2.in",
          },
          0.12
        );
      }

      // PHASE 2: Persistent Architecture Header Fades In
      if (sectionHeaderRef.current) {
        masterTL.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.28,
            ease: "power3.out",
          },
          0.18
        );
      }

      // PHASE 3: Right-to-Left Carousel Slides Into Center Screen
      if (cardsTrackRef.current) {
        masterTL.to(
          cardsTrackRef.current,
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.45,
            ease: "power3.out",
          },
          0.16
        );
      }

      // Staggered reveal of the three architectural cards
      cardRefs.current.forEach((card, idx) => {
        if (card) {
          masterTL.to(
            card,
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.32,
              ease: "power3.out",
            },
            0.20 + idx * 0.08
          );
        }
      });

      // Settle and hold steady for interactive browsing
      masterTL.to({}, { duration: 0.35 }, 0.65);
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex flex-col justify-between pt-20 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8 bg-[#050507]"
        style={{ perspective: "1500px" }}
      >
        {/* Ambient Dark Canvas */}
        <div
          ref={glowOrbRef}
          className="hidden"
        />

        {/* ===================================================================== */}
        {/* FULLSCREEN TYPOGRAPHY & CHARACTER SHATTER (LAYER 30 - FADES AT 0.10s) */}
        {/* ===================================================================== */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
        >
          {/* Oversized Centered "HOW IT WORKS" Typography */}
          <h1
            className="font-headline font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white uppercase text-center flex flex-wrap justify-center items-center gap-x-4 md:gap-x-6"
            style={{ perspective: "1200px" }}
          >
            {/* Word: HOW */}
            <span className="inline-flex">
              {HEADLINE_LETTERS.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  ref={(el) => (letterRefs.current[idx] = el)}
                  className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-[0_15px_30px_rgba(150,61,255,0.4)]"
                >
                  {item.char}
                </span>
              ))}
            </span>

            {/* Word: IT */}
            <span className="inline-flex">
              {HEADLINE_LETTERS.slice(4, 6).map((item, idx) => (
                <span
                  key={idx + 4}
                  ref={(el) => (letterRefs.current[idx + 4] = el)}
                  className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-[0_15px_30px_rgba(150,61,255,0.4)]"
                >
                  {item.char}
                </span>
              ))}
            </span>

            {/* Word: WORKS */}
            <span className="inline-flex">
              {HEADLINE_LETTERS.slice(7).map((item, idx) => (
                <span
                  key={idx + 7}
                  ref={(el) => (letterRefs.current[idx + 7] = el)}
                  className="inline-block will-change-transform text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-[0_15px_30px_rgba(150,61,255,0.4)]"
                >
                  {item.char}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-[#9898A6] max-w-lg text-center tracking-wide font-mono uppercase">
            Scroll to reveal architecture &amp; deployment
          </p>
        </div>

        {/* ===================================================================== */}
        {/* PERSISTENT HEADER (Appears smoothly as letters scatter)               */}
        {/* ===================================================================== */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-3"
        >
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-md">
            From Raw Documents To Autonomous Sales In 5 Minutes
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#9898A6] max-w-2xl mx-auto hidden sm:block">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT-TO-LEFT CAROUSEL TRACK (DRIBBBLE WAVE CARDS WITH LIQUID DIVIDER) */}
        {/* ===================================================================== */}
        <div
          ref={cardsTrackRef}
          onMouseLeave={() => setActiveCardIndex(1)}
          className="relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch will-change-transform"
        >
          {PROCESS_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const isExpanded = activeCardIndex === idx;

            return (
              <div
                key={card.step}
                ref={(el) => (cardRefs.current[idx] = el)}
                onMouseEnter={() => setActiveCardIndex(idx)}
                onClick={() => setActiveCardIndex(idx)}
                className={`group relative rounded-3xl bg-[#EAEBED] text-black overflow-hidden h-[420px] sm:h-[440px] lg:h-[460px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ${card.shadow}`}
              >
                {/* TOP SECTION: Premium off-white / light gray with high-contrast jet black typography */}
                <div className="card-wave-top relative z-10 px-6 pt-5 pb-1 flex flex-col items-center text-center transition-all duration-300">
                  {/* Icon Container with subtle halo and decorative sparkle dots */}
                  <div className="relative flex items-center justify-center">
                    <div className={`w-13 h-13 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-sm border border-black/10 transition-transform duration-300 group-hover:scale-105`}>
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    {/* Decorative sparkle dots around icon like the reference image */}
                    <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="absolute -bottom-1 -left-2 w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>

                  {/* Title & Step Tag */}
                  <h3
                    style={{ color: "#000000" }}
                    className="!text-black text-black font-headline font-black text-xl sm:text-2xl tracking-tight uppercase mt-2.5 leading-snug drop-shadow-none"
                  >
                    {card.title}
                  </h3>
                  <span
                    style={{ color: "#475569" }}
                    className="!text-slate-600 text-slate-600 text-[11px] font-mono font-bold uppercase tracking-wider mt-0.5"
                  >
                    {card.tagline}
                  </span>
                </div>

                {/* DYNAMIC WAVE FILL LAYER: Expands smoothly on hover/active */}
                <div
                  className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col ${
                    isExpanded ? "h-[60%] sm:h-[62%]" : "h-[39%] sm:h-[41%]"
                  }`}
                >
                  {/* Liquid Organic Wave SVG Divider */}
                  <div className="relative w-full h-9 sm:h-11 -mt-8 sm:-mt-10 pointer-events-none shrink-0 overflow-visible">
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
                          <h4 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-tight">
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

        {/* ===================================================================== */}
        {/* BOTTOM ACTION CTA BANNER                                              */}
        {/* ===================================================================== */}
        <div className="relative z-10 text-center shrink-0 pt-2">
          <button
            type="button"
            onClick={onOpenTrial}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-xs sm:text-sm text-white btn-primary-gradient cursor-pointer shadow-[0_0_25px_rgba(150,61,255,0.4)] hover:shadow-[0_0_35px_rgba(150,61,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Launch Your Autonomous Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}