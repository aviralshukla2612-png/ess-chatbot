"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

// Pre-configured knowledge base responses for Emperor Nexus live demo
const KNOWLEDGE_RESPONSES = [
  {
    triggers: ["what can you do", "features", "capabilities", "overview", "what is emperor nexus", "help", "about"],
    text: `**Emperor Nexus** is an autonomous 24/7 Sales AI Assistant built to convert website visitors into paying customers.\n\nHere is what I do for your business:\n• ⚡ **Sub-Second Replies:** Answer customer queries in under 500ms.\n• 🎯 **Lead Qualification:** Collect names, mobile numbers, emails & intent automatically.\n• 📚 **Custom Knowledge Base:** Learn from your PDFs, website URLs, and catalogs with 100% accuracy.\n• 🔌 **1-Line Embed:** Add to WordPress, Shopify, Next.js, Webflow, or custom sites in 60 seconds.\n• 🛡️ **Enterprise Privacy:** Strict multi-tenant data isolation and role-based access.`,
    quickReplies: ["Show Real Estate demo", "What are the pricing plans?", "How do I embed on my site?"],
  },
  {
    triggers: ["real estate", "property", "developer", "realtor", "home", "flat", "apartment"],
    text: `🏢 **Real Estate Sales Copilot in Action:**\n\nWhen a buyer visits your property website, Emperor Nexus:\n1. Recommends matching 2BHK/3BHK units based on budget and location.\n2. Shares floor plans, pricing sheets, and amenity brochures instantly.\n3. Books site visits directly into your sales team's calendar.\n4. Verifies the buyer's 10-digit mobile number with instant DLT OTP.\n\n*Result:* 3.4x higher lead capture rate compared to static contact forms!`,
    quickReplies: ["What are the pricing plans?", "How do I embed on my site?", "How does it capture leads?"],
  },
  {
    triggers: ["price", "pricing", "cost", "plan", "subscription", "free trial"],
    text: `💰 **Flexible Pricing Built for Growth:**\n\n• **Starter ($49/mo):** 1 Active AI Bot, 2,500 conversations/mo, standard website scraping, email lead alerts.\n• **Professional ($149/mo):** 3 Active AI Bots, 15,000 conversations/mo, custom branding, DLT SMS OTP verification, CRM webhooks.\n• **Enterprise (Custom):** Unlimited Bots, dedicated VPC isolation, custom fine-tuned LLM models, 24/7 SLA guarantee.\n\n✨ All plans include a 14-day free trial with no credit card required!`,
    cta: { text: "View Full Pricing Table", href: "#pricing" },
    quickReplies: ["How do I embed on my site?", "Show Real Estate demo", "What can Emperor Nexus do?"],
  },
  {
    triggers: ["lead", "leads", "capture", "crm", "hubspot", "salesforce", "webhook"],
    text: `📈 **Autonomous Lead Capture & CRM Sync:**\n\nEmperor Nexus doesn't just chat — it sells!\n\n• Conversational lead forms capture visitor mobile number, name, and purchase intent naturally.\n• Automatically pushes qualified leads to your CRM (HubSpot, Salesforce, Zoho, Google Sheets, or custom Webhooks).\n• Sends instant SMS and WhatsApp notifications to your on-duty sales reps the moment a high-value lead is identified.`,
    quickReplies: ["What are the pricing plans?", "How do I embed on my site?"],
  },
  {
    triggers: ["embed", "install", "integration", "integrate", "setup", "code", "wordpress", "shopify"],
    text: `🚀 **Embed in 60 Seconds with 1 Line of Code:**\n\nSimply paste this snippet right before the \`</body>\` tag of your website:\n\n\`\`\`html\n<script \n  src="https://emperornexus.com/widget.js" \n  data-bot-id="YOUR_BOT_ID">\n</script>\n\`\`\`\n\nIt works seamlessly with WordPress, Shopify, Webflow, Wix, Squarespace, React, Vue, or any custom HTML site!`,
    cta: { text: "Create Bot & Get Code", href: "/login" },
    quickReplies: ["What can Emperor Nexus do?", "What are the pricing plans?"],
  },
  {
    triggers: ["dlt", "otp", "sms", "verification", "phone", "mobile"],
    text: `📱 **TRAI DLT Verified Mobile Authentication:**\n\nEmperor Nexus features native integration with TRAI DLT SMS gateways (Template ID: 1607100000000313742). When visitors request callbacks or access gated pricing, their 10-digit mobile number is instantly verified via 6-digit SMS OTP from *Team Nexus* within 2 seconds.`,
    quickReplies: ["How does it capture leads?", "What are the pricing plans?"],
  },
];

const INITIAL_MESSAGES = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "👋 Welcome to **Emperor Nexus**! I'm your autonomous Sales AI Assistant.\n\nI engage every visitor 24/7, answer questions in sub-seconds, qualify leads, and close deals directly on your site.\n\nTry clicking a question below or type anything to experience the speed!",
    quickReplies: [
      "What can Emperor Nexus do?",
      "Show Real Estate demo",
      "What are the pricing plans?",
      "How do I embed on my site?",
    ],
  },
];

