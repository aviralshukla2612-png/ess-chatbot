"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, Code2, Copy, Check, ShieldCheck, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { botsApi } from "@/lib/api/bots";

export default function DeployWebsiteModal({ isOpen, onClose, bot, onBotUpdated }) {
  const [url, setUrl] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (bot) {
      setUrl(bot.websiteUrl || "");
      const domains = Array.isArray(bot.allowedDomains)
        ? bot.allowedDomains.join(", ")
        : bot.allowedDomains || "";
      setAllowedDomains(domains);
      setError("");
      setCopied(false);
    }
  }, [bot, isOpen]);

  if (!bot) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://emperornexus.com";
  const embedSnippet = `<script src="${origin}/widget.js" data-bot-id="${bot.id}" defer></script>`;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setError("");

    let cleanUrl = (url || "").trim();
    if (!cleanUrl) {
      setError("Please enter a valid website URL (e.g. https://yourcompany.com).");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let parsed;
    try {
      parsed = new URL(cleanUrl);
    } catch {
      setError("Please enter a valid URL including domain (e.g. https://yourwebsite.com).");
      return;
    }

    const parsedDomains = allowedDomains
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    if (parsedDomains.length === 0 && parsed.hostname) {
      parsedDomains.push(parsed.hostname);
    }

    setSaving(true);
    try {
      const updated = await botsApi.updateBot(bot.id, {
        websiteUrl: cleanUrl,
        allowedDomains: parsedDomains,
      });
      onBotUpdated?.(updated || { ...bot, websiteUrl: cleanUrl, allowedDomains: parsedDomains });
      window.open(cleanUrl, "_blank", "noopener,noreferrer");
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to save deployment settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deploy Chatbot Widget"
      description={`Configure domain authorization and copy the embed script for ${bot.name || "your chatbot"}.`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Step 1: Embed Script */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)]">
              1. Paste before <code className="font-mono">&lt;/body&gt;</code> on your website
            </span>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Script"}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto">
            {embedSnippet}
          </pre>
        </div>

        {/* Step 2: Target Website URL */}
        <div>
          <label className="block font-medium text-[var(--text-secondary)] mb-1.5">
            2. Live Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError("");
              }}
              placeholder="https://yourwebsite.com"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        {/* Step 3: Domain Lock Whitelist */}
        <div>
          <label className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)] mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Authorized Hostnames (CORS & Origin Lock)</span>
          </label>
          <input
            type="text"
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="yourwebsite.com, app.yourwebsite.com"
            className="w-full h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Comma-separated hostnames permitted to load this widget. Leave blank to auto-authorize the domain above.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/12 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs"
          >
            {error}
          </div>
        )}

        <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5 justify-end border-t border-[var(--border-subtle)]">
          <Link
            href={`/bots/${bot.id}/deploy`}
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Installation Guide & Verification</span>
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save & Open Site"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
