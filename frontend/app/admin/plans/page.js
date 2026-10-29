"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
  X,
  Loader2,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [intervalFilter, setIntervalFilter] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
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
    setFormPrice("2500");
    setFormInterval("monthly");
    setFormIntervalCount(1);
    setFormTrialDays(7);
    setFormDescription("₹2,500/month after 7-day free trial. Full AI chatbot access.");
    setFormFeatures("1 AI Sales Bot (Strict Limit)\nUnlimited Messages & Token Inquiries\n50 Website knowledge pages\n7-Day Free Trial (₹0 charged today)\nLead CRM capture");
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
    setSuccessMsg("");

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

      setSuccessMsg(data.message || "Pricing plan saved successfully!");
      setModalOpen(false);
      fetchPlans();
      setTimeout(() => setSuccessMsg(""), 4000);
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
        setSuccessMsg(data.message || "Default plan updated");
        fetchPlans();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to set default plan");
      }
    } catch {
      alert("Failed to update default plan");
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (!confirm(`Are you sure you want to delete the plan "${planName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Plan "${planName}" deleted.`);
        fetchPlans();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to delete plan");
      }
    } catch {
      alert("Error deleting plan");
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.priceMonthly?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    let matchesInterval = true;
    if (intervalFilter === "monthly") matchesInterval = p.intervalCount === 1 && p.interval === "monthly";
    if (intervalFilter === "6months") matchesInterval = p.intervalCount === 6;
    if (intervalFilter === "yearly") matchesInterval = p.interval === "yearly" || p.intervalCount === 12;

    return matchesSearch && matchesInterval;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Super Admin Billing Controller
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Razorpay Subscription Plans & Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure subscription pricing amounts (e.g. ₹2,500/month, ₹5,000/6 months, ₹9,999/year), trial durations, and customer quotas.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Pricing Plan</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Configured Plans
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {plans.length}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
            <Check className="w-3 h-3" />
            {plans.filter((p) => p.isActive !== false).length} Active for Checkout
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Default 7-Day Trial Plan
          </span>
          <span className="text-lg font-bold text-indigo-600 mt-1 block truncate">
            {plans.find((p) => p.isDefault)?.name || "Starter Monthly"}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Pre-selected when users sign up and start trial
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Multi-Cycle Billing Support
          </span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">1 Month</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">6 Months</span>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold">12 Months</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: "all", label: `All Cycles (${plans.length})` },
            { id: "monthly", label: "Monthly (1 Mo)" },
            { id: "6months", label: "6 Months" },
            { id: "yearly", label: "Annual (12 Mo)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setIntervalFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                intervalFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plans by name, price..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-hidden focus:border-indigo-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Plans Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
          Loading pricing plans...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
          No pricing plans found. Click &quot;Create New Pricing Plan&quot; to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl bg-white border p-6 flex flex-col justify-between shadow-xs transition-all relative ${
                plan.isDefault
                  ? "border-indigo-500 ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {plan.description}
                    </p>
                  </div>
                  {plan.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider shrink-0">
                      Default
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      {plan.priceMonthly || `₹${plan.priceINR?.toLocaleString("en-IN")}`}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      /{plan.periodLabel?.replace(/^per\s+/i, "") || "cycle"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600 font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {plan.trialDays ?? 7}-Day Free Trial
                    </span>
                    <span>• ₹0 charged today</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6 text-xs text-slate-600">
                  <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wider block">
                    Plan Specifications:
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>1 AI Assistant</strong> (Strict Bot Limit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>Unlimited</strong> Messages & Inquiries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>{plan.maxKnowledgePages || 50}</strong> Knowledge pages</span>
                  </div>
                  {plan.features?.slice(3).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {!plan.isDefault && (
                    <button
                      onClick={() => handleSetDefault(plan.id)}
                      title="Set as Default Plan for 7-day trials"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(plan)}
                    title="Edit Plan Price & Cycle"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    disabled={plan.isDefault}
                    title={plan.isDefault ? "Cannot delete default plan" : "Delete Plan"}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    plan.isActive !== false
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
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
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                {editingPlan ? "Edit Pricing Plan" : "Create Razorpay Pricing Plan"}
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {editingPlan ? `Modify ${editingPlan.name}` : "Add New Razorpay Pricing Amount"}
              </h2>
              <p className="text-xs text-white/80 mt-1">
                Configure plan name, INR amount, billing interval (e.g. 1 month, 6 months), and trial days.
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter Monthly, Pro 6-Month Pass"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Amount in INR (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    placeholder="e.g. 2500, 5000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Billing Cycle / Frequency *
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600"
                  >
                    <option value="monthly_1">Every 1 Month (Monthly - e.g. ₹2,500/mo)</option>
                    <option value="monthly_3">Every 3 Months (Quarterly)</option>
                    <option value="monthly_6">Every 6 Months (Semi-Annual - e.g. ₹5,000/6-mo)</option>
                    <option value="yearly_1">Every 1 Year (Annual - e.g. ₹9,999/yr)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Free Trial Duration (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={60}
                    value={formTrialDays}
                    onChange={(e) => setFormTrialDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Plan Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,000 billed every 6 months. Great savings!"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Features List (One feature per line)
                </label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder="1 AI Sales Bot (Strict Limit)&#10;Unlimited Messages & Token Inquiries&#10;150 Website knowledge pages"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-700">
                    Set as Default Plan for 7-Day Trials
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span className="font-semibold text-slate-700">
                    Active
                  </span>
                </label>
              </div>

              {/* Submit / Cancel */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Plan...</span>
                    </>
                  ) : (
                    <span>{editingPlan ? "Update Plan" : "Create Plan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
