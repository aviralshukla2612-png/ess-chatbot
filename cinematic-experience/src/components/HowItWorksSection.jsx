"use client";

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

// Bespoke Illustrated SVG Icons matching Dribbble reference style
const KnowledgeBaseIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" fill="#8B5CF6" fillOpacity="0.12" />
    <rect x="22" y="10" width="26" height="34" rx="4" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 3" />
    <rect x="14" y="16" width="28" height="36" rx="4" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" />
    <line x1="20" y1="24" x2="36" y2="24" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="30" x2="32" y2="30" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="36" x2="28" y2="36" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
    <g filter="drop-shadow(0px 3px 6px rgba(139, 92, 246, 0.45))">
      <circle cx="42" cy="42" r="13" fill="#8B5CF6" />
      <path d="M42 35 L42 48" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M37 40 L42 35 L47 40" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <circle cx="12" cy="14" r="1.5" fill="#8B5CF6" />
    <circle cx="52" cy="18" r="1.5" fill="#A78BFA" />
  </svg>
);

const PersonaEngineIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" fill="#FF5E3A" fillOpacity="0.12" />
    <line x1="32" y1="11" x2="32" y2="17" stroke="#FF5E3A" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="32" cy="9" r="3" fill="#FF5E3A" />
    <rect x="15" y="17" width="34" height="28" rx="8" fill="#FFFFFF" stroke="#FF5E3A" strokeWidth="2.5" />
    <rect x="20" y="23" width="24" height="15" rx="5" fill="#FFF7ED" stroke="#F97316" strokeWidth="1.5" />
    <circle cx="26" cy="30" r="2.5" fill="#FF5E3A" />
    <circle cx="38" cy="30" r="2.5" fill="#FF5E3A" />
    <path d="M29 34 Q32 36 35 34" stroke="#FF5E3A" strokeWidth="1.5" strokeLinecap="round" />
    <g filter="drop-shadow(0px 3px 6px rgba(255, 94, 58, 0.45))">
      <circle cx="44" cy="44" r="12" fill="#FF5E3A" />
      <line x1="39" y1="41" x2="49" y2="41" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="42" cy="41" r="2" fill="#FFFFFF" />
      <line x1="39" y1="47" x2="49" y2="47" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="46" cy="47" r="2" fill="#FFFFFF" />
    </g>
    <circle cx="10" cy="28" r="1.5" fill="#FF5E3A" />
    <circle cx="53" cy="16" r="1.5" fill="#F97316" />
  </svg>
);

const CodeDeployIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" fill="#06B6D4" fillOpacity="0.12" />
    <path d="M23 41 L14 50 L20 44 L16 54 L27 45 Z" fill="#F59E0B" />
    <path d="M21 43 L17 49 L24 45 Z" fill="#EF4444" />
    <line x1="12" y1="36" x2="8" y2="40" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="56" x2="28" y2="60" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
    <g transform="rotate(45 34 30)">
      <path d="M24 38 L18 44 L25 46 Z" fill="#0284C7" />
      <path d="M44 38 L50 44 L43 46 Z" fill="#0284C7" />
      <path d="M34 10 C26 22 26 38 26 44 L42 44 C42 38 42 22 34 10 Z" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M34 10 C30 16 28 20 28 22 L40 22 C40 20 38 16 34 10 Z" fill="#06B6D4" />
      <circle cx="34" cy="30" r="5" fill="#E0F2FE" stroke="#06B6D4" strokeWidth="1.5" />
      <path d="M32 28.5 L30.5 30 L32 31.5" stroke="#0284C7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 28.5 L37.5 30 L36 31.5" stroke="#0284C7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g filter="drop-shadow(0px 3px 6px rgba(6, 182, 212, 0.45))">
      <circle cx="46" cy="46" r="11" fill="#06B6D4" />
      <path d="M42 46 L40 46 M44 43 L42 49 M48 46 L50 46" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);

