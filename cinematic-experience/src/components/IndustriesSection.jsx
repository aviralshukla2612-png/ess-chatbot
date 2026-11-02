import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Plus,
  GraduationCap,
  BedDouble,
  ShoppingBag,
  Briefcase,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const INDUSTRIES = [
  {
    id: "real-estate",
    category: "Real Estate",
    name: "Commercial & Residential Developments",
    subtitle: "Property enquiries, floor plans, pricing and private viewings.",
    icon: Building2,
    video: "/videos/industries/real-estate.mp4",
    poster: "/images/industries/real-estate.webp",
    fallbackBg: "linear-gradient(135deg, #1E1233 0%, #0B0B14 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the unit specifications, pricing tiers and viewing availability for the penthouse suites?",
    metrics: "3.4x Faster Viewing Bookings",
    badge: "Unit Specs & Pricing",
  },
  {
    id: "healthcare",
    category: "Healthcare",
    name: "Clinics & Specialized Medical Suites",
    subtitle: "Treatments, doctor credentials and clinical intake queries.",
    icon: Plus,
    video: "/videos/industries/healthcare.mp4",
    poster: "/images/industries/healthcare.webp",
    fallbackBg: "linear-gradient(135deg, #122233 0%, #080D14 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Are diagnostic scans, therapy packages and specialist consultations covered under international insurance?",
    metrics: "88% Faster Patient Intake",
    badge: "Clinical Intake & Eligibility",
  },
  {
    id: "education",
    category: "Education",
    name: "Higher Education & University Campuses",
    subtitle: "Admissions criteria, degree programs, curriculum and tuition fees.",
    icon: GraduationCap,
    video: "/videos/industries/education.mp4",
    poster: "/images/industries/education.webp",
    fallbackBg: "linear-gradient(135deg, #241433 0%, #0C0814 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the application deadlines, scholarship options and prerequisite credits for the Fall 2026 intake?",
    metrics: "62% Higher Completed Inquiries",
    badge: "Programs & Admissions",
  },
  {
    id: "hospitality",
    category: "Hospitality",
    name: "Luxury Hotels & Resort Destinations",
    subtitle: "Suite availability, concierge amenities and customized stay packages.",
    icon: BedDouble,
    video: "/videos/industries/hospitality.mp4",
    poster: "/images/industries/hospitality.webp",
    fallbackBg: "linear-gradient(135deg, #1E1A33 0%, #090812 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Can we reserve an ocean-view executive suite with bespoke dining, airport transfers and late checkout?",
    metrics: "2.1x Boost in Direct Booking Value",
    badge: "Suites & Bespoke Stays",
  },
  {
    id: "retail",
    category: "Retail & E-commerce",
    name: "Omnichannel Brands & Luxury Retail",
    subtitle: "Product specifications, order policies, warranty and sizing advice.",
    icon: ShoppingBag,
    video: "/videos/industries/retail.mp4",
    poster: "/images/industries/retail.webp",
    fallbackBg: "linear-gradient(135deg, #2A1040 0%, #080512 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the warranty options, seasonal bundle discounts and same-day express delivery coverage areas?",
    metrics: "4.2x Faster Conversion Velocity",
    badge: "Products & Order Assistance",
  },
  {
    id: "professional-services",
    category: "Professional Services",
    name: "Consulting & Corporate Advisory",
    subtitle: "Service scoping, enterprise capabilities and executive onboarding.",
    icon: Briefcase,
    video: "/videos/industries/professional-services.mp4",
    poster: "/images/industries/professional-services.webp",
    fallbackBg: "linear-gradient(135deg, #121A30 0%, #070914 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "How does Emperor Nexus qualify new corporate client requirements and route briefings to senior practice partners?",
    metrics: "99.4% Client Query Precision",
    badge: "Advisory & Case Scoping",
  },
];

