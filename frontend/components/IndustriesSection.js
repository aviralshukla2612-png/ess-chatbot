"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
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
  CheckCircle2,
  Play,
} from "lucide-react";

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

// Authentic Emperor Nexus Platform Capabilities Belt
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

// Target Mosaic Configuration: Balanced 6-Tile Editorial Layout (NK Studio Inspired)
// [left%, top%, width%, height%, staggerDelay]
const MOSAIC_CONFIG = [
  // Tile 0: Real Estate (Tall anchor on left column)
  { left: 0, top: 0, width: 35, height: 100, delay: 0.0 },
  // Tile 1: Healthcare (Top center)
  { left: 36.5, top: 0, width: 31, height: 48.5, delay: 0.06 },
  // Tile 2: Hospitality (Bottom center)
  { left: 36.5, top: 51.5, width: 31, height: 48.5, delay: 0.12 },
  // Tile 3: Education (Top right)
  { left: 69, top: 0, width: 31, height: 31.5, delay: 0.08 },
  // Tile 4: Retail & E-commerce (Middle right)
  { left: 69, top: 34.25, width: 31, height: 31.5, delay: 0.16 },
  // Tile 5: Professional Services (Bottom right)
  { left: 69, top: 68.5, width: 31, height: 31.5, delay: 0.22 },
];

