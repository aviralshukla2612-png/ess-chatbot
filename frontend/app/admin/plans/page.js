"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Check,
  Search,
  Layers,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { InlineAlert, useToast } from "@/components/ui/Toast";

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [intervalFilter, setIntervalFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formInterval, setFormInterval] = useState("monthly");
  const [formIntervalCount, setFormIntervalCount] = useState(1);
  const [formTrialDays, setFormTrialDays] = useState(7);
  const [formDescription, setFormDescription] = useState("");
  const [formFeatures, setFormFeatures] = useState("");
  const [formRazorpayPlanId, setFormRazorpayPlanId] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.plans) {
        setPlans(data.plans);
      } else {
        setError(data.error || "Failed to load pricing plans");
      }
    } catch {
      setError("Network error while loading pricing plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName("");
    setFormPrice("2499");
    setFormInterval("monthly");
    setFormIntervalCount(1);
    setFormTrialDays(7);
    setFormDescription("₹2,499/month after 7-day free trial. Full AI chatbot access.");
    setFormFeatures(
      "1 AI Sales Bot (Strict Limit)\nUnlimited Messages & Token Inquiries\n50 Website knowledge pages\n7-Day Free Trial (₹0 charged today)\nLead CRM capture"
    );
    setFormRazorpayPlanId("");
    setFormIsDefault(false);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setFormName(p.name);
    setFormPrice(String(p.priceINR));
    setFormInterval(p.interval || "monthly");
    setFormIntervalCount(p.intervalCount || 1);
    setFormTrialDays(p.trialDays ?? 7);
    setFormDescription(p.description || "");
    setFormFeatures(Array.isArray(p.features) ? p.features.join("\n") : "");
    setFormRazorpayPlanId(p.razorpayPlanId || "");
    setFormIsDefault(Boolean(p.isDefault));
    setFormIsActive(p.isActive !== false);
    setModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const featuresList = formFeatures
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formName,
      priceINR: Number(formPrice),
      interval: formInterval,
      intervalCount: Number(formIntervalCount),
      trialDays: Number(formTrialDays),
      description: formDescription,
      features: featuresList,
      razorpayPlanId: formRazorpayPlanId,
      isDefault: formIsDefault,
      isActive: formIsActive,
    };

    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : "/api/admin/plans";
      const method = editingPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save plan");
      }

      toast({ title: "Pricing plan saved", message: data.message, variant: "success" });
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (planId) => {
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setDefault" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Default plan updated", variant: "success" });
        fetchPlans();
      } else {
        toast({ title: "Update failed", message: data.error, variant: "error" });
      }
    } catch {
      toast({ title: "Network error", variant: "error" });
    }
  };

  const handleDeletePlan = (planId, planName) => {
    setConfirmConfig({
      title: "Delete Subscription Plan?",
      description: `Delete plan "${planName}"? Existing subscriptions remain unaffected, while new checkouts cannot select this tier.`,
      confirmText: "Delete Plan",
      badgeText: "Permanent Action",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast({ title: `Plan "${planName}" deleted`, variant: "info" });
            fetchPlans();
          }
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.priceMonthly?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    let matchesInterval = true;
    if (intervalFilter === "monthly")
      matchesInterval = p.intervalCount === 1 && p.interval === "monthly";
    if (intervalFilter === "6months") matchesInterval = p.intervalCount === 6;
    if (intervalFilter === "yearly")
      matchesInterval = p.interval === "yearly" || p.intervalCount === 12;

    return matchesSearch && matchesInterval;
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <PageHeader
        badge="Billing Catalog"
        title="Razorpay Subscription Plans & Pricing"
        description="Configure subscription pricing tiers, trial durations, billing cycles, and workspace quotas."
        actions={
          <Button icon={Plus} size="sm" onClick={openCreateModal}>
            Create Pricing Plan
          </Button>
        }
      />

      {error && (
        <InlineAlert
          variant="error"
          title="Plans Error"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Configured Plans"
          value={plans.length}
          description={`${plans.filter((p) => p.isActive !== false).length} active for checkout`}
          icon={CreditCard}
          colorScheme="indigo"
        />
        <StatCard
          title="Default Trial Tier"
          value={plans.find((p) => p.isDefault)?.name || "Starter"}
          description="Applied on new 7-day trials"
          icon={Check}
          colorScheme="emerald"
        />
        <StatCard
          title="Supported Cycles"
          value="1m · 6m · 12m"
          description="Monthly, Half-Year & Annual"
          icon={Layers}
          colorScheme="sky"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: `All Cycles (${plans.length})` },
            { id: "monthly", label: "Monthly" },
            { id: "6months", label: "6 Months" },
            { id: "yearly", label: "Annual" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setIntervalFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                intervalFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <CardGridSkeleton count={3} />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No pricing plans found"
          description="Create a subscription tier to enable Razorpay checkout."
          actionLabel="Create Pricing Plan"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl bg-[var(--bg-surface)] border p-6 flex flex-col justify-between transition-all ${
                plan.isDefault
                  ? "border-2 border-indigo-600 dark:border-indigo-500 shadow-[var(--shadow-md)]"
                  : "border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                      {plan.description}
                    </p>
                  </div>
                  {plan.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider shrink-0">
                      Default
                    </span>
                  )}
                </div>

                <div className="my-4 p-4 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
                      {plan.priceMonthly || `₹${plan.priceINR?.toLocaleString("en-IN")}`}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      /{plan.periodLabel?.replace(/^per\s+/i, "") || "cycle"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-secondary)] font-medium">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-500/20">
                      {plan.trialDays ?? 7}-Day Free Trial
                    </span>
                    <span className="text-[var(--text-muted)]">· ₹0 upfront</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="text-[var(--text-primary)]">1 AI Assistant</strong> workspace limit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="text-[var(--text-primary)]">Unlimited</strong> visitor inquiries
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="text-[var(--text-primary)]">
                        {plan.maxKnowledgePages || 50}
                      </strong>{" "}
                      Knowledge pages
                    </span>
                  </div>
                  {plan.features?.slice(3).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {!plan.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(plan.id)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-indigo-500 text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(plan)}
                    aria-label={`Edit ${plan.name}`}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    disabled={plan.isDefault}
                    aria-label={`Delete ${plan.name}`}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    plan.isActive !== false
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                      : "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                  }`}
                >
                  {plan.isActive !== false ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? `Edit ${editingPlan.name}` : "Create Pricing Plan"}
        description="Configure plan name, INR price, billing interval, and trial days."
        size="lg"
      >
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-secondary)] block">
                Plan Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Starter Monthly"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-secondary)] block">
                Amount in INR (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={1}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-secondary)] block">
                Billing Cycle *
              </label>
              <select
                value={`${formInterval}_${formIntervalCount}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "monthly_1") {
                    setFormInterval("monthly");
                    setFormIntervalCount(1);
                  } else if (val === "monthly_3") {
                    setFormInterval("monthly");
                    setFormIntervalCount(3);
                  } else if (val === "monthly_6") {
                    setFormInterval("monthly");
                    setFormIntervalCount(6);
                  } else if (val === "yearly_1") {
                    setFormInterval("yearly");
                    setFormIntervalCount(1);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              >
                <option value="monthly_1">Every 1 Month (Monthly)</option>
                <option value="monthly_3">Every 3 Months (Quarterly)</option>
                <option value="monthly_6">Every 6 Months (Semi-Annual)</option>
                <option value="yearly_1">Every 1 Year (Annual)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-secondary)] block">
                Free Trial Duration (Days) *
              </label>
              <input
                type="number"
                required
                min={0}
                max={60}
                value={formTrialDays}
                onChange={(e) => setFormTrialDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[var(--text-secondary)] block">
              Plan Description
            </label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[var(--text-secondary)] block">
              Features List (One per line)
            </label>
            <textarea
              rows={3}
              value={formFeatures}
              onChange={(e) => setFormFeatures(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="font-semibold text-[var(--text-secondary)]">
                Default Plan for 7-Day Trials
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="font-semibold text-[var(--text-secondary)]">Active</span>
            </label>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        confirmText={confirmConfig?.confirmText || "Confirm"}
        badgeText={confirmConfig?.badgeText || "Action Required"}
        variant={confirmConfig?.variant || "danger"}
      />
    </div>
  );
}
