"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

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

  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startItem = totalItems > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safePage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`px-4 sm:px-6 py-3 sm:py-3.5 bg-white dark:bg-[#0D0D0D] border-t border-[#EFE7DC] dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Left: Summary Count & Page Size Selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto text-slate-500 dark:text-neutral-400">
        <span className="text-[11px] sm:text-xs">
          Showing <strong className="font-bold text-[#252525] dark:text-white">{startItem}</strong> to{" "}
          <strong className="font-bold text-[#252525] dark:text-white">{endItem}</strong> of{" "}
          <strong className="font-bold text-[#252525] dark:text-white">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-0 sm:pl-2 sm:border-l border-[#EFE7DC] dark:border-neutral-800">
            <span className="text-[11px] text-slate-400">Per page:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  if (onPageChange) onPageChange(1);
                }}
                className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-[#252525] dark:text-neutral-200 text-xs font-semibold outline-hidden focus:border-[#B68A55] cursor-pointer shadow-2xs"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Right: Controls & Page Numbers */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full sm:w-auto">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage === 1}
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-slate-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#1E1E1E] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-slate-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#1E1E1E] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-medium shadow-2xs"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">Prev</span>
        </button>

        {/* Page Number Pills (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 dark:text-neutral-500 font-mono text-xs select-none"
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
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? "bg-[#252525] text-white dark:bg-[#B68A55] dark:text-white shadow-xs scale-105"
                    : "border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-slate-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#1E1E1E] hover:border-[#B68A55]/40"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Mobile Compact Page Display */}
        <div className="sm:hidden px-3 py-1 rounded-lg border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-[11px] font-bold text-[#252525] dark:text-white">
          <span>
            {safePage} / {totalPages}
          </span>
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-slate-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#1E1E1E] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-medium shadow-2xs"
          title="Next Page"
        >
          <span className="text-[11px] hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage === totalPages}
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-[#EFE7DC] dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141414] text-slate-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#1E1E1E] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
