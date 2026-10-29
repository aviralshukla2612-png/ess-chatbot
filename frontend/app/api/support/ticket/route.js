import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json().catch(() => ({}));
    const {
      subject,
      category = "Technical Issue",
      priority = "Normal",
      message,
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticket = {
      id: ticketId,
      organizationId: principal.organizationId,
      userEmail: principal.email,
      userName: principal.name || "Customer",
      subject: subject.trim(),
      category,
      priority,
      message: message.trim(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    // In production this can notify Zendesk, Slack, or support email
    console.log(`[SUPPORT_TICKET_SUBMITTED] Ticket ${ticketId} from ${principal.email}: ${subject}`);

    return NextResponse.json({
      success: true,
      ticketId,
      ticket,
      message: `Your support ticket #${ticketId} has been registered. Our support team will reply to ${principal.email} shortly.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
