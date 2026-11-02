"use client";

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
    capability: "Student Inquiry & Enrollment Guidance",
  },
  {
    id: "hospitality",
    category: "Hospitality & Dining",
    name: "Luxury Resorts, Hotels & Dining Venues",
    subtitle: "Direct suite reservations, dining menus, private events and itinerary concierge.",
    icon: BedDouble,
    video: "/videos/industries/hospitality.mp4",
    poster: "/images/industries/hospitality.webp",
    fallbackBg: "linear-gradient(135deg, #2B162E 0%, #0A0A14 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "Can I book the presidential penthouse suite with private airport chauffeur service?",
    badge: "Concierge & Dining",
    capability: "Direct Booking Engine Integration",
  },
  {
    id: "retail",
    category: "Retail & E-commerce",
    name: "Direct-to-Consumer & Omnichannel Brands",
    subtitle: "Instant product recommendations, order tracking, returns and inventory lookup.",
    icon: ShoppingBag,
    video: "/videos/industries/retail.mp4",
    poster: "/images/industries/retail.webp",
    fallbackBg: "linear-gradient(135deg, #132438 0%, #090914 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Where is my expedited shipment, and how do I exchange for a different size?",
    badge: "Instant Cart & Support",
    capability: "E-Commerce Catalog & Checkout Sync",
  },
  {
    id: "services",
    category: "Professional Services",
    name: "Consulting, Legal & Financial Advisory",
    subtitle: "Autonomous consultation scoping, fee estimates, partner routing and intake.",
    icon: Briefcase,
    video: "/videos/industries/services.mp4",
    poster: "/images/industries/services.webp",
    fallbackBg: "linear-gradient(135deg, #221233 0%, #0B0814 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What is your hourly partner billing structure for international corporate tax restructuring?",
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

// Spatial travel vectors for each of the 7 video tiles:
// Transitions from Big (spread outward) -> Mid (traveling inward) -> Small (locked in mosaic)
const TILE_TRAVEL = [
  // Tile 0: Real Estate (top-left)
  { startX: -40, startY: -30, midX: -16, midY: -10, startScale: 1.08, midScale: 1.03 },
  // Tile 1: Healthcare (top-center)
  { startX: 0, startY: -35, midX: 0, midY: -12, startScale: 1.06, midScale: 1.02 },
  // Tile 2: Education (top-right)
  { startX: 40, startY: -30, midX: 16, midY: -10, startScale: 1.08, midScale: 1.03 },
  // Tile 3: Hospitality (bottom-left)
  { startX: -35, startY: 30, midX: -14, midY: 10, startScale: 1.06, midScale: 1.02 },
  // Tile 4: Retail (bottom-center)
  { startX: 0, startY: 35, midX: 0, midY: 12, startScale: 1.06, midScale: 1.02 },
  // Tile 5: Professional Services (bottom-right)
  { startX: 35, startY: 30, midX: 14, midY: 10, startScale: 1.06, midScale: 1.02 },
  // Tile 6: AI Sales Assistant (center hero)
  { startX: 0, startY: 0, midX: 0, midY: 0, startScale: 1.15, midScale: 1.06 },
];

export default function IndustriesSection({ onOpenExperience, onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const headlineRef = useRef(null);
  const line1TextRef = useRef(null);
  const line2TextRef = useRef(null);
  const collageRef = useRef(null);
  const paraRef = useRef(null);
  const btnRef = useRef(null);
  const bottomNavRef = useRef(null);
  const tileRefs = useRef([]);
  const videoRefs = useRef([]);

  const [activeHover, setActiveHover] = useState(null);

  // Strictly mute all 7 videos on mount and ensure volume is 0
  useEffect(() => {
    videoRefs.current.forEach((vid) => {
      if (!vid) return;
      vid.muted = true;
      vid.defaultMuted = true;
      vid.volume = 0;
    });
  }, []);

  // Video IntersectionObserver to preserve resources and keep muted
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          videoRefs.current.forEach((vid) => {
            if (!vid) return;
            vid.muted = true;
            vid.defaultMuted = true;
            vid.volume = 0;
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

  // NK Studio-inspired scroll choreography:
  // Stage 1: BIG (centered, fills whole screen view)
  // Stage 2: MID (medium size with inward travel of all 7 tiles)
  // Stage 3: SMALL (settles into exact resting position beside Line 1 of the headline)
  // Layout: Line 1 text -> Video -> Line 2 text -> Paragraph down side -> Button at the end
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions;

        if (reduceMotion) {
          // Static layout for reduced motion preference
          gsap.set(collageRef.current, { x: 0, y: 0, scale: 1 });
          gsap.set([line1TextRef.current, line2TextRef.current, paraRef.current, btnRef.current, bottomNavRef.current], { opacity: 1, y: 0 });
          return;
        }

        const measure = () => {
          if (!collageRef.current || !stageRef.current) {
            return { deltaX: 0, deltaY: 0, bigScale: 2.3, midScale: 1.45 };
          }

          // Clear existing transforms before measuring natural resting spot
          gsap.set(collageRef.current, { clearProps: "transform" });

          const rect = collageRef.current.getBoundingClientRect();
          const stageRect = stageRef.current.getBoundingClientRect();

          const centerX = stageRect.left + stageRect.width / 2;
          const centerY = stageRect.top + stageRect.height / 2;

          const collageCenterX = rect.left + rect.width / 2;
          const collageCenterY = rect.top + rect.height / 2;

          const deltaX = centerX - collageCenterX;
          const deltaY = centerY - collageCenterY;

          const vw = typeof window !== "undefined" ? window.innerWidth : stageRect.width;
          const vh = typeof window !== "undefined" ? window.innerHeight : stageRect.height;

          // Whole-screen calculation for Stage 1 (Big)
          const bigScale = Math.min((vw * 0.88) / rect.width, (vh * 0.80) / rect.height);
          // Medium scale for Stage 2 (Mid)
          const midScale = Math.max(bigScale * 0.48, 1.35);

          return { deltaX, deltaY, bigScale, midScale };
        };

        const { deltaX, deltaY, bigScale, midScale } = measure();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: isDesktop ? "+=2600" : "+=1800",
            pin: stageRef.current,
            pinSpacing: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1. Collage Container Travel: Big (Whole Screen) -> Mid -> Small (Locks into Line 1)
        // Stage 1 -> Stage 2: Big (0.00) -> Mid (0.42)
        tl.fromTo(
          collageRef.current,
          {
            x: deltaX,
            y: deltaY,
            scale: bigScale,
            transformOrigin: "center center",
          },
          {
            x: deltaX * 0.40,
            y: deltaY * 0.28,
            scale: midScale,
            ease: "power1.inOut",
            duration: 0.42,
          },
          0
        );

        // Stage 2 -> Stage 3: Mid (0.42) -> Small (0.82)
        tl.to(
          collageRef.current,
          {
            x: 0,
            y: 0,
            scale: 1,
            ease: "power2.out",
            duration: 0.40,
          },
          0.42
        );

        // 2. Individual Travel for each of the 7 video tiles:
        tileRefs.current.forEach((tEl, idx) => {
          if (!tEl || !TILE_TRAVEL[idx]) return;
          const travel = TILE_TRAVEL[idx];

          // Big -> Mid travel
          tl.fromTo(
            tEl,
            {
              x: travel.startX,
              y: travel.startY,
              scale: travel.startScale,
            },
            {
              x: travel.midX,
              y: travel.midY,
              scale: travel.midScale,
              ease: "power1.inOut",
              duration: 0.42,
            },
            0
          );

          // Mid -> Small travel (locks cleanly into mosaic)
          tl.to(
            tEl,
            {
              x: 0,
              y: 0,
              scale: 1,
              ease: "power2.out",
              duration: 0.40,
            },
            0.42
          );
        });

        // 3. Line 1 & Line 2 Headline Reveal (Emerges smoothly as collage reaches Mid)
        if (line1TextRef.current) {
          tl.fromTo(
            line1TextRef.current,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.35,
            },
            0.28
          );
        }

        if (line2TextRef.current) {
          tl.fromTo(
            line2TextRef.current,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.35,
            },
            0.32
          );
        }

        // 4. Supporting Text Paragraph Down Side Reveal
        if (paraRef.current) {
          tl.fromTo(
            paraRef.current,
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.32,
            },
            0.48
          );
        }

        // 5. Button at the End Reveal
        if (btnRef.current) {
          tl.fromTo(
            btnRef.current,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.28,
            },
            0.62
          );
        }

        // 6. Bottom Navigation Bar Reveal
        if (bottomNavRef.current) {
          tl.fromTo(
            bottomNavRef.current,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.25,
            },
            0.68
          );
        }

        // Buffer hold: (0.82 -> 1.00) Complete stability for reading and interacting
        tl.to({}, { duration: 0.18 }, 0.82);
      },
      sectionRef
    );

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      mm.revert();
    };
  }, []);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="relative w-full bg-[#050507] text-[#F5F5F7] overflow-hidden"
    >
      {/* PINNED STAGE (Controlled by GSAP ScrollTrigger scrub) */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] max-h-[1080px] bg-[#050507] overflow-hidden flex flex-col justify-between py-5 sm:py-6 lg:py-8 px-4 sm:px-8 lg:px-12 select-none"
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
            <span>/ 02. CUSTOMIZED BUSINESS EXPERIENCE — EVERY BUSINESS IS DIFFERENT</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>Autonomous Business Intelligence</span>
          </div>
        </div>

        {/* ============================================================
            MAIN COMPOSITION MATCHING EXACT NK STUDIO REFERENCE (IMAGE 3)
            - Line 1: Text Whole 1 Line + Video Collage
            - Line 2: 2 Line Text
            - Down Side: Text Paragraph
            - At the End: Button
            ============================================================ */}
        <div className="relative z-10 w-full max-w-6xl mx-auto my-auto flex flex-col items-center text-center px-2 sm:px-4">
          {/* OVERSIZED EDITORIAL HEADLINE WITH INLINE VIDEO COLLAGE */}
          <h2
            ref={headlineRef}
            className="font-sans font-extrabold tracking-tight text-white uppercase text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.85rem] leading-[1.04] flex flex-col items-center w-full"
          >
            {/* Line 1: Text Whole 1 Line THEN Video */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 w-full">
              <span
                ref={line1TextRef}
                className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] will-change-transform"
              >
                Your Business Is Unique.
              </span>

              {/* The 7-Video Mosaic Collage (Travels: Big -> Mid -> Small) */}
              <div
                ref={collageRef}
                className="inline-flex shrink-0 w-[220px] sm:w-[260px] md:w-[310px] lg:w-[350px] xl:w-[380px] h-[95px] sm:h-[110px] md:h-[130px] lg:h-[145px] xl:h-[155px] will-change-transform origin-center"
              >
                <div className="w-full h-full flex gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl overflow-hidden p-1 bg-white/[0.04] border border-white/[0.1] shadow-2xl backdrop-blur-md">
                  {/* Column 1 (31% width): Real Estate (57%) + Hospitality (43%) */}
                  <div className="w-[31%] h-full flex flex-col gap-1 sm:gap-1.5">
                    {/* Tile 0: Real Estate */}
                    <div
                      ref={(el) => (tileRefs.current[0] = el)}
                      onClick={() => onOpenExperience?.("real-estate")}
                      onMouseEnter={() => setActiveHover("real-estate")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[57%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[0].poster}
                        alt="Real Estate"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider">
                        Real Estate
                      </span>
                    </div>

                    {/* Tile 3: Hospitality */}
                    <div
                      ref={(el) => (tileRefs.current[3] = el)}
                      onClick={() => onOpenExperience?.("hospitality")}
                      onMouseEnter={() => setActiveHover("hospitality")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[43%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[3].poster}
                        alt="Hospitality"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider">
                        Hospitality
                      </span>
                    </div>
                  </div>

                  {/* Column 2 (38% width, Center Hero Column): Healthcare (29%) + AI Assistant (42%) + Retail (29%) */}
                  <div className="w-[38%] h-full flex flex-col gap-1 sm:gap-1.5">
                    {/* Tile 1: Healthcare */}
                    <div
                      ref={(el) => (tileRefs.current[1] = el)}
                      onClick={() => onOpenExperience?.("healthcare")}
                      onMouseEnter={() => setActiveHover("healthcare")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[29%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[1].poster}
                        alt="Healthcare"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-0.5 left-1 px-1 py-0.2 rounded bg-black/60 text-[6.5px] sm:text-[7.5px] font-bold text-white uppercase tracking-wider">
                        Healthcare
                      </span>
                    </div>

                    {/* Tile 6: AI Sales Assistant (Featured Center Hero with purple badge matching Image 2) */}
                    <div
                      ref={(el) => (tileRefs.current[6] = el)}
                      onClick={() => onOpenExperience?.("ai-assistant")}
                      onMouseEnter={() => setActiveHover("ai-assistant")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[42%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform shadow-md"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[6].poster}
                        alt="AI Sales"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#963DFF] text-[7px] sm:text-[8px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-2 h-2 text-[#55A9FF]" />
                        <span>AI Sales</span>
                      </span>
                    </div>

                    {/* Tile 4: Retail & E-commerce */}
                    <div
                      ref={(el) => (tileRefs.current[4] = el)}
                      onClick={() => onOpenExperience?.("retail")}
                      onMouseEnter={() => setActiveHover("retail")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[29%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[4].poster}
                        alt="Retail"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-0.5 left-1 px-1 py-0.2 rounded bg-black/60 text-[6.5px] sm:text-[7.5px] font-bold text-white uppercase tracking-wider">
                        Retail
                      </span>
                    </div>
                  </div>

                  {/* Column 3 (31% width): Education (43%) + Services (57%) */}
                  <div className="w-[31%] h-full flex flex-col gap-1 sm:gap-1.5">
                    {/* Tile 2: Education */}
                    <div
                      ref={(el) => (tileRefs.current[2] = el)}
                      onClick={() => onOpenExperience?.("education")}
                      onMouseEnter={() => setActiveHover("education")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[43%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[2].poster}
                        alt="Education"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider">
                        Education
                      </span>
                    </div>

                    {/* Tile 5: Professional Services */}
                    <div
                      ref={(el) => (tileRefs.current[5] = el)}
                      onClick={() => onOpenExperience?.("services")}
                      onMouseEnter={() => setActiveHover("services")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[57%] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group will-change-transform"
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <img
                        src={INDUSTRIES[5].poster}
                        alt="Services"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider">
                        Services
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line 2: 2 Line Text */}
            <div
              ref={line2TextRef}
              className="mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#B379FF] to-[#55A9FF] drop-shadow-[0_0_35px_rgba(194,138,255,0.45)] will-change-transform"
            >
              Your Customer Experience Should Be Too.
            </div>
          </h2>

          {/* THEN TEXT PARA DOWN SIDE */}
          <div
            ref={paraRef}
            className="mt-6 sm:mt-8 max-w-2xl mx-auto text-center space-y-1.5 text-xs sm:text-sm md:text-[15px] text-[#9898A6] leading-relaxed will-change-transform"
          >
            <p className="text-[#E2E2EA] font-medium leading-relaxed">
              Every business has its own services, offerings, customers and way of working.
            </p>
            <p className="leading-relaxed">
              Create a customized assistant around your business information, so visitors can explore what you offer and get relevant answers to their questions.
            </p>
          </div>

          {/* AND THEN BUTTON AT THE END */}
          <div
            ref={btnRef}
            className="mt-6 sm:mt-8 flex justify-center will-change-transform"
          >
            <button
              type="button"
              onClick={() => (onOpenTrial ? onOpenTrial() : (window.location.href = "/register"))}
              className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] hover:opacity-95 hover:shadow-[0_0_32px_rgba(150,61,255,0.6)] transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Wave / Quick Industry Selector Bar */}
        <div
          ref={bottomNavRef}
          className="relative z-10 w-full max-w-5xl mx-auto hidden md:flex items-center justify-between text-[11px] text-[#9898A6]/80 uppercase tracking-wider font-semibold border-t border-white/[0.06] pt-3 px-4 will-change-transform"
        >
          <div className="flex items-center gap-6">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => onOpenExperience?.(ind.id)}
                className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{ind.category}</span>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-[#C28AFF] font-bold">
            24/7 Grounded Retrieval • Sub-Second Edge
          </div>
        </div>
      </div>
    </section>
  );
}