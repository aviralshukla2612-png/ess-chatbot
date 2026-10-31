"use client";

import React, { useState, useEffect } from "react";
import { Cpu, HardDrive, Database, Layers, CheckCircle2, TrendingUp, Server, Infinity as InfinityIcon, ShieldCheck } from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";

export default function AdminUsagePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await analyticsApi.getDashboardMetrics();
        setMetrics(data);
      } catch (e) {
        console.warn("Failed to load usage metrics", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalQuestions = metrics?.totalQuestions || 0;
  const totalConversations = metrics?.totalConversations || 0;
  const estimatedTokens = totalQuestions * 340 + totalConversations * 180;
  const tokenFormatted = estimatedTokens > 0 ? `${(estimatedTokens / 1000).toFixed(1)}k` : "0";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Platform Compute & Resource Usage
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Monitor neural inference activity, vector storage memory, and per-tenant bot allocation.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Inference Tokens (Unlimited - No Limit) */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-6 shadow-xs space-y-4 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI Inference Tokens</h3>
                <p className="text-xs text-neutral-400">Monthly token consumption</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <InfinityIcon className="w-3.5 h-3.5" />
              Unlimited
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tokenFormatted} <span className="text-sm font-normal text-neutral-500">tokens</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {totalQuestions} prompt inquiries processed across all active bots
            </p>
          </div>

          <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>No token caps applied to accounts</span>
          </div>
        </div>

        {/* Card 2: Vector Storage */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-6 shadow-xs space-y-4 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Vector Storage & Chunks</h3>
                <p className="text-xs text-neutral-400">pgvector & neural collections</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#B68A55]/15 text-[#B68A55] border border-[#B68A55]/30">
              Dynamic
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              1.2 GB <span className="text-sm font-normal text-neutral-500">stored</span>
            </div>
            <p className="text-[11px] text-neutral-400">768-dim embeddings indexed</p>
          </div>

          <div className="pt-1 flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#B68A55]" />
            <span>Elastic neural embedding storage</span>
          </div>
        </div>

        {/* Card 3: Documents Processed */}
        <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-6 shadow-xs space-y-4 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Knowledge Sources</h3>
                <p className="text-xs text-neutral-400">PDFs, Docs, and web crawls</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              1 Website <span className="text-sm font-normal text-neutral-500">indexed</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Automated RAG Sync Active
            </span>
          </div>

          <div className="pt-1 flex items-center gap-2 text-[11px] text-[#B68A55] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#B68A55]" />
            <span>Real-time vector synchronization</span>
          </div>
        </div>
      </div>

      {/* Tenant Breakdown Table */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Tenant Resource & Bot Usage</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Resource consumption and bot allocation per registered organization (Strict 1 Bot Limit per User/Sub-Admin)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
            1 Active Tenant
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0A0A] text-neutral-400 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4">Organization</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Bot Allocation</th>
                <th className="p-4">Monthly Questions</th>
                <th className="p-4">Token Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              <tr className="hover:bg-neutral-900/60 transition-colors">
                <td className="p-4 font-bold text-white flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#B68A55] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ESS
                  </div>
                  Emperor Smart Solutions
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#B68A55]/15 text-[#B68A55] border border-[#B68A55]/30">
                    Enterprise
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#B68A55]">
                      {metrics?.activeBotsCount ?? 1} / 1
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                      Max 1 Allowed
                    </span>
                  </div>
                </td>
                <td className="p-4 font-mono font-semibold text-white">
                  {totalQuestions}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <InfinityIcon className="w-3 h-3" />
                    Unlimited (No Cap)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
