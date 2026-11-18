"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  Plus,
  Sun,
  Moon,
  MessageSquare,
  Users2,
  Bot,
  BookOpen,
  BarChart3,
  CreditCard,
  Settings,
  UserPlus,
  Puzzle,
  HelpCircle,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ROUTES = [
  { label: "Dashboard Overview", href: "/dashboard", keywords: "home stats kpi metrics", icon: BarChart3 },
  { label: "Chatbots", href: "/bots", keywords: "agents assistants create bot", icon: Bot },
  { label: "Create New Chatbot", href: "/bots/create", keywords: "wizard new assistant", icon: Plus },
  { label: "Knowledge Base", href: "/knowledge", keywords: "documents websites crawl rag pdf", icon: BookOpen },
  { label: "Live Conversations", href: "/conversations", keywords: "inbox messages human takeover", icon: MessageSquare },
  { label: "Captured Leads", href: "/leads", keywords: "crm contacts prospects export csv", icon: Users2 },
  { label: "Analytics & Reports", href: "/analytics", keywords: "charts conversion performance", icon: BarChart3 },
  { label: "Integrations & API", href: "/integrations", keywords: "widget webhook whatsapp api", icon: Puzzle },
  { label: "Team & Permissions", href: "/team", keywords: "members invite roles", icon: UserPlus },
  { label: "Billing & Subscription", href: "/billing", keywords: "plans razorpay invoice autopay", icon: CreditCard },
  { label: "Workspace Settings", href: "/settings", keywords: "profile password security", icon: Settings },
  { label: "Help & Support", href: "/support", keywords: "tickets documentation contact", icon: HelpCircle },
];

const ROUTE_TITLES = {
  "/dashboard": "Overview",
  "/bots": "Chatbots",
  "/bots/create": "Create Chatbot",
  "/knowledge": "Knowledge Base",
  "/conversations": "Conversations",
  "/leads": "Leads",
  "/analytics": "Analytics",
  "/integrations": "Integrations",
  "/team": "Team",
  "/billing": "Billing & Plans",
  "/settings": "Settings",
  "/support": "Help & Support",
};

export default function Header({ onToggleSidebar, currentUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [botsList, setBotsList] = useState([]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    syncTheme();
    window.addEventListener("theme-change", syncTheme);
    return () => window.removeEventListener("theme-change", syncTheme);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load real workspace notifications (recent unread conversations + leads) & bots for quick search
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/conversations?limit=4", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/leads", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/bots", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([convRes, leadsRes, botsRes]) => {
      if (!active) return;
      if (Array.isArray(botsRes?.bots)) {
        setBotsList(botsRes.bots);
      }
      const items = [];
      const convs = Array.isArray(convRes?.conversations) ? convRes.conversations : [];
      convs.slice(0, 3).forEach((c) => {
        if ((c.unreadCount || 0) > 0 || c.status === "WAITING_FOR_HUMAN") {
          items.push({
            id: `conv_${c.id}`,
            icon: MessageSquare,
            tone: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15",
            title:
              c.status === "WAITING_FOR_HUMAN"
                ? `Human handoff requested (${c.visitorName || "Visitor"})`
                : `Unread message from ${c.visitorName || "Visitor"}`,
            desc: c.lastMessage || c.botName || "Open live inbox",
            href: "/conversations",
          });
        }
      });

      const leads = Array.isArray(leadsRes?.leads) ? leadsRes.leads : [];
      leads.slice(0, 2).forEach((l) => {
        items.push({
          id: `lead_${l.id}`,
          icon: Users2,
          tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15",
          title: `Lead captured: ${l.name || l.email || l.phone || "Prospect"}`,
          desc: l.inquiry || l.source || "View in Leads pipeline",
          href: "/leads",
        });
      });

      setNotifications(items.slice(0, 5));
      setUnreadCount(convRes?.counts?.unread || 0);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    window.dispatchEvent(new Event("theme-change"));
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const botItems = botsList.map((b) => ({
      label: b.name || "Chatbot",
      sub: b.company || "Open chatbot workspace",
      href: `/bots/${b.id}`,
      keywords: `${b.name || ""} ${b.company || ""} ${b.industry || ""}`.toLowerCase(),
      icon: Bot,
    }));
    const combined = [...botItems, ...QUICK_ROUTES];
    if (!q) return combined.slice(0, 6);
    return combined
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.keywords && item.keywords.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, botsList]);

  const currentSectionTitle = useMemo(() => {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    if (pathname.startsWith("/bots/") && pathname.endsWith("/deploy")) return "Deploy Widget";
    if (pathname.startsWith("/bots/")) return "Bot Workspace";
    return "Workspace";
  }, [pathname]);

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : currentUser?.email
    ? currentUser.email.slice(0, 2).toUpperCase()
    : "WS";

  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.platformRole === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[60px] px-4 sm:px-6 lg:px-8 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors">
      {/* Left: Mobile menu, current section & Quick Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-lg shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="sm:hidden text-sm font-semibold text-[var(--text-primary)] truncate">
          {currentSectionTitle}
        </span>

        <div className="relative max-w-md w-full hidden sm:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            aria-label="Quick navigation search"
            placeholder="Jump to chatbots, inbox, leads, settings..."
            className="w-full h-9 pl-9 pr-14 text-xs lg:text-sm bg-[var(--bg-subtle)]/70 hover:bg-[var(--bg-subtle)] focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] rounded-lg transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            ⌘K
          </kbd>

          {searchOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-lg)] p-1.5 z-50 animate-fade-in">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Quick Jump
              </div>
              {searchResults.length === 0 ? (
                <p className="px-3 py-4 text-xs text-center text-[var(--text-muted)]">
                  No matching pages or chatbots for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          router.push(item.href);
                        }}
                        className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                              {item.label}
                            </p>
                            {item.sub && (
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {item.sub}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme toggle, Create Bot CTA, Notifications, User menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to Light theme" : "Switch to Dark theme"}
          className="h-9 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium hidden md:inline">Dark</span>
            </>
          )}
        </button>

        <Link
          href="/bots/create"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chatbot</span>
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            aria-label="Workspace notifications"
            aria-expanded={notificationsOpen}
            className="relative w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-88 max-w-sm bg-[var(--bg-elevated)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border-subtle)] p-3.5 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                    Workspace Activity
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadCount(0)}
                    className="text-xs text-[var(--accent-primary)] hover:underline font-medium cursor-pointer"
                  >
                    Dismiss badge
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Inbox className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    All caught up
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    New visitor chats and captured leads appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)] max-h-72 overflow-y-auto mt-1">
                  {notifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotificationsOpen(false)}
                        className="py-2.5 px-2 flex items-start gap-3 hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
                      >
                        <div className={cn("p-2 rounded-lg shrink-0", item.tone)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative pl-1.5 border-l border-[var(--border-subtle)]" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-label="Account menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-2xs">
              {initials}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-elevated)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border-subtle)] p-1.5 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {currentUser?.name || "Workspace Account"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {currentUser?.email || ""}
                </p>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Account & Security</span>
              </Link>
              <Link
                href="/billing"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Billing & Plans</span>
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--accent-text)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin Console</span>
                </Link>
              )}

              <div className="my-1 border-t border-[var(--border-subtle)]" />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } catch {}
                  window.location.replace("/login");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
