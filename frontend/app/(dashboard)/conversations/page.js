"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  X,
  Trash2,
  UserCheck,
  Users,
  Shield,
  ShieldAlert,
  AlertCircle,
  Play,
  Pause,
  UserPlus,
  Lock,
  SlidersHorizontal,
  RefreshCw,
  Power,
  Check,
  ChevronDown,
  Activity,
  CornerDownLeft,
} from "lucide-react";
import { conversationsApi } from "@/lib/api/conversations";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

// Format visitor display name and location (Indian Standard defaults)
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

function ConversationsContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "All";

  const [conversations, setConversations] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    unread: 0,
    unassigned: 0,
    assignedToMe: 0,
    humanActive: 0,
    waitingForHuman: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState(initialView);
  const [search, setSearch] = useState("");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [replyInput, setReplyInput] = useState("");
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [clientTab, setClientTab] = useState("info"); // 'info' | 'notes'
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  // Team & Current User
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAssigningOpen, setIsAssigningOpen] = useState(false);

  // Global Bot Control
  const [botControlData, setBotControlData] = useState(null);
  const [showBotControlModal, setShowBotControlModal] = useState(false);
  const [botFallbackInput, setBotFallbackInput] = useState("");
  const [isUpdatingBotControl, setIsUpdatingBotControl] = useState(false);

  // Modals
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteChatTarget, setDeleteChatTarget] = useState(null);
  const [takeoverActionLoading, setTakeoverActionLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Sync view from URL param if user clicked sidebar sub-items
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) {
      if (viewParam === "assigned_to_me") setFilterTab("Assigned to Me");
      else if (viewParam === "unassigned") setFilterTab("Unassigned");
      else if (viewParam === "resolved") setFilterTab("Resolved");
      else if (viewParam === "human_active") setFilterTab("Human Active");
      else if (viewParam === "waiting") setFilterTab("Waiting for Human");
      else if (viewParam === "team_activity") setFilterTab("Team Activity");
      else if (viewParam === "bot_controls") {
        setFilterTab("All");
        setShowBotControlModal(true);
      }
    }
  }, [searchParams]);

  // Load current auth user and team members
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) {
          setCurrentUser(d.user);
        }
      })
      .catch(() => {});

    conversationsApi.getTeam().then((members) => {
      setTeamMembers(members || []);
    });
  }, []);

  const loadConversations = async () => {
    try {
      const data = await conversationsApi.getConversationsWithCounts();
      const rawList = data.conversations || [];
      const sanitized = rawList.map((c) => {
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
      if (data.counts) {
        setCounts(data.counts);
      }

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

  const { isLive, lastSync, triggerSync } = useRealtimeSync(loadConversations, {
    pollingInterval: 3000,
  });

  // Load notes whenever selected conversation changes
  useEffect(() => {
    if (selectedId) {
      setNotesLoading(true);
      conversationsApi
        .getNotes(selectedId)
        .then((notes) => {
          setInternalNotes(notes || []);
        })
        .finally(() => setNotesLoading(false));

      // Mark conversation as read in real-time
      conversationsApi.markRead(selectedId).then(() => {
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      });
    }
  }, [selectedId]);

  // Load bot control settings when needed
  const loadBotControl = async (targetBotId) => {
    const id = targetBotId || "bot_1791618269632";
    const res = await conversationsApi.getBotControl(id);
    if (res?.bot) {
      setBotControlData(res.bot);
      setBotFallbackInput(res.bot.fallbackMessage || "");
    }
  };

  useEffect(() => {
    if (showBotControlModal) {
      loadBotControl();
    }
  }, [showBotControlModal]);

  // Filter conversations based on selected tab, agent, search
  const filtered = conversations.filter((c) => {
    // Tab filters
    if (filterTab === "Open" && c.status === "RESOLVED") return false;
    if (filterTab === "Unassigned" && (c.assignedToId || c.status === "RESOLVED")) return false;
    if (filterTab === "Assigned to Me") {
      if (!currentUser || c.assignedToId !== currentUser.id || c.status === "RESOLVED") return false;
    }
    if (filterTab === "Human Active" && (c.handlingMode !== "HUMAN" || c.status === "RESOLVED")) return false;
    if (filterTab === "Waiting for Human" && c.status !== "WAITING_FOR_HUMAN") return false;
    if (filterTab === "Resolved" && c.status !== "RESOLVED") return false;
    if (filterTab === "Leads" && !c.isLead) return false;

    // Agent filter dropdown
    if (selectedAgentFilter === "Unassigned" && c.assignedToId) return false;
    if (selectedAgentFilter !== "All" && selectedAgentFilter !== "Unassigned" && c.assignedToId !== selectedAgentFilter) {
      return false;
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = c.visitorName?.toLowerCase().includes(q);
      const msgMatch = c.lastMessage?.toLowerCase().includes(q);
      const emailMatch = c.visitorEmail?.toLowerCase().includes(q);
      const phoneMatch = c.visitorPhone?.toLowerCase().includes(q);
      if (!nameMatch && !msgMatch && !emailMatch && !phoneMatch) return false;
    }
    return true;
  });

  const currentChat =
    conversations.find((c) => c.id === selectedId) || filtered[0] || null;

  const currentVisitor = formatVisitorDisplay(currentChat);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages?.length, selectedId]);

  // Human Takeover Action
  const handleTakeover = async () => {
    if (!currentChat) return;
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.takeover(currentChat.id);
      if (res?.success) {
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      } else {
        alert(res?.error || "Failed to take over conversation.");
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  // Resume AI Action
  const handleResumeBot = async () => {
    if (!currentChat) return;
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.resume(currentChat.id);
      if (res?.success) {
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      } else {
        alert(res?.error || "Failed to resume AI.");
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  // Assign Conversation Action
  const handleAssignTo = async (targetUser) => {
    if (!currentChat) return;
    setIsAssigningOpen(false);
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.assign(currentChat.id, {
        targetUserId: targetUser.id,
        targetUserName: targetUser.name || targetUser.email,
      });
      if (res?.success) {
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      } else {
        alert(res?.error || "Failed to assign conversation.");
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  // Release Conversation Action
  const handleRelease = async () => {
    if (!currentChat) return;
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.release(currentChat.id);
      if (res?.success) {
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  // Send Human Reply (Auto-takeover if currently AI)
  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyInput.trim() || !currentChat) return;
    const text = replyInput;
    setReplyInput("");
    await conversationsApi.addMessage(currentChat.id, {
      role: "agent",
      senderType: "human",
      content: text,
    });
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  // Keydown handler: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Resolve Conversation
  const handleToggleResolve = async () => {
    if (!currentChat) return;
    if (currentChat.status === "RESOLVED") {
      await conversationsApi.reopen(currentChat.id);
    } else {
      await conversationsApi.resolve(currentChat.id);
    }
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e?.preventDefault();
    if (!newNoteInput.trim() || !currentChat) return;
    const text = newNoteInput;
    setNewNoteInput("");
    const res = await conversationsApi.addNote(currentChat.id, text);
    if (res?.success && res?.note) {
      setInternalNotes((prev) => [res.note, ...prev]);
    }
  };

  // Toggle Global Bot ON/OFF
  const handleToggleGlobalBot = async () => {
    if (!botControlData) return;
    setIsUpdatingBotControl(true);
    try {
      const newEnabled = !botControlData.globalBotEnabled;
      const res = await conversationsApi.updateBotControl(botControlData.id, {
        globalBotEnabled: newEnabled,
        fallbackMessage: botFallbackInput,
      });
      if (res?.success) {
        setBotControlData((prev) => ({
          ...prev,
          globalBotEnabled: newEnabled,
          fallbackMessage: botFallbackInput,
        }));
        setShowBotControlModal(false);
      } else {
        alert(res?.error || "Failed to update global bot status.");
      }
    } finally {
      setIsUpdatingBotControl(false);
    }
  };

  const handleClearAllConversations = async () => {
    await conversationsApi.clearAll();
    setSelectedId(null);
    setShowClearModal(false);
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  const handleDeleteSingleConversation = async () => {
    if (!deleteChatTarget) return;
    await conversationsApi.deleteConversation(deleteChatTarget.id);
    if (selectedId === deleteChatTarget.id) {
      setSelectedId(null);
    }
    setDeleteChatTarget(null);
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  const isHumanActive = currentChat?.handlingMode === "HUMAN" || currentChat?.status === "HUMAN_ACTIVE";
  const isWaitingForHuman = currentChat?.status === "WAITING_FOR_HUMAN";
  const isResolved = currentChat?.status === "RESOLVED";

  return (
    <div className="space-y-4 pb-12 animate-fade-in font-sans text-neutral-200">
      <style>{`
        *::-webkit-scrollbar, ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      `}</style>

      {/* Top Header with Real-Time Badge & Bot Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Live Inbox & Human Takeover</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Synced
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Monitor incoming website conversations, manually take over from AI, and respond in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Global Bot ON / OFF Button (Admin) */}
          <button
            type="button"
            onClick={() => setShowBotControlModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Website Global Bot Controls"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span>Bot Controls</span>
          </button>

          <RealtimeBadge isLive={isLive} lastSync={lastSync} onRefresh={triggerSync} />
        </div>
      </div>

      {/* Primary Tab Navigation & Filter Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-[#0D0D12] p-1.5 rounded-2xl border border-neutral-800 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "All", label: "All", count: counts.all },
            { id: "Open", label: "Open", count: counts.all - counts.resolved },
            { id: "Unassigned", label: "Unassigned", count: counts.unassigned, alert: counts.unassigned > 0 },
            { id: "Assigned to Me", label: "Assigned to Me", count: counts.assignedToMe },
            { id: "Human Active", label: "Human Active", count: counts.humanActive, highlight: true },
            { id: "Waiting for Human", label: "Waiting for Agent", count: counts.waitingForHuman, warn: counts.waitingForHuman > 0 },
            { id: "Resolved", label: "Resolved", count: counts.resolved },
            { id: "Team Activity", label: "Team Activity" },
          ].map((tab) => {
            const isTabActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                  isTabActive
                    ? "bg-purple-600 text-white font-semibold shadow-xs"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      isTabActive
                        ? "bg-white/20 text-white"
                        : tab.warn
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : tab.alert
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : tab.highlight
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-neutral-800 text-neutral-300"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Clear All action (Admin) */}
        {conversations.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 ml-auto"
          >
            Clear History
          </button>
        )}
      </div>

      {/* TEAM ACTIVITY VIEW (if selected) */}
      {filterTab === "Team Activity" ? (
        <div className="bg-[#0B0B10] rounded-2xl border border-neutral-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Team Members & Real-Time Assignment Load</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Monitor team activity, authorized Sub-Admins, and active conversation load.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                      {(member.name || member.email)[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate">
                        {member.name || member.email.split("@")[0]}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {member.role || "Agent"}
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <span>Assigned Conversations:</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded-md bg-neutral-800">
                    {member.activeConversations || 0} active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 3-COLUMN LIVE INBOX PANEL */
        <div className="bg-[#0B0B10] rounded-2xl border border-neutral-800 shadow-xl overflow-hidden flex flex-col lg:flex-row h-[760px]">
          {/* COLUMN 1: Conversation List */}
          <div
            className={cn(
              "w-full lg:w-80 xl:w-92 border-r border-neutral-800 flex flex-col shrink-0 bg-[#09090E]",
              selectedId && "hidden lg:flex"
            )}
          >
            {/* Search and Secondary Filter */}
            <div className="p-3.5 border-b border-neutral-800 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search visitor, phone, message..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900/90 text-xs text-white placeholder-neutral-500 outline-hidden focus:border-purple-500 transition-colors shadow-inner"
                />
              </div>

              {/* Agent Filter Dropdown */}
              {teamMembers.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <UserCheck className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded-lg px-2 py-1 text-neutral-300 outline-hidden focus:border-purple-500"
                  >
                    <option value="All">All Assigned Agents</option>
                    <option value="Unassigned">Unassigned Only</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Conversation Items List */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar divide-y divide-neutral-800/60"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {!loading && filtered.length === 0 && (
                <div className="p-8 text-center space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No conversations found</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                    {filterTab === "Human Active"
                      ? "No conversations are currently taken over by a human agent."
                      : filterTab === "Waiting for Human"
                      ? "No visitors are currently waiting for human intervention."
                      : "Incoming chat sessions from your website widget will appear here in real-time."}
                  </p>
                </div>
              )}

              {filtered.map((item) => {
                const isSelected = item.id === (currentChat?.id || selectedId);
                const visitor = formatVisitorDisplay(item);
                const convHumanActive = item.handlingMode === "HUMAN" || item.status === "HUMAN_ACTIVE";
                const convWaiting = item.status === "WAITING_FOR_HUMAN";
                const convResolved = item.status === "RESOLVED";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative",
                      isSelected
                        ? "bg-purple-950/20 border-l-4 border-purple-500 shadow-sm"
                        : "hover:bg-neutral-900/40 text-neutral-300"
                    )}
                  >
                    {/* Visitor Initials Avatar */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all",
                        convHumanActive
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                          : convWaiting
                          ? "bg-amber-950/40 border-amber-500/40 text-amber-400"
                          : isSelected
                          ? "bg-purple-600 border-purple-500 text-white shadow-md"
                          : "bg-neutral-900 border-neutral-800 text-neutral-300"
                      )}
                    >
                      {!visitor.isGeneric && visitor.initials ? (
                        <span>{visitor.initials}</span>
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white truncate">
                          {visitor.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                          {item.startedAt || "Today"}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 truncate">
                        {item.lastMessage || "Started chat session"}
                      </p>

                      <div className="flex items-center justify-between mt-2 gap-1.5 flex-wrap">
                        {/* Handling Mode & Status Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {convHumanActive ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Human Active
                            </span>
                          ) : convWaiting ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Waiting
                            </span>
                          ) : convResolved ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                              Resolved
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                              <Bot className="w-2.5 h-2.5" />
                              AI Handling
                            </span>
                          )}

                          {item.assignedToName ? (
                            <span className="text-[10px] text-neutral-400 truncate max-w-[90px]">
                              👤 {item.assignedToName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic">Unassigned</span>
                          )}
                        </div>

                        {/* Unread Counter Badge */}
                        {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-600 text-white shadow-xs">
                            +{item.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: Live Chat Window */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0 bg-[#07070B]",
              !selectedId && "hidden lg:flex",
              showClientDetails && "border-r border-neutral-800"
            )}
          >
            {currentChat ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3 sm:p-4 border-b border-neutral-800 flex items-center justify-between bg-[#0E0E14] shrink-0 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="lg:hidden p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer shrink-0"
                      title="Back to list"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-purple-400 font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                      {!currentVisitor.isGeneric && currentVisitor.initials ? (
                        <span>{currentVisitor.initials}</span>
                      ) : (
                        <User className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white truncate">
                          {currentVisitor.name}
                        </h3>
                        {currentChat.isLead && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Lead
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                        <span className="truncate">{currentVisitor.location}</span>
                        <span>•</span>
                        <span className="text-purple-400 font-medium truncate">
                          {currentChat.assignedToName ? `Assigned to ${currentChat.assignedToName}` : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle Client Details Panel */}
                    <button
                      type="button"
                      onClick={() => setShowClientDetails((prev) => !prev)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95",
                        showClientDetails
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                      )}
                      title={showClientDetails ? "Close Details Panel" : "View Client Info & Notes"}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{showClientDetails ? "Close Info" : "Client Info"}</span>
                    </button>

                    {/* Mark Resolved / Reopen */}
                    <button
                      type="button"
                      onClick={handleToggleResolve}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95",
                        isResolved
                          ? "bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white"
                          : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                      )}
                    >
                      {isResolved ? "Reopen Chat" : "Mark Resolved"}
                    </button>

                    {/* Delete chat */}
                    <button
                      type="button"
                      onClick={() => setDeleteChatTarget(currentChat)}
                      className="p-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 text-neutral-400 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* PHASE 5: HANDLING STATE BANNER (AI Active vs Human Active) */}
                <div
                  className={cn(
                    "px-4 py-2.5 border-b text-xs flex items-center justify-between gap-3 flex-wrap transition-colors",
                    isHumanActive
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                      : isWaitingForHuman
                      ? "bg-amber-950/30 border-amber-500/30 text-amber-200"
                      : "bg-purple-950/20 border-purple-500/20 text-purple-200"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isHumanActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="font-semibold text-emerald-300">
                          Human Takeover Active:
                        </span>
                        <span className="text-neutral-300 truncate">
                          AI assistant is paused. You are now replying manually.
                        </span>
                      </>
                    ) : isWaitingForHuman ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-semibold text-amber-300">
                          Waiting for Agent:
                        </span>
                        <span className="text-neutral-300 truncate">
                          Visitor requested a human agent or bot is disabled.
                        </span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="font-semibold text-purple-300">
                          AI is handling this conversation.
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions for Current State */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isHumanActive ? (
                      <>
                        {/* Resume Bot Button */}
                        <button
                          type="button"
                          disabled={takeoverActionLoading}
                          onClick={handleResumeBot}
                          className="px-3 py-1 rounded-lg bg-neutral-900 border border-purple-500/40 text-purple-300 hover:bg-purple-950/40 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>Resume Bot</span>
                        </button>

                        {/* Assign Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsAssigningOpen((prev) => !prev)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Assign</span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                          </button>

                          {isAssigningOpen && (
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-1 text-xs">
                              <div className="px-2.5 py-1 font-bold text-[10px] text-neutral-400 uppercase tracking-wider">
                                Assign to Member
                              </div>
                              {teamMembers.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleAssignTo(m)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-between"
                                >
                                  <span className="truncate">{m.name || m.email}</span>
                                  {currentChat.assignedToId === m.id && (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                </button>
                              ))}
                              <div className="border-t border-neutral-800 my-1"></div>
                              <button
                                type="button"
                                onClick={handleRelease}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-rose-400 font-semibold"
                              >
                                Release / Unassign
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Take Over Button */
                      <button
                        type="button"
                        disabled={takeoverActionLoading}
                        onClick={handleTakeover}
                        className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Take Over</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Transcript Scroll Area */}
                <div
                  className="flex-1 p-5 overflow-y-auto overflow-x-hidden no-scrollbar space-y-4 bg-[#050508]"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="text-center">
                    <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 font-semibold px-2.5 py-1 rounded-full shadow-xs">
                      Session started {currentChat.startedAt || "Today (IST)"}
                    </span>
                  </div>

                  {currentChat.messages?.map((msg, i) => {
                    const isUser = msg.role === "user";
                    const isAgent = msg.role === "agent" || msg.senderType === "human";
                    const isSystem = msg.role === "system" || msg.senderType === "system";

                    // System messages (Takeover events, assignments, status changes)
                    if (isSystem) {
                      return (
                        <div key={msg.id || i} className="flex justify-center my-2">
                          <div className="px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            <span>{msg.content || msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    // Human Agent reply message
                    if (isAgent) {
                      return (
                        <div key={msg.id || i} className="flex items-start gap-2.5 justify-end">
                          <div className="p-3.5 rounded-2xl rounded-tr-xs max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-sm bg-gradient-to-br from-purple-900/90 to-indigo-900/90 border border-purple-500/40 text-white break-words [overflow-wrap:anywhere]">
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-purple-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{msg.senderName || currentChat.assignedToName || "Support Agent"} (Human)</span>
                            </div>
                            <FormattedChatMessage text={msg.content || msg.text} isUser={false} />
                          </div>
                        </div>
                      );
                    }

                    // Visitor message (User)
                    if (isUser) {
                      return (
                        <div key={msg.id || i} className="flex items-start gap-2.5 justify-start">
                          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="p-3.5 rounded-2xl rounded-tl-xs max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-sm bg-neutral-900 text-white border border-neutral-800 break-words [overflow-wrap:anywhere]">
                            <div className="text-[10.5px] font-semibold text-neutral-400 mb-1">
                              {currentVisitor.name}
                            </div>
                            <FormattedChatMessage text={msg.content || msg.text} isUser={true} />
                          </div>
                        </div>
                      );
                    }

                    // AI Assistant message
                    return (
                      <div key={msg.id || i} className="flex items-start gap-2.5 justify-end">
                        <div className="p-3.5 rounded-2xl rounded-tr-xs max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-sm bg-[#13131A] text-neutral-200 border border-neutral-800 break-words [overflow-wrap:anywhere]">
                          <div className="flex items-center gap-1.5 mb-1 text-[10.5px] font-semibold text-[#B68A55]">
                            <Bot className="w-3.5 h-3.5" />
                            <span>Emperor AI Assistant</span>
                          </div>
                          <FormattedChatMessage text={msg.content || msg.text} isUser={false} />
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Composer Box */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3.5 border-t border-neutral-800 bg-[#0A0A0F] space-y-1.5"
                >
                  <div className="flex items-end gap-2 bg-neutral-900/90 border border-neutral-800 rounded-xl p-1.5 focus-within:border-purple-500 transition-colors shadow-inner">
                    <textarea
                      rows={1}
                      placeholder={
                        isHumanActive
                          ? "Reply in real-time as agent (Enter to send, Shift+Enter for new line)..."
                          : "Type a reply to automatically take over this conversation from AI..."
                      }
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-xs bg-transparent px-2.5 py-1.5 text-white placeholder-neutral-500 outline-hidden resize-none max-h-32"
                    />
                    <button
                      type="submit"
                      disabled={!replyInput.trim()}
                      className="p-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      title="Send Reply"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1">
                    <span>
                      {isHumanActive ? (
                        <span className="text-emerald-400 font-medium">● AI paused: manual agent mode active</span>
                      ) : (
                        <span>Sending message will immediately hand off conversation to you</span>
                      )}
                    </span>
                    <span>Press Enter ↵ to send</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-purple-400 shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No conversation selected</h4>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Select an active customer conversation on the left to monitor, inspect inquiry data, or take over in real time.
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 3: Customer Information & Internal Notes */}
          {showClientDetails && (
            <div
              className="fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-auto w-full lg:w-76 xl:w-84 p-4 bg-[#09090E] border-l border-neutral-800 flex flex-col shrink-0 text-xs animate-in fade-in slide-in-from-right-4 duration-200"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setClientTab("info")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                      clientTab === "info"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Customer Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientTab("notes")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1",
                      clientTab === "notes"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Internal Notes ({internalNotes.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClientDetails(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Tab 1: Customer Information */}
              {clientTab === "info" && currentChat && (
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pt-3">
                  {/* Identity */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider">
                      Identity & Contact
                    </h4>
                    <div className="space-y-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <User className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate">{currentVisitor.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{currentChat.visitorPhone || "Phone pending"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{currentChat.visitorEmail || "Email pending"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{currentVisitor.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Handling & Assignment Status */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider">
                      Handling & Assignment
                    </h4>
                    <div className="space-y-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Current Mode:</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            isHumanActive
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                          )}
                        >
                          {isHumanActive ? "Human Takeover" : "AI Active"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Assigned Agent:</span>
                        <span className="font-medium text-white truncate max-w-[120px]">
                          {currentChat.assignedToName || "Unassigned"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Chatbot:</span>
                        <span className="text-purple-400 font-semibold truncate max-w-[120px]">
                          {currentChat.botName || "Emperor Assistant"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Messages:</span>
                        <span className="font-medium text-white">{currentChat.messages?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Qualification Data */}
                  {currentChat.qualification && (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider">
                        Inquiry Qualification
                      </h4>
                      <div className="space-y-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 text-neutral-300">
                        {Object.entries(currentChat.qualification.answers || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <span className="text-neutral-400 capitalize">{key}:</span>
                            <span className="font-medium text-white text-right break-words">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Internal Notes (Private to team) */}
              {clientTab === "notes" && currentChat && (
                <div className="flex-1 flex flex-col pt-3 min-h-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-[11px] text-purple-300 leading-relaxed flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Private team notes are visible only to authorized workspace members. They are <strong>never</strong> shown to website visitors.
                    </span>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Add an internal note about this client or deal..."
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-500 outline-hidden focus:border-purple-500 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteInput.trim()}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      Add Private Note
                    </button>
                  </form>

                  {/* Notes Feed */}
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1">
                    {internalNotes.length === 0 ? (
                      <div className="text-center py-6 text-neutral-400 text-xs">
                        No internal notes yet for this client.
                      </div>
                    ) : (
                      internalNotes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px] text-neutral-400">
                            <span className="font-bold text-purple-300">{n.authorName || "Team Member"}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-xs text-neutral-200 leading-relaxed break-words whitespace-pre-wrap">
                            {n.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PHASE 6: GLOBAL WEBSITE BOT CONTROL MODAL */}
      {showBotControlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#0D0D14] border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Global Website Bot Control</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBotControlModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300">
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Website AI Autonomous Replies</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {botControlData?.globalBotEnabled
                      ? "Bot is currently ON: Automatically answering customer queries."
                      : "Bot is currently OFF: All new customer queries route to live agents."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleGlobalBot}
                  disabled={isUpdatingBotControl}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5",
                    botControlData?.globalBotEnabled
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-600 hover:bg-rose-500 text-white"
                  )}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{botControlData?.globalBotEnabled ? "Bot ON" : "Bot OFF"}</span>
                </button>
              </div>

              {/* Custom Fallback Message when Bot is OFF */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300 text-xs">
                  Visitor Fallback Notice (when bot is paused):
                </label>
                <textarea
                  rows={3}
                  value={botFallbackInput}
                  onChange={(e) => setBotFallbackInput(e.target.value)}
                  placeholder="Our automated assistant is temporarily paused. A team member will assist you shortly."
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-500 outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowBotControlModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAllConversations}
        title="Clear All Conversations?"
        description="Are you sure you want to clear all conversations? All message history, client leads, and visitor transcripts across your chatbot will be permanently erased."
        confirmText="Clear All Conversations"
        cancelText="Cancel"
        loadingText="Clearing Conversations..."
        variant="danger"
        badgeText="Permanent Action"
        count={conversations.length}
      />

      <ConfirmModal
        isOpen={Boolean(deleteChatTarget)}
        onClose={() => setDeleteChatTarget(null)}
        onConfirm={handleDeleteSingleConversation}
        title="Delete Conversation?"
        description={`Are you sure you want to permanently delete the conversation with ${deleteChatTarget ? formatVisitorDisplay(deleteChatTarget).name : "this client"}? All chat history in this thread will be permanently removed.`}
        confirmText="Delete Conversation"
        cancelText="Cancel"
        loadingText="Deleting..."
        variant="danger"
        badgeText="Irreversible"
      />
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] text-neutral-400 text-xs">
          Loading Live Inbox...
        </div>
      }
    >
      <ConversationsContent />
    </React.Suspense>
  );
}
