import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  description,
  icon: Icon,
  colorScheme = "indigo",
  className = "",
}) {
  const colorMap = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-200/70 dark:bg-indigo-500/12 dark:text-indigo-400 dark:border-indigo-500/25",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25",
    amber:
      "bg-amber-50 text-amber-600 border-amber-200/70 dark:bg-amber-500/12 dark:text-amber-400 dark:border-amber-500/25",
    rose:
      "bg-rose-50 text-rose-600 border-rose-200/70 dark:bg-rose-500/12 dark:text-rose-400 dark:border-rose-500/25",
    sky:
      "bg-sky-50 text-sky-600 border-sky-200/70 dark:bg-sky-500/12 dark:text-sky-400 dark:border-sky-500/25",
    blue:
      "bg-sky-50 text-sky-600 border-sky-200/70 dark:bg-sky-500/12 dark:text-sky-400 dark:border-sky-500/25",
    violet:
      "bg-indigo-50 text-indigo-600 border-indigo-200/70 dark:bg-indigo-500/12 dark:text-indigo-400 dark:border-indigo-500/25",
    slate:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)] transition-all duration-150",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-lg border flex items-center justify-center shrink-0",
              colorMap[colorScheme] || colorMap.indigo
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-[28px] font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
          {value}
        </div>
        {change && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
              isPositive
                ? "text-emerald-700 bg-emerald-50 border-emerald-200/80 dark:bg-emerald-500/12 dark:text-emerald-400 dark:border-emerald-500/25"
                : "text-rose-700 bg-rose-50 border-rose-200/80 dark:bg-rose-500/12 dark:text-rose-400 dark:border-rose-500/25"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
