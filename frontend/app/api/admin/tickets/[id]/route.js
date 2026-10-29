import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { ticketsStore } from "@/lib/db/ticketsStore";

/**
 * PUT /api/admin/tickets/[id]
 * Super Admin: Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) or add admin notes
 */
export async function PUT(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { params } = context;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updated = ticketsStore.updateTicket(id, body);
    return NextResponse.json({
      success: true,
      ticket: updated,
      message: `Ticket #${id} status updated to ${updated.status}.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/tickets/[id]
 * Super Admin: Delete ticket
 */
export async function DELETE(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { params } = context;
    const { id } = await params;

    ticketsStore.deleteTicket(id);
    return NextResponse.json({ success: true, message: `Ticket #${id} deleted successfully.` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
