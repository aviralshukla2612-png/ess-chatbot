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
      title: "Real Estate & Luxury Developments",
      badge: "24/7 Property Concierge",
      role: "Autonomous Property Sales & Tour Booking Assistant",
      color: "#C28AFF",
      description:
        "Upload brochures, floor plans, pricing sheets & FAQs. Nexus answers unit layout queries, quotes pricing, qualifies buyer intent, and books VIP site viewings directly into your CRM.",
      sampleQueries: [
        "What are the floor plans & starting price for 3BHK penthouses?",
        "Can I schedule a private site walkthrough this Saturday?",
        "What are the flexible developer payment plans available?",
      ],
      highlights: [
        "Grounded on Property PDFs & Layouts",
        "VIP Viewing Schedule Booking",
        "Instant CRM Lead Scoring",
      ],
      ctaText: "Deploy for Real Estate",
      ctaLink: "/login?industry=real-estate",
    },
    healthcare: {
      id: "healthcare",
      title: "Clinics & Specialized Medical Practices",
      badge: "Clinical Intake & Navigation",
      role: "24/7 Patient Intake & Specialist Routing Assistant",
      color: "#55A9FF",
      description:
        "Train Nexus on medical specialties, doctor schedules, accepted insurance, and clinical FAQs. Nexus provides 24/7 patient guidance, verifies insurance eligibility, and schedules doctor consultations.",
      sampleQueries: [
        "Are cardiology diagnostics covered under private insurance?",
        "How soon can I schedule an MRI consultation?",
        "What are the prerequisites for outpatient elective surgery?",
      ],
      highlights: [
        "Verified Medical FAQs & Specialty Routing",
        "Insurance Network Eligibility Check",
        "Priority Appointment Scheduling",
      ],
      ctaText: "Deploy for Healthcare",
      ctaLink: "/login?industry=healthcare",
    },
    education: {
      id: "education",
      title: "Universities & Academic Institutions",
      badge: "Admissions & Counseling",
      role: "24/7 Admissions Guidance & Student Enrollment Assistant",
      color: "#C28AFF",
      description:
        "Ingest degree prospectuses, fee structures, prerequisites, and scholarship criteria. Nexus guides prospective applicants through degree choices, calculates eligibility, and captures student leads.",
      sampleQueries: [
        "What are the application deadlines and tuition for Fall 2026?",
        "Are merit-based scholarships available for my course?",
        "Can I transfer postgraduate credits from an accredited college?",
      ],
      highlights: [
        "Prospectus & Academic Handbook Ingestion",
        "Automated Fee & Scholarship Calculator",
        "High-Intent Student Enrollment Capture",
      ],
      ctaText: "Deploy for Education",
      ctaLink: "/login?industry=education",
    },
    hospitality: {
      id: "hospitality",
      title: "Luxury Resorts, Hotels & Dining",
      badge: "Direct Suite & Table Booking",
      role: "24/7 Digital Concierge & Reservation Engine",
      color: "#FF713D",
      description:
        "Connect room categories, dining menus, spa packages, and amenities. Nexus assists travelers 24/7 with room recommendations, restaurant table reservations, and special event bookings.",
      sampleQueries: [
        "Can we reserve an overwater pool villa with late checkout?",
        "What dining options and vegan tasting menus are available?",
        "Are airport chauffeur and spa packages included?",
      ],
      highlights: [
        "24/7 Room & Amenity Instant Discovery",
        "Direct Dining & Event Reservation Capture",
        "Multilingual Guest Concierge",
      ],
      ctaText: "Deploy for Hospitality",
      ctaLink: "/login?industry=hospitality",
    },
    retail: {
      id: "retail",
      title: "E-Commerce & Omnichannel Retail Brands",
      badge: "Personal Shopper & Support",
      role: "Autonomous Shopping Assistant & Order Support Agent",
      color: "#22C8F2",
      description:
        "Sync product catalogs, sizing charts, inventory, and return policies. Nexus guides online shoppers, recommends matching products, looks up real-time shipping status, and handles returns automatically.",
      sampleQueries: [
        "Where is my expedited shipment and when will it arrive?",
        "Can you recommend a premium gift under $100 for a runner?",
        "What is your exchange policy for international orders?",
      ],
      highlights: [
        "Real-Time Order Tracking & Sizing Guide",
        "Catalog-Grounded Product Recommendations",
        "Automated Return & Exchange Support",
      ],
      ctaText: "Deploy for Retail",
      ctaLink: "/login?industry=retail",
    },
    "and-more": {
      id: "and-more",
      title: "Universal AI Assistant for Any Business",
      badge: "Universal 1-Line Embed",
      role: "Autonomous Enterprise Sales & Support AI",
      color: "#A494F4",
      description:
        "Upload any business PDFs, Word docs, CSVs, or enter your website URL. In under 5 minutes, Nexus learns your business with zero hallucinations and embeds on WordPress, Shopify, Webflow, or custom sites.",
      sampleQueries: [
        "How do I embed Nexus on my website with 1 line of code?",
        "Can I customize the assistant avatar, colors, and welcome message?",
        "Does Nexus synchronize with live website updates automatically?",
      ],
      highlights: [
        "5-Minute Setup with Zero Coding Required",
        "Universal Single-Line Script Embed",
        "Connects to PDF, DOCX, TXT, CSV & Live URLs",
      ],
      ctaText: "Build Your Assistant",
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

      {/* Floating Glass Pill Bar with Dropdown Effect */}
      <div ref={pillBarRef} className="relative z-30 w-full max-w-5xl mx-auto mb-3 sm:mb-5 px-3 sm:px-4 shrink-0">
        {/* =================================================================== */}
        {/* THE DROPDOWN PANEL (Smooth slide-down dropdown effect above pill)   */}
        {/* =================================================================== */}
        {activeDropdown && HERO_INDUSTRY_DATA[activeDropdown] && (() => {
          const indData = HERO_INDUSTRY_DATA[activeDropdown];
          const activeIndObj = industries.find((i) => i.id === activeDropdown);
          const ActiveIcon = activeIndObj ? activeIndObj.icon : Building2;

          return (
            <div
              className="absolute bottom-full mb-3 left-3 right-3 sm:left-4 sm:right-4 max-w-3xl mx-auto z-40 animate-dropdown-slide-down origin-bottom"
            >
              <div className="relative bg-[#0E0E18]/95 backdrop-blur-2xl border border-white/[0.14] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(150,61,255,0.2)] text-white overflow-hidden">
                {/* Top neon glow accent line */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-80"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${indData.color}, transparent)`,
                  }}
                />

                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${indData.color}25`,
                        border: `1px solid ${indData.color}60`,
                        boxShadow: `0 0 15px ${indData.color}35`,
                      }}
                    >
                      <ActiveIcon className="w-4 h-4" style={{ color: indData.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-white">
                          {indData.title}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Nexus AI Live</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9898A6]">
                        {indData.role}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveDropdown(null)}
                    className="w-7 h-7 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#9898A6] hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Body: Site-specific Capability */}
                <p className="mt-2.5 text-xs sm:text-[13px] text-[#D9D9E2] leading-relaxed">
                  {indData.description}
                </p>

                {/* Live Customer Questions Solved by Nexus */}
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9898A6] mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#C28AFF]" />
                    <span>Live Website Questions Handled Autonomously:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {indData.sampleQueries.map((query, qIdx) => (
                      <div
                        key={qIdx}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#C5C5D2] flex items-start gap-1.5 font-mono"
                      >
                        <span className="text-[#C28AFF] font-bold">›</span>
                        <span className="line-clamp-1">{query}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Value Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {indData.highlights.map((h, hIdx) => (
                    <span
                      key={hIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-white/[0.03] border border-white/[0.08] text-[#D9D9E2]"
                    >
                      <span>{h}</span>
                    </span>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
                  <a
                    href="#industries"
                    onClick={() => setActiveDropdown(null)}
                    className="text-xs text-[#9898A6] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Explore all industries deep-dive</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={onOpenTrial}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white btn-primary-gradient cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>{indData.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
      </div>
    </section>
  );
}

