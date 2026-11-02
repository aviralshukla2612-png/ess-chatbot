"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Building2,
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("real-estate");
  const [billingCycle, setBillingCycle] = useState("annual");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        setIsAuthenticated(Boolean(d?.success && d?.user));
      })
      .catch(() => setIsAuthenticated(false));

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const industriesHero = [
    { id: "real-estate", label: "Real Estate", icon: Building2 },
    { id: "healthcare", label: "Healthcare", icon: PlusSquare },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "hospitality", label: "Hospitality", icon: BedDouble },
    { id: "retail", label: "Retail", icon: ShoppingBag },
    { id: "and-more", label: "And More", icon: Layers },
  ];

  const handleOpenExperience = (indId = "real-estate") => {
    setSelectedIndustry(indId);
    setExperienceModalOpen(true);
  };

  const industriesDeepDive = [
    {
      id: "real-estate",
      category: "Real Estate",
      title: "Horizon Edge — Glass Façade Solutions",
      subtitle: "Property details, pricing and project enquiries.",
      tagline: "Unit Specs & Pricing",
      icon: Building2,
      img: "https://images.openai.com/static-rsc-4/bhxjo1KnM48AtN2-0ihMdpI48LvHI1QeSp43wdBbpwoDLMMc-4hMo_FhIguQpLD9mUrkYH8xH2xEof-rIMZwPdsaBr-0AyNctvCbanY5diNd3mJ0BRoJfowuSu10UJDol4GDXtjxLEy8ct12NBawbpbURs4Ik51lWsRal0HfvQo?purpose=inline",
      fallbackBg: "linear-gradient(135deg, #1E1233 0%, #0B0B14 100%)",
      description:
        "Guide commercial developers and buyers through thermal ratings, unit dimensions, glass façade specs, and pricing structures.",
      questionExample: "What are the thermal insulation ratings and lead times for unitized façade glass panels?",
      metrics: "3.4x Faster Viewing Bookings",
    },
    {
      id: "healthcare",
      category: "Healthcare",
      title: "Medical Clinic & Wellness Suite",
      subtitle: "Treatments, doctors and consultation information.",
      tagline: "Clinical Intake & Eligibility",
      icon: PlusSquare,
      img: "https://images.openai.com/static-rsc-4/2jq0Rok6gYbmP6SqRsv3gC58bnz2qV8feTR3ABvlxw0mbo9zaCOxDZ-4aL3K9lwt0znqO_LcqV6R9yCClKlx_Tfn6PkfsaZb1_BMgF5fCGt6oH2qmn_99dwdKdFMgLkHGT2wBS1NQpLBz6Ugu3LjntKdrasPbakdQ3wD0tEzLrE?purpose=inline",
      fallbackBg: "linear-gradient(135deg, #122233 0%, #080D14 100%)",
      description:
        "Instantly answer questions about clinical treatments, doctor credentials, diagnostic scans, and coordinate patient consultations.",
      questionExample: "Are orthopedic consultations and diagnostic scans covered under international insurance?",
      metrics: "88% Reduction in Support Wait Times",
    },
    {
      id: "education",
      category: "Education",
      title: "USTP Campus & Higher Education",
      subtitle: "Admissions, courses and fee enquiries.",
      tagline: "Programs & Admissions",
      icon: GraduationCap,
      img: "https://images.openai.com/static-rsc-4/M9VJrdy3ggMu426pzfuw2otoLMtAcuRe_omuJWKz5t8Xqmv6k_DG9xF4mRFLwDp504lPXG8Yy7ihgGp_OwNgWwzxBTHiW1xrdP-v_dUCdIzre_CtzN3fUyDeT1nKcOcAwpMzrgnnvTXMjct14xeIL7CR28kMrRvwviRhvFOAZTg?purpose=inline",
      fallbackBg: "linear-gradient(135deg, #241433 0%, #0C0814 100%)",
      description:
        "Direct prospective students to degree programs, scholarship eligibility, fee structures, and application deadline requirements.",
      questionExample: "What are the application deadlines and scholarship criteria for the Fall 2026 intake?",
      metrics: "62% Increase in Completed Applications",
    },
    {
      id: "hospitality",
      category: "Hospitality",
      title: "Grand Horizon Luxury Hotel & Resort",
      subtitle: "Rooms, facilities and accommodation information.",
      tagline: "Suites & Bespoke Stays",
      icon: BedDouble,
      img: "https://images.openai.com/static-rsc-4/0kABJj0RgRdu6YugoGN2wcoTb_4E7HtbjDwc11vePEH7U5osQvubLqXbzn5TJgNnnan_hKkdD-veiqRt1wdUmEF7E0zmknQkCqoZkGB-QzaXLHevs-o2xhyH51a7INz3y1q664Ai0DXrPLBbkfeT_OapvF8Nxe311Zsn3WCCCjg?purpose=inline",
      fallbackBg: "linear-gradient(135deg, #1E1A33 0%, #090812 100%)",
      description:
        "Deliver 24/7 concierge assistance for ocean-view suites, dining reservations, private wellness sessions, and VIP booking upgrades.",
      questionExample: "Can we reserve an executive ocean-view suite with private dinner and late checkout?",
      metrics: "2.1x Boost in Direct Booking Value",
    },
  ];

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

  const plans = [
    {
      name: "Starter",
      tagline: "For Growing Boutiques & Fast Starters",
      priceMonthly: 49,
      priceAnnual: 39,
      description:
        "Essential autonomous sales AI for single-brand websites qualifying daily inquiries.",
      popular: false,
      features: [
        "1 Autonomous Sales Assistant",
        "Up to 2,000 monthly conversations",
        "50 Knowledge Base documents or URLs",
        "19 launcher button animations",
        "Lead capture & email notifications",
        "Standard vector retrieval accuracy",
      ],
      ctaText: "Start Starter Trial",
    },
    {
      name: "Professional",
      tagline: "For Scaling Mid-Market Commercial Firms",
      priceMonthly: 149,
      priceAnnual: 119,
      description:
        "High-performance AI for multi-service businesses demanding priority speed and CRM automation.",
      popular: true,
      features: [
        "Up to 5 Autonomous Sales Assistants",
        "15,000 monthly conversations",
        "Unlimited Knowledge Base documents & URLs",
        "Live website crawler synchronization",
        "Real-time CRM webhook & Zapier sync",
        "Custom branding & white-label removal",
        "Sub-second edge streaming latency",
        "Dedicated account onboarding manager",
      ],
      ctaText: "Start Professional Trial",
    },
    {
      name: "Enterprise",
      tagline: "For Multi-Tenant Enterprises & Large Networks",
      priceMonthly: 499,
      priceAnnual: 399,
      description:
        "Complete enterprise deployment with tenant isolation, custom vector embeddings, and SLA guarantees.",
      popular: false,
      features: [
        "Unlimited Autonomous Sales Assistants",
        "Unlimited monthly conversations",
        "Isolated multi-tenant data governance",
        "Dedicated vector workspace & custom model tuning",
        "Multi-agent sub-admin permission hierarchy",
        "99.9% uptime enterprise SLA",
        "Custom contract, invoice & security audit",
        "24/7 priority VIP engineering channel",
      ],
      ctaText: "Contact Enterprise Sales",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] selection:bg-[#963DFF] selection:text-white relative">
      {/* 1. TOP HEADER / NAVIGATION */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050507]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            : "bg-transparent border-b border-white/[0.04]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-3 cursor-pointer">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#963DFF]/30 to-[#55A9FF]/20 blur-sm group-hover:blur-md transition-all" />
              <svg
                className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:scale-105"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 28L18 8H26L16 28H8Z" fill="#FFFFFF" />
                <path d="M17 28L27 8H33L23 28H17Z" fill="url(#nav-logo-grad)" />
                <defs>
                  <linearGradient id="nav-logo-grad" x1="17" y1="8" x2="33" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#C28AFF" />
                    <stop offset="1" stopColor="#55A9FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-[0.14em] text-white uppercase leading-none">
                EMPEROR
              </span>
              <span className="text-[9px] font-semibold tracking-[0.24em] text-[#9898A6] uppercase mt-1 leading-none">
                SMART SOLUTIONS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="relative py-2 text-sm font-semibold text-white">
              <span>Home</span>
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#963DFF] to-[#C28AFF] shadow-[0_0_12px_rgba(150,61,255,0.8)]" />
            </a>
            <a href="#industries" className="text-sm font-medium text-[#D9D9E2] hover:text-white transition-colors">
              Industries
            </a>
            <a href="#benefits" className="text-sm font-medium text-[#D9D9E2] hover:text-white transition-colors">
              Benefits
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-[#D9D9E2] hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-[#D9D9E2] hover:text-white transition-colors">
              Pricing
            </a>
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
        className="relative min-h-screen w-full flex flex-col justify-between items-center pt-32 pb-16 px-4 sm:px-6 md:px-8 overflow-hidden bg-[#050507]"
      >
        {/* Underlying Metallic Wave (bg.png) */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat pointer-events-none opacity-95 transition-opacity duration-1000"
          style={{ backgroundImage: `url('/bg.png')` }}
        />

        {/* Technical Dotted & Line Grid */}
        <div className="absolute inset-0 z-1 nexus-grid-overlay pointer-events-none opacity-40" />
        <div className="absolute inset-0 z-1 nexus-dotted-grid pointer-events-none opacity-30" />

        {/* Ambient Radial Lighting */}
        <div className="absolute inset-0 z-2 pointer-events-none glow-hero-ambient" />
        <div className="absolute top-0 left-0 right-0 h-40 z-2 bg-gradient-to-b from-[#050507] via-[#050507]/60 to-transparent pointer-events-none" />

        {/* Central Hero Headline & CTA */}
        <div className="relative z-10 max-w-6xl w-full mx-auto flex flex-col items-center text-center mt-6 sm:mt-12 md:mt-16">
          <h1
            className="font-headline tracking-normal text-white uppercase text-center flex flex-col items-center justify-center select-none"
            style={{
              lineHeight: "0.92",
              fontSize: "clamp(2.75rem, 8vw, 7.5rem)",
            }}
          >
            <span className="block text-[#F5F5F7] tracking-[0.02em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              WHATEVER YOUR INDUSTRY,
            </span>
            <span className="block tracking-[0.02em] mt-1 sm:mt-2 text-glow-purple text-gradient-purple-blue">
              YOUR CUSTOMERS HAVE QUESTIONS.
            </span>
          </h1>

          <p className="mt-6 sm:mt-8 max-w-[820px] text-base sm:text-lg md:text-xl text-[#9898A6] font-normal leading-relaxed text-center">
            Give every visitor a better way to connect with your business, get answers
            and discover what you offer — 24/7.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm sm:text-base text-white btn-primary-gradient flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_30px_rgba(150,61,255,0.4)] hover:shadow-[0_0_40px_rgba(150,61,255,0.6)]"
            >
              <span>{isAuthenticated ? "Launch Dashboard" : "Start Free Trial"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => handleOpenExperience("real-estate")}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-sm sm:text-base btn-secondary-glass flex items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center group-hover:border-[#C28AFF] group-hover:bg-[#963DFF]/20 transition-all">
                <Play className="w-2.5 h-2.5 fill-current text-white group-hover:text-[#C28AFF] transition-colors ml-0.5" />
              </div>
              <span>Explore the Experience</span>
            </button>
          </div>
        </div>

        {/* 6 Industry Showcase Strip */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-14 sm:mt-20">
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-2.5 sm:gap-3 p-2 rounded-2xl md:rounded-full bg-black/40 backdrop-blur-xl border border-white/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
            {industriesHero.map((ind, idx) => {
              const Icon = ind.icon;
              return (
                <React.Fragment key={ind.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenExperience(ind.id)}
                    className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl md:rounded-full bg-white/[0.025] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#963DFF]/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(150,61,255,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Icon className="w-4 h-4 text-[#D9D9E2] group-hover:text-[#C28AFF] transition-colors duration-200 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#D9D9E2] group-hover:text-white transition-colors duration-200 whitespace-nowrap">
                      {ind.label}
                    </span>
                  </button>
                  {idx < industriesHero.length - 1 && (
                    <div className="hidden md:block w-px h-5 bg-white/10" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 w-full h-8 mt-6 pointer-events-none" />
      </section>

      {/* 3. DEEP DIVE INDUSTRIES SECTION */}
      <section id="industries" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#0B0B10] overflow-hidden">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#963DFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-96 h-96 bg-[#55A9FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 nexus-grid-overlay opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>02. Customized Business Experience — Every Business is Different</span>
            </div>

            <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
              Your Business Is Unique. <br />
              <span className="text-glow-purple text-gradient-purple-blue">
                Your Customer Experience Should Be Too.
              </span>
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
              Every business has its own services, offerings, customers and way of working.
              Create a customized assistant around your business information, so visitors can explore
              what you offer and get relevant answers to their questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {industriesDeepDive.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.id}
                  className="group relative rounded-3xl glass-panel glass-panel-hover overflow-hidden flex flex-col justify-between cursor-pointer border border-white/[0.08] hover:border-[#963DFF]/40 transition-all duration-300"
                  onClick={() => handleOpenExperience(ind.id)}
                >
                  {/* Top Image Banner */}
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black/40">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${ind.img}'), ${ind.fallbackBg}`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-black/20 to-transparent" />

                    {/* Category Pill Tag */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                      <Icon className="w-3.5 h-3.5 text-[#C28AFF]" />
                      <span>{ind.category}</span>
                    </div>

                    {/* Metric Tag */}
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                      {ind.metrics}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-xl sm:text-2xl text-white group-hover:text-[#F5F5F7] transition-colors">
                        {ind.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-[#9898A6] leading-relaxed">
                        {ind.subtitle}
                      </p>

                      {/* Sample Customer Question Block */}
                      <div className="mt-6 p-4 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#C28AFF] tracking-wider block">
                          Sample Customer Question Handled:
                        </span>
                        <p className="text-xs sm:text-sm text-[#F5F5F7] italic font-medium">
                          "{ind.questionExample}"
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#9898A6]">
                        {ind.tagline}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenExperience(ind.id);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#C28AFF] group-hover:text-white transition-colors"
                      >
                        <span>Test Assistant Live</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. BENEFITS SECTION */}
      <section id="benefits" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#050507] overflow-hidden">
        <div className="absolute inset-0 nexus-grid-overlay opacity-25 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#963DFF]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-white text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#55A9FF]" />
              <span>Architecture & Performance</span>
            </div>

            <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
              Engineered For Precision, <br />
              <span className="text-glow-purple text-gradient-purple-blue">
                Security & High Conversion
              </span>
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
              Unlike generic AI chat wrappers, Emperor Nexus combines enterprise vector retrieval,
              customizable sales personas, and real-time lead qualification workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-8 sm:p-10 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center group-hover:border-[#963DFF]/50 group-hover:bg-[#963DFF]/20 transition-all duration-300 shadow-md">
                        <Icon className="w-7 h-7 text-[#D9D9E2] group-hover:text-white transition-colors" />
                      </div>
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border"
                        style={{
                          color: b.accentColor,
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        {b.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-2xl text-white group-hover:text-[#F5F5F7] transition-colors">
                      {b.title}
                    </h3>

                    <p className="mt-4 text-sm text-[#9898A6] leading-relaxed">
                      {b.description}
                    </p>

                    <div className="mt-6 space-y-2.5">
                      {b.points.map((pt, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-[#D9D9E2]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-[#9898A6] font-medium">Enterprise Guaranteed SLA</span>
                    <Link
                      href={isAuthenticated ? "/dashboard" : "/register"}
                      className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#C28AFF] transition-colors cursor-pointer"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#0B0B10] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fast Three-Step Setup</span>
            </div>

            <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
              From Raw Documents To <br />
              <span className="text-glow-purple text-gradient-purple-blue">
                Autonomous Sales In 5 Minutes
              </span>
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
              No machine learning engineers, vector database setups, or prompt writing required.
              Your AI sales assistant trains itself on your materials automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-8 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden"
                >
                  <span className="absolute top-4 right-6 font-headline text-7xl font-bold text-white/[0.04] group-hover:text-[#963DFF]/15 transition-colors select-none">
                    {st.number}
                  </span>

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] group-hover:border-[#963DFF]/40 group-hover:bg-[#963DFF]/20 flex items-center justify-center transition-all duration-300 shadow-sm mb-6">
                      <Icon className="w-7 h-7 text-[#D9D9E2] group-hover:text-[#C28AFF] transition-colors" />
                    </div>

                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C28AFF] block mb-2">
                      {st.tagline}
                    </span>

                    <h3 className="font-bold text-2xl text-white group-hover:text-[#F5F5F7] transition-colors">
                      {st.title}
                    </h3>

                    <p className="mt-4 text-xs sm:text-sm text-[#9898A6] leading-relaxed">
                      {st.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.06]">
                    <div className="flex items-start gap-2 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{st.highlight}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section id="pricing" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#050507] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-white text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
              <span>Transparent Investment</span>
            </div>

            <h2 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-6xl md:text-7xl leading-tight">
              Predictable Pricing That Scales With <br />
              <span className="text-glow-purple text-gradient-purple-blue">
                Your Sales Pipeline
              </span>
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#9898A6] leading-relaxed">
              Every plan includes our complete grounded retrieval engine, visual launcher designer, and 14-day free evaluation trial.
            </p>

            <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly" ? "bg-[#1E1E2A] text-white shadow-sm" : "text-[#9898A6] hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-gradient-to-r from-[#963DFF] to-[#7928CA] text-white shadow-sm shadow-[#963DFF]/30"
                    : "text-[#9898A6] hover:text-white"
                }`}
              >
                <span>Annual (Save 20%)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                  Special
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((pl, idx) => {
              const price = billingCycle === "annual" ? pl.priceAnnual : pl.priceMonthly;
              return (
                <div
                  key={idx}
                  className={`relative p-8 sm:p-10 rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                    pl.popular
                      ? "bg-[#12121A]/90 border-2 border-[#963DFF] shadow-[0_0_40px_rgba(150,61,255,0.35)] lg:-translate-y-2"
                      : "glass-panel glass-panel-hover"
                  }`}
                >
                  {pl.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#963DFF] to-[#55A9FF] text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                      Most Popular Choice
                    </div>
                  )}

                  <div>
                    <div className="mb-6">
                      <h3 className="font-bold text-2xl text-white">{pl.name}</h3>
                      <p className="text-xs text-[#C28AFF] font-medium mt-1">{pl.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-white/[0.08]">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        ${price}
                      </span>
                      <span className="text-xs text-[#9898A6]">
                        / month {billingCycle === "annual" ? "billed annually" : ""}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed mb-6">
                      {pl.description}
                    </p>

                    <div className="space-y-3 mb-8">
                      {pl.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#D9D9E2]">
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={isAuthenticated ? "/billing" : "/register"}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      pl.popular ? "btn-primary-gradient text-white shadow-lg" : "btn-secondary-glass"
                    }`}
                  >
                    <span>{pl.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative bg-[#050507] border-t border-white/[0.08] text-white pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 28L18 8H26L16 28H8Z" fill="#FFFFFF" />
                  <path d="M17 28L27 8H33L23 28H17Z" fill="url(#footer-logo-grad-next)" />
                  <defs>
                    <linearGradient id="footer-logo-grad-next" x1="17" y1="8" x2="33" y2="28" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#C28AFF" />
                      <stop offset="1" stopColor="#55A9FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-[0.14em] text-white uppercase leading-none">
                    EMPEROR
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.24em] text-[#9898A6] uppercase mt-1 leading-none">
                    SMART SOLUTIONS
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#9898A6] max-w-sm leading-relaxed">
                Autonomous AI sales assistants and commercial intelligence for modern enterprises.
                Answering every customer question, qualifying pipeline opportunities, and accelerating revenue 24/7.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational (99.98% SLA)</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white block">Verticals</span>
              <ul className="space-y-2.5 text-xs text-[#9898A6]">
                <li><a href="#industries" className="hover:text-white transition-colors">Real Estate & Developers</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Healthcare & Clinical</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Education & Admissions</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Luxury Hospitality & Resorts</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">High-Ticket Retail & E-com</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white block">Platform</span>
              <ul className="space-y-2.5 text-xs text-[#9898A6]">
                <li><a href="#benefits" className="hover:text-white transition-colors">Vector Knowledge Base</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">19 Launcher Animations</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Automated CRM Scoring</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">One-Line Script Embed</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Matrix</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white block">Governance & Trust</span>
              <ul className="space-y-2.5 text-xs text-[#9898A6]">
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Multi-Tenant Isolation</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Data Training Leakage</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SOC 2 Type II Certified</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> GDPR & CCPA Compliant</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bank-Grade Encryption</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9898A6]">
            <p>© {new Date().getFullYear()} Emperor Smart Solutions. All rights reserved. Emperor Nexus AI.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security Whitepaper</a>
            </div>
          </div>
        </div>
      </footer>

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
