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
    icon: FileText,
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
    icon: Sliders,
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
    icon: Code2,
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
      // MASTER COORDINATED GSAP TIMELINE
      // 1. Letters shatter in 3D
      // 2. Fullscreen typography FADES OUT (Eliminates ghost text overlap!)
      // 3. Right-to-Left Carousel Track glides in from right to left
      // 4. Cards fan out smoothly into final balanced layout
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

      // 1. Letters shatter outwards in 3D
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const config = HEADLINE_LETTERS[idx] || { x: 0, y: 0, z: 200, rx: 0, ry: 0, rz: 0, s: 2 };
          masterTL.to(
            el,
            {
              x: config.x * (isDesktop ? 1.2 : 0.7),
              y: config.y * (isDesktop ? 1.2 : 0.7),
              z: config.z,
              rotateX: config.rx,
              rotateY: config.ry,
              rotateZ: config.rz,
              scale: config.s,
              opacity: 0,
              filter: "blur(12px)",
              duration: 0.28,
              ease: "power2.inOut",
            },
            0.08 + (idx % 4) * 0.015
          );
        }
      });

      // 2. WIPE OUT FULLSCREEN TYPOGRAPHY (Fixes overlapping text completely!)
      if (typographyRef.current) {
        masterTL.to(
          typographyRef.current,
          {
            opacity: 0,
            duration: 0.20,
            ease: "power2.out",
            pointerEvents: "none",
          },
          0.10
        );
      }

      // 3. Persistent Section Header fades in cleanly at top
      if (sectionHeaderRef.current) {
        masterTL.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            ease: "power2.out",
          },
          0.12
        );
      }

      if (glowOrbRef.current) {
        masterTL.to(
          glowOrbRef.current,
          {
            scale: 1.25,
            opacity: 0.9,
            duration: 0.30,
            ease: "power1.out",
          },
          0.12
        );
      }

      // 4. RIGHT-TO-LEFT CAROUSEL ENTRANCE:
      // The track glides smoothly from RIGHT to LEFT into view
      if (cardsTrackRef.current) {
        masterTL.to(
          cardsTrackRef.current,
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
          },
          0.15
        );
      }

      // 5. Individual cards stagger and glide from right to left into their spots
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
        className="relative w-full h-screen overflow-hidden flex flex-col justify-between pt-14 sm:pt-16 pb-4 sm:pb-5 px-4 sm:px-6 lg:px-8 bg-[#050507]"
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
            Scroll to reveal architecture & deployment
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
        {/* 3 PROCESS CARDS (SHUTTERSTOCK LAYOUT: WHITE BG, 01 WATERMARK, TOP BAR, CENTER ICON, TITLE, DESC, BOTTOM SOLID BUTTON) */}
        {/* ===================================================================== */}
        <div
          ref={cardsTrackRef}
          className="relative z-20 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch will-change-transform"
        >
          {PROCESS_CARDS.map((card, idx) => {
            const Icon = card.icon;

            return (
              <div
                key={card.step}
                ref={(el) => (cardRefs.current[idx] = el)}
                className="featured-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none border-2 will-change-transform backface-hidden"
                style={{
                  backgroundColor: "#F5F5F7",
                  borderColor: card.accentColor,
                  boxShadow: `0 0 25px ${card.accentColor}25, 0 20px 50px rgba(0,0,0,0.5)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = card.accentColor;
                  e.currentTarget.style.boxShadow = `0 0 45px ${card.accentColor}45, 0 25px 60px rgba(0,0,0,0.6)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = card.accentColor;
                  e.currentTarget.style.boxShadow = `0 0 25px ${card.accentColor}25, 0 20px 50px rgba(0,0,0,0.5)`;
                }}
              >
                {/* Top Row: Left Watermark Number + Right Colored Accent Bar */}
                <div className="flex items-center justify-between w-full mb-3">
                  <span
                    style={{ color: "#CBD5E1" }}
                    className="text-3xl sm:text-4xl font-black font-mono tracking-tight select-none"
                  >
                    {card.step}
                  </span>
                  <div
                    className="w-12 sm:w-14 h-2 rounded-full transition-transform duration-300 group-hover:scale-x-110 shadow-xs"
                    style={{ backgroundColor: card.accentColor }}
                  />
                </div>

                {/* Upper Center: Prominent Line-Art Outline Icon */}
                <div className="my-3 sm:my-4 flex justify-center w-full">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: `${card.accentColor}12`,
                      border: `1.5px solid ${card.accentColor}40`,
                      color: card.accentColor,
                      boxShadow: `0 0 20px ${card.accentColor}20`,
                    }}
                  >
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.8]" />
                  </div>
                </div>

                {/* Middle: Centered Heading & Structured Description */}
                <div className="text-center space-y-2 mb-5 flex-1 flex flex-col justify-center">
                  <span
                    className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block"
                    style={{ color: card.accentColor }}
                  >
                    {card.tagline}
                  </span>
                  <h3
                    style={{ color: "#0A0A0E", WebkitTextFillColor: "#0A0A0E" }}
                    className="font-extrabold text-base sm:text-lg tracking-tight uppercase"
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{ color: "#475467", WebkitTextFillColor: "#475467" }}
                    className="text-xs leading-relaxed line-clamp-3 px-1 font-medium"
                  >
                    {card.description}
                  </p>
                  <div className="pt-1">
                    <span
                      style={{ color: "#344054", backgroundColor: "#FFFFFF", borderColor: "#E2E4E9" }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono border shadow-2xs"
                    >
                      ✦ {card.feature}
                    </span>
                  </div>
                </div>

                {/* Bottom: Solid Colored Button Matching the Top Accent Bar */}
                <div className="w-full pt-2 mt-auto">
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
                    className="w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer hover:brightness-105 active:scale-[0.98]"
                    style={{
                      backgroundColor: card.accentColor,
                      color: card.buttonTextColor || "#FFFFFF",
                      boxShadow: `0 4px 20px ${card.accentColor}35`,
                    }}
                  >
                    <span>{card.ctaText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* BOTTOM ACTION CTA BANNER                                              */}
        {/* ===================================================================== */}
        <div className="relative z-10 text-center shrink-0 pt-1 pb-1">
          <button
            type="button"
            onClick={onOpenTrial}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white btn-primary-gradient cursor-pointer shadow-[0_0_25px_rgba(150,61,255,0.4)] hover:shadow-[0_0_35px_rgba(150,61,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Launch Your Autonomous Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
