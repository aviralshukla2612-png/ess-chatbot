"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Zap,
  Radio,
  Save,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  const [formData, setFormData] = useState({
    aiProvider: "ollama",
    ollamaUrl: "http://ollama:11434",
    chatModel: "qwen2.5:3b",
    embeddingModel: "nomic-embed-text",
    postgresHost: "postgres:5432",
    postgresDb: "ess_chatbot",
    groqModel: "llama-3.3-70b-versatile",
    groqApiKey: "",
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
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        setNotification({
          type: "success",
          message: "Platform configuration saved and applied to live cluster.",
        });
        loadSettings();
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to save configuration.",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Network error.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Platform Global Configuration
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Live connection endpoints, LLM model defaults, and vector database clustering.
          </p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#0D0D0D] border border-neutral-800 text-neutral-200 hover:bg-neutral-900 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B68A55]" : "text-neutral-400"}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Status banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Cluster Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ollama Health */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-xs flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
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
              <span className="text-sm font-bold text-white capitalize">
                {diagnostics?.ollama?.status === "connected" ? "Live & Ready" : diagnostics?.ollama?.status || "Checking..."}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Endpoint: {formData.ollamaUrl}
            </p>
          </div>
          {diagnostics?.ollama?.availableModels?.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {diagnostics.ollama.availableModels.length} models
            </span>
          )}
        </div>

        {/* Postgres Health */}
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-xs flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#B68A55]" />
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
              <span className="text-sm font-bold text-white capitalize">
                {diagnostics?.database?.status === "connected" ? "Connected" : diagnostics?.database?.status || "Connecting..."}
              </span>
              {diagnostics?.database?.latencyMs > 0 && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                  {diagnostics.database.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Database: {diagnostics?.database?.database || "ess_chatbot"}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B68A55]/10 text-[#B68A55] border border-[#B68A55]/30">
            HNSW 768-d
          </span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: AI Provider & Engine */}
        <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              Primary AI Inference Provider
            </h3>
            <span className="text-[11px] font-medium text-neutral-400">
              Active: <strong className="text-[#B68A55] uppercase">{formData.aiProvider}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Default Provider
              </label>
              <select
                value={formData.aiProvider}
                onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl font-medium text-white text-xs focus:border-[#B68A55] transition-colors"
              >
                <option value="ollama" className="bg-[#121212] text-white">Local Container (Ollama On-Premise)</option>
                <option value="groq" className="bg-[#121212] text-white">Cloud LPU Fast Engine (Groq Cloud)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Ollama Engine Host URL
              </label>
              <input
                type="text"
                value={formData.ollamaUrl}
                onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                placeholder="http://ollama:11434"
                className="w-full px-3.5 py-2.5 bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-white text-xs focus:border-[#B68A55] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Default Chat / Sales Model Tag
              </label>
              <input
                type="text"
                value={formData.chatModel}
                onChange={(e) => setFormData({ ...formData, chatModel: e.target.value })}
                placeholder="qwen2.5:3b or granite3-dense:8b"
                className="w-full px-3.5 py-2.5 bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-white text-xs focus:border-[#B68A55] transition-colors"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Installed models on server:{" "}
                <span className="font-semibold text-neutral-300">
                  {diagnostics?.ollama?.availableModels?.length > 0
                    ? diagnostics.ollama.availableModels.join(", ")
                    : "qwen2.5:3b, granite3-dense:8b"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Vector Embedding Model
              </label>
              <input
                type="text"
                value={formData.embeddingModel}
                onChange={(e) => setFormData({ ...formData, embeddingModel: e.target.value })}
                placeholder="nomic-embed-text"
                className="w-full px-3.5 py-2.5 bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-white text-xs focus:border-[#B68A55] transition-colors"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Standard 768-dimensional RAG document embedder.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: PostgreSQL & pgvector Database */}
        <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#B68A55]" />
              PostgreSQL & Vector Storage
            </h3>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active Docker Network
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                PostgreSQL Host & Port
              </label>
              <input
                type="text"
                value={formData.postgresHost}
                disabled
                className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-neutral-800 rounded-xl font-mono text-neutral-500 text-xs cursor-not-allowed"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Internal docker service: <code className="text-neutral-400">postgres:5432</code>
              </p>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Target Database Name
              </label>
              <input
                type="text"
                value={formData.postgresDb}
                disabled
                className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-neutral-800 rounded-xl font-mono text-neutral-500 text-xs cursor-not-allowed"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                PostgreSQL database: <code className="text-neutral-400">ess_chatbot</code>
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: CRM / Lead Webhook */}
        <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-neutral-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Zap className="w-4 h-4 text-[#B68A55]" />
            Global Lead Integration & Webhook
          </h3>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">
              Global CRM Webhook Destination
            </label>
            <input
              type="url"
              value={formData.leadWebhookUrl}
              onChange={(e) => setFormData({ ...formData, leadWebhookUrl: e.target.value })}
              placeholder="https://your-crm.com/api/webhooks/leads"
              className="w-full px-3.5 py-2.5 bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-white text-xs focus:border-[#B68A55] transition-colors"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              Qualified sales leads from all tenant bots will automatically dispatch to this endpoint with HMAC-SHA256 signature.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#B68A55] hover:bg-[#a67c48] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving Configuration...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Platform Config
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
