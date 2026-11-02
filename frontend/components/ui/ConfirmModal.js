"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loadingText = "Processing...",
  variant = "danger", // "danger" | "warning" | "gold" | "primary"
  badgeText,
  icon: CustomIcon,
  confirmIcon: CustomConfirmIcon,
  count,
  details,
  maxWidth = "max-w-[400px]",
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (loading) return;
    try {
      setLoading(true);
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (err) {
      console.error("Confirmation action error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Configure variant color accents & icons
  let IconComponent = CustomIcon;
  let ConfirmIcon = CustomConfirmIcon;
  let topGlow = "bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.16),transparent_70%)]";
  let topHighlight = "via-rose-500/35";
  let iconContainer =
    "bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.14)]";
  let confirmBtnStyle =
    "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_16px_rgba(225,29,72,0.25)]";

  if (variant === "danger") {
    if (!IconComponent) IconComponent = Trash2;
    if (!ConfirmIcon) ConfirmIcon = Trash2;
    topGlow = "bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.16),transparent_70%)]";
    topHighlight = "via-rose-500/35";
    iconContainer =
      "bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.14)]";
    confirmBtnStyle =
      "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_16px_rgba(225,29,72,0.25)]";
  } else if (variant === "warning") {
    if (!IconComponent) IconComponent = AlertTriangle;
    if (!ConfirmIcon) ConfirmIcon = AlertTriangle;
    topGlow = "bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.16),transparent_70%)]";
    topHighlight = "via-amber-500/35";
    iconContainer =
      "bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.14)]";
    confirmBtnStyle =
      "bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_16px_rgba(245,158,11,0.25)]";
  } else if (variant === "gold") {
    if (!IconComponent) IconComponent = AlertCircle;
    if (!ConfirmIcon) ConfirmIcon = CheckCircle2;
    topGlow = "bg-[radial-gradient(ellipse_at_top,rgba(182,138,85,0.2),transparent_70%)]";
    topHighlight = "via-[#B68A55]/50";
    iconContainer =
      "bg-[#B68A55]/10 border-[#B68A55]/30 text-[#B68A55] shadow-[0_0_24px_rgba(182,138,85,0.16)]";
    confirmBtnStyle =
      "bg-[#B68A55] hover:bg-[#c4965e] text-white border border-[#B68A55]/50 shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_16px_rgba(182,138,85,0.25)]";
  } else {
    // primary
    if (!IconComponent) IconComponent = Info;
    topGlow = "bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.16),transparent_70%)]";
    topHighlight = "via-indigo-500/35";
    iconContainer =
      "bg-indigo-500/10 border-indigo-500/25 text-indigo-400 shadow-[0_0_24px_rgba(99,102,241,0.14)]";
    confirmBtnStyle =
      "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_16px_rgba(99,102,241,0.25)]";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className={cn(
          "relative w-full bg-[#0F0F12] border border-white/[0.08] rounded-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden transition-all duration-200 transform scale-100 p-6 sm:p-7 text-center",
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Ambient Radial Light at Top */}
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none overflow-hidden">
          <div className={cn("w-full h-full", topGlow)} />
        </div>

        {/* Subtle Top Hairline Highlight */}
        <div
          className={cn(
            "absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent",
            topHighlight
          )}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Elegant Sculpted Icon */}
        <div className="relative mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform duration-200 hover:scale-105",
              iconContainer
            )}
          >
            <IconComponent className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Heading Title */}
        <h3 className="text-lg font-semibold tracking-tight text-white mb-2">
          {title}
        </h3>

        {/* Description Body */}
        {description && (
          <p className="text-[13px] text-neutral-400 leading-relaxed max-w-[320px] mx-auto">
            {description}
          </p>
        )}

        {/* Count Highlight Box (Optional) */}
        {count !== undefined && count !== null && (
          <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
              {count}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-neutral-200">
                {count === 1 ? "1 item" : `${count} items`} selected for permanent deletion
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                This action is irreversible and cannot be restored.
              </p>
            </div>
          </div>
        )}

        {/* Custom Details slot */}
        {details && <div className="mt-4 text-left">{details}</div>}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white font-medium text-xs sm:text-sm transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={cn(
              "flex-1 h-10 px-4 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]",
              confirmBtnStyle
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                {ConfirmIcon && <ConfirmIcon className="w-4 h-4" />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
