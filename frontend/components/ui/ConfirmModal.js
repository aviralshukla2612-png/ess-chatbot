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
  maxWidth = "max-w-md",
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
  let glowColor = "bg-rose-500/20";
  let topHighlight = "via-rose-500/50";
  let iconContainer = "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400";
  let badgeStyle = "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";
  let confirmBtnStyle =
    "bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/25";
  let defaultBadge = "Permanent Action";

  if (variant === "danger") {
    if (!IconComponent) IconComponent = Trash2;
    if (!ConfirmIcon) ConfirmIcon = Trash2;
    glowColor = "bg-rose-500/20";
    topHighlight = "via-rose-500/50";
    iconContainer = "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400";
    badgeStyle = "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";
    confirmBtnStyle =
      "bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30";
    defaultBadge = "Permanent Action";
  } else if (variant === "warning") {
    if (!IconComponent) IconComponent = AlertTriangle;
    if (!ConfirmIcon) ConfirmIcon = AlertTriangle;
    glowColor = "bg-amber-500/20";
    topHighlight = "via-amber-500/50";
    iconContainer = "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400";
    badgeStyle = "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
    confirmBtnStyle =
      "bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-600/30";
    defaultBadge = "Warning";
  } else if (variant === "gold") {
    if (!IconComponent) IconComponent = AlertCircle;
    if (!ConfirmIcon) ConfirmIcon = CheckCircle2;
    glowColor = "bg-[#B68A55]/20";
    topHighlight = "via-[#B68A55]/60";
    iconContainer = "bg-[#B68A55]/10 border-[#B68A55]/30 text-[#B68A55]";
    badgeStyle = "bg-[#B68A55]/15 border-[#B68A55]/30 text-[#B68A55]";
    confirmBtnStyle =
      "bg-gradient-to-r from-[#B68A55] via-[#c6975f] to-[#B68A55] hover:brightness-110 text-white shadow-[#B68A55]/30";
    defaultBadge = "Action Required";
  } else {
    // primary
    if (!IconComponent) IconComponent = Info;
    glowColor = "bg-indigo-500/20";
    topHighlight = "via-indigo-500/50";
    iconContainer = "bg-indigo-500/10 border-indigo-500/25 text-indigo-500 dark:text-indigo-400";
    badgeStyle = "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400";
    confirmBtnStyle =
      "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30";
    defaultBadge = "Confirmation";
  }

  const finalBadge = badgeText !== undefined ? badgeText : defaultBadge;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className={cn(
          "relative w-full bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-200 transform scale-100 p-6 sm:p-7 text-center",
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className={cn(
            "absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-80",
            glowColor
          )}
        />
        {/* Subtle top border highlight */}
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
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-neutral-800/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Centered Glowing Icon Badge */}
        <div className="relative mx-auto mb-3.5 w-14 h-14 rounded-2xl flex items-center justify-center">
          <div className={cn("absolute inset-0 rounded-2xl blur-md opacity-40", glowColor)} />
          <div
            className={cn(
              "relative w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-transform duration-200 hover:scale-105",
              iconContainer
            )}
          >
            <IconComponent className="w-6 h-6" />
          </div>
        </div>

        {/* Category Badge */}
        {finalBadge && (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider mb-2.5 border",
              badgeStyle
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{finalBadge}</span>
          </div>
        )}

        {/* Heading Title */}
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#252525] dark:text-white">
          {title}
        </h3>

        {/* Description Body */}
        {description && (
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto mt-2">
            {description}
          </p>
        )}

        {/* Count Highlight Box */}
        {count !== undefined && count !== null && (
          <div className="mt-4 p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#141414] border border-[#EFE7DC] dark:border-neutral-800 text-left flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
              {count}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#252525] dark:text-neutral-200">
                {count === 1 ? "1 conversation" : `${count} conversations`} queued for permanent removal
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                All client messages, lead scores, and chat logs will be erased.
              </p>
            </div>
          </div>
        )}

        {/* Custom Details slot */}
        {details && <div className="mt-4 text-left">{details}</div>}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#EFE7DC] dark:border-neutral-800 bg-white dark:bg-[#161616] hover:bg-[#FAF9F6] dark:hover:bg-neutral-800 text-[#252525] dark:text-neutral-300 font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98",
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

