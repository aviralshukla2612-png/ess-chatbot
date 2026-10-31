"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  FileText,
  Send,
  User,
  Bot,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  Inbox,
} from "lucide-react";
import { conversationsApi } from "@/lib/api/conversations";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import { cn } from "@/lib/utils";

// Indian Standard Client & Visitor Formatter
function formatVisitorDisplay(item) {
  if (!item) {
    return {
      name: "Prospective Client",
      initials: "",
      isGeneric: true,
      location: "Ahmedabad, Gujarat (India)",
    };
  }

  const rawName = (item.visitorName || "").trim();
  const email = (item.visitorEmail || "").trim();
  const phone = (item.visitorPhone || "").trim();
  let loc = (item.visitorLocation || "").trim();

  // Normalize location from US-centric "Direct Session" to Indian Standard
  if (!loc || loc === "Direct Session" || loc.toLowerCase() === "unknown") {
    loc = "Ahmedabad, Gujarat (India)";
  }

  let name = "";
  let isGeneric = false;

  if (
    rawName &&
    rawName.toLowerCase() !== "website visitor" &&
    rawName.toLowerCase() !== "direct session" &&
    rawName.toLowerCase() !== "website prospect"
  ) {
    name = rawName;
  } else if (email) {
    const handle = email.split("@")[0].replace(/[._]/g, " ");
    name = handle.replace(/\b\w/g, (c) => c.toUpperCase());
  } else if (phone) {
    name = `Client (${phone})`;
  } else {
    isGeneric = true;
    const city = loc.split(",")[0].trim() || "Ahmedabad";
    const shortId = item.id ? item.id.replace(/[^0-9]/g, "").slice(-4) : "";
    name = shortId ? `Client #${shortId} • ${city}` : `Client Inquiry • ${city}`;
  }

  // Derive crisp initials (e.g. "Pooja Patel" -> "PP", "Amit" -> "A")
  let initials = "";
  if (!isGeneric && name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
  }

  return { name, initials, isGeneric, location: loc };
}

