"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Check,
  ArrowRight,
  Sparkles,
  FileSearch,
  MessageSquareMore,
  UserCheck,
  Code2,
  ShieldCheck,
  CreditCard,
  Zap,
  Clock,
  Globe,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const PRICING_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    number: "01",
    tagline: "Flexible month-to-month deployment",
    price: "₹999",
    priceINR: 999,
    period: "/ month",
    effectiveMonthly: null,
    savings: null,
    popular: false,
    accent: "#6366F1",
    features: [
      "1 workspace account & autonomous AI chatbot",
      "Website crawler & PDF/Doc RAG knowledge base",
      "Live conversation inbox + 1-click human takeover",
      "Automated inbound lead qualification CRM",
      "1-line website widget + Meta WhatsApp Cloud API",
      "Sub-second streaming AI & Razorpay UPI/Card billing",
    ],
    ctaText: "Start Monthly Plan",
  },
  {
    id: "annual",
    name: "Annual VIP",
    number: "02",
    tagline: "Full-year commercial license with maximum savings",
    price: "₹8,999",
    priceINR: 8999,
    period: "/ year",
    effectiveMonthly: "Effective ₹749/mo · 25% Off",
    savings: "Save ₹2,989 vs. twelve monthly payments",
    popular: true,
    accent: "#4F46E5",
    features: [
      "1 workspace account & autonomous AI chatbot",
      "Website crawler & PDF/Doc RAG knowledge base",
      "Live conversation inbox + 1-click human takeover",
      "Automated inbound lead qualification CRM",
      "1-line website widget + Meta WhatsApp Cloud API",
      "Priority RAG onboarding & 12-month price lock",
    ],
    ctaText: "Launch Annual VIP",
  },
  {
    id: "six-months",
    name: "Six Months",
    number: "03",
    tagline: "Commercial half-year rollout for growing teams",
    price: "₹5,999",
    priceINR: 5999,
    period: "/ 6 months",
    effectiveMonthly: null,
    savings: "Uninterrupted 6-month commercial access",
    popular: false,
    accent: "#818CF8",
    features: [
      "1 workspace account & autonomous AI chatbot",
      "Website crawler & PDF/Doc RAG knowledge base",
      "Live conversation inbox + 1-click human takeover",
      "Automated inbound lead qualification CRM",
      "1-line website widget + Meta WhatsApp Cloud API",
      "Priority onboarding & knowledge base setup",
    ],
    ctaText: "Start 6-Month Plan",
  },
];

// Preserved export compatibility
export const CARD_THEMES = {
  monthly: { accent: "#6366F1" },
  "six-months": { accent: "#818CF8" },
  annual: { accent: "#4F46E5" },
};

