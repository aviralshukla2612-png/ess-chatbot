"use client";

import React, { useEffect, useId, useState } from "react";
import {
  X,
  AlertTriangle,
  Trash2,
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
  variant = "danger", // "danger" | "warning" | "primary" | "gold" (mapped cleanly to primary)
  badgeText,
  icon: CustomIcon,
  confirmIcon: CustomConfirmIcon,
  count,
  details,
  maxWidth = "max-w-[420px]",
}) {
  const [loading, setLoading] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose?.();
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
      onClose?.();
    } catch (err) {
      console.error("Confirmation action error:", err);
    } finally {
      setLoading(false);
    }
  };

  let IconComponent = CustomIcon;
  let ConfirmIcon = CustomConfirmIcon;
  let iconContainer =
    "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/12 dark:border-rose-500/25 dark:text-rose-400";
  let confirmBtnStyle =
    "bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 dark:border-rose-500/50";
  let badgeStyle =
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25";

  if (variant === "danger") {
    if (!IconComponent) IconComponent = Trash2;
    if (!ConfirmIcon) ConfirmIcon = Trash2;
  } else if (variant === "warning") {
    if (!IconComponent) IconComponent = AlertTriangle;
    if (!ConfirmIcon) ConfirmIcon = AlertTriangle;
    iconContainer =
      "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/12 dark:border-amber-500/25 dark:text-amber-400";
    confirmBtnStyle =
      "bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 dark:border-amber-500/50";
    badgeStyle =
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25";
  } else {
    // primary / gold (mapped to enterprise primary indigo)
    if (!IconComponent) IconComponent = Info;
    if (!ConfirmIcon && variant === "gold") ConfirmIcon = CheckCircle2;
    iconContainer =
      "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/14 dark:border-indigo-500/30 dark:text-indigo-400";
    confirmBtnStyle =
      "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 dark:border-indigo-500/50";
    badgeStyle =
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/14 dark:text-indigo-300 dark:border-indigo-500/30";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "relative w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-modal)] overflow-hidden animate-scale-in p-6 text-center",
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close confirmation dialog"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto mb-4 w-12 h-12 rounded-xl border flex items-center justify-center">
          <div
            className={cn(
              "w-12 h-12 rounded-xl border flex items-center justify-center",
              iconContainer
            )}
          >
            <IconComponent className="w-5 h-5" />
          </div>
        </div>

        {badgeText && (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mb-2.5",
              badgeStyle
            )}
          >
            {badgeText}
          </span>
        )}

        <h3
          id={titleId}
          className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text-primary)] mb-1.5"
        >
          {title}
        </h3>

        {description && (
          <p
            id={descId}
            className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[340px] mx-auto"
          >
            {description}
          </p>
        )}

        {count !== undefined && count !== null && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
              {count}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {count === 1 ? "1 item" : `${count} items`} selected
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        )}

        {details && <div className="mt-4 text-left">{details}</div>}

        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 h-10 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={cn(
              "flex-1 h-10 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs",
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