// 3 Process Cards matching Shutterstock Numbered Card Architecture
const PROCESS_CARDS = [
  {
    step: "01",
    accentColor: "#8B5CF6",
    buttonTextColor: "#FFFFFF",
    tagline: "STEP 01 · INGESTION",
    title: "Connect Knowledge Base",
    subTitle: "Instant Ingestion",
    icon: KnowledgeBaseIcon,
    description: "Upload brochures, pricing schedules, FAQs, technical manuals, or provide your website URL for instant indexing.",
    feature: "Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.",
    ctaText: "Start Ingestion",
  },
  {
    step: "02",
    accentColor: "#FF5E3A",
    buttonTextColor: "#FFFFFF",
    tagline: "STEP 02 · PERSONA ENGINE",
    title: "Calibrate Persona Styling",
    subTitle: "Persona Engine",
    icon: PersonaEngineIcon,
    description: "Choose assistant personality, welcome greetings, brand colors, logo, launcher shape and attention-grabbing animation.",
    feature: "Custom logo upload, squircle / circle buttons, and 19 launcher animations.",
    ctaText: "Calibrate Persona",
  },
  {
    step: "03",
    accentColor: "#06B6D4",
    buttonTextColor: "#FFFFFF",
    tagline: "STEP 03 · LIVE EMBED",
    title: "Deploy Single Line Code",
    subTitle: "Universal Live Embed",
    icon: CodeDeployIcon,
    description: "Integrate the assistant into your website using the provided script with instant anti-cache live updates.",
    feature: "Zero dependencies, anti-cache instant updates, and mobile-optimized viewport.",
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

  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleCardsScroll = (e) => {
    const container = e.currentTarget;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.82;
    const newIndex = Math.round(scrollLeft / (cardWidth || 1));
    setActiveCardIndex(Math.min(Math.max(newIndex, 0), 2));
  };

  const scrollToCard = (index) => {
    const targetCard = cardRefs.current[index];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      setActiveCardIndex(index);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;
      const isMobile = window.innerWidth < 768;

      // =======================================================================
      // INITIAL 3D SCENE CONFIGURATION (Runs on all screens: phone, tab, laptop, desktop)
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

      if (cardsTrackRef.current) {
        gsap.set(cardsTrackRef.current, {
          xPercent: isMobile ? 0 : (isDesktop ? 30 : 20),
          opacity: 0,
        });
      }

      cardRefs.current.forEach((card, idx) => {
        if (card) {
          gsap.set(card, {
            x: isMobile ? (25 + idx * 15) : (isDesktop ? 80 + idx * 40 : 45 + idx * 25),
            opacity: 0,
            scale: 0.92,
            force3D: true,
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
      // MASTER COORDINATED GSAP TIMELINE
      // 1. Letters shatter in 3D
      // 2. Fullscreen typography fades out cleanly
      // 3. Carousel Track glides in
      // 4. Cards fan out smoothly into place
      // =======================================================================
      const masterTL = gsap.timeline({
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

      // 1. Letters shatter outwards in 3D (scaled responsively for all screens)
      const scaleFactor = isMobile ? 0.45 : isDesktop ? 1.0 : 0.75;
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const config = HEADLINE_LETTERS[idx] || { x: 0, y: 0, z: 200, rx: 0, ry: 0, rz: 0, s: 2 };
          masterTL.to(
            el,
            {
              x: config.x * scaleFactor,
              y: config.y * scaleFactor,
              z: config.z * scaleFactor,
              rotateX: config.rx,
              rotateY: config.ry,
              rotateZ: config.rz,
              scale: config.s,
              opacity: 0,
              filter: "blur(8px)",
              duration: 0.35,
              ease: "power2.inOut",
            },
            0.02 + idx * 0.012
          );
        }
      });

      // 2. Fade out typography wrapper
      if (typographyRef.current) {
        masterTL.to(
          typographyRef.current,
          {
            opacity: 0,
            pointerEvents: "none",
            duration: 0.15,
            ease: "power1.out",
          },
          0.18
        );
      }

      // Header fades in
      if (sectionHeaderRef.current) {
        masterTL.to(
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

      // 3. Carousel Track enters smoothly
      if (cardsTrackRef.current) {
        masterTL.to(
          cardsTrackRef.current,
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.32,
            ease: "power2.out",
          },
          0.15
        );
      }

      // 4. Staggered Card Entrance
      cardRefs.current.forEach((card, idx) => {
        if (card) {
          masterTL.to(
            card,
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.35,
              ease: "power3.out",
              force3D: true,
            },
            0.18 + idx * 0.08
          );
        }
      });

      // Ambient glow orb intensifies
      if (glowOrbRef.current) {
        masterTL.to(
          glowOrbRef.current,
          {
            scale: 1.3,
            opacity: 0.7,
            duration: 0.4,
            ease: "power2.inOut",
          },
          0.15
        );
      }

      // Hold reading state
      masterTL.to({}, { duration: 0.4 }, 0.6);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ===================================================================== */}
      {/* PINNED STAGE VIEWPORT (100dvh FOR MOBILE/SAFARI — NO CUT-OFF)          */}
      {/* ===================================================================== */}
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden bg-[#050507] flex flex-col justify-between pt-16 sm:pt-20 lg:pt-22 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8"
        style={{
          minHeight: "100dvh",
          height: "100dvh",
          perspective: "1400px",
        }}
      >
        {/* Ambient Center Glow */}
        <div
          ref={glowOrbRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full pointer-events-none z-0 blur-[120px] transition-opacity"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(6, 182, 212, 0.12) 50%, transparent 70%)",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* ===================================================================== */}
        {/* FULLSCREEN TYPOGRAPHY: "HOW IT WORKS" (SHATTERS ON SCROLL)            */}
        {/* ===================================================================== */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none select-none px-4"
        >
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm text-[10px] sm:text-xs font-mono uppercase tracking-widest text-purple-300 mb-4 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Process & Implementation</span>
          </div>

          <h1
            className="font-headline font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tight text-white uppercase text-center flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-4 md:gap-x-6"
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

          <p className="mt-4 sm:mt-6 text-xs sm:text-base text-[#9898A6] max-w-lg text-center tracking-wide font-mono uppercase">
            Scroll to reveal architecture & deployment
          </p>
        </div>

        {/* ===================================================================== */}
        {/* PERSISTENT HEADER (Appears smoothly as letters scatter)               */}
        {/* ===================================================================== */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-1 pb-1 sm:pb-2 px-2"
        >
          <h2 className="font-headline font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#C28AFF] via-white to-[#55A9FF] drop-shadow-md">
            From Raw Documents To Autonomous Sales In 5 Minutes
          </h2>
          <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-[#9898A6] max-w-2xl mx-auto">
            No machine learning engineers, vector database setups, or prompt writing required.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* 3 PROCESS CARDS (RESPONSIVE: HORIZONTAL SNAP ON PHONE, 3-COL ON TABLET/DESKTOP) */}
        {/* ===================================================================== */}
        <div
          ref={cardsTrackRef}
          onScroll={handleCardsScroll}
          className="relative z-20 max-w-7xl mx-auto w-full my-auto flex md:grid md:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-6 items-stretch will-change-transform overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none px-4 sm:px-6 md:px-0 py-2 sm:py-3"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {PROCESS_CARDS.map((card, idx) => {
            const Icon = card.icon;

            return (
              <div
                key={card.step}
                ref={(el) => (cardRefs.current[idx] = el)}
                className="featured-card group relative w-[82vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none border-2 will-change-transform backface-hidden"
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
                {/* Top Row: Left Watermark Number + Right Colored Accent Bar */}
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
                      if (onOpenTrial) {
                        onOpenTrial();
                      } else {
                        window.location.href = "/login";
                      }
                    }}
                    className="w-full py-2 sm:py-2.5 lg:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer hover:brightness-105 active:scale-[0.98]"
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

        {/* Mobile Swipe Navigation Dots (visible only on small screens < md) */}
        <div className="flex md:hidden items-center justify-center gap-2 pt-1 pb-1 z-20">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Swipe ✦</span>
          <div className="flex items-center gap-1.5">
            {PROCESS_CARDS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeCardIndex === i ? "w-6" : "w-1.5 opacity-40"
                }`}
                style={{ backgroundColor: c.accentColor }}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BOTTOM ACTION CTA BANNER                                              */}
        {/* ===================================================================== */}
        <div className="relative z-10 text-center shrink-0 pt-0.5 pb-1">
          <button
            type="button"
            onClick={onOpenTrial}
            className="inline-flex items-center gap-2 px-5 sm:px-8 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm text-white btn-primary-gradient cursor-pointer shadow-[0_0_25px_rgba(150,61,255,0.4)] hover:shadow-[0_0_35px_rgba(150,61,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Launch Your Autonomous Assistant</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
