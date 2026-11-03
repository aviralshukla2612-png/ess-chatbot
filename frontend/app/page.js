"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import IndustriesSection from "@/components/IndustriesSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import TrionnLoader from "@/components/TrionnLoader";

// Register ScrollTrigger globally
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Building2,
  Plus,
  PlusSquare,
  GraduationCap,
  BedDouble,
  ShoppingBag,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Zap,
  Cpu,
  Lock,
  FileText,
  Sliders,
  Code2,
  Check,
  X,
  Bot,
  Send,
} from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("real-estate");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [hoveredNav, setHoveredNav] = useState(null);
  const [navIndicatorStyle, setNavIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navLinkRefs = useRef({});

  useEffect(() => {
    const updateIndicator = () => {
      const current = hoveredNav || activeNav;
      const el = navLinkRefs.current[current];
      if (el) {
        setNavIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const t = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeNav, hoveredNav]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        setIsAuthenticated(Boolean(d?.success && d?.user));
      })
      .catch(() => setIsAuthenticated(false));

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const navSections = [
        { id: "home", label: "Home" },
        { id: "industries", label: "Industries" },
        { id: "benefits", label: "Benefits" },
        { id: "how-it-works", label: "How It Works" },
        { id: "pricing", label: "Pricing" },
      ];

      const scrollPos = window.scrollY + 200;
      for (let i = navSections.length - 1; i >= 0; i--) {
        const el = document.getElementById(navSections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveNav(navSections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initialize Lenis with GSAP ScrollTrigger coordination
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener("scroll", handleScroll);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const industriesHero = [
    { id: "real-estate", label: "Real Estate", icon: Building2 },
    { id: "healthcare", label: "Healthcare", icon: Plus },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "hospitality", label: "Hospitality", icon: BedDouble },
    { id: "retail", label: "Retail", icon: ShoppingBag },
    { id: "and-more", label: "And More", icon: Layers },
  ];

  const handleOpenExperience = (indId = "real-estate") => {
    setSelectedIndustry(indId);
    setExperienceModalOpen(true);
  };

  const benefits = [
    {
      icon: Zap,
      title: "24/7 Sub-Second Response Latency",
      badge: "Real-Time Speed",
      description:
        "Never leave a prospective buyer waiting. Emperor Nexus delivers verified, contextual answers in under 600 milliseconds, turning nighttime traffic into booked appointments.",
      points: [
        "Instant concurrent multi-visitor handling",
        "Zero queue bottlenecks during peak campaigns",
        "Optimized global edge streaming deployment",
      ],
      accentColor: "#C28AFF",
    },
    {
      icon: Cpu,
      title: "Grounded Vector Precision (0% Hallucination)",
      badge: "Strict Citation Retrieval",
      description:
        "Every response is strictly anchored to your uploaded PDFs, contracts, pricing sheets, and website URLs. If the answer is not in your knowledge base, the bot escalates safely without inventing details.",
      points: [
        "Multi-chunk vector similarity matching",
        "Deterministic guardrails against rogue prompt injection",
        "Strict compliance with corporate discounting rules",
      ],
      accentColor: "#55A9FF",
    },
    {
      icon: TrendingUp,
      title: "Automated High-Intent CRM Lead Pipeline",
      badge: "Revenue Acceleration",
      description:
        "Identify high-intent visitors through natural conversational cues. The assistant automatically captures contact details, budget ranges, and project scopes, pushing them straight into your sales CRM.",
      points: [
        "BANT (Budget, Authority, Need, Timeline) scoring",
        "Instant webhook dispatch to HubSpot, Salesforce, & Zapier",
        "Real-time SMS & email hot-lead notification alerts",
      ],
      accentColor: "#C28AFF",
    },
    {
      icon: Lock,
      title: "Enterprise Multi-Tenant Security & Governance",
      badge: "Bank-Grade Privacy",
      description:
        "Designed for regulated enterprises. Complete tenant workspace isolation ensures proprietary manuals, client records, and documents never cross organization boundaries.",
      points: [
        "End-to-end encrypted document storage",
        "Granular role-based sub-admin & admin controls",
        "Complete GDPR, SOC 2, and CCPA audit compliance",
      ],
      accentColor: "#55A9FF",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Connect Your Knowledge Base",
      tagline: "Instant Document & Web Ingestion",
      description:
        "Upload brochures, pricing schedules, FAQs, technical manuals, or simply enter your website URL. Emperor Nexus automatically splits, vectors, and indexes your proprietary knowledge.",
      highlight: "Supports PDF, DOCX, TXT, CSV, and live URL crawler synchronization.",
    },
    {
      number: "02",
      icon: Sliders,
      title: "Calibrate Persona & Launcher Styling",
      tagline: "Executive Tone & Motion Customizer",
      description:
        "Select your assistant's personality (Corporate, Consultative, Warm), set custom welcome greetings, pick brand colors, and choose from 19 attention-grabbing button animations.",
      highlight: "Custom logo upload, squircle / circle / pill buttons, and 19 launcher animations.",
    },
    {
      number: "03",
      icon: Code2,
      title: "Deploy with a Single Line of Code",
      tagline: "Instant Embed on Any Website",
      description:
        "Paste a lightweight single-line script before the closing body tag of your website. Emperor Nexus immediately goes live on WordPress, Shopify, Webflow, Next.js, or custom HTML.",
      highlight: "Zero dependencies, anti-cache instant updates, and mobile-optimized viewport.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] selection:bg-[#963DFF] selection:text-white relative">
      {/* 0. Trionn-style Cinematic Preloader with User's Video */}
      {loading && <TrionnLoader onComplete={() => setLoading(false)} />}

      {/* 1. TOP HEADER / NAVIGATION */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050507]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            : "bg-transparent border-b border-white/[0.04]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo - 100% Full Vibrant Color */}
          <Link href="/" className="group relative flex items-center cursor-pointer" aria-label="Emperor Nexus Home">
            <img
              src="/emperor_nexus_sales_ai_assistant_original.png"
              alt="Emperor Nexus — Sales AI Assistant"
              className="h-10 sm:h-11 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_20px_rgba(150,61,255,0.35)] cursor-pointer"
            />
          </Link>

          {/* Desktop Navigation Links with Moving Sliding Indicator */}
          <nav
            onMouseLeave={() => setHoveredNav(null)}
            className="relative hidden md:flex items-center gap-8 py-2"
          >
            {[
              { id: "home", label: "Home" },
              { id: "industries", label: "Industries" },
              { id: "benefits", label: "Benefits" },
              { id: "how-it-works", label: "How It Works" },
              { id: "pricing", label: "Pricing" },
            ].map((nav) => {
              const isActive = activeNav === nav.id;
              const isHovered = hoveredNav === nav.id;
              return (
                <a
                  key={nav.id}
                  ref={(el) => (navLinkRefs.current[nav.id] = el)}
                  href={`#${nav.id}`}
                  onMouseEnter={() => setHoveredNav(nav.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveNav(nav.id);
                    const el = document.getElementById(nav.id);
                    if (el) {
                      const isPinned = nav.id === "benefits" || nav.id === "how-it-works";
                      const topOffset = isPinned
                        ? el.getBoundingClientRect().top + window.scrollY
                        : el.getBoundingClientRect().top + window.scrollY - 70;
                      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
                    }
                  }}
                  className={`relative py-1 text-sm font-medium transition-colors cursor-pointer select-none ${
                    isActive || isHovered ? "text-white font-semibold" : "text-[#D9D9E2] hover:text-white"
                  }`}
                >
                  <span>{nav.label}</span>
                </a>
              );
            })}

            {/* Smooth Sliding Underline Indicator with Glowing Purple Aura */}
            <span
              className="absolute bottom-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#963DFF] via-[#B86BFF] to-[#C28AFF] shadow-[0_0_12px_rgba(150,61,255,0.95)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
              style={{
                left: `${navIndicatorStyle.left}px`,
                width: `${navIndicatorStyle.width}px`,
                opacity: navIndicatorStyle.opacity,
              }}
            />
            {/* Ambient Purple Glow */}
            <span
              className="absolute bottom-[-1px] h-[6px] rounded-full bg-[#963DFF]/35 blur-[3px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
              style={{
                left: `${navIndicatorStyle.left}px`,
                width: `${navIndicatorStyle.width}px`,
                opacity: navIndicatorStyle.opacity,
              }}
            />
          </nav>

          {/* Right Action */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold text-white btn-primary-gradient cursor-pointer overflow-hidden transition-all duration-300"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#D9D9E2] hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold text-white btn-primary-gradient cursor-pointer overflow-hidden transition-all duration-300"
                >
                  <span>Start Free Trial</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section
        id="home"
        className="relative h-screen min-h-[600px] max-h-screen w-full flex flex-col justify-between items-center pt-20 pb-4 px-4 sm:px-6 md:px-8 overflow-hidden bg-[#050507]"
      >
        {/* User's Exact Clean Background - Pure bg.png with seamless black blend */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url('/bg.png?v=2')` }}
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

        {/* Central Hero Headline & CTA (Centered vertically in hero viewport) */}
        <div className="relative z-10 max-w-6xl w-full mx-auto my-auto flex flex-col items-center text-center">
          <h1
            className="font-headline tracking-normal text-white uppercase text-center flex flex-col items-center justify-center select-none"
            style={{
              lineHeight: "0.95",
              fontSize: "clamp(2rem, 4.6vw, 4.5rem)",
            }}
          >
            <span className="block text-[#F5F5F7] tracking-[0.02em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              WHATEVER YOUR INDUSTRY,
            </span>
            <span className="block tracking-[0.02em] mt-1 sm:mt-1.5 text-gradient-purple-blue drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              YOUR CUSTOMERS HAVE QUESTIONS.
            </span>
          </h1>

          <p className="mt-3 sm:mt-4 max-w-[760px] text-xs sm:text-sm md:text-base text-[#9898A6] font-normal leading-relaxed text-center">
            Give every visitor a better way to connect with your business, get answers
            and discover what you offer — 24/7.
          </p>

          <div className="mt-5 sm:mt-6 flex flex-row items-center justify-center gap-3.5 w-auto">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-3.5 rounded-full font-medium text-sm sm:text-base text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer group shadow-[0_8px_25px_rgba(158,96,244,0.45)]"
            >
              <span>{isAuthenticated ? "Launch Dashboard" : "Start Free Trial"}</span>
              <span className="text-lg leading-none transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>

            <button
              type="button"
              onClick={() => handleOpenExperience("real-estate")}
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
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#12121A]/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
            {industriesHero.map((ind, idx) => {
              const Icon = ind.icon;
              return (
                <React.Fragment key={ind.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenExperience(ind.id)}
                    className="group/pill inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[#D9D9E2] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D9D9E2] group-hover/pill:text-white transition-colors stroke-[1.8]" />
                    <span className="whitespace-nowrap">{ind.label}</span>
                  </button>
                  {idx < industriesHero.length - 1 && (
                    <div className="w-px h-3.5 bg-white/15 my-auto shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SCROLL-PINNED MOSAIC INDUSTRIES SECTION */}
      <IndustriesSection
        onOpenExperience={handleOpenExperience}
        onOpenTrial={() => (window.location.href = "/register")}
      />

      {/* 4. DRAMATIC SHATTER TRANSITION + THREE-CARD REVEAL BENEFITS */}
      <BenefitsSection
        onOpenTrial={() => (window.location.href = "/register")}
      />

      {/* 5. AWWWARDS-LEVEL SHATTER TRANSITION + THREE-CARD REVEAL HOW IT WORKS */}
      <HowItWorksSection
        onOpenTrial={() => (window.location.href = "/register")}
      />

      {/* 6. PRICING SECTION (Cinematic Scroll-Driven Transformation) */}
      <PricingSection
        isAuthenticated={isAuthenticated}
        onOpenTrial={(planId) => {
          window.location.href = isAuthenticated
            ? `/billing?plan=${planId || "annual"}`
            : `/register?plan=${planId || "annual"}`;
        }}
      />

      {/* 7. NOTH.IN STYLE SIGNATURE FOOTER WITH GSAP SCROLL REVEAL & ELASTIC BOUNCE */}
      <Footer />

      {/* 8. INTERACTIVE EXPERIENCE MODAL */}
      {experienceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setExperienceModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[85vh] bg-[#0B0B10] border border-white/[0.12] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#963DFF] to-[#55A9FF] flex items-center justify-center text-white shadow-[0_0_15px_rgba(150,61,255,0.4)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Emperor Nexus — Live Experience Studio
                  </h3>
                  <p className="text-[11px] text-[#9898A6]">
                    Autonomous multi-industry conversation & lead qualification simulation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExperienceModalOpen(false)}
                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9898A6] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C28AFF]">
                    Selected Industry: {selectedIndustry.toUpperCase()}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">● Grounded AI Engine Active</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Every visitor question is resolved with verified citations from your proprietary knowledge base,
                  automatically qualifying commercial intent and logging lead scores into your CRM pipeline.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/register"}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>{isAuthenticated ? "Go to Workspace" : "Start Free 14-Day Trial"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setExperienceModalOpen(false)}
                  className="px-6 py-3.5 rounded-2xl text-sm font-semibold btn-secondary-glass cursor-pointer"
                >
                  Close Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
