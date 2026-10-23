"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Code,
  Smartphone,
  Webhook,
  Key,
  BarChart,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

const ICON_MAP = {
  widget: { icon: Code, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950" },
  whatsapp: { icon: Smartphone, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
  webhook: { icon: Webhook, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  rest: { icon: Key, color: "text-violet-600 bg-violet-50 dark:bg-violet-950" },
  slack: { icon: MessageSquare, color: "text-rose-600 bg-rose-50 dark:bg-rose-950" },
  ga4: { icon: BarChart, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/integrations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIntegrations(data.integrations || []);
          return;
        }
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load integration statuses");
    } catch (err) {
      console.warn("[INTEGRATIONS_FETCH_WARN]", err);
      setError(err.message || "Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Channels & Integrations
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Connect your AI assistants to website widgets, messaging gateways, CRMs, and webhooks.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadIntegrations}
            className="font-semibold underline hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-xs">Checking integration health & gateway connections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => {
            const visual = ICON_MAP[item.id] || {
              icon: Code,
              color: "text-indigo-600 bg-indigo-50",
            };
            const Icon = visual.icon;

            const isSuccess = item.statusType === "active";
            const isComingSoon = item.statusType === "coming_soon";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${visual.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isSuccess
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : isComingSoon
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                  {item.details && (
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono">
                      {item.details}
                    </p>
                  )}
                </div>

                <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  {item.ctaHref && item.ctaHref !== "#" ? (
                    <Link
                      href={item.ctaHref}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5"
                    >
                      <span>{item.cta}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-400 cursor-not-allowed">
                      {item.cta}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
