"use client";

import React, { useState } from "react";
import {
  Bot,
  Palette,
  Sparkles,
  MessageSquare,
  Sliders,
  Check,
  Send,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Radio,
  Layers,
} from "lucide-react";
import { INDUSTRIES } from "@/lib/wizard/industryTemplates";

const PERSONALITY_OPTIONS = [
  {
    id: "Helpful & Professional",
    title: "Professional",
    badge: "Recommended",
    description: "Formal, respectful, concise, and accurate enterprise tone.",
  },
  {
    id: "Friendly & Warm",
    title: "Friendly",
    badge: "High Engagement",
    description: "Warm, approachable, conversational, and welcoming tone.",
  },
  {
    id: "Consultative & Advisory",
    title: "Consultative",
    badge: "Sales & Inquiries",
    description: "Proactive, discovery-oriented, identifying visitor needs and solutions.",
  },
  {
    id: "Custom",
    title: "Custom",
    badge: "Tailored",
    description: "Define your own specific persona instructions and rules.",
  },
];

const COLOR_SWATCHES = [
  "#963DFF", // Emperor Purple
  "#55A9FF", // Electric Blue
  "#00D98B", // Emerald
  "#FF7849", // Sunset Orange
  "#00E5FF", // Cyan
  "#B68A55", // Champagne Gold
  "#C28AFF", // Lavender
  "#EC4899", // Rose Pink
];

const AVATAR_OPTIONS = [
  "🤖", "🧠", "💼", "✨", "🏥", "🏢", "🎓", "🍽️", "🏨", "🛍️", "🩺", "💬", "⚡", "🌟"
];

const LAUNCHER_SHAPES = [
  { id: "squircle", label: "Squircle", sub: "Modern rounded square" },
  { id: "circle", label: "Circle", sub: "Classic circular bubble" },
  { id: "pill", label: "Pill Button", sub: "Expanded pill with label" },
];

const LAUNCHER_ANIMATIONS = [
  { id: "none", label: "Static", sub: "Clean & subtle" },
  { id: "pulse", label: "Subtle Pulse", sub: "Gentle ring expand" },
  { id: "bounce", label: "Soft Bounce", sub: "Catch visitor attention" },
  { id: "glow", label: "Beacon Glow", sub: "Ambient glowing effect" },
];

