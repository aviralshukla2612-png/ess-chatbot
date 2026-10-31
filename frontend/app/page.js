"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Terminal,
  Globe2,
  Workflow,
  Radio,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import SmoothScrollProvider from "@/components/landing/SmoothScrollProvider";
import KineticMarquee from "@/components/landing/KineticMarquee";
import MagneticButton from "@/components/landing/MagneticButton";
import BotPreviewWidget from "@/components/bots/BotPreviewWidget";

// Dynamic import for Three.js canvas to ensure clean SSR hydration
const ThreeHeroCanvas = dynamic(
  () => import("@/components/landing/ThreeHeroCanvas"),
  { ssr: false }
);

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const bentoRef = useRef(null);

  useEffect(() => {
    // Check Auth State
    fetch("/api/auth/me", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) setIsAuthenticated(true);
      })
      .catch(() => setIsAuthenticated(false));

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // GSAP Hero Entry Animation
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gsap-hero-fade",
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: "power4.out",
          delay: 0.15,
        }
      );

      gsap.fromTo(
        ".gsap-bento-card",
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 80%",
          },
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const marqueeItemsRow1 = [
    "WHATSAPP CLOUD API",
    "CUSTOM EMBED WIDGET",
    "INSTANT VECTOR SEARCH",
    "MULTI-TENANT ISOLATION",
    "ZERO-DISCOUNT GUARDRAILS",
    "ENTERPRISE SLA 99.99%",
  ];

  const marqueeItemsRow2 = [
    "INDIAN RUPEE (INR) PRICING",
    "LEAD QUALIFICATION PIPELINE",
    "SUB-SECOND LATENCY",
    "CUSTOM PROMPT ORCHESTRATION",
    "REAL-TIME VISITOR TELEMETRY",
  ];

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-[#D2FF00] selection:text-black overflow-x-hidden norris-selection font-sans">
        
        {/* TOP TELEMETRY BAR & NAVIGATION */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.07]">
          <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
            
            {/* Brand Logo & Telemetry Indicator */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden p-1.5 transition-transform group-hover:scale-105">
                  <img src="/e-logoicon.webp" alt="NexusAI" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight text-base uppercase text-white font-mono">
                      NEXUS<span className="text-[#D2FF00]">AI</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#D2FF00]/10 text-[#D2FF00] border border-[#D2FF00]/30 tracking-wider">
                      V3.2 PROTOCOL
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Middle Live Telemetry Pill */}
            <div className="hidden md:flex items-center gap-6 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-white/10 text-[11px] font-mono text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D2FF00] animate-ping" />
                <span className="text-white font-medium">CORE TELEMETRY: ACTIVE</span>
              </div>
              <span className="text-neutral-700">|</span>
              <div>LATENCY: <span className="text-[#D2FF00]">114ms</span></div>
              <span className="text-neutral-700">|</span>
              <div>ACCURACY: <span className="text-white">99.8%</span></div>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <MagneticButton href="/dashboard" variant="primary">
                  Launch Console
                </MagneticButton>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-[#D2FF00] transition-colors hidden sm:inline-block"
                  >
                    Sign In
                  </Link>
                  <MagneticButton href="/login" variant="primary">
                    Get Started
                  </MagneticButton>
                </>
              )}
            </div>
          </div>
        </header>

        {/* HERO SECTION WITH THREE.JS 3D CANVAS */}
        <section
          ref={heroRef}
          className="relative min-h-screen pt-28 pb-16 px-6 max-w-[1440px] mx-auto flex flex-col justify-center"
        >
          {/* Subtle Cyber Grid Background Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Column: Bold Condensed Typography */}
            <div className="lg:col-span-7 space-y-6 pt-6">
              
              {/* Eyebrow Label */}
              <div className="gsap-hero-fade inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-[#D2FF00]/30 text-[#D2FF00] text-[11px] font-mono tracking-widest uppercase">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Next-Gen Enterprise Autonomous AI Platform</span>
              </div>

              {/* Massive Condensed Display Title (Lando Norris Aesthetic) */}
              <h1
                ref={titleRef}
                className="gsap-hero-fade text-5xl sm:text-7xl xl:text-8xl font-black uppercase tracking-tight text-white leading-[0.92] select-none"
              >
                SPEED. <br />
                PRECISION. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D2FF00] via-[#ffffff] to-[#b68a55]">
                  AUTONOMY.
                </span>
              </h1>

              {/* Description Body */}
              <p className="gsap-hero-fade text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed font-normal">
                Deploy production-grade conversational AI trained on your internal documentation, enterprise ERP, and product catalog. Closes leads 24/7 with zero human intervention.
              </p>

              {/* CTAs */}
              <div className="gsap-hero-fade flex flex-wrap items-center gap-4 pt-3">
                <MagneticButton href={isAuthenticated ? "/dashboard" : "/login"} variant="primary">
                  Deploy Your Bot
                </MagneticButton>
                
                <MagneticButton href="#demo" variant="outline">
                  Test Live Engine
                </MagneticButton>
              </div>

              {/* Micro Telemetry Metrics */}
              <div className="gsap-hero-fade grid grid-cols-3 gap-4 pt-6 border-t border-neutral-900 max-w-lg">
                <div>
                  <div className="text-2xl font-mono font-black text-white">0.12s</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Avg Latency</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-black text-[#D2FF00]">99.8%</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Response Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-black text-[#b68a55]">24/7</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Lead Capture</div>
                </div>
              </div>
            </div>

            {/* Right Column: Three.js Interactive 3D Neural Core */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Glowing Radial Halo */}
              <div className="absolute w-[360px] h-[360px] rounded-full bg-[#D2FF00]/10 blur-[100px] pointer-events-none" />
              <div className="absolute w-[280px] h-[280px] rounded-full bg-[#b68a55]/15 blur-[80px] pointer-events-none" />

              {/* 3D WebGL Canvas */}
              <div className="w-full relative z-10 cursor-grab active:cursor-grabbing">
                <ThreeHeroCanvas />
                
                {/* Floating 3D Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-black/75 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D2FF00] animate-pulse" />
                  <div className="text-[11px] font-mono text-neutral-300">
                    <span className="text-[#D2FF00] font-bold">DRAG OR MOVE</span> TO ROTATE 3D CORE
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* KINETIC MARQUEE RUNNERS (DUAL DIRECTION) */}
        <div className="space-y-1">
          <KineticMarquee items={marqueeItemsRow1} direction="left" speed="32s" />
          <KineticMarquee items={marqueeItemsRow2} direction="right" speed="28s" />
        </div>

        {/* INTERACTIVE LIVE PLAYGROUND SECTION */}
        <section id="demo" className="py-24 px-6 max-w-[1400px] mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-900 pb-8">
            <div>
              <span className="text-[11px] font-mono text-[#D2FF00] uppercase tracking-widest font-bold">
                STAGE 02 // REAL-TIME BENCHMARK
              </span>
              <h2 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight mt-2">
                TEST THE ENGINE LIVE
              </h2>
            </div>
            <p className="text-sm text-neutral-400 max-w-md font-normal">
              Interact with the official Emperor Sales Executive below. Ask complex questions about ERP pricing, web apps, or discount approvals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0c0c0c] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            
            {/* Left Specs */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#D2FF00]/10 border border-[#D2FF00]/30 text-[#D2FF00] text-xs font-mono uppercase">
                <Terminal className="w-3.5 h-3.5" />
                <span>Active Model: Hybrid RAG v3</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                Zero Hallucinations. Guaranteed Citations.
              </h3>

              <div className="space-y-4 text-xs font-mono text-neutral-300">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/60 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#D2FF00] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block uppercase">Document Grounding:</strong>
                    Synthesizes PDFs, Word files, URLs, and custom FAQs without making up answers.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/60 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#D2FF00] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block uppercase">Autonomous Lead Qualification:</strong>
                    Captures name, verified email, and phone directly into the CRM pipeline.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/60 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#D2FF00] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block uppercase">Guaranteed Policy Defense:</strong>
                    Strict guardrails prevent unauthorised discounts and protect brand reputation.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <MagneticButton href={isAuthenticated ? "/dashboard" : "/login"} variant="primary">
                  Deploy This Bot To Your Site
                </MagneticButton>
              </div>
            </div>

            {/* Right Widget Preview */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <BotPreviewWidget
                  botId="bot_1791618269632"
                  botName="Emperor AI Assistant"
                  avatar="⚡"
                  primaryColor="#D2FF00"
                  welcomeMessage="Welcome to Emperor Smart Solutions! Ask me about ERP pricing, web apps, or project timelines."
                  placeholderText="Ask 'ERP pricing' or 'discount policy'..."
                  showLeadForm={true}
                />
              </div>
            </div>

          </div>
        </section>

        {/* HIGH-OCTANE BENTO GRID (NORRIS MOTORSPORT STYLE) */}
        <section ref={bentoRef} className="py-20 px-6 max-w-[1400px] mx-auto">
          <div className="mb-12">
            <span className="text-[11px] font-mono text-[#D2FF00] uppercase tracking-widest font-bold">
              STAGE 03 // ARCHITECTURAL TELEMETRY
            </span>
            <h2 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight mt-2">
              BUILT FOR MAXIMUM VELOCITY
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1 */}
            <div className="gsap-bento-card p-8 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] hover:border-[#D2FF00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-[#D2FF00] group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight mt-6">
                Vector RAG Pipeline
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-mono">
                Sub-second pgvector cosine indexing. Transforms entire internal manuals into instantaneous conversational memory.
              </p>
              <div className="mt-6 text-[10px] font-mono text-[#D2FF00] uppercase tracking-widest">
                [ 01 // ACCELERATED SEARCH ]
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="gsap-bento-card p-8 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] hover:border-[#D2FF00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-[#b68a55] group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight mt-6">
                Policy Guardrails
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-mono">
                Hard system-prompt firewalls prevent prompt injection, unauthorized price slashes, and confidential IP leaks.
              </p>
              <div className="mt-6 text-[10px] font-mono text-[#b68a55] uppercase tracking-widest">
                [ 02 // ENTERPRISE SECURE ]
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="gsap-bento-card p-8 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] hover:border-[#D2FF00]/50 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-[#D2FF00] group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight mt-6">
                Omnichannel Deploy
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-mono">
                One-click script tag for any website, WhatsApp Business Cloud integration, and custom REST webhook emitters.
              </p>
              <div className="mt-6 text-[10px] font-mono text-[#D2FF00] uppercase tracking-widest">
                [ 03 // INSTANT CONNECT ]
              </div>
            </div>

          </div>
        </section>

        {/* BOTTOM HIGH-ENERGY CALL TO ACTION */}
        <section className="py-24 px-6 border-t border-neutral-900 relative overflow-hidden bg-black text-center">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <span className="text-[11px] font-mono text-[#D2FF00] uppercase tracking-widest font-bold">
              READY TO UPGRADE YOUR PIPELINE?
            </span>
            <h2 className="text-5xl sm:text-7xl font-black uppercase text-white tracking-tight leading-tight">
              DEPLOY THE BOT. <br />
              <span className="text-[#D2FF00]">DOMINATE CONVERSIONS.</span>
            </h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto">
              Join leading organizations automating thousands of visitor interactions every day. Setup takes under 5 minutes.
            </p>
            <div className="pt-4 flex justify-center">
              <MagneticButton href={isAuthenticated ? "/dashboard" : "/login"} variant="primary">
                Launch Organization Console
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/[0.06] bg-[#050505] py-10 px-6 text-xs font-mono text-neutral-500">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-neutral-400">
              <span className="text-white font-bold">NEXUS AI</span> &copy; 2026 EMPEROR SMART SOLUTIONS. ALL RIGHTS RESERVED.
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[#D2FF00]">INDIA REGION // IST HIGH AVAILABILITY</span>
              <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY</Link>
              <Link href="/terms" className="hover:text-white transition-colors">TERMS</Link>
            </div>
          </div>
        </footer>

      </div>
    </SmoothScrollProvider>
  );
}
