"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Code2,
  Webhook,
  MessageSquare,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { botsApi } from "@/lib/api/bots";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState("");
  const [origin, setOrigin] = useState("https://emperornexus.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    botsApi
      .getBots()
      .then((list) => {
        const safe = Array.isArray(list) ? list : [];
        setBots(safe);
        if (safe[0]?.id) setSelectedBotId(safe[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeBot = bots.find((b) => b.id === selectedBotId) || bots[0] || null;
  const botId = activeBot?.id || "YOUR_BOT_ID";

  const copySnippet = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast({ title: "Copied to clipboard", variant: "success" });
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const widgetSnippet = `<script src="${origin}/widget.js" data-bot-id="${botId}" defer></script>`;
  const whatsappWebhookUrl = `${origin}/api/webhooks/whatsapp`;
  const publicChatEndpoint = `${origin}/api/public/chat/${botId}`;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        badge="Channels & Webhooks"
        title="Integrations & API Connectivity"
        description="Deploy your chatbot across websites, receive WhatsApp Cloud API relays, and dispatch signed lead webhooks to external CRMs."
        actions={
          bots.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
              <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                aria-label="Select chatbot for integration snippets"
                className="bg-transparent font-semibold text-[var(--text-primary)] outline-hidden cursor-pointer"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[var(--bg-surface)]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Website Embed Widget */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <StatusBadge status={activeBot ? "Active" : "Pending Bot"} size="sm" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Website Chat Widget
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Lightweight script embed compatible with HTML, Next.js, React, WordPress, Shopify, and Webflow with domain allowlisting.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] flex items-center justify-between gap-2">
                <span className="truncate">{widgetSnippet}</span>
                <button
                  type="button"
                  onClick={() => copySnippet("widget", widgetSnippet)}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
                  aria-label="Copy widget snippet"
                >
                  {copiedKey === "widget" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                Supports custom branding & domain lock
              </span>
              <Link href={activeBot ? `/bots/${activeBot.id}/deploy` : "/bots/create"}>
                <Button size="sm" variant="secondary" iconRight={ArrowRight}>
                  {activeBot ? "Configure Widget" : "Create Bot"}
                </Button>
              </Link>
            </div>
          </div>

          {/* 2. Outbound Lead Webhooks */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Webhook className="w-5 h-5" />
                </div>
                <StatusBadge
                  status={activeBot?.webhookUrl ? "Configured" : "Available"}
                  size="sm"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Outbound CRM Lead Webhooks
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Automatically POST qualified visitor leads and scoping answers to Zapier, Make, n8n, HubSpot, or custom endpoints with SSRF protection and HMAC-SHA256 signatures.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                {activeBot?.webhookUrl ? (
                  <span className="font-mono text-[11px] truncate block">
                    Target: {activeBot.webhookUrl}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)]">
                    No outbound webhook URL set on {activeBot?.name || "selected bot"} yet.
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Signed X-Nexus-Signature header
              </span>
              <Link href={activeBot ? `/bots/${activeBot.id}?tab=settings` : "/bots"}>
                <Button size="sm" variant="secondary" iconRight={ArrowRight}>
                  Bot Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* 3. Meta WhatsApp Cloud API */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <StatusBadge status="Webhook Ready" size="sm" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Meta WhatsApp Cloud API
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Connect your Meta Business App webhook to route inbound WhatsApp messages through your RAG assistant and Live Inbox. Requires server environment credentials (<code className="font-mono">WHATSAPP_VERIFY_TOKEN</code> &amp; <code className="font-mono">WHATSAPP_APP_SECRET</code>).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] flex items-center justify-between gap-2">
                <span className="truncate">{whatsappWebhookUrl}</span>
                <button
                  type="button"
                  onClick={() => copySnippet("whatsapp", whatsappWebhookUrl)}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
                  aria-label="Copy WhatsApp webhook URL"
                >
                  {copiedKey === "whatsapp" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                X-Hub-Signature-256 verified
              </span>
              <Link href="/conversations">
                <Button size="sm" variant="secondary" iconRight={ArrowRight}>
                  Open Live Inbox
                </Button>
              </Link>
            </div>
          </div>

          {/* 4. Public Chat Streaming API */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-xs)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <StatusBadge status="SSE + JSON" size="sm" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Chat Inference HTTP / SSE Endpoint
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Invoke your chatbot programmatically via <code className="font-mono">POST</code> with JSON or progressive Server-Sent Events (<code className="font-mono">stream: true</code>), protected by multi-layer rate limiting and token caps.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] flex items-center justify-between gap-2">
                <span className="truncate">{publicChatEndpoint}</span>
                <button
                  type="button"
                  onClick={() => copySnippet("api", publicChatEndpoint)}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
                  aria-label="Copy public chat API endpoint"
                >
                  {copiedKey === "api" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                Returns RateLimit-* headers
              </span>
              <Link href={activeBot ? `/bots/${activeBot.id}?tab=playground` : "/bots"}>
                <Button size="sm" variant="secondary" iconRight={ArrowRight}>
                  Test in Playground
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
