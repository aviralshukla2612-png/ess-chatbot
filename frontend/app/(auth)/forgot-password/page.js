"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 relative font-sans">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block group focus:outline-hidden" title="Return to Emperor Nexus Home">
            <img
              src="/logo.png"
              alt="Emperor Nexus — Sales AI Assistant"
              className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_0_24px_rgba(150,61,255,0.4)] transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Reset Password
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9898A6]">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {/* Deep Black Luxury Card */}
        <div className="bg-black p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-white">
                Check your inbox
              </h3>
              <p className="text-xs text-[#9898A6] leading-relaxed">
                We sent password recovery instructions to <strong className="text-white">{email}</strong>.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C28AFF] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#D1D1DB] mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#C28AFF] transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-white/10 bg-[#0A0A0E] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#7B2BF9] via-[#963DFF] to-[#A855F7] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_4px_24px_rgba(150,61,255,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                Send Recovery Link
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#9898A6] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
