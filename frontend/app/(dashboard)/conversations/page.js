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
      setConversations(data || []);
      if (data && data.length > 0) {
        setSelectedId((prev) =>
          prev ? (data.some((c) => c.id === prev) ? prev : data[0].id) : data[0].id
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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !currentChat) return;
    const text = replyInput;
    setReplyInput("");
    await conversationsApi.addMessage(currentChat.id, {
      role: "assistant",
      content: text,
    });
    loadConversations();
  };

  const handleMarkResolved = async () => {
    if (!currentChat) return;
    await conversationsApi.markResolved(currentChat.id);
    loadConversations();
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in font-sans text-slate-200">
      {/* Top Header with Real-Time Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Live Conversations & Chat Inbox</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Real-time
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor, inspect, and reply to visitor inquiries in real-time across your deployed chatbots.
          </p>
        </div>
        <RealtimeBadge isLive={isLive} lastSync={lastSync} onRefresh={triggerSync} />
      </div>

      {/* 3-Column Inbox Panel */}
      <div className="bg-[#111827]/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[760px]">
        {/* COLUMN 1: Conversation List */}
        <div className="w-full lg:w-72 xl:w-84 border-r border-slate-800/80 flex flex-col shrink-0 bg-slate-900/40">
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Conversations
                </h2>
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
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
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 text-xs bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {["All", "Active", "Leads", "Resolved"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center",
                    filterTab === tab
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-700/80 bg-slate-800/60 text-xs text-white placeholder-slate-400 outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* List items or Empty state */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center space-y-3.5 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {filterTab === "Leads"
                    ? "No leads captured yet"
                    : filterTab === "Active"
                    ? "No active chats right now"
                    : filterTab === "Resolved"
                    ? "No resolved conversations"
                    : "No conversations yet"}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {filterTab === "Leads"
                    ? "Leads will appear here automatically as soon as visitors share contact details with your bot."
                    : "New visitor sessions will appear here in real-time when users interact with your chatbot."}
                </p>
                <div className="pt-2">
                  <Link
                    href="/bots"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
                  >
                    <span>View Bots</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {filtered.map((item) => {
              const isSelected = item.id === (currentChat?.id || selectedId);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative",
                    isSelected
                      ? "bg-indigo-950/40 border-l-2 border-indigo-500"
                      : "hover:bg-slate-800/40 text-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border",
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                        : "bg-slate-800 border-slate-700/80 text-indigo-400"
                    )}
                  >
                    {item.visitorName?.charAt(0) || "V"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white truncate">
                        {item.visitorName || "Website Visitor"}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {item.startedAt || "Today"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {item.lastMessage || "Started chat session"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {item.isLead && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Lead
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 truncate">
                        {item.botName || "Chatbot"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Chat Transcript */}
        <div className="flex-1 flex flex-col border-r border-slate-800/80 min-w-0 bg-slate-950/30">
          {currentChat ? (
            <>
              {/* Top Chat Header */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentChat.visitorName?.charAt(0) || "V"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {currentChat.visitorName || "Website Visitor"}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{currentChat.visitorLocation || "Direct Session"}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">{currentChat.botName || "Bot Assistant"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkResolved}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {currentChat.status === "Resolved" ? "Resolved" : "Mark Resolved"}
                  </button>
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
                <div className="text-center">
                  <span className="text-[10px] bg-slate-800/80 border border-slate-700/60 text-slate-400 font-semibold px-2.5 py-1 rounded-full">
                    {currentChat.startedAt || "Today"}
                  </span>
                </div>

                {currentChat.messages?.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`flex items-start gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role !== "user" && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center text-xs shrink-0 font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm",
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20"
                          : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-xs"
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.text || msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form
                onSubmit={handleSendReply}
                className="p-3.5 border-t border-slate-800/80 bg-slate-900/70 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message to reply in real-time..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700 text-white placeholder-slate-400 outline-hidden focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No conversation selected</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Select a conversation from the left to view the complete live transcript and visitor details.
              </p>
            </div>
          )}
        </div>

        {/* COLUMN 3: Visitor & Conversation Metadata */}
        <div className="w-full lg:w-68 xl:w-76 p-5 bg-slate-900/60 space-y-6 overflow-y-auto shrink-0 text-xs">
          {currentChat ? (
            <>
              {/* VISITOR INFO */}
              <div className="space-y-3">
                <h4 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                  Visitor Info
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <User className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-white">
                      {currentChat.visitorName || "Website Visitor"}
                    </span>
                  </div>

                  {currentChat.visitorPhone && (
                    <div className="flex items-center gap-2.5 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{currentChat.visitorPhone}</span>
                    </div>
                  )}

                  {currentChat.visitorEmail && (
                    <div className="flex items-center gap-2.5 text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{currentChat.visitorEmail}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{currentChat.visitorLocation || "Direct Session"}</span>
                  </div>
                </div>
              </div>

              {/* CONVERSATION INFO */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                  Conversation Info
                </h4>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-medium text-white">
                      {currentChat.duration || "1 min"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Messages:</span>
                    <span className="font-medium text-white">
                      {currentChat.messages?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bot:</span>
                    <span className="font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                      {currentChat.botName || "Custom Bot"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-medium text-white">
                      {currentChat.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* LEAD INFORMATION */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                  Lead Information
                </h4>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Lead Score:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {currentChat.leadScore || "Medium"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={cn(
                        "font-semibold text-[11px] px-2 py-0.5 rounded-md border",
                        currentChat.isLead
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      )}
                    >
                      {currentChat.isLead ? "Captured Lead" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs text-center py-12">
              Select a conversation to view visitor details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
