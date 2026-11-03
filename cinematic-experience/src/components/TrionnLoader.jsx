import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * TrionnLoader — Inspired by Trionn.com's award-winning preloader.
 * Exact sequence:
 * 1. Small: Box + locked corner plus marks + logo start together small at center (scale: 0.2)
 * 2. Medium: Box scales smoothly together to medium size (scale: 1.0)
 * 3. Box line made: SVG perimeter line draws around box edges (0% -> 100%) while counter rolls to 100%
 * 4. Logo appears in full vibrancy inside the box as line is drawn
 * 5. Big: Box expands to BIG (scale: 8) covering the entire viewport, dissolving into the dark landing page
 */
export default function TrionnLoader({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const containerRef = useRef(null);
  const boxWrapRef = useRef(null);
  const logoWrapRef = useRef(null);
  const videoRef = useRef(null);
  const borderRectRef = useRef(null);
  const counterRef = useRef(null);
  const taglineRef = useRef(null);

  // 4 Corner plus refs — locked directly to the box corners
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
    // Lock scroll during preloader
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

      // 0. Initial state: Box starts SMALL
      gsap.set(boxWrapRef.current, {
        scale: 0.2,
        transformOrigin: "center center",
        opacity: 1,
      });

      gsap.set(logoWrapRef.current, {
        opacity: 0.85,
      });

      gsap.set(
        [
          cornerTlRef.current,
          cornerTrRef.current,
          cornerBlRef.current,
          cornerBrRef.current,
        ],
        {
          opacity: 1,
          scale: 1,
          rotation: -180,
        }
      );

      gsap.set([word1Ref.current, word2Ref.current, word3Ref.current], {
        opacity: 0,
        y: 6,
      });
      gsap.set([dot1Ref.current, dot2Ref.current], { opacity: 0 });

      if (borderRectRef.current) {
        borderRectRef.current.style.strokeDashoffset = "1";
      }

      // Try playing the video
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }

      // ========================================================
      // 1. SMALL -> MEDIUM SIZE (0.0s -> 0.75s)
      // Box, corner pluses and logo move together from small to medium size
      // ========================================================
      tl.to(
        boxWrapRef.current,
        {
          scale: 1,
          duration: 0.75,
          ease: "power3.out",
        },
        0
      );

      tl.to(
        [
          cornerTlRef.current,
          cornerTrRef.current,
          cornerBlRef.current,
          cornerBrRef.current,
        ],
        {
          rotation: 0,
          duration: 0.75,
          ease: "power3.out",
        },
        0
      );

      tl.to(
        logoWrapRef.current,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        0.2
      );

      // ========================================================
      // 2. BOX LINE IS MADE + COUNTER 000% -> 100% (0.75s -> 2.65s)
      // Perimeter drawing from top-left, along top, down right, across bottom, up to top-left
      // ========================================================
      const prog = { value: 0 };
      const lastSpun = { tr: false, br: false, bl: false, tl: false };

      tl.to(
        prog,
        {
          value: 100,
          duration: 1.9,
          ease: "power1.inOut",
          onUpdate: () => {
            const v = Math.round(prog.value);
            setPercent(v);

            if (borderRectRef.current) {
              borderRectRef.current.style.strokeDashoffset = String(
                1 - prog.value / 100
              );
            }

            // Spin corner plus as drawing line passes each corner
            if (prog.value >= 25 && !lastSpun.tr) {
              lastSpun.tr = true;
              gsap.to(cornerTrRef.current, {
                rotation: "+=360",
                duration: 0.45,
                ease: "power2.out",
              });
            }
            if (prog.value >= 50 && !lastSpun.br) {
              lastSpun.br = true;
              gsap.to(cornerBrRef.current, {
                rotation: "+=360",
                duration: 0.45,
                ease: "power2.out",
              });
            }
            if (prog.value >= 75 && !lastSpun.bl) {
              lastSpun.bl = true;
              gsap.to(cornerBlRef.current, {
                rotation: "+=360",
                duration: 0.45,
                ease: "power2.out",
              });
            }
            if (prog.value >= 98 && !lastSpun.tl) {
              lastSpun.tl = true;
              gsap.to(cornerTlRef.current, {
                rotation: "+=360",
                duration: 0.45,
                ease: "power2.out",
              });
            }
          },
        },
        0.75
      );

      // Tagline words appear staggered
      tl.to(word1Ref.current, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 1.0);
      tl.to(dot1Ref.current, { opacity: 0.7, duration: 0.25 }, 1.2);
      tl.to(word2Ref.current, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 1.4);
      tl.to(dot2Ref.current, { opacity: 0.7, duration: 0.25 }, 1.6);
      tl.to(word3Ref.current, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 1.8);

      // ========================================================
      // 3. AND THEN BIG LIKE THIS (2.65s -> 3.35s)
      // Box expands from medium to BIG, filling the screen with dark luxury
      // ========================================================
      // Fade tagline and bottom counter
      tl.to(
        [taglineRef.current, counterRef.current],
        {
          opacity: 0,
          y: -12,
          duration: 0.3,
          ease: "power2.in",
        },
        2.65
      );

      // Fade out the perimeter stroke
      if (borderRectRef.current) {
        tl.to(borderRectRef.current, { opacity: 0, duration: 0.2 }, 2.7);
      }

      // Corner pluses fly outward as box expands and fade
      tl.to(
        cornerTlRef.current,
        { x: -140, y: -140, opacity: 0, duration: 0.55, ease: "power3.in" },
        2.7
      );
      tl.to(
        cornerTrRef.current,
        { x: 140, y: -140, opacity: 0, duration: 0.55, ease: "power3.in" },
        2.7
      );
      tl.to(
        cornerBlRef.current,
        { x: -140, y: 140, opacity: 0, duration: 0.55, ease: "power3.in" },
        2.7
      );
      tl.to(
        cornerBrRef.current,
        { x: 140, y: 140, opacity: 0, duration: 0.55, ease: "power3.in" },
        2.7
      );

      // Box expands smoothly from medium size to BIG (scale: 8 covers viewport cleanly from center)
      tl.to(
        boxWrapRef.current,
        {
          scale: 8,
          duration: 0.65,
          ease: "power4.inOut",
        },
        2.7
      );

      // Screen turns to obsidian black
      tl.to(
        containerRef.current,
        {
          backgroundColor: "#050507",
          duration: 0.45,
          ease: "power2.inOut",
        },
        2.8
      );

      // ========================================================
      // 4. CURTAIN DISSOLVE INTO SITE (3.35s -> 3.75s)
      // ========================================================
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
        },
        3.35
      );
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = prevOverflow || "auto";
    };
  }, [onComplete]);

  // Trionn crosshair plus SVG
  const renderPlus = () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      <line x1="7.5" y1="0" x2="7.5" y2="15" stroke="#222226" strokeWidth="1.2" />
      <line x1="15" y1="7.5" x2="0" y2="7.5" stroke="#222226" strokeWidth="1.2" />
    </svg>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-[#CECED4] select-none pointer-events-auto overflow-hidden"
      style={{ willChange: "opacity, background-color" }}
    >
      {/* 
        Master Center Box Wrap — Perfectly Centered in Viewport
        Square aspect ratio matching Trionn (w: 300px, h: 300px)
        Corner pluses are locked as children so they move and scale together at all times
      */}
      <div
        ref={boxWrapRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] md:w-[330px] md:h-[330px] flex items-center justify-center bg-[#07070A] shadow-2xl"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
          transform: "translate(-50%, -50%) scale(0.2)",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* Inside: Logo / Video container that moves with the box */}
        <div
          ref={logoWrapRef}
          className="absolute inset-1 overflow-hidden flex items-center justify-center bg-[#07070A]"
        >
          <video
            ref={videoRef}
            src="/loader_video.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center pointer-events-none select-none"
          />
        </div>

        {/* 
          SVG Perimeter Drawing Border
          Starts top-left (0,0), draws across top, down right, across bottom, up to top-left
          rx="0" ensures the stroke line connects the 4 plus crosshair centers with exact precision
        */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          style={{ willChange: "stroke-dashoffset, opacity" }}
        >
          <rect
            ref={borderRectRef}
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="#222226"
            strokeWidth="1.5"
            strokeDasharray="1"
            strokeDashoffset="1"
            pathLength="1"
            rx="0"
          />
        </svg>

        {/* 
          4 Corner Pluses LOCKED to the box corners
          - top-left: top-0 left-0
          - top-right: top-0 right-0
          - bottom-left: bottom-0 left-0
          - bottom-right: bottom-0 right-0
          They move and scale WITH the box, never separating!
        */}
        <div
          ref={cornerTlRef}
          className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
        <div
          ref={cornerTrRef}
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
        <div
          ref={cornerBlRef}
          className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
        <div
          ref={cornerBrRef}
          className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 z-30 pointer-events-none"
        >
          {renderPlus()}
        </div>
      </div>

      {/* Tagline Words Underneath (Trionn Style) */}
      <div
        ref={taglineRef}
        className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 font-mono text-[11px] sm:text-xs tracking-[0.28em] uppercase font-bold text-[#222226] z-20"
      >
        <span ref={word1Ref}>INSPIRE</span>
        <span ref={dot1Ref} className="text-[#666] font-normal">·</span>
        <span ref={word2Ref}>INNOVATE</span>
        <span ref={dot2Ref} className="text-[#666] font-normal">·</span>
        <span ref={word3Ref}>IMPACT</span>
      </div>

      {/* Percentage Rolling Counter (Bottom Center) */}
      <div
        ref={counterRef}
        className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-baseline gap-1 font-mono font-bold text-sm tracking-widest text-[#222226] z-20 select-none"
      >
        <span className="text-base text-[#111115]">
          {percent < 10 ? `00${percent}` : percent < 100 ? `0${percent}` : percent}
        </span>
        <span className="text-xs text-[#555]">%</span>
      </div>
    </div>
  );
}
