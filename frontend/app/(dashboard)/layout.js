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
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 flex flex-col">
      <div className="flex flex-1 min-h-screen">
        <Suspense fallback={<aside className="w-72 hidden lg:block bg-white dark:bg-neutral-900 border-r border-neutral-200" />}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
