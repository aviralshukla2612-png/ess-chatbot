"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  ArrowLeft,
  CreditCard,
  Check,
  KeyRound,
  RefreshCw,
  Clock,
  AlertTriangle,
  LogIn,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";

const PLAN_INFO = {
  monthly: {
    name: "Monthly Plan",
    price: "₹999 / month",
    badge: "Flexible Access",
  },
  "six-months": {
    name: "Six Months Plan",
    price: "₹5,999 / 6 months",
    badge: "Commercial Half-Year",
  },
  annual: {
    name: "Annual VIP Plan",
    price: "₹8,999 / year",
    badge: "Save ₹2,989",
  },
};

function sanitizeTenDigitPhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function sanitizeLoginIdentifier(raw) {
  const val = String(raw || "");
  if (/[a-zA-Z@]/.test(val)) {
    return val.trimStart().slice(0, 120);
  }
  return sanitizeTenDigitPhone(val);
}

function resolveSafeRedirect(redirectPath, isSuperAdmin, defaultTarget) {
  if (
    !redirectPath ||
    typeof redirectPath !== "string" ||
    !redirectPath.startsWith("/") ||
    redirectPath.startsWith("//")
  ) {
    return defaultTarget;
  }
  if (!isSuperAdmin && (redirectPath === "/admin" || redirectPath.startsWith("/admin/"))) {
    return "/dashboard";
  }
  return redirectPath;
}

/**
 * 6 Separate OTP Boxes Component with Auto-Advance, Backspace Backtracking, and Paste Support
 */
