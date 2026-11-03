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
    video: "/videos/industries/professional-services.mp4",
    poster: "/images/industries/professional-services.webp",
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

export default function IndustriesSection({ onOpenExperience, onOpenTrial }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headlineRef = useRef(null);
  const line1TextRef = useRef(null);
  const line2TextRef = useRef(null);
  const collageRef = useRef(null);
  const collageInnerRef = useRef(null);
  const paraRef = useRef(null);
  const btnRef = useRef(null);
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
  // Stage 1: BIG (centered, tight cohesive mosaic filling comfortable screen view)
  // Stage 2: MID (medium size in center)
  // Stage 3: SMALL (settles beside Line 1 of the headline)
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
          gsap.set([line1TextRef.current, line2TextRef.current, paraRef.current, btnRef.current], { opacity: 1, y: 0 });
          return;
        }

        const measure = () => {
          if (!collageRef.current || !stageRef.current) {
            return { deltaX: 0, deltaY: 0, bigScale: 2.2, midScale: 1.4 };
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

          // Whole-screen calculation for Stage 1 (Big) - covers entire viewport with generous bleed
          const bigScale = Math.max(vw / rect.width, vh / rect.height) * 1.14;
          // Medium scale for Stage 2 (Mid)
          const midScale = Math.max(bigScale * 0.36, 1.35);

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

        // 1. Collage Container Travel: Big (Centered, 100% full screen) -> Mid -> Small (Locks into Line 1)
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
            x: deltaX * 0.36,
            y: deltaY * 0.22,
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

        // Border radius: strictly sharp 0px (simple square video) at all times
        if (collageInnerRef.current) {
          gsap.set(collageInnerRef.current, { borderRadius: "0px" });
        }

        // 2. Subtle Micro-Parallax for center hero tile (keeps mosaic 100% compact and gap-free)
        if (tileRefs.current[6]) {
          tl.fromTo(
            tileRefs.current[6],
            { scale: 1.05 },
            { scale: 1.0, ease: "power2.out", duration: 0.82 },
            0
          );
        }

        // 3. Eyebrow Badge & Headline Reveal (Emerges smoothly as collage reaches Mid)
        if (eyebrowRef.current) {
          tl.fromTo(
            eyebrowRef.current,
            { opacity: 0 },
            {
              opacity: 1,
              ease: "power2.out",
              duration: 0.30,
            },
            0.26
          );
        }

        if (line1TextRef.current) {
          tl.fromTo(
            line1TextRef.current,
            { opacity: 0, y: 30 },
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
            { opacity: 0, y: 30 },
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
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.30,
            },
            0.48
          );
        }

        // 5. Button at the End Reveal
        if (btnRef.current) {
          tl.fromTo(
            btnRef.current,
            { opacity: 0, y: 15 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.28,
            },
            0.62
          );
        }

        // Buffer hold: (0.75 -> 1.00) Complete stability for reading and interacting
        tl.to({}, { duration: 0.25 }, 0.75);
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
        className="relative w-full h-screen min-h-[640px] bg-[#050507] overflow-hidden flex flex-col justify-between py-4 sm:py-5 lg:py-6 px-4 sm:px-8 select-none"
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
        <div
          ref={eyebrowRef}
          className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between will-change-transform"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF]">
            <span>/ 02. CUSTOMIZED BUSINESS EXPERIENCE — EVERY BUSINESS IS DIFFERENT</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 text-[11px] text-[#9898A6]/70 uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
            <span>Autonomous Business Intelligence</span>
          </div>
        </div>

        {/* ============================================================
            MAIN COMPOSITION MATCHING EXACT NK STUDIO REFERENCE
            - Line 1: Text Whole 1 Line + Video Collage
            - Line 2: 2 Line Text
            - Down Side: Text Paragraph
            - At the End: Button (Fully visible in viewport)
            ============================================================ */}
        <div className="relative z-10 w-full max-w-6xl mx-auto my-auto flex flex-col items-center text-center px-2 sm:px-4">
          {/* OVERSIZED EDITORIAL HEADLINE WITH INLINE VIDEO COLLAGE */}
          <h2
            ref={headlineRef}
            className="font-sans font-extrabold tracking-tight text-white uppercase text-2xl sm:text-4xl md:text-5xl lg:text-[2.85rem] xl:text-[3.25rem] leading-[1.08] flex flex-col items-center w-full"
          >
            {/* Line 1: Text Whole 1 Line THEN Video */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 md:gap-5 w-full">
              <span
                ref={line1TextRef}
                className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] will-change-transform"
              >
                Your Business Is Unique.
              </span>

              {/* The 7-Video Mosaic Collage (Travels: Big -> Mid -> Small) */}
              <div
                ref={collageRef}
                className="inline-flex shrink-0 w-[200px] sm:w-[240px] md:w-[280px] lg:w-[310px] xl:w-[330px] h-[82px] sm:h-[95px] md:h-[110px] lg:h-[120px] xl:h-[128px] will-change-transform origin-center relative z-20"
              >
                <div
                  ref={collageInnerRef}
                  className="w-full h-full flex gap-[1.5px] rounded-none overflow-hidden shadow-2xl"
                >
                  {/* Column 1 (31% width): Real Estate (57%) + Hospitality (43%) */}
                  <div className="w-[31%] h-full flex flex-col gap-[1.5px]">
                    {/* Tile 0: Real Estate */}
                    <div
                      ref={(el) => (tileRefs.current[0] = el)}
                      onClick={() => onOpenExperience?.("real-estate")}
                      onMouseEnter={() => setActiveHover("real-estate")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[57%] rounded-none overflow-hidden cursor-pointer group will-change-transform bg-[#1E1233]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
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
                      className="relative w-full h-[43%] rounded-none overflow-hidden cursor-pointer group will-change-transform bg-[#2B162E]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider">
                        Hospitality
                      </span>
                    </div>
                  </div>

                  {/* Column 2 (38% width, Center Hero Column): Healthcare (29%) + AI Assistant (42%) + Retail (29%) */}
                  <div className="w-[38%] h-full flex flex-col gap-[1.5px]">
                    {/* Tile 1: Healthcare */}
                    <div
                      ref={(el) => (tileRefs.current[1] = el)}
                      onClick={() => onOpenExperience?.("healthcare")}
                      onMouseEnter={() => setActiveHover("healthcare")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[29%] rounded-none overflow-hidden cursor-pointer group will-change-transform bg-[#122233]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-0.5 left-1 px-1 py-0.2 rounded bg-black/60 text-[6.5px] sm:text-[7.5px] font-bold text-white uppercase tracking-wider">
                        Healthcare
                      </span>
                    </div>

                    {/* Tile 6: AI Sales Assistant (Featured Center Hero with purple badge) */}
                    <div
                      ref={(el) => (tileRefs.current[6] = el)}
                      onClick={() => onOpenExperience?.("ai-assistant")}
                      onMouseEnter={() => setActiveHover("ai-assistant")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[42%] rounded-none overflow-hidden cursor-pointer group will-change-transform shadow-md bg-[#2A123E]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
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
                      className="relative w-full h-[29%] rounded-none overflow-hidden cursor-pointer group will-change-transform bg-[#132438]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-0.5 left-1 px-1 py-0.2 rounded bg-black/60 text-[6.5px] sm:text-[7.5px] font-bold text-white uppercase tracking-wider">
                        Retail
                      </span>
                    </div>
                  </div>

                  {/* Column 3 (31% width): Education (43%) + Services (57%) */}
                  <div className="w-[31%] h-full flex flex-col gap-[1.5px]">
                    {/* Tile 2: Education */}
                    <div
                      ref={(el) => (tileRefs.current[2] = el)}
                      onClick={() => onOpenExperience?.("education")}
                      onMouseEnter={() => setActiveHover("education")}
                      onMouseLeave={() => setActiveHover(null)}
                      className="relative w-full h-[43%] rounded-none overflow-hidden cursor-pointer group will-change-transform bg-[#241433]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
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
                      className="relative w-full h-[57%] rounded-none overflow-hidden cursor-pointer group will-change-transform bg-[#221233]"
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
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
              className="mt-1 sm:mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-[#C28AFF] via-[#B379FF] to-[#55A9FF] drop-shadow-[0_0_35px_rgba(194,138,255,0.45)] will-change-transform"
            >
              Your Customer Experience Should Be Too.
            </div>
          </h2>

          {/* THEN TEXT PARA DOWN SIDE */}
          <div
            ref={paraRef}
            className="mt-3.5 sm:mt-5 max-w-xl mx-auto text-center space-y-1 text-xs sm:text-sm text-[#9898A6] leading-relaxed will-change-transform"
          >
            <p className="text-[#E2E2EA] font-medium leading-relaxed">
              Every business has its own services, offerings, customers and way of working.
            </p>
            <p className="leading-relaxed">
              Create a customized assistant around your business information, so visitors can explore what you offer and get relevant answers to their questions.
            </p>
          </div>

          {/* AND THEN BUTTON AT THE END (Fully visible in viewport) */}
          <div
            ref={btnRef}
            className="mt-4 sm:mt-5 flex justify-center will-change-transform"
          >
            <button
              type="button"
              onClick={() => (onOpenTrial ? onOpenTrial() : (window.location.href = "/register"))}
              className="px-7 sm:px-9 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] via-[#7B42F6] to-[#55A9FF] hover:opacity-95 hover:shadow-[0_0_32px_rgba(150,61,255,0.6)] transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}