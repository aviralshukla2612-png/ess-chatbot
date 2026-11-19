"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  Mail,
  Code2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Send,
  FileQuestion,
  ShieldCheck,
  ExternalLink,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { InlineAlert, useToast } from "@/components/ui/Toast";

const FAQ_ITEMS = [
  {
    category: "Billing & Autopay",
    question: "How does Razorpay billing work?",
    answer:
      "When you subscribe to a plan, billing is processed securely via Razorpay. You can manage your subscription, download invoices, or cancel with 1 click on the Billing page anytime.",
  },
  {
    category: "Bots & Creation",
    question: "How do I create and customize an AI chatbot?",
    answer:
      "Open Bots -> Create New Bot to launch the guided 6-step industry wizard. You can train your assistant on your website URL or uploaded documents, customize its visual widget theme, and test live streaming responses in the Playground.",
  },
  {
    category: "Website Widget",
    question: "How do I embed the AI chatbot widget on my website?",
    answer:
      "Navigate to Bots -> Select your bot -> Deploy. Copy the single-line <script> tag and paste it before the closing </body> tag of your website. It works on HTML, Next.js, React, WordPress, Shopify, and Webflow.",
  },
  {
    category: "Knowledge Base",
    question: "How do I train my chatbot on my website or documents?",
    answer:
      "Go to Knowledge to crawl public website URLs, complete the structured Company Profile Intake, or upload PDF, DOCX, TXT, MD, and CSV files. Content is segmented into isolated vector chunks per organization and bot.",
  },
  {
    category: "Lead Capture",
    question: "How does autonomous lead capture work?",
    answer:
      "As visitors share contact details (name, email, or phone number) or answer scoping questions during chat, leads are extracted automatically into your Leads CRM and optionally dispatched via signed webhook.",
  },
  {
    category: "WhatsApp & Integrations",
    question: "Can I connect my chatbot to WhatsApp?",
    answer:
      "Yes. Open Integrations to copy your Meta WhatsApp Cloud API webhook URL (/api/webhooks/whatsapp) and configure your Meta Business credentials so inbound WhatsApp chats sync directly with your bot and Live Inbox.",
  },
  {
    category: "Guardrails & Safety",
    question: "What happens if a visitor asks an off-topic question?",
    answer:
      "Each assistant enforces grounded RAG retrieval and system-prompt scope guardrails so off-topic questions are politely redirected back to your business offerings, or handed over to a live human agent.",
  },
];

const QUICK_GUIDES = [
  {
    title: "Website Widget Quickstart",
    description: "Embed the responsive AI chat widget on your site in under 2 minutes.",
    icon: Code2,
    href: "/bots",
    tag: "Deployment",
  },
  {
    title: "Knowledge Base Training",
    description: "Upload PDFs or crawl your website to ground replies in verified facts.",
    icon: BookOpen,
    href: "/knowledge",
    tag: "Training",
  },
  {
    title: "Razorpay Billing & Subscriptions",
    description: "Manage your subscription, autopay mandate, or billing receipts.",
    icon: CreditCard,
    href: "/billing",
    tag: "Billing",
  },
  {
    title: "Channels & Webhooks",
    description: "Configure outbound CRM webhooks and Meta WhatsApp Cloud API endpoints.",
    icon: MessageSquare,
    href: "/integrations",
    tag: "Integrations",
  },
];

export default function SupportPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Technical Issue");
  const [ticketPriority, setTicketPriority] = useState("Normal");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const [ticketError, setTicketError] = useState("");

  const categories = [
    "All",
    "Billing & Autopay",
    "Bots & Creation",
    "Website Widget",
    "Knowledge Base",
    "Lead Capture",
    "WhatsApp & Integrations",
    "Guardrails & Safety",
  ];

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setTicketError("");
    setTicketSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          category: ticketCategory,
          priority: ticketPriority,
          message: ticketMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit support ticket");
      }

      const msg = data.message || `Ticket #${data.ticketId} created successfully.`;
      setTicketSuccess(msg);
      toast({ title: "Support ticket submitted", message: msg, variant: "success" });
      setTicketSubject("");
      setTicketMessage("");
    } catch (err) {
      setTicketError(err.message || "Unable to create support ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      <PageHeader
        badge="Help Center & Engineering Desk"
        title="Support & Documentation"
        description="Search setup guides, browse frequently asked questions, or submit a prioritized technical support ticket."
        actions={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
        }
      />

      {/* Search Hero */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-[var(--shadow-xs)]">
        <div className="max-w-2xl space-y-3">
          <label htmlFor="support-search" className="text-sm font-bold text-[var(--text-primary)] block">
            Search guides, FAQs, or setup instructions
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="support-search"
              type="text"
              placeholder="e.g. widget embed, Razorpay autopay, WhatsApp webhook, knowledge PDF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs sm:text-sm outline-hidden focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3 Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Email Support</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Share logs, billing queries, or screenshots directly with our engineering support desk.
            </p>
          </div>
          <a
            href="mailto:support@emperorsmartsolutions.com"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>support@emperorsmartsolutions.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Priority Ticket Desk</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Open a tracked workspace ticket below so platform engineers can assist with your bot setup.
            </p>
          </div>
          <a
            href="#ticket-form"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Create Support Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Operating Hours</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Monday – Saturday, 9:00 AM – 8:00 PM IST. Production cluster monitoring runs 24/7.
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Target response under 4 business hours</span>
          </div>
        </div>
      </div>

      {/* Quick Guides Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Recommended Setup Guides</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_GUIDES.map((guide, idx) => {
            const Icon = guide.icon;
            return (
              <Link
                key={idx}
                href={guide.href}
                className="group p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-indigo-500/50 shadow-[var(--shadow-xs)] transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                      {guide.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {guide.description}
                  </p>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Frequently Asked Questions</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              No questions matched &ldquo;{search}&rdquo;. Submit a ticket below for direct help.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-xs)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-subtle)]/40 transition-colors"
                  >
                    <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)] shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] animate-fade-in">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ticket Submission Form */}
      <div
        id="ticket-form"
        className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-[var(--shadow-xs)] space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Open a Support Ticket
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Describe your issue and our engineering team will follow up directly.
            </p>
          </div>
        </div>

        {ticketSuccess && (
          <InlineAlert
            variant="success"
            title="Ticket Created"
            message={ticketSuccess}
            onDismiss={() => setTicketSuccess(null)}
          />
        )}

        {ticketError && (
          <InlineAlert
            variant="error"
            title="Submission Failed"
            message={ticketError}
            onDismiss={() => setTicketError("")}
          />
        )}

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief summary of your question or issue..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              >
                <option value="Billing & Autopay">Billing & Autopay</option>
                <option value="AI Bot Training">AI Bot Training</option>
                <option value="Website Widget Embed">Website Widget Embed</option>
                <option value="WhatsApp Cloud API">WhatsApp Cloud API</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Feature Request">Feature Request</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                Priority
              </label>
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Production Impact)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] block">
              Message Details
            </label>
            <textarea
              rows={4}
              placeholder="Describe what you are trying to do, steps taken, and any error message shown..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[var(--text-muted)]">
              Ticket transcripts are scoped privately to your workspace.
            </span>
            <Button type="submit" icon={Send} loading={submitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
