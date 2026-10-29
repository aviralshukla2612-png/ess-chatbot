import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { ticketsStore } from "@/lib/db/ticketsStore";

/**
 * GET /api/admin/tickets
 * Super Admin: List all customer support tickets
 */
export async function GET(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const tickets = ticketsStore.getTickets();
    return NextResponse.json({ success: true, tickets });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
