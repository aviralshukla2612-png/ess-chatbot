/**
 * NexusAI Standalone Embeddable Chatbot Widget
 * Version: 1.2.0
 * Zero-dependency, pure vanilla JavaScript widget.
 * Works seamlessly across any website: HTML, WordPress, Shopify, Webflow, Wix, Squarespace, React, Vue, Angular.
 */
(function () {
  "use strict";

  // Prevent multiple executions on the same page
  if (window.__NEXUS_WIDGET_INITIALIZED__) return;
  window.__NEXUS_WIDGET_INITIALIZED__ = true;

  // 1. Identify Host Script Tag
  function findScript() {
    if (document.currentScript) return document.currentScript;
    const byBotId = document.querySelector("script[data-bot-id]");
    if (byBotId) return byBotId;
    const bySrc = document.querySelector('script[src*="widget.js"]');
    if (bySrc) return bySrc;
    return null;
  }

  const scriptTag = findScript();
  const botId =
    (scriptTag && scriptTag.getAttribute("data-bot-id")) ||
    window.NEXUS_BOT_ID ||
    "bot_1791618269632";

  // 2. Derive Server API Base URL
  let apiBase = "";
  if (scriptTag && scriptTag.getAttribute("data-api-url")) {
    apiBase = scriptTag.getAttribute("data-api-url").replace(/\/+$/, "");
  } else if (scriptTag && scriptTag.src) {
    try {
      const parsed = new URL(scriptTag.src);
      apiBase = `${parsed.protocol}//${parsed.host}`;
    } catch (e) {
      apiBase = window.location.origin;
    }
  } else {
    apiBase = window.location.origin;
  }

  // Session state & persistent identity defaults
  const sessionKey = `nexus_chat_v2_${botId}`;
  let activeSessionId = "";
  let visitorToken = null;
  try {
    visitorToken = localStorage.getItem(`ess_vtoken_${botId}`);
  } catch (e) {}

  try {
    activeSessionId = sessionStorage.getItem(`${sessionKey}_id`);
  } catch (e) {}
  if (!activeSessionId) {
    activeSessionId = `visitor_${botId}_${Date.now()}`;
    try { sessionStorage.setItem(`${sessionKey}_id`, activeSessionId); } catch (e) {}
  }

  let isOpen = false;
  let isLoading = false;

  function sanitizeColor(hex) {
    if (!hex || typeof hex !== "string" || !hex.trim()) return "#B68A55";
    const trimmed = hex.trim();
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }

  let botConfig = {
    id: botId,
    name: "AI Assistant",
    avatar: "🤖",
    primaryColor: sanitizeColor((scriptTag && scriptTag.getAttribute("data-color")) || "#B68A55"),
    welcomeMessage:
      (scriptTag && scriptTag.getAttribute("data-welcome")) ||
      "Hello! Welcome to Emperor Smart Solutions. How can I help you today?",
    placeholderText: "Type your message...",
    launcherPosition:
      (scriptTag && scriptTag.getAttribute("data-position")) || "bottom-right",
    launcherShape: (scriptTag && scriptTag.getAttribute("data-shape")) || "circle",
    launcherAnimation: (scriptTag && scriptTag.getAttribute("data-animation")) || "none",
    launcherSize: (scriptTag && scriptTag.getAttribute("data-size")) || "medium",
    launcherIcon: (scriptTag && scriptTag.getAttribute("data-icon")) || "bubble",
    launcherLogoUrl: (scriptTag && scriptTag.getAttribute("data-logo")) || "",
    launcherText: (scriptTag && scriptTag.getAttribute("data-launcher-text")) || "",
    launcherMarginBottom:
      scriptTag && scriptTag.getAttribute("data-margin-bottom")
        ? parseInt(scriptTag.getAttribute("data-margin-bottom"), 10)
        : 24,
    launcherMarginRight:
      scriptTag && scriptTag.getAttribute("data-margin-right")
        ? parseInt(scriptTag.getAttribute("data-margin-right"), 10)
        : 24,
    launcherMarginLeft:
      scriptTag && scriptTag.getAttribute("data-margin-left")
        ? parseInt(scriptTag.getAttribute("data-margin-left"), 10)
        : 24,
    launcherMarginTop:
      scriptTag && scriptTag.getAttribute("data-margin-top")
        ? parseInt(scriptTag.getAttribute("data-margin-top"), 10)
        : 24,
    brandingEnabled:
      scriptTag && scriptTag.getAttribute("data-branding") === "false" ? false : true,
    quickReplies: [],
  };

  let messages = [];
  try {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) messages = JSON.parse(saved);
  } catch (e) {}

  // 3. Fetch Live Bot Configuration (with anti-cache query param)
  fetch(`${apiBase}/api/bots/${encodeURIComponent(botId)}/widget-config?_t=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data && data.bot) {
        botConfig = {
          ...botConfig,
          ...data.bot,
          primaryColor: sanitizeColor(
            data.bot.primaryColor || (scriptTag && scriptTag.getAttribute("data-color")) || "#B68A55"
          ),
          welcomeMessage: (scriptTag && scriptTag.getAttribute("data-welcome")) || data.bot.welcomeMessage || "Hello! How can I help you today?",
          launcherPosition: (scriptTag && scriptTag.getAttribute("data-position")) || data.bot.launcherPosition || "bottom-right",
          launcherSize:
            data.bot.launcherSize || (scriptTag && scriptTag.getAttribute("data-size")) || "medium",
          launcherShape:
            data.bot.launcherShape || (scriptTag && scriptTag.getAttribute("data-shape")) || "circle",
          launcherAnimation:
            data.bot.launcherAnimation || (scriptTag && scriptTag.getAttribute("data-animation")) || "none",
          launcherIcon:
            data.bot.launcherIcon || (scriptTag && scriptTag.getAttribute("data-icon")) || "bubble",
          launcherLogoUrl:
            data.bot.launcherLogoUrl || (scriptTag && scriptTag.getAttribute("data-logo")) || "",
          launcherText:
            data.bot.launcherText || (scriptTag && scriptTag.getAttribute("data-launcher-text")) || "",
          launcherMarginBottom:
            data.bot.launcherMarginBottom !== undefined && Number.isFinite(Number(data.bot.launcherMarginBottom))
              ? Number(data.bot.launcherMarginBottom)
              : scriptTag && scriptTag.getAttribute("data-margin-bottom")
              ? parseInt(scriptTag.getAttribute("data-margin-bottom"), 10)
              : 24,
          launcherMarginRight:
            data.bot.launcherMarginRight !== undefined && Number.isFinite(Number(data.bot.launcherMarginRight))
              ? Number(data.bot.launcherMarginRight)
              : scriptTag && scriptTag.getAttribute("data-margin-right")
              ? parseInt(scriptTag.getAttribute("data-margin-right"), 10)
              : 24,
          launcherMarginLeft:
            data.bot.launcherMarginLeft !== undefined && Number.isFinite(Number(data.bot.launcherMarginLeft))
              ? Number(data.bot.launcherMarginLeft)
              : scriptTag && scriptTag.getAttribute("data-margin-left")
              ? parseInt(scriptTag.getAttribute("data-margin-left"), 10)
              : 24,
          launcherMarginTop:
            data.bot.launcherMarginTop !== undefined && Number.isFinite(Number(data.bot.launcherMarginTop))
              ? Number(data.bot.launcherMarginTop)
              : scriptTag && scriptTag.getAttribute("data-margin-top")
              ? parseInt(scriptTag.getAttribute("data-margin-top"), 10)
              : 24,
          quickReplies: Array.isArray(data.bot.quickReplies) ? data.bot.quickReplies : [],
        };
        applyTheme();
        updateLauncher();
        renderMessages();
      }
    })
    .catch((err) => {
      console.warn("[NexusAI Widget] Using local configuration defaults.", err);
    });

  // 3.1. Fetch or Restore 24-Hour Active Conversation Session & Customer Identity
  function initVisitorSession() {
    const headers = {};
    if (visitorToken) headers["x-visitor-token"] = visitorToken;

    fetch(`${apiBase}/api/public/chat/${encodeURIComponent(botId)}/session`, {
      method: "GET",
      headers,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.success) return;

        if (data.visitorToken) {
          visitorToken = data.visitorToken;
          try { localStorage.setItem(`ess_vtoken_${botId}`, data.visitorToken); } catch (e) {}
        }

        if (data.conversationId) {
          activeSessionId = data.conversationId;
          try { sessionStorage.setItem(`${sessionKey}_id`, activeSessionId); } catch (e) {}
        }

        if (data.hasActiveChat && Array.isArray(data.messages) && data.messages.length > 0) {
          // Restoring conversation within 24 hours
          messages = data.messages;
          try { sessionStorage.setItem(sessionKey, JSON.stringify(messages)); } catch (e) {}
          renderMessages();
        } else if (data.isReturning && data.returningGreeting) {
          // Returning visitor after 24h: show personalized returning greeting, fresh chat
          botConfig.welcomeMessage = data.returningGreeting;
          messages = [];
          try { sessionStorage.removeItem(sessionKey); } catch (e) {}
          renderMessages();
        }
      })
      .catch((e) => {
        console.warn("[NexusAI Widget] Session sync failed, operating with fallback session.", e);
      });
  }
  // Helper functions for dynamic theme styling
  function adjustColorBrightness(hex, percent) {
    const safeHex = sanitizeColor(hex);
    if (!safeHex || typeof safeHex !== "string" || !safeHex.startsWith("#")) return "#B68A55";
    let c = safeHex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    if (c.length !== 6) return "#B68A55";
    const num = parseInt(c, 16);
    let r = ((num >> 16) & 255) + percent;
    let g = ((num >> 8) & 255) + percent;
    let b = (num & 255) + percent;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function hexToRgba(hex, alpha = 1) {
    const safeHex = sanitizeColor(hex);
    if (!safeHex || typeof safeHex !== "string" || !safeHex.startsWith("#")) return `rgba(182, 138, 85, ${alpha})`;
    let c = safeHex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    if (c.length !== 6) return `rgba(182, 138, 85, ${alpha})`;
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // 4. Create Container & Inject Scoped Styles
  const container = document.createElement("div");
  container.id = "nexus-chatbot-widget-container";
  container.setAttribute("data-nexus-version", "2.0.0");

  function updateThemeVariables() {
    const primary = sanitizeColor(botConfig.primaryColor || "#B68A55");
    const darker = adjustColorBrightness(primary, -26);
    const lighter = adjustColorBrightness(primary, 22);
    const glow = hexToRgba(primary, 0.38);
    const softBg = hexToRgba(primary, 0.14);

    container.style.setProperty("--nexus-primary", primary);
    container.style.setProperty("--nexus-primary-dark", darker);
    container.style.setProperty("--nexus-primary-light", lighter);
    container.style.setProperty("--nexus-primary-glow", glow);
    container.style.setProperty("--nexus-primary-soft", softBg);

    const launcherEl = document.getElementById("nexus-widget-launcher");
    if (launcherEl) {
      launcherEl.style.background = `linear-gradient(135deg, ${primary} 0%, ${darker} 100%)`;
      launcherEl.style.boxShadow = `0 10px 28px -4px ${glow}, 0 4px 16px rgba(0, 0, 0, 0.7)`;
    }
  }

  function updatePosition() {
    const pos = (botConfig.launcherPosition || "bottom-right").toLowerCase();
    const isLeft = pos.includes("left");
    const isTop = pos.includes("top");

    const mb = Number.isFinite(Number(botConfig.launcherMarginBottom))
      ? Number(botConfig.launcherMarginBottom)
      : 24;
    const mr = Number.isFinite(Number(botConfig.launcherMarginRight))
      ? Number(botConfig.launcherMarginRight)
      : 24;
    const ml = Number.isFinite(Number(botConfig.launcherMarginLeft))
      ? Number(botConfig.launcherMarginLeft)
      : 24;
    const mt = Number.isFinite(Number(botConfig.launcherMarginTop))
      ? Number(botConfig.launcherMarginTop)
      : 24;

    if (isTop) {
      container.classList.add("nexus-pos-top");
      container.style.setProperty("top", `${mt}px`, "important");
      container.style.setProperty("bottom", "auto", "important");
    } else {
      container.classList.remove("nexus-pos-top");
      container.style.setProperty("bottom", `${mb}px`, "important");
      container.style.setProperty("top", "auto", "important");
    }

    if (isLeft) {
      container.classList.add("nexus-pos-left");
      container.style.setProperty("left", `${ml}px`, "important");
      container.style.setProperty("right", "auto", "important");
    } else {
      container.classList.remove("nexus-pos-left");
      container.style.setProperty("right", `${mr}px`, "important");
      container.style.setProperty("left", "auto", "important");
    }
  }

  function applyTheme() {
    updateThemeVariables();
    updatePosition();
    const titleEl = document.getElementById("nexus-header-title");
    if (titleEl && botConfig.name) {
      titleEl.textContent = botConfig.name;
    }
    const avatarBadge = document.getElementById("nexus-avatar-badge");
    if (avatarBadge && botConfig.avatar) {
      avatarBadge.childNodes[0].textContent = botConfig.avatar;
    }
    const inputEl = document.getElementById("nexus-user-input");
    if (inputEl && botConfig.placeholderText) {
      inputEl.placeholder = botConfig.placeholderText;
    }
  }

  updateThemeVariables();
  updatePosition();

  const style = document.createElement("style");
  style.id = "nexus-widget-styles";
  style.textContent = `
    #nexus-chatbot-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      left: auto;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      box-sizing: border-box;
    }
    #nexus-chatbot-widget-container.nexus-pos-top #nexus-widget-window {
      top: 78px !important;
      bottom: auto !important;
    }

    #nexus-chatbot-widget-container * {
      box-sizing: border-box;
    }

    /* Floating Action Launcher */
    #nexus-widget-launcher {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-primary-dark) 100%);
      box-shadow: 0 10px 28px -4px var(--nexus-primary-glow), 0 4px 16px rgba(0, 0, 0, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      border: 1.5px solid rgba(255, 255, 255, 0.22);
      outline: none;
      user-select: none;
      position: relative;
    }
    #nexus-widget-launcher::before {
      content: "";
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 2px solid var(--nexus-primary);
      opacity: 0;
      animation: nexusHaloPulse 3s infinite cubic-bezier(0.24, 0, 0.38, 1);
      pointer-events: none;
    }
    @keyframes nexusHaloPulse {
      0% { transform: scale(0.94); opacity: 0.65; }
      50% { transform: scale(1.22); opacity: 0; }
      100% { transform: scale(1.22); opacity: 0; }
    }
    #nexus-widget-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 14px 34px -4px var(--nexus-primary-glow), 0 6px 20px rgba(0, 0, 0, 0.8);
    }
    #nexus-widget-launcher:active {
      transform: scale(0.95);
    }

    /* Chat Window Container - Luxury Pitch Black */
    #nexus-widget-window {
      display: none;
      position: absolute;
      bottom: 78px;
      right: 0;
      left: auto;
      width: 388px;
      max-width: calc(100vw - 32px);
      height: 610px;
      max-height: min(650px, calc(100vh - 105px));
      background: #0A0A0A;
      border-radius: 24px;
      box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.9), 0 12px 28px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px #222222;
      overflow: hidden;
      flex-direction: column;
      border: 1px solid #262626;
      animation: nexusPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #nexus-chatbot-widget-container.nexus-pos-left #nexus-widget-window {
      left: 0 !important;
      right: auto !important;
    }
    @keyframes nexusPopIn {
      0% { opacity: 0; transform: translateY(18px) scale(0.96); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Header with Pitch Black & Gold Ambient Glow */
    .nexus-header {
      background: linear-gradient(180deg, #161616 0%, #0D0D0D 100%);
      color: #ffffff;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid #222222;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
      flex-shrink: 0;
    }
    .nexus-header::before {
      content: "";
      position: absolute;
      top: -40px;
      right: -20px;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, var(--nexus-primary-soft) 0%, rgba(0, 0, 0, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .nexus-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 2;
    }
    .nexus-avatar-badge {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: rgba(182, 138, 85, 0.14);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1.5px solid rgba(182, 138, 85, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      flex-shrink: 0;
    }
    .nexus-avatar-status {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 12px;
      height: 12px;
      background: #22c55e;
      border: 2px solid #0A0A0A;
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
      animation: nexusPulseStatus 2.2s infinite ease-in-out;
    }
    @keyframes nexusPulseStatus {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
    }
    .nexus-header-title {
      font-weight: 700;
      font-size: 15px;
      line-height: 1.25;
      letter-spacing: -0.015em;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    .nexus-header-status {
      font-size: 11px;
      color: #9CA3AF;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
      font-weight: 450;
    }
    .nexus-status-dot {
      width: 6.5px;
      height: 6.5px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 6px #22c55e;
    }

    /* Action Buttons in Header */
    .nexus-btn-icon {
      background: #1A1A1A;
      border: 1px solid #2B2B2B;
      color: #D1D5DB;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 0;
      position: relative;
      z-index: 2;
    }
    .nexus-btn-icon:hover {
      background: #252525;
      color: #ffffff;
      border-color: #383838;
      transform: scale(1.08);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }
    .nexus-btn-icon:active {
      transform: scale(0.94);
    }

    /* Message Canvas Area - Pure Pitch Black */
    .nexus-messages {
      flex: 1;
      padding: 18px 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #0A0A0A;
      scroll-behavior: smooth;
    }
    .nexus-messages::-webkit-scrollbar {
      width: 5px;
    }
    .nexus-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .nexus-messages::-webkit-scrollbar-thumb {
      background: #262626;
      border-radius: 10px;
    }
    .nexus-messages::-webkit-scrollbar-thumb:hover {
      background: #383838;
    }

    /* Message Rows and Bubbles */
    .nexus-msg-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      width: 100%;
      animation: nexusFadeSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .nexus-msg-row-bot {
      justify-content: flex-start;
    }
    .nexus-msg-row-user {
      justify-content: flex-end;
    }
    @keyframes nexusFadeSlide {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nexus-bot-avatar-mini {
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: #141414;
      border: 1px solid #282828;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      margin-bottom: 2px;
    }
    .nexus-msg-content-wrap {
      max-width: 84%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nexus-msg {
      padding: 12px 16px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
      position: relative;
    }
    .nexus-msg-bot {
      background: #141414;
      color: #F3F4F6;
      border: 1px solid #262626;
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    }
    .nexus-msg-user {
      background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-primary-dark) 100%);
      color: #ffffff !important;
      border-radius: 18px 18px 4px 18px;
      box-shadow: 0 4px 16px -2px var(--nexus-primary-glow), 0 2px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.15);
      max-width: 82%;
      margin-left: auto;
    }
    .nexus-msg-user,
    .nexus-msg-user * {
      color: #ffffff !important;
    }
    .nexus-msg-user a {
      color: #ffffff !important;
      text-decoration: underline !important;
      font-weight: 600 !important;
      word-break: break-all !important;
    }
    .nexus-msg-user strong {
      color: #ffffff !important;
      font-weight: 700 !important;
    }

    /* Quick Replies Pills - Dark Luxury Theme (Zero Blue) */
    .nexus-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 6px;
    }
    .nexus-quick-reply-btn {
      background: #161616;
      color: #E5E7EB;
      border: 1px solid #2C2C2C;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    }
    .nexus-quick-reply-btn:hover {
      border-color: var(--nexus-primary);
      color: #ffffff;
      background: rgba(182, 138, 85, 0.16);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px -2px var(--nexus-primary-glow);
    }
    .nexus-quick-reply-btn:active {
      transform: translateY(0);
      background: rgba(182, 138, 85, 0.25);
    }
    .nexus-quick-reply-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      border-color: #222222;
      color: #666666;
      background: #111111;
      transform: none;
      box-shadow: none;
    }

    #nexus-chatbot-widget-container strong,
    #nexus-chatbot-widget-container b,
    .nexus-msg strong,
    .nexus-msg b,
    .nexus-msg-bot strong,
    .nexus-msg-bot b {
      font-weight: 700 !important;
      color: #FFFFFF !important;
      opacity: 1 !important;
      filter: none !important;
      -webkit-text-fill-color: #FFFFFF !important;
      display: inline !important;
    }
    .nexus-msg-bot a {
      color: var(--nexus-primary) !important;
      font-weight: 600 !important;
      text-decoration: underline !important;
    }
    .nexus-source-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 10.5px;
      color: #9CA3AF;
      background: #1A1A1A;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #2B2B2B;
    }

    /* Input Dock and Capsule */
    .nexus-input-bar {
      padding: 12px 14px;
      background: #0D0D0D;
      border-top: 1px solid #1F1F1F;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }
    .nexus-input {
      flex: 1;
      border: 1.5px solid #262626;
      border-radius: 24px;
      padding: 11px 18px;
      font-size: 13.5px;
      outline: none;
      background: #141414;
      color: #FFFFFF;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .nexus-input::placeholder {
      color: #6B7280;
      font-size: 13px;
    }
    .nexus-input:focus {
      border-color: var(--nexus-primary);
      background: #181818;
      box-shadow: 0 0 0 3px var(--nexus-primary-soft);
    }
    .nexus-send-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-primary-dark) 100%);
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      flex-shrink: 0;
      box-shadow: 0 4px 14px -2px var(--nexus-primary-glow);
    }
    .nexus-send-btn:hover {
      transform: scale(1.08) rotate(-4deg);
      box-shadow: 0 6px 18px -2px var(--nexus-primary-glow);
    }
    .nexus-send-btn:active {
      transform: scale(0.94);
    }
    .nexus-send-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Elegant Confirmation Overlay */
    .nexus-confirm-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: nexusFadeIn 0.2s ease-out;
    }
    .nexus-confirm-card {
      background: #141414;
      border-radius: 24px;
      padding: 26px 22px;
      width: 100%;
      max-width: 305px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      text-align: center;
      animation: nexusScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .nexus-confirm-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--nexus-primary, #B68A55) 0%, var(--nexus-primary-dark, #8E6838) 100%);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px -2px var(--nexus-primary-glow, rgba(182, 138, 85, 0.45));
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      margin: 0 auto 12px auto;
    }
    .nexus-confirm-title {
      font-size: 16px;
      font-weight: 700;
      color: #FFFFFF;
      margin-top: 4px;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }
    .nexus-confirm-desc {
      font-size: 12.5px;
      color: #9CA3AF;
      line-height: 1.5;
      margin-bottom: 22px;
    }
    .nexus-confirm-actions {
      display: flex;
      gap: 10px;
    }
    .nexus-confirm-btn {
      flex: 1;
      padding: 11px 14px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .nexus-confirm-cancel {
      background: #1F1F1F;
      color: #D1D5DB;
      border: 1px solid #333333;
    }
    .nexus-confirm-cancel:hover {
      background: #2A2A2A;
      color: #FFFFFF;
      border-color: #444444;
    }
    .nexus-confirm-ok {
      background: linear-gradient(135deg, var(--nexus-primary, #B68A55) 0%, var(--nexus-primary-dark, #8E6838) 100%);
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 16px var(--nexus-primary-glow, rgba(182, 138, 85, 0.45));
    }
    .nexus-confirm-ok:hover {
      opacity: 0.94;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--nexus-primary-glow, rgba(182, 138, 85, 0.6));
    }
    @keyframes nexusFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes nexusScaleUp {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Typing Indicator Wave */
    .nexus-typing {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 10px 16px;
      background: #141414;
      border: 1px solid #262626;
      border-radius: 18px 18px 18px 4px;
      width: fit-content;
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.4);
    }
    .nexus-dot {
      width: 6.5px;
      height: 6.5px;
      background: var(--nexus-primary);
      border-radius: 50%;
      opacity: 0.8;
      animation: nexusBounce 1.4s infinite ease-in-out both;
    }
    .nexus-dot:nth-child(1) { animation-delay: -0.32s; }
    .nexus-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes nexusBounce {
      0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Branding Footer */
    #nexus-branding-footer {
      text-align: center;
      padding: 7px 12px;
      font-size: 11px;
      color: #6B7280;
      background: #0D0D0D;
      border-top: 1px solid #1A1A1A;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      letter-spacing: 0.01em;
    }
    #nexus-branding-footer a {
      color: var(--nexus-primary);
      text-decoration: none;
      font-weight: 650;
      transition: opacity 0.15s ease;
    }
    #nexus-branding-footer a:hover {
      text-decoration: underline;
      opacity: 0.85;
    }

    @media (max-width: 480px) {
      #nexus-chatbot-widget-container {
        bottom: 16px;
        right: 16px;
        left: auto;
      }
      #nexus-chatbot-widget-container.nexus-pos-left {
        left: 16px !important;
        right: auto !important;
      }
      #nexus-widget-window {
        width: calc(100vw - 32px);
        height: min(580px, 84vh);
        bottom: 74px;
        right: 0;
        left: auto;
        border-radius: 20px;
      }
      #nexus-chatbot-widget-container.nexus-pos-left #nexus-widget-window {
        left: 0 !important;
        right: auto !important;
      }
    }

    /* 19 Launcher Button Attention Animations (Font Awesome Parity) */
    @keyframes fa-beat { 0%, 90% { transform: scale(1); } 45% { transform: scale(1.18); } }
    @keyframes fa-beat-fade { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
    @keyframes fa-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @keyframes fa-bounce { 0%, 15%, 100% { transform: translateY(0); } 35% { transform: translateY(-12px); } 55% { transform: translateY(0); } 70% { transform: translateY(-6px); } 85% { transform: translateY(0); } }
    @keyframes fa-flip { 0% { transform: perspective(400px) rotateY(0deg); } 50% { transform: perspective(400px) rotateY(180deg); } 100% { transform: perspective(400px) rotateY(0deg); } }
    @keyframes fa-flip-360 { 0% { transform: perspective(400px) rotateY(0deg); } 100% { transform: perspective(400px) rotateY(360deg); } }
    @keyframes fa-shake { 0%, 100% { transform: rotate(0deg); } 15% { transform: rotate(-12deg); } 30% { transform: rotate(10deg); } 45% { transform: rotate(-8deg); } 60% { transform: rotate(6deg); } 75% { transform: rotate(-3deg); } 85% { transform: rotate(0deg); } }
    @keyframes fa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes fa-spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
    @keyframes fa-buzz { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-2px, -1px); } 20% { transform: translate(2px, 1px); } 30% { transform: translate(-2px, 1px); } 40% { transform: translate(2px, -1px); } 50% { transform: translate(-1px, 1px); } 60% { transform: translate(1px, -1px); } 70% { transform: translate(-1px, -1px); } 80% { transform: translate(1px, 1px); } 90% { transform: translate(0, 0); } }
    @keyframes fa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes fa-jello { 0%, 100% { transform: scale3d(1, 1, 1); } 30% { transform: scale3d(1.18, 0.82, 1); } 40% { transform: scale3d(0.82, 1.18, 1); } 50% { transform: scale3d(1.1, 0.9, 1); } 65% { transform: scale3d(0.95, 1.05, 1); } 75% { transform: scale3d(1.02, 0.98, 1); } }
    @keyframes fa-swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 0%, 100% { transform: rotate(0deg); } }
    @keyframes fa-wag { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(14deg); } 75% { transform: rotate(-14deg); } }

    #nexus-widget-launcher.fa-anim-none { animation: none !important; }
    #nexus-widget-launcher.fa-anim-beat { animation: fa-beat 1.4s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-beat-fade { animation: fa-beat-fade 1.6s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-fade { animation: fa-fade 2s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-bounce { animation: fa-bounce 1.8s ease infinite !important; }
    #nexus-widget-launcher.fa-anim-flip { animation: fa-flip 2.4s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-flip-360 { animation: fa-flip-360 2s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-shake { animation: fa-shake 2.2s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-spin { animation: fa-spin 2s linear infinite !important; }
    #nexus-widget-launcher.fa-anim-spin-reverse { animation: fa-spin-reverse 2s linear infinite !important; }
    #nexus-widget-launcher.fa-anim-spin-pulse { animation: fa-spin 1.2s steps(8) infinite !important; }
    #nexus-widget-launcher.fa-anim-spin-snap { animation: fa-spin 1.4s steps(2) infinite !important; }
    #nexus-widget-launcher.fa-anim-spin-snap-4 { animation: fa-spin 1.6s steps(4) infinite !important; }
    #nexus-widget-launcher.fa-anim-spin-snap-8 { animation: fa-spin 1.6s steps(8) infinite !important; }
    #nexus-widget-launcher.fa-anim-buzz { animation: fa-buzz 1.8s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-float { animation: fa-float 2.6s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-jello { animation: fa-jello 2s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-swing { transform-origin: top center !important; animation: fa-swing 2.2s ease-in-out infinite !important; }
    #nexus-widget-launcher.fa-anim-wag { transform-origin: bottom center !important; animation: fa-wag 1.8s ease-in-out infinite !important; }
  `;
  document.head.appendChild(style);

  // 5. Render Launcher Button
  const launcher = document.createElement("button");
  launcher.id = "nexus-widget-launcher";
  launcher.setAttribute("type", "button");
  launcher.setAttribute("aria-label", "Open chat assistant");
  launcher.innerHTML = `
    <div id="nexus-icon-open" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; pointer-events:none;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
    <div id="nexus-icon-close" style="display:none; align-items:center; justify-content:center; width:100%; height:100%; pointer-events:none;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;

  // 6. Render Chat Window
  const chatWindow = document.createElement("div");
  chatWindow.id = "nexus-widget-window";
  chatWindow.innerHTML = `
    <div class="nexus-header" id="nexus-header">
      <div class="nexus-header-info">
        <div class="nexus-avatar-badge" id="nexus-avatar-badge">
          ${botConfig.avatar || "🤖"}
          <span class="nexus-avatar-status"></span>
        </div>
        <div>
          <div class="nexus-header-title" id="nexus-header-title">${botConfig.name}</div>
          <div class="nexus-header-status">
            <span class="nexus-status-dot"></span>
            <span>Online • Instant AI responses</span>
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button id="nexus-refresh-btn" class="nexus-btn-icon" aria-label="Restart chat" title="Start new conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
        <button id="nexus-close-btn" class="nexus-btn-icon" aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="nexus-messages" id="nexus-messages-list"></div>

    <form class="nexus-input-bar" id="nexus-input-form" onsubmit="return false;">
      <input type="text" id="nexus-user-input" class="nexus-input" placeholder="${botConfig.placeholderText}" autocomplete="off" />
      <button type="submit" id="nexus-send-button" class="nexus-send-btn" aria-label="Send message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </form>

    ${
      botConfig.brandingEnabled
        ? `<div id="nexus-branding-footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7;">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>Powered by <a href="${apiBase}" target="_blank" rel="noopener noreferrer">NexusAI</a></span>
           </div>`
        : ""
    }
  `;

  container.appendChild(chatWindow);
  container.appendChild(launcher);
  document.body.appendChild(container);

  // 7. Dynamic Style Applier
  function updateLauncher() {
    const launcherEl = document.getElementById("nexus-widget-launcher");
    if (!launcherEl) return;
    updatePosition();

    const shape = (botConfig.launcherShape || "circle").toLowerCase();
    let size = 62;
    const rawSize = String(botConfig.launcherSize || "medium").toLowerCase();
    if (rawSize === "compact" || rawSize === "52" || rawSize === "52px" || rawSize === "small") {
      size = 52;
    } else if (rawSize === "large" || rawSize === "72" || rawSize === "72px") {
      size = 72;
    } else if (!isNaN(parseInt(rawSize, 10)) && parseInt(rawSize, 10) >= 36) {
      size = parseInt(rawSize, 10);
    }

    const iconType = botConfig.launcherIcon || "bubble";
    const rawLogo = (botConfig.launcherLogoUrl || "").trim();
    const logoUrl = rawLogo
      ? (rawLogo.startsWith("/") && !rawLogo.startsWith("//") ? `${apiBase}${rawLogo}` : rawLogo)
      : "";
    const launcherText = (botConfig.launcherText || "").trim();

    const primary = sanitizeColor(botConfig.primaryColor || "#B68A55");
    const darker = adjustColorBrightness(primary, -26);
    const glow = hexToRgba(primary, 0.45);

    launcherEl.style.setProperty("background", `linear-gradient(135deg, ${primary} 0%, ${darker} 100%)`, "important");
    launcherEl.style.setProperty("box-shadow", `0 10px 28px -4px ${glow}, 0 4px 16px rgba(0, 0, 0, 0.7)`, "important");
    launcherEl.style.setProperty("border-radius", shape === "squircle" ? "18px" : shape === "pill" ? "9999px" : "50%", "important");
    launcherEl.style.setProperty("width", shape === "pill" ? "auto" : `${size}px`, "important");
    launcherEl.style.setProperty("height", `${size}px`, "important");
    launcherEl.style.setProperty("min-width", shape === "pill" ? "auto" : `${size}px`, "important");
    launcherEl.style.setProperty("min-height", `${size}px`, "important");
    launcherEl.style.setProperty("padding", shape === "pill" ? "0 22px" : "0", "important");

    // Dynamic Launcher Animation (19 Font Awesome Options)
    const anim = (botConfig.launcherAnimation || "none").toLowerCase().trim();
    const allAnimClasses = [
      "fa-anim-none", "fa-anim-beat", "fa-anim-beat-fade", "fa-anim-fade", "fa-anim-bounce",
      "fa-anim-flip", "fa-anim-flip-360", "fa-anim-shake", "fa-anim-spin",
      "fa-anim-spin-reverse", "fa-anim-spin-pulse", "fa-anim-spin-snap",
      "fa-anim-spin-snap-4", "fa-anim-spin-snap-8", "fa-anim-buzz",
      "fa-anim-float", "fa-anim-jello", "fa-anim-swing", "fa-anim-wag"
    ];
    allAnimClasses.forEach((cls) => launcherEl.classList.remove(cls));
    if (!isOpen && anim && anim !== "none" && anim !== "no-animation") {
      launcherEl.classList.add(`fa-anim-${anim}`);
    }

    const chatWin = document.getElementById("nexus-widget-window");
    if (chatWin) {
      const isTop = (botConfig.launcherPosition || "bottom-right").toLowerCase().includes("top");
      if (isTop) {
        chatWin.style.setProperty("top", `${size + 16}px`, "important");
        chatWin.style.setProperty("bottom", "auto", "important");
      } else {
        chatWin.style.setProperty("bottom", `${size + 16}px`, "important");
        chatWin.style.setProperty("top", "auto", "important");
      }
    }

    const iconOpen = document.getElementById("nexus-icon-open");
    if (iconOpen) {
      let iconHtml = "";
      if (logoUrl) {
        iconHtml = `<img src="${logoUrl}" alt="${botConfig.name}" style="width:${Math.round(size * 0.58)}px; height:${Math.round(size * 0.58)}px; object-fit:contain; border-radius:6px; display:inline-block;" onerror="this.style.display='none'" />`;
      } else if (iconType === "avatar") {
        iconHtml = `<span style="font-size:${Math.round(size * 0.44)}px; line-height:1; display:inline-block;">${botConfig.avatar || "🤖"}</span>`;
      } else if (iconType === "robot") {
        iconHtml = `<svg width="${Math.round(size * 0.44)}" height="${Math.round(size * 0.44)}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"></rect>
          <circle cx="12" cy="5" r="2"></circle>
          <path d="M12 7v4"></path>
          <line x1="8" y1="16" x2="8" y2="16"></line>
          <line x1="16" y1="16" x2="16" y2="16"></line>
        </svg>`;
      } else if (iconType === "sparkles") {
        iconHtml = `<svg width="${Math.round(size * 0.44)}" height="${Math.round(size * 0.44)}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
        </svg>`;
      } else if (iconType === "headset") {
        iconHtml = `<svg width="${Math.round(size * 0.44)}" height="${Math.round(size * 0.44)}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path>
        </svg>`;
      } else {
        iconHtml = `<svg width="${Math.round(size * 0.44)}" height="${Math.round(size * 0.44)}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>`;
      }

      const textHtml = (shape === "pill" && launcherText)
        ? `<span style="color:#ffffff; font-weight:700; font-size:13px; margin-left:8px; white-space:nowrap;">${launcherText}</span>`
        : "";

      iconOpen.innerHTML = `${iconHtml}${textHtml}`;
    }
  }

  function applyTheme() {
    updateThemeVariables();
    updateLauncher();

    const title = document.getElementById("nexus-header-title");
    if (title) title.textContent = botConfig.name;

    const avatar = document.getElementById("nexus-avatar-badge");
    if (avatar) {
      avatar.innerHTML = `${botConfig.avatar || "🤖"}<span class="nexus-avatar-status"></span>`;
    }

    const brandingLink = document.querySelector("#nexus-branding-footer a");
    if (brandingLink) brandingLink.style.color = botConfig.primaryColor;
  }

  function formatMessage(text, isUser = false) {
    if (!text || typeof text !== "string") return "";
    let html = text;

    if (isUser) {
      // Safe HTML escaping for user messages
      html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Auto-link standalone URLs in user bubble with WHITE text
      html = html.replace(
        /(https?:\/\/[^\s<)]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#ffffff!important;text-decoration:underline;font-weight:600;word-break:break-all;">$1</a>'
      );

      // Newlines to <br/>
      return html.replace(/\n/g, "<br/>");
    }

    // Filter out leaked system prompt directives or meta headers
    html = html.replace(/^(?:(?:You are|The visitor is|The user is)\s+writing in[^\n]*\n*)+/gim, "");
    html = html.replace(/^(?:VISITOR\s*(?:IDENTITY|DETAILS)?:?[^\n]*\n*)+/gim, "");
    html = html.replace(/^(?:MANDATORY\s+)?[A-Z0-9_\s-]+(?:RULE|DIRECTIVE|INSTRUCTION):[^\n]*\n*/gim, "");
    html = html.replace(/^[•*-]\s*(?:If the visitor|Greet them|Whenever a visitor|The visitor|You MUST)[^\n]*\n*/gim, "");
    html = html.replace(/^Greet them warmly[^\n]*\n*/gim, "");
    html = html.replace(/^Example:\s*"[^"]*"\s*\n*/gim, "");
    html = html.replace(/^(?:Language & Tone|Core Rules|Verified Knowledge|WHO WE ARE|PUBLIC COMPANY CONTACT|GUIDELINES|ABOUT EMPEROR SMART SOLUTIONS)[^\n]*\n*/gim, "");
    html = html.replace(/^Hello!\s*Welcome to Emperor Smart Solutions\.\s*May I know your name and contact number[^\n]*\n+/gi, "");

    // Convert bold: ***text*** or **text** -> <strong style="font-weight:700!important;color:#0f172a!important;opacity:1!important;">text</strong>
    html = html.replace(/\*{2,3}([^*]+)\*{2,3}/g, '<strong style="font-weight:700!important;color:#ffffff!important;opacity:1!important;">$1</strong>');

    // Convert markdown links: [Title](https://...) -> <a href="https://..." target="_blank" rel="noopener noreferrer">Title</a>
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--nexus-primary);text-decoration:underline;font-weight:600;">$1</a>`);

    // Auto-link standalone https:// URLs
    html = html.replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, `$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--nexus-primary);text-decoration:underline;font-weight:600;">$2</a>`);

    // Bullet points: * Item or - Item
    html = html.replace(/^[*-]\s+(.+)$/gm, "• $1");

    // Newlines to <br/>
    html = html.replace(/\n/g, "<br/>");

    return html;
  }

  // 8. Render Message Feed
  function renderMessages() {
    const list = document.getElementById("nexus-messages-list");
    if (!list) return;

    list.innerHTML = "";

    // Welcome message if conversation is empty
    if (messages.length === 0) {
      const welcomeRow = document.createElement("div");
      welcomeRow.className = "nexus-msg-row nexus-msg-row-bot";

      const defaultServices = [
        "Website Development",
        "Mobile Application",
        "AI Chatbot & RAG",
        "Custom Software & ERP",
        "UI/UX Design",
        "Cloud & DevOps",
        "Hire Dedicated Developers",
      ];

      const servicesToShow =
        Array.isArray(botConfig.quickReplies) && botConfig.quickReplies.length > 0
          ? botConfig.quickReplies
          : defaultServices;

      welcomeRow.innerHTML = `
        <div class="nexus-bot-avatar-mini">${botConfig.avatar || "🤖"}</div>
        <div class="nexus-msg-content-wrap">
          <div class="nexus-msg nexus-msg-bot">${formatMessage(botConfig.welcomeMessage)}</div>
        </div>
      `;

      if (servicesToShow.length > 0) {
        const qrContainer = document.createElement("div");
        qrContainer.className = "nexus-quick-replies";
        servicesToShow.forEach((serviceText) => {
          const qrBtn = document.createElement("button");
          qrBtn.type = "button";
          qrBtn.className = "nexus-quick-reply-btn";
          qrBtn.textContent = serviceText;
          qrBtn.addEventListener("click", () => {
            qrContainer.querySelectorAll("button").forEach((b) => (b.disabled = true));
            sendMessage(serviceText);
          });
          qrContainer.appendChild(qrBtn);
        });
        welcomeRow.querySelector(".nexus-msg-content-wrap").appendChild(qrContainer);
      }
      list.appendChild(welcomeRow);
    }

    messages.forEach((m, idx) => {
      const isUser = m.role === "user";
      const row = document.createElement("div");
      row.className = `nexus-msg-row ${isUser ? "nexus-msg-row-user" : "nexus-msg-row-bot"}`;

      if (isUser) {
        row.innerHTML = `
          <div class="nexus-msg nexus-msg-user">
            ${formatMessage(m.content, true)}
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="nexus-bot-avatar-mini">${botConfig.avatar || "🤖"}</div>
          <div class="nexus-msg-content-wrap">
            <div class="nexus-msg nexus-msg-bot">${formatMessage(m.content, false)}</div>
          </div>
        `;

        if (idx === messages.length - 1 && m.quickReplies && Array.isArray(m.quickReplies) && m.quickReplies.length > 0) {
          const qrContainer = document.createElement("div");
          qrContainer.className = "nexus-quick-replies";
          m.quickReplies.forEach((qrText) => {
            const qrBtn = document.createElement("button");
            qrBtn.type = "button";
            qrBtn.className = "nexus-quick-reply-btn";
            qrBtn.textContent = qrText;
            qrBtn.addEventListener("click", () => {
              qrContainer.querySelectorAll("button").forEach((b) => (b.disabled = true));
              sendMessage(qrText);
            });
            qrContainer.appendChild(qrBtn);
          });
          row.querySelector(".nexus-msg-content-wrap").appendChild(qrContainer);
        }
      }

      list.appendChild(row);
    });

    if (isLoading) {
      const typingRow = document.createElement("div");
      typingRow.className = "nexus-msg-row nexus-msg-row-bot nexus-typing-row";
      typingRow.innerHTML = `
        <div class="nexus-bot-avatar-mini">${botConfig.avatar || "🤖"}</div>
        <div class="nexus-typing">
          <div class="nexus-dot"></div>
          <div class="nexus-dot"></div>
          <div class="nexus-dot"></div>
        </div>
      `;
      list.appendChild(typingRow);
    }

    list.scrollTop = list.scrollHeight;
  }

  // 9. Toggle Visibility
  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? "flex" : "none";
    const iconOpen = document.getElementById("nexus-icon-open");
    const iconClose = document.getElementById("nexus-icon-close");
    if (iconOpen) iconOpen.style.display = isOpen ? "none" : "flex";
    if (iconClose) iconClose.style.display = isOpen ? "flex" : "none";

    const launcherEl = document.getElementById("nexus-widget-launcher");
    if (launcherEl) {
      const anim = (botConfig.launcherAnimation || "none").toLowerCase().trim();
      const allAnimClasses = [
        "fa-anim-none", "fa-anim-beat", "fa-anim-beat-fade", "fa-anim-fade", "fa-anim-bounce",
        "fa-anim-flip", "fa-anim-flip-360", "fa-anim-shake", "fa-anim-spin",
        "fa-anim-spin-reverse", "fa-anim-spin-pulse", "fa-anim-spin-snap",
        "fa-anim-spin-snap-4", "fa-anim-spin-snap-8", "fa-anim-buzz",
        "fa-anim-float", "fa-anim-jello", "fa-anim-swing", "fa-anim-wag"
      ];
      allAnimClasses.forEach((cls) => launcherEl.classList.remove(cls));
      if (!isOpen && anim && anim !== "none" && anim !== "no-animation") {
        launcherEl.classList.add(`fa-anim-${anim}`);
      }
    }

    if (isOpen) {
      renderMessages();
      setTimeout(() => {
        const inp = document.getElementById("nexus-user-input");
        if (inp) inp.focus();
      }, 100);
    }
  }

  function showInChatConfirm(message, onConfirm) {
    // Remove any existing overlay
    const existing = chatWindow.querySelector(".nexus-confirm-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "nexus-confirm-overlay";
    overlay.innerHTML = `
      <div class="nexus-confirm-card">
        <div class="nexus-confirm-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </div>
        <div class="nexus-confirm-title">New Conversation</div>
        <div class="nexus-confirm-desc">${message || "Would you like to clear the current chat and start fresh?"}</div>
        <div class="nexus-confirm-actions">
          <button type="button" class="nexus-confirm-btn nexus-confirm-cancel" id="nexus-confirm-cancel">Cancel</button>
          <button type="button" class="nexus-confirm-btn nexus-confirm-ok" id="nexus-confirm-ok">Start New</button>
        </div>
      </div>
    `;

    chatWindow.appendChild(overlay);

    overlay.querySelector("#nexus-confirm-cancel").addEventListener("click", () => {
      overlay.remove();
    });

    overlay.querySelector("#nexus-confirm-ok").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
  }

  launcher.addEventListener("click", toggleChat);
  document.getElementById("nexus-close-btn")?.addEventListener("click", toggleChat);

  document.getElementById("nexus-refresh-btn")?.addEventListener("click", () => {
    showInChatConfirm("Start a new chat conversation? Your previous messages will be cleared.", () => {
      const headers = {};
      if (visitorToken) headers["x-visitor-token"] = visitorToken;

      fetch(`${apiBase}/api/public/chat/${encodeURIComponent(botId)}/session`, {
        method: "DELETE",
        credentials: "include",
        headers,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.conversationId) {
            activeSessionId = data.conversationId;
            try { sessionStorage.setItem(`${sessionKey}_id`, activeSessionId); } catch (e) {}
          } else {
            activeSessionId = `visitor_${botId}_${Date.now()}`;
            try { sessionStorage.setItem(`${sessionKey}_id`, activeSessionId); } catch (e) {}
          }
          messages = [];
          try { sessionStorage.removeItem(sessionKey); } catch (e) {}
          renderMessages();
        })
        .catch(() => {
          activeSessionId = `visitor_${botId}_${Date.now()}`;
          messages = [];
          try { sessionStorage.removeItem(sessionKey); } catch (e) {}
          renderMessages();
        });
    });
  });

  // 10. Chat Inference with Real-Time SSE Streaming
  async function sendMessage(explicitText) {
    const input = document.getElementById("nexus-user-input");
    const sendBtn = document.getElementById("nexus-send-button");
    const text = (typeof explicitText === "string" ? explicitText : input.value).trim();
    if (!text || isLoading) return;

    if (!explicitText) {
      input.value = "";
    }
    messages.push({ role: "user", content: text });
    isLoading = true;
    if (sendBtn) sendBtn.disabled = true;
    renderMessages();

    try {
      const headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream, application/json",
      };
      if (visitorToken) headers["x-visitor-token"] = visitorToken;

      const res = await fetch(`${apiBase}/api/public/chat/${encodeURIComponent(botId)}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8),
          sessionId: activeSessionId,
          visitorToken: visitorToken || undefined,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      // Stream handling (SSE)
      if (contentType.includes("text/event-stream") && res.body) {
        isLoading = false;
        const botMsg = { role: "assistant", content: "", quickReplies: [] };
        messages.push(botMsg);
        renderMessages();

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const payload = trimmed.slice(6);
              if (payload === "[DONE]") break;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.token) {
                  botMsg.content += parsed.token;
                  const msgs = chatWindow.querySelectorAll(".nexus-msg-bot");
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg) lastMsg.innerHTML = formatMessage(botMsg.content);
                  const list = document.getElementById("nexus-messages-list");
                  if (list) list.scrollTop = list.scrollHeight;
                }
                if (parsed.quickReplies && Array.isArray(parsed.quickReplies)) {
                  botMsg.quickReplies = parsed.quickReplies;
                  renderMessages();
                }
              } catch (e) {}
            }
          }
        }
      } else {
        if (!res.ok) {
          let errText = "I'm currently assisting multiple visitors. Please ask your question again or leave your email for human follow-up.";
          try {
            const errData = await res.json();
            if (errData && errData.error) errText = errData.error;
          } catch (e) {
            try {
              const rawTxt = await res.text();
              if (rawTxt && rawTxt.trim()) errText = rawTxt.slice(0, 160);
            } catch (e2) {}
          }
          console.error("[NexusWidget] Server returned error status", res.status, errText);
          messages.push({
            role: "assistant",
            content: errText,
            sources: [],
          });
        } else {
          const data = await res.json();
          messages.push({
            role: "assistant",
            content: data.reply || "I am ready to assist you. What kind of digital project are you looking to create?",
            quickReplies: data.quickReplies || [],
            sources: data.sources || [],
          });
        }
        renderMessages();
      }
    } catch (e) {
      console.warn("[NexusWidget] Streaming fetch failed, attempting non-streaming fallback:", e);
      try {
        const fallbackRes = await fetch(`${apiBase}/api/public/chat/${encodeURIComponent(botId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-8),
            sessionId: activeSessionId,
            visitorToken: visitorToken || undefined,
            stream: false,
          }),
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          messages.push({
            role: "assistant",
            content: fbData.reply || "I am ready to assist you. What kind of digital project are you looking to create?",
            quickReplies: fbData.quickReplies || [],
            sources: fbData.sources || [],
          });
          renderMessages();
          return;
        }
      } catch (retryErr) {
        console.error("[NexusWidget] Fallback non-stream request also failed:", retryErr);
      }
      messages.push({
        role: "assistant",
        content: "I'm currently assisting multiple visitors. Please ask your question again or leave your email for human follow-up.",
      });
    } finally {
      isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(messages));
      } catch (e) {}
      renderMessages();
      const inp = document.getElementById("nexus-user-input");
      if (inp) inp.focus();
    }
  }

  const form = document.getElementById("nexus-input-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  // ESC to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      toggleChat();
    }
  });

  // Global window API for programmatic control
  window.NexusWidget = {
    open: () => { if (!isOpen) toggleChat(); },
    close: () => { if (isOpen) toggleChat(); },
    toggle: toggleChat,
    sendMessage: (msg) => {
      const input = document.getElementById("nexus-user-input");
      if (input) {
        input.value = msg;
        sendMessage();
      }
    },
  };
})();
