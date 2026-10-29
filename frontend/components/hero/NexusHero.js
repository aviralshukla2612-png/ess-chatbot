"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Menu,
  X,
  Cpu,
  Eye,
  Shield,
  Zap,
  Target,
  Activity,
  Radio,
} from "lucide-react";

export default function NexusHero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSpec, setActiveSpec] = useState("neural");
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const heroStageRef = useRef(null);

  const scrollToDemo = (e) => {
    e.preventDefault();
    const demoEl = document.getElementById("demo");
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleMouseMove = (e) => {
    if (!heroStageRef.current) return;
    const rect = heroStageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setMouseOffset({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setIsHovered(false);
    setActiveHotspot(null);
  };

  // Hotspots on the robot chassis (coordinates relative to the 1024x571 image)
  const HOTSPOTS = [
    {
      id: "visor",
      x: "50%",
      y: "28%",
      label: "AI VISION VISOR",
      desc: "Dual Matrix LED Array with 4K 120fps Depth Perception",
      code: "VISOR-SYS // V2.4",
    },
    {
      id: "neck",
      x: "50%",
      y: "38%",
      label: "HYDRAULIC NECK",
      desc: "6-Axis High-Torque Articulated Titanium Actuators",
      code: "PSTN-NK // 980Nm",
    },
    {
      id: "chest",
      x: "50%",
      y: "48%",
      label: "CARBON CORE ARMOR",
      desc: "Impact-Resistant Carbon Fiber & Titanium Composite",
      code: "ARMOR-PLT // LVL-4",
    },
    {
      id: "arm",
      x: "33%",
      y: "65%",
      label: "BIONIC MANIPULATOR",
      desc: "Sub-millimeter Precision Cybernetic Hand with Haptic Feedback",
      code: "ACT-L // 12-DOF",
    },
  ];

  return (
    <div className="relative bg-black text-white overflow-hidden min-h-screen flex flex-col justify-between selection:bg-white selection:text-black">
      {/* 1. TOP NAVBAR */}
      <header className="border-b border-neutral-900/80 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-sm group-hover:border-neutral-600 transition-colors">
              <span className="font-extrabold text-lg text-white">N</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Nexus<span className="text-neutral-400">AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#demo" onClick={scrollToDemo} className="hover:text-white transition-colors">
              Resources
            </a>
          </nav>

          {/* Authentication & Action Buttons */}
          <div className="hidden sm:flex items-center gap-3.5">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900/60 border border-transparent hover:border-neutral-800 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/bots/create"
              className="text-xs font-bold px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 active:scale-[0.98] text-neutral-950 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-6 py-5 bg-neutral-950/95 border-b border-neutral-900 space-y-3 text-xs font-medium animate-fade-in">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-neutral-300 hover:text-white"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-neutral-300 hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#demo"
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToDemo(e);
              }}
              className="block py-2 text-neutral-300 hover:text-white"
            >
              Live Demo
            </a>
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <Link href="/login" className="text-neutral-300 hover:text-white font-semibold">
                Sign In
              </Link>
              <Link
                href="/bots/create"
                className="px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold"
              >
                Get Started →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. CINEMATIC HERO COMPOSITION (Matter ROBO Layout with User's Exact Matte Black Robot) */}
      <section
        ref={heroStageRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 flex flex-col justify-between px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full pt-8 pb-4 overflow-hidden"
      >
        {/* Subtle Framer-Style Vertical Grid Guidelines */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-4 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 z-0 border-l border-r border-white/[0.04]">
          <div className="border-r border-white/[0.04] h-full" />
          <div className="border-r border-white/[0.04] h-full" />
          <div className="border-r border-white/[0.04] h-full" />
          <div className="h-full" />
        </div>

        {/* TOP ROW: Top-Left Headline & Top-Right Paragraph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-20 pt-4 pb-2">
          {/* Top-Left Headline */}
          <div className="lg:col-span-7 text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] xl:text-[52px] 2xl:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              <span className="block whitespace-nowrap">Your Intelligent Home</span>
              <span className="block">Companion</span>
            </h1>
          </div>

          {/* Top-Right Paragraph */}
          <div className="lg:col-span-5 text-left lg:pt-3">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-lg">
              Built with next-gen adaptive intelligence and precision engineering, Robo learns
              your routines, anticipates your needs, and works seamlessly with your smart ecosystem.
            </p>
          </div>
        </div>

        {/* CENTER STAGE: Giant Background "ROBO" Typography + Centered Photorealistic Robot with Mouse Hover Tracking */}
        <div className="relative flex-1 w-full flex items-center justify-center min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] my-auto">
          {/* Giant Background Typography: "ROBO" across the center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <span
              className="text-[11rem] sm:text-[16rem] md:text-[22rem] lg:text-[27rem] font-black tracking-tighter text-white/[0.05] font-mono leading-none select-none transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(${-mouseOffset.x * 14}px) translateY(${-mouseOffset.y * 8}px)`,
              }}
            >
              ROBO
            </span>
          </div>

          {/* Dynamic Ambient Chrome/White Specular Glow behind Robot */}
          <div
            className="absolute w-[320px] sm:w-[460px] lg:w-[580px] h-[320px] sm:h-[460px] lg:h-[580px] rounded-full blur-[100px] sm:blur-[140px] pointer-events-none transition-transform duration-700 ease-out"
            style={{
              background: isHovered
                ? "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(148, 163, 184, 0.08) 40%, rgba(0, 0, 0, 0) 70%)"
                : "radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(71, 85, 105, 0.04) 40%, rgba(0, 0, 0, 0) 70%)",
              transform: `translate(${mouseOffset.x * 24}px, ${mouseOffset.y * 24}px)`,
            }}
          />

          {/* Centered Robot Stage with 3D Parallax Tilt & Mouse Interaction */}
          <div
            className="relative z-10 w-full max-w-4xl flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(1200px) rotateY(${mouseOffset.x * 10}deg) rotateX(${-mouseOffset.y * 8}deg) scale(${isHovered ? 1.02 : 1})`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* The Exact Robot Image from Reference */}
            <div className="relative inline-block select-none">
              <img
                src="/black_robo_clean.png"
                alt="NexusAI Matte Black Humanoid Robot"
                className="h-[440px] sm:h-[500px] lg:h-[560px] xl:h-[620px] w-auto max-w-full object-contain pointer-events-auto cursor-crosshair drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
                loading="eager"
                decoding="async"
              />

              {/* DYNAMIC EYE TRACKING OVERLAY: White digital LED grid eyes track the user's cursor */}
              {/* Left Eye Gaze */}
              <div
                className="absolute pointer-events-none transition-all duration-150 ease-out"
                style={{
                  left: `calc(47.3% + ${mouseOffset.x * 5}px)`,
                  top: `calc(30.4% + ${mouseOffset.y * 3.5}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-white shadow-[0_0_12px_#ffffff,0_0_24px_rgba(255,255,255,0.9)] transition-all duration-300 ${
                    isHovered ? "scale-125 opacity-100" : "scale-100 opacity-80"
                  }`}
                  style={{
                    clipPath: "polygon(30% 0%, 70% 0%, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0% 70%, 0% 30%, 30% 30%)",
                  }}
                />
              </div>

              {/* Right Eye Gaze */}
              <div
                className="absolute pointer-events-none transition-all duration-150 ease-out"
                style={{
                  left: `calc(52.5% + ${mouseOffset.x * 5}px)`,
                  top: `calc(29.9% + ${mouseOffset.y * 3.5}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-white shadow-[0_0_12px_#ffffff,0_0_24px_rgba(255,255,255,0.9)] transition-all duration-300 ${
                    isHovered ? "scale-125 opacity-100" : "scale-100 opacity-80"
                  }`}
                  style={{
                    clipPath: "polygon(30% 0%, 70% 0%, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0% 70%, 0% 30%, 30% 30%)",
                  }}
                />
              </div>

              {/* CURVED VISOR SPECULAR LIGHT SHEEN: Glides across the black helmet visor with mouse movement */}
              <div
                className="absolute pointer-events-none rounded-full blur-[1px] transition-transform duration-200 ease-out"
                style={{
                  left: `calc(50% + ${mouseOffset.x * 16}px)`,
                  top: `calc(22% + ${mouseOffset.y * 10}px)`,
                  transform: "translate(-50%, -50%) rotate(-15deg)",
                  width: "48px",
                  height: "22px",
                  background: isHovered
                    ? "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(0, 0, 0, 0) 80%)"
                    : "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0) 80%)",
                }}
              />

              {/* INTERACTIVE HOTSPOTS (Visible when hovering over the robot stage) */}
              {isHovered &&
                HOTSPOTS.map((spot) => {
                  const isSelected = activeHotspot === spot.id;
                  return (
                    <div
                      key={spot.id}
                      onMouseEnter={() => setActiveHotspot(spot.id)}
                      onMouseLeave={() => setActiveHotspot(null)}
                      className="absolute z-30 cursor-pointer group"
                      style={{
                        left: spot.x,
                        top: spot.y,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {/* Pulse Ring */}
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_8px_#fff]" />
                      </span>

                      {/* Tooltip Card on Hover */}
                      {isSelected && (
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-48 p-2.5 rounded-lg bg-neutral-950/95 border border-white/20 shadow-2xl backdrop-blur-md text-left pointer-events-none animate-fade-in z-40">
                          <div className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-0.5">
                            {spot.code}
                          </div>
                          <div className="text-[11px] font-bold text-white leading-tight">
                            {spot.label}
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-snug mt-1">
                            {spot.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Real-time Tracking HUD Bar */}
        <div className="relative z-20 flex items-center justify-between text-[11px] font-mono text-neutral-500 max-w-7xl mx-auto w-full pt-1 pb-1 px-2 border-t border-neutral-900/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isHovered ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
                }`}
              />
              <span className={isHovered ? "text-neutral-300" : "text-neutral-500"}>
                {isHovered ? "ACTIVE TARGET LOCK" : "IDLE AUTONOMOUS SCAN"}
              </span>
            </span>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              HEAD PITCH: {(mouseOffset.y * -8).toFixed(1)}°
            </span>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              YAW: {(mouseOffset.x * 10).toFixed(1)}°
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase">
              {activeHotspot ? `INSPECTING: ${activeHotspot.toUpperCase()}` : "MOVE CURSOR TO INSPECT CHASSIS"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM HARDWARE SPECIFICATIONS & ARCHITECTURE STRIP */}
      <section className="border-t border-neutral-900/80 bg-neutral-950/90 py-5 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              id: "neural",
              label: "NEURAL ENGINE",
              desc: "Sub-450ms adaptive reasoning & hybrid vector RAG",
              icon: Cpu,
            },
            {
              id: "vision",
              label: "SPATIAL SENSING",
              desc: "Multi-modal vision and contextual environment awareness",
              icon: Eye,
            },
            {
              id: "cipher",
              label: "ENTERPRISE CIPHER",
              desc: "AES-256 encrypted, strict tenant-isolated session memory",
              icon: Shield,
            },
            {
              id: "autonomous",
              label: "AUTONOMOUS OPS",
              desc: "Self-improving sales qualification & workflow execution",
              icon: Zap,
            },
          ].map((item) => {
            const isActive = activeSpec === item.id;
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveSpec(item.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-white/[0.06] border-white/30 shadow-xs shadow-white/5"
                    : "bg-neutral-950/40 border-neutral-900 hover:border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-white animate-ping" : "bg-neutral-600"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isActive ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    <Icon className="w-3 h-3 text-white/80" />
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
