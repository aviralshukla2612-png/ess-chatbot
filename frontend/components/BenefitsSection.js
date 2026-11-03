"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Explosive 360-degree 3D Shatter trajectories for "DON'T LET VALUABLE CONVERSATIONS SLIP AWAY."
const SHATTER_LETTERS = [
  {
    "char": "D",
    "x": -1514,
    "y": 838,
    "z": 1073,
    "rx": 151,
    "ry": -218,
    "rz": -13,
    "s": 4.7
  },
  {
    "char": "O",
    "x": -872,
    "y": 676,
    "z": 436,
    "rx": -8,
    "ry": 93,
    "rz": 34,
    "s": 2.9
  },
  {
    "char": "N",
    "x": -684,
    "y": 694,
    "z": 1032,
    "rx": -142,
    "ry": 115,
    "rz": -24,
    "s": 4.5
  },
  {
    "char": "'",
    "x": -1779,
    "y": 383,
    "z": 1166,
    "rx": 172,
    "ry": -220,
    "rz": -4,
    "s": 4.9
  },
  {
    "char": "T",
    "x": -1180,
    "y": 509,
    "z": 653,
    "rx": -57,
    "ry": 126,
    "rz": 23,
    "s": 3.5
  },
  {
    "char": " ",
    "isSpace": true
  },
  {
    "char": "L",
    "x": -1738,
    "y": -79,
    "z": 1200,
    "rx": 180,
    "ry": -216,
    "rz": 2,
    "s": 5
  },
  {
    "char": "E",
    "x": -1448,
    "y": 267,
    "z": 850,
    "rx": -101,
    "ry": 154,
    "rz": 12,
    "s": 4
  },
  {
    "char": "T",
    "x": -1119,
    "y": 42,
    "z": 680,
    "rx": -63,
    "ry": 47,
    "rz": -12,
    "s": 3.6
  },
  {
    "char": " ",
    "isSpace": true
  },
  {
    "char": "V",
    "x": -1632,
    "y": -49,
    "z": 1014,
    "rx": -138,
    "ry": 178,
    "rz": 4,
    "s": 4.5
  },
  {
    "char": "A",
    "x": -933,
    "y": -245,
    "z": 465,
    "rx": -15,
    "ry": 10,
    "rz": -3,
    "s": 3
  },
  {
    "char": "L",
    "x": -1070,
    "y": -736,
    "z": 1088,
    "rx": 155,
    "ry": -189,
    "rz": 0,
    "s": 4.7
  },
  {
    "char": "U",
    "x": -1678,
    "y": -424,
    "z": 1130,
    "rx": -164,
    "ry": 197,
    "rz": -1,
    "s": 4.8
  },
  {
    "char": "A",
    "x": -719,
    "y": -501,
    "z": 555,
    "rx": 35,
    "ry": -27,
    "rz": 6,
    "s": 3.2
  },
  {
    "char": "B",
    "x": -634,
    "y": -889,
    "z": 951,
    "rx": 124,
    "ry": -168,
    "rz": -7,
    "s": 4.3
  },
  {
    "char": "L",
    "x": -1526,
    "y": -819,
    "z": 1192,
    "rx": -178,
    "ry": 211,
    "rz": -3,
    "s": 5
  },
  {
    "char": "E",
    "x": -324,
    "y": -715,
    "z": 763,
    "rx": 82,
    "ry": -63,
    "rz": 15,
    "s": 3.8
  },
  {
    "char": " ",
    "isSpace": true
  },
  {
    "char": "C",
    "x": -1136,
    "y": -1170,
    "z": 1193,
    "rx": -178,
    "ry": 218,
    "rz": 0,
    "s": 5
  },
  {
    "char": "O",
    "x": 246,
    "y": -778,
    "z": 944,
    "rx": 122,
    "ry": -98,
    "rz": 21,
    "s": 4.3
  },
  {
    "char": "N",
    "x": 127,
    "y": -920,
    "z": 565,
    "rx": 37,
    "ry": -111,
    "rz": -27,
    "s": 3.3
  },
  {
    "char": "V",
    "x": -520,
    "y": -1389,
    "z": 1134,
    "rx": -165,
    "ry": 220,
    "rz": 7,
    "s": 4.8
  },
  {
    "char": "E",
    "x": 848,
    "y": -654,
    "z": 1083,
    "rx": 154,
    "ry": -130,
    "rz": 24,
    "s": 4.7
  },
  {
    "char": "R",
    "x": 402,
    "y": -842,
    "z": 455,
    "rx": -12,
    "ry": -77,
    "rz": -38,
    "s": 3
  },
  {
    "char": "S",
    "x": 231,
    "y": -1390,
    "z": 1020,
    "rx": -139,
    "ry": 215,
    "rz": 18,
    "s": 4.5
  },
  {
    "char": "A",
    "x": 1339,
    "y": -367,
    "z": 1171,
    "rx": 173,
    "ry": -158,
    "rz": 22,
    "s": 4.9
  },
  {
    "char": "T",
    "x": 596,
    "y": -724,
    "z": 671,
    "rx": -61,
    "ry": -42,
    "rz": -48,
    "s": 3.5
  },
  {
    "char": "I",
    "x": 952,
    "y": -1131,
    "z": 858,
    "rx": -103,
    "ry": 204,
    "rz": 32,
    "s": 4.1
  },
  {
    "char": "O",
    "x": 1629,
    "y": 12,
    "z": 1200,
    "rx": 180,
    "ry": -181,
    "rz": 16,
    "s": 5
  },
  {
    "char": "N",
    "x": 705,
    "y": -582,
    "z": 866,
    "rx": -105,
    "ry": -5,
    "rz": -54,
    "s": 4.1
  },
  {
    "char": "S",
    "x": 1449,
    "y": -648,
    "z": 662,
    "rx": -59,
    "ry": 187,
    "rz": 47,
    "s": 3.5
  },
  {
    "char": " ",
    "isSpace": true
  },
  {
    "char": "S",
    "x": 950,
    "y": -508,
    "z": 1026,
    "rx": -141,
    "ry": 32,
    "rz": -57,
    "s": 4.5
  },
  {
    "char": "L",
    "x": 1584,
    "y": -56,
    "z": 445,
    "rx": -10,
    "ry": 164,
    "rz": 62,
    "s": 2.9
  },
  {
    "char": "I",
    "x": 1565,
    "y": 749,
    "z": 1078,
    "rx": 153,
    "ry": -212,
    "rz": -11,
    "s": 4.7
  },
  {
    "char": "P",
    "x": 1192,
    "y": -346,
    "z": 1138,
    "rx": -166,
    "ry": 68,
    "rz": -55,
    "s": 4.8
  },
  {
    "char": " ",
    "isSpace": true
  },
  {
    "char": "A",
    "x": 1295,
    "y": 1006,
    "z": 937,
    "rx": 121,
    "ry": -219,
    "rz": -29,
    "s": 4.3
  },
  {
    "char": "W",
    "x": 1334,
    "y": -70,
    "z": 1194,
    "rx": -179,
    "ry": 103,
    "rz": -47,
    "s": 5
  },
  {
    "char": "A",
    "x": 828,
    "y": 852,
    "z": 781,
    "rx": 86,
    "ry": 107,
    "rz": 86,
    "s": 3.8
  },
  {
    "char": "Y",
    "x": 937,
    "y": 1162,
    "z": 755,
    "rx": 80,
    "ry": -219,
    "rz": -50,
    "s": 3.8
  },
  {
    "char": ".",
    "x": 1289,
    "y": 293,
    "z": 1190,
    "rx": -178,
    "ry": 134,
    "rz": -34,
    "s": 5
  }
];

