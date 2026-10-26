"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  FileText,
  Minimize2,
  Maximize2,
  RefreshCw,
} from "lucide-react";

function formatPreviewMessage(text, isUser = false, primaryColor = "#4f46e5") {
  if (!text || typeof text !== "string") return "";

  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  if (isUser) {
    escaped = escaped.replace(
      /(https?:\/\/[^\s<)"']+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#ffffff;text-decoration:underline;font-weight:600;word-break:break-all;">$1</a>'
    );
    return escaped.replace(/\n/g, "<br/>");
  }

  // Strip leaked prompt rules
  escaped = escaped.replace(/^(?:IMPORTANT\s+CHATBOT\s+RULES|CHATBOT\s+RULES|SYSTEM\s+RULES|RULES|SYSTEM\s+PROMPT):?[^\n]*\n*/gim, "");
  escaped = escaped.replace(/^(?:(?:You are|The visitor is|The user is)\s+writing in[^\n]*\n*)+/gim, "");
  escaped = escaped.replace(/^(?:VISITOR\s*(?:IDENTITY|DETAILS)?:?[^\n]*\n*)+/gim, "");
  escaped = escaped.replace(/^(?:MANDATORY\s+)?[A-Z0-9_\s-]+(?:RULE|DIRECTIVE|INSTRUCTION):[^\n]*\n*/gim, "");

  // Bold
  escaped = escaped.replace(/\*{2,3}([^*]+)\*{2,3}/g, '<strong class="font-bold text-neutral-900 dark:text-neutral-50">$1</strong>');

  // Tokenized Link Parser
  const linkTokens = [];
  escaped = escaped.replace(/\[([^\]]+)\]\(((?:https?:\/\/)[^\s)<>"']+)\)/gi, (match, rawTitle, rawUrl) => {
    const idx = linkTokens.length;
    linkTokens.push({ title: rawTitle, url: rawUrl });
    return `%%PREVIEW_LINK_TOKEN_${idx}%%`;
  });

  escaped = escaped.replace(/(^|[\s(])((?:https?:\/\/)[^\s<>)"]+)/gi, (match, prefix, rawUrl) => {
    const cleanUrl = rawUrl.replace(/[.,;:!?]+$/, "");
    const trailingPunct = rawUrl.slice(cleanUrl.length);
    const idx = linkTokens.length;
    linkTokens.push({ title: cleanUrl, url: cleanUrl });
    return `${prefix}%%PREVIEW_LINK_TOKEN_${idx}%%${trailingPunct}`;
  });

  escaped = escaped.replace(/%%PREVIEW_LINK_TOKEN_(\d+)%%/g, (match, index) => {
    const token = linkTokens[Number(index)];
    if (!token) return "";
    if (!/^https?:\/\//i.test(token.url)) return token.title;
    return `<a href="${token.url}" target="_blank" rel="noopener noreferrer" class="underline font-semibold hover:opacity-80 break-all" style="color:${primaryColor}">${token.title}</a>`;
  });

  escaped = escaped.replace(/^[*-]\s+(.+)$/gm, "• $1");
  escaped = escaped.replace(/\n/g, "<br/>");
  return escaped;
}

export default function BotPreviewWidget({
  botId = null,
  botName = "AI Assistant",
  avatar = "💬",
  primaryColor = "#4f46e5",
  welcomeMessage = "Hello! How can I help you today?",
  placeholderText = "Ask a question...",
  position = "right",
  showLeadForm = false,
  quickReplies = [],
}) {
  const [messages, setMessages] = useState([
    {
      id: "w_1",
      role: "assistant",
      content: welcomeMessage,
      quickReplies: Array.isArray(quickReplies) ? quickReplies : [],
      sources: [],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });
  const [showPromptLead, setShowPromptLead] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(`session_preview_${Date.now()}`);
  }, []);

  const handleSend = async (e, explicitText) => {
    e?.preventDefault();
    const userText = (typeof explicitText === "string" ? explicitText : inputText).trim();
    if (!userText) return;

    const userMsg = {
      id: `w_u_${Date.now()}`,
      role: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!explicitText) setInputText("");
    setIsTyping(true);

    if (!botId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `w_err_${Date.now()}`,
          role: "assistant",
          content: "⚠️ No valid Bot ID provided. Please select or configure a chatbot to preview.",
          quickReplies: [],
          sources: [],
        },
      ]);
      setIsTyping(false);
      return;
    }

    // Try live Next.js API endpoint with 30s timeout for local LLM inference
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`/api/public/chat/${encodeURIComponent(botId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-4),
          visitor: leadCaptured ? leadData : {},
          sessionId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `w_a_${Date.now()}`,
              role: "assistant",
              content: data.reply,
              quickReplies: data.quickReplies || [],
              sources: data.sources || ["Verified Knowledge"],
            },
          ]);
          setIsTyping(false);
          return;
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `w_err_${Date.now()}`,
            role: "assistant",
            content: errorData.error || `⚠️ Chatbot service returned an error (HTTP ${res.status}). Please try again.`,
            quickReplies: [],
            sources: [],
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          id: `w_err_${Date.now()}`,
          role: "assistant",
          content: isTimeout
            ? "⚠️ The request took longer than 30 seconds to complete. Please try again."
            : "⚠️ Unable to reach the chatbot service right now. Please verify that the chatbot service is online and try again.",
          quickReplies: [],
          sources: [],
        },
      ]);
      setIsTyping(false);
      return;
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadCaptured(true);
    setShowPromptLead(false);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadData.name || "Preview Prospect",
          email: leadData.email || "",
          phone: leadData.phone || "",
          company: "Interactive Widget Preview",
          bot: botName,
          score: "High",
          inquiry: messages[messages.length - 1]?.content || "Inquiry from preview widget",
          source: "Interactive Bot Preview",
        }),
      });
    } catch (err) {}

    setMessages((prev) => [
      ...prev,
      {
        id: `w_lead_${Date.now()}`,
        role: "assistant",
        content: `Thank you${leadData.name ? ', ' + leadData.name : ''}! We have received your details and will get back to you shortly.`,
        sources: [],
      },
    ]);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-[520px]">
      {/* Widget Header */}
      <div
        className="p-4 text-white flex items-center justify-between shadow-xs transition-colors"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg shadow-inner">
            {avatar}
          </div>
          <div>
            <h4 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
              {botName}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[11px] opacity-80">Instant AI Knowledge Assistant</p>
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              if (botId) {
                await fetch(`/api/public/chat/${encodeURIComponent(botId)}/session`, {
                  method: "DELETE",
                  credentials: "include",
                });
              }
            } catch (e) {}
            setMessages([{ id: "w_1", role: "assistant", content: welcomeMessage, sources: [] }]);
            setShowPromptLead(false);
            setLeadCaptured(false);
            setSessionId(`session_preview_${Date.now()}`);
          }}
          title="Restart Conversation"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/60 dark:bg-neutral-950/40 text-xs">
        {messages.map((m, idx) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-xs"
                  : "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200/70 dark:border-neutral-700/80 rounded-tl-xs"
              }`}
              dangerouslySetInnerHTML={{
                __html: formatPreviewMessage(m.content, m.role === "user", primaryColor),
              }}
            />

            {/* Quick Replies Interactive Options */}
            {m.quickReplies && m.quickReplies.length > 0 && idx === messages.length - 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                {m.quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(null, qr)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-indigo-600/70 dark:border-indigo-400/70 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Citations if available */}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 max-w-[85%]">
                {m.sources.map((src, i) => {
                  const title =
                    typeof src === "object" && src !== null
                      ? src.title || src.url || "Knowledge Document"
                      : String(src || "Knowledge Source");
                  const url = typeof src === "object" && src !== null ? src.url : null;

                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded-sm"
                    >
                      <FileText className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate max-w-[180px]"
                          title={title}
                        >
                          {title}
                        </a>
                      ) : (
                        <span className="truncate max-w-[180px]" title={title}>
                          {title}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-16">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        {/* Lead Capture Interactive Trigger */}
        {showPromptLead && !leadCaptured && (
          <div className="mt-2 p-3 bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-neutral-800 dark:text-neutral-200">
            <p className="font-semibold text-xs text-indigo-900 dark:text-indigo-200 mb-1.5">
              Request Founder Consultation:
            </p>
            <form onSubmit={handleLeadSubmit} className="space-y-1.5">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs outline-hidden"
              />
              <input
                type="email"
                placeholder="Business Email"
                required
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs outline-hidden"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
              >
                Submit & Connect
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholderText}
          className="flex-1 px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-transparent focus:border-indigo-500 outline-hidden text-neutral-900 dark:text-white placeholder:text-neutral-400"
        />
        <button
          type="submit"
          className="p-2 rounded-xl text-white shadow-xs transition-all hover:scale-105"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
