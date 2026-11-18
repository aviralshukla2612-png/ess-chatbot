"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Share2,
  Check,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Bot,
  ArrowLeft,
  Info,
} from "lucide-react";

function PreviewContent() {
  const searchParams = useSearchParams();
  const botId = searchParams.get("botId") || "bot_aa";
  const rawUrl = searchParams.get("url") || "https://emperornexus.com";
  const rawColor = searchParams.get("color");
  const primaryColor = rawColor && rawColor.trim() ? rawColor.trim() : "#4F46E5";

  const [targetUrl, setTargetUrl] = useState(rawUrl);
  const [currentIframeUrl, setCurrentIframeUrl] = useState(rawUrl);
  const [barOpen, setBarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const formatUrl = (input) => {
    let u = (input || "").trim();
    if (!u) return "https://emperornexus.com";
    if (!u.startsWith("http://") && !u.startsWith("https://")) {
      u = "https://" + u;
    }
    return u;
  };

  useEffect(() => {
    const existing = document.getElementById("nexus-chatbot-widget-container");
    if (existing) existing.remove();
    const existingScript = document.getElementById("nexus-preview-widget-script");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "nexus-preview-widget-script";
    script.src = "/widget.js";
    script.setAttribute("data-bot-id", botId);
    script.setAttribute("data-color", primaryColor);
    script.setAttribute("data-position", "bottom-right");
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("nexus-chatbot-widget-container");
      if (el) el.remove();
      const sc = document.getElementById("nexus-preview-widget-script");
      if (sc) sc.remove();
    };
  }, [botId, primaryColor]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLoadUrl = (e) => {
    e.preventDefault();
    setCurrentIframeUrl(formatUrl(targetUrl));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans flex flex-col">
      <header
        className={`z-50 transition-all duration-200 ${
          barOpen ? "translate-y-0" : "-translate-y-full"
        } bg-slate-900/95 border-b border-slate-800 text-white shadow-xl backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/bots/${encodeURIComponent(botId)}/deploy`}
            aria-label="Back to deploy studio"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">Live Widget Preview</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Bot ID: <code className="font-mono text-indigo-300">{botId}</code>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLoadUrl} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1 flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-transparent text-slate-200 outline-none font-mono text-[11px]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Load
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span
            className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400"
            title="Sites that send X-Frame-Options: DENY cannot render inside an iframe, though your floating widget remains active in the bottom-right corner."
          >
            <Info className="w-3.5 h-3.5" />
            <span>Widget floats bottom-right</span>
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied" : "Share Preview"}</span>
          </button>
          <a
            href={currentIframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open website in new tab"
            className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setBarOpen(!barOpen)}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-full px-3 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-lg cursor-pointer transition-all"
      >
        {barOpen ? (
          <>
            <ChevronUp className="w-3 h-3" />
            <span>Hide Bar</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            <span>Show Preview Bar</span>
          </>
        )}
      </button>

      <main className="flex-1 w-full h-full relative bg-slate-900">
        <iframe
          src={currentIframeUrl}
          title="Target Website Preview"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </main>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans text-xs">
          Loading Live Widget Preview...
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
