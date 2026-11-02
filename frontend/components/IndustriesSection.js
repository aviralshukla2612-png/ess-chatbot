import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Building2,
  Plus,
  GraduationCap,
  BedDouble,
  ShoppingBag,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const INDUSTRIES = [
  {
    id: "real-estate",
    category: "Real Estate",
    name: "Commercial & Residential Developments",
    subtitle: "Floor plans, unit availability, pricing tiers and private viewings.",
    icon: Building2,
    video: "/videos/industries/real-estate.mp4",
    poster: "/images/industries/real-estate.webp",
    fallbackBg: "linear-gradient(135deg, #1E1233 0%, #0B0B14 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the penthouse floor plans, pricing tiers, and private viewing availability?",
    badge: "Unit Specs & Pricing",
    capability: "Verified Property Knowledge Base",
  },
  {
    id: "healthcare",
    category: "Healthcare",
    name: "Clinics & Specialized Medical Practices",
    subtitle: "Treatments, specialist credentials, clinical intake and insurance coverage.",
    icon: Plus,
    video: "/videos/industries/healthcare.mp4",
    poster: "/images/industries/healthcare.webp",
    fallbackBg: "linear-gradient(135deg, #122233 0%, #080D14 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Are diagnostic consultations and treatment packages covered under private insurance?",
    badge: "Clinical Intake & Eligibility",
    capability: "Autonomous Clinical Intake & Routing",
  },
  {
    id: "education",
    category: "Education",
    name: "Higher Education & University Campuses",
    subtitle: "Degree programs, admissions criteria, curriculum prerequisites and tuition.",
    icon: GraduationCap,
    video: "/videos/industries/education.mp4",
    poster: "/images/industries/education.webp",
    fallbackBg: "linear-gradient(135deg, #241433 0%, #0C0814 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the application deadlines, scholarship options, and credit requirements for Fall 2026?",
    badge: "Programs & Admissions",
    capability: "Program Discovery & Admissions FAQ",
  },
  {
    id: "hospitality",
    category: "Hospitality",
    name: "Luxury Hotels & Resort Destinations",
    subtitle: "Suite reservations, concierge services, dining options and bespoke stays.",
    icon: BedDouble,
    video: "/videos/industries/hospitality.mp4",
    poster: "/images/industries/hospitality.webp",
    fallbackBg: "linear-gradient(135deg, #1E1A33 0%, #090812 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Can we reserve an executive suite with bespoke dining, airport transfers, and late checkout?",
    badge: "Suites & Bespoke Stays",
    capability: "24/7 Suite Reservations & Concierge",
  },
  {
    id: "retail",
    category: "Retail & E-commerce",
    name: "Omnichannel Brands & Luxury Retail",
    subtitle: "Product specifications, order policies, warranty details and sizing guidance.",
    icon: ShoppingBag,
    video: "/videos/industries/retail.mp4",
    poster: "/images/industries/retail.webp",
    fallbackBg: "linear-gradient(135deg, #2A1040 0%, #080512 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the warranty options, seasonal bundle discounts, and same-day delivery coverage?",
    badge: "Products & Order Assistance",
    capability: "Real-Time Product Q&A & Sizing",
  },
  {
    id: "services",
    category: "Professional Services",
    name: "Consulting & Corporate Advisory",
    subtitle: "Service scoping, enterprise capabilities and senior practice routing.",
    icon: Briefcase,
    video: "/videos/industries/professional-services.mp4",
    poster: "/images/industries/professional-services.webp",
    fallbackBg: "linear-gradient(135deg, #121A30 0%, #070914 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "How does Emperor Nexus qualify corporate client requirements and route briefings to senior partners?",
    badge: "Advisory & Case Scoping",
    capability: "Lead Qualification & Partner Routing",
  },
  {
    id: "ai-assistant",
    category: "AI Sales & Assistants",
    name: "Autonomous Sales & Enterprise Intelligence",
    subtitle: "Interactive product walkthroughs, intelligent qualification and 24/7 autonomous closing.",
    icon: Sparkles,
    video: "/videos/industries/ai-assistant.mp4",
    poster: "/images/industries/ai-assistant.webp",
    fallbackBg: "linear-gradient(135deg, #2A123E 0%, #090818 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "How does the AI assistant demonstrate product value and convert high-intent inbound visitors?",
    badge: "Autonomous Sales & Q&A",
    capability: "24/7 Autonomous Sales & Conversion",
  },
];

