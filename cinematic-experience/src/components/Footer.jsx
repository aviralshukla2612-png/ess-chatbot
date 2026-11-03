import React from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="relative bg-[#050507] border-t border-white/[0.08] text-white pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#963DFF]/50 to-transparent" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#963DFF]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Info (2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center">
              <img
                src="/emperor_nexus_sales_ai_assistant.png"
                alt="Emperor Nexus — Sales AI Assistant"
                className="h-10 sm:h-11 w-auto object-contain hover:scale-105 transition-all duration-300 cursor-pointer drop-shadow-[0_0_20px_rgba(150,61,255,0.35)]"
              />
            </div>

            <p className="text-xs sm:text-sm text-[#9898A6] max-w-sm leading-relaxed">
              Autonomous AI sales assistants and commercial intelligence for modern enterprises.
              Answering every customer question, qualifying pipeline opportunities, and accelerating revenue 24/7.
            </p>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational (99.98% SLA)</span>
            </div>
          </div>

          {/* Solutions Column */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Verticals
            </span>
            <ul className="space-y-2.5 text-xs text-[#9898A6]">
              <li><a href="#industries" className="hover:text-white transition-colors">Real Estate & Developers</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">Healthcare & Clinical</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">Education & Admissions</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">Luxury Hospitality & Resorts</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">High-Ticket Retail & E-com</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">B2B SaaS & Financial</a></li>
            </ul>
          </div>

          {/* Platform Column */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Platform
            </span>
            <ul className="space-y-2.5 text-xs text-[#9898A6]">
              <li><a href="#benefits" className="hover:text-white transition-colors">Vector Knowledge Base</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">19 Launcher Animations</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Automated CRM Scoring</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">One-Line Script Embed</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Matrix</a></li>
              <li><a href="/login" className="hover:text-white transition-colors flex items-center gap-1">Client Portal <ArrowUpRight className="w-3 h-3" /></a></li>
            </ul>
          </div>

          {/* Compliance Column */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Governance & Trust
            </span>
            <ul className="space-y-2.5 text-xs text-[#9898A6]">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Multi-Tenant Isolation</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Data Training Leakage</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SOC 2 Type II Certified</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> GDPR & CCPA Compliant</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bank-Grade Encryption</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9898A6]">
          <p>© {currentYear} Emperor Smart Solutions. All rights reserved. Emperor Nexus AI.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Whitepaper</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