// Emperor Nexus Platform Metrics Belt
const STATS = [
  ["24/7", "Autonomous Responses"],
  ["99.4%", "Query Precision"],
  ["3.4x", "Faster Viewing Bookings"],
  ["88%", "Reduction in Wait Times"],
  ["62%", "Higher Completed Inquiries"],
  ["2.1x", "Higher Booking Value"],
];

// Industry Verticals Marquee
const VERTICALS = [
  "Real Estate Developments",
  "Specialized Healthcare Clinics",
  "Higher Education & Universities",
  "Luxury Hospitality & Resorts",
  "Retail & Omnichannel E-commerce",
  "Corporate Professional Services",
  "AI Conversational Commerce",
  "24/7 Enterprise Customer Intelligence",
];

// Start rect (everything collapsed into tile 0) -> End rect (balanced 6-tile editorial mosaic)
const MOSAIC = [
  // Tile 0: Real Estate (Hero vertical anchor on left)
  { s: [0, 0, 100, 100], e: [0, 0, 36, 100], d: 0.0 },
  // Tile 1: Healthcare (Top center)
  { s: [50, 50, 0, 0], e: [37.5, 0, 31, 48.5], d: 0.05 },
  // Tile 2: Hospitality (Bottom center)
  { s: [50, 50, 0, 0], e: [37.5, 51.5, 31, 48.5], d: 0.12 },
  // Tile 3: Education (Top right)
  { s: [50, 50, 0, 0], e: [70, 0, 30, 31.5], d: 0.08 },
  // Tile 4: Retail & E-commerce (Middle right)
  { s: [50, 50, 0, 0], e: [70, 34.2, 30, 31.5], d: 0.16 },
  // Tile 5: Professional Services (Bottom right)
  { s: [50, 50, 0, 0], e: [70, 68.5, 30, 31.5], d: 0.22 },
];

function splitWord(word, offset = 0) {
  return [...word].map((char, i) => (
    <span key={i} className="inline-block overflow-hidden align-top pt-[0.04em] px-[0.01em] pb-[0.12em]">
      <b style={{ "--i": i + offset }} className="block font-inherit">{char}</b>
    </span>
  ));
}

