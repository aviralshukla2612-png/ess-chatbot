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

const CAPABILITIES = [
  "Verified Knowledge Base Retrieval",
  "24/7 Autonomous Customer Q&A",
  "Zero-Hallucination Grounding",
  "Sub-Second Edge Response Latency",
  "Automated High-Intent CRM Lead Routing",
  "Isolated Multi-Tenant Governance",
  "Live Document & URL Synchronization",
  "Multi-Format Ingestion: PDF, DOCX, CSV",
];

export default function IndustriesSection({ onOpenExperience }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const heroTextRef = useRef(null);
  const stickyHeaderRef = useRef(null);
  const canvasRef = useRef(null);
  const tileRefs = useRef([]);
  const outroRef = useRef(null);
  const beltRef = useRef(null);
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

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Coordinated GSAP ScrollTrigger Master Timeline
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023px)",
      },
      (context) => {
        const { isDesktop } = context.conditions;

        if (isDesktop) {
          // ==========================================================
          // DESKTOP: Full ScrollTrigger Pinned Editorial Mosaic Timeline
          // ==========================================================
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=2600",
              pin: stageRef.current,
              pinSpacing: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // PHASE 1 -> PHASE 2: Headline glides away as canvas expands (0.00 -> 0.25)
          tl.to(
            heroTextRef.current,
            {
              y: -50,
              opacity: 0,
              ease: "power2.inOut",
              duration: 0.22,
            },
            0
          );

          tl.fromTo(
            stickyHeaderRef.current,
            { y: -20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: "power2.out",
              duration: 0.18,
            },
            0.15
          );

          tl.to(
            canvasRef.current,
            {
              width: "94vw",
              height: "72vh",
              ease: "power2.inOut",
              duration: 0.26,
            },
            0.05
          );

          // PHASE 2: Main visual divides into 6-tile mosaic (0.18 -> 0.65)
          // Tile 0 (Real Estate): Stays 100% visible, smoothly contracts to 35% on left
          if (tileRefs.current[0]) {
            tl.to(
              tileRefs.current[0],
              {
                width: "35%",
                ease: "power2.inOut",
                duration: 0.32,
              },
              0.18
            );
          }

          // Tile 1 (Healthcare - center top: left: 36.5%, top: 0%, width: 31%, height: 48.5%)
          if (tileRefs.current[1]) {
            tl.fromTo(
              tileRefs.current[1],
              { opacity: 0, scale: 0.9, clipPath: "inset(12% round 14px)" },
              {
                opacity: 1,
                scale: 1,
                clipPath: "inset(0% round 14px)",
                ease: "power2.out",
                duration: 0.22,
              },
              0.24
            );
          }

          // Tile 2 (Hospitality - center bottom: left: 36.5%, top: 51.5%, width: 31%, height: 48.5%)
          if (tileRefs.current[2]) {
            tl.fromTo(
              tileRefs.current[2],
              { opacity: 0, scale: 0.9, clipPath: "inset(12% round 14px)" },
              {
                opacity: 1,
                scale: 1,
                clipPath: "inset(0% round 14px)",
                ease: "power2.out",
                duration: 0.22,
              },
              0.30
            );
          }

          // Tile 3 (Education - right top: left: 69%, top: 0%, width: 31%, height: 31.5%)
          if (tileRefs.current[3]) {
            tl.fromTo(
              tileRefs.current[3],
              { opacity: 0, scale: 0.9, clipPath: "inset(12% round 14px)" },
              {
                opacity: 1,
                scale: 1,
                clipPath: "inset(0% round 14px)",
                ease: "power2.out",
                duration: 0.2,
              },
              0.34
            );
          }

          // Tile 4 (Retail - right middle: left: 69%, top: 34.25%, width: 31%, height: 31.5%)
          if (tileRefs.current[4]) {
            tl.fromTo(
              tileRefs.current[4],
              { opacity: 0, scale: 0.9, clipPath: "inset(12% round 14px)" },
              {
                opacity: 1,
                scale: 1,
                clipPath: "inset(0% round 14px)",
                ease: "power2.out",
                duration: 0.2,
              },
              0.40
            );
          }

          // Tile 5 (Professional Services - right bottom: left: 69%, top: 68.5%, width: 31%, height: 31.5%)
          if (tileRefs.current[5]) {
            tl.fromTo(
              tileRefs.current[5],
              { opacity: 0, scale: 0.9, clipPath: "inset(12% round 14px)" },
              {
                opacity: 1,
                scale: 1,
                clipPath: "inset(0% round 14px)",
                ease: "power2.out",
                duration: 0.2,
              },
              0.46
            );
          }

          // PHASE 4: Closing Transition (0.72 -> 1.00)
          tl.to(
            canvasRef.current,
            {
              scale: 0.96,
              opacity: 0.35,
              ease: "power2.inOut",
              duration: 0.24,
            },
            0.72
          );

          tl.to(
            stickyHeaderRef.current,
            {
              opacity: 0,
              y: -15,
              ease: "power2.inOut",
              duration: 0.15,
            },
            0.72
          );

          tl.fromTo(
            outroRef.current,
            { y: 60, opacity: 0, pointerEvents: "none" },
            {
              y: 0,
              opacity: 1,
              pointerEvents: "auto",
              ease: "power2.out",
              duration: 0.25,
            },
            0.74
          );

          // Drift marquee belt smoothly with scroll
          if (beltRef.current) {
            tl.to(
              beltRef.current,
              {
                x: -700,
                ease: "none",
                duration: 1.0,
              },
              0
            );
          }
        } else {
          // ==========================================================
          // MOBILE: Clean Pinned Sequence with Card Stacking
          // ==========================================================
          const tlMobile = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=1800",
              pin: stageRef.current,
              pinSpacing: true,
              scrub: 0.6,
              anticipatePin: 1,
            },
          });

          tlMobile.to(heroTextRef.current, { opacity: 0, y: -30, duration: 0.2 }, 0);
          tlMobile.fromTo(stickyHeaderRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.15);

          // Mobile card reveal sequence
          tileRefs.current.forEach((tEl, idx) => {
            if (!tEl || idx === 0) return;
            tlMobile.fromTo(
              tEl,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.2 },
              0.2 + idx * 0.1
            );
          });

          tlMobile.fromTo(
            outroRef.current,
            { opacity: 0, y: 40, pointerEvents: "none" },
            { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.25 },
            0.75
          );
        }
      },
      containerRef
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
      ref={containerRef}
      className="relative w-full bg-[#050507] text-[#F5F5F7] overflow-hidden"
    >
      {/* ============================================================
          PINNED STAGE VIEWPORT (Fixed by ScrollTrigger during scrub)
          ============================================================ */}
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden bg-[#050507] flex flex-col justify-between items-center py-5 sm:py-7 px-4 sm:px-8 select-none"
      >
        {/* Subtle Technical Grid Overlay & Ambient Glow */}
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

        {/* Top Marquee Belt: Verified Capabilities */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex items-center gap-6 shrink-0 pointer-events-none">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-[#9898A6] flex items-center gap-2 shrink-0">
            <span className="text-[#C28AFF] font-black">/</span>
            <span>INDUSTRIES WE SERVE</span>
          </div>
          <div
            className="flex-1 overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
            }}
          >
            <div ref={beltRef} className="flex gap-4 sm:gap-6 items-center w-max will-change-transform">
              {[...CAPABILITIES, ...CAPABILITIES, ...CAPABILITIES].map((cap, i) => (
                <span
                  key={i}
                  className="text-[11px] sm:text-xs font-semibold tracking-wider text-[#D9D9E2] uppercase whitespace-nowrap bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.07]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 1 Introduction: Main Headline (0.00 -> 0.22) */}
        <div
          ref={heroTextRef}
          className="relative z-20 w-full max-w-4xl mx-auto text-center flex flex-col items-center mt-2 sm:mt-4 mb-2 shrink-0 will-change-transform"
        >
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-headline tracking-normal text-white uppercase leading-[0.98]">
            <span>Different Industries. </span>
            <span className="text-[#D9D9E2]">Different Questions. </span>
            <br />
            <span className="text-glow-purple text-gradient-purple-blue">
              One Better Way to Connect.
            </span>
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-[#9898A6] max-w-2xl leading-relaxed">
            Every industry has its own customers, expectations and conversations.
            Give them a better way to discover your business and get the information they need.
          </p>
        </div>

        {/* Sticky Title (Crossfades in during mosaic transformation) */}
        <div
          ref={stickyHeaderRef}
          className="absolute top-16 sm:top-20 left-0 right-0 z-20 w-full max-w-5xl mx-auto px-4 text-center pointer-events-none opacity-0 will-change-transform"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF] mb-1">
            <span>/ Industries We Serve</span>
          </div>
          <h3 className="text-base sm:text-xl md:text-2xl font-headline tracking-normal text-white uppercase">
            Different Questions. One Connected Platform.
          </h3>
        </div>

        {/* ============================================================
            CENTRAL CINEMATIC CANVAS (Houses the 6-Tile Mosaic)
            ============================================================ */}
        <div className="relative z-10 w-full flex-1 max-w-[1440px] flex items-center justify-center my-auto min-h-[380px] sm:min-h-[460px]">
          <div
            ref={canvasRef}
            className="relative w-[88vw] h-[58vh] max-h-[720px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.12] bg-[#0B0B10] shadow-[0_24px_70px_rgba(0,0,0,0.85)] will-change-transform"
          >
            {INDUSTRIES.map((ind, idx) => {
              const Icon = ind.icon;
              const isHovered = activeHover === ind.id;

              // Grid positioning for the 6 tiles
              let defaultStyle = {
                left: "0%",
                top: "0%",
                width: "100%",
                height: "100%",
                zIndex: 1,
              };

              if (idx === 1) {
                defaultStyle = { left: "36.5%", top: "0%", width: "31%", height: "48.5%", zIndex: 2 };
              } else if (idx === 2) {
                defaultStyle = { left: "36.5%", top: "51.5%", width: "31%", height: "48.5%", zIndex: 2 };
              } else if (idx === 3) {
                defaultStyle = { left: "69%", top: "0%", width: "31%", height: "31.5%", zIndex: 2 };
              } else if (idx === 4) {
                defaultStyle = { left: "69%", top: "34.25%", width: "31%", height: "31.5%", zIndex: 2 };
              } else if (idx === 5) {
                defaultStyle = { left: "69%", top: "68.5%", width: "31%", height: "31.5%", zIndex: 2 };
              }

              return (
                <div
                  key={ind.id}
                  ref={(el) => {
                    tileRefs.current[idx] = el;
                  }}
                  onMouseEnter={() => setActiveHover(ind.id)}
                  onMouseLeave={() => setActiveHover(null)}
                  onClick={() => onOpenExperience?.(ind.id)}
                  className="absolute overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.08] transition-all duration-300 cursor-pointer group will-change-transform"
                  style={{
                    ...defaultStyle,
                    background: ind.fallbackBg,
                  }}
                >
                  {/* Real MP4 Video with Image Poster Fallback */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={ind.video}
                      poster={ind.poster}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <img
                      src={ind.poster}
                      alt={ind.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover -z-10"
                    />
                  </div>

                  {/* Dark Gradient Overlay for Maximum Text Contrast */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050507]/95 via-[#050507]/45 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-black/5 transition-colors pointer-events-none" />

                  {/* Border Highlight on Hover */}
                  <div
                    className="absolute inset-0 z-20 rounded-xl sm:rounded-2xl border-2 pointer-events-none transition-opacity duration-300"
                    style={{
                      borderColor: ind.accentColor,
                      opacity: isHovered ? 0.75 : 0,
                      boxShadow: isHovered ? `inset 0 0 30px ${ind.accentColor}33` : "none",
                    }}
                  />

                  {/* Overlay Content */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-5">
                    {/* Top Row: Category Badge & Icon */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050507]/80 backdrop-blur-md border border-white/[0.12] text-[10px] sm:text-xs font-bold text-white shadow-md">
                        <Icon className="w-3.5 h-3.5" style={{ color: ind.accentColor }} />
                        <span>{ind.category}</span>
                      </div>

                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Bottom Row: Name, Capability, & Sample Question */}
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight drop-shadow-md">
                        {ind.name}
                      </h4>

                      <p className="text-[11px] sm:text-xs text-[#9898A6] font-medium line-clamp-1 group-hover:text-[#D9D9E2] transition-colors">
                        {ind.capability}
                      </p>

                      <div className="mt-1 pt-1.5 border-t border-white/[0.08] flex items-start gap-1.5">
                        <span className="text-[10px] font-bold text-[#C28AFF] uppercase tracking-wider shrink-0 mt-0.5">
                          Q:
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#D9D9E2] italic leading-tight line-clamp-2">
                          "{ind.sampleQuestion}"
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 4 Closing Transition Outro (0.74 -> 1.00) */}
        <div
          ref={outroRef}
          className="absolute bottom-6 sm:bottom-10 left-4 right-4 z-30 max-w-2xl mx-auto bg-[#12121A]/90 backdrop-blur-xl border border-white/[0.14] rounded-2xl p-5 sm:p-7 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] opacity-0 will-change-transform"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#963DFF]/20 border border-[#963DFF]/40 text-[#C28AFF] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tailored Customer Intelligence</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-headline tracking-normal text-white uppercase leading-snug">
            Your Industry Is Different. <br />
            <span className="text-glow-purple text-gradient-purple-blue">
              Your Customers' Questions Matter Just as Much.
            </span>
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-[#9898A6] leading-relaxed max-w-xl mx-auto">
            Wherever your business operates, Emperor Nexus bridges the gap between complex customer questions and meaningful business connections.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="#benefits"
              className="px-6 py-2.5 rounded-full font-medium text-xs sm:text-sm text-white btn-primary-gradient inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Explore the Benefits</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
