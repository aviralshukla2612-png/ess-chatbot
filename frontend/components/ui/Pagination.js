"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "items",
  className = "",
}) {
  if (totalItems === 0) return null;

  const safeTotalPages = Math.max(1, totalPages || Math.ceil(totalItems / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const startItem = totalItems > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, "...", safeTotalPages];
    }
    if (safePage >= safeTotalPages - 2) {
      return [1, "...", safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", safeTotalPages];
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "px-4 sm:px-6 py-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto text-[var(--text-muted)]">
        <span className="tabular-nums">
          Showing{" "}
          <strong className="font-semibold text-[var(--text-primary)]">{startItem}</strong>–
          <strong className="font-semibold text-[var(--text-primary)]">{endItem}</strong> of{" "}
          <strong className="font-semibold text-[var(--text-primary)]">{totalItems}</strong>{" "}
          {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 sm:pl-3 sm:border-l border-[var(--border-subtle)]">
            <label className="text-[11px] text-[var(--text-muted)]">Rows:</label>
            <div className="relative">
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange?.(1);
                }}
                className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-medium focus:border-[var(--accent-primary)] cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onPageChange?.(1)}
          disabled={safePage === 1}
          aria-label="First page"
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-[var(--text-muted)] font-mono text-xs"
                >
                  …
                </span>
              );
            }
            const isActive = p === safePage;
            return (
              <button
                key={p}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onPageChange?.(p)}
                className={cn(
                  "min-w-8 h-8 px-2 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <div className="sm:hidden px-3 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-semibold tabular-nums text-[var(--text-primary)]">
          {safePage} / {safeTotalPages}
        </div>

        <button
          type="button"
          onClick={() => onPageChange?.(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage === safeTotalPages}
          aria-label="Next page"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange?.(safeTotalPages)}
          disabled={safePage === safeTotalPages}
          aria-label="Last page"
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
