import React, { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Select({
  label,
  helperText,
  error,
  options = [],
  children,
  className = "",
  selectClassName = "",
  id,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full h-9 appearance-none rounded-lg border bg-[var(--bg-surface)] pl-3 pr-8 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer disabled:opacity-60",
            error ? "border-rose-500" : "border-[var(--border-strong)]",
            selectClassName
          )}
          {...props}
        >
          {children
            ? children
            : options.map((opt) => {
                const val = typeof opt === "object" ? opt.value : opt;
                const lbl = typeof opt === "object" ? opt.label : opt;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
        </select>
        <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {(error || helperText) && (
        <p
          className={cn(
            "mt-1 text-xs",
            error ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-muted)]"
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
