"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  Sparkles,
  Bot,
  Save,
  Check,
  RefreshCw,
  Sliders,
  Eye,
  ShieldCheck,
  Building2,
  CheckCircle2,
  MessageCircle,
  Headphones,
  Image as ImageIcon,
  Circle,
  Square,
  Maximize2,
} from "lucide-react";
import BotPreviewWidget from "@/components/bots/BotPreviewWidget";

const PRESET_COLORS = [
  { name: "Imperial Gold", hex: "#B68A55" },
  { name: "Emerald Green", hex: "#10B981" },
  { name: "Royal Indigo", hex: "#4F46E5" },
  { name: "Electric Cyan", hex: "#06B6D4" },
  { name: "Crimson Rose", hex: "#F43F5E" },
  { name: "Purple Velvet", hex: "#8B5CF6" },
  { name: "Burnt Orange", hex: "#EA580C" },
  { name: "Deep Charcoal", hex: "#18181B" },
];

const PRESET_AVATARS = ["🤖", "⚡", "🚀", "💬", "👑", "🛡️", "💎", "💼", "🧠", "🌟", "🎯", "🌐"];

const LAUNCHER_ICONS = [
  { id: "bubble", label: "Speech Bubble", icon: MessageCircle },
  { id: "robot", label: "AI Robot", icon: Bot },
  { id: "sparkles", label: "Magic Sparkles", icon: Sparkles },
  { id: "headset", label: "Support Headset", icon: Headphones },
  { id: "avatar", label: "Bot Avatar Emoji", icon: null },
  { id: "custom", label: "Company Logo Image", icon: ImageIcon },
];

const LAUNCHER_SHAPES = [
  { id: "circle", label: "Circle (Default)", desc: "Classic 100% round floating button" },
  { id: "squircle", label: "Squircle", desc: "Modern iOS-style rounded square" },
  { id: "pill", label: "Pill with Text", desc: "Horizontal button with customizable text" },
];

const LAUNCHER_SIZES = [
  { id: "compact", label: "Compact (52px)" },
  { id: "medium", label: "Standard (62px)" },
  { id: "large", label: "Large (72px)" },
];

const PERSONALITY_OPTIONS = [
  { id: "Professional", label: "Professional & Corporate", desc: "Crisp, polite, and executive-oriented" },
  { id: "Friendly", label: "Warm & Helpful", desc: "Approachable, conversational, and welcoming" },
  { id: "Consultant", label: "Solutions Consultant", desc: "Diagnostic, consultative, and value-driven" },
  { id: "Technical Specialist", label: "Technical Engineering", desc: "Precise, architecture-focused, and thorough" },
];

