"use client";

import React, { useState, Suspense } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Menu, ShieldAlert, Search } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="dark min-h-screen bg-[#000000] text-slate-100 flex flex-col font-sans">
      {/* Top Banner Notice for Super Admin Mode */}
      <div className="bg-[#0A0A0A] border-b border-neutral-800 px-4 py-1.5 text-xs font-medium text-neutral-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Emperor Smart Solution • Master Platform Controller</span>
        </div>
        <Link
          href="/dashboard"
          className="text-[#B68A55] hover:text-white text-[11px] font-semibold transition-colors"
        >
          Switch to Tenant Workspace →
        </Link>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-32px)]">
        <Suspense fallback={<aside className="w-64 hidden lg:block bg-[#0A0A0A] border-r border-neutral-800 sticky top-0 h-screen shrink-0" />}>
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Admin Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 lg:px-8 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-neutral-800">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative max-w-md w-full hidden sm:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Global search tenants, bots, users..."
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#121212] hover:bg-[#161616] border border-neutral-800 rounded-xl outline-hidden focus:border-[#B68A55] text-white placeholder:text-neutral-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
              <div className="flex items-center gap-2 pl-3 border-l border-neutral-800">
                <div
                  title="Emperor Smart Solution (Super Admin)"
                  className="w-8 h-8 rounded-full bg-[#B68A55] text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-default"
                >
                  ESS
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">
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