export default function Step05AssistantConfig({
  industry,
  businessDetails,
  assistantConfig,
  onChangeAssistantConfig,
  onNext,
  onBack,
}) {
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[0];
  const [newStarterQ, setNewStarterQ] = useState("");

  const update = (field, val) => {
    onChangeAssistantConfig({
      ...assistantConfig,
      [field]: val,
    });
  };

  const handleAddStarterQ = () => {
    if (!newStarterQ.trim()) return;
    const list = Array.isArray(assistantConfig.starterQuestions) ? [...assistantConfig.starterQuestions] : [];
    list.push(newStarterQ.trim());
    update("starterQuestions", list);
    setNewStarterQ("");
  };

  const handleRemoveStarterQ = (idx) => {
    const list = Array.isArray(assistantConfig.starterQuestions) ? [...assistantConfig.starterQuestions] : [];
    list.splice(idx, 1);
    update("starterQuestions", list);
  };

  const activeColor = assistantConfig.primaryColor || "#963DFF";

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#963DFF]/10 border border-[#963DFF]/30 text-[11px] font-bold text-[#C28AFF] uppercase tracking-wider">
          <Palette className="w-3.5 h-3.5" />
          <span>Step 05 · Presentation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Assistant Persona & Branding
        </h2>
        <p className="text-xs sm:text-sm text-[#9898A6] leading-relaxed">
          Customize your assistant&apos;s identity, conversational tone, brand primary color, launcher widget shape, and starter prompts.
        </p>
      </div>

      {/* Main Grid: Controls + Live Widget Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Identity & Name */}
          <div className="p-6 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#C28AFF]" />
              <span>Assistant Identity</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">
                Assistant Name <span className="text-[#963DFF]">*</span>
              </label>
              <input
                type="text"
                value={assistantConfig.name || ""}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Apex Care Assistant"
                className="w-full px-4 py-3 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF]"
              />
            </div>

            {/* Avatar / Logo Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Assistant Avatar / Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => update("avatar", av)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                      assistantConfig.avatar === av
                        ? "bg-[#963DFF] ring-2 ring-white text-white shadow-lg shadow-[#963DFF]/30 scale-105"
                        : "bg-[#0B0B10] border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">
                Welcome Greeting Message
              </label>
              <textarea
                rows={3}
                value={assistantConfig.welcomeMessage || ""}
                onChange={(e) => update("welcomeMessage", e.target.value)}
                placeholder="Hello! Welcome to our website. How can I help you today?"
                className="w-full px-4 py-3 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] focus:ring-1 focus:ring-[#963DFF] resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Card 2: Personality Selector */}
          <div className="p-6 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#55A9FF]" />
              <span>Assistant Personality Tone</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERSONALITY_OPTIONS.map((pers) => {
                const isSelected = assistantConfig.personality === pers.id;
                return (
                  <button
                    key={pers.id}
                    type="button"
                    onClick={() => update("personality", pers.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#181828] border-[#963DFF] text-white ring-1 ring-[#963DFF] shadow-sm"
                        : "bg-[#0B0B10] border-white/10 text-[#9898A6] hover:bg-[#151520] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs text-white">{pers.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#C28AFF]">
                        {pers.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9898A6] leading-tight mt-1">
                      {pers.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom personality prompt textarea if Custom selected */}
            {assistantConfig.personality === "Custom" && (
              <div className="pt-2 animate-fade-in space-y-1.5">
                <label className="text-[11px] font-bold text-white block">
                  Custom Tone Directives
                </label>
                <textarea
                  rows={2}
                  value={assistantConfig.customInstructions || ""}
                  onChange={(e) => update("customInstructions", e.target.value)}
                  placeholder="e.g. Talk like an energetic personal concierge who specializes in luxury real estate investments..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF] resize-none"
                />
              </div>
            )}
          </div>

          {/* Card 3: Brand Color & Launcher Shape */}
          <div className="p-6 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#00D98B]" />
              <span>Brand Color & Launcher Widget</span>
            </h3>

            {/* Color Swatches + Hex */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Brand Primary Accent Color
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => update("primaryColor", hex)}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                      activeColor.toLowerCase() === hex.toLowerCase()
                        ? "scale-110 ring-2 ring-white shadow-lg"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {activeColor.toLowerCase() === hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    )}
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={activeColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="w-24 px-2 py-1 rounded-lg bg-[#0B0B10] border border-white/10 text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Launcher Shape */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-bold text-white block">
                Launcher Button Shape
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {LAUNCHER_SHAPES.map((shape) => {
                  const isShape = assistantConfig.launcherShape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => update("launcherShape", shape.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isShape
                          ? "bg-[#181828] border-[#963DFF] text-white ring-1 ring-[#963DFF]"
                          : "bg-[#0B0B10] border-white/10 text-[#9898A6] hover:bg-[#14141E] hover:text-white"
                      }`}
                    >
                      <span className="font-bold text-xs block text-white">{shape.label}</span>
                      <span className="text-[10px] text-[#9898A6]">{shape.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launcher Animation */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-bold text-white block">
                Launcher Attention Animation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LAUNCHER_ANIMATIONS.map((anim) => {
                  const isAnim = assistantConfig.launcherAnimation === anim.id;
                  return (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => update("launcherAnimation", anim.id)}
                      className={`text-center p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                        isAnim
                          ? "bg-[#181828] border-[#963DFF] text-white ring-1 ring-[#963DFF] font-bold"
                          : "bg-[#0B0B10] border-white/10 text-[#9898A6] hover:bg-[#14141E] hover:text-white"
                      }`}
                    >
                      {anim.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 4: Suggested Starter Questions */}
          <div className="p-6 rounded-3xl bg-[#12121A] border border-white/[0.08] shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C28AFF]" />
              <span>Suggested Starter Prompts</span>
            </h3>
            <p className="text-xs text-[#9898A6]">
              Quick-action prompt buttons displayed inside the widget so visitors can start chatting with one click.
            </p>

            <div className="space-y-2">
              {assistantConfig.starterQuestions?.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0B10] border border-white/10 text-xs text-white"
                >
                  <span className="truncate pr-2">&ldquo;{q}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStarterQ(qIdx)}
                    className="text-[#9898A6] hover:text-rose-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newStarterQ}
                onChange={(e) => setNewStarterQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddStarterQ())}
                placeholder="Add custom starter prompt..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0B0B10] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#963DFF]"
              />
              <button
                type="button"
                onClick={handleAddStarterQ}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                + Add Prompt
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Widget Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider px-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Widget Preview</span>
            </span>
            <span className="text-[10px] text-[#9898A6] font-mono font-normal">Real-time styling</span>
          </div>

          {/* Interactive Widget Mockup */}
          <div className="w-full rounded-3xl bg-[#09090D] border border-white/15 shadow-2xl overflow-hidden flex flex-col h-[520px]">
            {/* Widget Top Bar */}
            <div
              className="p-4 text-white flex items-center justify-between shadow-md"
              style={{ backgroundColor: activeColor }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-base">
                  {assistantConfig.avatar || "🤖"}
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-tight">
                    {assistantConfig.name || "AI Assistant"}
                  </h4>
                  <span className="text-[10px] text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    Online · {businessDetails.businessName || "Business"}
                  </span>
                </div>
              </div>
            </div>

            {/* Widget Chat Body */}
            <div className="flex-1 p-4 bg-[#050507] overflow-y-auto space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Assistant Welcome Greeting */}
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-md bg-[#161622] border border-white/10 text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {assistantConfig.avatar || "🤖"}
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-sm bg-[#12121A] border border-white/10 text-xs text-white/95 leading-relaxed shadow-sm">
                    {assistantConfig.welcomeMessage || "Hello! How can I assist you today?"}
                  </div>
                </div>

                {/* Suggested Starter Chips */}
                {assistantConfig.starterQuestions?.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-mono text-[#9898A6] uppercase tracking-wider block">
                      Suggested Questions
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {assistantConfig.starterQuestions.slice(0, 3).map((chip, cIdx) => (
                        <div
                          key={cIdx}
                          className="text-left px-3 py-2 rounded-xl bg-[#101018] border border-white/10 hover:border-[#963DFF] text-white text-[11px] transition-all cursor-pointer truncate shadow-xs"
                        >
                          {chip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Mockup */}
              <div className="pt-2">
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#12121A] border border-white/10">
                  <input
                    type="text"
                    disabled
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-0 text-white placeholder-white/30 text-xs px-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: activeColor }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Launcher Icon Demo Preview Footer */}
            <div className="p-3 bg-[#0B0B10] border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#9898A6]">Launcher Preview:</span>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center text-white shadow-lg cursor-pointer ${
                    assistantConfig.launcherShape === "circle"
                      ? "w-9 h-9 rounded-full"
                      : assistantConfig.launcherShape === "pill"
                      ? "px-3 py-1.5 rounded-full gap-1.5 text-xs font-bold"
                      : "w-9 h-9 rounded-2xl"
                  }`}
                  style={{ backgroundColor: activeColor }}
                >
                  <span className="text-sm">{assistantConfig.avatar || "💬"}</span>
                  {assistantConfig.launcherShape === "pill" && (
                    <span className="text-[11px]">Chat with AI</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-[#9898A6] hover:text-white bg-[#12121A] hover:bg-[#1A1A24] border border-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Review</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-9 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#963DFF] to-[#55A9FF] hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#963DFF]/25 transition-all cursor-pointer"
        >
          <span>Continue to Final Step</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
