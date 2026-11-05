"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STAGES = [
  {
    number: "01",
    badge: "INGESTION",
    title: "Connect Your Business Knowledge",
    description:
      "Provide your business information, brochures, pricing details, FAQs, documents, or website content.",
    image: "/img1.png",
    accent: "#963DFF",
    glowColor: "rgba(150, 61, 255, 0.45)",
  },
  {
    number: "02",
    badge: "PERSONA ENGINE",
    title: "Shape Your Assistant",
    description:
      "Configure your assistant's personality, welcome message, brand appearance, and launcher settings.",
    image: "/image2.png",
    accent: "#C28AFF",
    glowColor: "rgba(194, 138, 255, 0.45)",
  },
  {
    number: "03",
    badge: "LIVE EMBED",
    title: "Bring Your Assistant to Your Website",
    description:
      "Integrate your configured assistant into your website using the provided embed code.",
    image: "/img3.png",
    accent: "#55A9FF",
    glowColor: "rgba(85, 169, 255, 0.45)",
  },
];

export default function HowItWorksSection({ onOpenTrial }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const activeStageRef = useRef(0);

  // Sync ref with state for event handlers
  useEffect(() => {
    activeStageRef.current = activeStage;
  }, [activeStage]);

  // GSAP ScrollTrigger MatchMedia Setup
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (typeof window !== "undefined") {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    const mm = gsap.matchMedia(containerRef);

    // Desktop & Large Screens (>= 1024px): Pinned Interactive Split Screen
    mm.add("(min-width: 1024px)", () => {
      const pinTrigger = ScrollTrigger.create({
        id: "nexus-process-pin",
        trigger: container,
        start: "top top",
        end: "+=1700",
        pin: stage,
        anticipatePin: 1,
        scrub: 0.5,
        pinSpacing: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          let target = 0;
          if (p >= 0.66) {
            target = 2;
          } else if (p >= 0.33) {
            target = 1;
          } else {
            target = 0;
          }
          if (activeStageRef.current !== target) {
            setActiveStage(target);
          }
        },
      });

      return () => {
        pinTrigger.kill();
      };
    });

    return () => mm.revert();
  }, []);

  const handleStageClick = (index) => {
    setActiveStage(index);
    if (typeof window !== "undefined") {
      const pinTrigger = ScrollTrigger.getById("nexus-process-pin");
      if (pinTrigger) {
        const targetScroll =
          pinTrigger.start + (pinTrigger.end - pinTrigger.start) * (index / 2);
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative w-full bg-[#050507] text-[#F5F5F7] overflow-hidden select-none"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="nexus-grid-overlay opacity-25 absolute inset-0" />
        <div className="absolute top-[20%] left-[10%] w-[450px] h-[350px] rounded-full bg-[#963DFF]/10 blur-[130px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[400px] rounded-full bg-[#55A9FF]/10 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050507] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050507] to-transparent" />
      </div>

      {/* Center Stage Container: perfectly balanced inside 100dvh without vertical cutoff */}
      <div
        ref={stageRef}
        className="relative z-10 w-full min-h-[100dvh] flex items-center py-6 sm:py-8 lg:py-6 px-4 sm:px-6 lg:px-10 max-w-[1360px] mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center w-full">
          {/* ================================================================= */}
          {/* LEFT COLUMN: EDITORIAL HEADER + INTERACTIVE STAGES LIST           */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Editorial Header (Integrated inside left column per reference) */}
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 mb-2 sm:mb-2.5">
                <span className="w-5 h-px bg-white/20" />
                <span className="text-[11px] font-space-mono font-bold tracking-[0.25em] uppercase text-[#963DFF]">
                  PROCESS
                </span>
                <span className="w-5 h-px bg-white/20" />
              </div>

              <h2 className="font-playfair font-bold text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.35rem] tracking-normal uppercase leading-[1.14] text-white">
                FROM RAW DOCUMENTS TO{" "}
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#963DFF] to-[#55A9FF] drop-shadow-[0_0_20px_rgba(150,61,255,0.4)]">
                  AUTONOMOUS SALES
                </span>{" "}
                IN 5 MINUTES.
              </h2>
              <p className="mt-2 text-xs sm:text-[13px] text-[#9898A6] leading-relaxed font-inter font-normal max-w-md">
                No machine learning engineers, vector database setups, or prompt writing required.
              </p>
            </div>

            {/* Interactive Stages Navigation List */}
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {STAGES.map((st, idx) => {
                const isActive = activeStage === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStageClick(idx)}
                    className={`group relative text-left w-full pl-5 sm:pl-6 pr-4 sm:pr-6 py-3.5 sm:py-4 rounded-2xl transition-all duration-400 cursor-pointer ${
                      isActive
                        ? "bg-white/[0.05] border border-white/[0.1] shadow-[0_10px_25px_-8px_rgba(0,0,0,0.6)]"
                        : "bg-transparent border border-transparent hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Left Accent Bar / Progress Indicator */}
                    <div
                      className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-400 ${
                        isActive
                          ? "bg-gradient-to-b from-[#C28AFF] via-[#963DFF] to-[#55A9FF] shadow-[0_0_12px_rgba(150,61,255,0.85)] scale-y-100"
                          : "bg-white/10 group-hover:bg-white/20 scale-y-60"
                      }`}
                    />

                    {/* Stage Title */}
                    <h3
                      className={`font-playfair font-bold text-base sm:text-lg lg:text-[1.28rem] tracking-normal transition-colors duration-300 ${
                        isActive
                          ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                          : "text-[#9898A6] group-hover:text-white"
                      }`}
                    >
                      {st.title}
                    </h3>

                    {/* Collapsible Description Accordion */}
                    <div
                      className={`grid transition-all duration-400 ease-out overflow-hidden ${
                        isActive
                          ? "grid-rows-[1fr] opacity-100 mt-2"
                          : "grid-rows-[0fr] opacity-0 mt-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs text-[#9898A6] leading-relaxed font-inter font-normal">
                          {st.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: ONLY GLOWING IMAGE STAGE                             */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 w-full flex items-center justify-center">
            <div className="relative w-full min-h-[280px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px] flex items-center justify-center select-none">
              {STAGES.map((st, idx) => {
                const isVisualActive = activeStage === idx;
                return (
                  <div
                    key={idx}
                    className={`w-full flex items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isVisualActive
                        ? "relative opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "absolute inset-0 opacity-0 translate-y-4 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="relative w-full max-w-[560px] sm:max-w-[620px] lg:max-w-[660px] group mx-auto">
                      {/* Atmospheric Ambient Halo Glow */}
                      <div
                        className="absolute -inset-1 sm:-inset-2 rounded-[22px] sm:rounded-[28px] opacity-75 blur-xl sm:blur-2xl transition-all duration-700 pointer-events-none group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${st.accent} 0%, rgba(150, 61, 255, 0.35) 60%, transparent 100%)`,
                        }}
                      />

                      {/* Glowing Gradient Border Frame */}
                      <div
                        className="relative rounded-[20px] sm:rounded-[26px] p-[1.5px] sm:p-[2px] transition-all duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${st.accent} 0%, rgba(255, 255, 255, 0.45) 50%, ${st.accent} 100%)`,
                          boxShadow: `0 0 35px -5px ${st.accent}80, 0 0 15px 0px ${st.accent}50, inset 0 0 15px -2px ${st.accent}40`,
                        }}
                      >
                        {/* Inner Image Container */}
                        <div className="relative rounded-[18px] sm:rounded-[24px] overflow-hidden bg-[#050507]">
                          <img
                            src={st.image}
                            alt={st.title}
                            className="w-full h-auto object-contain block drop-shadow-[0_20px_45px_rgba(0,0,0,0.9)] transition-transform duration-500 hover:scale-[1.01]"
                            loading="eager"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
