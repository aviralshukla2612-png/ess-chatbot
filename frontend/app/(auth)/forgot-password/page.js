"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  RefreshCw,
  Clock,
  AlertTriangle,
  KeyRound,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

function sanitizeTenDigitPhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
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

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Mobile & OTP States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banMessage, setBanMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Password States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  // 60-Second Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Send Password Reset OTP
  const handleSendOtp = async () => {
    const cleanDigits = sanitizeTenDigitPhone(phone);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setNotFound(false);
    setOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanDigits, purpose: "password_reset" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setIsBanned(true);
          setBanMessage(data.error);
        } else if (data.notFound || res.status === 404) {
          setNotFound(true);
          setOtpSent(false);
          throw new Error(data.error || "No account found with this mobile number. Please check the number or create an account.");
        }
        throw new Error(data.error || "Failed to dispatch verification code.");
      }

      setNotFound(false);
      setOtpSent(true);
      setCooldown(data.cooldownSeconds || 60);
      setAttemptsLeft(5);
      setIsBanned(false);
      setSuccessMessage(`6-digit verification code sent to +91 ${cleanDigits}.`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setOtpVerifying(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: sanitizeTenDigitPhone(phone),
          otp: otp.trim(),
          purpose: "password_reset",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.banned) {
          setIsBanned(true);
          setBanMessage(data.error);
          setAttemptsLeft(0);
        } else if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        throw new Error(data.error || "Invalid verification code.");
      }

      setPhoneVerified(true);
      setVerificationToken(data.verificationToken);
      setAttemptsLeft(null);
      setSuccessMessage("Mobile number verified. Create your new password below.");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setOtpVerifying(false);
    }
  };

  // Submit Password Reset
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!phoneVerified || !verificationToken) {
      setErrorMessage("Please verify your mobile number first.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: sanitizeTenDigitPhone(phone),
          password: newPassword,
          verificationToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to reset password. Please try again.");
      }

      setCompleted(true);
      setSuccessMessage("Password reset successfully! You can now sign in with your new password.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 relative font-sans transition-colors duration-200">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block group focus:outline-none" title="Return to Emperor Nexus Home">
            <img
              src="/logo.png"
              alt="Emperor Nexus"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Reset Password
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
            Verify your registered mobile number via SMS OTP to set a new password
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[var(--bg-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] shadow-xl transition-all">
          {completed ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">Password Reset Successfully!</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your workspace password has been updated. You can now sign in using your mobile number and new password.
              </p>
              <div className="pt-2">
                <Link
                  href={`/login?phone=${encodeURIComponent(sanitizeTenDigitPhone(phone))}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && !completed && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* No Account Found Alert Banner */}
              {notFound && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">No Account Found</p>
                      <p className="mt-0.5 opacity-90 truncate">
                        +91 {phone} is not registered in our system.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/login?tab=register&phone=${encodeURIComponent(phone)}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
                  >
                    Create Account &rarr;
                  </Link>
                </div>
              )}

              {/* STEP 1: Mobile Number Input */}
              {!phoneVerified ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="reset-phone"
                      className="block text-xs font-semibold text-[var(--text-primary)]"
                    >
                      Registered Mobile Number
                    </label>
                    {phone.length > 0 && (
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        {phone.length}/10
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-mono text-xs font-medium select-none shrink-0">
                      IN +91
                    </div>
                    <input
                      id="reset-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => {
                        const clean = sanitizeTenDigitPhone(e.target.value);
                        setPhone(clean);
                        if (notFound) setNotFound(false);
                        if (errorMessage) setErrorMessage("");
                        if (otpSent) {
                          setOtpSent(false);
                          setOtp("");
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
                    <span className="font-semibold">+91 {phone} verified</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneVerified(false);
                      setVerificationToken("");
                      setOtp("");
                      setOtpSent(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>
              )}

              {/* 24-Hour Banned Notice */}
              {isBanned && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Mobile Number Locked for 24 Hours</p>
                    <p className="mt-0.5 opacity-90">
                      {banMessage || "Maximum 5 failed OTP attempts reached. Try again after 24 hours."}
                    </p>
                  </div>
                </div>
              )}

              {/* Send OTP Button (When OTP not sent yet) */}
              {!otpSent && !phoneVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending || isBanned || phone.length !== 10}
                  className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpSending ? (
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

              {/* STEP 2: 6-Digit OTP Boxes & Verification */}
              {otpSent && !phoneVerified && !isBanned && (
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Enter 6-Digit SMS Code
                    </span>
                    <button
                      type="button"
                      disabled={otpSending || cooldown > 0}
                      onClick={handleSendOtp}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-[var(--text-muted)] disabled:no-underline disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      {cooldown > 0 ? (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Resend in {cooldown}s</span>
                        </>
                      ) : (
                        "Resend code"
                      )}
                    </button>
                  </div>

                  <SixDigitOtpBoxes
                    value={otp}
                    onChange={setOtp}
                    disabled={otpVerifying}
                    autoFocus={true}
                  />

                  {attemptsLeft !== null && (
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 text-right">
                      {attemptsLeft} of 5 attempts remaining
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={otpVerifying || otp.length !== 6}
                    onClick={handleVerifyOtp}
                    className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying code...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Verify &amp; Set New Password</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 3: Create & Confirm New Password (AFTER OTP VERIFIED) */}
              {phoneVerified && (
                <form onSubmit={handleResetSubmit} className="space-y-4 pt-1">
                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full h-10 pl-9 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full h-10 pl-9 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && confirmPassword && (
                      <p
                        className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${
                          newPassword === confirmPassword
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {newPassword === confirmPassword ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          "Passwords do not match"
                        )}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !newPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                    className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password &amp; Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Back to Sign In Link */}
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
