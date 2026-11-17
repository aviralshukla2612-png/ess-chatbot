"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Building,
  User,
  Globe,
  ArrowLeft,
  CreditCard,
  Check,
  Phone,
  KeyRound,
  RefreshCw,
  Clock,
  AlertTriangle,
  Smartphone,
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

/**
 * 6 Separate OTP Boxes Component with Auto-Advance, Backspace Backtracking, and Paste Support
 */
function SixDigitOtpBoxes({ value = "", onChange, disabled = false, autoFocus = true }) {
  const inputRefs = useRef([]);

  // 6 individual character slots
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleBoxChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "");

    // If emptied
    if (!val) {
      const newOtp = value.slice(0, idx) + "" + value.slice(idx + 1);
      onChange(newOtp.trim());
      return;
    }

    // If multiple characters typed or auto-filled
    if (val.length > 1) {
      const char = val.slice(-1);
      const newArr = [...digits];
      newArr[idx] = char;
      const combined = newArr.join("").slice(0, 6);
      onChange(combined);
      if (idx < 5 && inputRefs.current[idx + 1]) {
        inputRefs.current[idx + 1].focus();
      }
      return;
    }

    // Single digit typed
    const newArr = [...digits];
    newArr[idx] = val;
    const combined = newArr.join("").slice(0, 6);
    onChange(combined);

    if (idx < 5 && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        // Current box already empty: move to previous box & clear it
        const newArr = [...digits];
        newArr[idx - 1] = "";
        onChange(newArr.join("").trim());
        if (inputRefs.current[idx - 1]) {
          inputRefs.current[idx - 1].focus();
        }
      } else {
        const newArr = [...digits];
        newArr[idx] = "";
        onChange(newArr.join("").trim());
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 my-2" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const char = digits[idx];
        const isFilled = Boolean(char);
        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            autoFocus={autoFocus && idx === 0}
            value={char}
            onChange={(e) => handleBoxChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`w-11 sm:w-12 h-13 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border transition-all duration-200 outline-hidden select-none ${
              isFilled
                ? "bg-[#100D1C] border-[#963DFF] text-white shadow-[0_0_15px_rgba(150,61,255,0.35)]"
                : "bg-black/80 border-white/15 text-white/90 hover:border-white/30 focus:border-[#963DFF] focus:bg-[#0C0A14] focus:ring-2 focus:ring-[#963DFF]/40"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [redirectPath, setRedirectPath] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  // Mobile OTP States - Registration
  const [regPhone, setRegPhone] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpSending, setRegOtpSending] = useState(false);
  const [regOtpVerifying, setRegOtpVerifying] = useState(false);
  const [regPhoneVerified, setRegPhoneVerified] = useState(false);
  const [regVerificationToken, setRegVerificationToken] = useState("");
  const [regCooldown, setRegCooldown] = useState(0);
  const [regAttemptsLeft, setRegAttemptsLeft] = useState(null);
  const [regIsBanned, setRegIsBanned] = useState(false);
  const [regBanMessage, setRegBanMessage] = useState("");

  // Mobile OTP States - Login
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpSending, setLoginOtpSending] = useState(false);
  const [loginOtpVerifying, setLoginOtpVerifying] = useState(false);
  const [loginCooldown, setLoginCooldown] = useState(0);
  const [loginAttemptsLeft, setLoginAttemptsLeft] = useState(null);
  const [loginIsBanned, setLoginIsBanned] = useState(false);
  const [loginBanMessage, setLoginBanMessage] = useState("");

  // 60-Second Cooldown Countdown Timers
  useEffect(() => {
    if (regCooldown <= 0) return;
    const interval = setInterval(() => {
      setRegCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [regCooldown]);

  useEffect(() => {
    if (loginCooldown <= 0) return;
    const interval = setInterval(() => {
      setLoginCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [loginCooldown]);

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
      const ind = params.get("industry");
      if (ind) {
        setSelectedIndustry(ind);
        try {
          localStorage.setItem("nexus_selected_industry", ind);
        } catch (e) {}
      } else {
        try {
          const stored = localStorage.getItem("nexus_selected_industry");
          if (stored) setSelectedIndustry(stored);
        } catch (e) {}
      }
      const tab = params.get("tab");
      if (tab === "register") {
        setActiveTab("register");
      }
    }
  }, []);

  // Send Registration OTP via DLT Gateway
  const handleSendRegOtp = async () => {
    const rawDigits = regPhone.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setRegOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone, purpose: "registration" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setRegIsBanned(true);
          setRegBanMessage(data.error);
        }
        throw new Error(data.error || "Failed to dispatch verification code");
      }

      setRegOtpSent(true);
      setRegCooldown(data.cooldownSeconds || 60);
      setRegAttemptsLeft(5);
      setRegIsBanned(false);
      setSuccessMessage(`OTP code sent via SMS to ${data.phone}. Code is valid for 10 minutes.`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setRegOtpSending(false);
    }
  };

  // Verify Registration OTP
  const handleVerifyRegOtp = async () => {
    if (!regOtp || regOtp.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setRegOtpVerifying(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone, otp: regOtp.trim(), purpose: "registration" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setRegIsBanned(true);
          setRegBanMessage(data.error);
          setRegAttemptsLeft(0);
        } else if (data.attemptsLeft !== undefined) {
          setRegAttemptsLeft(data.attemptsLeft);
        }
        throw new Error(data.error || "Invalid OTP code");
      }

      setRegPhoneVerified(true);
      setRegVerificationToken(data.verificationToken);
      setRegAttemptsLeft(null);
      setSuccessMessage("Mobile number verified successfully!");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setRegOtpVerifying(false);
    }
  };

  // Registration Submit
  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!fullName.trim()) throw new Error("Full name is required");
      if (!companyName.trim()) throw new Error("Company / Organization name is required");
      if (!regPhoneVerified || !regVerificationToken) {
        throw new Error("Please verify your mobile number with OTP first");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          organizationName: companyName.trim(),
          phone: regPhone,
          verificationToken: regVerificationToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      if (selectedPlan) {
        const indQuery = selectedIndustry ? `&industry=${encodeURIComponent(selectedIndustry)}` : "";
        window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}${indQuery}&checkout=true`);
        return;
      }

      const defaultTarget = selectedIndustry ? `/bots/create?industry=${encodeURIComponent(selectedIndustry)}` : "/dashboard";
      window.location.replace(redirectPath || defaultTarget);
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  // Send Login OTP via DLT Gateway
  const handleSendLoginOtp = async () => {
    const rawDigits = loginPhone.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setLoginOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setLoginIsBanned(true);
          setLoginBanMessage(data.error);
        }
        throw new Error(data.error || "Failed to dispatch verification code");
      }

      setLoginOtpSent(true);
      setLoginCooldown(data.cooldownSeconds || 60);
      setLoginAttemptsLeft(5);
      setLoginIsBanned(false);
      setSuccessMessage(`OTP sent via SMS to ${data.phone}. Code is valid for 10 minutes.`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoginOtpSending(false);
    }
  };

  // Verify Login OTP & Complete Sign In
  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!loginOtpSent) {
      await handleSendLoginOtp();
      return;
    }
    if (!loginOtp || loginOtp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP code");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setLoginOtpVerifying(true);

    try {
      // 1. Verify OTP code
      const vRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, otp: loginOtp.trim(), purpose: "login" }),
      });
      const vData = await vRes.json();
      if (!vRes.ok || !vData.success) {
        if (vData.banned) {
          setLoginIsBanned(true);
          setLoginBanMessage(vData.error);
          setLoginAttemptsLeft(0);
        } else if (vData.attemptsLeft !== undefined) {
          setLoginAttemptsLeft(vData.attemptsLeft);
        }
        throw new Error(vData.error || "Invalid OTP code");
      }

      // 2. Complete Phone Session Sign In
      const lRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: loginPhone,
          verificationToken: vData.verificationToken,
          mode: "otp",
        }),
      });
      const lData = await lRes.json();
      if (!lRes.ok || !lData.success) {
        if (lData.userFound === false) {
          // Pre-fill phone in register tab with verified status
          setRegPhone(loginPhone);
          setRegPhoneVerified(true);
          setRegVerificationToken(vData.verificationToken);
          setActiveTab("register");
          throw new Error("No account found for this mobile number. Please fill in your name to create your workspace.");
        }
        throw new Error(lData.error || "Sign in failed");
      }

      if (selectedPlan) {
        const indQuery = selectedIndustry ? `&industry=${encodeURIComponent(selectedIndustry)}` : "";
        window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}${indQuery}&checkout=true`);
        return;
      }

      const isSuper = lData.user?.role === "SUPER_ADMIN" || lData.orgRole === "SUPER_ADMIN";
      const defaultTarget = isSuper ? "/admin" : selectedIndustry ? `/bots/create?industry=${encodeURIComponent(selectedIndustry)}` : "/dashboard";
      window.location.replace(redirectPath || defaultTarget);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoginOtpVerifying(false);
    }
  };

  const planMeta = selectedPlan
    ? PLAN_INFO[selectedPlan] || {
        name: selectedPlan.replace(/-/g, " ").toUpperCase(),
        price: "Custom Plan",
        badge: "Selected Plan",
        color: "#963DFF",
      }
    : null;

  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 relative font-sans">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo & Presentation */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block group focus:outline-hidden" title="Return to Emperor Nexus Home">
            <img
              src="/logo.png"
              alt="Emperor Nexus — Sales AI Assistant"
              className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_0_24px_rgba(150,61,255,0.4)] transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {activeTab === "register" ? "Create Workspace" : "Sign In with Mobile OTP"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9898A6]">
            {activeTab === "register"
              ? "Verify mobile number & launch your AI workspace in seconds"
              : "Enter your mobile number to receive an instant verification code"}
          </p>
        </div>

        {/* Selected Plan Banner if arriving from Pricing */}
        {planMeta && (
          <div className="p-3.5 rounded-2xl bg-black border border-[#963DFF]/40 shadow-[0_0_30px_rgba(150,61,255,0.15)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
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
                  Complete sign-in or registration to proceed with order
                </p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#963DFF]/30 text-[#C28AFF] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 shadow-lg animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Deep Black Luxury Card */}
        <div className="bg-black p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative">
          {/* Segmented Switcher (Sign In vs Register) */}
          <div className="flex p-1 rounded-2xl bg-[#0A0A0E] border border-white/10 mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-[#963DFF] text-white shadow-[0_0_20px_rgba(150,61,255,0.45)]"
                  : "text-[#9898A6] hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Sign In with OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
                setSuccessMessage("");
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

          {/* ================= SIGN IN VIEW (100% MOBILE & OTP) ================= */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#D1D1DB] mb-1.5">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-3 rounded-xl border border-white/10 bg-[#0A0A0E] text-white/80 font-mono text-xs select-none shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="flex-1 px-3.5 py-3 rounded-xl border border-white/10 bg-[#06060A] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    disabled={loginOtpSending || loginCooldown > 0 || loginIsBanned || !loginPhone}
                    onClick={handleSendLoginOtp}
                    className="px-3.5 py-3 rounded-xl bg-[#963DFF] hover:bg-[#8529f7] disabled:bg-white/5 disabled:text-white/40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(150,61,255,0.3)]"
                  >
                    {loginOtpSending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : loginCooldown > 0 ? (
                      <>
                        <Clock className="w-3 h-3 text-[#C28AFF]" />
                        <span>{loginCooldown}s</span>
                      </>
                    ) : loginOtpSent ? (
                      "Resend"
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              </div>

              {/* 24-Hour Banned Notice for Login */}
              {loginIsBanned && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-200">Account Temporarily Locked for 24 Hours</p>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">
                      {loginBanMessage || "This number has been locked for 24 hours due to 5 consecutive failed OTP attempts."}
                    </p>
                  </div>
                </div>
              )}

              {/* OTP Input for Login (6 SEPARATE BOXES) */}
              {loginOtpSent && !loginIsBanned && (
                <div className="p-4 rounded-2xl bg-[#0A0A0E] border border-[#963DFF]/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#D1D1DB] font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#C28AFF]" />
                      Enter 6-Digit OTP Code:
                    </span>
                    {loginAttemptsLeft !== null && (
                      <span className={`text-[11px] font-bold ${loginAttemptsLeft <= 2 ? "text-rose-400" : "text-amber-400"}`}>
                        {loginAttemptsLeft} of 5 attempts left
                      </span>
                    )}
                  </div>

                  {/* 6 SEPARATE BOXES COMPONENT */}
                  <SixDigitOtpBoxes
                    value={loginOtp}
                    onChange={setLoginOtp}
                    disabled={loginOtpVerifying}
                    autoFocus={true}
                  />

                  <button
                    type="submit"
                    disabled={loginOtpVerifying || loginOtp.length !== 6}
                    className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#7B2BF9] via-[#963DFF] to-[#A855F7] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_4px_24px_rgba(150,61,255,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loginOtpVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying & Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-[#9898A6] text-center">
                    Security Policy: 5 consecutive failed attempts will lock this mobile number for 24 hours.
                  </p>
                </div>
              )}

              {/* Action Button if OTP not sent yet */}
              {!loginOtpSent && (
                <button
                  type="button"
                  onClick={handleSendLoginOtp}
                  disabled={loginOtpSending || !loginPhone}
                  className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#7B2BF9] via-[#963DFF] to-[#A855F7] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_4px_24px_rgba(150,61,255,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loginOtpSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* ================= REGISTER VIEW (100% MOBILE & OTP) ================= */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs sm:text-sm">
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

              {/* Mobile Number & OTP Verification */}
              <div className="p-3.5 rounded-2xl bg-[#07070B] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#D1D1DB] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#C28AFF]" />
                    <span>Mobile Number (OTP Verification)</span>
                  </label>
                  {regPhoneVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-3 rounded-xl border border-white/10 bg-[#0A0A0E] text-white/80 font-mono text-xs select-none shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={regPhoneVerified}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="flex-1 px-3.5 py-3 rounded-xl border border-white/10 bg-[#06060A] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs sm:text-sm text-white placeholder:text-white/30 font-medium transition-all shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {!regPhoneVerified && (
                    <button
                      type="button"
                      disabled={regOtpSending || regCooldown > 0 || regIsBanned || !regPhone}
                      onClick={handleSendRegOtp}
                      className="px-3.5 py-3 rounded-xl bg-[#963DFF] hover:bg-[#8529f7] disabled:bg-white/5 disabled:text-white/40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(150,61,255,0.3)]"
                    >
                      {regOtpSending ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : regCooldown > 0 ? (
                        <>
                          <Clock className="w-3 h-3 text-[#C28AFF]" />
                          <span>{regCooldown}s</span>
                        </>
                      ) : regOtpSent ? (
                        "Resend"
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  )}
                </div>

                {/* 24-Hour Banned Notice for Registration */}
                {regIsBanned && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-200">Mobile Number Locked for 24 Hours</p>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">
                        {regBanMessage || "You have reached the maximum 5 failed attempts. Please try again after 24 hours."}
                      </p>
                    </div>
                  </div>
                )}

                {/* OTP Input Field & Verification Button (6 SEPARATE BOXES) */}
                {regOtpSent && !regPhoneVerified && !regIsBanned && (
                  <div className="p-4 rounded-2xl bg-[#0A0A0E] border border-[#963DFF]/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#D1D1DB] font-medium flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-[#C28AFF]" />
                        Enter 6-Digit OTP:
                      </span>
                      {regAttemptsLeft !== null && (
                        <span className={`font-semibold ${regAttemptsLeft <= 2 ? "text-rose-400" : "text-amber-400"}`}>
                          {regAttemptsLeft} of 5 attempts left
                        </span>
                      )}
                    </div>

                    {/* 6 SEPARATE BOXES COMPONENT */}
                    <SixDigitOtpBoxes
                      value={regOtp}
                      onChange={setRegOtp}
                      disabled={regOtpVerifying}
                      autoFocus={true}
                    />

                    <button
                      type="button"
                      disabled={regOtpVerifying || regOtp.length !== 6}
                      onClick={handleVerifyRegOtp}
                      className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      {regOtpVerifying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify OTP Code</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-[#9898A6] text-center">
                      Security Policy: Maximum 5 attempts allowed before a 24-hour lockout is triggered.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading || !regPhoneVerified}
                className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#7B2BF9] via-[#963DFF] to-[#A855F7] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_4px_24px_rgba(150,61,255,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>
                  {loading
                    ? "Creating Workspace..."
                    : !regPhoneVerified
                    ? "Verify Mobile OTP to Continue"
                    : "Create Organization & Continue"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Social or SSO Divider */}
          <div className="relative text-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-black px-3 text-[11px] text-[#9898A6] uppercase tracking-wider font-semibold">
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
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/10 bg-[#0A0A0E] hover:bg-[#121218] hover:border-white/20 transition-all cursor-pointer text-xs font-semibold text-white group"
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
                    setSuccessMessage("");
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
                    setSuccessMessage("");
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
