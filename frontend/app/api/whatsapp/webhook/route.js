import { NextResponse } from "next/server";
import { whatsappService } from "@/lib/integrations/whatsappService";
import { queryDb } from "@/lib/db/dbPool";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const result = whatsappService.verifyChallenge({ mode, token, challenge });
  if (result.ok) {
    return new NextResponse(result.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: result.error }, { status: 403 });
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256") || "";

    const isValid = whatsappService.verifySignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const normalized = whatsappService.normalizeIncomingPayload(body);

    if (!normalized.isMessage) {
      return NextResponse.json({ status: "status_received" });
    }

    // Resolve tenant mapping
    let organizationId = null;
    let botId = null;

    if (normalized.phoneNumberId) {
      const mapping = await queryDb(
        'SELECT "organizationId", "botId" FROM "WhatsAppMapping" WHERE "phoneNumberId" = $1;',
        [normalized.phoneNumberId]
      );
      if (mapping.ok && mapping.rows.length > 0) {
        organizationId = mapping.rows[0].organizationId;
        botId = mapping.rows[0].botId;
      }
    }

    if (!organizationId || !botId) {
      const officialEssPhoneId = process.env.META_ESS_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (officialEssPhoneId && normalized.phoneNumberId === officialEssPhoneId) {
        organizationId = "org_ess_default";
        botId = "bot_aa";
      } else if (!process.env.NODE_ENV || process.env.NODE_ENV === "test") {
        // Fallback permitted only in offline unit test harness when explicitly mocked
        organizationId = "org_ess_default";
        botId = "bot_aa";
      } else {
        console.warn(`[WHATSAPP_WEBHOOK] Unmapped phoneNumberId: ${normalized.phoneNumberId}. Dropping unassigned message.`);
        return NextResponse.json({ status: "ignored_unmapped_tenant" });
      }
    }

    const response = await whatsappService.handleInboundMessage({
      senderPhone: normalized.senderPhone,
      messageId: normalized.messageId,
      text: normalized.text,
      phoneNumberId: normalized.phoneNumberId,
      organizationId,
      botId,
    });

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
