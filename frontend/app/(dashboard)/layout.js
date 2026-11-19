"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TrialBanner from "@/components/billing/TrialBanner";
import TrialOnboardingModal from "@/components/billing/TrialOnboardingModal";
import BotBenefitsView from "@/components/billing/BotBenefitsView";
import { ToastProvider } from "@/components/ui/Toast";
import { ShieldAlert, X } from "lucide-react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subMeta, setSubMeta] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [accessErrorBanner, setAccessErrorBanner] = useState("");

  const fetchSubscription = useCallback(() => {
    fetch("/api/billing/subscription", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setSubscription(d.subscription);
          setSubMeta(d);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAuthContext = useCallback(() => {
    fetch("/api/auth/me", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.authenticated || !d?.user) {
          window.location.replace("/login?redirect=%2Fdashboard");
          return;
        }
        setCurrentUser(d.user);
        if (Array.isArray(d.memberships)) {
          setMemberships(d.memberships);
        }
        fetchSubscription();
      })
      .catch(() => {});
  }, [fetchSubscription]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "unauthorized_admin") {
        setAccessErrorBanner(
          "Access Denied: Your workspace account does not have Platform Super Admin privileges to open /admin."
        );
        params.delete("error");
        const cleanQuery = params.toString();
        const nextUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
      }
    }
  }, []);

  useEffect(() => {
    fetchAuthContext();

    const handleOpenModal = () => setTrialModalOpen(true);
    const handleSubUpdate = () => fetchSubscription();
    const handleProfileUpdate = () => fetchAuthContext();
    const handlePageShow = (e) => {
      if (e.persisted) fetchAuthContext();
    };

    window.addEventListener("open-subscription-modal", handleOpenModal);
    window.addEventListener("open-trial-modal", handleOpenModal);
    window.addEventListener("subscription-updated", handleSubUpdate);
    window.addEventListener("profile-updated", handleProfileUpdate);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("open-subscription-modal", handleOpenModal);
      window.removeEventListener("open-trial-modal", handleOpenModal);
      window.removeEventListener("subscription-updated", handleSubUpdate);
      window.removeEventListener("profile-updated", handleProfileUpdate);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [fetchAuthContext, fetchSubscription]);

  const pathname = usePathname();
  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.platformRole === "SUPER_ADMIN";
  const hasPaid = Boolean(
    subscription?.hasAutopay || subMeta?.hasActiveSubscription || isSuperAdmin
  );
  const isExemptPath =
    pathname?.startsWith("/billing") || pathname?.startsWith("/settings") || pathname?.startsWith("/support");
  const showBenefitsOnly = subMeta !== null && !hasPaid && !isExemptPath;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col transition-colors duration-150">
        <div className="flex flex-1 min-h-screen">
          <Suspense
            fallback={
              <aside className="w-[260px] hidden lg:block bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] sticky top-0 h-screen shrink-0" />
            }
          >
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              currentUser={currentUser}
              memberships={memberships}
              subscription={subscription}
              subMeta={subMeta}
              onSwitchWorkspace={fetchAuthContext}
              onOpenCheckout={() => setTrialModalOpen(true)}
            />
          </Suspense>

          <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
            <Suspense
              fallback={
                <div className="h-[60px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]" />
              }
            >
              <Header
                currentUser={currentUser}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              />
            </Suspense>
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto min-w-0">
              {accessErrorBanner && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{accessErrorBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccessErrorBanner("")}
                    aria-label="Dismiss alert"
                    className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {showBenefitsOnly ? (
                <BotBenefitsView onGetStarted={() => setTrialModalOpen(true)} />
              ) : (
                <>
                  <TrialBanner
                    subscription={subscription}
                    onOpenCheckout={() => setTrialModalOpen(true)}
                  />
                  <Suspense fallback={<div className="py-12" />}>
                    {children}
                  </Suspense>
                </>
              )}
            </main>
          </div>
        </div>

        <TrialOnboardingModal
          isOpen={trialModalOpen}
          isMandatory={
            Boolean(subscription && !subscription.hasAutopay) &&
            currentUser?.role !== "SUPER_ADMIN" &&
            currentUser?.platformRole !== "SUPER_ADMIN"
          }
          hasUsedTrial={subscription?.hasUsedTrial || false}
          onClose={() => setTrialModalOpen(false)}
          onActivated={(newSub) => {
            setSubscription(newSub);
            fetchSubscription();
          }}
          userEmail={currentUser?.email}
          userName={currentUser?.name}
        />
      </div>
    </ToastProvider>
  );
}