export default function IndustriesSection({ onOpenExperience }) {
  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const heroRef = useRef(null);
  const cardRef = useRef(null);
  const slotRef = useRef(null);
  const statsRowRef = useRef(null);
  const verticalsRowRef = useRef(null);
  const beltStatsRef = useRef(null);
  const beltVerticalsRef = useRef(null);
  const hintRef = useRef(null);
  const outroRef = useRef(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const videoRefs = useRef([]);

  // Auto-cycle through the 6 industries periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % INDUSTRIES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Video IntersectionObserver to optimize memory and GPU
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

    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll-driven pinned timeline calculation matching exact NK mathematics adapted to Emperor Nexus
  useEffect(() => {
    let animId;
    let P = 0;
    let cur = 0;
    let target = 0;
    const t0 = performance.now();

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    let start = { x: 0, y: 0, w: 0, h: 0 };
    let endR = { x: 0, y: 0, w: 0, h: 0 };
    let range = 1;

    const measure = () => {
      const stage = stageRef.current;
      const pin = pinRef.current;
      const hero = heroRef.current;
      const slot = slotRef.current;
      if (!stage || !pin || !hero || !slot) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const prev = hero.style.transform;
      hero.style.transform = "none";

      const pinRect = pin.getBoundingClientRect();
      const r = slot.getBoundingClientRect();
      hero.style.transform = prev;

      // Position relative to .pin container for exact docking
      start = {
        x: r.left - pinRect.left,
        y: r.top - pinRect.top,
        w: r.width,
        h: r.height,
      };

      const side = vw * 0.04;
      const top = vh * 0.16;
      endR = { x: side, y: top, w: vw - side * 2, h: vh - top - vh * 0.1 };
      range = Math.max(1, stage.offsetHeight - vh);
    };

    const render = () => {
      const stage = stageRef.current;
      const hero = heroRef.current;
      const card = cardRef.current;
      const verticals = verticalsRowRef.current;
      const stats = statsRowRef.current;
      const hint = hintRef.current;
      const outro = outroRef.current;
      if (!stage || !hero || !card || !verticals || !stats) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = P;

      /* Phase A: Big showcase card shrinks to central visual (0 -> 0.38)
         Phase B: Card glides into slot beside "Connect." as the headline reveals (0.38 -> 0.85)
         Phase C: Card blooms into the 6-tile mosaic collage (0.65 -> 1.0)
         Phase E: Closing transition message fades in at final scroll progress (0.85 -> 1.0) */
      const A = ease(clamp(p / 0.38));
      const B = ease(clamp((p - 0.38) / 0.47));
      const C = ease(clamp((p - 0.65) / 0.35));

      // Headline block rises from below and fades in
      const off = (1 - B) * vh * 0.75;
      hero.style.transform = `translate3d(0,${off}px,0)`;
      hero.style.opacity = String(clamp(B * 1.8));

      // Card geometry morphing
      const mw = Math.min(vw * 0.34, 580);
      const mh = mw * 0.58;
      const mid = { x: (vw - mw) / 2, y: (vh - mh) / 2 - vh * 0.02, w: mw, h: mh };
      const slotNow = { x: start.x, y: start.y + off, w: start.w, h: start.h };

      const r1 = {
        x: lerp(endR.x, mid.x, A),
        y: lerp(endR.y, mid.y, A),
        w: lerp(endR.w, mid.w, A),
        h: lerp(endR.h, mid.h, A),
      };

      const x = lerp(r1.x, slotNow.x, B);
      const y = lerp(r1.y, slotNow.y, B);
      const w = lerp(r1.w, slotNow.w, B);
      const hh = lerp(r1.h, slotNow.h, B);

      card.style.transform = `translate3d(${x}px,${y}px,0)`;
      card.style.width = `${w}px`;
      card.style.height = `${hh}px`;
      card.style.borderRadius = `${lerp(12, 6, A)}px`;

      // 6 Mosaic tiles splitting into the balanced editorial composition
      const tileEls = card.querySelectorAll(".mosaic-tile");
      tileEls.forEach((tileEl, i) => {
        const m = MOSAIC[i];
        if (!m) return;
        const k = ease(clamp((C - m.d * 1.3) / (1 - m.d * 1.3)));
        tileEl.style.left = `${lerp(m.s[0], m.e[0], k)}%`;
        tileEl.style.top = `${lerp(m.s[1], m.e[1], k)}%`;
        tileEl.style.width = `${lerp(m.s[2], m.e[2], k)}%`;
        tileEl.style.height = `${lerp(m.s[3], m.e[3], k)}%`;
        tileEl.style.opacity = i === 0 ? "1" : String(clamp(k * 3));
      });

      // Top and bottom marquee belts entrance/exit
      const cOut = ease(clamp(p / 0.22));
      verticals.style.opacity = String(1 - cOut);
      verticals.style.transform = `translate3d(0,${-cOut * 30}px,0)`;

      const sIn = ease(clamp((p - 0.88) / 0.12));
      stats.style.opacity = String(sIn);
      stats.style.transform = `translate3d(0,${(1 - sIn) * 30}px,0)`;

      if (hint) {
        hint.style.opacity = String(1 - clamp(p / 0.08));
      }

      // Phase E Closing Transition
      if (outro) {
        const oIn = ease(clamp((p - 0.86) / 0.14));
        outro.style.opacity = String(oIn);
        outro.style.transform = `translate3d(0,${(1 - oIn) * 30}px,0)`;
        outro.style.pointerEvents = oIn > 0.6 ? "auto" : "none";
      }
    };

    const loop = (now) => {
      const stage = stageRef.current;
      const pin = pinRef.current;
      if (!stage || !pin) return;

      const rect = stage.getBoundingClientRect();
      const currentScroll = -rect.top;
      target = clamp(currentScroll / range);
      cur += (target - cur) * 0.085;
      if (Math.abs(target - cur) < 0.0001) cur = target;
      P = cur;

      render();

      // Drift conveyor belts
      const s = (now - t0) / 1000;
      if (beltStatsRef.current) {
        beltStatsRef.current.style.transform = `translate3d(${-(
          (s * 40 + P * 900) %
          1000
        )}px,0,0)`;
      }
      if (beltVerticalsRef.current) {
        beltVerticalsRef.current.style.transform = `translate3d(${-(
          (s * 40 + P * 900) %
          1000
        )}px,0,0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section id="industries" className="relative bg-[#050507] text-[#F5F5F7] overflow-hidden">
      {/* ============================================================
          PINNED SCROLL-DRIVEN STAGE (420vh total height)
          ============================================================ */}
      <div ref={stageRef} className="relative w-full h-[420vh]">
        <div ref={pinRef} className="sticky top-0 h-screen w-full overflow-hidden bg-[#050507] flex flex-col justify-center items-center">
          {/* Subtle technical isometric grid with Emperor Nexus lighting */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              backgroundImage: `
                linear-gradient(60deg, transparent 49.8%, rgba(255,255,255,0.04) 50%, transparent 50.3%),
                linear-gradient(-60deg, transparent 49.8%, rgba(255,255,255,0.04) 50%, transparent 50.3%),
                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
              `,
              backgroundSize: "160px 277px, 160px 277px, 160px 100%",
              maskImage: "radial-gradient(70% 60% at 50% 45%, #000 30%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(70% 60% at 50% 45%, #000 30%, transparent 100%)",
            }}
          />

          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#963DFF]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#55A9FF]/15 rounded-full blur-[140px] pointer-events-none" />

          {/* Top Marquee Row: Industry Verticals Belt */}
          <div
            ref={verticalsRowRef}
            className="absolute top-20 sm:top-24 left-0 right-0 z-20 flex items-center gap-6 px-6 sm:px-8 pointer-events-none transition-transform"
          >
            <div className="text-xs uppercase font-bold tracking-widest text-[#9898A6] flex items-center gap-1.5 shrink-0">
              <span className="text-[#C28AFF] font-black">/</span>
              <span>INDUSTRIES WE SERVE</span>
            </div>
            <div className="flex-1 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
              <div ref={beltVerticalsRef} className="flex gap-8 items-center w-max">
                {[...VERTICALS, ...VERTICALS, ...VERTICALS].map((vertical, i) => (
                  <span
                    key={i}
                    className="text-xs sm:text-sm font-bold tracking-wider text-[#D9D9E2] uppercase whitespace-nowrap bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.08]"
                  >
                    {vertical}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Central Hero Headline matching the Section 4 specification */}
          <div
            ref={heroRef}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 opacity-0 will-change-transform"
          >
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-xs font-semibold uppercase tracking-widest text-[#C28AFF] mb-4">
              <span>/ INDUSTRIES WE SERVE</span>
            </div>

            {/* Oversized Editorial Typography */}
            <h1
              aria-label="Different Industries. Different Questions. One Better Way to Connect."
              className="select-none tracking-tight font-medium"
              style={{
                fontSize: "clamp(36px, 5.8vw, 105px)",
                lineHeight: "0.94",
                letterSpacing: "-0.045em",
                color: "#FFFFFF",
              }}
            >
              <span className="block relative">
                <span className="inline-block relative">
                  {splitWord("Different Industries.", 0)}
                </span>
              </span>
              <span className="block relative mt-1 sm:mt-2">
                <span className="inline-block relative text-[#D9D9E2]">
                  {splitWord("Different Questions.", 22)}
                </span>
              </span>
              <span className="block relative mt-1 sm:mt-2">
                <span className="inline-block relative">
                  {splitWord("One Better Way to ", 42)}
                  <span className="text-gradient-purple-blue inline-block relative font-bold">
                    {splitWord("Connect.", 60)}
                    {/* Slot marker where the card docks at right edge of Connect. */}
                    <span
                      ref={slotRef}
                      className="absolute pointer-events-none"
                      style={{
                        left: "100%",
                        top: "0.1em",
                        marginLeft: "0.08em",
                        width: "1.38em",
                        height: "0.78em",
                      }}
                    />
                  </span>
                </span>
              </span>
            </h1>

            {/* Supporting Lede */}
            <p
              className="text-[#9898A6] font-normal leading-relaxed text-center"
              style={{
                maxWidth: "36em",
                fontSize: "clamp(14px, 1.2vw, 18px)",
                marginTop: "3.5vh",
              }}
            >
              Every industry has its own customers, expectations and conversations. Give them a better way to discover your business and get the information they need.
            </p>

            {/* CTA Button */}
            <a
              href="#industries-wall"
              className="uppercase font-bold tracking-wider inline-block transition-opacity hover:opacity-80"
              style={{
                marginTop: "3.5vh",
                fontSize: "clamp(13px, 1.1vw, 16px)",
                paddingBottom: "4px",
                background: "linear-gradient(#963DFF, #55A9FF) left bottom / 100% 2px no-repeat",
                color: "#FFFFFF",
              }}
            >
              Explore the Environments ↓
            </a>
          </div>

          {/* Morphing Mosaic Showcase Card (Houses the 6 industry videos) */}
          <div
            ref={cardRef}
            className="absolute left-0 top-0 z-30 overflow-hidden border border-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.9)] bg-[#0B0B10]"
            style={{ width: "80vw", height: "65vh" }}
          >
            {MOSAIC.map((_, tileIdx) => {
              const currentInd = INDUSTRIES[(tileIdx + activeSlideIndex) % INDUSTRIES.length];
              const Icon = currentInd.icon;
              return (
                <div
                  key={tileIdx}
                  className="mosaic-tile absolute overflow-hidden rounded-md border border-white/[0.08] transition-all duration-300 cursor-pointer group"
                  style={{
                    left: "0%",
                    top: "0%",
                    width: "100%",
                    height: "100%",
                    background: currentInd.fallbackBg,
                  }}
                  onClick={() => onOpenExperience?.(currentInd.id)}
                >
                  {/* Real MP4 Video Loop with Poster Fallback */}
                  <video
                    ref={(el) => (videoRefs.current[tileIdx] = el)}
                    src={currentInd.video}
                    poster={currentInd.poster}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Dark Glass Shade Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                  {/* Card Content Overlay */}
                  <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between z-10 pointer-events-none">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[#C28AFF]">
                        {currentInd.category}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white leading-tight drop-shadow-md line-clamp-1">
                        {currentInd.name}
                      </h4>
                      <p className="text-[10px] text-[#D9D9E2] line-clamp-1 mt-0.5">
                        {currentInd.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phase E Closing Transition Modal / Floating Outro Card */}
          <div
            ref={outroRef}
            className="absolute bottom-14 sm:bottom-16 z-40 max-w-xl px-4 text-center opacity-0 pointer-events-none will-change-transform"
          >
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0B0B10]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#C28AFF] block mb-2">
                / CONNECTED CUSTOMER EXPERIENCES
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                Your Industry Is Different. <br />
                <span className="text-gradient-purple-blue">
                  Your Customers&apos; Questions Matter Just as Much.
                </span>
              </h3>
              <p className="mt-2 text-xs text-[#9898A6] leading-relaxed max-w-md mx-auto">
                Wherever your business operates, Emperor Nexus helps you create a more accessible and connected customer experience.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href="#benefits"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white btn-primary-gradient cursor-pointer shadow-[0_0_20px_rgba(150,61,255,0.4)]"
                >
                  <span>Explore the Benefits</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onOpenExperience?.("real-estate")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-[#D9D9E2] btn-secondary-glass cursor-pointer"
                >
                  <span>Test Live Assistant</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Marquee Row: Platform Performance Metrics Belt */}
          <div
            ref={statsRowRef}
            className="absolute bottom-5 sm:bottom-6 left-0 right-0 z-20 flex items-center gap-6 px-6 sm:px-8 pointer-events-none opacity-0 transition-opacity"
          >
            <div className="text-xs uppercase font-bold tracking-widest text-[#9898A6] flex items-center gap-1.5 shrink-0">
              <span className="text-[#55A9FF] font-black">/</span>
              <span>COMMERCIAL PERFORMANCE</span>
            </div>
            <div className="flex-1 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
              <div ref={beltStatsRef} className="flex gap-10 items-center w-max">
                {[...STATS, ...STATS, ...STATS].map((st, i) => (
                  <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                    <b className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {st[0]}
                    </b>
                    <em className="text-[10px] uppercase font-semibold text-[#9898A6] not-italic tracking-wider">
                      {st[1]}
                    </em>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Down Indicator */}
          <div
            ref={hintRef}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-[10px] font-bold uppercase tracking-widest text-[#9898A6] flex items-center gap-1.5 animate-bounce"
          >
            <span>Scroll To Explore ↓</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          DETAILED SHOWCASE WALL GRID (All 6 Industries)
          ============================================================ */}
      <div id="industries-wall" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#0B0B10] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto">
          {/* Wall Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C28AFF] block mb-2">
                02. Tailored Business Solutions
              </span>
              <h3 className="font-headline tracking-normal text-white uppercase text-3xl sm:text-4xl md:text-5xl leading-tight">
                Different Industries. <br />
                <span className="text-glow-purple text-gradient-purple-blue">
                  Infinite Customer Conversations.
                </span>
              </h3>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-[#9898A6] leading-relaxed">
              Every environment has its own customer expectations and information requirements.
              Emperor Nexus serves as the autonomous commercial engine tailored to each domain.
            </p>
          </div>

          {/* 6 Industry Architectural Cards Grid (3 cols on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.id}
                  className="group relative rounded-3xl glass-panel glass-panel-hover overflow-hidden flex flex-col justify-between cursor-pointer border border-white/[0.08] hover:border-[#C28AFF]/50 transition-all duration-300"
                  onClick={() => onOpenExperience?.(ind.id)}
                >
                  {/* Top Video Preview Banner */}
                  <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-black/50">
                    <video
                      src={ind.video}
                      poster={ind.poster}
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-black/25 to-transparent pointer-events-none" />

                    {/* Category Pill Tag */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                      <Icon className="w-3.5 h-3.5 text-[#C28AFF]" />
                      <span>{ind.category}</span>
                    </div>

                    {/* Metric Tag */}
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-[#963DFF]/20 backdrop-blur-md border border-[#963DFF]/40 text-[#C28AFF] text-xs font-bold">
                      {ind.metrics}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-bold text-lg sm:text-xl text-white group-hover:text-[#F5F5F7] transition-colors">
                        {ind.name}
                      </h4>
                      <p className="mt-2 text-xs text-[#9898A6] leading-relaxed line-clamp-2">
                        {ind.subtitle}
                      </p>

                      {/* Sample Customer Question Handled */}
                      <div className="mt-5 p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#C28AFF] tracking-wider block">
                          Sample Customer Question Handled:
                        </span>
                        <p className="text-xs text-[#F5F5F7] italic font-medium leading-relaxed">
                          &quot;{ind.sampleQuestion}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#9898A6]">
                        {ind.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenExperience?.(ind.id);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C28AFF] group-hover:text-white transition-colors"
                      >
                        <span>Test Assistant</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
