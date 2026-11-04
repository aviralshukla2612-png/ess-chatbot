"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Building,
  User,
  LayoutDashboard,
  Globe,
  ArrowLeft,
  Zap,
  CreditCard,
  Check,
} from "lucide-react";

const PLAN_INFO = {
  monthly: {
    name: "Monthly Plan",
    price: "₹999 / month",
    badge: "Flexible Access",
    color: "#00D98B",
  },
  "six-months": {
    name: "Six Months Plan",
    price: "₹5,999 / 6 months",
    badge: "Commercial Half-Year",
    color: "#C653FF",
  },
  annual: {
    name: "Annual VIP Plan",
    price: "₹8,999 / year",
    badge: "Maximum Value · Save ₹2,989",
    color: "#55A9FF",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [redirectPath, setRedirectPath] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        setErrorMessage(decodeURIComponent(err.replace(/\+/g, " ")));
      }
      const redir = params.get("redirect");
      if (redir) {
        setRedirectPath(redir);
      }
      const plan = params.get("plan");
      if (plan) {
        setSelectedPlan(plan.toLowerCase());
      }
      const tab = params.get("tab");
      if (tab === "register") {
        setActiveTab("register");
      }
    }
  }, []);

  const handleDirectDemoLogin = async (targetRole = "ORG_ADMIN") => {
    setLoading(true);
    setErrorMessage("");
    try {
      const isSuper = targetRole === "superadmin" || String(targetRole).includes("super");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isSuper ? "admin@emperorsmartsolutions.com" : "admin@company.com",
          password: "AdminAccessPassword2026!",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Demo authentication failed");
      }
      if (selectedPlan) {
        window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}&checkout=true`);
        return;
      }
      const destination = isSuper ? "/admin" : (redirectPath || "/dashboard");
      window.location.replace(destination);
    } catch (err) {
      setErrorMessage(err.message || "Demo login failed.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (activeTab === "register") {
        if (!fullName.trim()) throw new Error("Full name is required");
        if (!companyName.trim()) throw new Error("Company / Organization name is required");
        if (!email.trim()) throw new Error("Work email address is required");
        if (!password || password.length < 8) throw new Error("Password must be at least 8 characters");

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName.trim(),
            organizationName: companyName.trim(),
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Registration failed. Please try a different email.");
        }

        if (selectedPlan) {
          window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}&checkout=true`);
          return;
        }

        window.location.replace(redirectPath || "/dashboard");
        return;
      }

      // Login Flow
      if (!email.trim()) throw new Error("Email address is required");
      if (!password) throw new Error("Password is required");

      const isPlatformAdmin = email.trim().toLowerCase() === "admin@emperorsmartsolutions.com";
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          directLogin: false,
          portalRole: isPlatformAdmin ? "superadmin" : "ORG_ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password");
      }

      if (selectedPlan) {
        window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}&checkout=true`);
        return;
      }

      const isSuper = data.user?.role === "SUPER_ADMIN" || data.orgRole === "SUPER_ADMIN" || isPlatformAdmin;
      const destination = isSuper ? "/admin" : (redirectPath || "/dashboard");
      window.location.replace(destination);
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed. Please check your credentials.");
      setLoading(false);
    }
  };

  const planMeta = selectedPlan ? (PLAN_INFO[selectedPlan] || {
    name: selectedPlan.replace(/-/g, " ").toUpperCase(),
    price: "Custom Plan",
    badge: "Selected Plan",
    color: "#963DFF",
  }) : null;

  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Background Ambient Lighting & Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(150,61,255,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[radial-gradient(circle,rgba(85,169,255,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[radial-gradient(circle,rgba(194,138,255,0.12),transparent_70%)] pointer-events-none" />

      {/* Subtle Technical Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo & Glowing Presentation */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block group focus:outline-hidden" title="Return to Emperor Nexus Home">
            <img
              src="/emperor_nexus_sales_ai_assistant.png"
              alt="Emperor Nexus — Sales AI Assistant"
              className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_0_28px_rgba(150,61,255,0.55)] transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {activeTab === "register" ? "Create Organization Workspace" : "Welcome Back"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9898A6]">
            {activeTab === "register"
              ? "Launch your AI sales & support bots in under 2 minutes"
              : "Sign in to access your AI assistant dashboard"}
          </p>
        </div>

        {/* Selected Plan Banner if arriving from Pricing */}
        {planMeta && (
          <div className="p-3.5 rounded-2xl bg-[#0D0D18] border border-[#963DFF]/40 shadow-[0_0_30px_rgba(150,61,255,0.15)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#963DFF]/20 text-[#C28AFF] flex items-center justify-center shrink-0 border border-[#963DFF]/30">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{planMeta.name}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {planMeta.price}
                  </span>
                </div>
                <p className="text-[11px] text-[#9898A6] mt-0.5">
                  Sign in or register to complete your order with Razorpay
                </p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#963DFF]/30 text-[#C28AFF] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 shadow-lg">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Dark Luxury Card */}
        <div className="bg-[#0B0B14]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative">
          {/* Segmented Switcher (Sign In vs Register) */}
          <div className="flex p-1 rounded-2xl bg-[#06060A] border border-white/10 mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-[#963DFF] text-white shadow-[0_0_20px_rgba(150,61,255,0.45)]"
                  : "text-[#9898A6] hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-[#963DFF] text-white shadow-[0_0_20px_rgba(150,61,255,0.45)]"
                  : "text-[#9898A6] hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {activeTab === "register" && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#D1D1DB] mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#C28AFF] transition-colors" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aviral Shukla"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-white/10 bg-[#06060A] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#D1D1DB] mb-1.5">
                    Company / Organization Name
                  </label>
                  <div className="relative group">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#C28AFF] transition-colors" />
                    <input
                      type="text"
                      required
                      autoComplete="organization"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Emperor Smart Solutions"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-white/10 bg-[#06060A] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#D1D1DB] mb-1.5">
                {activeTab === "register" ? "Work Email Address" : "Email address"}
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#C28AFF] transition-colors" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-white/10 bg-[#06060A] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#D1D1DB]">
                  {activeTab === "register" ? "Create Password (min. 8 chars)" : "Password"}
                </label>
                {activeTab === "login" && (
                  <Link
                    href="/forgot-password"
                    className="text-[#C28AFF] hover:text-white hover:underline text-[11px] transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#C28AFF] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={activeTab === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-[#06060A] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white focus:outline-hidden transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeTab === "login" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  defaultChecked
                  className="w-4 h-4 rounded-sm border-white/20 bg-[#06060A] text-[#963DFF] accent-[#963DFF] cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-[#9898A6] cursor-pointer select-none">
                  Remember me on this browser
                </label>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#7B2BF9] via-[#963DFF] to-[#A855F7] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_4px_24px_rgba(150,61,255,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {loading
                  ? activeTab === "register"
                    ? "Creating Workspace..."
                    : "Signing In..."
                  : activeTab === "register"
                  ? "Create Organization & Continue"
                  : "Sign In to Workspace"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social or SSO Divider */}
          <div className="relative text-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#0B0B14] px-3 text-[11px] text-[#9898A6] uppercase tracking-wider font-semibold">
              or continue with
            </span>
          </div>

          {/* Google OAuth Button */}
          <div className="space-y-3">
            <a
              href={
                selectedPlan
                  ? `/api/auth/google?redirect=${encodeURIComponent(`/billing?plan=${selectedPlan}&checkout=true`)}`
                  : redirectPath
                  ? `/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`
                  : "/api/auth/google"
              }
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-xs font-semibold text-white group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>

            {/* Quick Demo Access Button */}
            <button
              type="button"
              onClick={() => handleDirectDemoLogin("ORG_ADMIN")}
              disabled={loading}
              className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl border border-indigo-500/25 bg-indigo-950/30 hover:bg-indigo-900/40 hover:border-indigo-500/40 transition-all text-xs text-[#D1D1DB] group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-white">Explore Instant Workspace Demo</span>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono">1-Click &rarr;</span>
            </button>
          </div>

          {/* Bottom Switch Link */}
          <div className="text-center pt-5 mt-5 border-t border-white/10 text-xs text-[#9898A6]">
            {activeTab === "login" ? (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMessage("");
                  }}
                  className="font-bold text-[#C28AFF] hover:underline cursor-pointer ml-1"
                >
                  Register now
                </button>
              </span>
            ) : (
              <span>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMessage("");
                  }}
                  className="font-bold text-[#C28AFF] hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Back to Website Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#9898A6] hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <Globe className="w-3.5 h-3.5 text-[#55A9FF]" />
            <span>Return to Emperor Nexus Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
