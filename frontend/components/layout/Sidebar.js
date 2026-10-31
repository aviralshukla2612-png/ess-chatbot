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
  { name: "Team", href: "/team", icon: UserPlus },
  { name: "Billing & Plans", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, subscription: initialSub, onOpenCheckout }) {
  const pathname = usePathname();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState("My Workspace");
  const [orgList, setOrgList] = useState(["My Workspace"]);
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
          const userName = d.user.name || d.user.email?.split("@")[0] || "User";
          const userWorkspace = `${userName}'s Workspace`;

          const realOrgs = [userWorkspace];
          if (Array.isArray(d.memberships) && d.memberships.length > 0) {
            d.memberships.forEach((m) => {
              const name = m.orgName || m.name;
              if (name && !realOrgs.includes(name)) realOrgs.push(name);
            });
          }
          if (d.user.organization && !realOrgs.includes(d.user.organization)) {
            realOrgs.push(d.user.organization);
          }

          setOrgList(realOrgs);
          setCurrentOrg(userWorkspace);
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
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FAF9F6] dark:bg-[#0A0A0A] text-[#252525] dark:text-neutral-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-40 border-r border-[#EFE7DC] dark:border-neutral-800 shrink-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand & Organization */}
        <div className="p-5 border-b border-[#EFE7DC] dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-[#121212] border border-[#EFE7DC] dark:border-neutral-800 shadow-xs">
                <img src="/e-logoicon.webp" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="font-bold text-lg text-[#252525] dark:text-white tracking-tight">
                NexusAI
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-[#252525] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Org Selector */}
          <div className="mt-4 relative" ref={orgDropdownRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#121212] hover:bg-[#FAF9F6] dark:hover:bg-neutral-900 border border-[#EFE7DC] dark:border-neutral-800 transition-colors text-left shadow-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-[#B68A55]/15 border border-[#B68A55]/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#B68A55]" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#252525] dark:text-white truncate">
                    {currentOrg}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400">Organization</p>
                </div>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200", orgDropdownOpen && "rotate-180")} />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-[-6px] right-[-6px] mt-2 z-50 bg-white dark:bg-[#0D0D0D] backdrop-blur-xl border border-[#EFE7DC] dark:border-neutral-800 rounded-xl shadow-2xl p-1.5 text-xs animate-in fade-in-0 zoom-in-95 duration-100">
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
                      "w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-[#FAF9F6] dark:hover:bg-neutral-800 hover:text-[#252525] dark:hover:text-white transition-colors",
                      org === currentOrg && "text-[#B68A55] font-semibold bg-[#B68A55]/15 border border-[#B68A55]/30"
                    )}
                  >
                    <span className="truncate">{org}</span>
                    {org === currentOrg && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B68A55] shrink-0 shadow-xs" />
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
                              ? "bg-[#252525] text-white shadow-sm font-semibold dark:bg-[#B68A55] dark:text-white"
                              : "text-slate-600 dark:text-neutral-400 hover:text-[#252525] dark:hover:text-white hover:bg-white dark:hover:bg-neutral-900"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4 transition-transform group-hover:scale-105",
                              isActive ? "text-white" : "text-slate-500 dark:text-neutral-400"
                            )}
                          />
                          <span className="flex-1">{item.name}</span>
                          {isBotsItem && activeBotId && (
                            <span className="text-[9px] bg-[#B68A55]/15 text-[#B68A55] px-1.5 py-0.5 rounded-md font-mono font-semibold">
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
                                      ? "bg-[#B68A55]/20 text-[#B68A55] font-semibold"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-neutral-800/60"
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

                {/* Razorpay Subscription Widget for Sub Admin */}
                <div className="pt-2">
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 shadow-xs relative overflow-hidden group">
                    <div
                      className={cn(
                        "absolute -top-8 -right-8 w-20 h-20 rounded-full blur-xl pointer-events-none transition-opacity",
                        subData?.hasActiveSubscription
                          ? "bg-[#B68A55]/20 group-hover:bg-[#B68A55]/30"
                          : "bg-rose-500/20 group-hover:bg-rose-500/30"
                      )}
                    />

                    {/* Header: Razorpay & Status */}
                    <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#B68A55]" />
                        <span className="text-[10px] font-bold tracking-wider uppercase text-[#252525] dark:text-neutral-300">
                          Razorpay Plan
                        </span>
                      </div>
                      {subData?.isTrial ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {subData.trialDaysRemaining ?? 7}d Trial
                        </span>
                      ) : subData?.hasActiveSubscription ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Action Req
                        </span>
                      )}
                    </div>

                    {/* Plan Details */}
                    <div className="mb-2.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#252525] dark:text-white truncate">
                          {subData?.isTrial
                            ? "Starter (7-Day Trial)"
                            : subData?.subscription?.plan?.name
                            ? `${subData.subscription.plan.name} Plan`
                            : "No Active Plan"}
                        </span>
                        <span className="text-[10px] font-mono text-[#B68A55] font-semibold shrink-0 ml-1">
                          {subData?.isTrial
                            ? "₹0 upfront"
                            : subData?.hasActiveSubscription
                            ? "₹2,499/mo"
                            : "₹2,499/mo"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 leading-snug">
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
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EFE7DC]/60 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-[#EFE7DC] dark:border-neutral-700 text-[#252525] dark:text-neutral-200 text-[11px] font-semibold transition-colors"
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
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#252525] hover:bg-black dark:bg-[#B68A55] dark:hover:bg-[#9F7645] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer group-hover:scale-[1.01]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          <span>Subscribe Now 🚀</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workspace / Bot status card */}
                <div className="pt-2">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 flex items-center justify-between text-[11px] shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-medium text-slate-700 dark:text-neutral-300 text-[10px]">
                        {activeBotId ? "Bot Console Active" : "AI Platform Online"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[#B68A55] bg-[#B68A55]/15 px-1 py-0.2 rounded border border-[#B68A55]/30">
                      LIVE
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#EFE7DC] dark:border-neutral-800 space-y-2">
          {/* Public Website Link */}
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Public Website</span>
            </div>
            <span className="text-[9px] font-mono bg-emerald-500/20 px-1 rounded-sm">
              LIVE
            </span>
          </Link>

          {/* Help link */}
          <Link
            href="/support"
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors rounded-xl",
              pathname === "/support"
                ? "bg-[#252525]/10 text-[#252525] font-semibold dark:bg-[#B68A55]/20 dark:text-[#B68A55]"
                : "text-slate-600 dark:text-neutral-400 hover:text-[#252525] dark:hover:text-neutral-200"
            )}
          >
            <HelpCircle className={cn("w-4 h-4", pathname === "/support" ? "text-[#B68A55]" : "text-slate-400 dark:text-neutral-500")} />
            <span>Help & Support</span>
          </Link>

          {/* User Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#252525] dark:bg-[#B68A55] text-[#FAF9F6] font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.name
                  ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : currentUser?.email
                  ? currentUser.email.slice(0, 2).toUpperCase()
                  : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#252525] dark:text-white truncate">
                  {currentUser?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-[#B68A55] font-medium truncate">
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
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
