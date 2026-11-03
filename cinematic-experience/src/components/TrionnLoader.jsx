import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * TrionnLoader — Inspired by Trionn.com's award-winning preloader.
 * Features:
 * - 4 spinning crosshair / plus marks flying from screen corners
 * - Centered box reveal with spring physics
 * - High-tech perimeter SVG drawing border
 * - Synchronized corner plus spin on boundary completion
 * - Slot reel / percentage ticker counting 0 -> 100%
 * - Staggered tagline words
 * - Embedded 4K video playing smoothly inside the box
 * - Full-viewport expansion wipe into the dark luxury landing page
 */
export default function TrionnLoader({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const containerRef = useRef(null);
  const boxWrapRef = useRef(null);
  const videoRef = useRef(null);
  const borderRectRef = useRef(null);
  const counterRef = useRef(null);
  const taglineRef = useRef(null);

  // Flying plus refs (from screen corners)
  const flyTlRef = useRef(null);
  const flyTrRef = useRef(null);
  const flyBlRef = useRef(null);
  const flyBrRef = useRef(null);

  // Corner plus refs (attached to box)
  const cornerTlRef = useRef(null);
  const cornerTrRef = useRef(null);
  const cornerBlRef = useRef(null);
  const cornerBrRef = useRef(null);

  // Tagline word refs
  const word1Ref = useRef(null);
  const word2Ref = useRef(null);
  const word3Ref = useRef(null);
  const dot1Ref = useRef(null);
  const dot2Ref = useRef(null);

  useEffect(() => {
    // 1. Lock body scroll during preloader
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = prevOverflow || "auto";
          if (onComplete) onComplete();
        },
      });

      // Initial element state
      gsap.set(boxWrapRef.current, {
        scale: 0.6,
        opacity: 0,
        borderRadius: "20px",
      });

      gsap.set(
        [
          flyTlRef.current,
          flyTrRef.current,
          flyBlRef.current,
          flyBrRef.current,
        ],
        { opacity: 1, scale: 1 }
      );

      gsap.set(
        [
          cornerTlRef.current,
          cornerTrRef.current,
          cornerBlRef.current,
          cornerBrRef.current,
        ],
        { opacity: 0 }
      );

      gsap.set([word1Ref.current, word2Ref.current, word3Ref.current], {
        opacity: 0,
        y: 8,
      });
      gsap.set([dot1Ref.current, dot2Ref.current], { opacity: 0 });

      if (borderRectRef.current) {
        borderRectRef.current.style.strokeDashoffset = "1";
      }

      // Try autoplaying video
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }

      // --- STAGE 1: Flying plus icons converge from screen margins (0.0s -> 0.8s) ---
      tl.to(flyTlRef.current, {
        x: () => window.innerWidth * 0.35,
        y: () => window.innerHeight * 0.35,
        rotation: 720,
        duration: 0.85,
        ease: "power3.inOut",
      }, 0);

      tl.to(flyTrRef.current, {
        x: () => -window.innerWidth * 0.35,
        y: () => window.innerHeight * 0.35,
        rotation: -720,
        duration: 0.85,
        ease: "power3.inOut",
      }, 0);

      tl.to(flyBlRef.current, {
        x: () => window.innerWidth * 0.35,
        y: () => -window.innerHeight * 0.35,
        rotation: -720,
        duration: 0.85,
        ease: "power3.inOut",
      }, 0);

      tl.to(flyBrRef.current, {
        x: () => -window.innerWidth * 0.35,
        y: () => -window.innerHeight * 0.35,
        rotation: 720,
        duration: 0.85,
        ease: "power3.inOut",
      }, 0);

      // --- STAGE 2: Box reveals with spring bounce & corner plus handoff (0.75s) ---
      tl.to(boxWrapRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: "back.out(1.5)",
      }, 0.75);

      tl.to(
        [
          flyTlRef.current,
          flyTrRef.current,
          flyBlRef.current,
          flyBrRef.current,
        ],
        {
          opacity: 0,
          duration: 0.2,
          ease: "power1.out",
        },
        0.8
      );

      tl.to(
        [
          cornerTlRef.current,
          cornerTrRef.current,
          cornerBlRef.current,
          cornerBrRef.current,
        ],
        {
          opacity: 1,
          duration: 0.25,
          ease: "power1.in",
        },
        0.85
      );

      // --- STAGE 3: Perimeter Stroke Draw + Counter + Taglines (0.9s -> 3.1s) ---
      const progressObj = { value: 0 };
      let lastSpun = { tl: false, tr: false, br: false, bl: false };

      tl.to(progressObj, {
        value: 100,
        duration: 2.2,
        ease: "power1.inOut",
        onUpdate: () => {
          const val = Math.round(progressObj.value);
          setPercent(val);

          // Update SVG stroke-dashoffset
          if (borderRectRef.current) {
            borderRectRef.current.style.strokeDashoffset = String(
              1 - progressObj.value / 100
            );
          }

          // Spin corners as stroke hits each corner
          if (progressObj.value >= 25 && !lastSpun.tr) {
            lastSpun.tr = true;
            gsap.to(cornerTrRef.current, { rotation: "+=360", duration: 0.45, ease: "power2.out" });
          }
          if (progressObj.value >= 50 && !lastSpun.br) {
            lastSpun.br = true;
            gsap.to(cornerBrRef.current, { rotation: "+=360", duration: 0.45, ease: "power2.out" });
          }
          if (progressObj.value >= 75 && !lastSpun.bl) {
            lastSpun.bl = true;
            gsap.to(cornerBlRef.current, { rotation: "+=360", duration: 0.45, ease: "power2.out" });
          }
          if (progressObj.value >= 98 && !lastSpun.tl) {
            lastSpun.tl = true;
            gsap.to(cornerTlRef.current, { rotation: "+=360", duration: 0.45, ease: "power2.out" });
          }
        },
      }, 0.9);

      // Tagline reveals
      tl.to(word1Ref.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 1.1);
      tl.to(dot1Ref.current, { opacity: 0.6, duration: 0.3 }, 1.3);
      tl.to(word2Ref.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 1.5);
      tl.to(dot2Ref.current, { opacity: 0.6, duration: 0.3 }, 1.7);
      tl.to(word3Ref.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 1.9);

      // --- STAGE 4: Fade Sub-elements & Expand Box Fullscreen (3.2s -> 4.0s) ---
      tl.to(
        [counterRef.current, taglineRef.current],
        {
          opacity: 0,
          y: -12,
          duration: 0.35,
          ease: "power2.in",
        },
        3.15
      );

      // Fade out the SVG border
      if (borderRectRef.current) {
        tl.to(borderRectRef.current, { opacity: 0, duration: 0.25 }, 3.2);
      }

      // Corner plus signs push outwards and fade
      tl.to(
        cornerTlRef.current,
        { x: -120, y: -120, opacity: 0, duration: 0.65, ease: "power3.in" },
        3.25
      );
      tl.to(
        cornerTrRef.current,
        { x: 120, y: -120, opacity: 0, duration: 0.65, ease: "power3.in" },
        3.25
      );
      tl.to(
        cornerBlRef.current,
        { x: -120, y: 120, opacity: 0, duration: 0.65, ease: "power3.in" },
        3.25
      );
      tl.to(
        cornerBrRef.current,
        { x: 120, y: 120, opacity: 0, duration: 0.65, ease: "power3.in" },
        3.25
      );

      // Expansion Wipe: Box scales up to 100vw x 100vh
      tl.to(
        boxWrapRef.current,
        {
          width: "100vw",
          height: "100dvh",
          maxWidth: "100vw",
          maxHeight: "100dvh",
          borderRadius: "0px",
          duration: 0.85,
          ease: "power4.inOut",
        },
        3.2
      );

      // Turn background of the whole screen to obsidian black
      tl.to(
        containerRef.current,
        {
          backgroundColor: "#050507",
          duration: 0.5,
          ease: "power2.inOut",
        },
        3.4
      );

      // --- STAGE 5: Curtain Dissolve into Landing Page (4.05s -> 4.55s) ---
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        },
        4.05
      );
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = prevOverflow || "auto";
    };
  }, [onComplete]);

  // Plus crosshair SVG (Trionn design)
  const renderPlus = () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      <line x1="6.5" y1="0" x2="6.5" y2="13" stroke="#444444" strokeWidth="1.2" />
      <line x1="13" y1="6.5" x2="0" y2="6.5" stroke="#444444" strokeWidth="1.2" />
    </svg>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-[#CECED4] flex flex-col items-center justify-center select-none pointer-events-auto"
      style={{ willChange: "opacity, background-color" }}
    >
      {/* 4 Initial Flying Plus marks positioned near screen edges */}
      <div
        ref={flyTlRef}
        className="fixed top-12 left-12 z-50 pointer-events-none will-change-transform"
      >
        {renderPlus()}
      </div>
      <div
        ref={flyTrRef}
        className="fixed top-12 right-12 z-50 pointer-events-none will-change-transform"
      >
        {renderPlus()}
      </div>
      <div
        ref={flyBlRef}
        className="fixed bottom-12 left-12 z-50 pointer-events-none will-change-transform"
      >
        {renderPlus()}
      </div>
      <div
        ref={flyBrRef}
        className="fixed bottom-12 right-12 z-50 pointer-events-none will-change-transform"
      >
        {renderPlus()}
      </div>

      {/* Main Center Box Wrap (Trionn aspect ratio and dimensions) */}
      <div
        ref={boxWrapRef}
        className="relative w-[260px] xs:w-[280px] sm:w-[320px] md:w-[360px] aspect-[4/5] max-w-[90vw] max-h-[70vh] flex items-center justify-center overflow-hidden shadow-2xl bg-[#09090D] border border-black/10"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 40px rgba(150, 61, 255, 0.15)",
        }}
      >
        {/* User's 4K Loader Video playing smoothly */}
        <video
          ref={videoRef}
          src="/loader_video.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-700 hover:scale-105"
        />

        {/* Trionn SVG Perimeter Drawing Border */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          style={{ willChange: "stroke-dashoffset, opacity" }}
        >
          <rect
            ref={borderRectRef}
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            fill="none"
            stroke="#434343"
            strokeWidth="1.75"
            strokeDasharray="1"
            strokeDashoffset="1"
            pathLength="1"
            rx="20"
          />
        </svg>

        {/* 4 Corner Plus Marks attached to Box Corners */}
        <div
          ref={cornerTlRef}
          className="absolute -top-[6.5px] -left-[6.5px] z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
        <div
          ref={cornerTrRef}
          className="absolute -top-[6.5px] -right-[6.5px] z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
        <div
          ref={cornerBlRef}
          className="absolute -bottom-[6.5px] -left-[6.5px] z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
        <div
          ref={cornerBrRef}
          className="absolute -bottom-[6.5px] -right-[6.5px] z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
      </div>

      {/* Tagline Words Underneath (Trionn Style) */}
      <div
        ref={taglineRef}
        className="flex items-center justify-center gap-1.5 mt-8 font-mono text-[11px] sm:text-xs tracking-[0.28em] uppercase font-bold text-[#2A2A30] z-20"
      >
        <span ref={word1Ref}>INTELLIGENCE</span>
        <span ref={dot1Ref} className="text-[#666] font-normal">·</span>
        <span ref={word2Ref}>AUTONOMY</span>
        <span ref={dot2Ref} className="text-[#666] font-normal">·</span>
        <span ref={word3Ref}>REVENUE</span>
      </div>

      {/* Percentage Rolling Counter (Bottom Center) */}
      <div
        ref={counterRef}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-baseline gap-1 font-mono font-bold text-sm tracking-widest text-[#333339] z-20 select-none"
      >
        <span className="text-base text-[#111115]">
          {percent < 10 ? `00${percent}` : percent < 100 ? `0${percent}` : percent}
        </span>
        <span className="text-xs text-[#555]">%</span>
      </div>
    </div>
  );
}
