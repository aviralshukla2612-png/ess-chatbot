"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const TONE_MAP = {
  success: {
    icon: CheckCircle2,
    box: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/80 dark:text-emerald-200",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: AlertCircle,
    box: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/80 dark:text-rose-200",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  warning: {
    icon: AlertTriangle,
    box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/80 dark:text-amber-200",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    box: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/80 dark:text-sky-200",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
};

export function InlineAlert({ variant = "info", title, message, onDismiss, className = "" }) {
  if (!title && !message) return null;
  const cfg = TONE_MAP[variant] || TONE_MAP.info;
  const Icon = cfg.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm animate-fade-in",
        cfg.box,
        className
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.iconColor)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-xs sm:text-sm">{title}</p>}
        {message && <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="p-0.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, variant = "info", duration = 4200 }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, title, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((item) => {
          const cfg = TONE_MAP[item.variant] || TONE_MAP.info;
          const Icon = cfg.icon;
          return (
            <div
              key={item.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-lg)] animate-scale-in"
            >
              <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.iconColor)} />
              <div className="min-w-0 flex-1">
                {item.title && (
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </p>
                )}
                {item.message && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Close notification"
                className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: ({ title, message }) => {
        if (typeof window !== "undefined") {
          console.info("[Toast]", title || "", message || "");
        }
      },
      dismiss: () => {},
    };
  }
  return ctx;
}
