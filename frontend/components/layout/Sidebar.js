"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Share2,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Inbox,
  CheckCircle2,
  Activity,
  SlidersHorizontal,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chatbots", href: "/bots", icon: Bot },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Leads", href: "/leads", icon: Users2 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Integrations", href: "/integrations", icon: Puzzle },
  { name: "Team", href: "/team", icon: UserPlus },
  { name: "Billing & Plans", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({
  isOpen,
  onClose,
  currentUser,
  memberships = [],
  subscription,
  subMeta,
  onSwitchWorkspace,
  onOpenCheckout,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams?.get("tab") || "";
  const activeViewParam = searchParams?.get("view") || "";

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(false);
  const [convCounts, setConvCounts] = useState({
    unread: 0,
    unassigned: 0,
    assignedToMe: 0,
    resolved: 0,
    all: 0,
  });
  const orgDropdownRef = useRef(null);

  const fetchConvCounts = () => {
    fetch("/api/conversations?limit=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.counts) {
          setConvCounts(d.counts);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
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

  useEffect(() => {
    fetchConvCounts();
    const handleConvUpdate = () => fetchConvCounts();
    window.addEventListener("conversation-updated", handleConvUpdate);
    const convInterval = setInterval(fetchConvCounts, 20000);
    return () => {
      window.removeEventListener("conversation-updated", handleConvUpdate);
      clearInterval(convInterval);
    };
  }, []);

  const workspaceOptions = React.useMemo(() => {
    if (Array.isArray(memberships) && memberships.length > 0) {
      return memberships.map((m) => ({
        id: m.organizationId || m.orgId || m.id,
        name: m.orgName || m.name || "Workspace",
        role: m.role || "MEMBER",
      }));
    }
    const fallbackName =
      currentUser?.organization ||
      (currentUser?.name ? `${currentUser.name}'s Workspace` : "Workspace");
    return [
      {
        id: currentUser?.organizationId || "default",
        name: fallbackName,
        role: currentUser?.orgRole || "ORG_OWNER",
      },
    ];
  }, [memberships, currentUser]);

  const activeWorkspace =
    workspaceOptions.find((w) => w.id === currentUser?.organizationId) ||
    workspaceOptions[0];

  const handleSelectWorkspace = async (org) => {
    setOrgDropdownOpen(false);
    if (!org?.id || org.id === currentUser?.organizationId || switchingOrg) return;
    setSwitchingOrg(true);
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: org.id }),
      });
      if (res.ok) {
        onSwitchWorkspace?.();
        window.location.reload();
      }
    } catch {
      // Ignore transient network failures
    } finally {
      setSwitchingOrg(false);
    }
  };

  const botMatch = pathname.match(/^\/bots\/([^/?]+)/);
  const activeBotId = botMatch && botMatch[1] !== "create" ? botMatch[1] : null;

  const hasActiveSub = Boolean(subscription?.hasAutopay || subMeta?.hasActiveSubscription);
  const planPriceLabel = subscription?.plan?.priceMonthly || "₹2,499/mo";
  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.platformRole === "SUPER_ADMIN";

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : currentUser?.email
    ? currentUser.email.slice(0, 2).toUpperCase()
    : "WS";

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        aria-label="Primary sidebar navigation"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-[var(--bg-surface)] text-[var(--text-secondary)] flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-40 border-r border-[var(--border-subtle)] shrink-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand & Workspace Switcher */}
        <div className="px-4 pt-4 pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                <img
                  src="/favicon.svg"
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold tracking-tight text-[var(--text-primary)] leading-none">
                  Emperor Nexus
                </span>
                <span className="block text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                  AI Sales & Support
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 relative" ref={orgDropdownRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen((o) => !o)}
              aria-expanded={orgDropdownOpen}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-subtle)]/70 hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {switchingOrg ? "Switching..." : activeWorkspace?.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {activeWorkspace?.role?.replace("ORG_", "") || "Workspace"}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-150",
                  orgDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-lg)] p-1.5 text-xs animate-fade-in">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Workspaces
                </div>
                {workspaceOptions.map((org) => {
                  const selected = org.id === activeWorkspace?.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelectWorkspace(org)}
                      className={cn(
                        "w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer",
                        selected
                          ? "bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <span className="truncate">{org.name}</span>
                      {selected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 sidebar-scroll flex flex-col">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isBotsItem = item.href === "/bots";
              const isConversationsItem = item.href === "/conversations";
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <div key={item.name} className="space-y-0.5">
                  <Link
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
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                      )}
                    />
                    <span className="flex-1 truncate">{item.name}</span>

                    {isBotsItem && activeBotId && (
                      <span className="text-[10px] bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] px-1.5 py-0.5 rounded font-semibold">
                        Active
                      </span>
                    )}
                    {isConversationsItem && convCounts.unread > 0 && (
                      <span className="text-[11px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
                        {convCounts.unread}
                      </span>
                    )}
                    {isConversationsItem && convCounts.unread === 0 && convCounts.unassigned > 0 && (
                      <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
                        {convCounts.unassigned}
                      </span>
                    )}
                  </Link>

                  {/* Conversations Sub-Navigation */}
                  {isConversationsItem && pathname.startsWith("/conversations") && (
                    <div className="ml-4 pl-3 border-l border-[var(--border-subtle)] space-y-0.5 my-1 py-0.5">
                      {[
                        { name: "All Inbox", view: "", href: "/conversations", icon: MessageSquare, count: convCounts.all },
                        { name: "Assigned to Me", view: "assigned_to_me", href: "/conversations?view=assigned_to_me", icon: UserCheck, count: convCounts.assignedToMe },
                        { name: "Unassigned", view: "unassigned", href: "/conversations?view=unassigned", icon: Inbox, count: convCounts.unassigned },
                        { name: "Resolved", view: "resolved", href: "/conversations?view=resolved", icon: CheckCircle2, count: convCounts.resolved },
                        { name: "Team Activity", view: "team_activity", href: "/conversations?view=team_activity", icon: Activity },
                        { name: "Bot Controls", view: "bot_controls", href: "/conversations?view=bot_controls", icon: SlidersHorizontal },
                      ].map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = activeViewParam === sub.view;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                              subActive
                                ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/60"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <SubIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{sub.name}</span>
                            </div>
                            {typeof sub.count === "number" && sub.count > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                                {sub.count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Chatbot Sub-Navigation */}
                  {isBotsItem && activeBotId && (
                    <div className="ml-4 pl-3 border-l border-[var(--border-subtle)] space-y-0.5 my-1 py-0.5">
                      {[
                        { name: "Overview", tab: "overview", href: `/bots/${activeBotId}`, icon: BarChart3 },
                        { name: "Knowledge Base", tab: "knowledge", href: `/bots/${activeBotId}?tab=knowledge`, icon: BookOpen },
                        { name: "Playground", tab: "test", href: `/bots/${activeBotId}?tab=test`, icon: Sparkles },
                        { name: "Deploy Widget", tab: "deploy_route", href: `/bots/${activeBotId}/deploy`, icon: Share2 },
                        { name: "Bot Settings", tab: "settings", href: `/bots/${activeBotId}?tab=settings`, icon: Settings },
                      ].map((sub) => {
                        const SubIcon = sub.icon;
                        const isDeployRoute = pathname === `/bots/${activeBotId}/deploy`;
                        const isSubActive =
                          sub.tab === "deploy_route"
                            ? isDeployRoute
                            : !isDeployRoute &&
                              ((sub.tab === "overview" && (!activeTabParam || activeTabParam === "overview")) ||
                                activeTabParam === sub.tab);

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                              isSubActive
                                ? "bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/60"
                            )}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{sub.name}</span>
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

          {/* Plan Summary Card */}
          <div className="pt-2">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                  <CreditCard className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Subscription</span>
                </div>
                {hasActiveSub ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                    Setup needed
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {subscription?.plan?.name
                    ? `${subscription.plan.name}`
                    : "Starter Plan"}
                </span>
                <span className="text-[11px] font-mono font-medium text-[var(--text-muted)] shrink-0">
                  {planPriceLabel}
                </span>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] leading-snug mb-2.5">
                {hasActiveSub
                  ? "Live chat, vector RAG & lead capture active."
                  : "Activate your plan to deploy chatbots."}
              </p>

              {hasActiveSub ? (
                <Link
                  href="/billing"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium transition-colors"
                >
                  <span>Manage Plan</span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCheckout) onOpenCheckout();
                    else window.dispatchEvent(new CustomEvent("open-subscription-modal"));
                    onClose?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-white/20 text-white" />
                  <span>Activate Plan</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-1.5">
          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-text)] bg-[var(--accent-soft)] hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Platform Admin</span>
              </div>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          <div className="flex items-center justify-between gap-1">
            <Link
              href="/support"
              onClick={onClose}
              className={cn(
                "flex-1 flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors",
                pathname === "/support"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              )}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Support</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              title="Open public website"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website</span>
            </Link>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {currentUser?.name || "Workspace User"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {currentUser?.email || "Authenticated"}
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
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