function SixDigitOtpBoxes({ value = "", onChange, disabled = false, autoFocus = false }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleBoxChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      const newOtp = value.slice(0, idx) + value.slice(idx + 1);
      onChange(newOtp.trim());
      return;
    }

    const char = val.slice(-1);
    const newArr = [...digits];
    newArr[idx] = char;
    const combined = newArr.join("").slice(0, 6);
    onChange(combined);
    if (idx < 5 && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        const newArr = [...digits];
        newArr[idx - 1] = "";
        onChange(newArr.join("").trim());
        inputRefs.current[idx - 1]?.focus();
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
    <div className="flex items-center justify-between gap-2 my-2" onPaste={handlePaste}>
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
            aria-label={`OTP digit ${idx + 1}`}
            disabled={disabled}
            value={char}
            onChange={(e) => handleBoxChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`w-11 sm:w-12 h-12 text-center font-mono text-lg font-bold rounded-xl border transition-all duration-150 outline-none select-none ${
              isFilled
                ? "bg-indigo-50/70 dark:bg-indigo-500/15 border-indigo-600 dark:border-indigo-400 text-[var(--text-primary)] ring-2 ring-indigo-500/20"
                : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Smooth height measurement refs so tab & mode switches animate without layout jerk
  const loginPanelRef = useRef(null);
  const registerPanelRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(null);

  // URL & Plan states
  const [redirectPath, setRedirectPath] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  // Registration states
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
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Login states
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginMode, setLoginMode] = useState("password"); // 'password' | 'otp'
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpSending, setLoginOtpSending] = useState(false);
  const [loginOtpVerifying, setLoginOtpVerifying] = useState(false);
  const [loginCooldown, setLoginCooldown] = useState(0);
  const [loginAttemptsLeft, setLoginAttemptsLeft] = useState(null);
  const [loginIsBanned, setLoginIsBanned] = useState(false);
  const [loginBanMessage, setLoginBanMessage] = useState("");

  // Measure active panel height continuously via ResizeObserver for silky-smooth height transition
  useEffect(() => {
    const targetEl = activeTab === "login" ? loginPanelRef.current : registerPanelRef.current;
    if (!targetEl) return;

    const updateHeight = () => {
      const h = targetEl.offsetHeight;
      if (h > 0) setPanelHeight(h);
    };

    updateHeight();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(updateHeight);
      ro.observe(targetEl);
      return () => ro.disconnect();
    }
  }, [
    activeTab,
    loginMode,
    loginOtpSent,
    loginIsBanned,
    regOtpSent,
    regPhoneVerified,
    regIsBanned,
    regPassword,
    regConfirmPassword,
  ]);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    syncTheme();
    window.addEventListener("theme-change", syncTheme);
    return () => window.removeEventListener("theme-change", syncTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    window.dispatchEvent(new Event("theme-change"));
  };

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
        } catch {}
      } else {
        try {
          const stored = localStorage.getItem("nexus_selected_industry");
          if (stored) setSelectedIndustry(stored);
        } catch {}
      }
      const tab = params.get("tab");
      if (tab === "register") {
        setActiveTab("register");
      }
    }
  }, []);

  const switchTab = (nextTab) => {
    if (nextTab === activeTab) return;
    setActiveTab(nextTab);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const trackCarrierDelivery = (messageId, phoneLabel) => {
    if (!messageId) return;
    [3800, 8200].forEach((delay) => {
      setTimeout(async () => {
        try {
          const r = await fetch(`/api/auth/otp/dlr?messageId=${encodeURIComponent(messageId)}`, {
            cache: "no-store",
          });
          if (!r.ok) return;
          const d = await r.json();
          if (d?.status === "delivered") {
            setSuccessMessage((prev) =>
              prev && prev.includes("verified")
                ? prev
                : `SMS code delivered to ${phoneLabel}. Enter your 6-digit code below.`
            );
          } else if (d?.status === "failed") {
            setErrorMessage(
              `Carrier could not deliver SMS (${d.stat || "DLT/DND block"}, code ${d.err || "N/A"}). Check DND status or retry.`
            );
          }
        } catch {}
      }, delay);
    });
  };

  // Send Registration OTP
  const handleSendRegOtp = async () => {
    const cleanDigits = sanitizeTenDigitPhone(regPhone);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setRegOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanDigits, purpose: "registration" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setRegIsBanned(true);
          setRegBanMessage(data.error);
        } else if (data.cooldown && data.cooldownSeconds) {
          setRegCooldown(data.cooldownSeconds);
        }
        throw new Error(data.error || "Failed to send verification code.");
      }

      setRegOtpSent(true);
      setRegCooldown(data.cooldownSeconds || 60);
      setRegAttemptsLeft(5);
      setRegIsBanned(false);
      setSuccessMessage(`6-digit verification code sent to ${data.phone}.`);
      trackCarrierDelivery(data.messageId, data.phone);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setRegOtpSending(false);
    }
  };

  // Verify Registration OTP
  const handleVerifyRegOtp = async () => {
    if (!regOtp || regOtp.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setRegOtpVerifying(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: sanitizeTenDigitPhone(regPhone),
          otp: regOtp.trim(),
          purpose: "registration",
        }),
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
        throw new Error(data.error || "Invalid verification code.");
      }

      setRegPhoneVerified(true);
      setRegVerificationToken(data.verificationToken);
      setRegAttemptsLeft(null);
      setSuccessMessage("Mobile number verified. Set a password to finish creating your workspace.");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setRegOtpVerifying(false);
    }
  };

  // Registration Form Submit
  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (activeTab !== "register") return;

    if (!regPhoneVerified || !regVerificationToken) {
      if (!regOtpSent) {
        await handleSendRegOtp();
        return;
      }
      await handleVerifyRegOtp();
      return;
    }

    if (!regPassword || regPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: sanitizeTenDigitPhone(regPhone),
          password: regPassword,
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

      const defaultTarget = selectedIndustry
        ? `/bots/create?industry=${encodeURIComponent(selectedIndustry)}`
        : "/dashboard";
      window.location.replace(resolveSafeRedirect(redirectPath, false, defaultTarget));
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  // Send Login OTP
  const handleSendLoginOtp = async () => {
    const cleanDigits = sanitizeTenDigitPhone(loginIdentifier);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setErrorMessage("Please enter a valid 10-digit mobile number to receive an OTP.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setLoginOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanDigits, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setLoginIsBanned(true);
          setLoginBanMessage(data.error);
        } else if (data.cooldown && data.cooldownSeconds) {
          setLoginCooldown(data.cooldownSeconds);
        }
        throw new Error(data.error || "Failed to send verification code.");
      }

      setLoginOtpSent(true);
      setLoginCooldown(data.cooldownSeconds || 60);
      setLoginAttemptsLeft(5);
      setLoginIsBanned(false);
      setSuccessMessage(`6-digit verification code sent to ${data.phone}.`);
      trackCarrierDelivery(data.messageId, data.phone);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoginOtpSending(false);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (activeTab !== "login") return;
    setErrorMessage("");
    setSuccessMessage("");

    const isEmail = loginIdentifier.includes("@");
    const cleanDigits = sanitizeTenDigitPhone(loginIdentifier);

    if (loginMode === "password") {
      if (!isEmail && cleanDigits.length !== 10) {
        setErrorMessage("Enter a valid 10-digit mobile number or email address.");
        return;
      }
      if (!loginPassword) {
        setErrorMessage("Please enter your password.");
        return;
      }

      setLoading(true);
      try {
        const payload = isEmail
          ? { email: loginIdentifier.trim().toLowerCase(), password: loginPassword }
          : { phone: cleanDigits, password: loginPassword };

        const lRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const lData = await lRes.json();
        if (!lRes.ok || !lData.success) {
          throw new Error(lData.error || "Invalid credentials. Please check and try again.");
        }

        if (selectedPlan) {
          const indQuery = selectedIndustry ? `&industry=${encodeURIComponent(selectedIndustry)}` : "";
          window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}${indQuery}&checkout=true`);
          return;
        }

        const isSuper = lData.user?.role === "SUPER_ADMIN";
        const defaultTarget = isSuper
          ? "/admin"
          : selectedIndustry
          ? `/bots/create?industry=${encodeURIComponent(selectedIndustry)}`
          : "/dashboard";
        window.location.replace(resolveSafeRedirect(redirectPath, isSuper, defaultTarget));
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // OTP Mode
    if (isEmail) {
      setErrorMessage("SMS OTP sign-in requires a 10-digit mobile number. Use Password mode for email sign-in.");
      return;
    }
    if (!loginOtpSent) {
      await handleSendLoginOtp();
      return;
    }
    if (!loginOtp || loginOtp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setLoginOtpVerifying(true);
    try {
      const vRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanDigits, otp: loginOtp.trim(), purpose: "login" }),
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
        throw new Error(vData.error || "Invalid verification code.");
      }

      const lRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanDigits,
          verificationToken: vData.verificationToken,
          mode: "otp",
        }),
      });
      const lData = await lRes.json();
      if (!lRes.ok || !lData.success) {
        if (lData.userFound === false) {
          setRegPhone(cleanDigits);
          setRegPhoneVerified(true);
          setRegVerificationToken(vData.verificationToken);
          setActiveTab("register");
          throw new Error("Mobile verified, but no workspace exists yet. Set a password below to finish registration.");
        }
        throw new Error(lData.error || "Sign in failed.");
      }

      if (selectedPlan) {
        const indQuery = selectedIndustry ? `&industry=${encodeURIComponent(selectedIndustry)}` : "";
        window.location.replace(`/billing?plan=${encodeURIComponent(selectedPlan)}${indQuery}&checkout=true`);
        return;
      }

      const isSuper = lData.user?.role === "SUPER_ADMIN";
      const defaultTarget = isSuper
        ? "/admin"
        : selectedIndustry
        ? `/bots/create?industry=${encodeURIComponent(selectedIndustry)}`
        : "/dashboard";
      window.location.replace(resolveSafeRedirect(redirectPath, isSuper, defaultTarget));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoginOtpVerifying(false);
    }
  };

  const planMeta = selectedPlan
    ? PLAN_INFO[selectedPlan] || {
        name: selectedPlan.replace(/-/g, " ").toUpperCase(),
        price: "Selected Plan",
        badge: "Checkout Pending",
      }
    : null;

  const isTypingEmail = /[a-zA-Z@]/.test(loginIdentifier);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-12 relative font-sans transition-colors duration-150">
      {/* Top-Right Theme Toggle */}
      <div className="fixed top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Switch color theme"
          className="h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] shadow-xs flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-[440px]">
        {/* Stable Anchored Brand & Crossfading Header (Zero Vertical Jump) */}
        <div className="text-center flex flex-col items-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none"
            title="Return to Emperor Nexus Home"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center shadow-sm">
              <img
                src="/favicon.svg"
                alt=""
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="text-left">
              <span className="block text-base font-bold tracking-tight text-[var(--text-primary)] leading-none">
                Emperor Nexus
              </span>
              <span className="block text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                Enterprise AI Sales &amp; Support
              </span>
            </div>
          </Link>

          {/* Fixed-height smooth crossfade header */}
          <div className="relative w-full h-[64px] mt-5 overflow-hidden">
            <div
              aria-hidden={activeTab !== "login"}
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeTab === "login"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Sign in to your workspace
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
                Continue with your mobile number or email address.
              </p>
            </div>

            <div
              aria-hidden={activeTab !== "register"}
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeTab === "register"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
            >
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Create your workspace
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
                Verify your mobile number via SMS OTP to get started.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Plan Banner */}
        {planMeta && (
          <div className="mb-4 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{planMeta.name}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {planMeta.price}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Complete authentication to continue to checkout
                </p>
              </div>
            </div>
            <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </div>
        )}

        {/* Alerts */}
        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 transition-all duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 transition-all duration-200"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Auth Surface Card */}
        <div className="bg-[var(--bg-surface)] p-6 sm:p-7 rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-md)]">
          {/* Smooth Sliding Pill Segmented Control */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="relative grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] mb-6 select-none"
          >
            {/* Hardware-accelerated sliding background indicator */}
            <div
              aria-hidden="true"
              style={{
                transform: activeTab === "login" ? "translateX(0%)" : "translateX(100%)",
              }}
              className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "login"}
              onClick={() => switchTab("login")}
              className={`relative z-10 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "register"}
              onClick={() => switchTab("register")}
              className={`relative z-10 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Smooth Height-Interpolated Dual Panel Viewport */}
          <div
            style={panelHeight ? { height: `${panelHeight}px` } : undefined}
            className="relative overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            {/* ================= SIGN IN PANEL ================= */}
            <div
              ref={loginPanelRef}
              aria-hidden={activeTab !== "login"}
              className={`${
                activeTab === "login"
                  ? "relative opacity-100 translate-x-0 z-10"
                  : "absolute inset-x-0 top-0 opacity-0 -translate-x-4 pointer-events-none z-0"
              } transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            >
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-identifier"
                      className="block text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {loginMode === "otp" ? "Mobile Number" : "Mobile Number or Email"}
                    </label>
                    {!isTypingEmail && loginIdentifier.length > 0 && (
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        {loginIdentifier.length}/10
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isTypingEmail && (
                      <div className="flex items-center px-3 h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-mono text-xs font-medium select-none shrink-0">
                        IN +91
                      </div>
                    )}
                    <input
                      id="login-identifier"
                      type="text"
                      tabIndex={activeTab === "login" ? 0 : -1}
                      required={activeTab === "login"}
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => {
                        const nextVal =
                          loginMode === "otp"
                            ? sanitizeTenDigitPhone(e.target.value)
                            : sanitizeLoginIdentifier(e.target.value);
                        setLoginIdentifier(nextVal);
                        if (loginOtpSent) {
                          setLoginOtpSent(false);
                          setLoginOtp("");
                        }
                      }}
                      placeholder={
                        loginMode === "otp"
                          ? "9876543210"
                          : "10-digit mobile or you@company.com"
                      }
                      className="flex-1 h-10 px-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                    />
                  </div>
                </div>

                {loginIsBanned && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Temporarily Locked for 24 Hours</p>
                      <p className="mt-0.5 opacity-90">
                        {loginBanMessage || "Locked after 5 consecutive failed OTP attempts."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Password Sign-In Mode */}
                {loginMode === "password" && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="login-password"
                          className="text-xs font-semibold text-[var(--text-primary)]"
                        >
                          Password
                        </label>
                        {!isTypingEmail && (
                          <button
                            type="button"
                            tabIndex={activeTab === "login" ? 0 : -1}
                            onClick={() => {
                              setLoginMode("otp");
                              setLoginIdentifier((v) => sanitizeTenDigitPhone(v));
                              setErrorMessage("");
                            }}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Use SMS OTP
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          tabIndex={activeTab === "login" ? 0 : -1}
                          required={activeTab === "login"}
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full h-10 pl-9 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                        />
                        <button
                          type="button"
                          tabIndex={activeTab === "login" ? 0 : -1}
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowLoginPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Clean small Forgot Password link tucked neatly below Password input */}
                      <div className="mt-1.5 flex justify-end">
                        <Link
                          href="/forgot-password"
                          tabIndex={activeTab === "login" ? 0 : -1}
                          className="text-[11px] font-medium text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>

                    <button
                      type="submit"
                      tabIndex={activeTab === "login" ? 0 : -1}
                      disabled={loading || !loginIdentifier || !loginPassword}
                      className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* SMS OTP Sign-In Mode */}
                {loginMode === "otp" && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        tabIndex={activeTab === "login" ? 0 : -1}
                        onClick={() => {
                          setLoginMode("password");
                          setErrorMessage("");
                        }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Sign in with password instead
                      </button>
                    </div>

                    {!loginOtpSent ? (
                      <button
                        type="button"
                        tabIndex={activeTab === "login" ? 0 : -1}
                        onClick={handleSendLoginOtp}
                        disabled={loginOtpSending || loginIsBanned || loginIdentifier.length !== 10}
                        className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loginOtpSending ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending verification code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    ) : (
                      !loginIsBanned && (
                        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              Enter 6-Digit SMS Code
                            </span>
                            <button
                              type="button"
                              disabled={loginOtpSending || loginCooldown > 0}
                              onClick={handleSendLoginOtp}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-[var(--text-muted)] disabled:no-underline disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                            >
                              {loginCooldown > 0 ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>Resend in {loginCooldown}s</span>
                                </>
                              ) : (
                                "Resend code"
                              )}
                            </button>
                          </div>

                          <SixDigitOtpBoxes
                            value={loginOtp}
                            onChange={setLoginOtp}
                            disabled={loginOtpVerifying}
                            autoFocus={activeTab === "login" && loginOtpSent}
                          />

                          {loginAttemptsLeft !== null && (
                            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 text-right">
                              {loginAttemptsLeft} of 5 attempts remaining
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={loginOtpVerifying || loginOtp.length !== 6}
                            className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loginOtpVerifying ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Verifying &amp; signing in...</span>
                              </>
                            ) : (
                              <>
                                <span>Verify &amp; Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* ================= CREATE ACCOUNT PANEL ================= */}
            <div
              ref={registerPanelRef}
              aria-hidden={activeTab !== "register"}
              className={`${
                activeTab === "register"
                  ? "relative opacity-100 translate-x-0 z-10"
                  : "absolute inset-x-0 top-0 opacity-0 translate-x-4 pointer-events-none z-0"
              } transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {!regPhoneVerified ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="reg-phone"
                        className="block text-xs font-semibold text-[var(--text-primary)]"
                      >
                        Mobile Number
                      </label>
                      {regPhone.length > 0 && (
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {regPhone.length}/10
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-mono text-xs font-medium select-none shrink-0">
                        IN +91
                      </div>
                      <input
                        id="reg-phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        tabIndex={activeTab === "register" ? 0 : -1}
                        required={activeTab === "register"}
                        value={regPhone}
                        onChange={(e) => {
                          const clean = sanitizeTenDigitPhone(e.target.value);
                          setRegPhone(clean);
                          if (regOtpSent) {
                            setRegOtpSent(false);
                            setRegOtp("");
                          }
                        }}
                        placeholder="10-digit mobile number"
                        className="flex-1 h-10 px-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold">+91 {regPhone} verified</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRegPhoneVerified(false);
                        setRegVerificationToken("");
                        setRegOtp("");
                        setRegOtpSent(false);
                        setRegPassword("");
                        setRegConfirmPassword("");
                      }}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}

                {regIsBanned && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Mobile Number Locked for 24 Hours</p>
                      <p className="mt-0.5 opacity-90">
                        {regBanMessage || "Maximum 5 failed OTP attempts reached. Try again after 24 hours."}
                      </p>
                    </div>
                  </div>
                )}

                {!regOtpSent && !regPhoneVerified && (
                  <button
                    type="button"
                    tabIndex={activeTab === "register" ? 0 : -1}
                    onClick={handleSendRegOtp}
                    disabled={regOtpSending || regIsBanned || regPhone.length !== 10}
                    className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regOtpSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending verification code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {regOtpSent && !regPhoneVerified && !regIsBanned && (
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Enter 6-Digit SMS Code
                      </span>
                      <button
                        type="button"
                        disabled={regOtpSending || regCooldown > 0}
                        onClick={handleSendRegOtp}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-[var(--text-muted)] disabled:no-underline disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                      >
                        {regCooldown > 0 ? (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Resend in {regCooldown}s</span>
                          </>
                        ) : (
                          "Resend code"
                        )}
                      </button>
                    </div>

                    <SixDigitOtpBoxes
                      value={regOtp}
                      onChange={setRegOtp}
                      disabled={regOtpVerifying}
                      autoFocus={activeTab === "register" && regOtpSent && !regPhoneVerified}
                    />

                    {regAttemptsLeft !== null && (
                      <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 text-right">
                        {regAttemptsLeft} of 5 attempts remaining
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={regOtpVerifying || regOtp.length !== 6}
                      onClick={handleVerifyRegOtp}
                      className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {regOtpVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verify &amp; Continue</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {regPhoneVerified && (
                  <div className="space-y-3.5 pt-1">
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
                      >
                        Create Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          id="reg-password"
                          type={showRegPassword ? "text" : "password"}
                          required={activeTab === "register" && regPhoneVerified}
                          minLength={8}
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="w-full h-10 pl-9 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                        />
                        <button
                          type="button"
                          aria-label={showRegPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowRegPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-confirm-password"
                        className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          id="reg-confirm-password"
                          type={showRegConfirmPassword ? "text" : "password"}
                          required={activeTab === "register" && regPhoneVerified}
                          minLength={8}
                          autoComplete="new-password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="w-full h-10 pl-9 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                        />
                        <button
                          type="button"
                          aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowRegConfirmPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regPassword && regConfirmPassword && (
                        <p
                          className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${
                            regPassword === regConfirmPassword
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {regPassword === regConfirmPassword
                            ? "Passwords match"
                            : "Passwords do not match"}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !regPassword ||
                        regPassword.length < 8 ||
                        regPassword !== regConfirmPassword
                      }
                      className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Workspace &amp; Launch</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="relative text-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <span className="relative bg-[var(--bg-surface)] px-3 text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              or continue with
            </span>
          </div>

          {/* Google OAuth */}
          <a
            href={
              selectedPlan
                ? `/api/auth/google?redirect=${encodeURIComponent(`/billing?plan=${selectedPlan}&checkout=true`)}`
                : redirectPath
                ? `/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`
                : "/api/auth/google"
            }
            className="w-full h-10 flex items-center justify-center gap-2.5 px-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] transition-colors text-xs font-semibold text-[var(--text-primary)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.261.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
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

          {/* Footer Switch */}
          <div className="text-center pt-4 mt-5 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            {activeTab === "login" ? (
              <span>
                New to Emperor Nexus?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have a workspace?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Security & Return Footer */}
        <div className="flex items-center justify-between px-1 mt-6 text-xs text-[var(--text-muted)]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>TLS &amp; RBAC Protected</span>
          </span>
        </div>
      </div>
    </div>
  );
}