export default function BenefitsSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const typographyRef = useRef(null);
  const letterRefs = useRef([]);
  const cardRefs = useRef([]);
  const sectionHeaderRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.innerWidth >= 768;

      if (prefersReducedMotion) {
        if (typographyRef.current) gsap.set(typographyRef.current, { display: "none" });
        if (sectionHeaderRef.current) gsap.set(sectionHeaderRef.current, { opacity: 1, y: 0 });
        cardRefs.current.forEach((el) => {
          if (el) gsap.set(el, { opacity: 1, x: 0, y: 0, z: 0, scale: 1, rotateY: 0, rotateX: 0 });
        });
        return;
      }

      // 1. Initial State: Centered headline letters in pristine position
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

      // 2. Initial State: Cards primed in 3D space ready for entrance
      if (cardRefs.current[0]) {
        gsap.set(cardRefs.current[0], {
          opacity: 0,
          x: isDesktop ? -260 : -40,
          y: isDesktop ? 40 : 20,
          z: -280,
          rotateY: isDesktop ? 26 : 0,
          scale: 0.78,
          transformOrigin: "center center",
          force3D: true,
        });
      }
      if (cardRefs.current[1]) {
        gsap.set(cardRefs.current[1], {
          opacity: 0,
          x: 0,
          y: isDesktop ? 70 : 30,
          z: -360,
          scale: 0.68,
          transformOrigin: "center center",
          force3D: true,
        });
      }
      if (cardRefs.current[2]) {
        gsap.set(cardRefs.current[2], {
          opacity: 0,
          x: isDesktop ? 260 : 40,
          y: isDesktop ? 40 : 20,
          z: -280,
          rotateY: isDesktop ? -26 : 0,
          scale: 0.78,
          transformOrigin: "center center",
          force3D: true,
        });
      }

      if (sectionHeaderRef.current) {
        gsap.set(sectionHeaderRef.current, { opacity: 0, y: -20 });
      }

      // ============================================================
      // MASTER COORDINATED GSAP SCROLL-TRIGGER TIMELINE
      // 0.00 -> 0.04: Headline intact
      // 0.02 -> 0.28: High-velocity 3D explosive shatter flying completely off-screen
      // 0.14 -> 0.28: Typography wrapper fades out, persistent header emerges
      // 0.16 -> 0.42: 3 Bright cards fan out from left, center, right
      // 0.42 -> 1.00: Steady hold for full card interaction & hover
      // ============================================================
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1100",
          pin: stage,
          pinSpacing: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // A. Explosive Letter Shatter: Letters shoot out across entire screen
      letterRefs.current.forEach((el, idx) => {
        if (el) {
          const cfg = SHATTER_LETTERS[idx] || { x: 0, y: 0, z: 400, rx: 0, ry: 0, rz: 0, s: 3.5 };
          tl.to(
            el,
            {
              x: cfg.x * (isDesktop ? 1.0 : 0.55),
              y: cfg.y * (isDesktop ? 1.0 : 0.55),
              z: cfg.z,
              rotateX: cfg.rx,
              rotateY: cfg.ry,
              rotateZ: cfg.rz,
              scale: cfg.s,
              opacity: 0,
              filter: "blur(14px)",
              duration: 0.26,
              ease: "power2.inOut",
            },
            0.02 + (idx % 6) * 0.01
          );
        }
      });

      // B. Typography Container Fades Out (Clean transition, no ghosting)
      if (typographyRef.current) {
        tl.to(
          typographyRef.current,
          {
            opacity: 0,
            duration: 0.15,
            ease: "power2.out",
            pointerEvents: "none",
          },
          0.18
        );
      }

      // C. Persistent Section Header Fades In at Top
      if (sectionHeaderRef.current) {
        tl.to(
          sectionHeaderRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.20,
            ease: "power2.out",
          },
          0.16
        );
      }

      // D. Three-Card 3D Entrance: Left zooms in, Center scales from depth, Right zooms in
      if (cardRefs.current[0]) {
        tl.to(
          cardRefs.current[0],
          {
            opacity: 1,
            x: 0,
            y: 0,
            z: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.32,
            ease: "power3.out",
          },
          0.16
        );
      }
      if (cardRefs.current[1]) {
        tl.to(
          cardRefs.current[1],
          {
            opacity: 1,
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
            duration: 0.34,
            ease: "power3.out",
          },
          0.20
        );
      }
      if (cardRefs.current[2]) {
        tl.to(
          cardRefs.current[2],
          {
            opacity: 1,
            x: 0,
            y: 0,
            z: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.32,
            ease: "power3.out",
          },
          0.24
        );
      }

      // E. Hold composition steady for reading & interaction
      tl.to({}, { duration: 0.40 }, 0.60);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="relative w-full bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)] select-none"
    >
      {/* PINNED STAGE VIEWPORT */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden flex flex-col justify-between pt-16 sm:pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-[linear-gradient(180deg,#D2D2D2_0%,#DFDFE4_35%,#ECECEF_100%)]"
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        {/* ========================================================================= */}
        {/* PHASE 1 & 2: FULLSCREEN SHATTER TYPOGRAPHY (Explodes across entire screen)*/}
        {/* ========================================================================= */}
        <div
          ref={typographyRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.06] border border-black/[0.12] text-[#2A2A32] text-xs font-mono font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Autonomous Enterprise Advantages</span>
          </div>

          <h1
            className="font-headline font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-[#0B0B10] uppercase text-center max-w-5xl leading-tight flex flex-wrap justify-center gap-x-2 sm:gap-x-3"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            {SHATTER_LETTERS.map((item, idx) =>
              item.isSpace ? (
                <span key={idx} className="w-2 sm:w-3" />
              ) : (
                <span
                  key={idx}
                  ref={(el) => (letterRefs.current[idx] = el)}
                  className="inline-block will-change-transform text-[#0B0B10] drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
                  style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                  {item.char}
                </span>
              )
            )}
          </h1>

          <p className="mt-6 text-xs sm:text-sm text-[#374151] max-w-xl text-center font-semibold leading-relaxed">
            Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* PERSISTENT HEADER (Appears smoothly as letters shatter)                   */}
        {/* ========================================================================= */}
        <div
          ref={sectionHeaderRef}
          className="relative z-10 max-w-4xl mx-auto text-center shrink-0 pt-2 pb-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.06] border border-black/[0.1] text-xs font-mono font-bold uppercase tracking-widest text-[#2A2A32] mb-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Autonomous Enterprise Advantages</span>
          </div>
          <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-[#0B0B10] tracking-tight leading-tight">
            Don&apos;t Let Valuable Conversations Slip Away.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#1F2937] font-semibold max-w-xl mx-auto hidden sm:block">
            Your website should be ready to answer, assist, and capture interest — even when your team is unavailable.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3 COLORFUL VIBRANT CARDS (RICH DEEP COLOR PALETTE WITH 100% VISIBLE TEXT)  */}
        {/* ========================================================================= */}
        <div
          className="key-card-list relative z-20 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch w-full max-w-6xl mx-auto my-auto"
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
        >
          {/* ======================================================================= */}
          {/* CARD 01: VIBRANT CYBER EMERALD GREEN (Rich deep saturated color)        */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#062D21] via-[#0A3D2D] to-[#031E15] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_45px_rgba(16,185,129,0.35)] hover:shadow-[0_25px_55px_rgba(16,185,129,0.50)] border-2 border-[#10B981] hover:border-[#34D399] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Green Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#10B981]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981]/25 text-[#6EE7B7] border border-[#10B981]/50">
                  Card 01 · 24/7 Engine
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live 24/7
                </span>
              </div>

              {/* Heading & Subtitle in 100% Crisp High-Contrast White */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-3 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                24/7 AI ASSISTANCE
              </h3>
              <p className="text-xs text-[#D1FAE5] mt-1.5 leading-relaxed font-medium">
                Let customers get answers to their questions anytime, even outside business hours.
              </p>
            </div>

            {/* Interactive Chat Preview */}
            <div className="relative z-10 my-3 py-2 bg-[#02150E]/85 backdrop-blur-md rounded-xl p-3 border border-[#10B981]/40 space-y-1.5 shadow-inner">
              <div className="bg-[#0A3D2D] text-[#E6FBF2] border border-[#10B981]/30 rounded-lg p-2 text-[10px] leading-snug max-w-[92%] ml-auto font-medium">
                Can I schedule an executive consultation for tomorrow?
              </div>
              <div className="bg-[#10B981] text-white rounded-lg p-2 text-[10px] leading-snug max-w-[95%] font-semibold shadow-sm">
                Absolutely! Reserved 3:00 PM tomorrow with our senior specialist.
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-2.5 border-t border-[#10B981]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#6EE7B7] uppercase">
                ALWAYS AVAILABLE
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 02: VIBRANT ROYAL VIOLET / PURPLE (Rich deep saturated color)      */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#270E43] via-[#35135C] to-[#1A0830] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_45px_rgba(150,61,255,0.40)] hover:shadow-[0_25px_55px_rgba(150,61,255,0.55)] border-2 border-[#963DFF] hover:border-[#B86BFF] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Purple Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#963DFF]/35 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#963DFF]/30 text-[#D8B4FE] border border-[#963DFF]/50">
                  Card 02 · Auto Assist
                </span>
                <span className="text-[11px] font-bold text-[#E9D5FF]">
                  AI Assistant
                </span>
              </div>

              {/* Heading & Subtitle in 100% Crisp High-Contrast White */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-3 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                LESS MANUAL WORK
              </h3>
              <p className="text-xs text-[#EDE4FF] mt-1.5 leading-relaxed font-medium">
                Reduce repetitive customer interactions and give your team more time for important work.
              </p>
            </div>

            {/* Central Metric Ring */}
            <div className="relative z-10 my-3 flex flex-col items-center justify-center">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#1A0830] shadow-[0_8px_30px_rgba(150,61,255,0.40)] border-2 border-[#963DFF]/60 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <span className="font-headline font-black text-2xl text-white tracking-tight">
                  1.5K<span className="text-[#C28AFF]">+</span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase text-[#D8B4FE] mt-0.5">
                  Automated
                </span>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-2.5 border-t border-[#963DFF]/40 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#D8B4FE] uppercase">
                AUTOMATED QUERY RESOLUTION
              </span>
              <Sparkles className="w-4 h-4 text-[#C28AFF] shrink-0" />
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CARD 03: VIBRANT ELECTRIC AZURE BLUE (Rich deep saturated color)        */}
          {/* ======================================================================= */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="featured-card group relative rounded-2xl bg-gradient-to-br from-[#082F49] via-[#0C4A6E] to-[#041D2E] p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_45px_rgba(2,132,199,0.35)] hover:shadow-[0_25px_55px_rgba(2,132,199,0.50)] border-2 border-[#0284C7] hover:border-[#38BDF8] overflow-hidden min-h-[350px] sm:min-h-[370px] will-change-transform transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Blue Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#0284C7]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Top Pill Tag */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0284C7]/25 text-[#7DD3FC] border border-[#0284C7]/50">
                  Card 03 · Pipeline IQ
                </span>
                <span className="text-[11px] font-bold text-[#BAE6FD]">
                  Enquiries
                </span>
              </div>

              {/* Heading & Subtitle in 100% Crisp High-Contrast White */}
              <h3 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight mt-3 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                LEAD VISIBILITY
              </h3>
              <p className="text-xs text-[#E0F2FE] mt-1.5 leading-relaxed font-medium">
                See customer conversations and enquiries generated through your website assistant.
              </p>
            </div>

            {/* Pipeline Feed Box */}
            <div className="relative z-10 my-3 py-2 bg-[#021827]/85 backdrop-blur-md rounded-xl p-3 border border-[#0284C7]/40 space-y-2 shadow-inner text-[11px]">
              <div className="flex items-center justify-between border-b border-[#0284C7]/30 pb-1.5">
                <span className="text-white font-bold text-[10px]">Commercial Rollout</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  HOT LEAD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-[10px]">Executive Consultation</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  QUALIFIED
                </span>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="relative z-10 pt-2.5 border-t border-[#0284C7]/30 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#7DD3FC] uppercase">
                CONVERSATIONS & ENQUIRIES
              </span>
              <TrendingUp className="w-4 h-4 text-[#38BDF8] shrink-0" />
            </div>
          </div>
        </div>

        {/* Phase 5 Interactive Hover Hint */}
        <div className="relative z-10 max-w-xl mx-auto text-center shrink-0">
          <p className="font-mono text-[11px] text-[#4B5563] tracking-widest uppercase font-bold flex items-center justify-center gap-2">
            <span>Hover over any card to inspect commercial parameters</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
          </p>
        </div>
      </div>
    </section>
  );
}