function formatInr(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "₹0";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

function formatPeriodLabel(plan) {
  if (plan.period) return plan.period;
  const raw = String(plan.periodLabel || "").trim();
  if (raw) {
    return raw.replace(/^per\s+/i, "/ ");
  }
  if (plan.interval === "yearly") return "/ year";
  if (Number(plan.intervalCount) > 1) return `/ ${plan.intervalCount} months`;
  return "/ month";
}

/**
 * Transform live Super Admin plans (/api/billing/plans) into display cards
 * with automatic savings calculation and center-stage Annual hero placement.
 */
function mapAdminPlansToDisplay(rawPlans) {
  if (!Array.isArray(rawPlans) || rawPlans.length === 0) return PRICING_PLANS;

  const monthlyPlan = rawPlans.find(
    (p) =>
      p.id === "monthly" ||
      (p.interval === "monthly" && Number(p.intervalCount || 1) === 1)
  );
  const monthlyPrice = Number(monthlyPlan?.priceINR || 0);

  // Order so Monthly is left, Annual is center hero, Six Months is right, then any custom plans
  const rank = (p) => {
    const id = String(p.id || "").toLowerCase();
    if (id === "monthly" || (p.interval === "monthly" && Number(p.intervalCount || 1) === 1)) return 0;
    if (id === "annual" || p.interval === "yearly") return 1;
    if (id === "six-months" || (p.interval === "monthly" && Number(p.intervalCount) === 6)) return 2;
    return 3;
  };

  const sorted = [...rawPlans].sort((a, b) => rank(a) - rank(b));

  return sorted.map((p, idx) => {
    const id = String(p.id || `plan-${idx + 1}`);
    const isAnnual = id.toLowerCase() === "annual" || p.interval === "yearly";
    const priceINR = Number(p.priceINR || 0);

    let effectiveMonthly = null;
    let savings = null;
    let badgeText = null;

    if (isAnnual && monthlyPrice > 0 && priceINR > 0 && monthlyPrice * 12 > priceINR) {
      const savedAmount = Math.round(monthlyPrice * 12 - priceINR);
      const effMonthly = Math.round(priceINR / 12);
      const pctOff = Math.round((savedAmount / (monthlyPrice * 12)) * 100);
      effectiveMonthly = `Effective ${formatInr(effMonthly)}/mo · ${pctOff}% Off`;
      savings = `Save ${formatInr(savedAmount)} vs. twelve monthly payments`;
      badgeText = `Most Popular · Save ${formatInr(savedAmount)}`;
    } else if (isAnnual) {
      badgeText = "Most Popular · Best Value";
    } else if (Number(p.trialDays) > 0) {
      savings = `${p.trialDays}-day free trial included`;
    }

    const fallbackMatch = PRICING_PLANS.find((fp) => fp.id === id.toLowerCase());
    const features =
      Array.isArray(p.features) && p.features.length > 0
        ? p.features
        : fallbackMatch?.features || PRICING_PLANS[0].features;

    return {
      id,
      name: p.name || fallbackMatch?.name || "Plan",
      number: String(idx + 1).padStart(2, "0"),
      tagline: p.description || fallbackMatch?.tagline || "Full autonomous AI chatbot access",
      price: formatInr(priceINR),
      priceINR,
      period: formatPeriodLabel(p),
      effectiveMonthly,
      savings,
      badgeText,
      popular: isAnnual,
      accent: isAnnual ? "#4F46E5" : "#6366F1",
      features,
      ctaText: isAnnual ? `Launch ${p.name || "Annual"}` : `Start ${p.name || "Plan"}`,
    };
  });
}

const BENTO_CAPABILITIES = [
  {
    id: "rag",
    icon: FileSearch,
    iconTint: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
    title: "RAG Knowledge Engine",
    description:
      "Crawl your entire website and upload PDFs, brochures, or pricing sheets with instant vector retrieval.",
    preview: (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-950/75 border border-white/[0.06] px-3.5 py-2.5 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="font-mono text-slate-300 truncate">docs/pricing-2026.pdf</span>
        </div>
        <span className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
          1,280 vectors
        </span>
      </div>
    ),
  },
  {
    id: "inbox",
    icon: MessageSquareMore,
    iconTint: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    title: "Live Inbox & Human Takeover",
    description:
      "Watch every active visitor conversation stream live and step in with 1-click human agent handoff.",
    preview: (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-950/75 border border-white/[0.06] px-3.5 py-2.5 text-[11px]">
        <span className="text-slate-300 truncate">“Can I book a bulk enterprise demo?”</span>
        <span className="shrink-0 inline-flex items-center gap-1.5 font-semibold text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Handoff
        </span>
      </div>
    ),
  },
  {
    id: "crm",
    icon: UserCheck,
    iconTint: "text-sky-400 bg-sky-500/15 border-sky-500/30",
    title: "Inbound Lead CRM",
    description:
      "Automatically capture visitor name, verified phone, email, and buyer intent straight from chat turns.",
    preview: (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-950/75 border border-white/[0.06] px-3.5 py-2.5 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-indigo-600/80 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            PS
          </span>
          <span className="text-slate-200 font-medium truncate">Priya S. · +91 98••••21</span>
        </div>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
          High Intent
        </span>
      </div>
    ),
  },
  {
    id: "deploy",
    icon: Code2,
    iconTint: "text-violet-400 bg-violet-500/15 border-violet-500/30",
    title: "Omnichannel Deploy",
    description:
      "Embed on any website in 2 minutes with a single script tag and connect Meta WhatsApp Cloud API.",
    preview: (
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-slate-950/75 border border-white/[0.06] px-3.5 py-2.5 text-[11px]">
        <code className="font-mono text-indigo-300 truncate">
          &lt;script src=&quot;/widget.js&quot; async /&gt;
        </code>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
          Web + WhatsApp
        </span>
      </div>
    ),
  },
];

const TRUST_ITEMS = [
  { icon: Clock, label: "7-Day Trial Ready" },
  { icon: CreditCard, label: "Secured by Razorpay UPI & Cards" },
  { icon: Zap, label: "2-Minute Zero-Code Embed" },
  { icon: ShieldCheck, label: "Multi-Tenant RBAC Security" },
  { icon: Globe, label: "Cancel Anytime" },
];

/**
 * Interactive Obsidian Glass Card with 60fps cursor-tracking spotlight
 */
function SpotlightCard({ children, className = "", featured = false }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-1 ${className}`}
    >
      {/* Animated Conic Border Beam on Flagship Annual VIP Card */}
      {featured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1.5px] rounded-[17px] overflow-hidden"
        >
          <div
            className="nexus-border-beam absolute top-1/2 left-1/2 w-[220%] aspect-square"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 210deg, #6366F1 265deg, #A78BFA 310deg, #38BDF8 340deg, transparent 360deg)",
            }}
          />
        </div>
      )}

      {/* Main Obsidian Surface */}
      <div
        className={`relative h-full rounded-2xl overflow-hidden backdrop-blur-xl transition-colors duration-300 ${
          featured
            ? "bg-[#0C1222]/95 border border-indigo-400/35 shadow-[0_24px_70px_-15px_rgba(79,70,229,0.42)]"
            : "bg-[#0B0F1A]/90 border border-white/[0.08] hover:border-indigo-400/30 shadow-[0_18px_50px_-15px_rgba(0,0,0,0.75)]"
        }`}
      >
        {/* Cursor-tracking radial spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: featured
              ? "radial-gradient(420px circle at var(--mx, 50%) var(--my, 30%), rgba(99, 102, 241, 0.20), transparent 65%)"
              : "radial-gradient(360px circle at var(--mx, 50%) var(--my, 30%), rgba(129, 140, 248, 0.13), transparent 65%)",
          }}
        />
        <div className="relative z-10 h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}

export default function PricingSection({ isAuthenticated = false }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsGridRef = useRef(null);
  const bentoGridRef = useRef(null);
  const trustRef = useRef(null);
  const [plans, setPlans] = useState(PRICING_PLANS);
  const [focusedPlanId, setFocusedPlanId] = useState("annual");

  // Fetch live active pricing plans managed in Super Admin (/admin/plans)
  useEffect(() => {
    let active = true;
    fetch("/api/billing/plans", {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success || !Array.isArray(data.plans) || data.plans.length === 0) {
          return;
        }
        const mapped = mapAdminPlansToDisplay(data.plans);
        setPlans(mapped);
        const featured = mapped.find((p) => p.popular) || mapped[0];
        if (featured?.id) {
          setFocusedPlanId(featured.id);
        }
      })
      .catch(() => {
        // Keep clean fallback plans if offline
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (cardsGridRef.current) {
        gsap.fromTo(
          cardsGridRef.current.children,
          { opacity: 0, y: 36, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cardsGridRef.current,
              start: "top 82%",
              once: true,
            },
          }
        );
      }

      if (bentoGridRef.current) {
        gsap.fromTo(
          bentoGridRef.current.children,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bentoGridRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (trustRef.current) {
        gsap.fromTo(
          trustRef.current,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: trustRef.current,
              start: "top 92%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative w-full bg-[#05070E] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-white/[0.06]"
    >
      {/* Ambient Obsidian Aurora & Architectural Dot Matrix */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148, 163, 184, 0.10) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[920px] h-[460px] rounded-full blur-[130px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(79,70,229,0.65) 0%, rgba(124,58,237,0.32) 45%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ================= SECTION HEADER ================= */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-[11px] font-semibold uppercase tracking-[0.14em] mb-5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transparent Commercial Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight leading-[1.08] text-white">
            Scale Autonomous Sales.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-sky-300">
              Predictable Pricing.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Deploy 24/7 AI Sales &amp; Support trained on your website, PDFs, and CRM in under 3
            minutes. Zero hidden token fees—every plan includes the complete platform.
          </p>

          {/* Interactive Quick-Focus Duration Switcher (Synced to Live Admin Plans) */}
          <div className="mt-7 inline-flex flex-wrap items-center justify-center p-1 rounded-full bg-slate-900/90 border border-white/[0.08] shadow-inner">
            {plans.map((tab) => {
              const active = focusedPlanId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFocusedPlanId(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-[0_4px_16px_rgba(79,70,229,0.45)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.popular && tab.effectiveMonthly ? `${tab.name} · Best Value` : tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= PART 1: 3-COLUMN OBSIDIAN SPOTLIGHT CARDS ================= */}
        <div
          ref={cardsGridRef}
          className={`grid grid-cols-1 gap-6 lg:gap-7 items-stretch ${
            plans.length === 2
              ? "lg:grid-cols-2 max-w-4xl mx-auto"
              : plans.length === 1
              ? "max-w-md mx-auto"
              : "lg:grid-cols-3"
          }`}
        >
          {plans.map((plan) => {
            const isAnnual = Boolean(plan.popular);
            const isFocused = focusedPlanId === plan.id;
            const checkoutHref = isAuthenticated
              ? `/billing?plan=${encodeURIComponent(plan.id)}&checkout=true`
              : `/login?plan=${encodeURIComponent(plan.id)}`;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setFocusedPlanId(plan.id)}
                className={`flex flex-col transition-all duration-300 ${
                  isAnnual ? "lg:-translate-y-3 z-20" : "z-10"
                } ${
                  !isAnnual && isFocused ? "ring-1 ring-indigo-500/40 rounded-2xl" : ""
                }`}
              >
                <SpotlightCard featured={isAnnual} className="h-full">
                  <div className="p-6 sm:p-7 lg:p-8 flex flex-col h-full">
                    {/* Top Row: Plan Index + Badge */}
                    <div className="flex items-center justify-between gap-2 mb-5 min-h-[26px]">
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-slate-400">
                        {plan.number} / {plan.name}
                      </span>
                      {isAnnual && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(99,102,241,0.35)]">
                          {plan.badgeText || "Most Popular · Best Value"}
                        </span>
                      )}
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">{plan.tagline}</p>

                    {/* Price Block */}
                    <div className="mt-6 pb-6 border-b border-white/[0.08]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-[2.75rem] font-extrabold tracking-tight text-white tabular-nums">
                          {plan.price}
                        </span>
                        <span className="text-sm font-medium text-slate-400">{plan.period}</span>
                      </div>

                      <div className="mt-2.5 min-h-[24px] flex items-center">
                        {plan.effectiveMonthly ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                            {plan.effectiveMonthly}
                          </span>
                        ) : plan.savings ? (
                          <span className="text-xs font-medium text-indigo-300/90">
                            {plan.savings}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            No long-term lock-in · Cancel anytime
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Real Feature Checklist */}
                    <ul className="mt-6 space-y-3 flex-1">
                      {plan.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-200 leading-snug"
                        >
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isAnnual
                                ? "bg-indigo-500/25 text-indigo-300 border border-indigo-400/40"
                                : "bg-white/[0.06] text-slate-300 border border-white/[0.10]"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-7 pt-2">
                      <Link
                        href={checkoutHref}
                        className={`w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 group/btn ${
                          isAnnual
                            ? "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-[0_8px_28px_-4px_rgba(79,70,229,0.65)]"
                            : "bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.16] text-white border border-white/[0.10] hover:border-white/[0.20]"
                        }`}
                      >
                        <span>{plan.ctaText}</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            );
          })}
        </div>

        {/* ================= PART 2: LIVE 2x2 PRODUCT BENTO CAPABILITY SHOWCASE ================= */}
        <div className="mt-16 sm:mt-20">
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-indigo-300/90">
              Included Across Every Plan
            </span>
            <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
              Everything You Need to Automate Sales &amp; Support
            </h3>
          </div>

          <div
            ref={bentoGridRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {BENTO_CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <SpotlightCard key={cap.id}>
                  <div className="p-5 sm:p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${cap.iconTint}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          {cap.title}
                        </h4>
                      </div>
                      <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                    {cap.preview}
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* ================= PART 3: ENTERPRISE TRUST & GUARANTEE STRIP ================= */}
        <div ref={trustRef} className="mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 px-6 py-3.5 rounded-2xl bg-slate-900/75 border border-white/[0.08] backdrop-blur-md">
            {TRUST_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-300"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
