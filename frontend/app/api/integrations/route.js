import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { botsStore } from "@/lib/db/botsStore";
import { queryDb } from "@/lib/db/dbPool";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const orgId = principal.organizationId;

    // 1. Bots check for widget and webhooks
    const orgBots = await botsStore.getBotsByOrganization(orgId);
    const botCount = orgBots?.length || 0;
    const botsWithWebhook = (orgBots || []).filter((b) => Boolean(b.webhookUrl));

    // 2. WhatsApp mapping check
    let whatsappConnected = false;
    let whatsappPhone = null;
    try {
      const waRes = await queryDb(
        'SELECT "phoneNumberId" FROM "WhatsAppMapping" WHERE "organizationId" = $1 LIMIT 1;',
        [orgId]
      );
      if (waRes.ok && waRes.rows.length > 0) {
        whatsappConnected = true;
        whatsappPhone = waRes.rows[0].phoneNumberId;
      }
    } catch (e) {
      // ignore
    }

    // 3. API Keys check
    let apiKeysCount = 0;
    try {
      const keyRes = await queryDb(
        'SELECT COUNT(*) as count FROM "ApiKey" WHERE "organizationId" = $1;',
        [orgId]
      );
      if (keyRes.ok && keyRes.rows.length > 0) {
        apiKeysCount = parseInt(keyRes.rows[0].count, 10) || 0;
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      integrations: [
        {
          id: "widget",
          name: "Website Floating Widget",
          desc: "Embed an interactive chat assistant with live streaming on any HTML, WordPress, or React site.",
          status: botCount > 0 ? "Active" : "Ready to Configure",
          statusType: botCount > 0 ? "active" : "inactive",
          details: botCount > 0 ? `${botCount} bot(s) ready to embed` : "Create your first bot to deploy",
          cta: "Configure Snippet",
          ctaHref: "/bots",
        },
        {
          id: "whatsapp",
          name: "WhatsApp Cloud API",
          desc: "Connect your official WhatsApp Business number to automate 24/7 customer sales inquiries.",
          status: whatsappConnected ? "Connected" : "Not Configured",
          statusType: whatsappConnected ? "active" : "inactive",
          details: whatsappConnected ? `Phone ID: ${whatsappPhone}` : "Meta Cloud API credentials required",
          cta: "Manage WhatsApp",
          ctaHref: "/bots",
        },
        {
          id: "webhook",
          name: "Outbound Webhooks",
          desc: "Stream qualified leads directly to your internal CRM, n8n workflows, or ERP database.",
          status: botsWithWebhook.length > 0 ? "Active" : "Not Configured",
          statusType: botsWithWebhook.length > 0 ? "active" : "inactive",
          details: botsWithWebhook.length > 0 ? `${botsWithWebhook.length} bot(s) forwarding leads` : "Add webhook URL in bot settings",
          cta: "Webhook Endpoints",
          ctaHref: "/bots",
        },
        {
          id: "rest",
          name: "Headless REST API",
          desc: "Direct JSON API for custom mobile apps, iOS, Android, and internal service backends.",
          status: apiKeysCount > 0 ? "Active" : "Not Generated",
          statusType: apiKeysCount > 0 ? "active" : "inactive",
          details: apiKeysCount > 0 ? `${apiKeysCount} API key(s) active` : "Generate an API key to connect",
          cta: "API Keys",
          ctaHref: "/settings",
        },
        {
          id: "slack",
          name: "Slack Lead Alerts",
          desc: "Receive instant notifications in your company sales channel when a visitor requests a quote.",
          status: "Coming Soon",
          statusType: "coming_soon",
          details: "Native Slack integration is on our roadmap",
          cta: "Coming Soon",
          ctaHref: "#",
        },
        {
          id: "ga4",
          name: "Google Analytics 4",
          desc: "Forward chatbot interaction and conversion goal events to your Google Analytics measurement ID.",
          status: "Coming Soon",
          statusType: "coming_soon",
          details: "Event forwarding integration is on our roadmap",
          cta: "Coming Soon",
          ctaHref: "#",
        },
      ],
    });
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_")) throw err;
    console.error("[INTEGRATIONS_GET_ERR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
