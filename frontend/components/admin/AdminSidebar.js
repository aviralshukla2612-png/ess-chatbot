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
  Activity,
  Settings,
  HelpCircle,
  LayoutDashboard,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  LogOut,
  CreditCard,
  LifeBuoy,
  Key,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "AI Evaluations", href: "/admin/ai-evaluations", icon: Sparkles },
  { name: "API Keys & Limits", href: "/admin/keys", icon: Key },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Bots", href: "/admin/bots", icon: Bot },
  { name: "Conversations", href: "/admin/conversations", icon: MessageSquare },
  { name: "Leads", href: "/admin/leads", icon: Users2 },
  { name: "Plans & Pricing", href: "/admin/plans", icon: CreditCard },
  { name: "Support Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { name: "Usage", href: "/admin/usage", icon: HardDrive },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [keyStats, setKeyStats] = React.useState(null);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/keys");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) setKeyStats(data.stats);
        }
      } catch {}
    }
    fetchStats();
    const timer = setInterval(fetchStats, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111827] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-40 shrink-0 select-none border-r border-slate-800/80",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ChatPilot Logo & Super Admin Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md shadow-indigo-500/15">
              <img src="/e-logoicon.webp" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              NexusAI
            </span>
          </div>

          {/* Super Admin Organization Identity */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-800/90 border border-indigo-500/30 text-xs shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </div>
              <Link
                href="/dashboard"
                title="Switch to Tenant Workspace"
                className="text-[10px] text-indigo-400 hover:text-indigo-200 font-medium underline"
              >
                Tenant App →
              </Link>
            </div>
            <p className="font-bold text-slate-100 text-xs truncate">
              Emperor Smart Solution
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 no-scrollbar sidebar-scroll">
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
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all",
                  isActive
                    ? "bg-[#4f46e5] text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-white" : "text-slate-400"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Groq Key Pool & Daily Limit Card */}
        <div className="px-3 pt-2">
          <Link
            href="/admin/keys"
            onClick={onClose}
            className="block p-3 rounded-2xl bg-linear-to-b from-indigo-950/60 to-slate-900/90 border border-indigo-500/25 hover:border-indigo-400/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                <Key className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span>Groq Key Pool</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {keyStats ? `${keyStats.activeKeysCount || 0} Active` : "1 Key"}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Daily Requests</span>
                <span className="font-semibold text-slate-200">
                  {keyStats ? `${keyStats.totalDailyRequests || 0} / ${((keyStats.totalCapacityRequests || 14400)/1000).toFixed(0)}k` : "0 / 14.4k"}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-linear-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, keyStats?.overallDailyPercent || 0)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                <span>Tokens: <b className="text-slate-300">{((keyStats?.totalDailyTokens || 0) / 1000).toFixed(1)}k</b></span>
                <span className="text-indigo-400 group-hover:text-indigo-200 font-medium">Manage →</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Profile and Platform Status directly following menu items */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* Platform Status indicator */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 bg-slate-800/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Platform Online</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              ESS
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-100 truncate">
                Admin
              </p>
              <p className="text-[11px] text-indigo-400 font-medium truncate">
                Super Admin
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch {}
                window.location.replace("/login");
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
