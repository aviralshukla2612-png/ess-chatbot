import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Bot,
  CalendarCheck,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Crosshair / Plus icon identical to Trionn
const PlusDivider = () => (
  <span className="mx-6 sm:mx-10 text-white/50 font-light text-2xl sm:text-4xl select-none inline-block">
    +
  </span>
);

// Marquee track component containing user's exact requested line + chatbot-related terms
const MarqueeTrack = () => (
  <div className="shrink-0 flex items-center uppercase font-headline font-black text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[6.25rem] tracking-tight leading-none text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9D5FF] to-white">
      Don&apos;t Let Valuable Conversations Slip Away
    </span>
    <PlusDivider />
    <span>Capture Every Lead</span>
    <PlusDivider />
    <span>Qualify 24/7</span>
    <PlusDivider />
    <span>Convert In Real-Time</span>
    <PlusDivider />
    <span>Autonomous Sales AI</span>
    <PlusDivider />
    <span>Sub-Second Intelligence</span>
    <PlusDivider />
    <span>Scale Revenue Pipeline</span>
    <PlusDivider />
    <span>Zero Hallucination</span>
    <PlusDivider />
  </div>
);

export default function BenefitsSection() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const visionRef = useRef(null);
  const stripeRefs = useRef([]);
  const keyfactsRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    const vision = visionRef.current;
    const keyfacts = keyfactsRef.current;
    if (!container || !stage || !vision || !keyfacts) return;

    const ctx = gsap.context(() => {
      const stripes = stripeRefs.current.filter(Boolean);
      const cards = cardRefs.current.filter(Boolean);

      // Initial visual states
      gsap.set(stripes, {
        scaleY: 0,
        transformOrigin: "bottom",
        willChange: "transform",
      });
      gsap.set(vision, { autoAlpha: 1 });
      gsap.set(keyfacts, { autoAlpha: 0 });
      gsap.set(cards, {
        rotateX: -92,
        autoAlpha: 0,
        transformOrigin: "center top",
        force3D: true,
      });

      // Unified single coordinated pinned stage (ZERO GAP between shutter and cards)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=1300",
          pin: stage,
          anticipatePin: 1,
          scrub: 0.75,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });

      // 1. Trionn Shutter Slats scale up from bottom, slicing through the infinite moving text
      stripes.forEach((stripe, i) => {
        const s = ((0.3 * (4 - i)) / 4) * 4.0; // staggered from 0 to 3.0
        const a = s + 1.4;
        tl.to(
          stripe,
          {
            scaleY: 1,
            duration: a - s,
            ease: "power1.inOut",
          },
          s
        );
      });

      // 2. Peak shutter coverage (at ~3.3): seamlessly swap vision for key facts behind closed slats
      tl.to(vision, { autoAlpha: 0, duration: 0.1 }, 3.3);
      tl.to(keyfacts, { autoAlpha: 1, duration: 0.1 }, 3.3);

      // 3. Change transformOrigin of slats to top
      tl.set(stripes, { transformOrigin: "top" }, 3.4);

      // 4. Slats wipe open from top to bottom (like blinds opening)
      stripes.forEach((stripe, i) => {
        const delay = 3.5 + i * 0.14;
        tl.to(
          stripe,
          {
            scaleY: 0,
            duration: 1.3,
            ease: "power2.inOut",
          },
          delay
        );
      });

      // 5. Trionn 3D Card Flip-Down (rotateX: -92 -> 0) directly unfolds as slats wipe open
      tl.to(
        cards,
        {
          rotateX: 0,
          autoAlpha: 1,
          duration: 1.8,
          stagger: 0.25,
          ease: "power2.out",
          force3D: true,
        },
        4.4
      );

      // 6. Settled comfortable hold (from 6.8 to 10.0) so user can comfortably read metrics
      tl.to({}, { duration: 3.2 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="benefits"
      className="relative w-full bg-[#050507] text-[#F5F5F7] select-none"
    >
      {/* Scoped CSS for smooth GPU-accelerated infinite marquee loop */}
      <style>{`
        @keyframes benefitsMarqueeLoop {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .benefits-infinite-track {
          display: flex;
          width: max-content;
          animation: benefitsMarqueeLoop 30s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* UNIFIED PINNED STAGE (ZERO SCROLL GAP — VISION + SHUTTER + KEY FACTS)      */}
      {/* ========================================================================= */}
      <div
        ref={stageRef}
        className="relative w-full h-screen min-h-[640px] max-h-screen overflow-hidden bg-[#050507] flex flex-col justify-center items-center"
      >
        {/* Subtle Technical Grid Background without any purple tint */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />

        {/* ======================================================================= */}
        {/* LAYER 1: VISION SECTION (Infinite Looping Marquee + Slicing Typography)   */}
        {/* ======================================================================= */}
        <div
          ref={visionRef}
          className="absolute inset-0 z-20 flex flex-col justify-between py-10 sm:py-14 px-6 sm:px-14 pointer-events-none select-none"
        >
          {/* Top Vision Title */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-[#A1A1AA] font-bold">
                Focused Intelligence.
              </span>
              <span className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase text-white font-extrabold">
                Measured Commercial Execution.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-mono tracking-widest uppercase text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Scroll To Reveal Key Facts</span>
            </div>
          </div>

          {/* Center Giant Infinite Looping Sliced Marquee */}
          <div className="relative z-10 overflow-hidden w-full py-4 select-none my-auto">
            <div className="benefits-infinite-track flex whitespace-nowrap will-change-transform">
              <MarqueeTrack />
              <div aria-hidden="true" className="shrink-0 flex items-center">
                <MarqueeTrack />
              </div>
            </div>
          </div>

          {/* Bottom Vision Subtitle */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70">
              ✦ Don&apos;t let valuable conversations slip away — autonomous 24/7 sales.
            </span>
            <span className="hidden sm:inline-block font-mono text-xs tracking-widest uppercase text-white/40">
              [ 01 — 03 KEY METRICS ]
            </span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* LAYER 2: KEY FACTS SECTION & 3 VIBRANT 3D FLIP-DOWN CARDS               */}
        {/* ======================================================================= */}
        <div
          ref={keyfactsRef}
          className="absolute inset-0 z-10 flex flex-col justify-center items-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 select-none opacity-0"
        >
          <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-col justify-center my-auto">
            {/* Section Header */}
            <div className="title-block flex flex-col items-center mb-6 sm:mb-8 gap-2 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/20 text-xs font-mono font-bold uppercase tracking-widest text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span>Key Facts &amp; Measured Impact</span>
              </div>
              <h2 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-white tracking-tight leading-tight">
                Don&apos;t Let Valuable Conversations Slip Away.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
                Your website should be ready to answer, qualify, and capture enterprise interest — even when your sales team is unavailable.
              </p>
            </div>

            {/* 3D PERSPECTIVE CARD LIST (Trionn rotateX: -92 -> 0 flip-down animation) */}
            <div
              className="key-card-list flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 w-full px-2 no-scrollbar md:grid md:grid-cols-3 md:gap-5 lg:gap-6 items-stretch justify-center"
              style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
            >
              {/* =================================================================== */}
              {/* CARD 01: CUSTOMER ENGAGEMENT (FULL VIBRANT MINT GREEN)              */}
              {/* =================================================================== */}
              <div
                ref={(el) => (cardRefs.current[0] = el)}
                data-kf-card="true"
                className="featured-card group relative rounded-2xl bg-[#90CDA6] text-black p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(144,205,166,0.35)] hover:shadow-[0_25px_60px_rgba(144,205,166,0.55)] border-2 border-[#74BA8C] overflow-hidden w-[84vw] shrink-0 snap-center sm:w-auto md:w-full min-h-[400px] sm:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    {/* Top Pill Tag */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-[#90CDA6] uppercase tracking-wider">
                        Card 01 — Customer Engagement
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-white bg-black px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#90CDA6] animate-pulse" />
                        Available 24/7
                      </span>
                    </div>

                    {/* Kicker & Headlines */}
                    <div className="mt-3">
                      <span className="text-[11px] font-mono font-black text-black/70 uppercase tracking-widest block">
                        CUSTOMER EXPERIENCE
                      </span>
                      <h3 className="font-headline font-black text-xl sm:text-2xl text-black uppercase tracking-tight mt-0.5 leading-tight">
                        ALWAYS-ON CONVERSATIONS
                      </h3>
                      <h4 className="font-headline font-black text-xs sm:text-sm text-black/80 uppercase tracking-tight mt-0.5">
                        NEVER MISS AN ENQUIRY
                      </h4>
                      <p className="mt-2 text-xs sm:text-[13px] text-black/85 leading-relaxed font-semibold">
                        Answer customer questions instantly using your approved business information, even outside working hours.
                      </p>
                    </div>
                  </div>

                  {/* Visual element: Customer question -> Nexus response -> Guided towards enquiry */}
                  <div className="my-3 bg-black/10 backdrop-blur-md rounded-xl p-3 border border-black/15 space-y-2 text-black">
                    {/* Customer asks a question */}
                    <div className="flex items-start gap-2 bg-white/70 rounded-lg p-2 border border-black/10 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-black text-white text-[9px] font-mono font-bold flex items-center justify-center shrink-0">
                        Q
                      </span>
                      <p className="text-black font-semibold text-[10px] sm:text-[11px] leading-tight">
                        &quot;Can I get details on your enterprise packages and setup time?&quot;
                      </p>
                    </div>
                    {/* Emperor Nexus assistant responds */}
                    <div className="flex items-start gap-2 bg-black text-white rounded-lg p-2 text-[11px]">
                      <Bot className="w-3.5 h-3.5 text-[#90CDA6] shrink-0 mt-0.5" />
                      <p className="text-[#90CDA6] font-mono font-medium text-[10px] sm:text-[11px] leading-tight">
                        &quot;Emperor Nexus deploys in 5 minutes with verified answers and CRM sync.&quot;
                      </p>
                    </div>
                    {/* Visitor guided towards making an enquiry */}
                    <div className="flex items-center justify-between pt-1 border-t border-black/15 text-[10px] font-mono font-bold text-black">
                      <span className="inline-flex items-center gap-1 text-black font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        Guided Towards Enquiry
                      </span>
                      <span className="bg-black text-[#90CDA6] px-1.5 py-0.5 rounded text-[9px]">
                        Lead Captured
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2.5 border-t border-black/15 flex items-center justify-between">
                    <span className="font-mono text-[10px] sm:text-[11px] text-black font-extrabold uppercase tracking-wider">
                      24/7 AI ASSISTANCE
                    </span>
                    <span className="font-mono text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded">
                      Instant Setup
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* CARD 02: INTELLIGENT AUTOMATION (FULL VIBRANT LILAC ORCHID)         */}
              {/* =================================================================== */}
              <div
                ref={(el) => (cardRefs.current[1] = el)}
                data-kf-card="true"
                className="featured-card group relative rounded-2xl bg-[#C89BFF] text-black p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(200,155,255,0.35)] hover:shadow-[0_25px_60px_rgba(200,155,255,0.55)] border-2 border-[#AF73FF] overflow-hidden w-[84vw] shrink-0 snap-center sm:w-auto md:w-full min-h-[400px] sm:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    {/* Top Pill Tag */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-[#C89BFF] uppercase tracking-wider">
                        Card 02 — Intelligent Automation
                      </span>
                      <span className="text-[10px] font-mono font-bold text-white bg-black px-2.5 py-0.5 rounded-full">
                        Business Knowledge
                      </span>
                    </div>

                    {/* Kicker & Headlines */}
                    <div className="mt-3">
                      <span className="text-[11px] font-mono font-black text-black/70 uppercase tracking-widest block">
                        SMART AUTOMATION
                      </span>
                      <h3 className="font-headline font-black text-xl sm:text-2xl text-black uppercase tracking-tight mt-0.5 leading-tight">
                        LESS MANUAL WORK
                      </h3>
                      <h4 className="font-headline font-black text-xs sm:text-sm text-black/80 uppercase tracking-tight mt-0.5">
                        LET AI HANDLE REPETITIVE QUESTIONS
                      </h4>
                      <p className="mt-2 text-xs sm:text-[13px] text-black/85 leading-relaxed font-semibold">
                        Reduce repetitive customer interactions by allowing your assistant to answer questions about services, pricing, packages and business information.
                      </p>
                    </div>
                  </div>

                  {/* Visual element: Business info transforms into AI knowledge interface -> Assistant uses approved info */}
                  <div className="my-3 bg-black/10 backdrop-blur-md rounded-xl p-3 border border-black/15 space-y-2 text-black">
                    <div className="flex items-center justify-between text-[10px] font-mono text-black font-bold">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-black" />
                        Knowledge Interface
                      </span>
                      <span className="bg-black text-[#C89BFF] px-1.5 py-0.5 rounded text-[9px]">
                        100% Approved
                      </span>
                    </div>
                    <div className="bg-black text-white rounded-lg p-2 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-[#C89BFF]">
                        <span>• Services &amp; Packages</span>
                        <span className="text-white">Active</span>
                      </div>
                      <div className="flex items-center justify-between text-[#C89BFF]">
                        <span>• Pricing &amp; Business Info</span>
                        <span className="text-white">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-black pt-1 border-t border-black/15">
                      <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                      <span>Assistant uses approved information only</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2.5 border-t border-black/15 flex items-center justify-between">
                    <span className="font-mono text-[10px] sm:text-[11px] text-black font-extrabold uppercase tracking-wider">
                      MORE TIME FOR YOUR TEAM
                    </span>
                    <span className="font-mono text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded">
                      Zero Repetition
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* CARD 03: ENQUIRY VISIBILITY (FULL VIBRANT SKY BLUE)                 */}
              {/* =================================================================== */}
              <div
                ref={(el) => (cardRefs.current[2] = el)}
                data-kf-card="true"
                className="featured-card group relative rounded-2xl bg-[#7DD3FC] text-black p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(125,211,252,0.35)] hover:shadow-[0_25px_60px_rgba(125,211,252,0.55)] border-2 border-[#38BDF8] overflow-hidden w-[84vw] shrink-0 snap-center sm:w-auto md:w-full min-h-[400px] sm:min-h-[420px] will-change-transform backface-hidden transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    {/* Top Pill Tag */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black text-[#7DD3FC] uppercase tracking-wider">
                        Card 03 — Enquiry Visibility
                      </span>
                      <span className="text-[10px] font-mono font-bold text-white bg-black px-2.5 py-0.5 rounded-full">
                        Conversation Overview
                      </span>
                    </div>

                    {/* Kicker & Headlines */}
                    <div className="mt-3">
                      <span className="text-[11px] font-mono font-black text-black/70 uppercase tracking-widest block">
                        BUSINESS INSIGHTS
                      </span>
                      <h3 className="font-headline font-black text-xl sm:text-2xl text-black uppercase tracking-tight mt-0.5 leading-tight">
                        TURN CHATS INTO OPPORTUNITIES
                      </h3>
                      <h4 className="font-headline font-black text-xs sm:text-sm text-black/80 uppercase tracking-tight mt-0.5">
                        STAY CONNECTED TO CUSTOMER INTEREST
                      </h4>
                      <p className="mt-2 text-xs sm:text-[13px] text-black/85 leading-relaxed font-semibold">
                        View customer conversations and enquiries through your business panel, helping your team understand what visitors are looking for.
                      </p>
                    </div>
                  </div>

                  {/* Visual element: Chat conversation preview + Enquiry overview panel */}
                  <div className="my-3 bg-black/10 backdrop-blur-md rounded-xl p-3 border border-black/15 space-y-2 text-black">
                    <div className="flex items-center justify-between text-[10px] font-mono text-black font-bold">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-black" />
                        Business Enquiry Panel
                      </span>
                      <span className="bg-black text-[#7DD3FC] px-1.5 py-0.5 rounded text-[9px]">
                        98% Match
                      </span>
                    </div>
                    <div className="bg-black text-white rounded-lg p-2 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#7DD3FC] font-semibold">Elena Rostova</span>
                        <span className="bg-[#7DD3FC] text-black font-bold px-1 rounded text-[9px]">
                          Hot Enquiry
                        </span>
                      </div>
                      <p className="text-white/80 text-[9px] truncate">
                        &quot;Looking for automated sales assistant for 3 domains&quot;
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-black/15 text-[10px] font-mono text-black font-bold">
                      <span>Customer Details &amp; Intent Logged</span>
                      <span className="text-black">Instant Sync</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2.5 border-t border-black/15 flex items-center justify-between">
                    <span className="font-mono text-[10px] sm:text-[11px] text-black font-extrabold uppercase tracking-wider">
                      CONVERSATIONS &amp; ENQUIRIES
                    </span>
                    <span className="font-mono text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded">
                      Live Dashboard
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile swipe hint */}
            <div className="flex md:hidden items-center justify-center gap-2 mt-3 text-xs font-mono text-zinc-400">
              <span>Swipe cards to explore all metrics →</span>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* LAYER 3: THE 5 HORIZONTAL SHUTTER STRIPES (Sleek dark obsidian slats)   */}
        {/* ======================================================================= */}
        <div className="stripes-container absolute inset-0 pointer-events-none flex flex-col w-full h-full z-30">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              ref={(el) => (stripeRefs.current[i] = el)}
              className="stripe-item flex-1 w-full bg-[#050507] border-b border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              style={{
                transform: "scaleY(0)",
                transformOrigin: "bottom",
                willChange: "transform",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}