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
  ArrowRight,
  ArrowDown,
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
    id: "professional-services",
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
    capability: "High-Intent Lead Qualification",
  },
];

export default function IndustriesSection({ onOpenExperience }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const headlineRef = useRef(null);
  const collageRef = useRef(null);
  const coverVideoRef = useRef(null);
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

  // Coordinated GSAP ScrollTrigger: First video covers screen then scales down to place beside headline
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023px)",
      },
      (context) => {
        const { isDesktop } = context.conditions;

        const measure = () => {
          if (!collageRef.current || !stageRef.current) {
            return { deltaX: 0, deltaY: 0, scale: 2.4 };
          }
          const rect = collageRef.current.getBoundingClientRect();
          const stageRect = stageRef.current.getBoundingClientRect();

          const centerX = stageRect.left + stageRect.width / 2;
          const centerY = stageRect.top + stageRect.height / 2;

          const collageCenterX = rect.left + rect.width / 2;
          const collageCenterY = rect.top + rect.height / 2;

          const deltaX = centerX - collageCenterX;
          const deltaY = centerY - collageCenterY;

          const scaleX = (stageRect.width * 0.94) / rect.width;
          const scaleY = (stageRect.height * 0.88) / rect.height;
          const scale = Math.max(scaleX, scaleY, 2.2);

          return { deltaX, deltaY, scale };
        };

        const { deltaX, deltaY, scale } = measure();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: isDesktop ? "+=1800" : "+=1200",
            pin: stageRef.current,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1. Initial State: First video covers whole screen, then shrinks into position beside headline (0.00 -> 0.48)
        tl.fromTo(
          collageRef.current,
          {
            x: deltaX,
            y: deltaY,
            scale: scale,
            transformOrigin: "center center",
          },
          {
            x: 0,
            y: 0,
            scale: 1,
            ease: "power2.inOut",
            duration: 0.48,
          },
          0
        );

        // 2. Cover layer fades smoothly as collage scales down, revealing the 6-video collage beneath
        if (coverVideoRef.current) {
          tl.fromTo(
            coverVideoRef.current,
            { opacity: 1 },
            {
              opacity: 0,
              ease: "power2.inOut",
              duration: 0.24,
            },
            0.22
          );
        }

        // 3. Left Headline reveals smoothly with reduced balanced typography (0.12 -> 0.45)
        if (headlineRef.current) {
          tl.fromTo(
            headlineRef.current,
            { opacity: 0, x: -35 },
            {
              opacity: 1,
              x: 0,
              ease: "power2.out",
              duration: 0.36,
            },
            0.12
          );
        }

        // 4. Staggered reveal of other collage tiles (0.26 -> 0.50)
        tileRefs.current.forEach((tEl, idx) => {
          if (!tEl || idx === 0) return;
          tl.fromTo(
            tEl,
            { opacity: 0, scale: 0.92 },
            {
              opacity: 1,
              scale: 1,
              ease: "power2.out",
              duration: 0.2,
            },
            0.26 + idx * 0.04
          );
        });
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
      {/* ============================================================
          PINNED STAGE (Fixed by ScrollTrigger during scrub)
          ============================================================ */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[600px] overflow-hidden bg-[#050507] flex flex-col justify-between items-center py-5 sm:py-6 px-4 sm:px-8 select-none"
      >
        {/* Subtle Technical Grid Background & Ambient Purple Glow */}
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

        {/* ============================================================
            MAIN HERO COMPOSITION:
            Balanced Headline on the Left + 6-Video Collage on the Right
            Reduced text size to ensure zero overflow and clean visibility
            ============================================================ */}
        <div className="relative z-10 w-full max-w-7xl mx-auto my-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 px-2 sm:px-4">
          {/* Left: Reduced, Balanced Editorial Typography */}
          <div ref={headlineRef} className="flex-1 w-full lg:max-w-[54%] flex flex-col will-change-transform">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF] mb-2.5 sm:mb-3 w-fit">
              <span>/ INDUSTRIES WE SERVE</span>
            </div>

            {/* Reduced Headline Size: 3 Clean Lines That Fit Comfortably On Screen */}
            <h2 className="font-headline tracking-normal text-white uppercase leading-[0.96] text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem]">
              <span className="block text-white">Different Industries.</span>
              <span className="block text-[#D9D9E2] mt-1 sm:mt-1.5">Different Questions.</span>
              <span className="block text-glow-purple text-gradient-purple-blue mt-1 sm:mt-1.5">
                One Better Way to Connect.
              </span>
            </h2>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-[#9898A6] max-w-lg leading-relaxed">
              From finding the right property to choosing a healthcare provider, exploring educational opportunities or discovering a new service — every industry has its own conversations.
            </p>

            <div className="mt-4 sm:mt-5 flex items-center gap-4">
              <a
                href="#benefits"
                className="px-6 py-2.5 rounded-full font-medium text-xs sm:text-sm text-white btn-primary-gradient inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Explore the Benefits</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: The 6-Video Collage (Starts fullscreen then scales down to this spot) */}
          <div
            ref={collageRef}
            className="w-full lg:w-[460px] xl:w-[500px] shrink-0 will-change-transform origin-center"
          >
            <div className="relative p-2 sm:p-2.5 rounded-2xl bg-[#12121A]/80 backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
              {/* Subtle top light edge */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#C28AFF]/50 to-transparent pointer-events-none" />

              {/* Full-Cover Initial First Video Layer (Enlarged to screen initially, then dissolves) */}
              <div
                ref={coverVideoRef}
                className="absolute inset-2 sm:inset-2.5 rounded-xl overflow-hidden z-30 pointer-events-none will-change-transform"
                style={{ background: INDUSTRIES[0].fallbackBg }}
              >
                <video
                  src={INDUSTRIES[0].video}
                  poster={INDUSTRIES[0].poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <img
                  src={INDUSTRIES[0].poster}
                  alt="Real Estate"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/20 text-[10px] font-bold text-white tracking-wider uppercase">
                  Real Estate & Commercial Developments
                </span>
              </div>

              {/* 3 Asymmetric Columns forming the 6-video collage beneath */}
              <div className="w-full h-[250px] sm:h-[280px] xl:h-[300px] flex gap-2">
                {/* Column 1 (37% width): Real Estate (tall top) + Hospitality (compact bottom) */}
                <div className="w-[37%] h-full flex flex-col gap-2">
                  {/* Tile 0: Real Estate (tall, 57% height) */}
                  <div
                    ref={(el) => (tileRefs.current[0] = el)}
                    onClick={() => onOpenExperience?.("real-estate")}
                    onMouseEnter={() => setActiveHover("real-estate")}
                    onMouseLeave={() => setActiveHover(null)}
                    className="relative w-full h-[57%] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group will-change-transform shadow-sm"
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
                    <div className="absolute inset-0 border-2 rounded-xl border-[#C28AFF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[9px] font-bold text-white tracking-wide uppercase">
                      Real Estate
                    </span>
                  </div>

                  {/* Tile 3: Hospitality (compact, 43% height) */}
                  <div
                    ref={(el) => (tileRefs.current[3] = el)}
                    onClick={() => onOpenExperience?.("hospitality")}
                    onMouseEnter={() => setActiveHover("hospitality")}
                    onMouseLeave={() => setActiveHover(null)}
                    className="relative w-full h-[43%] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group will-change-transform shadow-sm"
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
                    <div className="absolute inset-0 border-2 rounded-xl border-[#55A9FF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[9px] font-bold text-white tracking-wide uppercase">
                      Hospitality
                    </span>
                  </div>
                </div>

                {/* Column 2 (38% width): Healthcare (compact top) + Retail & E-commerce (tall bottom) */}
                <div className="w-[38%] h-full flex flex-col gap-2">
                  {/* Tile 1: Healthcare (compact, 43% height) */}
                  <div
                    ref={(el) => (tileRefs.current[1] = el)}
                    onClick={() => onOpenExperience?.("healthcare")}
                    onMouseEnter={() => setActiveHover("healthcare")}
                    onMouseLeave={() => setActiveHover(null)}
                    className="relative w-full h-[43%] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group will-change-transform shadow-sm"
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
                    <div className="absolute inset-0 border-2 rounded-xl border-[#55A9FF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[9px] font-bold text-white tracking-wide uppercase">
                      Healthcare
                    </span>
                  </div>

                  {/* Tile 4: Retail & E-commerce (tall, 57% height) */}
                  <div
                    ref={(el) => (tileRefs.current[4] = el)}
                    onClick={() => onOpenExperience?.("retail")}
                    onMouseEnter={() => setActiveHover("retail")}
                    onMouseLeave={() => setActiveHover(null)}
                    className="relative w-full h-[57%] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group will-change-transform shadow-sm"
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
                    <div className="absolute inset-0 border-2 rounded-xl border-[#C28AFF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[9px] font-bold text-white tracking-wide uppercase">
                      Retail
                    </span>
                  </div>
                </div>

                {/* Column 3 (25% width): Education (top) + Professional Services (bottom) */}
                <div className="w-[25%] h-full flex flex-col gap-2">
                  {/* Tile 2: Education (50% height) */}
                  <div
                    ref={(el) => (tileRefs.current[2] = el)}
                    onClick={() => onOpenExperience?.("education")}
                    onMouseEnter={() => setActiveHover("education")}
                    onMouseLeave={() => setActiveHover(null)}
                    className="relative w-full h-[50%] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group will-change-transform shadow-sm"
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
                    <div className="absolute inset-0 border-2 rounded-xl border-[#C28AFF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="absolute bottom-2 left-1.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[8px] font-bold text-white tracking-wide uppercase">
                      Education
                    </span>
                  </div>

                  {/* Tile 5: Professional Services (50% height) */}
                  <div
                    ref={(el) => (tileRefs.current[5] = el)}
                    onClick={() => onOpenExperience?.("professional-services")}
                    onMouseEnter={() => setActiveHover("professional-services")}
                    onMouseLeave={() => setActiveHover(null)}
                    className="relative w-full h-[50%] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group will-change-transform shadow-sm"
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
                    <div className="absolute inset-0 border-2 rounded-xl border-[#55A9FF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="absolute bottom-2 left-1.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-[8px] font-bold text-white tracking-wide uppercase">
                      Services
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom indicator hint */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex items-center justify-between text-xs text-[#9898A6] pb-1">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#9898A6]/70">
            Autonomous Omnichannel Intelligence
          </span>
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#C28AFF]">
            Click Any Environment to Test Live →
          </span>
        </div>
      </div>
    </section>
  );
}
