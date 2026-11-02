import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  PlusSquare,
  GraduationCap,
  BedDouble,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const BUSINESS_EXAMPLES = [
  {
    id: "real-estate",
    category: "Real Estate",
    name: "Horizon Edge — Glass Façade Solutions",
    subtitle: "Property details, pricing and project enquiries.",
    icon: Building2,
    img: "https://images.openai.com/static-rsc-4/bhxjo1KnM48AtN2-0ihMdpI48LvHI1QeSp43wdBbpwoDLMMc-4hMo_FhIguQpLD9mUrkYH8xH2xEof-rIMZwPdsaBr-0AyNctvCbanY5diNd3mJ0BRoJfowuSu10UJDol4GDXtjxLEy8ct12NBawbpbURs4Ik51lWsRal0HfvQo?purpose=inline",
    fallbackBg: "linear-gradient(135deg, #1E1233 0%, #0B0B14 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the thermal insulation ratings and lead times for unitized façade glass panels?",
    metrics: "3.4x Faster Viewing Bookings",
    badge: "Unit Specs & Pricing",
  },
  {
    id: "healthcare",
    category: "Healthcare",
    name: "Medical Clinic & Wellness Suite",
    subtitle: "Treatments, doctors and consultation information.",
    icon: PlusSquare,
    img: "https://images.openai.com/static-rsc-4/2jq0Rok6gYbmP6SqRsv3gC58bnz2qV8feTR3ABvlxw0mbo9zaCOxDZ-4aL3K9lwt0znqO_LcqV6R9yCClKlx_Tfn6PkfsaZb1_BMgF5fCGt6oH2qmn_99dwdKdFMgLkHGT2wBS1NQpLBz6Ugu3LjntKdrasPbakdQ3wD0tEzLrE?purpose=inline",
    fallbackBg: "linear-gradient(135deg, #122233 0%, #080D14 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Are orthopedic consultations and diagnostic scans covered under international insurance?",
    metrics: "88% Reduction in Support Wait Times",
    badge: "Clinical Intake & Eligibility",
  },
  {
    id: "education",
    category: "Education",
    name: "USTP Campus & Higher Education",
    subtitle: "Admissions, courses and fee enquiries.",
    icon: GraduationCap,
    img: "https://images.openai.com/static-rsc-4/M9VJrdy3ggMu426pzfuw2otoLMtAcuRe_omuJWKz5t8Xqmv6k_DG9xF4mRFLwDp504lPXG8Yy7ihgGp_OwNgWwzxBTHiW1xrdP-v_dUCdIzre_CtzN3fUyDeT1nKcOcAwpMzrgnnvTXMjct14xeIL7CR28kMrRvwviRhvFOAZTg?purpose=inline",
    fallbackBg: "linear-gradient(135deg, #241433 0%, #0C0814 100%)",
    accentColor: "#C28AFF",
    sampleQuestion: "What are the application deadlines and scholarship criteria for the Fall 2026 intake?",
    metrics: "62% Increase in Completed Applications",
    badge: "Programs & Admissions",
  },
  {
    id: "hospitality",
    category: "Hospitality",
    name: "Grand Horizon Luxury Hotel & Resort",
    subtitle: "Rooms, facilities and accommodation information.",
    icon: BedDouble,
    img: "https://images.openai.com/static-rsc-4/0kABJj0RgRdu6YugoGN2wcoTb_4E7HtbjDwc11vePEH7U5osQvubLqXbzn5TJgNnnan_hKkdD-veiqRt1wdUmEF7E0zmknQkCqoZkGB-QzaXLHevs-o2xhyH51a7INz3y1q664Ai0DXrPLBbkfeT_OapvF8Nxe311Zsn3WCCCjg?purpose=inline",
    fallbackBg: "linear-gradient(135deg, #1E1A33 0%, #090812 100%)",
    accentColor: "#55A9FF",
    sampleQuestion: "Can we reserve an executive ocean-view suite with private dinner and late checkout?",
    metrics: "2.1x Boost in Direct Booking Value",
    badge: "Suites & Bespoke Stays",
  },
];

