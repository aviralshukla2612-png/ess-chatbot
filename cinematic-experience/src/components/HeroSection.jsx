import React, { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  X,
  Sparkles,
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
  const pillBarRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pillBarRef.current && !pillBarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const HERO_INDUSTRY_DATA = {
    "real-estate": {
      id: "real-estate",
      title: "Real Estate Assistant",
      color: "#C28AFF",
      shortDesc: "Answers unit layout & pricing questions, shares floor plans, and schedules private VIP viewings into your CRM.",
      badges: ["✦ Property PDF Grounded", "✦ VIP Tour Booking"],
      ctaText: "Deploy",
      ctaLink: "/login?industry=real-estate",
    },
    healthcare: {
      id: "healthcare",
      title: "Healthcare Intake Assistant",
      color: "#55A9FF",
      shortDesc: "24/7 patient intake, verified medical FAQs, insurance network eligibility checks, and doctor consultation bookings.",
      badges: ["✦ Clinical Intake Routing", "✦ Insurance Network Check"],
      ctaText: "Deploy",
      ctaLink: "/login?industry=healthcare",
    },
    education: {
      id: "education",
      title: "Admissions Counselor",
      color: "#C28AFF",
      shortDesc: "Guides prospective students on degree prerequisites, tuition fees, scholarship criteria, and captures enrollment leads.",
      badges: ["✦ Prospectus Ingestion", "✦ Student Lead Capture"],
      ctaText: "Deploy",
      ctaLink: "/login?industry=education",
    },
    hospitality: {
      id: "hospitality",
      title: "Guest Concierge",
      color: "#FF713D",
      shortDesc: "Handles 24/7 suite reservations, dining menus, local itineraries, and bespoke guest inquiries with zero delay.",
      badges: ["✦ Direct Suite Booking", "✦ 24/7 Digital Concierge"],
      ctaText: "Deploy",
      ctaLink: "/login?industry=hospitality",
    },
    retail: {
      id: "retail",
      title: "Shopping Assistant",
      color: "#22C8F2",
      shortDesc: "Recommends products from your catalog, tracks live orders, and resolves returns with zero wait times.",
      badges: ["✦ Live Order Tracking", "✦ Product Recommendations"],
      ctaText: "Deploy",
      ctaLink: "/login?industry=retail",
    },
    "and-more": {
      id: "and-more",
      title: "Custom AI for Any Site",
      color: "#A494F4",
      shortDesc: "Upload company PDFs, Word docs, or website URLs to deploy an autonomous sales assistant in 5 minutes.",
      badges: ["✦ 1-Line Universal Embed", "✦ 99.8% Grounded Accuracy"],
      ctaText: "Build Now",
      ctaLink: "/login",
    },
  };

  const handleToggleIndustryDropdown = (indId = "real-estate") => {
    setActiveDropdown((prev) => (prev === indId ? null : indId));
  };

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center pt-20 pb-6 px-4 sm:px-6 md:px-8 bg-[#050507] overflow-visible"
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
          {/* Primary CTA: Get Started */}
          <button
            type="button"
            onClick={onOpenTrial}
            className="px-8 py-3.5 rounded-full font-medium text-sm sm:text-base text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer group shadow-[0_8px_25px_rgba(158,96,244,0.45)]"
          >
            <span>Get Started</span>
            <span className="text-lg leading-none transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>

          {/* Secondary CTA: Explore the Experience */}
          <button
            type="button"
            onClick={() => handleToggleIndustryDropdown("real-estate")}
            className="px-7 py-3.5 rounded-full font-medium text-sm sm:text-base btn-secondary-glass flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center group-hover:border-[#A494F4] group-hover:bg-[#9E60F4]/20 transition-all">
              <Play className="w-2 h-2 fill-current text-white group-hover:text-[#A494F4] transition-colors ml-0.5" />
            </div>
            <span>Explore the Experience</span>
          </button>
        </div>
      </div>

      {/* Floating Glass Pill Bar with Down-Side Curtain Card */}
      <div ref={pillBarRef} className="relative z-30 w-full max-w-5xl mx-auto mb-2 sm:mb-4 px-3 sm:px-4 shrink-0 flex flex-col items-center">
        {/* Pill Capsule */}
        <div className="w-full overflow-x-auto no-scrollbar scrollbar-none py-1 flex justify-start sm:justify-center items-center touch-pan-x overscroll-x-contain px-2 sm:px-0">
          <div
            ref={industriesRef}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-2 rounded-full bg-[#12121A]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.6)] shrink-0 min-w-max"
          >
            {industries.map((ind, idx) => {
              const Icon = ind.icon;
              const isOpen = activeDropdown === ind.id;
              return (
                <React.Fragment key={ind.id}>
                  <button
                    type="button"
                    onClick={() => handleToggleIndustryDropdown(ind.id)}
                    className={`group/pill inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isOpen
                        ? "text-white bg-white/[0.14] border border-[#C28AFF]/60 shadow-[0_0_16px_rgba(194,138,255,0.35)]"
                        : "text-[#D9D9E2] hover:text-white hover:bg-white/[0.08] border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors stroke-[1.8] shrink-0 ${
                        isOpen ? "text-[#C28AFF]" : "text-[#D9D9E2] group-hover/pill:text-white"
                      }`}
                    />
                    <span>{ind.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-[#9898A6] transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-[#C28AFF]" : "group-hover/pill:text-white"
                      }`}
                    />
                  </button>
                  {idx < industries.length - 1 && (
                    <div className="w-px h-3 sm:h-3.5 bg-white/15 my-auto shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* DOWN-SIDE CURTAIN CARD (Short, little information, curtain effect)  */}
        {/* =================================================================== */}
        {activeDropdown && HERO_INDUSTRY_DATA[activeDropdown] && (() => {
          const indData = HERO_INDUSTRY_DATA[activeDropdown];
          const activeIndObj = industries.find((i) => i.id === activeDropdown);
          const ActiveIcon = activeIndObj ? activeIndObj.icon : Building2;

          return (
            <div className="w-full max-w-xl mx-auto mt-2 sm:mt-2.5 origin-top animate-curtain-down overflow-hidden">
              <div className="relative w-full bg-[#0E0E18]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-3 sm:p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(150,61,255,0.15)] text-white">
                {/* Top curtain accent trim */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-90"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${indData.color}, transparent)`,
                  }}
                />

                <div className="flex items-start justify-between gap-3">
                  {/* Left: Icon + Title + 1 Line Short Info */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${indData.color}20`,
                        border: `1px solid ${indData.color}50`,
                      }}
                    >
                      <ActiveIcon className="w-3.5 h-3.5" style={{ color: indData.color }} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {indData.title}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Active</span>
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] sm:text-xs text-[#C5C5D2] leading-snug line-clamp-2">
                        {indData.shortDesc}
                      </p>

                      {/* 2 Micro Badges */}
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {indData.badges.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-[#D9D9E2]"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Close + CTA Button */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(null)}
                      className="w-5 h-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#9898A6] hover:text-white transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={onOpenTrial}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white btn-primary-gradient cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all whitespace-nowrap mt-auto"
                    >
                      <span>{indData.ctaText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