export default function IndustriesSection({ onOpenExperience, onOpenTrial }) {
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const collageRef = useRef(null);
  const bottomNavRef = useRef(null);
  const tileRefs = useRef([]);
  const videoRefs = useRef([]);

  const [activeHover, setActiveHover] = useState(null);

  // Video IntersectionObserver to preserve resources when offscreen
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          videoRefs.current.forEach((vid) => {
            if (!vid) return;
            if (entry.isIntersecting) {
              vid.play().catch(() => {});
            } else {
              vid.pause();
            }
          });
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Coordinated GSAP entrance animation: smooth reveal of all elements on one page
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });

      tl.from(headlineRef.current, {
        opacity: 0,
        x: -25,
        duration: 0.8,
        ease: "power2.out",
      })
        .from(
          collageRef.current,
          {
            opacity: 0,
            scale: 0.94,
            x: 25,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .from(
          bottomNavRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.4"
        );
    }, sectionRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="relative w-full h-screen min-h-[640px] max-h-[1080px] bg-[#050507] text-[#F5F5F7] overflow-hidden flex flex-col justify-between py-5 sm:py-6 lg:py-8 px-4 sm:px-8 lg:px-12 select-none"
    >
      {/* Subtle Technical Grid Background & Ambient Lighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
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
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#963DFF]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#55A9FF]/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Eyebrow Badge */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF]">
          <span>/ INDUSTRIES WE SERVE</span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
          <span>Autonomous Business Intelligence</span>
        </div>
      </div>

      {/* ============================================================
          MAIN HERO COMPOSITION:
          Left: Bold Editorial Headline + Supporting Copy + CTA Button
          Right: The 7-Video Mosaic Collage (Seamless, Borderless, ALL 7 VISIBLE)
          Everything fits harmoniously in ONE PAGE
          ============================================================ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto my-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 px-2 sm:px-4">
        {/* Left Column: Bold Typography + Description + CTA */}
        <div
          ref={headlineRef}
          className="flex-1 w-full lg:max-w-[48%] xl:max-w-[50%] flex flex-col justify-center will-change-transform"
        >
          {/* Main Heading matching user requirement */}
          <h2 className="text-white font-sans font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-[3.15rem] xl:text-[3.65rem] leading-[1.02] uppercase">
            <span>DIFFERENT</span>
            <br />
            <span>INDUSTRIES.</span>
            <br />
            <span>DIFFERENT</span>
            <br />
            <span>QUESTIONS.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#B379FF] to-[#55A9FF] drop-shadow-[0_0_24px_rgba(194,138,255,0.45)]">
              ONE BETTER WAY TO CONNECT.
            </span>
          </h2>

          {/* Supporting Copy */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-[14px] text-[#9898A6] max-w-xl leading-relaxed">
            From finding the right property to choosing a healthcare provider, exploring educational opportunities or discovering a new service — every industry has its own conversations.
          </p>

          {/* CTA Button matching user screenshot */}
          <div className="mt-5 sm:mt-6 flex items-center gap-4">
            <button
              onClick={() => (onOpenTrial ? onOpenTrial() : (window.location.href = "/register"))}
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] hover:opacity-95 hover:shadow-[0_0_28px_rgba(150,61,255,0.55)] transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: The 7-Video Mosaic Collage (Border-free, All 7 visible) */}
        <div
          ref={collageRef}
          className="w-full lg:w-[500px] xl:w-[560px] 2xl:w-[600px] shrink-0 flex items-center justify-center will-change-transform"
        >
          {/* 3 Asymmetric Columns forming the balanced 7-video collage (2 - 3 - 2) */}
          <div className="w-full h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] xl:h-[370px] flex gap-1.5 sm:gap-2 rounded-xl overflow-hidden shadow-2xl">
            {/* Column 1 (31% width): Real Estate (57%) + Hospitality (43%) */}
            <div className="w-[31%] h-full flex flex-col gap-1.5 sm:gap-2">
              {/* Tile 0: Real Estate */}
              <div
                ref={(el) => (tileRefs.current[0] = el)}
                onClick={() => onOpenExperience?.("real-estate")}
                onMouseEnter={() => setActiveHover("real-estate")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[57%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[0].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[0] = el)}
                  src={INDUSTRIES[0].video}
                  poster={INDUSTRIES[0].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[0].poster}
                  alt="Real Estate"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase">
                  Real Estate
                </span>
              </div>

              {/* Tile 3: Hospitality */}
              <div
                ref={(el) => (tileRefs.current[3] = el)}
                onClick={() => onOpenExperience?.("hospitality")}
                onMouseEnter={() => setActiveHover("hospitality")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[43%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[3].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[3] = el)}
                  src={INDUSTRIES[3].video}
                  poster={INDUSTRIES[3].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[3].poster}
                  alt="Hospitality"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase">
                  Hospitality
                </span>
              </div>
            </div>

            {/* Column 2 (38% width, Center Hero Column): Healthcare (29%) + AI Assistant (42%) + Retail (29%) */}
            <div className="w-[38%] h-full flex flex-col gap-1.5 sm:gap-2">
              {/* Tile 1: Healthcare */}
              <div
                ref={(el) => (tileRefs.current[1] = el)}
                onClick={() => onOpenExperience?.("healthcare")}
                onMouseEnter={() => setActiveHover("healthcare")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[29%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[1].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[1] = el)}
                  src={INDUSTRIES[1].video}
                  poster={INDUSTRIES[1].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[1].poster}
                  alt="Healthcare"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase">
                  Healthcare
                </span>
              </div>

              {/* Tile 6: AI Sales Assistant (Featured Center Tile) */}
              <div
                ref={(el) => (tileRefs.current[6] = el)}
                onClick={() => onOpenExperience?.("ai-assistant")}
                onMouseEnter={() => setActiveHover("ai-assistant")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[42%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[6].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[6] = el)}
                  src={INDUSTRIES[6].video}
                  poster={INDUSTRIES[6].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[6].poster}
                  alt="AI Sales"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#963DFF]/80 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-[#55A9FF]" />
                  <span>AI Sales</span>
                </span>
              </div>

              {/* Tile 4: Retail & E-commerce */}
              <div
                ref={(el) => (tileRefs.current[4] = el)}
                onClick={() => onOpenExperience?.("retail")}
                onMouseEnter={() => setActiveHover("retail")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[29%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[4].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[4] = el)}
                  src={INDUSTRIES[4].video}
                  poster={INDUSTRIES[4].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[4].poster}
                  alt="Retail"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase">
                  Retail
                </span>
              </div>
            </div>

            {/* Column 3 (31% width): Education (50%) + Professional Services (50%) */}
            <div className="w-[31%] h-full flex flex-col gap-1.5 sm:gap-2">
              {/* Tile 2: Education */}
              <div
                ref={(el) => (tileRefs.current[2] = el)}
                onClick={() => onOpenExperience?.("education")}
                onMouseEnter={() => setActiveHover("education")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[50%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[2].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[2] = el)}
                  src={INDUSTRIES[2].video}
                  poster={INDUSTRIES[2].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[2].poster}
                  alt="Education"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase">
                  Education
                </span>
              </div>

              {/* Tile 5: Professional Services */}
              <div
                ref={(el) => (tileRefs.current[5] = el)}
                onClick={() => onOpenExperience?.("services")}
                onMouseEnter={() => setActiveHover("services")}
                onMouseLeave={() => setActiveHover(null)}
                className="relative w-full h-[50%] rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: INDUSTRIES[5].fallbackBg }}
              >
                <video
                  ref={(el) => (videoRefs.current[5] = el)}
                  src={INDUSTRIES[5].video}
                  poster={INDUSTRIES[5].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[5].poster}
                  alt="Services"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold text-white tracking-wide uppercase">
                  Services
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BOTTOM NAVIGATION:
          Capsule Pill Navigation Bar (supporting all 7 industries)
          + Subtle Ambient Purple Bottom Glow
          ============================================================ */}
      <div
        ref={bottomNavRef}
        className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center gap-2.5 pt-2 will-change-transform"
      >
        {/* Capsule Pill Bar */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/[0.08] shadow-lg overflow-x-auto max-w-full">
          {INDUSTRIES.map((ind) => {
            const Icon = ind.icon;
            return (
              <button
                key={ind.id}
                onClick={() => onOpenExperience?.(ind.id)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-[#9898A6] hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-[#C28AFF]" />}
                <span>{ind.category}</span>
              </button>
            );
          })}
          <div className="h-3 w-[1px] bg-white/10 mx-1" />
          <button
            onClick={() => onOpenExperience?.("real-estate")}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-[#C28AFF] hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>And More</span>
          </button>
        </div>

        {/* Micro hint */}
        <div className="w-full flex items-center justify-between text-[10px] tracking-wider uppercase font-semibold text-[#9898A6]/60 px-2">
          <span>Autonomous Omnichannel Intelligence</span>
          <span className="text-[#C28AFF]">Click Any Environment to Test Live →</span>
        </div>
      </div>

      {/* Ambient wave glow along bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#963DFF]/20 via-[#963DFF]/5 to-transparent pointer-events-none blur-xl" />
    </section>
  );
}
