"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Database,
  RefreshCw,
  Zap,
  Save,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { InlineAlert, useToast } from "@/components/ui/Toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [diagnostics, setDiagnostics] = useState(null);

  const [formData, setFormData] = useState({
    aiProvider: "ollama",
    ollamaUrl: "http://ollama:11434",
    chatModel: "qwen2.5:3b",
    embeddingModel: "nomic-embed-text",
    postgresHost: "postgres:5432",
    postgresDb: "ess_chatbot",
    groqModel: "llama-3.3-70b-versatile",
    leadWebhookUrl: "",
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setFormData((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
        if (data.liveDiagnostics) {
          setDiagnostics(data.liveDiagnostics);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: "Platform configuration saved",
          message: "Settings applied across inference and webhook handlers.",
          variant: "success",
        });
        loadSettings();
      } else {
        setErrorMsg(data.error || "Failed to save configuration.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Cluster Runtime"
        title="Platform Global Configuration"
        description="Configure default AI inference providers, model identifiers, database health diagnostics, and global SSRF-safe webhooks."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={loadSettings}
          >
            Refresh Diagnostics
          </Button>
        }
      />

      {errorMsg && (
        <InlineAlert
          variant="error"
          title="Configuration Error"
          message={errorMsg}
          onDismiss={() => setErrorMsg("")}
        />
      )}

      {/* Cluster Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Ollama Inference Engine
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  diagnostics?.ollama?.status === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
                {diagnostics?.ollama?.status === "connected"
                  ? "Connected"
                  : diagnostics?.ollama?.status || "Standby"}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Endpoint: {formData.ollamaUrl}
            </p>
          </div>
          {diagnostics?.ollama?.availableModels?.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {diagnostics.ollama.availableModels.length} models
            </span>
          )}
        </div>

        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              PostgreSQL & pgvector
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  diagnostics?.database?.status === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
                {diagnostics?.database?.status === "connected"
                  ? "Connected"
                  : diagnostics?.database?.status || "Local Store Fallback"}
              </span>
              {diagnostics?.database?.latencyMs > 0 && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                  {diagnostics.database.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Database: {diagnostics?.database?.database || "ess_chatbot"}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            HNSW 768-d
          </span>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Primary AI Inference Provider
            </h3>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              Active: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{formData.aiProvider}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                Default Provider
              </label>
              <select
                value={formData.aiProvider}
                onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl font-medium text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              >
                <option value="ollama">Local Container (Ollama On-Premise)</option>
                <option value="groq">Cloud LPU Engine (Groq Cloud)</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                Ollama Engine Host URL
              </label>
              <input
                type="text"
                value={formData.ollamaUrl}
                onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                placeholder="http://ollama:11434"
                className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl font-mono text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                Default Chat / Sales Model Tag
              </label>
              <input
                type="text"
                value={formData.chatModel}
                onChange={(e) => setFormData({ ...formData, chatModel: e.target.value })}
                placeholder="qwen2.5:3b"
                className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl font-mono text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                Vector Embedding Model
              </label>
              <input
                type="text"
                value={formData.embeddingModel}
                onChange={(e) => setFormData({ ...formData, embeddingModel: e.target.value })}
                placeholder="nomic-embed-text"
                className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl font-mono text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              PostgreSQL & Vector Storage
            </h3>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
              Internal Docker Network
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                PostgreSQL Host & Port
              </label>
              <input
                type="text"
                value={formData.postgresHost}
                disabled
                className="w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl font-mono text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                Target Database Name
              </label>
              <input
                type="text"
                value={formData.postgresDb}
                disabled
                className="w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl font-mono text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] space-y-4">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Global CRM Lead Webhook
          </h3>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
              Global Webhook Destination (HTTPS)
            </label>
            <input
              type="url"
              value={formData.leadWebhookUrl}
              onChange={(e) => setFormData({ ...formData, leadWebhookUrl: e.target.value })}
              placeholder="https://your-crm.com/api/webhooks/leads"
              className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl font-mono text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Validated against private-network SSRF rules and signed with HMAC-SHA256.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" icon={Save} loading={saving}>
            Save Platform Config
          </Button>
        </div>
      </form>
    </div>
  );
}
