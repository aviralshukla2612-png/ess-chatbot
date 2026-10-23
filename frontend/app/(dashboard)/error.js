"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function DashboardErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("[DASHBOARD_ERROR_BOUNDARY]", error);
  }, [error]);

  return (
    <div className="min-h-[450px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
            {error?.message || "An unexpected error occurred while loading this page. Please try again."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
