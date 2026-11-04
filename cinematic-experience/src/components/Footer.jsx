import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 13 Vector glyph paths for "EMPEROR NEXUS ✦" generated for pixel-perfect edge-to-edge scaling
const FOOTER_LETTERS = [
  {
    "char": "E",
    "d": "M106.47 215L28.38 215L28.38 25.94L104.00 25.94L104.00 62.46L66.84 62.46L66.84 99.31L102.50 99.31L102.50 134.86L66.84 134.86L66.84 178.15L106.47 178.15L106.47 215Z",
    "bbox": {
      "x1": 28,
      "y1": 26,
      "x2": 106,
      "y2": 215,
      "cx": 67,
      "cy": 120,
      "w": 78,
      "h": 189
    }
  },
  {
    "char": "M",
    "d": "M161.10 215L126.94 215L126.94 25.94L184.51 25.94L200.41 141.20L216.20 25.94L274.32 25.94L274.32 215L239.73 215L239.73 78.79L218.03 215L184.08 215L161.10 78.79L161.10 215Z",
    "bbox": {
      "x1": 127,
      "y1": 26,
      "x2": 274,
      "y2": 215,
      "cx": 201,
      "cy": 120,
      "w": 147,
      "h": 189
    }
  },
  {
    "char": "P",
    "d": "M336.24 215L299.08 215L299.08 25.94L349.03 25.94Q364.71 25.94 373.90 32.92Q383.08 39.90 387.05 52.79Q391.03 65.68 391.03 83.52L391.03 83.52Q391.03 100.70 387.70 113.43Q384.37 126.16 375.83 133.14Q367.29 140.13 351.61 140.13L351.61 140.13L336.24 140.13L336.24 215ZM336.24 60.42L336.24 106.18L338.39 106.18Q348.92 106.18 351.28 100.27Q353.65 94.37 353.65 82.87L353.65 82.87Q353.65 72.13 351.34 66.27Q349.03 60.42 340.43 60.42L340.43 60.42L336.24 60.42Z",
    "bbox": {
      "x1": 299,
      "y1": 26,
      "x2": 391,
      "y2": 215,
      "cx": 345,
      "cy": 120,
      "w": 92,
      "h": 189
    }
  },
  {
    "char": "E",
    "d": "M489.05 215L410.95 215L410.95 25.94L486.58 25.94L486.58 62.46L449.41 62.46L449.41 99.31L485.07 99.31L485.07 134.86L449.41 134.86L449.41 178.15L489.05 178.15L489.05 215Z",
    "bbox": {
      "x1": 411,
      "y1": 26,
      "x2": 489,
      "y2": 215,
      "cx": 450,
      "cy": 120,
      "w": 78,
      "h": 189
    }
  },
  {
    "char": "R",
    "d": "M547.75 215L509.51 215L509.51 25.94L567.52 25.94Q582.02 25.94 589.43 32.54Q596.84 39.15 599.37 51.02Q601.89 62.89 601.89 78.90L601.89 78.90Q601.89 94.37 597.97 103.60Q594.05 112.84 583.20 116.39L583.20 116.39Q592.12 118.21 595.72 125.25Q599.31 132.29 599.31 143.46L599.31 143.46L599.31 215L562.04 215L562.04 140.99Q562.04 132.71 558.66 130.73Q555.27 128.74 547.75 128.74L547.75 128.74L547.75 215ZM547.97 60.96L547.97 95.98L557.10 95.98Q564.94 95.98 564.94 78.90L564.94 78.90Q564.94 67.83 563.22 64.39Q561.50 60.96 556.78 60.96L556.78 60.96L547.97 60.96Z",
    "bbox": {
      "x1": 510,
      "y1": 26,
      "x2": 602,
      "y2": 215,
      "cx": 556,
      "cy": 120,
      "w": 92,
      "h": 189
    }
  },
  {
    "char": "O",
    "d": "M667.47 216.72L667.47 216.72Q644.80 216.72 632.83 203.02Q620.85 189.33 620.85 163.44L620.85 163.44L620.85 73.63Q620.85 49.36 632.72 36.79Q644.59 24.22 667.47 24.22L667.47 24.22Q690.35 24.22 702.22 36.79Q714.09 49.36 714.09 73.63L714.09 73.63L714.09 163.44Q714.09 189.33 702.11 203.02Q690.14 216.72 667.47 216.72ZM667.79 181.91L667.79 181.91Q676.39 181.91 676.39 165.26L676.39 165.26L676.39 72.99Q676.39 59.02 668.01 59.02L668.01 59.02Q658.55 59.02 658.55 73.31L658.55 73.31L658.55 165.48Q658.55 174.29 660.70 178.10Q662.85 181.91 667.79 181.91Z",
    "bbox": {
      "x1": 621,
      "y1": 24,
      "x2": 714,
      "y2": 217,
      "cx": 667,
      "cy": 120,
      "w": 93,
      "h": 193
    }
  },
  {
    "char": "R",
    "d": "M775.59 215L737.35 215L737.35 25.94L795.35 25.94Q809.86 25.94 817.27 32.54Q824.68 39.15 827.20 51.02Q829.73 62.89 829.73 78.90L829.73 78.90Q829.73 94.37 825.81 103.60Q821.89 112.84 811.04 116.39L811.04 116.39Q819.95 118.21 823.55 125.25Q827.15 132.29 827.15 143.46L827.15 143.46L827.15 215L789.88 215L789.88 140.99Q789.88 132.71 786.49 130.73Q783.11 128.74 775.59 128.74L775.59 128.74L775.59 215ZM775.80 60.96L775.80 95.98L784.93 95.98Q792.78 95.98 792.78 78.90L792.78 78.90Q792.78 67.83 791.06 64.39Q789.34 60.96 784.61 60.96L784.61 60.96L775.80 60.96Z",
    "bbox": {
      "x1": 737,
      "y1": 26,
      "x2": 830,
      "y2": 215,
      "cx": 784,
      "cy": 120,
      "w": 92,
      "h": 189
    }
  },
  {
    "char": "N",
    "d": "M964.14 215L927.19 215L927.19 25.94L966.08 25.94L983.48 116.49L983.48 25.94L1020.00 25.94L1020.00 215L983.05 215L964.14 120.47L964.14 215Z",
    "bbox": {
      "x1": 927,
      "y1": 26,
      "x2": 1020,
      "y2": 215,
      "cx": 974,
      "cy": 120,
      "w": 93,
      "h": 189
    }
  },
  {
    "char": "E",
    "d": "M1122.86 215L1044.76 215L1044.76 25.94L1120.38 25.94L1120.38 62.46L1083.22 62.46L1083.22 99.31L1118.88 99.31L1118.88 134.86L1083.22 134.86L1083.22 178.15L1122.86 178.15L1122.86 215Z",
    "bbox": {
      "x1": 1045,
      "y1": 26,
      "x2": 1123,
      "y2": 215,
      "cx": 1084,
      "cy": 120,
      "w": 78,
      "h": 189
    }
  },
  {
    "char": "X",
    "d": "M1176.19 215L1137.84 215L1158.14 114.78L1142.03 25.83L1178.98 25.83L1188.76 90.82L1197.46 25.83L1234.52 25.83L1218.40 114.78L1238.60 215L1200.36 215L1188.43 141.09L1176.19 215Z",
    "bbox": {
      "x1": 1138,
      "y1": 26,
      "x2": 1239,
      "y2": 215,
      "cx": 1188,
      "cy": 120,
      "w": 101,
      "h": 189
    }
  },
  {
    "char": "U",
    "d": "M1301.49 216.72L1301.49 216.72Q1277.86 216.72 1266.69 203.45Q1255.52 190.19 1255.52 164.40L1255.52 164.40L1255.52 25.94L1292.25 25.94L1292.25 162.90Q1292.25 167.63 1292.79 171.98Q1293.33 176.33 1295.26 179.12Q1297.20 181.91 1301.49 181.91L1301.49 181.91Q1305.90 181.91 1307.83 179.17Q1309.76 176.44 1310.25 172.03Q1310.73 167.63 1310.73 162.90L1310.73 162.90L1310.73 25.94L1347.47 25.94L1347.47 164.40Q1347.47 190.19 1336.30 203.45Q1325.13 216.72 1301.49 216.72Z",
    "bbox": {
      "x1": 1256,
      "y1": 26,
      "x2": 1347,
      "y2": 217,
      "cx": 1301,
      "cy": 121,
      "w": 92,
      "h": 191
    }
  },
  {
    "char": "S",
    "d": "M1414.87 216.72L1414.87 216.72Q1388.98 216.72 1377.54 203.83Q1366.10 190.94 1366.10 162.79L1366.10 162.79L1366.10 144.32L1403.49 144.32L1403.49 167.95Q1403.49 174.50 1405.47 178.21Q1407.46 181.91 1412.40 181.91L1412.40 181.91Q1417.56 181.91 1419.55 178.91Q1421.53 175.90 1421.53 169.02L1421.53 169.02Q1421.53 160.32 1419.81 154.47Q1418.10 148.61 1413.85 143.30Q1409.61 137.98 1402.09 130.89L1402.09 130.89L1385.12 114.78Q1366.10 96.84 1366.10 73.74L1366.10 73.74Q1366.10 49.57 1377.33 36.89Q1388.55 24.22 1409.82 24.22L1409.82 24.22Q1435.82 24.22 1446.72 38.08Q1457.63 51.93 1457.63 80.19L1457.63 80.19L1419.17 80.19L1419.17 67.19Q1419.17 63.32 1416.97 61.17Q1414.77 59.02 1411.01 59.02L1411.01 59.02Q1406.49 59.02 1404.40 61.55Q1402.30 64.07 1402.30 68.05L1402.30 68.05Q1402.30 72.02 1404.45 76.64Q1406.60 81.26 1412.94 87.28L1412.94 87.28L1434.75 108.22Q1441.30 114.45 1446.78 121.38Q1452.26 128.31 1455.59 137.50Q1458.92 146.68 1458.92 159.89L1458.92 159.89Q1458.92 186.53 1449.09 201.63Q1439.26 216.72 1414.87 216.72Z",
    "bbox": {
      "x1": 1366,
      "y1": 24,
      "x2": 1459,
      "y2": 217,
      "cx": 1413,
      "cy": 120,
      "w": 93,
      "h": 193
    }
  }
];
const VIEWBOX = "0 0 1485 250";

