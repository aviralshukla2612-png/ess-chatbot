"use client";

import React, { useState, useEffect } from "react";
import { User, Plus, X, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

// Generates consistent avatar initial and vibrant color based on user name
function getProfileAvatarStyle(name) {
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const palette = [
    { bg: "bg-indigo-600", text: "text-white font-bold" },
    { bg: "bg-teal-600", text: "text-white font-bold" },
    { bg: "bg-sky-600", text: "text-white font-bold" },
    { bg: "bg-purple-600", text: "text-white font-bold" },
    { bg: "bg-emerald-600", text: "text-white font-bold" },
    { bg: "bg-blue-600", text: "text-white font-bold" },
  ];
  const charCode = (name || "U").charCodeAt(0) || 0;
  const color = palette[charCode % palette.length];
  return {
    bg: color.bg,
    border: "border-transparent",
    text: color.text,
    initial,
  };
}

const FORBIDDEN_MOCK_EMAILS = new Set([
  "admin@company.com",
]);

export default function GoogleAccountChooserModal({ isOpen, onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsAddingNew(false);
      setNewEmail("");
      setNewName("");
      setErrorMessage("");
      setSelectedEmail("");
      return;
    }

    const loadAccounts = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch("/api/auth/google");
        const data = await res.json().catch(() => ({}));
        let apiAccounts = data.success && Array.isArray(data.accounts) ? data.accounts : [];

        // Purge old mock accounts from browser localStorage
        let localSaved = [];
        try {
          const raw = localStorage.getItem("nexus_google_saved_accounts");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localSaved = parsed.filter(
                (a) => a && a.email && !FORBIDDEN_MOCK_EMAILS.has(a.email.toLowerCase().trim())
              );
              localStorage.setItem("nexus_google_saved_accounts", JSON.stringify(localSaved));
            }
          }
        } catch (e) {}

        const seen = new Set();
        const merged = [];

        for (const acc of [...apiAccounts, ...localSaved]) {
          if (acc && acc.email) {
            const clean = acc.email.toLowerCase().trim();
            if (!FORBIDDEN_MOCK_EMAILS.has(clean) && !seen.has(clean)) {
              seen.add(clean);
              merged.push({
                name: acc.name || clean.split("@")[0],
                email: clean,
                role: acc.role || "MEMBER",
              });
            }
          }
        }

        setAccounts(merged);
        // If no authenticated accounts exist on this device, go directly to clean sign-in
        if (merged.length === 0) {
          setIsAddingNew(true);
        } else {
          setIsAddingNew(false);
        }
      } catch (err) {
        console.error("Error loading accounts:", err);
        setIsAddingNew(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, [isOpen]);

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    try {
      const cleanTarget = emailToRemove.toLowerCase().trim();
      const raw = localStorage.getItem("nexus_google_saved_accounts");
      const list = raw ? JSON.parse(raw) : [];
      const updated = list.filter((a) => a && a.email && a.email.toLowerCase().trim() !== cleanTarget);
      localStorage.setItem("nexus_google_saved_accounts", JSON.stringify(updated));

      const remaining = accounts.filter((a) => a.email.toLowerCase().trim() !== cleanTarget);
      setAccounts(remaining);
      if (remaining.length === 0) {
        setIsAddingNew(true);
      }
    } catch (err) {
      console.error("Failed to remove account:", err);
    }
  };

  if (!isOpen) return null;

  const handleSelectAccount = async (account) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedEmail(account.email);
    setErrorMessage("");

    try {
      // Remember this account in localStorage
      try {
        const raw = localStorage.getItem("nexus_google_saved_accounts");
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
        filtered.unshift({
          name: account.name || account.email.split("@")[0],
          email: account.email.toLowerCase(),
          role: account.role || "MEMBER",
        });
        localStorage.setItem("nexus_google_saved_accounts", JSON.stringify(filtered.slice(0, 10)));
      } catch (e) {}

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email.toLowerCase(),
          name: account.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      if (onSuccess) {
        onSuccess(data);
      } else {
        const destination = data.destination || "/dashboard";
        window.location.replace(destination);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to sign in with this account.");
      setIsSubmitting(false);
      setSelectedEmail("");
    }
  };

  const handleAddNewSubmit = (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setErrorMessage("Please enter a valid Google email address.");
      return;
    }
    handleSelectAccount({
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || newEmail.trim().split("@")[0],
      role: "ORG_OWNER",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Google-Style Card */}
      <div className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans text-slate-800">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            {/* Google Multi-Color G Logo */}
            <div className="inline-flex items-center justify-center w-11 h-11 mb-3">
              <svg className="w-9 h-9" viewBox="0 0 24 24">
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
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {isAddingNew ? "Sign in with Google" : "Choose an account"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              to continue to <span className="font-semibold text-slate-700">NexusAI</span>
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* Body: Real Account Chooser List */}
          {!isAddingNew ? (
            <div className="space-y-1">
              {isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Loading Google accounts...</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto pr-1">
                  {accounts.map((acc) => {
                    const avatarStyle = getProfileAvatarStyle(acc.name);
                    const isSigningInThis = isSubmitting && selectedEmail === acc.email;

                    return (
                      <div
                        key={acc.email}
                        className="w-full py-2.5 px-3 rounded-2xl flex items-center justify-between text-left hover:bg-slate-50 transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectAccount(acc)}
                          disabled={isSubmitting}
                          className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer disabled:opacity-50 text-left"
                        >
                          <div
                            className={`w-10 h-10 rounded-full ${avatarStyle.bg} ${avatarStyle.border} ${avatarStyle.text} flex items-center justify-center text-sm shrink-0 shadow-2xs`}
                          >
                            {avatarStyle.initial}
                          </div>

                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-slate-800 truncate block">
                              {acc.name}
                            </span>
                            <span className="text-xs text-slate-500 truncate block">
                              {acc.email}
                            </span>
                          </div>
                        </button>

                        <div className="shrink-0 flex items-center gap-1.5 pl-2">
                          {isSigningInThis ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveAccount(e, acc.email)}
                                title="Remove account"
                                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectAccount(acc)}
                                className="p-1.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all cursor-pointer"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Use Another Account Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(true);
                      setErrorMessage("");
                    }}
                    disabled={isSubmitting}
                    className="w-full py-3 px-3 rounded-2xl flex items-center gap-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 group-hover:border-slate-300 group-hover:text-slate-800">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-sm text-slate-700 group-hover:text-slate-900">
                        Use another account
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Sign in with a different Google email
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Add Another Google Account Form */
            <form onSubmit={handleAddNewSubmit} className="space-y-4 animate-fade-in">
              {accounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setErrorMessage("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to saved accounts</span>
                </button>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy & Terms Google Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-relaxed">
            To continue, Google will share your name, email address, language preference, and profile picture with NexusAI.
          </div>
        </div>
      </div>
    </div>
  );
}
