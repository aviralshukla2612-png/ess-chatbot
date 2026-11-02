"use client";

import React, { useState, useEffect, Suspense } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Menu, Search, Sun, Moon } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const handleThemeChange = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (e) {}
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#000000] text-[#252525] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Banner Notice for Super Admin Mode */}
      <div className="bg-[#FAF9F6] dark:bg-[#0A0A0A] border-b border-[#EFE7DC] dark:border-neutral-800 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-300 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Emperor Smart Solution • Master Platform Controller</span>
        </div>
        <Link
          href="/dashboard"
          className="text-[#B68A55] hover:text-[#966E3A] dark:hover:text-white text-[11px] font-semibold transition-colors"
        >
          Switch to Tenant Workspace →
        </Link>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-32px)]">
        <Suspense fallback={<aside className="w-64 hidden lg:block bg-[#FAF9F6] dark:bg-[#0A0A0A] border-r border-[#EFE7DC] dark:border-neutral-800 sticky top-0 h-screen shrink-0" />}>
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Admin Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 lg:px-8 bg-[#FAF9F6]/90 dark:bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#EFE7DC] dark:border-neutral-800 transition-colors">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-[#252525] dark:text-neutral-400 hover:bg-[#EFE7DC]/60 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative max-w-md w-full hidden sm:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Global search tenants, bots, users..."
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-[#121212] hover:bg-[#FAF9F6] dark:hover:bg-[#161616] border border-[#EFE7DC] dark:border-neutral-800 rounded-xl outline-hidden focus:border-[#B68A55] text-[#252525] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Light / Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="px-2.5 py-1.5 rounded-xl border border-[#EFE7DC] dark:border-neutral-800 bg-white dark:bg-[#121212] text-[#252525] dark:text-slate-200 hover:bg-[#FAF9F6] dark:hover:bg-neutral-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode (Ivory & Champagne)" : "Switch to Dark Mode (Pitch Black)"}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 text-[#B68A55]" />
                    <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#B68A55]" />
                    <span className="text-[11px] font-semibold text-[#252525] hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">All Systems Operational</span>
                <span className="sm:hidden">Online</span>
              </span>

              <div className="flex items-center gap-2 pl-3 border-l border-[#EFE7DC] dark:border-neutral-800">
                <div
                  title="Emperor Smart Solution (Super Admin)"
                  className="w-8 h-8 rounded-full bg-[#B68A55] text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-default"
                >
                  ESS
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#252525] dark:text-white leading-tight">
                    Emperor Smart Solution
                  </p>
                  <p className="text-[10px] text-[#B68A55] font-semibold leading-tight">
                    Super Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
