"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  Phone,
  Code2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileQuestion,
  ShieldCheck,
  ExternalLink,
  Bot,
  CreditCard,
  Layers,
  ArrowRight,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    category: "Billing & Autopay",
    question: "How does the 7-day free trial and Razorpay autopay work?",
    answer:
      "When you start your 7-day free trial, ₹0 is charged upfront. Razorpay sets up an autopay mandate that schedules the first subscription deduction on Day 8. You can cancel your autopay with 1 click in Settings anytime before Day 7, and zero money will be deducted from your bank account.",
  },
  {
    category: "Bots & Creation",
    question: "How many AI bots can I create?",
    answer:
      "Workspaces can create and train active AI chatbots with unlimited conversational messages, lead capture capabilities, and full vector knowledge retrieval.",
  },
  {
    category: "Website Widget",
    question: "How do I embed the AI chatbot widget on my website?",
    answer:
      "Navigate to Bots -> Select your bot -> Deploy -> Website Widget. You'll find a single-line embed snippet. Copy and paste it right before the closing </body> tag of your website. It works seamlessly on HTML, React, Next.js, WordPress, Shopify, Webflow, and Squarespace.",
  },
  {
    category: "Knowledge Base",
    question: "How do I train my chatbot on my website or documents?",
    answer:
      "Go to Knowledge -> Add Source. You can enter your public website URL for autonomous page crawling, or upload PDFs, TXTs, and DOCX files. The ingestion engine automatically segments the content into high-dimensional semantic vector chunks.",
  },
  {
    category: "Lead Capture",
    question: "How does autonomous lead capture work?",
    answer:
      "Our AI assistant listens for customer contact details (names, emails, and 10-digit Indian or international phone numbers) during the conversation. Once detected, the lead is automatically extracted, categorized, and recorded under the Leads tab in real time.",
  },
  {
    category: "WhatsApp & Integrations",
    question: "Can I connect my chatbot to WhatsApp?",
    answer:
      "Yes! Navigate to Integrations -> WhatsApp Cloud API. Provide your Meta Business Phone Number ID, Access Token, and configure your webhook URL to deploy your assistant directly on your business WhatsApp number.",
  },
  {
    category: "Guardrails & Safety",
    question: "What happens if a visitor asks an off-topic or irrelevant question?",
    answer:
      "The chatbot is equipped with enterprise-grade intent classification and out-of-scope guardrails. Irrelevant questions (e.g. personal opinions, general trivia, celebrities) are politely redirected back to your company's offerings.",
  },
];

const QUICK_GUIDES = [
  {
    title: "Website Widget Quickstart",
    description: "Install the responsive AI chat widget on any website in under 2 minutes.",
    icon: Code2,
    href: "/bots",
    tag: "Deployment",
  },
  {
    title: "Knowledge Base Training",
    description: "Upload PDFs or crawl your sitemap to ground your bot in authentic facts.",
    icon: BookOpen,
    href: "/knowledge",
    tag: "Training",
  },
  {
    title: "Razorpay Autopay & Billing",
    description: "Understand your 7-day free trial, autopay schedule, and billing history.",
    icon: CreditCard,
    href: "/settings",
    tag: "Billing",
  },
  {
    title: "Meta WhatsApp Cloud API",
    description: "Connect your official WhatsApp Business number for autonomous lead sales.",
    icon: MessageSquare,
    href: "/integrations",
    tag: "Integrations",
  },
];

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Ticket Form State
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Technical Issue");
  const [ticketPriority, setTicketPriority] = useState("Normal");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const [ticketError, setTicketError] = useState("");

  const categories = ["All", "Billing & Autopay", "Bots & Creation", "Website Widget", "Knowledge Base", "Lead Capture", "WhatsApp & Integrations", "Guardrails & Safety"];

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

      setTicketSuccess(data.message || `Ticket #${data.ticketId} created successfully!`);
      setTicketSubject("");
      setTicketMessage("");
    } catch (err) {
      setTicketError(err.message || "An unexpected error occurred while creating your ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-neutral-900 border border-indigo-500/20 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            24/7 Dedicated Support & Assistance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Search our knowledge base for instant answers on bot deployment, 7-day trials, Razorpay autopay, and knowledge base vector training.
          </p>

          {/* Search Bar */}
          <div className="relative pt-2">
            <Search className="w-4 h-4 text-indigo-300 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guides, FAQs, error messages, or setup instructions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-200/60 text-xs sm:text-sm outline-hidden focus:border-indigo-400 focus:bg-white/15 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-6 sm:mt-0 sm:absolute sm:top-8 sm:right-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>All Systems Operational</span>
        </div>
      </div>

      {/* 3 Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Email Support
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Send us your inquiries or screenshots. Our engineering team responds within 2-4 hours.
            </p>
          </div>
          <a
            href="mailto:support@empoweringstartups.org"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>support@empoweringstartups.org</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Instant Ticket Desk
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Submit a prioritized ticket below. Track issue resolution directly inside your account.
            </p>
          </div>
          <a
            href="#ticket-form"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Create a Support Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Support Hours
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Monday through Saturday: 9:00 AM – 8:00 PM IST. Emergency server monitoring operates 24/7.
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Guaranteed 24-hr resolution</span>
          </div>
        </div>
      </div>

      {/* Quick Guides Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Recommended Setup Guides</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {QUICK_GUIDES.map((guide, idx) => {
            const Icon = guide.icon;
            return (
              <Link
                key={idx}
                href={guide.href}
                className="group p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {guide.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {guide.description}
                  </p>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open Guide</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-indigo-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Clear answers to common questions about trials, subscriptions, and AI training.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
              No questions found matching &quot;{search}&quot;. Try submitting a support ticket below!
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 animate-fade-in">
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
      <div id="ticket-form" className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Open a Support Ticket
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Can&apos;t find what you&apos;re looking for? Describe your issue and our technical team will respond quickly.
            </p>
          </div>
        </div>

        {ticketSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{ticketSuccess}</span>
          </div>
        )}

        {ticketError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2.5 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{ticketError}</span>
          </div>
        )}

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief summary of your question or issue..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-hidden focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-hidden focus:border-indigo-600"
              >
                <option value="Billing & Autopay">Billing & Autopay</option>
                <option value="AI Bot Training">AI Bot Training</option>
                <option value="Website Widget Embed">Website Widget Embed</option>
                <option value="WhatsApp Cloud API">WhatsApp Cloud API</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Feature Request">Feature Request</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Message Details
            </label>
            <textarea
              rows={4}
              placeholder="Describe what you are trying to do, what happened, or any error messages you see..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-400">
              🔒 Your ticket details are handled confidentially by our platform team.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Submitting Ticket..." : "Submit Ticket"}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
