import React from "react";
import { cn } from "@/lib/utils";

const LABEL_OVERRIDES = {
  AI_ACTIVE: "AI Active",
  HUMAN_ACTIVE: "Agent Live",
  WAITING_FOR_HUMAN: "Needs Agent",
  IN_PROGRESS: "In Progress",
  PAST_DUE: "Past Due",
};

export default function StatusBadge({ status, size = "md", className = "" }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase().trim().replace(/\s+/g, "_");

  const styles = {
    // Active / Healthy / Verified
    ACTIVE: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    AI_ACTIVE: {
      badge:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/14 dark:text-indigo-300 dark:border-indigo-500/30",
      dot: "bg-indigo-600 dark:bg-indigo-400",
    },
    HUMAN_ACTIVE: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400",
    },
    WAITING_FOR_HUMAN: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/14 dark:text-amber-300 dark:border-amber-500/30",
      dot: "bg-amber-500 dark:bg-amber-400 animate-pulse",
    },
    ONLINE: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    READY: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    HEALTHY: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    VERIFIED: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    CONVERTED: {
      badge:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/14 dark:text-emerald-300 dark:border-emerald-500/30",
      dot: "bg-emerald-600 dark:bg-emerald-400",
    },
    COMPLETED: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },

    // Primary / Info / Pipeline
    NEW: {
      badge:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/14 dark:text-indigo-300 dark:border-indigo-500/30",
      dot: "bg-indigo-600 dark:bg-indigo-400",
    },
    TRIALING: {
      badge:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/14 dark:text-indigo-300 dark:border-indigo-500/30",
      dot: "bg-indigo-600 dark:bg-indigo-400",
    },
    CONTACTED: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400",
    },
    QUALIFIED: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-300 dark:border-emerald-500/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    PROCESSING: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400 animate-pulse",
    },
    CRAWLING: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400 animate-pulse",
    },
    INDEXING: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400 animate-pulse",
    },
    IN_PROGRESS: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400 animate-pulse",
    },

    // Warnings / Medium
    DRAFT: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    PENDING: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    OPEN: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    UNANSWERED: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    HIGH: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    WARM: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    MEDIUM: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500 dark:bg-sky-400",
    },
    COOLING: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    PAST_DUE: {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500 dark:bg-amber-400",
    },

    // Danger / Blocked / Hot
    HOT: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    BLOCKED: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-600 dark:bg-rose-400",
    },
    SUSPENDED: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-600 dark:bg-rose-400",
    },
    FAILED: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    ERROR: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    EXPIRED: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    OFFLINE: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    LOST: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-400",
    },

    // Neutral / Closed / Disabled
    RESOLVED: {
      badge:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-400",
    },
    DISABLED: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-500",
    },
    INACTIVE: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-500",
    },
    CANCELLED: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-500",
    },
    CLOSED: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-500",
    },
    LOW: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-500",
    },
    COLD: {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400 dark:bg-slate-500",
    },
  };

  const current = styles[normalized] || {
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400 dark:bg-slate-400",
  };

  const sizeStyle =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5 font-medium"
      : "text-xs px-2.5 py-1 font-medium";

  const displayLabel = LABEL_OVERRIDES[normalized] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border whitespace-nowrap transition-colors",
        sizeStyle,
        current.badge,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", current.dot)} />
      {displayLabel}
    </span>
  );
}
