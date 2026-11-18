"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TrialBanner from "@/components/billing/TrialBanner";
import TrialOnboardingModal from "@/components/billing/TrialOnboardingModal";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subMeta, setSubMeta] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const fetchSubscription = useCallback(() => {
    fetch("/api/billing/subscription", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setSubscription(d.subscription);
          setSubMeta(d);
          if (!d.hasActiveSubscription) {
            setTrialModalOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchAuthContext = useCallback(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          setCurrentUser(d.user);
          if (Array.isArray(d.memberships)) {
            setMemberships(d.memberships);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchSubscription();
      });
  }, [fetchSubscription]);

  useEffect(() => {
    fetchAuthContext();

    const handleOpenModal = () => setTrialModalOpen(true);
    const handleSubUpdate = () => fetchSubscription();
    const handleProfileUpdate = () => fetchAuthContext();

    window.addEventListener("open-subscription-modal", handleOpenModal);
    window.addEventListener("open-trial-modal", handleOpenModal);
    window.addEventListener("subscription-updated", handleSubUpdate);
    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("open-subscription-modal", handleOpenModal);
      window.removeEventListener("open-trial-modal", handleOpenModal);
      window.removeEventListener("subscription-updated", handleSubUpdate);
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [fetchAuthContext, fetchSubscription]);

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
              <TrialBanner
                subscription={subscription}
                onOpenCheckout={() => setTrialModalOpen(true)}
              />
              <Suspense fallback={<div className="py-12" />}>
                {children}
              </Suspense>
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
