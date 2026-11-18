import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  shortcut,
  className = "",
  inputRef,
  ...props
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] pl-9 pr-8 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] absolute right-2 top-1/2 -translate-y-1/2 rounded cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        shortcut && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            {shortcut}
          </kbd>
        )
      )}
    </div>
  );
}
