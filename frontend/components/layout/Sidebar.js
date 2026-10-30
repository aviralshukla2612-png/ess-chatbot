"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageSquare,
  Users2,
  BarChart3,
  Puzzle,
  UserPlus,
  Settings,
  HelpCircle,
  ChevronDown,
  Building2,
  Sparkles,
  Globe,
  LogOut,
  X,
  ShieldAlert,
  Share2,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bots", href: "/bots", icon: Bot },
  { name: "Knowledge", href: "/knowledge", icon: BookOpen },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Leads", href: "/leads", icon: Users2 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Integrations", href: "/integrations", icon: Puzzle },
  { name: "Team", href: "/team", icon: UserPlus },
  { name: "Billing & Plans", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, subscription: initialSub, onOpenCheckout }) {
  const pathname = usePathname();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState("Emperor Smart Solutions");
  const [orgList, setOrgList] = useState(["Emperor Smart Solutions"]);
  const [currentUser, setCurrentUser] = useState(null);
  const [subData, setSubData] = useState(null);
  const orgDropdownRef = React.useRef(null);

  const fetchSubscription = () => {
    fetch("/api/billing/subscription", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setSubData(d);
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target)) {
        setOrgDropdownOpen(false);
      }
    }
    if (orgDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [orgDropdownOpen]);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          setCurrentUser(d.user);
          const realOrgs = [];
          if (Array.isArray(d.memberships) && d.memberships.length > 0) {
            d.memberships.forEach((m) => {
              const name = m.orgName || m.name;
              if (name && !realOrgs.includes(name)) realOrgs.push(name);
            });
          }
          if (d.user.organization && !realOrgs.includes(d.user.organization)) {
            realOrgs.unshift(d.user.organization);
          }
          if (realOrgs.length === 0) {
            realOrgs.push("Emperor Smart Solutions");
          }
          setOrgList(realOrgs);
          setCurrentOrg(realOrgs[0]);
        }
      })
      .catch(() => {});

    fetchSubscription();

    const handleSubUpdate = () => fetchSubscription();
    window.addEventListener("subscription-updated", handleSubUpdate);
    return () => window.removeEventListener("subscription-updated", handleSubUpdate);
  }, []);

  React.useEffect(() => {
    if (initialSub) {
      setSubData((prev) => ({
        ...prev,
        subscription: initialSub,
        hasActiveSubscription: Boolean(initialSub.hasAutopay),
        isTrial: initialSub.status === "trialing",
      }));
    }
  }, [initialSub]);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111827] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-40 border-r border-slate-800/80 shrink-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand & Organization */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md shadow-indigo-500/15">
                <img src="/e-logoicon.webp" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                NexusAI
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Org Selector */}
          <div className="mt-4 relative" ref={orgDropdownRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentOrg}
                  </p>
                  <p className="text-[10px] text-slate-400">Organization</p>
                </div>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200", orgDropdownOpen && "rotate-180")} />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-[-6px] right-[-6px] mt-2 z-50 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-1.5 text-xs animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                {orgList.map((org) => (
                  <button
                    key={org}
                    type="button"
                    onClick={() => {
                      setCurrentOrg(org);
                      setOrgDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
                      org === currentOrg && "text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-500/20"
                    )}
                  >
                    <span className="truncate">{org}</span>
                    {org === currentOrg && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 shadow-xs shadow-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar sidebar-scroll flex flex-col">
          {(() => {
            const botMatch = pathname.match(/^\/bots\/([^/?]+)/);
            const activeBotId = botMatch && botMatch[1] !== "create" ? botMatch[1] : null;

            return (
              <>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isBotsItem = item.href === "/bots";
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <div key={item.name} className="space-y-1">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                            isActive
                              ? "bg-[#4f46e5] text-white shadow-md shadow-indigo-600/30 font-semibold"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4 transition-transform group-hover:scale-105",
                              isActive ? "text-white" : "text-slate-400"
                            )}
                          />
                          <span className="flex-1">{item.name}</span>
                          {isBotsItem && activeBotId && (
                            <span className="text-[9px] bg-indigo-400/20 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono font-semibold">
                              Open
                            </span>
                          )}
                        </Link>

                        {/* When inside a Bot, show nested Bot Sub-navigation */}
                        {isBotsItem && activeBotId && (
                          <div className="ml-5 pl-2.5 border-l border-indigo-500/30 space-y-1 my-1.5 py-1">
                            {[
                              { name: "Overview", href: `/bots/${activeBotId}`, icon: BarChart3 },
                              { name: "Knowledge Base", href: `/bots/${activeBotId}?tab=knowledge`, icon: BookOpen },
                              { name: "Playground", href: `/bots/${activeBotId}?tab=test`, icon: Sparkles },
                              { name: "Deploy Widget", href: `/bots/${activeBotId}/deploy`, icon: Share2 },
                              { name: "Bot Settings", href: `/bots/${activeBotId}?tab=settings`, icon: Settings },
                            ].map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = pathname === sub.href;

                              return (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                                    isSubActive
                                      ? "bg-indigo-600/25 text-indigo-300 font-semibold"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                  )}
                                >
                                  <SubIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                  <span>{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex-1 min-h-4" />

                {/* Workspace / Bot status card */}
                {/* Razorpay Subscription Widget for Sub Admin */}
                <div className="pt-2">
                  <div className="p-3 rounded-2xl bg-linear-to-b from-slate-800/90 to-slate-900 border border-slate-700/70 shadow-lg relative overflow-hidden group">
                    <div
                      className={cn(
                        "absolute -top-8 -right-8 w-20 h-20 rounded-full blur-xl pointer-events-none transition-opacity",
                        subData?.hasActiveSubscription
                          ? "bg-indigo-500/20 group-hover:bg-indigo-500/30"
                          : "bg-rose-500/20 group-hover:bg-rose-500/30"
                      )}
                    />

                    {/* Header: Razorpay & Status */}
                    <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                          Razorpay Plan
                        </span>
                      </div>
                      {subData?.isTrial ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          {subData.trialDaysRemaining ?? 7}d Trial
                        </span>
                      ) : subData?.hasActiveSubscription ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Action Req
                        </span>
                      )}
                    </div>

                    {/* Plan Details */}
                    <div className="mb-2.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {subData?.isTrial
                            ? "Starter (7-Day Trial)"
                            : subData?.subscription?.plan?.name
                            ? `${subData.subscription.plan.name} Plan`
                            : "No Active Plan"}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-300 font-semibold shrink-0 ml-1">
                          {subData?.isTrial
                            ? "₹0 upfront"
                            : subData?.hasActiveSubscription
                            ? "₹2,499/mo"
                            : "₹2,499/mo"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        {subData?.isTrial
                          ? `Autopay kicks in ${subData?.autopayDate || "Day 8"}. Cancel anytime.`
                          : subData?.hasActiveSubscription
                          ? "Unlimited bots, lead capture & vector search active."
                          : "Autopay inactive. Subscribe to unlock and keep AI bots online."}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="relative z-10">
                      {subData?.hasActiveSubscription ? (
                        <Link
                          href="/billing"
                          onClick={onClose}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-[11px] font-semibold transition-colors"
                        >
                          <span>Manage Subscription</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            if (onOpenCheckout) {
                              onOpenCheckout();
                            } else {
                              window.dispatchEvent(new CustomEvent("open-subscription-modal"));
                            }
                            if (onClose) onClose();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-linear-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-[11px] font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer group-hover:scale-[1.01]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Subscribe Now 🚀</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workspace / Bot status card */}
                <div className="pt-2">
                  <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-medium text-slate-300 text-[10px]">
                        {activeBotId ? "Bot Console Active" : "AI Platform Online"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20">
                      LIVE
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {/* Public Website Link */}
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Website</span>
            </div>
            <span className="text-[9px] font-mono bg-emerald-400/20 px-1 rounded-sm">
              LIVE
            </span>
          </Link>

          {/* Help link */}
          <Link
            href="/support"
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors rounded-xl",
              pathname === "/support"
                ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <HelpCircle className={cn("w-4 h-4", pathname === "/support" ? "text-indigo-400" : "text-slate-500")} />
            <span>Help & Support</span>
          </Link>

          {/* User Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-linear-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.name
                  ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : currentUser?.email
                  ? currentUser.email.slice(0, 2).toUpperCase()
                  : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-indigo-400 font-medium truncate">
                  {currentUser?.email || "Workspace Owner"}
                </p>
              </div>
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
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