export default function Footer() {
  const footerRef = useRef(null);
  const svgRef = useRef(null);
  const pathRefs = useRef([]);

  useEffect(() => {
    const footer = footerRef.current;
    const svg = svgRef.current;
    if (!footer || !svg) return;

    const ctx = gsap.context(() => {
      const paths = pathRefs.current.filter(Boolean);
      if (!paths.length) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Set transformBox & transformOrigin around center of each letter
      paths.forEach((p) => {
        gsap.set(p, {
          transformBox: "fill-box",
          transformOrigin: "50% 50%",
        });
      });

      if (prefersReducedMotion) {
        gsap.set(paths, { autoAlpha: 1, yPercent: 0, scale: 1 });
        return;
      }

      // 1. Initial State: letters concealed below
      gsap.set(paths, { autoAlpha: 1, yPercent: 120 });

      // 2. Entrance Animation: Triggers when the Footer reaches view
      ScrollTrigger.create({
        trigger: footer,
        start: "top 80%",
        once: true,
        onEnter: () => {
          // Organic random shuffle stagger identical to noth.in SOTD
          const shuffled = paths.slice().sort(() => Math.random() - 0.5);

          gsap.fromTo(
            shuffled,
            { autoAlpha: 1, yPercent: 120 },
            {
              yPercent: 0,
              duration: 1.25,
              ease: "power4.inOut",
              stagger: 0.035,
              delay: 0.15,
            }
          );
        },
      });

      // 3. noth.in Signature Interaction: Elastic Jelly Bounce on Mouse Enter
      paths.forEach((p) => {
        let isAnimating = false;
        const handleMouseEnter = () => {
          if (isAnimating) return;
          isAnimating = true;
          gsap
            .timeline({
              onComplete: () => {
                isAnimating = false;
              },
            })
            .to(p, {
              scale: 0.05,
              duration: 0.55,
              ease: "power2.inOut",
            })
            .to(p, {
              scale: 1,
              duration: 1.8,
              ease: "elastic.out(1, 0.75)",
            });
        };

        p.addEventListener("mouseenter", handleMouseEnter);
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="footer"
      ref={footerRef}
      className="relative bg-[#000000] text-white pt-12 sm:pt-16 pb-8 sm:pb-12 px-6 sm:px-12 lg:px-16 overflow-hidden min-h-screen flex flex-col justify-between selection:bg-[#963DFF] selection:text-white"
    >
      {/* Subtle top divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.08]" />

      <div className="max-w-[1600px] w-full mx-auto flex flex-col justify-between flex-1">
        {/* ========================================================================= */}
        {/* 1. TOP SECTION: Headline, Actions & Links (noth.in style)                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 sm:gap-12 pt-2 pb-6 sm:pb-10">
          {/* Left: Brand + Headline + Interactive Action Pills */}
          <div className="max-w-3xl space-y-6">
            {/* Emperor Nexus Logo: B&W by default, color on hover */}
            <div className="group relative inline-flex items-center cursor-pointer">
              <img
                src="/emperor_nexus_sales_ai_assistant_original.png"
                alt="Emperor Nexus — Sales AI Assistant"
                className="h-10 sm:h-11 w-auto object-contain filter grayscale contrast-125 opacity-70 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 group-hover:drop-shadow-[0_0_20px_rgba(150,61,255,0.45)] cursor-pointer"
              />
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.06]">
              Let’s start <br />
              with Emperor Nexus.
            </h2>

            {/* Pill CTA Buttons identical to noth.in */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="mailto:contact@vardaansmartsolutions.com?subject=Book%20a%20Call%20-%20Emperor%20Nexus"
                className="group inline-flex items-center gap-4 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/30 text-xs sm:text-sm font-semibold uppercase tracking-widest text-white hover:border-white hover:bg-white hover:text-black transition-all duration-300"
              >
                <span>Book a call</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>

              <a
                href="mailto:contact@vardaansmartsolutions.com"
                className="group inline-flex items-center gap-4 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/30 text-xs sm:text-sm font-semibold uppercase tracking-widest text-white hover:border-white hover:bg-white hover:text-black transition-all duration-300"
              >
                <span>Drop us an email</span>
                <span className="font-mono text-base">@</span>
              </a>
            </div>
          </div>

          {/* Right: Editorial Links */}
          <div className="flex flex-col items-start md:items-end space-y-3 pt-2">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl sm:text-3xl font-medium text-white/80 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              Linkedin
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl sm:text-3xl font-medium text-white/80 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              Twitter / X
            </a>
            <a
              href="/login"
              className="text-2xl sm:text-3xl font-medium text-white/80 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
            >
              Client Portal <ArrowUpRight className="w-5 h-5 text-white/50" />
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MASSIVE CENTERPIECE: Screen-filling vector "EMPEROR NEXUS ✦" with       */}
        {/*    noth.in's scroll reveal and interactive elastic hover bounce            */}
        {/* ========================================================================= */}
        <div className="w-full my-auto py-6 sm:py-10 overflow-hidden footer-svg-w">
          <svg
            ref={svgRef}
            viewBox={VIEWBOX}
            fill="none"
            className="w-full h-auto max-h-[38vh] overflow-visible text-white select-none cursor-pointer"
          >
            {FOOTER_LETTERS.map((item, idx) => (
              <path
                key={idx}
                ref={(el) => (pathRefs.current[idx] = el)}
                d={item.d}
                fill="currentColor"
                className={`footer-letter-path will-change-transform transition-colors duration-200 ${
                  item.isAccent
                    ? "text-[#963DFF] hover:text-[#C28AFF]"
                    : "text-white hover:text-[#D8B4FE]"
                }`}
              />
            ))}
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM INFO BAR: Copyright and Section Navigation                       */}
        {/* ========================================================================= */}
        <div className="w-full pt-6 sm:pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#9898A6]">
          {/* Left: Brand Copyright */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center md:text-left">
            <span>© 2026 — Emperor Smart Solutions — Enterprise Autonomous AI</span>
          </div>

          {/* Right: Quick Links */}
          <div className="flex items-center gap-6 font-bold tracking-wider text-white text-[11px] sm:text-xs">
            <a href="#home" className="hover:text-[#963DFF] transition-colors">HOME</a>
            <a href="#industries" className="hover:text-[#963DFF] transition-colors">INDUSTRIES</a>
            <a href="#benefits" className="hover:text-[#963DFF] transition-colors">BENEFITS</a>
            <a href="#how-it-works" className="hover:text-[#963DFF] transition-colors">HOW IT WORKS</a>
            <a href="#pricing" className="hover:text-[#963DFF] transition-colors">PRICING</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
