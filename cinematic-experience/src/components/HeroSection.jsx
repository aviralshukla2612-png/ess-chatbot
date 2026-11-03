import React, { useEffect, useRef } from "react";
import {
  ArrowRight,
  Play,
  Building2,
  Plus,
  PlusSquare,
  GraduationCap,
  BedDouble,
  ShoppingBag,
  Layers,
} from "lucide-react";
import gsap from "gsap";

export default function HeroSection({ onOpenExperience, onOpenTrial, onSelectIndustry }) {
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const highlightRef = useRef(null);
  const subtextRef = useRef(null);
  const ctaRef = useRef(null);
  const industriesRef = useRef(null);
  const ambientLightRef = useRef(null);

  // GSAP Entrance Choreography
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Initial fade-in of background ambient glow
      if (ambientLightRef.current) {
        tl.fromTo(
          ambientLightRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 1.6, ease: "sine.out" },
          0
        );
      }

      // 2. Reveal the main headline with cinematic rise & mask
      if (headlineRef.current) {
        tl.fromTo(
          headlineRef.current.children,
          { opacity: 0, y: 40, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.2 },
          0.3
        );
      }

      // 3. Highlighted second line glow sweep
      if (highlightRef.current) {
        tl.fromTo(
          highlightRef.current,
          { textShadow: "0 0 0px rgba(150, 61, 255, 0)" },
          {
            textShadow:
              "0 0 25px rgba(194, 138, 255, 0.9), 0 0 50px rgba(150, 61, 255, 0.7), 0 0 80px rgba(85, 169, 255, 0.4)",
            duration: 1.2,
            ease: "power2.inOut",
          },
          0.8
        );
      }

      // 4. Reveal supporting subtext
      if (subtextRef.current) {
        tl.fromTo(
          subtextRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9 },
          0.9
        );
      }

      // 5. Reveal CTA buttons
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 25, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.15 },
          1.1
        );
      }

      // 6. Staggered reveal of 6 industry showcase items
      if (industriesRef.current) {
        tl.fromTo(
          industriesRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
          1.3
        );
      }
    }, heroRef);

    // Mouse Parallax Interaction on Ambient Glow
    const handleMouseMove = (e) => {
      if (!ambientLightRef.current) return;
      const { clientX, clientY } = e;
      const xPercent = (clientX / window.innerWidth - 0.5) * 20;
      const yPercent = (clientY / window.innerHeight - 0.5) * 20;

      gsap.to(ambientLightRef.current, {
        x: xPercent,
        y: yPercent,
        duration: 2,
        ease: "power1.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const industries = [
    { id: "real-estate", label: "Real Estate", icon: Building2 },
    { id: "healthcare", label: "Healthcare", icon: Plus },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "hospitality", label: "Hospitality", icon: BedDouble },
    { id: "retail", label: "Retail", icon: ShoppingBag },
    { id: "and-more", label: "And More", icon: Layers },
  ];

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative h-screen min-h-[600px] max-h-screen w-full flex flex-col justify-between items-center pt-20 pb-4 px-4 sm:px-6 md:px-8 overflow-hidden bg-[#050507]"
    >
      {/* 1. Underlying Metallic Wave Background (User provided bg.png) - Clean with seamless black blend */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('/bg.png?v=2')`,
        }}
      />
      {/* Dark gradient overlay over bg.png so it blends into pure #050507 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050507] via-transparent to-[#050507] pointer-events-none" />

      {/* Subtle Technical Grid Background & Ambient Lighting matching Industries */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35 z-0"
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

      {/* 2. Central Hero Content Block (Vertically centered) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto my-auto flex flex-col items-center text-center">
        {/* Main Headline */}
        <h1
          ref={headlineRef}
          className="font-headline tracking-normal text-white uppercase text-center flex flex-col items-center justify-center select-none"
          style={{
            lineHeight: "0.95",
            fontSize: "clamp(2rem, 4.6vw, 4.5rem)",
          }}
        >
          {/* Line 1: WHATEVER YOUR INDUSTRY, */}
          <span className="block text-[#F5F5F7] tracking-[0.02em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            WHATEVER YOUR INDUSTRY,
          </span>

          {/* Line 2: YOUR CUSTOMERS HAVE QUESTIONS. */}
          <span
            ref={highlightRef}
            className="block tracking-[0.02em] mt-1 sm:mt-1.5 text-gradient-purple-blue drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            YOUR CUSTOMERS HAVE QUESTIONS.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p
          ref={subtextRef}
          className="mt-3 sm:mt-4 max-w-[760px] text-xs sm:text-sm md:text-base text-[#9898A6] font-normal leading-relaxed text-center"
        >
          Give every visitor a better way to connect with your business, get answers
          and discover what you offer — 24/7.
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className="mt-5 sm:mt-6 flex flex-row items-center justify-center gap-3.5 w-auto"
        >
          {/* Primary CTA: Start Free Trial matching user screenshot */}
          <button
            type="button"
            onClick={onOpenTrial}
            className="px-8 py-3.5 rounded-full font-medium text-sm sm:text-base text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer group shadow-[0_8px_25px_rgba(158,96,244,0.45)]"
          >
            <span>Start Free Trial</span>
            <span className="text-lg leading-none transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>

          {/* Secondary CTA: Explore the Experience */}
          <button
            type="button"
            onClick={onOpenExperience}
            className="px-7 py-3.5 rounded-full font-medium text-sm sm:text-base btn-secondary-glass flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center group-hover:border-[#A494F4] group-hover:bg-[#9E60F4]/20 transition-all">
              <Play className="w-2 h-2 fill-current text-white group-hover:text-[#A494F4] transition-colors ml-0.5" />
            </div>
            <span>Explore the Experience</span>
          </button>
        </div>
      </div>

      {/* Floating Glass Pill Bar (Matches user reference: single continuous horizontal pill capsule over wave) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-3 sm:mb-5 px-4 flex justify-center shrink-0">
        <div
          ref={industriesRef}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#12121A]/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
        >
          {industries.map((ind, idx) => {
            const Icon = ind.icon;
            return (
              <React.Fragment key={ind.id}>
                <button
                  type="button"
                  onClick={() => onSelectIndustry?.(ind.id)}
                  className="group/pill inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[#D9D9E2] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D9D9E2] group-hover/pill:text-white transition-colors stroke-[1.8]" />
                  <span className="whitespace-nowrap">{ind.label}</span>
                </button>
                {idx < industries.length - 1 && (
                  <div className="w-px h-3.5 bg-white/15 my-auto shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