export default function IndustriesSection({ onOpenExperience }) {
  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const heroTextRef = useRef(null);
  const stageHeaderRef = useRef(null);
  const mosaicCanvasRef = useRef(null);
  const tileRefs = useRef([]);
  const outroRef = useRef(null);
  const beltRef = useRef(null);

  const [activeHover, setActiveHover] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Helper math
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Smooth RAF Scroll Driver
  useEffect(() => {
    let animId;
    let curProgress = 0;
    let targetProgress = 0;
    const t0 = performance.now();

    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const totalScrollable = stage.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;
      targetProgress = clamp(-rect.top / totalScrollable);
    };

    const loop = (now) => {
      if (isReduced) {
        curProgress = targetProgress;
      } else {
        curProgress += (targetProgress - curProgress) * 0.09;
        if (Math.abs(targetProgress - curProgress) < 0.0002) {
          curProgress = targetProgress;
        }
      }

      setScrollProgress(curProgress);
      const p = curProgress;

      // 1. Hero Opening Text: Visible at start (p=0 to 0.25), smoothly glides up & fades
      if (heroTextRef.current) {
        const hProgress = ease(clamp(p / 0.22));
        heroTextRef.current.style.opacity = String(1 - hProgress);
        heroTextRef.current.style.transform = `translate3d(0, ${-hProgress * 60}px, 0)`;
        heroTextRef.current.style.pointerEvents = p < 0.12 ? "auto" : "none";
      }

      // 2. Sticky Stage Header: Appears when hero text fades out (p=0.22 to 0.85)
      if (stageHeaderRef.current) {
        const inProg = ease(clamp((p - 0.2) / 0.12));
        const outProg = ease(clamp((p - 0.78) / 0.12));
        const headOpacity = inProg * (1 - outProg);
        stageHeaderRef.current.style.opacity = String(headOpacity);
        stageHeaderRef.current.style.transform = `translate3d(0, ${(1 - inProg) * -20 + outProg * -20}px, 0)`;
      }

      // 3. Mosaic Canvas Transformation:
      // Starts as single hero visual (Tile 0 = 100%), smoothly morphs into 6-tile mosaic
      const morphProgress = ease(clamp((p - 0.18) / 0.52));

      // Update individual tiles
      tileRefs.current.forEach((tileEl, idx) => {
        if (!tileEl) return;
        const cfg = MOSAIC_CONFIG[idx];
        if (!cfg) return;

        if (idx === 0) {
          // Tile 0 (Real Estate): Starts at 100% width, narrows smoothly to 35%
          // ALWAYS 100% VISIBLE - NEVER BLANK!
          const w = lerp(100, cfg.width, morphProgress);
          tileEl.style.left = "0%";
          tileEl.style.top = "0%";
          tileEl.style.width = `${w}%`;
          tileEl.style.height = "100%";
          tileEl.style.opacity = "1";
        } else {
          // Tiles 1 to 5: Expand into place with staggered organic reveal
          const delayed = clamp((morphProgress - cfg.delay) / (1 - cfg.delay));
          const t = ease(delayed);

          tileEl.style.left = `${cfg.left}%`;
          tileEl.style.top = `${cfg.top}%`;
          tileEl.style.width = `${cfg.width}%`;
          tileEl.style.height = `${cfg.height}%`;
          tileEl.style.opacity = String(t);
          tileEl.style.transform = `scale(${lerp(0.92, 1, t)})`;
          tileEl.style.pointerEvents = t > 0.6 ? "auto" : "none";
        }
      });

      // 4. Outro Transition (p=0.76 to 1.0)
      if (outroRef.current) {
        const outroIn = ease(clamp((p - 0.76) / 0.18));
        outroRef.current.style.opacity = String(outroIn);
        outroRef.current.style.transform = `translate3d(0, ${(1 - outroIn) * 40}px, 0)`;
        outroRef.current.style.pointerEvents = outroIn > 0.5 ? "auto" : "none";
      }

      // 5. Drift Marquee Belt
      if (beltRef.current) {
        const elapsed = (now - t0) / 1000;
        const offset = ((elapsed * 35 + p * 600) % 1200);
        beltRef.current.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section id="industries" className="relative bg-[#050507] text-[#F5F5F7] overflow-hidden">
      {/* ============================================================
          PINNED SCROLL STAGE (380vh for silky, deliberate pacing)
          ============================================================ */}
      <div ref={stageRef} className="relative w-full h-[380vh]">
        <div
          ref={pinRef}
          className="sticky top-0 h-screen w-full overflow-hidden bg-[#050507] flex flex-col justify-between items-center py-5 sm:py-7 px-4 sm:px-8 select-none"
        >
          {/* Subtle Technical Grid & Ambient Lighting */}
          <div
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
            }}
          />
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#963DFF]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#55A9FF]/15 rounded-full blur-[140px] pointer-events-none" />

          {/* Top Marquee Belt: Authentic Capabilities */}
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
              <div ref={beltRef} className="flex gap-4 sm:gap-6 items-center w-max">
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

          {/* Opening Hero Headline (Visible at scroll 0 to 0.25) */}
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

          {/* Compact Sticky Stage Header (Crossfades in during mosaic phase) */}
          <div
            ref={stageHeaderRef}
            className="absolute top-16 sm:top-20 left-0 right-0 z-20 w-full max-w-5xl mx-auto px-4 text-center pointer-events-none opacity-0 will-change-transform"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-[#C28AFF] mb-1.5">
              <span>Interactive Industry Mosaic</span>
            </div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-headline tracking-normal text-white uppercase">
              Explore How Emperor Nexus Serves Your Vertical
            </h3>
          </div>

          {/* ============================================================
              CENTRAL CINEMATIC CANVAS (Houses the 6-Tile Mosaic)
              Always large, visible, prominent & playing real media!
              ============================================================ */}
          <div className="relative z-10 w-full flex-1 max-w-[1440px] flex items-center justify-center my-auto min-h-[380px] sm:min-h-[460px]">
            <div
              ref={mosaicCanvasRef}
              className="relative w-full h-[64vh] sm:h-[68vh] max-h-[720px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.12] bg-[#0B0B10] shadow-[0_20px_70px_rgba(0,0,0,0.85)]"
            >
              {INDUSTRIES.map((ind, idx) => {
                const Icon = ind.icon;
                const isHovered = activeHover === ind.id;

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
                      left: "0%",
                      top: "0%",
                      width: "100%",
                      height: "100%",
                      background: ind.fallbackBg,
                      zIndex: idx === 0 ? 1 : 2,
                    }}
                  >
                    {/* Real Authentic MP4 Video with Smooth Fallback */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <video
                        src={ind.video}
                        poster={ind.poster}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        onError={(e) => {
                          // Fallback gracefully to poster image if video fails
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {/* Secondary image fallback layer */}
                      <img
                        src={ind.poster}
                        alt={ind.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                    </div>

                    {/* Dark Cinematic Vignette & Bottom Gradient for Crystal Readability */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050507]/95 via-[#050507]/45 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-black/5 transition-colors pointer-events-none" />

                    {/* Glowing Border Highlight on Hover */}
                    <div
                      className="absolute inset-0 z-20 rounded-xl sm:rounded-2xl border-2 pointer-events-none transition-opacity duration-300"
                      style={{
                        borderColor: ind.accentColor,
                        opacity: isHovered ? 0.7 : 0,
                        boxShadow: isHovered ? `inset 0 0 30px ${ind.accentColor}33` : "none",
                      }}
                    />

                    {/* Card Content Overlay */}
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

                        {/* Sample Handled Question (Shows on hover or prominent cards) */}
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

          {/* ============================================================
              CLOSING OUTRO OVERLAY (Scroll 0.78 to 1.0)
              Smoothly glides in from bottom before releasing sticky pin
              ============================================================ */}
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
      </div>
    </section>
  );
}
