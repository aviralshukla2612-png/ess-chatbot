import React, { useState, useEffect } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export default function Navbar({ onOpenTrial }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Industries", href: "#industries" },
    { label: "Benefits", href: "#benefits" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setActiveItem(item.label);
    setMobileMenuOpen(false);
    const target = document.querySelector(item.href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-white/[0.04]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Emperor Nexus Brand Logo */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, { label: "Home", href: "#home" })}
          className="group flex items-center gap-3 cursor-pointer"
        >
          {/* Logo Mark: Stylized geometric Emperor chevron */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#963DFF]/30 to-[#55A9FF]/20 blur-sm group-hover:blur-md transition-all" />
            <svg
              className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 28L18 8H26L16 28H8Z"
                fill="#FFFFFF"
              />
              <path
                d="M17 28L27 8H33L23 28H17Z"
                fill="url(#logo-grad)"
              />
              <defs>
                <linearGradient id="logo-grad" x1="17" y1="8" x2="33" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#C28AFF" />
                  <stop offset="1" stopColor="#55A9FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-[0.14em] text-white uppercase leading-none group-hover:text-white transition-colors">
              EMPEROR
            </span>
            <span className="text-[9px] font-semibold tracking-[0.24em] text-[#9898A6] uppercase mt-1 leading-none group-hover:text-[#D9D9E2] transition-colors">
              SMART SOLUTIONS
            </span>
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => {
            const isActive = activeItem === item.label;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`relative py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? "text-white font-semibold" : "text-[#D9D9E2] hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#963DFF] to-[#C28AFF] shadow-[0_0_12px_rgba(150,61,255,0.8)]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Primary CTA Button */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenTrial}
            className="group relative inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold text-white btn-primary-gradient cursor-pointer overflow-hidden transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Start Free Trial
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#D9D9E2] hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0B10]/95 backdrop-blur-2xl border-b border-white/[0.08] px-6 py-6 space-y-4 animate-fade-in">
          {navLinks.map((item) => {
            const isActive = activeItem === item.label;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`block py-2 text-base font-semibold transition-colors ${
                  isActive ? "text-[#C28AFF]" : "text-[#D9D9E2] hover:text-white"
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrial?.();
              }}
              className="w-full py-3 rounded-full text-sm font-bold text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Free Trial
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