const STATS = [
  ["99.4%", "Citation Precision"],
  ["600ms", "Sub-second Response"],
  ["3.4x", "Faster Enquiries"],
  ["24/7", "Zero Support Latency"],
  ["88%", "Reduction in Wait Times"],
  ["2,500+", "Qualified Inquiries/Day"],
];

const BRANDS = [
  "Horizon Edge Façades",
  "Specialty Medical Suite",
  "USTP University",
  "Grand Horizon Resort",
  "Haute Horlogerie Boutique",
  "Enterprise FinTech",
];

// Mosaic percentage coordinates: start rect (single centered) -> end rect (5-tile mosaic)
const MOSAIC = [
  { s: [0, 0, 100, 100], e: [0, 0, 33.5, 100], d: 0 },
  { s: [50, 50, 0, 0], e: [34.5, 0, 33, 56], d: 0.0 },
  { s: [50, 50, 0, 0], e: [68.5, 0, 31.5, 46], d: 0.08 },
  { s: [50, 50, 0, 0], e: [34.5, 57, 33, 43], d: 0.14 },
  { s: [50, 50, 0, 0], e: [68.5, 47, 31.5, 53], d: 0.2 },
];

export default function IndustriesSection({ onOpenExperience }) {
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const cardRef = useRef(null);
  const slotRef = useRef(null);
  const statsRowRef = useRef(null);
  const clientsRowRef = useRef(null);
  const beltStatsRef = useRef(null);
  const beltBrandsRef = useRef(null);
  const hintRef = useRef(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Auto-cycle through the 4 business examples periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % BUSINESS_EXAMPLES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Scroll-driven pinned timeline calculation
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
      const hero = heroRef.current;
      const slot = slotRef.current;
      if (!stage || !hero || !slot) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const prev = hero.style.transform;
      hero.style.transform = "none";
      const r = slot.getBoundingClientRect();
      hero.style.transform = prev;

      start = { x: r.left, y: r.top, w: r.width, h: r.height };
      const side = vw * 0.04;
      const top = vh * 0.18;
      endR = { x: side, y: top, w: vw - side * 2, h: vh - top - vh * 0.12 };
      range = Math.max(1, stage.offsetHeight - vh);
    };

    const render = () => {
      const stage = stageRef.current;
      const hero = heroRef.current;
      const card = cardRef.current;
      const clients = clientsRowRef.current;
      const stats = statsRowRef.current;
      const hint = hintRef.current;
      if (!stage || !hero || !card || !clients || !stats) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = P;

      /* Phase A: Big showcase card shrinks to center card (0 -> 0.40)
         Phase B: Card travels into slot while headline rises (0.40 -> 0.90)
         Phase C: Card splits into the 5-tile mosaic (0.72 -> 1.0) */
      const A = ease(clamp(p / 0.4));
      const B = ease(clamp((p - 0.4) / 0.5));
      const C = ease(clamp((p - 0.72) / 0.28));

      // Headline block rises from below and fades in
      const off = (1 - B) * vh * 0.75;
      hero.style.transform = `translate3d(0,${off}px,0)`;
      hero.style.opacity = String(clamp(B * 1.8));

      // Card geometry morphing
      const mw = Math.min(vw * 0.36, 580);
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
      card.style.borderRadius = `${lerp(18, 10, A)}px`;

      // Mosaic tiles splitting
      const tileEls = card.querySelectorAll(".mosaic-tile");
      tileEls.forEach((tileEl, i) => {
        const m = MOSAIC[i];
        if (!m) return;
        const k = ease(clamp((C - m.d * 1.4) / (1 - m.d * 1.4)));
        tileEl.style.left = `${lerp(m.s[0], m.e[0], k)}%`;
        tileEl.style.top = `${lerp(m.s[1], m.e[1], k)}%`;
        tileEl.style.width = `${lerp(m.s[2], m.e[2], k)}%`;
        tileEl.style.height = `${lerp(m.s[3], m.e[3], k)}%`;
        tileEl.style.opacity = i === 0 ? "1" : String(clamp(k * 3));
      });

      // Top and bottom marquee belts entrance/exit
      const cOut = ease(clamp(p / 0.22));
      clients.style.opacity = String(1 - cOut);
      clients.style.transform = `translate3d(0,${-cOut * 30}px,0)`;

      const sIn = ease(clamp((p - 0.92) / 0.08));
      stats.style.opacity = String(sIn);
      stats.style.transform = `translate3d(0,${(1 - sIn) * 30}px,0)`;

      if (hint) {
        hint.style.opacity = String(1 - clamp(p / 0.08));
      }
    };

    const loop = (now) => {
      const stage = stageRef.current;
      if (!stage) return;
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
          (s * 35 + P * 850) %
          1200
        )}px,0,0)`;
      }
      if (beltBrandsRef.current) {
        beltBrandsRef.current.style.transform = `translate3d(${-(
          (s * 35 + P * 850) %
          1200
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
      <div ref={stageRef} className="relative w-full h-[400vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050507] flex flex-col justify-center items-center">
          {/* Background Ambient Lighting & Grids */}
          <div className="absolute inset-0 pointer-events-none nexus-grid-overlay opacity-30" />
          <div className="absolute inset-0 pointer-events-none nexus-dotted-grid opacity-25" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#963DFF]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#55A9FF]/12 rounded-full blur-[140px] pointer-events-none" />

          {/* Top Marquee Row: Client Verticals Belt */}
          <div
            ref={clientsRowRef}
            className="absolute top-20 left-0 right-0 z-20 flex items-center gap-6 px-8 pointer-events-none transition-transform"
          >
            <div className="text-xs uppercase font-bold tracking-widest text-[#9898A6] flex items-center gap-1.5 shrink-0">
              <span className="text-[#963DFF] font-black">/</span>
              <span>Every business has questions. We deliver clear answers.</span>
            </div>
            <div className="flex-1 overflow-hidden mask-linear-gradient">
              <div ref={beltBrandsRef} className="flex gap-8 items-center w-max">
                {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => (
                  <span
                    key={i}
                    className="text-xs sm:text-sm font-extrabold tracking-wider text-[#D9D9E2] uppercase whitespace-nowrap bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.08]"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Central Hero Text Block with Headline & Slot */}
          <div
            ref={heroRef}
            className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-center text-center opacity-0 transition-opacity"
          >
            {/* 02 Category Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#963DFF]/15 border border-[#963DFF]/30 text-[#C28AFF] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>02. Customized Business Experience — Every Business is Different</span>
            </div>

            {/* Headline */}
            <h2 className="font-headline tracking-normal text-white uppercase text-center leading-[0.92] text-4xl sm:text-6xl md:text-7xl lg:text-[88px] select-none">
              <span className="block text-[#F5F5F7] relative">
                Your Business Is Unique.
                {/* Slot marker where the morphing card docks */}
                <span ref={slotRef} className="inline-block w-28 sm:w-40 h-10 sm:h-14 align-middle ml-2" />
              </span>
              <span className="block text-glow-purple text-gradient-purple-blue mt-1">
                Your Customer Experience Should Be Too.
              </span>
            </h2>

            {/* Supporting Lede */}
            <p className="mt-6 max-w-2xl text-sm sm:text-base text-[#9898A6] leading-relaxed">
              Every business has its own services, offerings, customers and way of working.
              Create a customized assistant around your business information, so visitors can explore
              what you offer and get relevant answers to their questions.
            </p>

            {/* CTA Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={() => onOpenExperience?.("real-estate")}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs sm:text-sm font-bold text-white btn-primary-gradient cursor-pointer shadow-[0_0_25px_rgba(150,61,255,0.4)]"
              >
                <span>Explore Industry Assistants</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Morphing Mosaic Showcase Card */}
          <div
            ref={cardRef}
            className="absolute left-0 top-0 z-30 overflow-hidden border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-[#0B0B10]"
            style={{ width: "80vw", height: "65vh" }}
          >
            {MOSAIC.map((_, tileIdx) => {
              const currentEx = BUSINESS_EXAMPLES[activeSlideIndex % BUSINESS_EXAMPLES.length];
              const Icon = currentEx.icon;
              return (
                <div
                  key={tileIdx}
                  className="mosaic-tile absolute overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300"
                  style={{
                    left: "0%",
                    top: "0%",
                    width: "100%",
                    height: "100%",
                    background: currentEx.fallbackBg,
                  }}
                  onClick={() => onOpenExperience?.(currentEx.id)}
                >
                  {/* Slide Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
                    style={{
                      backgroundImage: `url('${currentEx.img}'), ${currentEx.fallbackBg}`,
                    }}
                  />

                  {/* Dark Glass Shade Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Card Content Overlay */}
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[#C28AFF]">
                        {currentEx.category}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white leading-tight drop-shadow-md">
                        {currentEx.name}
                      </h4>
                      <p className="text-[11px] text-[#D9D9E2] line-clamp-1 mt-0.5">
                        {currentEx.subtitle}
                      </p>
                      <div className="mt-2 text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{currentEx.metrics}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Marquee Row: Proven Metrics Belt */}
          <div
            ref={statsRowRef}
            className="absolute bottom-6 left-0 right-0 z-20 flex items-center gap-6 px-8 pointer-events-none opacity-0 transition-opacity"
          >
            <div className="text-xs uppercase font-bold tracking-widest text-[#9898A6] flex items-center gap-1.5 shrink-0">
              <span className="text-[#55A9FF] font-black">/</span>
              <span>The difference our work makes where it matters.</span>
            </div>
            <div className="flex-1 overflow-hidden mask-linear-gradient">
              <div ref={beltStatsRef} className="flex gap-10 items-center w-max">
                {[...STATS, ...STATS, ...STATS].map((st, i) => (
                  <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                    <b className="text-base sm:text-lg font-bold text-white tracking-tight">
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
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-[10px] font-bold uppercase tracking-widest text-[#9898A6] flex items-center gap-1.5 animate-bounce"
          >
            <span>Scroll ↓</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          DETAILED SHOWCASE WALL GRID (4 Business Examples)
          ============================================================ */}
      <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#0B0B10] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto">
          {/* Wall Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C28AFF] block mb-2">
                Proven Industry Deployments
              </span>
              <h3 className="font-headline tracking-normal text-white uppercase text-4xl sm:text-5xl md:text-6xl leading-tight">
                Four Business Examples. <br />
                <span className="text-glow-purple text-gradient-purple-blue">
                  Customization In Action.
                </span>
              </h3>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-[#9898A6] leading-relaxed">
              Every environment has its own visual identity and customer questions, while Emperor Nexus
              remains the connecting commercial intelligence engine.
            </p>
          </div>

          {/* 4 Architectural Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BUSINESS_EXAMPLES.map((ex) => {
              const Icon = ex.icon;
              return (
                <div
                  key={ex.id}
                  className="group relative rounded-3xl glass-panel glass-panel-hover overflow-hidden flex flex-col justify-between cursor-pointer border border-white/[0.08] hover:border-[#963DFF]/40"
                  onClick={() => onOpenExperience?.(ex.id)}
                >
                  {/* Top Image Banner */}
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black/40">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${ex.img}'), ${ex.fallbackBg}`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-black/20 to-transparent" />

                    {/* Category Pill Tag */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                      <Icon className="w-3.5 h-3.5 text-[#C28AFF]" />
                      <span>{ex.category}</span>
                    </div>

                    {/* Metric Tag */}
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                      {ex.metrics}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-bold text-xl sm:text-2xl text-white group-hover:text-[#F5F5F7] transition-colors">
                        {ex.name}
                      </h4>
                      <p className="mt-2 text-xs sm:text-sm text-[#9898A6] leading-relaxed">
                        {ex.subtitle}
                      </p>

                      {/* Sample Customer Question Block */}
                      <div className="mt-6 p-4 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#C28AFF] tracking-wider block">
                          Sample Customer Question Handled:
                        </span>
                        <p className="text-xs sm:text-sm text-[#F5F5F7] italic font-medium">
                          "{ex.sampleQuestion}"
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#9898A6]">
                        {ex.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenExperience?.(ex.id);
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
      </div>
    </section>
  );
}
