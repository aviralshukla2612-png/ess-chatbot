"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function MagneticButton({
  href,
  onClick,
  children,
  variant = "primary", // "primary" (neon lime) or "outline" (dark stealth)
  className = "",
}) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) * 0.35;
    const y = (e.clientY - (top + height / 2)) * 0.35;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const isPrimary = variant === "primary";

  const buttonContent = (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: "transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={`relative inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full font-bold uppercase tracking-wider text-xs select-none overflow-hidden group cursor-pointer transition-colors duration-300 ${
        isPrimary
          ? "bg-[#D2FF00] text-black hover:bg-[#bbf000] shadow-[0_0_30px_rgba(210,255,0,0.35)] hover:shadow-[0_0_45px_rgba(210,255,0,0.6)]"
          : "bg-neutral-900/80 text-white border border-neutral-800 hover:border-[#D2FF00]/60 hover:bg-neutral-800/90 shadow-lg"
      } ${className}`}
    >
      {/* Sliding Text Roll Effect */}
      <span className="relative z-10 flex items-center gap-2 overflow-hidden h-[18px]">
        <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
          <span className="h-[18px] flex items-center leading-none">{children}</span>
          <span className="h-[18px] flex items-center leading-none text-[#D2FF00] group-hover:text-black">
            {children}
          </span>
        </span>
      </span>

      <ArrowUpRight
        className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
          isPrimary ? "text-black" : "text-[#D2FF00]"
        }`}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {buttonContent}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="inline-block bg-transparent border-0 p-0">
      {buttonContent}
    </button>
  );
}
