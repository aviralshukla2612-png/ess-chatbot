"use client";

import React from "react";

export default function KineticMarquee({ items, direction = "left", speed = "35s" }) {
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className="relative w-full overflow-hidden py-4 border-y border-neutral-900 bg-black/60 backdrop-blur-sm select-none">
      {/* Edge gradient mask for smooth fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div
        className={`flex whitespace-nowrap gap-12 text-xs font-mono uppercase tracking-[0.25em] font-semibold text-neutral-400 ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
        style={{ animationDuration: speed }}
      >
        {repeatedItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 shrink-0 group">
            <span className="group-hover:text-[#D2FF00] transition-colors">{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D2FF00]/60 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