export default function RedesignBotModal({ isOpen, onClose, bot, onBotUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    avatar: "🤖",
    primaryColor: "#B68A55",
    welcomeMessage: "",
    placeholderText: "Ask anything about our solutions...",
    launcherPosition: "bottom-right",
    launcherShape: "circle",
    launcherSize: "medium",
    launcherIcon: "bubble",
    launcherLogoUrl: "",
    launcherText: "Chat with us",
    personality: "Professional",
    collectLeads: true,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (bot) {
      setFormData({
        name: bot.name || "AI Assistant",
        avatar: bot.avatar || "🤖",
        primaryColor: bot.primaryColor || "#B68A55",
        welcomeMessage:
          bot.welcomeMessage ||
          `Hello! Welcome to ${bot.company || bot.name || "our company"}. How can I assist you with your project today?`,
        placeholderText: bot.placeholderText || "Ask anything about our solutions...",
        launcherPosition: bot.launcherPosition || "bottom-right",
        launcherShape: bot.launcherShape || "circle",
        launcherSize: bot.launcherSize || "medium",
        launcherIcon: bot.launcherIcon || (bot.launcherLogoUrl ? "custom" : "bubble"),
        launcherLogoUrl: bot.launcherLogoUrl || "",
        launcherText: bot.launcherText || "Chat with us",
        personality: bot.personality || "Professional",
        collectLeads: bot.collectLeads !== false,
      });
      setError("");
      setSavedSuccess(false);
    }
  }, [bot, isOpen]);

  if (!isOpen || !bot) return null;

  const handleColorChange = (hex) => {
    setFormData((prev) => ({ ...prev, primaryColor: hex }));
  };

  const handleAvatarChange = (avatar) => {
    setFormData((prev) => ({ ...prev, avatar }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update bot design.");
      }

      setSavedSuccess(true);
      if (onBotUpdated) {
        onBotUpdated(data.bot || { ...bot, ...formData });
      }

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const launcherPx = formData.launcherSize === "compact" ? 52 : formData.launcherSize === "large" ? 72 : 62;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-[#0D0D0D] border border-[#EFE7DC] dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-[#EFE7DC] dark:border-neutral-800/80 flex items-center justify-between shrink-0 bg-[#FAF9F6] dark:bg-[#111111]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm transition-all overflow-hidden"
              style={{ backgroundColor: formData.primaryColor }}
            >
              {formData.launcherLogoUrl ? (
                <img
                  src={formData.launcherLogoUrl}
                  alt={formData.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-xl">{formData.avatar}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#252525] dark:text-white">
                  Redesign Bot & Chat Launcher
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B68A55]/15 text-[#B68A55] font-bold border border-[#B68A55]/30">
                  {bot.id}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Customize chat button logo, circle shape, brand colors, and widget appearance (available to all workspace admins).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns (Controls & Live Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 no-scrollbar">
          {/* LEFT: Redesign Controls (7 Cols) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Design settings applied successfully!</span>
              </div>
            )}

            {/* 1. Chat Launcher Button & Logo Customization (USER REQUESTED: CHANGE LOGO AND CIRCLE) */}
            <div className="space-y-4 bg-[#FAF9F6] dark:bg-[#141414] p-4.5 rounded-2xl border border-[#EFE7DC] dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#B68A55]">
                  1. Chat Button Logo & Circle Styling
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">Floating Launcher</span>
              </div>

              {/* Launcher Shape: Circle vs Squircle vs Pill */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                  Launcher Shape (Circle / Shape)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {LAUNCHER_SHAPES.map((s) => {
                    const isSelected = formData.launcherShape === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, launcherShape: s.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#B68A55] bg-white dark:bg-[#1E1E1E] shadow-xs"
                            : "border-[#EFE7DC] dark:border-neutral-800 bg-white/60 dark:bg-[#181818]/60 hover:border-neutral-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {s.id === "circle" && <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                          {s.id === "squircle" && <div className="w-3.5 h-3.5 rounded-md border border-current" />}
                          {s.id === "pill" && <div className="w-5 h-3 rounded-full border border-current" />}
                          <span className="font-bold text-xs">{s.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 line-clamp-1">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pill text if pill shape */}
              {formData.launcherShape === "pill" && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Launcher Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.launcherText}
                    onChange={(e) => setFormData({ ...formData, launcherText: e.target.value })}
                    placeholder="e.g. Chat with us"
                    className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl px-3.5 py-2 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55]"
                  />
                </div>
              )}

              {/* Launcher Icon / Logo Type */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                  Launcher Button Icon / Logo
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {LAUNCHER_ICONS.map((item) => {
                    const isSelected = formData.launcherIcon === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, launcherIcon: item.id })}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#B68A55] bg-white dark:bg-[#1E1E1E] shadow-xs text-[#B68A55]"
                            : "border-[#EFE7DC] dark:border-neutral-800 bg-white/60 dark:bg-[#181818]/60 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400"
                        }`}
                      >
                        {item.id === "avatar" ? (
                          <span className="text-base">{formData.avatar}</span>
                        ) : Icon ? (
                          <Icon className="w-4 h-4" />
                        ) : null}
                        <span className="text-[10px] font-semibold truncate w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image / Logo URL Field */}
              {formData.launcherIcon === "custom" && (
                <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#EFE7DC] dark:border-neutral-700 space-y-2">
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    Custom Logo Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.launcherLogoUrl}
                      onChange={(e) => setFormData({ ...formData, launcherLogoUrl: e.target.value })}
                      placeholder="https://yourdomain.com/logo.png or /e-logoicon.webp"
                      className="flex-1 text-xs bg-[#FAF9F6] dark:bg-[#141414] border border-[#EFE7DC] dark:border-neutral-700 rounded-lg px-3 py-2 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55]"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, launcherLogoUrl: "/e-logoicon.webp" })}
                      className="px-2.5 py-2 text-[10px] font-bold bg-[#B68A55]/15 text-[#B68A55] rounded-lg border border-[#B68A55]/30 hover:bg-[#B68A55]/25 whitespace-nowrap cursor-pointer"
                    >
                      Use ESS Logo
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    PNG, SVG, or WEBP with transparent background recommended.
                  </p>
                </div>
              )}

              {/* Button Size & Position */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Button Size
                  </label>
                  <select
                    value={formData.launcherSize}
                    onChange={(e) => setFormData({ ...formData, launcherSize: e.target.value })}
                    className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl px-3 py-2 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55]"
                  >
                    {LAUNCHER_SIZES.map((sz) => (
                      <option key={sz.id} value={sz.id}>
                        {sz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Screen Position
                  </label>
                  <select
                    value={formData.launcherPosition}
                    onChange={(e) => setFormData({ ...formData, launcherPosition: e.target.value })}
                    className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl px-3 py-2 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55]"
                  >
                    <option value="bottom-right">Bottom Right (Standard)</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Bot Identity & Avatar */}
            <div className="space-y-3 bg-[#FAF9F6] dark:bg-[#141414] p-4.5 rounded-2xl border border-[#EFE7DC] dark:border-neutral-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                2. Assistant Name & Avatar
              </label>
              <div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Emperor AI Assistant"
                  className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55] transition-colors"
                />
              </div>

              {/* Avatar Picker */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mb-2">
                  Header Avatar Emoji
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => handleAvatarChange(av)}
                      className={`w-9 h-9 text-base rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        formData.avatar === av
                          ? "border-[#B68A55] bg-[#B68A55]/15 scale-110 shadow-xs"
                          : "border-[#EFE7DC] dark:border-neutral-800 bg-white dark:bg-[#1E1E1E] hover:border-neutral-400"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] text-neutral-500">Custom:</span>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.avatar}
                      onChange={(e) => handleAvatarChange(e.target.value)}
                      className="w-12 text-center text-xs bg-white dark:bg-[#1E1E1E] border border-[#EFE7DC] dark:border-neutral-700 rounded-lg py-1 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Theme & Colors */}
            <div className="space-y-3 bg-[#FAF9F6] dark:bg-[#141414] p-4.5 rounded-2xl border border-[#EFE7DC] dark:border-neutral-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                3. Brand Accent Color
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                {PRESET_COLORS.map((c) => {
                  const isSelected = formData.primaryColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleColorChange(c.hex)}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#B68A55] bg-white dark:bg-[#1F1F1F] shadow-xs"
                          : "border-[#EFE7DC] dark:border-neutral-800 bg-white/70 dark:bg-[#1A1A1A]/70 hover:border-neutral-400"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center"
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="text-[11px] font-medium truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                  Custom Hex Code:
                </span>
                <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] px-2.5 py-1.5 rounded-xl border border-[#EFE7DC] dark:border-neutral-700">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-20 font-mono text-xs uppercase bg-transparent text-[#252525] dark:text-white outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 4. Messages & Welcome */}
            <div className="space-y-3 bg-[#FAF9F6] dark:bg-[#141414] p-4.5 rounded-2xl border border-[#EFE7DC] dark:border-neutral-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                4. Welcome Message & Inputs
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  Welcome Greeting
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="Hello! Welcome to our website..."
                  className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl p-3 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55] transition-colors leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  Input Placeholder
                </label>
                <input
                  type="text"
                  value={formData.placeholderText}
                  onChange={(e) => setFormData({ ...formData, placeholderText: e.target.value })}
                  placeholder="Ask a question..."
                  className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  Personality & Tone
                </label>
                <select
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  className="w-full text-xs bg-white dark:bg-[#1A1A1A] border border-[#EFE7DC] dark:border-neutral-700 rounded-xl px-3 py-2 text-[#252525] dark:text-white outline-hidden focus:border-[#B68A55]"
                >
                  {PERSONALITY_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* RIGHT: Live Real-Time Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#B68A55]" />
                <span>Live Interactive Preview</span>
              </span>
              <span className="text-[10px] text-neutral-400">Updates in real-time</span>
            </div>

            {/* Live Launcher Button Preview Card */}
            <div className="w-full bg-[#FAF9F6] dark:bg-[#121212] p-4 rounded-2xl border border-[#EFE7DC] dark:border-neutral-800 space-y-2.5">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Launcher Button Appearance
              </span>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-neutral-800/80">
                <div className="text-xs text-neutral-300">
                  <span className="font-semibold block text-white capitalize">
                    {formData.launcherShape} • {formData.launcherSize}
                  </span>
                  <span className="text-[10px] text-neutral-400">Position: {formData.launcherPosition}</span>
                </div>

                {/* THE LIVE BUTTON PREVIEW */}
                <div
                  className="flex items-center justify-center text-white font-bold shadow-xl border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: formData.primaryColor,
                    borderRadius:
                      formData.launcherShape === "squircle"
                        ? "18px"
                        : formData.launcherShape === "pill"
                        ? "9999px"
                        : "50%",
                    width: formData.launcherShape === "pill" ? "auto" : `${launcherPx}px`,
                    height: `${launcherPx}px`,
                    padding: formData.launcherShape === "pill" ? "0 18px" : "0",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {formData.launcherLogoUrl ? (
                      <img
                        src={formData.launcherLogoUrl}
                        alt="Logo"
                        className="object-contain"
                        style={{
                          width: `${Math.round(launcherPx * 0.55)}px`,
                          height: `${Math.round(launcherPx * 0.55)}px`,
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : formData.launcherIcon === "avatar" ? (
                      <span style={{ fontSize: `${Math.round(launcherPx * 0.44)}px` }}>{formData.avatar}</span>
                    ) : formData.launcherIcon === "robot" ? (
                      <Bot style={{ width: `${Math.round(launcherPx * 0.44)}px`, height: `${Math.round(launcherPx * 0.44)}px` }} />
                    ) : formData.launcherIcon === "sparkles" ? (
                      <Sparkles style={{ width: `${Math.round(launcherPx * 0.44)}px`, height: `${Math.round(launcherPx * 0.44)}px` }} />
                    ) : formData.launcherIcon === "headset" ? (
                      <Headphones style={{ width: `${Math.round(launcherPx * 0.44)}px`, height: `${Math.round(launcherPx * 0.44)}px` }} />
                    ) : (
                      <MessageCircle style={{ width: `${Math.round(launcherPx * 0.44)}px`, height: `${Math.round(launcherPx * 0.44)}px` }} />
                    )}

                    {formData.launcherShape === "pill" && formData.launcherText && (
                      <span className="text-xs font-bold whitespace-nowrap text-white">
                        {formData.launcherText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Window Live Preview */}
            <div className="w-full flex justify-center bg-[#FAF9F6] dark:bg-[#070707] p-3 rounded-2xl border border-[#EFE7DC] dark:border-neutral-800">
              <BotPreviewWidget
                botId={bot.id}
                botName={formData.name || "AI Assistant"}
                avatar={formData.avatar || "🤖"}
                primaryColor={formData.primaryColor || "#B68A55"}
                welcomeMessage={formData.welcomeMessage}
                placeholderText={formData.placeholderText}
                position={formData.launcherPosition}
                showLeadForm={formData.collectLeads}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#EFE7DC] dark:border-neutral-800/80 bg-[#FAF9F6] dark:bg-[#111111] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: formData.primaryColor || "#B68A55" }}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Design...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved & Applied!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Apply Redesign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
