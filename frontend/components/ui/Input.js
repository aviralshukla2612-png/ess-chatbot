import React, { useId } from "react";
import { cn } from "@/lib/utils";

export default function Input({
  label,
  helperText,
  error,
  icon: Icon,
  rightElement,
  className = "",
  inputClassName = "",
  id,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descId = `${inputId}-desc`;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error || helperText ? descId : undefined}
          className={cn(
            "w-full h-9 rounded-lg border bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-3 transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 disabled:bg-[var(--bg-subtle)]",
            Icon && "pl-9",
            rightElement && "pr-9",
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-[var(--border-strong)]",
            inputClassName
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p
          id={descId}
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
