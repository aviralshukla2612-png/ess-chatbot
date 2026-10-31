"use client";

import React, { useState, useEffect, Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TrialBanner from "@/components/billing/TrialBanner";
import TrialOnboardingModal from "@/components/billing/TrialOnboardingModal";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const fetchSubscription = () => {
    fetch("/api/billing/subscription", { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setSubscription(d.subscription);
          if (!d.hasActiveSubscription) {
            setTrialModalOpen(true);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          setCurrentUser(d.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchSubscription();
      });

    const handleOpenModal = () => setTrialModalOpen(true);
    window.addEventListener("open-subscription-modal", handleOpenModal);
    window.addEventListener("open-trial-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-subscription-modal", handleOpenModal);
      window.removeEventListener("open-trial-modal", handleOpenModal);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#000000] text-[#252525] dark:text-slate-100 flex flex-col transition-colors duration-200">
      <div className="flex flex-1 min-h-screen">
        <Suspense fallback={<aside className="w-64 hidden lg:block bg-[#FAF9F6] dark:bg-[#0A0A0A] border-r border-[#EFE7DC] dark:border-neutral-800 sticky top-0 h-screen shrink-0" />}>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            subscription={subscription}
            onOpenCheckout={() => setTrialModalOpen(true)}
          />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
            <TrialBanner
              subscription={subscription}
              onOpenCheckout={() => setTrialModalOpen(true)}
            />
            {children}
          </main>
        </div>
      </div>

      <TrialOnboardingModal
        isOpen={trialModalOpen}
        isMandatory={(!subscription || !subscription.hasAutopay) && currentUser?.role !== "SUPER_ADMIN"}
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
  );
}
