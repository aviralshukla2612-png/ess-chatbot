import { NextResponse } from "next/server";
import { GroqKeyPoolManager } from "@/lib/ai/groqKeyPool";
import { requireSuperAdmin } from "@/lib/auth/guard";

export async function GET(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const stats = GroqKeyPoolManager.getPoolStats();
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const action = body.action || "add";

    if (action === "add") {
      const { label, apiKey } = body;
      const created = GroqKeyPoolManager.addKey({ label, apiKey });
      return NextResponse.json({ ok: true, message: "API Key added to pool", key: created });
    }

    if (action === "toggle") {
      const { id, isActive } = body;
      const updated = GroqKeyPoolManager.toggleKey(id, isActive);
      return NextResponse.json({ ok: true, message: "API Key status updated", key: updated });
    }

    if (action === "reset") {
      const { id } = body;
      const reset = GroqKeyPoolManager.resetKeyStatus(id);
      return NextResponse.json({ ok: true, message: "Key cooldown reset", key: reset });
    }

    if (action === "delete") {
      const { id } = body;
      const removed = GroqKeyPoolManager.removeKey(id);
      return NextResponse.json({ ok: true, message: "API Key removed from pool", key: removed });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
