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
  Bot,
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
  const [dropdownPos, setDropdownPos] = useState({ left: 0, arrowLeft: 20, width: 460 });
  const hoverTimeoutRef = useRef(null);
  const buttonRefs = useRef({});

  const updateDropdownPosition = (indId) => {
    const btn = buttonRefs.current[indId];
    const wrapper = pillBarRef.current;
    if (btn && wrapper) {
      const bRect = btn.getBoundingClientRect();
      const wRect = wrapper.getBoundingClientRect();

      const btnCenter = bRect.left + bRect.width / 2 - wRect.left;
      const cardWidth = Math.min(460, wRect.width - 24);

      const targetLeft = btnCenter - cardWidth / 2;
      const minLeft = 12;
      const maxLeft = wRect.width - cardWidth - 12;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));
      const arrowLeft = btnCenter - clampedLeft;

      setDropdownPos({
        left: clampedLeft,
        arrowLeft: Math.max(16, Math.min(cardWidth - 16, arrowLeft)),
        width: cardWidth,
      });
    }
  };

  const handlePillMouseEnter = (indId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    updateDropdownPosition(indId);
    setActiveDropdown(indId);
  };

  const handlePillMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const handleCardMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleCardMouseLeave = () => {
    handlePillMouseLeave();
  };

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
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
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
      wizardIndustry: "real-estate",
      title: "Real Estate Sales Copilot",
      eyebrow: "Property & Leasing AI",
      color: "#C28AFF",
      chatSnippet: {
        user: "Are 3BHK units with sea view available?",
        bot: "Yes! 2 luxury units on 18th floor starting at ₹1.4 Cr. Want to schedule a private VIP viewing?",
      },
      metrics: ["⚡ < 0.4s Fast Reply", "📄 PDF Floorplan Grounded", "📅 Instant Site Visits"],
      ctaText: "Deploy Copilot",
      ctaLink: "/login?industry=real-estate",
    },
    healthcare: {
      id: "healthcare",
      wizardIndustry: "clinic",
      title: "Clinical Intake & Triage Assistant",
      eyebrow: "Healthcare & Patient Care",
      color: "#55A9FF",
      chatSnippet: {
        user: "Do you accept HDFC Ergo insurance for OPD?",
        bot: "Yes, cashless coverage applies for OPD & diagnostics. Dr. Sharma has open slots today at 4 PM.",
      },
      metrics: ["⚡ 24/7 Patient Triage", "🛡️ Verified Medical FAQs", "📅 Doctor OPD Booking"],
      ctaText: "Deploy Assistant",
      ctaLink: "/login?industry=clinic",
    },
    education: {
      id: "education",
      wizardIndustry: "education",
      title: "Admissions & Campus Counselor",
      eyebrow: "Academia & EdTech AI",
      color: "#C28AFF",
      chatSnippet: {
        user: "What are the eligibility criteria for MBA Fall 2026?",
        bot: "50%+ graduation score & CAT/GMAT score. Merit scholarships up to 40% are currently open.",
      },
      metrics: ["⚡ Instant Lead Scoring", "📚 Prospectus Grounded", "🎓 99.8% Accuracy"],
      ctaText: "Deploy Counselor",
      ctaLink: "/login?industry=education",
    },
    hospitality: {
      id: "hospitality",
      wizardIndustry: "hotel",
      title: "24/7 Guest Concierge AI",
      eyebrow: "Hospitality & Resorts",
      color: "#FF713D",
      chatSnippet: {
        user: "Can I book a pool villa with late checkout?",
        bot: "Pool villa suite is available for ₹8,500/night with complimentary 2 PM late checkout confirmed.",
      },
      metrics: ["⚡ Direct Suite Booking", "🍽️ Dining & Itinerary", "🛎️ Zero Wait Time"],
      ctaText: "Deploy Concierge",
      ctaLink: "/login?industry=hotel",
    },
    retail: {
      id: "retail",
      wizardIndustry: "retail-ecommerce",
      title: "Autonomous Shopping Assistant",
      eyebrow: "E-Commerce & D2C Brands",
      color: "#22C8F2",
      chatSnippet: {
        user: "Where is my order #NX-8821? Can I exchange size?",
        bot: "Out for delivery by 6 PM today! Instant 7-day exchange is supported with 1-click.",
      },
      metrics: ["⚡ Live Order Tracking", "🛍️ Catalog Recommendations", "📦 Instant Returns"],
      ctaText: "Deploy Shopping AI",
      ctaLink: "/login?industry=retail-ecommerce",
    },
    "and-more": {
      id: "and-more",
      wizardIndustry: "other",
      title: "Custom Enterprise AI Agent",
      eyebrow: "Universal Knowledge Engine",
      color: "#A494F4",
      chatSnippet: {
        user: "How quickly can we ingest company docs?",
        bot: "Upload PDFs, DOCX, or live website URL. Your custom grounded bot is ready to embed in 5 minutes.",
      },
      metrics: ["⚡ 1-Line Web Embed", "📄 Multimodal Document Sync", "🔒 Anti-Hallucination"],
      ctaText: "Build Custom AI",
      ctaLink: "/login?industry=other",
    },
  };

  const handleToggleIndustryDropdown = (indId = "real-estate") => {
    if (activeDropdown === indId) {
      setActiveDropdown(null);
    } else {
      updateDropdownPosition(indId);
      setActiveDropdown(indId);
    }
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
                    ref={(el) => (buttonRefs.current[ind.id] = el)}
                    type="button"
                    onMouseEnter={() => handlePillMouseEnter(ind.id)}
                    onMouseLeave={handlePillMouseLeave}
                    onClick={() => {
                      if (activeDropdown === ind.id) {
                        setActiveDropdown(null);
                      } else {
                        handlePillMouseEnter(ind.id);
                      }
                    }}
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
        {/* DOWN-SIDE CURTAIN CARD ALIGNED TO HOVERED WORD (NOT IN CENTER)      */}
        {/* =================================================================== */}
        {activeDropdown && HERO_INDUSTRY_DATA[activeDropdown] && (() => {
          const indData = HERO_INDUSTRY_DATA[activeDropdown];
          const activeIndObj = industries.find((i) => i.id === activeDropdown);
          const ActiveIcon = activeIndObj ? activeIndObj.icon : Building2;

          return (
            <div
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="absolute top-[calc(100%+8px)] z-50 origin-top animate-curtain-drop pointer-events-auto"
              style={{
                left: `${dropdownPos.left}px`,
                width: `${dropdownPos.width}px`,
              }}
            >
              <div className="relative w-full bg-[#0A0A12]/95 backdrop-blur-3xl border border-white/[0.14] rounded-2xl p-3.5 sm:p-4 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(150,61,255,0.2)] text-white overflow-hidden">
                {/* Ambient dynamic radial mesh glow behind icon */}
                <div
                  className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-500"
                  style={{ backgroundColor: indData.color }}
                />

                {/* Top pointer notch pointing directly to the hovered word */}
                <div
                  className="absolute -top-1.5 w-3 h-3 rotate-45 bg-[#0A0A12] border-t border-l border-white/[0.14]"
                  style={{ left: `${dropdownPos.arrowLeft - 6}px` }}
                />

                {/* Top illuminated border accent */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-90 rounded-t-2xl"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${indData.color}, transparent)`,
                  }}
                />

                {/* 1. Top Header: Icon + Eyebrow + Title + Close Button */}
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        backgroundColor: `${indData.color}18`,
                        border: `1.5px solid ${indData.color}50`,
                        boxShadow: `0 0 16px ${indData.color}25`,
                      }}
                    >
                      <ActiveIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: indData.color }} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                          style={{ backgroundColor: indData.color }}
                        />
                        <span
                          className="text-[9.5px] sm:text-[10px] font-mono tracking-wider font-semibold uppercase truncate"
                          style={{ color: indData.color }}
                        >
                          {indData.eyebrow}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-tight mt-0.5">
                        {indData.title}
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveDropdown(null)}
                    className="w-5 h-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#9898A6] hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* 2. Interactive Live Conversation Snippet (The "Show, Don't Just Tell" Preview) */}
                <div className="relative z-10 mt-2.5 rounded-xl bg-black/50 border border-white/[0.07] p-2.5 space-y-2">
                  {/* User Question */}
                  <div className="flex items-start gap-1.5 justify-end">
                    <div className="max-w-[88%] rounded-xl rounded-tr-xs px-2.5 py-1 bg-white/[0.08] border border-white/[0.08] text-[10.5px] text-[#E0E0EA] leading-snug">
                      <span className="text-[8.5px] font-mono uppercase text-[#8E8E9B] block font-semibold mb-0.5">
                        Visitor
                      </span>
                      "{indData.chatSnippet.user}"
                    </div>
                  </div>

                  {/* Bot Answer */}
                  <div className="flex items-start gap-1.5">
                    <div
                      className="w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${indData.color}25`,
                        border: `1px solid ${indData.color}60`,
                      }}
                    >
                      <Bot className="w-2.5 h-2.5" style={{ color: indData.color }} />
                    </div>
                    <div
                      className="max-w-[88%] rounded-xl rounded-tl-xs px-2.5 py-1 text-[10.5px] leading-snug border"
                      style={{
                        backgroundColor: `${indData.color}10`,
                        borderColor: `${indData.color}35`,
                        color: "#F5F5F7",
                      }}
                    >
                      <span
                        className="text-[8.5px] font-mono uppercase font-bold block mb-0.5"
                        style={{ color: indData.color }}
                      >
                        Nexus AI Copilot
                      </span>
                      "{indData.chatSnippet.bot}"
                    </div>
                  </div>
                </div>

                {/* 3. Key Capability Micro-Metrics Badges */}
                <div className="relative z-10 mt-2.5 flex items-center gap-1.5 flex-wrap">
                  {indData.metrics.map((metric, mIdx) => (
                    <span
                      key={mIdx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-medium bg-white/[0.04] border border-white/[0.09] text-[#D9D9E2]"
                    >
                      {metric}
                    </span>
                  ))}
                </div>

                {/* 4. Bottom Action Bar: 1-Line Info + Glowing Deploy CTA */}
                <div className="relative z-10 mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-3">
                  <span className="text-[10.5px] text-[#9898A6] flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-[#C28AFF] shrink-0" />
                    <span className="truncate">Trained on your files in 5 mins</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const wizardId = indData.wizardIndustry || indData.id;
                      try {
                        localStorage.setItem("nexus_selected_industry", wizardId);
                      } catch (e) {}
                      window.location.href = `/login?industry=${wizardId}&redirect=${encodeURIComponent(`/bots/create?industry=${wizardId}`)}`;
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white btn-primary-gradient cursor-pointer shadow-[0_4px_16px_rgba(150,61,255,0.4)] hover:shadow-[0_6px_22px_rgba(150,61,255,0.6)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                  >
                    <span>{indData.ctaText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