export default function LiveDemoChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadPrompt, setUnreadPrompt] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadPrompt(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, isTyping]);

  // Find best matching answer from knowledge base
  const findResponse = (userQuery) => {
    const q = userQuery.toLowerCase().trim();
    for (const item of KNOWLEDGE_RESPONSES) {
      if (item.triggers.some((trigger) => q.includes(trigger))) {
        return item;
      }
    }
    // Fallback response for unmapped general queries
    return {
      text: `Thanks for asking about "${userQuery}"! Emperor Nexus can be trained on your specific business documentation, product inventory, and customer FAQs in under 3 minutes.\n\nWould you like to test a specific capability?`,
      quickReplies: [
        "What can Emperor Nexus do?",
        "Show Real Estate demo",
        "What are the pricing plans?",
        "How do I embed on my site?",
      ],
      cta: { text: "Launch Free Workspace", href: "/login" },
    };
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Realistic response delay for natural conversational rhythm
    setTimeout(() => {
      const match = findResponse(query);
      const botMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: match.text,
        quickReplies: match.quickReplies,
        cta: match.cta,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 650);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setIsTyping(false);
  };

  return (
    <aside aria-label="Interactive Sales AI Demo" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* 1. FLOATING LAUNCHER BUTTON & CALLOUT PILL */}
      {!isOpen && (
        <div className="relative flex flex-col items-end">
          {/* Pulsing Attention Badge */}
          {unreadPrompt && (
            <div
              onClick={() => setIsOpen(true)}
              className="mb-2 px-3.5 py-1.5 rounded-full bg-[#13111E]/95 border border-[#963DFF]/50 text-white text-xs font-semibold shadow-[0_4px_20px_rgba(150,61,255,0.45)] backdrop-blur-xl flex items-center gap-1.5 cursor-pointer animate-bounce hover:scale-105 transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C28AFF]" />
              <span>Try Live Demo AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          )}

          {/* Main Launcher Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Emperor Nexus Live Demo Chatbot"
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-tr from-[#6819DE] via-[#8529F7] to-[#A855F7] p-0.5 shadow-[0_8px_30px_rgba(150,61,255,0.6)] hover:shadow-[0_12px_40px_rgba(150,61,255,0.85)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden"
          >
            {/* Ambient Inner Glow */}
            <div className="w-full h-full rounded-full bg-[#0D0B18] flex items-center justify-center p-2.5 transition-colors group-hover:bg-[#151126]">
              <img
                src="/icon-512.png"
                alt="Emperor Nexus Mascot"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(194,138,255,0.7)] group-hover:scale-110 transition-transform"
              />
            </div>

            {/* Live Green Status Badge */}
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0D0B18] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </button>
        </div>
      )}

      {/* 2. CHAT MODAL WINDOW */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Emperor Nexus Sales AI Assistant Chat"
          className="w-[calc(100vw-32px)] sm:w-[390px] h-[540px] max-h-[82vh] rounded-3xl bg-[#0B0B14]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(150,61,255,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#17122B] via-[#120F24] to-[#0D0B18] border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#963DFF] to-cyan-400">
                <div className="w-full h-full rounded-full bg-[#0D0B18] p-1 flex items-center justify-center">
                  <img
                    src="/icon-512.png"
                    alt="Emperor Nexus Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0D0B18]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-xs sm:text-sm">Emperor Nexus</h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-[#963DFF]/30 text-[#C28AFF] font-mono text-[9px] uppercase tracking-wider font-bold border border-[#963DFF]/40">
                    Live AI
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A1B0] flex items-center gap-1">
                  <span>Sales & Conversion Copilot</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart Conversation"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm font-sans overscroll-contain">
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? "items-start" : "items-end"} space-y-2`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      isBot
                        ? "bg-[#151322] border border-white/[0.08] text-[#E4E4EB]"
                        : "bg-linear-to-r from-[#7B2BF9] to-[#963DFF] text-white shadow-[0_4px_16px_rgba(150,61,255,0.35)]"
                    }`}
                  >
                    <div className="whitespace-pre-line text-xs sm:text-[13px]">
                      {msg.text.split("\n").map((line, i) => {
                        // Bold markdown parser
                        const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                        return (
                          <span
                            key={i}
                            className="block"
                            dangerouslySetInnerHTML={{ __html: formatted }}
                          />
                        );
                      })}
                    </div>

                    {/* Optional in-message Call To Action Link */}
                    {msg.cta && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <Link
                          href={msg.cta.href}
                          onClick={() => {
                            if (msg.cta.href.startsWith("#")) {
                              setIsOpen(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#963DFF] hover:bg-[#8529f7] text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <span>{msg.cta.text}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Quick Reply Suggestion Chips */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-w-[95%]">
                      {msg.quickReplies.map((pill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(pill)}
                          disabled={isTyping}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1A162B] hover:bg-[#963DFF]/25 border border-white/10 hover:border-[#963DFF]/50 text-[#C28AFF] transition-all cursor-pointer text-left shrink-0 active:scale-95"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#A1A1B0] pl-1">
                <div className="flex items-center gap-1 p-2 rounded-2xl bg-[#151322] border border-white/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C28AFF] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C28AFF] animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C28AFF] animate-pulse delay-300" />
                </div>
                <span className="text-[11px] font-mono">Nexus AI typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Input Bar */}
          <div className="p-3 bg-[#0A0A12] border-t border-white/[0.08] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about sales, pricing, or embedding..."
                disabled={isTyping}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#12111E] hover:border-white/20 focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] outline-hidden text-xs text-white placeholder:text-white/30 transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send Message"
                className="p-2.5 rounded-xl bg-linear-to-tr from-[#7B2BF9] to-[#963DFF] hover:brightness-110 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[0_0_15px_rgba(150,61,255,0.4)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-[#7E7E91] px-1 font-mono">
              <span className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-[#C28AFF]" />
                <span>Sub-second replies</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span>Enterprise Privacy</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
