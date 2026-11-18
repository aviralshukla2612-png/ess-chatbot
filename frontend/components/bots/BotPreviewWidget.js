"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  FileText,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Clock,
} from "lucide-react";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 text-[11px] font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedMessage({ content }) {
  if (!content) return null;
  const parts = String(content).split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 leading-relaxed break-words">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const firstNewline = inner.indexOf("\n");
          const lang = firstNewline > -1 ? inner.slice(0, firstNewline).trim() : "";
          const code = firstNewline > -1 ? inner.slice(firstNewline + 1) : inner;
          return <CodeBlock key={idx} language={lang} code={code.trimEnd()} />;
        }

        return (
          <div key={idx} className="whitespace-pre-line">
            {part.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((token, tIdx) => {
              if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
                return (
                  <code
                    key={tIdx}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-indigo-700 dark:text-indigo-300"
                  >
                    {token.slice(1, -1)}
                  </code>
                );
              }
              if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
                return <strong key={tIdx} className="font-semibold">{token.slice(2, -2)}</strong>;
              }
              return <React.Fragment key={tIdx}>{token}</React.Fragment>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function BotPreviewWidget({
  botId = null,
  botName = "AI Sales Assistant",
  avatar = "🤖",
  primaryColor: rawPrimaryColor = "#4F46E5",
  welcomeMessage = "Hello! Welcome to our workspace. How can I help you today?",
  placeholderText = "Ask a question...",
  starterQuestions = [],
  showLeadForm = false,
}) {
  const sanitizeColor = (c) => {
    if (!c || typeof c !== "string" || !c.trim()) return "#4F46E5";
    const trimmed = c.trim();
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };
  const primaryColor = sanitizeColor(rawPrimaryColor);

  const [messages, setMessages] = useState([
    {
      id: "w_1",
      role: "assistant",
      content: welcomeMessage,
      quickReplies: Array.isArray(starterQuestions) ? starterQuestions.slice(0, 4) : [],
      sources: [],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });
  const [showPromptLead, setShowPromptLead] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setSessionId(`session_preview_${botId || "bot"}_${Date.now()}`);
    setMessages([
      {
        id: `w_1_${botId || "default"}`,
        role: "assistant",
        content: welcomeMessage || `Hello! I am ${botName}. How can I help you today?`,
        quickReplies: Array.isArray(starterQuestions) ? starterQuestions.slice(0, 4) : [],
        sources: [],
      },
    ]);
    setLeadCaptured(false);
    setInputText("");
    setIsTyping(false);
  }, [botId, welcomeMessage, botName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isTyping]);

  const handleSend = async (e, explicitText) => {
    e?.preventDefault();
    if (isTyping) return;
    const userText = (typeof explicitText === "string" ? explicitText : inputText).trim();
    if (!userText) return;

    const historySnapshot = messages
      .filter((m) => !m.isError && m.content)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

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
          isError: true,
          retryText: userText,
          content: "No valid Bot ID provided. Select or save a chatbot first to test live responses.",
          quickReplies: [],
          sources: [],
        },
      ]);
      setIsTyping(false);
      return;
    }

    const startedAt = Date.now();
    const assistantMsgId = `w_a_${startedAt}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 32000);
      const res = await fetch(`/api/public/chat/${encodeURIComponent(botId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historySnapshot,
          visitor: leadCaptured ? leadData : {},
          sessionId,
          stream: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `w_err_${Date.now()}`,
            role: "assistant",
            isError: true,
            retryText: userText,
            content:
              errorData.error ||
              `Chatbot service returned HTTP ${res.status}. Please retry in a moment.`,
            quickReplies: [],
            sources: [],
          },
        ]);
        setIsTyping(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && res.body) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            quickReplies: [],
            sources: [],
          },
        ]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let finalMeta = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const evt = JSON.parse(jsonStr);
              if (typeof evt.token === "string") {
                accumulated += evt.token;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
                );
              }
              if (evt.done || evt.reply) {
                if (evt.reply && !accumulated) accumulated = evt.reply;
                finalMeta = evt;
              }
            } catch {}
          }
        }

        const latencyMs = Date.now() - startedAt;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulated || finalMeta.reply || "How else can I assist you?",
                  quickReplies: finalMeta.quickReplies || [],
                  sources: finalMeta.sources || [],
                  latencyMs,
                }
              : m
          )
        );
        setIsTyping(false);
        return;
      }

      // Standard JSON response fallback
      const data = await res.json();
      const latencyMs = Date.now() - startedAt;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: data?.reply || "How else can I help you?",
          quickReplies: data?.quickReplies || [],
          sources: data?.sources || [],
          latencyMs,
        },
      ]);
      setIsTyping(false);
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          id: `w_err_${Date.now()}`,
          role: "assistant",
          isError: true,
          retryText: userText,
          content: isTimeout
            ? "The response timed out after 30 seconds. Click Retry to send again."
            : "Unable to reach the chatbot endpoint right now. Check your connection and retry.",
          quickReplies: [],
          sources: [],
        },
      ]);
      setIsTyping(false);
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
          botId,
          name: leadData.name || "Preview Prospect",
          email: leadData.email || "",
          phone: leadData.phone || "",
          company: "Playground Test",
          bot: botName,
          score: "High",
          inquiry: messages[messages.length - 1]?.content || "Inquiry from playground",
          source: "Bot Playground",
        }),
      });
    } catch {}

    setMessages((prev) => [
      ...prev,
      {
        id: `w_lead_${Date.now()}`,
        role: "assistant",
        content: `Thank you, ${leadData.name || "there"}! Our team has received your details and will reach out at ${leadData.email || "your contact"} shortly.`,
        sources: [],
      },
    ]);
  };

  const handleRestart = async () => {
    try {
      await fetch(`/api/public/chat/${encodeURIComponent(botId || "bot_aa")}/session`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}
    setMessages([
      {
        id: `w_reset_${Date.now()}`,
        role: "assistant",
        content: welcomeMessage,
        quickReplies: Array.isArray(starterQuestions) ? starterQuestions.slice(0, 4) : [],
        sources: [],
      },
    ]);
    setShowPromptLead(false);
    setLeadCaptured(false);
    setSessionId(`session_preview_${botId || "bot"}_${Date.now()}`);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto bg-[var(--bg-surface)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-subtle)] overflow-hidden flex flex-col h-[540px]">
      {/* Widget Header */}
      <div
        className="px-4 py-3.5 text-white flex items-center justify-between shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg shrink-0">
            {avatar}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm leading-tight flex items-center gap-1.5 truncate">
              <span className="truncate">{botName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
            </h4>
            <p className="text-[11px] text-white/80 truncate">AI Knowledge Assistant</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          aria-label="Reset conversation"
          title="Reset conversation"
          className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/85 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--bg-canvas)] text-xs">
        {messages.map((m, idx) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 ${
                m.role === "user"
                  ? "text-white rounded-tr-sm shadow-xs"
                  : m.isError
                  ? "bg-rose-50 dark:bg-rose-500/12 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 rounded-tl-sm"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-tl-sm shadow-2xs"
              }`}
              style={m.role === "user" ? { backgroundColor: primaryColor } : {}}
            >
              <FormattedMessage content={m.content} />

              {m.isError && m.retryText && (
                <button
                  type="button"
                  onClick={() => handleSend(null, m.retryText)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry message</span>
                </button>
              )}
            </div>

            {/* Starter / Quick Reply Chips */}
            {m.quickReplies && m.quickReplies.length > 0 && idx === messages.length - 1 && !isTyping && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[88%]">
                {m.quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(null, qr)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Citations & Latency Metadata */}
            {(m.latencyMs || (m.sources && m.sources.length > 0)) && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 max-w-[86%]">
                {m.sources &&
                  m.sources.slice(0, 2).map((src, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] bg-[var(--bg-subtle)] text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]"
                    >
                      <FileText className="w-2.5 h-2.5 text-[var(--accent-primary)]" />
                      {typeof src === "string" ? src : src.title || src.url || "Knowledge"}
                    </span>
                  ))}
                {m.latencyMs && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] tabular-nums">
                    <Clock className="w-2.5 h-2.5" />
                    {m.latencyMs < 1000 ? `${m.latencyMs}ms` : `${(m.latencyMs / 1000).toFixed(1)}s`}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-16 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.18s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.36s]" />
          </div>
        )}

        {showPromptLead && !leadCaptured && showLeadForm && (
          <div className="mt-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
            <p className="font-semibold text-xs text-[var(--text-primary)] mb-2">
              Share your contact details:
            </p>
            <form onSubmit={handleLeadSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Full name"
                required
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border-strong)] text-xs text-[var(--text-primary)]"
              />
              <input
                type="email"
                placeholder="Work email"
                required
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border-strong)] text-xs text-[var(--text-primary)]"
              />
              <button
                type="submit"
                className="w-full py-1.5 text-white rounded-lg font-medium text-xs transition-opacity hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Submit
              </button>
            </form>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          disabled={isTyping}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isTyping ? "Generating response..." : placeholderText}
          aria-label="Type a test message"
          className="flex-1 h-9 px-3 text-xs bg-[var(--bg-subtle)]/70 focus:bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-60 transition-colors"
        />
        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          aria-label="Send message"
          className="w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs transition-opacity hover:opacity-95 disabled:opacity-45 cursor-pointer shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
