import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { ticketsStore } from "@/lib/db/ticketsStore";

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

    const ticket = ticketsStore.createTicket({
      organizationId: principal.organizationId,
      userEmail: principal.email,
      userName: principal.name || "Customer",
      subject,
      category,
      priority,
      message,
    });

    console.log(`[SUPPORT_TICKET_SUBMITTED] Ticket #${ticket.id} from ${principal.email}: ${subject}`);

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticket,
      message: `Your support ticket #${ticket.id} has been registered and forwarded to Super Admin. Our support team will reply to ${principal.email} shortly.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
