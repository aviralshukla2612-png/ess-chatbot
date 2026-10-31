"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Bot,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Database,
  Users2,
  MessageSquare,
  Building2,
  ChevronRight,
  Play,
  Check,
  Globe,
  Code2,
  BarChart3,
  Headphones,
  HelpCircle,
  Clock,
  ExternalLink,
  Send,
  RotateCcw,
  Briefcase,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Factory,
} from "lucide-react";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "6months" | "yearly"
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Interactive Live Chatbot Demo State
  const [chatMessages, setChatMessages] = useState([
    {
      role: "user",
      text: "I want to know about your services and pricing.",
    },
    {
      role: "bot",
      text: "Sure! Emperor Smart Solutions offers services like ERP development, web applications, and IT solutions. Here are our main services:",
      options: ["Our services", "Pricing details", "Book a demo"],
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const handlePillClick = (pillText) => {
    if (isTyping) return;
    const userMsg = { role: "user", text: pillText };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let botReply = {
        role: "bot",
        text: "",
        options: [],
      };

      if (pillText === "Our services") {
        botReply.text = "Emperor Smart Solutions provides custom software, AI/RAG assistants, web & mobile applications, and cloud DevOps solutions. All services include 100% NDA protection.";
        botReply.options = ["Pricing details", "Book a demo", "ERP modules"];
      } else if (pillText === "Pricing details" || pillText === "How much does the ERP module cost?") {
        botReply.text = "Our Website Chatbot starts at ₹999/month (1 account, 1 bot) with a 7-day free trial. Custom enterprise apps and ERP modules range from ₹50,000 to bespoke quotes.";
        botReply.options = ["ERP modules", "Talk to team", "Start free trial"];
      } else if (pillText === "Book a demo" || pillText === "Talk to team") {
        botReply.text = "You can talk directly with our engineering team via WhatsApp at +91 63591 20081 or email sales@emperorsmartsolutions.com. We respond within 24 hours!";
        botReply.options = ["Our services", "Pricing details"];
      } else if (pillText === "ERP modules") {
        botReply.text = "Our ERP pricing depends on the modules you need (Odoo, ERPNext, inventory, HR). We offer customized packages. Would you like to see a detailed quote?";
        botReply.options = ["Pricing details", "Talk to team"];
      } else if (pillText === "Start free trial") {
        botReply.text = "Great! You can activate our 7-day free trial with ₹0 upfront. Click 'Start 7-Day Free Trial' above to get started!";
        botReply.options = ["Our services", "Talk to team"];
      } else {
        botReply.text = `Thank you for asking about "${pillText}". The chatbot grounds its answers strictly from approved company knowledge to ensure 100% accuracy.`;
        botReply.options = ["Our services", "Pricing details", "Talk to team"];
      }

      setChatMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 700);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;
    const text = inputVal.trim();
    setInputVal("");
    handlePillClick(text);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0F19] text-[#252525] dark:text-slate-100 transition-colors duration-200 font-sans selection:bg-[#B68A55] selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-[#EFE7DC] dark:border-slate-800 bg-[#FAF9F6]/90 dark:bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-700 shadow-xs">
              <img src="/e-logoicon.webp" alt="Emperor Smart Solutions" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#252525] dark:text-white block leading-tight">
                EMPEROR
              </span>
              <span className="text-[10px] tracking-widest text-[#B68A55] uppercase font-bold block leading-none">
                SMART SOLUTIONS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-[#252525] dark:hover:text-white transition-colors">Product</a>
            <a href="#solutions" className="hover:text-[#252525] dark:hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-[#252525] dark:hover:text-white transition-colors">Pricing</a>
            <a href="#support" className="hover:text-[#252525] dark:hover:text-white transition-colors">Resources</a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-black text-white dark:bg-[#B68A55] dark:hover:bg-[#a07746] shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:text-[#252525] dark:hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-black text-white dark:bg-[#B68A55] dark:hover:bg-[#a07746] shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 pb-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#B68A55] animate-pulse" />
              <span className="text-[#252525] dark:text-white font-extrabold">NexusAI</span>
              <span className="text-slate-400">|</span>
              <span className="text-[#B68A55] font-medium">Chatbot Sales Navigator SaaS</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#252525] dark:text-white leading-[1.1]">
              Turn Conversations{" "}
              <br className="hidden sm:inline" />
              Into <span className="text-[#2563EB] dark:text-[#60A5FA]">Revenue.</span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Deploy an AI chatbot on your website that understands your business, answers customer questions, and helps convert visitors into opportunities.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 text-[#252525] dark:text-white font-bold text-sm hover:bg-[#FAF9F6] dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* 3 Pillar Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#EFE7DC] dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55] shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-semibold">No Prompt Engineering</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55] shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <span className="font-semibold">Your Business Knowledge</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-semibold">Enterprise Security</span>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive Chat Widget Preview */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EFE7DC] dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
              {/* Widget Header */}
              <div className="p-4 bg-[#FAF9F6] dark:bg-slate-950 border-b border-[#EFE7DC] dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#252525] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    <Bot className="w-4 h-4 text-[#B68A55]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#252525] dark:text-white">
                      Emperor Sales Assistant
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setChatMessages([
                        {
                          role: "user",
                          text: "I want to know about your services and pricing.",
                        },
                        {
                          role: "bot",
                          text: "Sure! Emperor Smart Solutions offers services like ERP development, web applications, and IT solutions. Here are our main services:",
                          options: ["Our services", "Pricing details", "Book a demo"],
                        },
                      ])
                    }
                    title="Reset Conversation"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#252525] dark:hover:text-white hover:bg-[#EFE7DC]/50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#FAF9F6]/40 dark:bg-slate-900/60">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role !== "user" && (
                      <div className="w-6 h-6 rounded-full bg-[#252525] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-[#B68A55]" />
                      </div>
                    )}

                    <div className="space-y-2 max-w-[85%]">
                      <div
                        className={`p-3 rounded-2xl leading-relaxed shadow-xs ${
                          msg.role === "user"
                            ? "bg-[#2563EB] text-white rounded-tr-xs"
                            : "bg-white dark:bg-slate-800 text-[#252525] dark:text-slate-100 border border-[#EFE7DC] dark:border-slate-700/80 rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>

                      {/* Interactive Option Pills */}
                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handlePillClick(opt)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 border border-[#B68A55]/30 text-[#B68A55] hover:bg-[#B68A55] hover:text-white transition-all shadow-xs cursor-pointer"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-[#252525] flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-[#B68A55]" />
                    </div>
                    <span className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#EFE7DC] dark:border-slate-700/80 shadow-xs animate-pulse">
                      Assistant is typing response...
                    </span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendChat}
                className="p-3 border-t border-[#EFE7DC] dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="flex-1 text-xs bg-[#FAF9F6] dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-[#EFE7DC] dark:border-slate-800 text-[#252525] dark:text-white placeholder-slate-400 outline-hidden focus:border-[#B68A55]"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isTyping}
                  className="p-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Across Industries Logo Bar */}
      <section className="py-10 px-6 border-y border-[#EFE7DC] dark:border-slate-800/80 bg-white dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center sm:text-left">
            TRUSTED BY BUSINESSES ACROSS INDUSTRIES
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Factory className="w-4 h-4 text-[#B68A55]" />
              <span>Manufacturing & Industries</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Healthcare & Clinics</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>Education & Institutions</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <span>Retail & E-commerce</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span>Professional Services</span>
            </div>
            <div className="text-xs font-semibold text-slate-400">
              and more...
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need to Deploy Your AI Chatbot */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              Everything You Need to Deploy Your AI Chatbot
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              From knowledge setup to lead capture and analytics.
            </p>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold text-[#252525] dark:text-white hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All Features</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">Business-Specific Answers</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Answer questions about your services, pricing, and packages grounded strictly in your verified business knowledge.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">Easy Website Integration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add the chatbot to your website in minutes using a simple HTML embed tag without rebuilding your website.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">Lead Capture</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Capture and qualify interested visitors automatically with phone, email, and intent scoring.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">Custom Training</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Train using your own Q&A pairs, service sheets, and pricing tiers reviewed before training finalization.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">Analytics & Insights</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track live conversations, identify customer intent, and uncover unanswered questions automatically.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#252525] dark:text-white">Secure & Reliable</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Strict tenant isolation with 1 account and 1 chatbot standard allocation. Your proprietary data stays safe.
            </p>
          </div>
        </div>
      </section>

      {/* Built for Real Business Needs */}
      <section id="solutions" className="py-16 px-6 max-w-7xl mx-auto space-y-8 border-t border-[#EFE7DC] dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              Built for Real Business Needs
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Make information easily accessible for your website visitors.
            </p>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold text-[#252525] dark:text-white hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Explore All Use Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1 */}
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
              <img
                src="/office.jpg"
                alt="Service Enquiries"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="font-bold text-xs text-[#252525] dark:text-white">Service Enquiries</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Answer common questions about your services.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-3">
              <img
                src="/saas_architecture.jpg"
                alt="Pricing & Packages"
                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="font-bold text-xs text-[#252525] dark:text-white">Pricing & Packages</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Share pricing details and package information.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <div className="h-32 w-full overflow-hidden relative bg-[#FAF9F6] dark:bg-slate-800 flex items-center justify-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B68A55]/15 text-[#B68A55] flex items-center justify-center shadow-xs">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="font-bold text-xs text-[#252525] dark:text-white">Product Information</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Explain your products and offerings.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <div className="h-32 w-full overflow-hidden relative bg-[#FAF9F6] dark:bg-slate-800 flex items-center justify-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <div className="p-4 space-y-1">
              <h4 className="font-bold text-xs text-[#252525] dark:text-white">Demo Requests</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Collect and qualify demo requests.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
              <img
                src="/support_agent.jpg"
                alt="Customer Support"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="font-bold text-xs text-[#252525] dark:text-white">Customer Support</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Handle repetitive information queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple, Transparent Pricing */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto space-y-10 border-t border-[#EFE7DC] dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252525] dark:text-white tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the plan that fits your business. No hidden charges. Standard plan includes 1 account and 1 chatbot.
            </p>
          </div>

          {/* Billing Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#252525] dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("6months")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "6months"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#252525] dark:hover:text-white"
              }`}
            >
              <span>6 Months</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                6-Mo Pass
              </span>
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#252525] dark:hover:text-white"
              }`}
            >
              <span>Yearly</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards + Talk to Team Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Card 1: Starter */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-base text-[#252525] dark:text-white">Starter</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Perfect for small businesses</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-black text-[#252525] dark:text-white">₹999</span>
                <span className="text-xs text-slate-500 dark:text-slate-400"> / month</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-[#EFE7DC] dark:border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1 account</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1 chatbot</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Basic training with your Q&A</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl border border-[#EFE7DC] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 hover:bg-[#EFE7DC]/50 dark:hover:bg-slate-700 text-[#252525] dark:text-white text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              >
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Card 2: Professional (Most Popular) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#B68A55] shadow-lg shadow-[#B68A55]/10 flex flex-col justify-between relative scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#B68A55] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-base text-[#252525] dark:text-white">Professional</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">For growing businesses</p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#252525] dark:text-white">
                    {billingCycle === "6months" ? "₹5,999" : "₹2,499"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {billingCycle === "6months" ? " / 6 months" : " / month"}
                  </span>
                </div>
                {billingCycle === "6months" && (
                  <p className="text-[10px] text-[#B68A55] font-semibold mt-0.5">
                    Official 6-Month Term Pass
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-[#EFE7DC] dark:border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B68A55] shrink-0" />
                  <span>1 account</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B68A55] shrink-0" />
                  <span>1 chatbot</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B68A55] shrink-0" />
                  <span>Advanced training and configuration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#B68A55] shrink-0" />
                  <span>Priority support & review</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl bg-[#B68A55] hover:bg-[#a07746] text-white text-xs font-bold transition-all shadow-md shadow-[#B68A55]/25 flex items-center justify-center cursor-pointer"
              >
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Card 3: Annual */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-base text-[#252525] dark:text-white">Annual</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Best value for long-term use</p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#252525] dark:text-white">₹8,999</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400"> / year</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Approx ₹749.92/mo • Save ₹2,989 vs monthly
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-[#EFE7DC] dark:border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1 account</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>1 chatbot</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>12 Months continuous access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Priority support & setup</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl border border-[#EFE7DC] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 hover:bg-[#EFE7DC]/50 dark:hover:bg-slate-700 text-[#252525] dark:text-white text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              >
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Card 4: Have Questions? */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-blue-50 via-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border border-blue-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                Custom Needs?
              </span>
              <h4 className="font-extrabold text-lg text-[#252525] dark:text-white">
                Have Questions? <br />
                Talk to Our Team
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Get help with setup, pricing, or custom requirements. We respond within 24 hours.
              </p>
            </div>

            <div className="pt-6 space-y-2">
              <a
                href="https://wa.me/916359120081"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Contact Us →</span>
              </a>
              <p className="text-[10px] text-center text-slate-500 font-mono">
                +91 63591 20081 (WhatsApp)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="support" className="border-t border-[#EFE7DC] dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900 border border-[#EFE7DC] dark:border-slate-700 shadow-xs">
                <img src="/e-logoicon.webp" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#252525] dark:text-white">
                Emperor Smart Solutions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              ISO 27001 & ISO 9001 certified enterprise AI & digital engineering. 202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad - 380009, Gujarat, India.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Direct Phone & WhatsApp: +91 63591 20081
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-[#252525] dark:text-white uppercase tracking-wider text-[11px]">
              Platform
            </h5>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li><a href="#features" className="hover:text-[#252525] dark:hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-[#252525] dark:hover:text-white">Pricing</a></li>
              <li><Link href="/login" className="hover:text-[#252525] dark:hover:text-white">Sign In</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#252525] dark:hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-[#252525] dark:text-white uppercase tracking-wider text-[11px]">
              Support & Legal
            </h5>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li><a href="mailto:emperorsmartsolutions@gmail.com" className="hover:text-[#252525] dark:hover:text-white">Contact Support</a></li>
              <li><a href="mailto:sales@emperorsmartsolutions.com" className="hover:text-[#252525] dark:hover:text-white">Sales Inquiry</a></li>
              <li><span className="text-slate-400">100% Bilateral NDA Protection</span></li>
              <li><span className="text-slate-400">7-Day Free Trial Available</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[#EFE7DC] dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Emperor Smart Solutions. All rights reserved.</p>
          <p>Product: Website Chatbot v1.0 | RAG Verified Knowledge Grounding</p>
        </div>
      </footer>

      {/* Demo Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-[#EFE7DC] dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#252525] dark:text-white">
                Emperor Smart Solutions — Chatbot Product Walkthrough
              </h3>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="text-slate-400 hover:text-[#252525] dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl bg-black/90 flex flex-col items-center justify-center text-slate-300 p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center text-blue-400">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <h4 className="font-bold text-sm text-white">Live Interactive Assistant is Active on Page!</h4>
              <p className="text-xs text-slate-400 max-w-md">
                You can test real conversation flows, inquiry qualification, and pricing answers right now in the floating chat preview above.
              </p>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Try Interactive Chat Above ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
