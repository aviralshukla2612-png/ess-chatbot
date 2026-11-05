import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";

export default function Navbar({ onOpenTrial }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Home");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef(null);
  const linkRefs = useRef({});

  useEffect(() => {
    const updateIndicator = () => {
      const current = hoveredItem || activeItem;
      const el = linkRefs.current[current];
      if (el) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const t = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeItem, hoveredItem]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Dynamically detect which of the 5 sections is currently active
      const sections = [
        { label: "Home", id: "home" },
        { label: "Industries", id: "industries" },
        { label: "Benefits", id: "benefits" },
        { label: "How It Works", id: "how-it-works" },
        { label: "Pricing", id: "pricing" },
      ];

      const scrollPos = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveItem(sections[i].label);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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
      const isPinnedSection =
        item.href === "#industries" ||
        item.href === "#benefits" ||
        item.href === "#how-it-works";
      const topOffset = isPinnedSection
        ? target.getBoundingClientRect().top + window.scrollY
        : target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
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
        {/* Left: Emperor Nexus Brand Logo - 100% Full Vibrant Color */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, { label: "Home", href: "#home" })}
          className="group relative flex items-center cursor-pointer focus:outline-none"
          aria-label="Emperor Nexus Home"
        >
          <img
            src="/logo.png"
            alt="Emperor Nexus — Sales AI Assistant"
            className="h-10 sm:h-11 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_20px_rgba(150,61,255,0.35)]"
          />
        </a>

        {/* Center: Desktop Navigation Links with Moving Sliding Indicator */}
        <nav
          ref={navRef}
          onMouseLeave={() => setHoveredItem(null)}
          className="relative hidden md:flex items-center gap-8 py-2"
        >
          {navLinks.map((item) => {
            const isActive = activeItem === item.label;
            const isHovered = hoveredItem === item.label;
            return (
              <a
                key={item.label}
                ref={(el) => (linkRefs.current[item.label] = el)}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                onMouseEnter={() => setHoveredItem(item.label)}
                className={`relative py-1 text-sm font-medium transition-colors cursor-pointer select-none ${
                  isActive || isHovered ? "text-white font-semibold" : "text-[#D9D9E2] hover:text-white"
                }`}
              >
                <span>{item.label}</span>
              </a>
            );
          })}

          {/* Smooth Sliding Underline Indicator with Glowing Purple Aura */}
          <span
            className="absolute bottom-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#963DFF] via-[#B86BFF] to-[#C28AFF] shadow-[0_0_12px_rgba(150,61,255,0.95)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />
          {/* Subtle ambient light glow underneath */}
          <span
            className="absolute bottom-[-1px] h-[6px] rounded-full bg-[#963DFF]/35 blur-[3px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />
        </nav>

        {/* Right: Dashboard CTA Button linking to /login */}
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="group relative inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold text-white btn-primary-gradient cursor-pointer overflow-hidden transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Dashboard
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </a>
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
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full text-sm font-bold text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
