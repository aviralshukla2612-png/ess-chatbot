import React from "react";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status, size = "md" }) {
  if (!status) return null;

  const normalized = status.toUpperCase().trim();

  const styles = {
    // Bot / Org / Session Statuses
    ACTIVE: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 font-semibold",
      dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse",
    },
    RESOLVED: {
      badge:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800/90 dark:text-neutral-300 dark:border-neutral-700 font-medium",
      dot: "bg-slate-400 dark:bg-neutral-400",
    },
    DRAFT: {
      badge:
        "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-medium",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    PROCESSING: {
      badge:
        "bg-[#B68A55]/10 text-[#B68A55] border-[#B68A55]/25 dark:bg-[#B68A55]/15 dark:text-[#B68A55] dark:border-[#B68A55]/30 font-medium animate-pulse",
      dot: "bg-[#B68A55] animate-pulse",
    },
    IN_PROGRESS: {
      badge:
        "bg-[#B68A55]/10 text-[#B68A55] border-[#B68A55]/25 dark:bg-[#B68A55]/15 dark:text-[#B68A55] dark:border-[#B68A55]/30 font-medium animate-pulse",
      dot: "bg-[#B68A55] animate-pulse",
    },
    DISABLED: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 font-medium",
      dot: "bg-slate-400 dark:bg-neutral-500",
    },
    INACTIVE: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 font-medium",
      dot: "bg-slate-400 dark:bg-neutral-500",
    },
    BLOCKED: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 font-bold",
      dot: "bg-rose-600 dark:bg-rose-400",
    },
    SUSPENDED: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 font-bold",
      dot: "bg-rose-600 dark:bg-rose-400",
    },

    // Lead Commercial Scores
    HOT: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 font-bold",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    HIGH: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-semibold",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    WARM: {
      badge:
        "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30 font-semibold",
      dot: "bg-orange-500 dark:bg-orange-400",
    },
    MEDIUM: {
      badge:
        "bg-[#B68A55]/10 text-[#B68A55] border-[#B68A55]/25 dark:bg-[#B68A55]/15 dark:text-[#B68A55] dark:border-[#B68A55]/30 font-medium",
      dot: "bg-[#B68A55]",
    },
    LOW: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 font-medium",
      dot: "bg-slate-400 dark:bg-neutral-500",
    },
    COLD: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 font-medium",
      dot: "bg-slate-400 dark:bg-neutral-500",
    },

    // Lead Pipeline Statuses
    NEW: {
      badge:
        "bg-[#B68A55]/10 text-[#B68A55] border-[#B68A55]/25 dark:bg-[#B68A55]/15 dark:text-[#B68A55] dark:border-[#B68A55]/30 font-semibold",
      dot: "bg-[#B68A55]",
    },
    CONTACTED: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25 font-medium",
      dot: "bg-sky-500 dark:bg-sky-400",
    },
    QUALIFIED: {
      badge:
        "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/25 font-semibold",
      dot: "bg-teal-500 dark:bg-teal-400",
    },
    CONVERTED: {
      badge:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 font-bold",
      dot: "bg-emerald-600 dark:bg-emerald-400",
    },
    LOST: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 font-medium",
      dot: "bg-rose-400",
    },
    CLOSED: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 font-medium",
      dot: "bg-slate-400 dark:bg-neutral-500",
    },

    // System Status
    ONLINE: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 font-semibold",
      dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse",
    },
    OFFLINE: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 font-medium",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    READY: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 font-medium",
      dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse",
    },
    UNANSWERED: {
      badge:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-medium",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    OPEN: {
      badge:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-medium",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
  };

  const current = styles[normalized] || {
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800/90 dark:text-neutral-300 dark:border-neutral-700 font-medium",
    dot: "bg-slate-400 dark:bg-neutral-400",
  };

  const sizeStyle =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5 tracking-tight font-medium"
      : "text-xs px-3 py-1 font-medium";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs whitespace-nowrap transition-colors",
        sizeStyle,
        current.badge
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", current.dot)} />
      {status}
    </span>
  );
}
