"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Menu, Search, Sun, Moon, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";

const ADMIN_SEARCH_ITEMS = [
  { label: "Platform Overview", href: "/admin", keywords: "stats revenue health kpi" },
  { label: "AI Evaluations", href: "/admin/ai-evaluations", keywords: "accuracy quality rag test" },
  { label: "API Keys & Pool Limits", href: "/admin/keys", keywords: "groq tokens quota rotation" },
  { label: "Organizations & Tenants", href: "/admin/organizations", keywords: "workspaces suspend tenants" },
  { label: "Users & Access", href: "/admin/users", keywords: "accounts block roles" },
  { label: "All Chatbots", href: "/admin/bots", keywords: "assistants models status" },
  { label: "Global Conversations", href: "/admin/conversations", keywords: "transcripts sessions chats" },
  { label: "Platform Leads", href: "/admin/leads", keywords: "prospects crm contacts" },
  { label: "Plans & Pricing", href: "/admin/plans", keywords: "razorpay billing subscription" },
  { label: "Support Tickets", href: "/admin/tickets", keywords: "help customer issues" },
  { label: "Resource Usage", href: "/admin/usage", keywords: "storage vectors messages" },
  { label: "Platform Settings", href: "/admin/settings", keywords: "llm webhooks maintenance" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    syncTheme();
    window.addEventListener("theme-change", syncTheme);
    return () => window.removeEventListener("theme-change", syncTheme);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

  const filteredItems = ADMIN_SEARCH_ITEMS.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || item.keywords.includes(q);
  }).slice(0, 7);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-150">
        {/* Top Admin Context Bar */}
        <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 py-1.5 text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Emperor Nexus · Super Admin Console</span>
          </div>
          <Link
            href="/dashboard"
            className="text-[var(--accent-primary)] hover:underline text-xs font-semibold transition-colors"
          >
            Tenant Workspace →
          </Link>
        </div>

        <div className="flex flex-1 min-h-[calc(100vh-33px)]">
          <Suspense
            fallback={
              <aside className="w-[260px] hidden lg:block bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] sticky top-0 h-screen shrink-0" />
            }
          >
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </Suspense>

          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 flex items-center justify-between h-[60px] px-4 sm:px-6 lg:px-8 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((o) => !o)}
                  aria-label="Open admin sidebar"
                  className="lg:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="relative max-w-md w-full hidden sm:block" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    placeholder="Jump to tenants, users, keys, tickets..."
                    aria-label="Search admin console"
                    className="w-full h-9 pl-9 pr-3.5 text-xs sm:text-sm bg-[var(--bg-subtle)]/70 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
                  />
                  {searchOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-lg)] p-1.5 z-50 animate-fade-in">
                      {filteredItems.map((it) => (
                        <button
                          key={it.href}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                            router.push(it.href);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                        >
                          <span>{it.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="h-9 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] flex items-center gap-1.5 cursor-pointer"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium hidden sm:inline">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium hidden sm:inline">Dark</span>
                    </>
                  )}
                </button>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="hidden sm:inline">Operational</span>
                </span>

                <div className="flex items-center gap-2 pl-2.5 border-l border-[var(--border-subtle)]">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
                    SA
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                      Platform Admin
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                      SUPER_ADMIN
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
              <Suspense fallback={<div className="py-12" />}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
