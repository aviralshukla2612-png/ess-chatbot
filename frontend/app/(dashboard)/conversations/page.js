"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  User,
  Bot,
  ArrowRight,
  Inbox,
  X,
  Trash2,
  UserCheck,
  Users,
  AlertCircle,
  Lock,
  SlidersHorizontal,
  Power,
  Check,
  ChevronDown,
} from "lucide-react";
import { conversationsApi } from "@/lib/api/conversations";
import { botsApi } from "@/lib/api/bots";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import RealtimeBadge from "@/components/ui/RealtimeBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

function formatVisitorDisplay(item) {
  if (!item) {
    return {
      name: "Website Visitor",
      initials: "",
      isGeneric: true,
      location: "Web Session",
    };
  }

  const rawName = (item.visitorName || "").trim();
  const email = (item.visitorEmail || "").trim();
  const phone = (item.visitorPhone || "").trim();
  let loc = (item.visitorLocation || "").trim();

  if (!loc || loc === "Direct Session" || loc.toLowerCase() === "unknown") {
    loc = "Web Session";
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
    const city = loc !== "Web Session" ? loc.split(",")[0].trim() : "";
    const shortId = item.id ? item.id.replace(/[^0-9]/g, "").slice(-4) : "";
    name = shortId
      ? city
        ? `Visitor #${shortId} · ${city}`
        : `Visitor #${shortId}`
      : "Website Inquiry";
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

function FormattedChatMessage({ text, tone = "surface" }) {
  if (!text) return null;

  const lines = String(text).split("\n");
  const isInverse = tone === "inverse";
  const linkClass = isInverse
    ? "text-indigo-100 hover:text-white underline underline-offset-2 break-all font-medium transition-colors"
    : "text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 break-all font-medium transition-colors";
  const boldClass = isInverse
    ? "font-semibold text-white"
    : "font-semibold text-[var(--text-primary)]";
  const bulletClass = isInverse
    ? "text-indigo-200"
    : "text-indigo-600 dark:text-indigo-400";

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
        parts.push(
          <strong key={`${lineKey}-${key++}`} className={boldClass}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("http://") || token.startsWith("https://")) {
        parts.push(
          <a
            key={`${lineKey}-${key++}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {token}
          </a>
        );
      } else if (token.includes("@") && !token.startsWith("http")) {
        parts.push(
          <a key={`${lineKey}-${key++}`} href={`mailto:${token}`} className={linkClass}>
            {token}
          </a>
        );
      } else if (token.startsWith("+") || token.replace(/\D/g, "").length >= 10) {
        parts.push(
          <a
            key={`${lineKey}-${key++}`}
            href={`tel:${token.replace(/\s+/g, "")}`}
            className={linkClass}
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
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 my-1">
              <span className={cn("font-bold text-xs shrink-0 select-none leading-relaxed", bulletClass)}>
                •
              </span>
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
  const { toast } = useToast();
  const initialView = searchParams.get("view") || "All";

  const [conversations, setConversations] = useState([]);
  const [workspaceBots, setWorkspaceBots] = useState([]);
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
  const [clientTab, setClientTab] = useState("info");
  const [internalNotes, setInternalNotes] = useState([]);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAssigningOpen, setIsAssigningOpen] = useState(false);

  const [botControlData, setBotControlData] = useState(null);
  const [showBotControlModal, setShowBotControlModal] = useState(false);
  const [botFallbackInput, setBotFallbackInput] = useState("");
  const [isUpdatingBotControl, setIsUpdatingBotControl] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteChatTarget, setDeleteChatTarget] = useState(null);
  const [takeoverActionLoading, setTakeoverActionLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    conversationsApi.getTeam().then((members) => {
      setTeamMembers(members || []);
    });

    botsApi
      .getBots()
      .then((list) => setWorkspaceBots(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const defaultBot = workspaceBots[0] || null;

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
          botName: c.botName || defaultBot?.name || "AI Assistant",
          botId: c.botId || defaultBot?.id || "",
        };
      });
      setConversations(sanitized);
      if (data.counts) setCounts(data.counts);

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
    pollingInterval: 4000,
  });

  useEffect(() => {
    if (selectedId) {
      setNotesLoading(true);
      conversationsApi
        .getNotes(selectedId)
        .then((notes) => setInternalNotes(notes || []))
        .finally(() => setNotesLoading(false));

      conversationsApi.markRead(selectedId).then(() => {
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      });
    }
  }, [selectedId]);

  const currentChat =
    conversations.find((c) => c.id === selectedId) || null;

  const loadBotControl = async (targetBotId) => {
    const id = targetBotId || currentChat?.botId || defaultBot?.id;
    if (!id) return;
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
  }, [showBotControlModal, defaultBot?.id]);

  const filtered = conversations.filter((c) => {
    if (filterTab === "Open" && c.status === "RESOLVED") return false;
    if (filterTab === "Unassigned" && (c.assignedToId || c.status === "RESOLVED")) return false;
    if (filterTab === "Assigned to Me") {
      if (!currentUser || c.assignedToId !== currentUser.id || c.status === "RESOLVED") return false;
    }
    if (filterTab === "Human Active" && (c.handlingMode !== "HUMAN" || c.status === "RESOLVED")) return false;
    if (filterTab === "Waiting for Human" && c.status !== "WAITING_FOR_HUMAN") return false;
    if (filterTab === "Resolved" && c.status !== "RESOLVED") return false;
    if (filterTab === "Leads" && !c.isLead) return false;

    if (selectedAgentFilter === "Unassigned" && c.assignedToId) return false;
    if (
      selectedAgentFilter !== "All" &&
      selectedAgentFilter !== "Unassigned" &&
      c.assignedToId !== selectedAgentFilter
    ) {
      return false;
    }

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

  const activeChat = currentChat || filtered[0] || null;
  const currentVisitor = formatVisitorDisplay(activeChat);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages?.length, selectedId]);

  const handleTakeover = async () => {
    if (!activeChat) return;
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.takeover(activeChat.id);
      if (res?.success) {
        toast({ title: "Human takeover active", message: "AI replies are paused for this thread.", variant: "success" });
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      } else {
        toast({ title: "Takeover failed", message: res?.error || "Unable to take over conversation.", variant: "error" });
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  const handleResumeBot = async () => {
    if (!activeChat) return;
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.resume(activeChat.id);
      if (res?.success) {
        toast({ title: "AI assistant resumed", message: "Bot will handle subsequent visitor messages.", variant: "info" });
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      } else {
        toast({ title: "Resume failed", message: res?.error || "Unable to resume AI.", variant: "error" });
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  const handleAssignTo = async (targetUser) => {
    if (!activeChat) return;
    setIsAssigningOpen(false);
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.assign(activeChat.id, {
        targetUserId: targetUser.id,
        targetUserName: targetUser.name || targetUser.email,
      });
      if (res?.success) {
        toast({ title: "Conversation assigned", message: `Assigned to ${targetUser.name || targetUser.email}.`, variant: "success" });
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      } else {
        toast({ title: "Assignment failed", message: res?.error || "Unable to assign conversation.", variant: "error" });
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!activeChat) return;
    setIsAssigningOpen(false);
    setTakeoverActionLoading(true);
    try {
      const res = await conversationsApi.release(activeChat.id);
      if (res?.success) {
        await loadConversations();
        window.dispatchEvent(new CustomEvent("conversation-updated"));
      }
    } finally {
      setTakeoverActionLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyInput.trim() || !activeChat) return;
    const text = replyInput;
    setReplyInput("");

    const optimisticMsg = {
      id: `m_opt_${Date.now()}`,
      role: "agent",
      senderType: "human",
      senderName: currentUser?.name || "Agent",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              handlingMode: "HUMAN",
              status: "HUMAN_ACTIVE",
              assignedToName: c.assignedToName || currentUser?.name || "Support Agent",
              lastMessage: text,
              messages: [...(c.messages || []), optimisticMsg],
            }
          : c
      )
    );
    setTimeout(scrollToBottom, 50);

    try {
      await conversationsApi.addMessage(activeChat.id, {
        role: "agent",
        senderType: "human",
        content: text,
      });
    } catch {
      toast({ title: "Failed to send message", message: "Please check your connection and try again.", variant: "error" });
    }
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleToggleResolve = async () => {
    if (!activeChat) return;
    if (activeChat.status === "RESOLVED") {
      await conversationsApi.reopen(activeChat.id);
    } else {
      await conversationsApi.resolve(activeChat.id);
    }
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  const handleAddNote = async (e) => {
    e?.preventDefault();
    if (!newNoteInput.trim() || !activeChat) return;
    const text = newNoteInput;
    setNewNoteInput("");
    const res = await conversationsApi.addNote(activeChat.id, text);
    if (res?.success && res?.note) {
      setInternalNotes((prev) => [res.note, ...prev]);
      toast({ title: "Internal note saved", variant: "success" });
    }
  };

  const handleToggleGlobalBot = async () => {
    if (!botControlData) {
      toast({ title: "No chatbot found", message: "Create a chatbot first to configure autonomous replies.", variant: "warning" });
      return;
    }
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
        toast({
          title: newEnabled ? "Autonomous AI enabled" : "Autonomous AI paused",
          message: newEnabled
            ? "Your website chatbot is actively answering incoming queries."
            : "New incoming sessions will route to human agents.",
          variant: "success",
        });
        setShowBotControlModal(false);
      } else {
        toast({ title: "Update failed", message: res?.error || "Failed to update bot status.", variant: "error" });
      }
    } finally {
      setIsUpdatingBotControl(false);
    }
  };

  const handleClearAllConversations = async () => {
    await conversationsApi.clearAll();
    setSelectedId(null);
    setShowClearModal(false);
    toast({ title: "Inbox cleared", message: "Workspace conversation history has been cleared.", variant: "info" });
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  const handleDeleteSingleConversation = async () => {
    if (!deleteChatTarget) return;
    await conversationsApi.deleteConversation(deleteChatTarget.id);
    if (selectedId === deleteChatTarget.id) setSelectedId(null);
    setDeleteChatTarget(null);
    toast({ title: "Conversation deleted", variant: "info" });
    await loadConversations();
    window.dispatchEvent(new CustomEvent("conversation-updated"));
  };

  const isHumanActive =
    activeChat?.handlingMode === "HUMAN" || activeChat?.status === "HUMAN_ACTIVE";
  const isWaitingForHuman = activeChat?.status === "WAITING_FOR_HUMAN";
  const isResolved = activeChat?.status === "RESOLVED";

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      <PageHeader
        badge="Live Workspace Inbox"
        title="Conversations & Human Takeover"
        description="Monitor incoming website sessions, seamlessly hand off between AI and human agents, and collaborate with private notes."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => setShowBotControlModal(true)}
            >
              Bot Controls
            </Button>
            <RealtimeBadge isLive={isLive} lastSynced={lastSync} onRefresh={triggerSync} />
          </div>
        }
      />

      {/* Primary Tab Navigation & Filter Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-[var(--bg-surface)] p-1.5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] text-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: "All", label: "All", count: counts.all },
            { id: "Open", label: "Open", count: Math.max(0, counts.all - counts.resolved) },
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
                onClick={() => {
                  setFilterTab(tab.id);
                  setSelectedAgentFilter("All");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                  isTabActive
                    ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
                      isTabActive
                        ? "bg-white/20 text-white"
                        : tab.warn
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : tab.alert
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : tab.highlight
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {conversations.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto"
          >
            Clear History
          </button>
        )}
      </div>

      {/* TEAM ACTIVITY VIEW */}
      {filterTab === "Team Activity" ? (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Team Members & Assignment Load</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Monitor workspace collaborators and active conversation assignments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {(member.name || member.email || "U")[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {member.name || member.email?.split("@")[0]}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    {member.role || "Agent"}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Assigned Conversations</span>
                  <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] tabular-nums">
                    {member.activeConversationsCount ?? member.activeConversations ?? 0} active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 3-COLUMN LIVE INBOX PANEL */
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-235px)] min-h-[620px] max-h-[820px]">
          {/* COLUMN 1: Conversation List */}
          <div
            className={cn(
              "w-full lg:w-80 xl:w-92 border-r border-[var(--border-subtle)] flex flex-col shrink-0 bg-[var(--bg-surface)]",
              selectedId && "hidden lg:flex"
            )}
          >
            <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search visitor, phone, message..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 focus:bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
              </div>

              {teamMembers.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    aria-label="Filter by assigned agent"
                    className="flex-1 bg-[var(--bg-subtle)]/50 text-xs border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-[var(--text-secondary)] outline-hidden focus:border-indigo-500"
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
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {loading && (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="p-8 text-center space-y-3 my-auto">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {filterTab === "Assigned to Me"
                      ? "No conversations assigned to you"
                      : filterTab === "Unassigned"
                      ? "No unassigned conversations"
                      : filterTab === "Human Active"
                      ? "No active human takeovers"
                      : filterTab === "Waiting for Human"
                      ? "No visitors waiting for an agent"
                      : filterTab === "Resolved"
                      ? "No resolved conversations"
                      : "No conversations yet"}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                    {filterTab === "Assigned to Me"
                      ? "Threads you take over or are assigned to will appear here."
                      : "Incoming chat sessions from your deployed widgets will stream here automatically."}
                  </p>
                  {(filterTab !== "All" || selectedAgentFilter !== "All" || search) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFilterTab("All");
                        setSelectedAgentFilter("All");
                        setSearch("");
                      }}
                    >
                      View All ({conversations.length})
                    </Button>
                  )}
                </div>
              )}

              {filtered.map((item) => {
                const isSelected = item.id === (activeChat?.id || selectedId);
                const visitor = formatVisitorDisplay(item);
                const convHumanActive =
                  item.handlingMode === "HUMAN" || item.status === "HUMAN_ACTIVE";
                const convWaiting = item.status === "WAITING_FOR_HUMAN";
                const convResolved = item.status === "RESOLVED";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full text-left p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative",
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-500/10 border-l-[3px] border-indigo-600 dark:border-indigo-400"
                        : "hover:bg-[var(--bg-subtle)]/60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-all",
                        convHumanActive
                          ? "bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                          : convWaiting
                          ? "bg-amber-500/12 border-amber-500/30 text-amber-700 dark:text-amber-400"
                          : isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      )}
                    >
                      {!visitor.isGeneric && visitor.initials ? (
                        <span>{visitor.initials}</span>
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {visitor.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-1 tabular-nums">
                          {item.startedAt || "Today"}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {item.lastMessage || "Started chat session"}
                      </p>

                      <div className="flex items-center justify-between mt-2 gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {convHumanActive ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Human Active
                            </span>
                          ) : convWaiting ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Waiting
                            </span>
                          ) : convResolved ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                              Resolved
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                              <Bot className="w-2.5 h-2.5" />
                              AI Handling
                            </span>
                          )}

                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[95px]">
                            {item.assignedToName || "Unassigned"}
                          </span>
                        </div>

                        {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-600 text-white tabular-nums">
                            +{item.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: Live Chat Window */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0 bg-[var(--bg-canvas)]",
              !selectedId && "hidden lg:flex",
              showClientDetails && "border-r border-[var(--border-subtle)]"
            )}
          >
            {activeChat ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3 sm:p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="lg:hidden p-1.5 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-subtle)] cursor-pointer shrink-0"
                      aria-label="Back to conversation list"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {!currentVisitor.isGeneric && currentVisitor.initials ? (
                        <span>{currentVisitor.initials}</span>
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                          {currentVisitor.name}
                        </h3>
                        {activeChat.isLead && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                            Qualified Lead
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] truncate">
                        <span className="truncate">{currentVisitor.location}</span>
                        <span>·</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                          {activeChat.assignedToName
                            ? `Assigned to ${activeChat.assignedToName}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowClientDetails((prev) => !prev)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                        showClientDetails
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                      )}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {showClientDetails ? "Close Info" : "Client Info"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleResolve}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-semibold transition-all cursor-pointer"
                    >
                      {isResolved ? "Reopen" : "Resolve"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteChatTarget(activeChat)}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 text-[var(--text-muted)] transition-all cursor-pointer"
                      aria-label="Delete conversation"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Handling State Banner */}
                <div
                  className={cn(
                    "px-4 py-2 border-b text-xs flex items-center justify-between gap-3 flex-wrap transition-colors",
                    isHumanActive
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200"
                      : isWaitingForHuman
                      ? "bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200"
                      : "bg-indigo-500/8 border-indigo-500/20 text-[var(--text-secondary)]"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isHumanActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-semibold">Human Takeover Active:</span>
                        <span className="opacity-85 truncate">
                          AI assistant is paused while you reply manually.
                        </span>
                      </>
                    ) : isWaitingForHuman ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-semibold">Waiting for Agent:</span>
                        <span className="opacity-85 truncate">
                          Visitor requested human support.
                        </span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="font-medium">
                          AI Assistant ({activeChat.botName || "Bot"}) is actively handling this conversation.
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isHumanActive ? (
                      <>
                        <button
                          type="button"
                          disabled={takeoverActionLoading}
                          onClick={handleResumeBot}
                          className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-indigo-600 dark:text-indigo-400 hover:bg-[var(--bg-subtle)] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>Resume AI</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsAssigningOpen((prev) => !prev)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {isAssigningOpen && (
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-lg)] p-1 text-xs">
                              <div className="px-2.5 py-1 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                Assign to Member
                              </div>
                              {teamMembers.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleAssignTo(m)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate">{m.name || m.email}</span>
                                  {activeChat.assignedToId === m.id && (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                </button>
                              ))}
                              <div className="border-t border-[var(--border-subtle)] my-1" />
                              <button
                                type="button"
                                onClick={handleRelease}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
                              >
                                Release / Unassign
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        icon={User}
                        loading={takeoverActionLoading}
                        onClick={handleTakeover}
                      >
                        Take Over
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages Transcript Scroll Area */}
                <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden space-y-4">
                  <div className="text-center">
                    <span className="text-[11px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-medium px-3 py-1 rounded-full shadow-2xs">
                      Session started {activeChat.startedAt || "Today"}
                    </span>
                  </div>

                  {activeChat.messages?.map((msg, i) => {
                    const isUser = msg.role === "user";
                    const isAgent = msg.role === "agent" || msg.senderType === "human";
                    const isSystem = msg.role === "system" || msg.senderType === "system";

                    if (isSystem) {
                      return (
                        <div key={msg.id || i} className="flex justify-center my-2">
                          <div className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-[11px] font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>{msg.content || msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    if (isAgent) {
                      return (
                        <div key={msg.id || i} className="flex items-start gap-2.5 justify-end">
                          <div className="p-3.5 rounded-2xl rounded-tr-sm max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-xs bg-indigo-600 text-white break-words [overflow-wrap:anywhere]">
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-indigo-100">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>
                                {msg.senderName || activeChat.assignedToName || "Support Agent"} (Human)
                              </span>
                            </div>
                            <FormattedChatMessage text={msg.content || msg.text} tone="inverse" />
                          </div>
                        </div>
                      );
                    }

                    if (isUser) {
                      return (
                        <div key={msg.id || i} className="flex items-start gap-2.5 justify-start">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center text-xs shrink-0 font-bold">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="p-3.5 rounded-2xl rounded-tl-sm max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-2xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] break-words [overflow-wrap:anywhere]">
                            <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                              {currentVisitor.name}
                            </div>
                            <FormattedChatMessage text={msg.content || msg.text} tone="surface" />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id || i} className="flex items-start gap-2.5 justify-end">
                        <div className="p-3.5 rounded-2xl rounded-tr-sm max-w-[88%] sm:max-w-xl text-xs leading-relaxed shadow-2xs bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] break-words [overflow-wrap:anywhere]">
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            <Bot className="w-3.5 h-3.5" />
                            <span>{activeChat.botName || "AI Assistant"}</span>
                          </div>
                          <FormattedChatMessage text={msg.content || msg.text} tone="surface" />
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Composer Box */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-1.5"
                >
                  <div className="flex items-end gap-2 bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-xl p-1.5 focus-within:border-indigo-500 focus-within:bg-[var(--bg-surface)] transition-all">
                    <textarea
                      rows={1}
                      placeholder={
                        isHumanActive
                          ? "Reply as agent (Enter to send, Shift+Enter for new line)..."
                          : "Type a reply to automatically take over from AI..."
                      }
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-xs bg-transparent px-2.5 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden resize-none max-h-32"
                    />
                    <button
                      type="submit"
                      disabled={!replyInput.trim()}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      aria-label="Send reply"
                      title="Send Reply"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
                    <span>
                      {isHumanActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          ● Manual agent mode active
                        </span>
                      ) : (
                        <span>Sending a message hands off this conversation to you</span>
                      )}
                    </span>
                    <span>Enter ↵ to send</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  No conversation selected
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Select an active customer thread on the left to inspect messages, view lead qualification answers, or reply live.
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 3: Customer Information & Internal Notes */}
          {showClientDetails && (
            <div className="fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-auto w-full lg:w-76 xl:w-84 p-4 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col shrink-0 text-xs animate-slide-left">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-0.5 rounded-lg border border-[var(--border-subtle)] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setClientTab("info")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                      clientTab === "info"
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Notes ({internalNotes.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClientDetails(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                  aria-label="Close details panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {clientTab === "info" && activeChat && (
                <div className="flex-1 overflow-y-auto space-y-4 pt-3">
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Identity & Contact
                    </h4>
                    <div className="space-y-2.5 bg-[var(--bg-subtle)]/50 p-3 rounded-xl border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                        <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{currentVisitor.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span>{activeChat.visitorPhone || "Not provided yet"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span className="truncate">{activeChat.visitorEmail || "Not provided yet"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{currentVisitor.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Handling & Assignment
                    </h4>
                    <div className="space-y-2 bg-[var(--bg-subtle)]/50 p-3 rounded-xl border border-[var(--border-subtle)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-muted)]">Mode</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            isHumanActive
                              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                              : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                          )}
                        >
                          {isHumanActive ? "Human Takeover" : "AI Active"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-muted)]">Assigned Agent</span>
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[130px]">
                          {activeChat.assignedToName || "Unassigned"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-muted)]">Chatbot</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[130px]">
                          {activeChat.botName || "AI Assistant"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-muted)]">Messages</span>
                        <span className="font-medium text-[var(--text-primary)] tabular-nums">
                          {activeChat.messages?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeChat.qualification?.answers &&
                    Object.keys(activeChat.qualification.answers).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          Inquiry Qualification
                        </h4>
                        <div className="space-y-2 bg-[var(--bg-subtle)]/50 p-3 rounded-xl border border-[var(--border-subtle)]">
                          {Object.entries(activeChat.qualification.answers).map(([key, val]) => (
                            <div key={key} className="flex justify-between gap-2">
                              <span className="text-[var(--text-muted)] capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="font-medium text-[var(--text-primary)] text-right break-words">
                                {String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {clientTab === "notes" && activeChat && (
                <div className="flex-1 flex flex-col pt-3 min-h-0 space-y-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-[11px] text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      Private notes are visible only to workspace teammates and never shown to visitors.
                    </span>
                  </div>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Add a private team note about this inquiry..."
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      className="w-full text-xs bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-xl p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500 resize-none"
                    />
                    <Button type="submit" size="sm" className="w-full" disabled={!newNoteInput.trim()}>
                      Add Private Note
                    </Button>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pt-1">
                    {notesLoading ? (
                      <Skeleton className="h-16 w-full rounded-xl" />
                    ) : internalNotes.length === 0 ? (
                      <div className="text-center py-6 text-[var(--text-muted)] text-xs">
                        No internal notes yet for this thread.
                      </div>
                    ) : (
                      internalNotes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {n.authorName || "Team Member"}
                            </span>
                            <span>
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-primary)] leading-relaxed break-words whitespace-pre-wrap">
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

      {/* Global Website Bot Control Modal */}
      <Modal
        isOpen={showBotControlModal}
        onClose={() => setShowBotControlModal(false)}
        title="Global Website Bot Control"
        description="Pause or resume autonomous AI replies across your active website widget."
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-[var(--text-primary)] text-xs">
                Autonomous AI Replies ({botControlData?.name || defaultBot?.name || "Primary Bot"})
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {botControlData?.globalBotEnabled !== false
                  ? "Bot is ON: Automatically answering customer queries."
                  : "Bot is OFF: New customer queries route directly to human agents."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleGlobalBot}
              disabled={isUpdatingBotControl}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                botControlData?.globalBotEnabled !== false
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              )}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{botControlData?.globalBotEnabled !== false ? "Bot ON" : "Bot OFF"}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-[var(--text-secondary)] text-xs">
              Visitor Fallback Notice (when AI is paused)
            </label>
            <textarea
              rows={3}
              value={botFallbackInput}
              onChange={(e) => setBotFallbackInput(e.target.value)}
              placeholder="Our automated assistant is temporarily paused. A team member will assist you shortly."
              className="w-full text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowBotControlModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAllConversations}
        title="Clear All Conversations?"
        description="Are you sure you want to clear all conversations in this workspace? Message history and transcripts will be permanently removed."
        confirmText="Clear All Conversations"
        cancelText="Cancel"
        loadingText="Clearing..."
        variant="danger"
        badgeText="Permanent Action"
        count={conversations.length}
      />

      <ConfirmModal
        isOpen={Boolean(deleteChatTarget)}
        onClose={() => setDeleteChatTarget(null)}
        onConfirm={handleDeleteSingleConversation}
        title="Delete Conversation?"
        description={`Are you sure you want to permanently delete the conversation with ${
          deleteChatTarget ? formatVisitorDisplay(deleteChatTarget).name : "this visitor"
        }?`}
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
        <div className="space-y-4 py-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[620px] w-full rounded-xl" />
        </div>
      }
    >
      <ConversationsContent />
    </React.Suspense>
  );
}
