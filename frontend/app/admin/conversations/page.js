"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MessageSquare, Search, Filter, ExternalLink, Bot, CheckCircle2, X } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { conversationsApi } from "@/lib/api/conversations";

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await conversationsApi.getConversations();
        setConversations(data || []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.visitorName && c.visitorName.toLowerCase().includes(q)) ||
        (c.botName && c.botName.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-[#B68A55]/10 text-[#B68A55] border border-[#B68A55]/20">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Global Platform Conversations
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Live transcripts and compliance across all tenant customer chat sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations by visitor, bot, or message..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#121212] hover:bg-neutral-900 border border-neutral-800 rounded-xl outline-hidden focus:border-[#B68A55] text-white placeholder:text-neutral-500 transition-colors"
          >
          </input>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs font-semibold text-neutral-400">
          Total: <span className="text-white font-bold">{conversations.length}</span>
        </div>
      </div>

      <div className="bg-[#0D0D0D] rounded-2xl border border-neutral-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0A0A0A] text-neutral-400 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4">Visitor / Client</th>
                <th className="p-4">Assisting Bot</th>
                <th className="p-4">Last Message</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Lead Captured</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#B68A55] border-t-transparent rounded-full animate-spin" />
                      <span>Loading conversations...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-500">
                    <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="font-semibold text-neutral-300">No conversations found</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      When visitors chat with your bots, sessions will appear here live.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{c.visitorName || "Website Visitor"}</p>
                      {c.visitorPhone && (
                        <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{c.visitorPhone}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-200 font-medium text-xs border border-neutral-800">
                        <Bot className="w-3.5 h-3.5 text-[#B68A55]" />
                        <span>{c.botName || "aa"}</span>
                      </span>
                    </td>
                    <td className="p-4 text-neutral-300 max-w-sm truncate">
                      {c.lastMessage || "(Active Session)"}
                    </td>
                    <td className="p-4 font-mono text-neutral-400">{c.duration || "1m"}</td>
                    <td className="p-4">
                      {c.isLead ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-[11px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          LEAD
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.status || "Active"} size="sm" />
                    </td>
                    <td className="p-4 text-right text-neutral-400 whitespace-nowrap text-[11px] font-mono">
                      {c.startedAt || "Just now"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
