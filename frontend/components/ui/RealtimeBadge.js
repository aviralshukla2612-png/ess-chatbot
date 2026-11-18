"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RealtimeBadge({ isLive = false, lastSynced = null, lastSync = null, onRefresh, className = "" }) {
  const syncedAt = lastSynced || lastSync;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-medium text-[var(--text-muted)] shadow-2xs",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
        )}
      />
      <span>{isLive ? "Live stream" : "Auto-sync"}</span>
      {syncedAt && (
        <span className="hidden md:inline text-[var(--text-muted)]/75 tabular-nums">
          · {new Date(syncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh data"
          title="Refresh now"
          className="p-0.5 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
