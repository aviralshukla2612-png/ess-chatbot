"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Building2,
  Users,
  Bot,
  Users2,
  HardDrive,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  LogOut,
  CreditCard,
  LifeBuoy,
  Key,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "AI Evaluations", href: "/admin/ai-evaluations", icon: Sparkles },
  { name: "API Keys & Limits", href: "/admin/keys", icon: Key },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Chatbots", href: "/admin/bots", icon: Bot },
  { name: "Conversations", href: "/admin/conversations", icon: MessageSquare },
  { name: "Leads", href: "/admin/leads", icon: Users2 },
  { name: "Plans & Pricing", href: "/admin/plans", icon: CreditCard },
  { name: "Support Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { name: "Resource Usage", href: "/admin/usage", icon: HardDrive },
  { name: "Abuse & Security", href: "/admin/abuse", icon: ShieldAlert },
  { name: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [keyStats, setKeyStats] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/keys", { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          if (data.ok) setKeyStats(data.stats);
        }
      } catch {}
    }
    fetchStats();
    const timer = setInterval(fetchStats, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        aria-label="Admin navigation"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-[var(--bg-surface)] text-[var(--text-secondary)] flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-40 shrink-0 select-none border-r border-[var(--border-subtle)]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 pt-4 pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center p-1">
                <img
                  src="/favicon.svg"
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div>
                <span className="block text-sm font-bold text-[var(--text-primary)] leading-none">
                  Emperor Nexus
                </span>
                <span className="block text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  Control Plane
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin sidebar"
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 p-2.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[var(--accent-text)] text-[10px] font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </div>
              <Link
                href="/dashboard"
                className="text-[11px] text-[var(--accent-primary)] hover:underline font-medium"
              >
                Tenant App →
              </Link>
            </div>
            <p className="font-semibold text-[var(--text-primary)] text-xs truncate">
              Emperor Smart Solutions
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 sidebar-scroll">
          {adminNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors group",
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Groq Key Pool Widget */}
        <div className="px-3 pb-2">
          <Link
            href="/admin/keys"
            onClick={onClose}
            className="block p-3 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <Key className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Groq Key Pool</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
                {keyStats ? `${keyStats.activeKeysCount || 0} active` : "Pool"}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] tabular-nums">
                <span className="text-[var(--text-muted)]">Daily Requests</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {keyStats
                    ? `${keyStats.totalDailyRequests || 0} / ${((keyStats.totalCapacityRequests || 14400) / 1000).toFixed(1)}k`
                    : "0 / 14.4k"}
                </span>
              </div>
              <div className="w-full bg-[var(--bg-muted)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, keyStats?.overallDailyPercent || 0)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] pt-0.5 tabular-nums">
                <span>
                  Tokens:{" "}
                  <strong className="text-[var(--text-secondary)]">
                    {(((keyStats?.totalAllTimeTokens || keyStats?.totalTokens || 0)) / 1000).toFixed(1)}k
                  </strong>
                </span>
                <span className="text-[var(--accent-primary)] font-medium">Manage →</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="p-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  Platform Admin
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  Control Plane
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch {}
                window.location.replace("/login");
              }}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