// Rich Markdown, Bold, Links, and Bullets Formatter
function FormattedChatMessage({ text, isUser = false }) {
  if (!text) return null;

  const lines = String(text).split("\n");

  const parseInline = (line, lineKey) => {
    // Regex matches bold **text**, URLs, emails, and phone numbers
    const tokenRegex =
      /(\*\*[^*]+\*\*|https?:\/\/[^\s<>"')]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?[0-9]{1,4}[\s-]?[0-9]{5}[\s-]?[0-9]{5})/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        const boldText = token.slice(2, -2);
        parts.push(
          <strong
            key={`${lineKey}-${key++}`}
            className={isUser ? "font-bold text-white" : "font-bold text-white dark:text-white"}
          >
            {boldText}
          </strong>
        );
      } else if (token.startsWith("http://") || token.startsWith("https://")) {
        parts.push(
          <a
            key={`${lineKey}-${key++}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B68A55] hover:text-[#d8a86f] underline underline-offset-2 break-all font-medium transition-colors"
          >
            {token}
          </a>
        );
      } else if (token.includes("@") && !token.startsWith("http")) {
        parts.push(
          <a
            key={`${lineKey}-${key++}`}
            href={`mailto:${token}`}
            className="text-[#B68A55] hover:text-[#d8a86f] underline underline-offset-2 break-all font-medium transition-colors"
          >
            {token}
          </a>
        );
      } else if (token.startsWith("+") || token.replace(/\D/g, "").length >= 10) {
        parts.push(
          <a
            key={`${lineKey}-${key++}`}
            href={`tel:${token.replace(/\s+/g, "")}`}
            className="text-[#B68A55] hover:text-[#d8a86f] underline underline-offset-2 font-medium transition-colors"
          >
            {token}
          </a>
        );
      } else {
        parts.push(token);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return parts.length > 0 ? parts : line;
  };

  return (
    <div className="space-y-1.5 break-words [overflow-wrap:anywhere] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point detection (- or * or •)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 my-1">
              <span className="text-[#B68A55] font-bold text-xs shrink-0 select-none leading-relaxed">•</span>
              <div className="flex-1 min-w-0">{parseInline(content, idx)}</div>
            </div>
          );
        }

        return (
          <div key={idx} className="min-w-0">
            {parseInline(line, idx)}
          </div>
        );
      })}
    </div>
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [replyInput, setReplyInput] = useState("");

  const loadConversations = async () => {
    try {
      const data = await conversationsApi.getConversations();
      // Normalize all conversations to Indian Standard and Emperor AI Assistant
      const sanitized = (data || []).map((c) => {
        const parsedDisplay = formatVisitorDisplay(c);
        return {
          ...c,
          visitorName: parsedDisplay.name,
          visitorLocation: parsedDisplay.location,
          botName: c.botName && c.botName !== "aa" ? c.botName : "Emperor AI Assistant",
          botId: c.botId && c.botId !== "bot_aa" ? c.botId : "bot_1791618269632",
        };
      });
      setConversations(sanitized);
      if (sanitized.length > 0) {
        setSelectedId((prev) =>
          prev ? (sanitized.some((c) => c.id === prev) ? prev : sanitized[0].id) : sanitized[0].id
        );
      }
    } catch (err) {
      console.warn("Conversations real-time sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time synchronization hook (SSE event stream + adaptive background polling)
  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadConversations, {
    pollingInterval: 3000,
  });

  const filtered = conversations.filter((c) => {
    if (filterTab === "Active" && c.status !== "Active") return false;
    if (filterTab === "Leads" && !c.isLead) return false;
    if (filterTab === "Resolved" && c.status !== "Resolved") return false;
    if (
      search &&
      !c.visitorName?.toLowerCase().includes(search.toLowerCase()) &&
      !c.lastMessage?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const currentChat =
    conversations.find((c) => c.id === selectedId) || filtered[0] || null;

  const currentVisitor = formatVisitorDisplay(currentChat);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !currentChat) return;
    const text = replyInput;
    setReplyInput("");
    await conversationsApi.addMessage(currentChat.id, {
      role: "assistant",
      content: text,
      botName: currentChat.botName || "Emperor AI Assistant",
    });
    loadConversations();
  };

  const handleMarkResolved = async () => {
    if (!currentChat) return;
    await conversationsApi.markResolved(currentChat.id);
    loadConversations();
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in font-sans text-neutral-200">
      {/* Top Header with Real-Time Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Live Conversations & Chat Inbox</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#B68A55]/15 text-[#B68A55] border border-[#B68A55]/30 font-medium">
              Real-time
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Monitor, inspect, and reply to client inquiries in real-time across your live chatbot.
          </p>
        </div>
        <RealtimeBadge isLive={isLive} lastSync={lastSync} onRefresh={triggerSync} />
      </div>

      {/* 3-Column Inbox Panel */}
      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[760px]">
        {/* COLUMN 1: Conversation List */}
        <div className="w-full lg:w-72 xl:w-84 border-r border-[#EFE7DC] dark:border-neutral-800 flex flex-col shrink-0 bg-[#FAF9F6] dark:bg-[#0A0A0A]">
          <div className="p-4 border-b border-[#EFE7DC] dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#252525] dark:text-white tracking-wide">
                  Conversations
                </h2>
                <span className="text-[11px] font-semibold text-[#B68A55] bg-[#B68A55]/10 border border-[#B68A55]/20 px-2 py-0.5 rounded-full">
                  {filtered.length}
                  {filtered.length !== conversations.length ? ` / ${conversations.length}` : ""}
                </span>
              </div>
              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to clear all conversations?")) {
                      await conversationsApi.clearAll();
                      setSelectedId(null);
                      loadConversations();
                    }
                  }}
                  className="text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-semibold transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 text-xs bg-white dark:bg-[#121212] p-1 rounded-xl border border-[#EFE7DC] dark:border-neutral-800 shadow-xs">
              {["All", "Active", "Leads", "Resolved"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center",
                    filterTab === tab
                      ? "bg-[#252525] text-white font-semibold shadow-xs dark:bg-[#B68A55] dark:text-white"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-[#252525] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-[#1A1A1A]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EFE7DC] dark:border-neutral-800 bg-white dark:bg-[#141414] text-xs text-[#252525] dark:text-white placeholder-neutral-500 outline-hidden focus:border-[#B68A55] dark:focus:border-[#B68A55] transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* List items or Empty state */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EFE7DC] dark:divide-neutral-800/80">
            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center space-y-3.5 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#B68A55]/10 border border-[#B68A55]/20 flex items-center justify-center text-[#B68A55] mx-auto shadow-inner">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#252525] dark:text-white">
                  {filterTab === "Leads"
                    ? "No leads captured yet"
                    : filterTab === "Active"
                    ? "No active chats right now"
                    : filterTab === "Resolved"
                    ? "No resolved conversations"
                    : "No conversations yet"}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  {filterTab === "Leads"
                    ? "Qualified leads will appear here automatically as soon as clients share contact details with your bot."
                    : "New visitor sessions will appear here in real-time when clients interact with your chatbot."}
                </p>
                <div className="pt-2">
                  <Link
                    href="/bots"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#252525] hover:bg-black dark:bg-[#B68A55] dark:hover:bg-[#a37946] text-white font-semibold text-xs shadow-xs transition-all"
                  >
                    <span>View Bots</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {filtered.map((item) => {
              const isSelected = item.id === (currentChat?.id || selectedId);
              const visitor = formatVisitorDisplay(item);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative",
                    isSelected
                      ? "bg-white dark:bg-[#161616] border-l-3 border-[#B68A55] dark:border-[#B68A55] shadow-xs"
                      : "hover:bg-[#FAF9F6] dark:hover:bg-[#111111] text-[#252525] dark:text-neutral-300"
                  )}
                >
                  {/* Smart Initials or User Icon */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all",
                      isSelected
                        ? "bg-[#252525] border-[#252525] text-white shadow-xs dark:bg-[#B68A55] dark:border-[#B68A55]"
                        : "bg-white border-[#EFE7DC] text-[#B68A55] dark:bg-[#141414] dark:border-neutral-800 dark:text-[#B68A55]"
                    )}
                  >
                    {!visitor.isGeneric && visitor.initials ? (
                      <span>{visitor.initials}</span>
                    ) : (
                      <User className="w-4 h-4 text-[#B68A55]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#252525] dark:text-white truncate">
                        {visitor.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 shrink-0 ml-1">
                        {item.startedAt || "Today"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {item.lastMessage || "Started chat session"}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.isLead && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            Lead
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          {visitor.location.split(",")[0]}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#B68A55] font-medium shrink-0">
                        Emperor AI
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Chat Transcript */}
        <div className="flex-1 flex flex-col border-r border-[#EFE7DC] dark:border-neutral-800 min-w-0 bg-white dark:bg-[#0A0A0A]">
          {currentChat ? (
            <>
              {/* Top Chat Header */}
              <div className="p-4 border-b border-[#EFE7DC] dark:border-neutral-800 flex items-center justify-between bg-[#FAF9F6] dark:bg-[#0E0E0E] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#EFE7DC] text-[#B68A55] dark:bg-[#161616] dark:border-neutral-800 dark:text-[#B68A55] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {!currentVisitor.isGeneric && currentVisitor.initials ? (
                      <span>{currentVisitor.initials}</span>
                    ) : (
                      <User className="w-4 h-4 text-[#B68A55]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#252525] dark:text-white truncate">
                      {currentVisitor.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      <span className="truncate">{currentVisitor.location}</span>
                      <span>•</span>
                      <span className="text-[#B68A55] font-medium truncate">
                        Emperor AI Assistant
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMarkResolved}
                    className="px-3.5 py-1.5 rounded-xl border border-[#EFE7DC] bg-white hover:bg-[#FAF9F6] text-[#252525] dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-[#1C1C1C] dark:text-neutral-300 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {currentChat.status === "Resolved" ? "Resolved" : "Mark Resolved"}
                  </button>
                </div>
              </div>

              {/* Messages Flow (Horizontal overflow strictly prevented) */}
              <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden space-y-4 bg-[#FAF9F6]/50 dark:bg-[#070707]">
                <div className="text-center">
                  <span className="text-[10px] bg-white dark:bg-[#141414] border border-[#EFE7DC] dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold px-2.5 py-1 rounded-full shadow-xs">
                    {currentChat.startedAt || "Today (IST)"}
                  </span>
                </div>

                {currentChat.messages?.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex items-start gap-2.5 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-[#B68A55]/10 border border-[#B68A55]/25 text-[#B68A55] flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "p-3.5 rounded-2xl max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-sm break-words [overflow-wrap:anywhere]",
                          isUser
                            ? "bg-[#252525] text-white rounded-tr-xs dark:bg-[#B68A55] dark:text-white"
                            : "bg-white text-[#252525] border border-[#EFE7DC] rounded-tl-xs dark:bg-[#141414] dark:text-neutral-200 dark:border-neutral-800"
                        )}
                      >
                        <FormattedChatMessage text={msg.text || msg.content} isUser={isUser} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form
                onSubmit={handleSendReply}
                className="p-3.5 border-t border-[#EFE7DC] dark:border-neutral-800 bg-white dark:bg-[#0E0E0E] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message to reply in real-time..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="flex-1 text-xs bg-[#FAF9F6] dark:bg-[#141414] px-3.5 py-2.5 rounded-xl border border-[#EFE7DC] dark:border-neutral-800 text-[#252525] dark:text-white placeholder-neutral-500 outline-hidden focus:border-[#B68A55] transition-colors shadow-xs"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-[#252525] hover:bg-black dark:bg-[#B68A55] dark:hover:bg-[#9F7645] text-white shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 dark:text-neutral-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] dark:bg-[#141414] border border-[#EFE7DC] dark:border-neutral-800 flex items-center justify-center text-[#B68A55] shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#252525] dark:text-white">No conversation selected</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                Select a client conversation from the left to view the complete live transcript and inquiry details.
              </p>
            </div>
          )}
        </div>

        {/* COLUMN 3: Client & Conversation Metadata */}
        <div className="w-full lg:w-68 xl:w-76 p-5 bg-[#FAF9F6] dark:bg-[#0A0A0A] space-y-6 overflow-y-auto shrink-0 text-xs">
          {currentChat ? (
            <>
              {/* CLIENT INFO */}
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Client Info
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200">
                    <User className="w-4 h-4 text-[#B68A55] shrink-0" />
                    <span className="font-semibold text-[#252525] dark:text-white truncate">
                      {currentVisitor.name}
                    </span>
                  </div>

                  {currentChat.visitorPhone ? (
                    <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-300">
                      <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="break-all">{currentChat.visitorPhone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-neutral-500">
                      <Phone className="w-4 h-4 text-neutral-600 shrink-0" />
                      <span className="italic">Phone pending</span>
                    </div>
                  )}

                  {currentChat.visitorEmail ? (
                    <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-300">
                      <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="truncate">{currentChat.visitorEmail}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-neutral-500">
                      <Mail className="w-4 h-4 text-neutral-600 shrink-0" />
                      <span className="italic">Email pending</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-300">
                    <MapPin className="w-4 h-4 text-[#B68A55] shrink-0" />
                    <span className="truncate">{currentVisitor.location}</span>
                  </div>
                </div>
              </div>

              {/* CONVERSATION INFO */}
              <div className="space-y-3 pt-4 border-t border-[#EFE7DC] dark:border-neutral-800">
                <h4 className="font-bold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Conversation Info
                </h4>

                <div className="space-y-2 text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Duration:</span>
                    <span className="font-medium text-[#252525] dark:text-white">
                      {currentChat.duration || "1 min"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Messages:</span>
                    <span className="font-medium text-[#252525] dark:text-white">
                      {currentChat.messages?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 dark:text-neutral-400">Bot:</span>
                    <span className="font-semibold text-[#B68A55] bg-[#B68A55]/10 border border-[#B68A55]/20 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      Emperor AI Assistant
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
                    <span className="font-medium text-[#252525] dark:text-white">
                      {currentChat.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* LEAD INFORMATION */}
              <div className="space-y-3 pt-4 border-t border-[#EFE7DC] dark:border-neutral-800">
                <h4 className="font-bold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Lead Information
                </h4>

                <div className="space-y-2 text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 dark:text-neutral-400">Lead Score:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B68A55]/15 text-[#B68A55] border border-[#B68A55]/30">
                      {currentChat.leadScore || "Medium"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
                    <span
                      className={cn(
                        "font-semibold text-[11px] px-2 py-0.5 rounded-md border",
                        currentChat.isLead
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-white border-[#EFE7DC] text-neutral-700 dark:bg-[#141414] dark:text-neutral-300 dark:border-neutral-800"
                      )}
                    >
                      {currentChat.isLead ? "Captured Lead" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-neutral-500 dark:text-neutral-500 text-xs text-center py-12">
              Select a conversation to view client details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
