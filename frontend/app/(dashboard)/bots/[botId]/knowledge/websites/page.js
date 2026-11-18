"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import WebsiteKnowledgeManager from "@/components/knowledge/WebsiteKnowledgeManager";

function BotWebsitesKnowledgeContent() {
  const routeParams = useParams();
  const botId = routeParams?.botId || "bot_aa";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <Link
          href={`/bots/${botId}?tab=knowledge`}
          aria-label="Back to chatbot workspace"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Website Knowledge Sources
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
              RAG Crawler
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Crawl public website pages, index semantic vector chunks, and keep chatbot knowledge synchronized.
          </p>
        </div>
      </div>

      <WebsiteKnowledgeManager botId={botId} />
    </div>
  );
}

export default function BotWebsitesKnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">
          Loading website knowledge...
        </div>
      }
    >
      <BotWebsitesKnowledgeContent />
    </Suspense>
  );
}
