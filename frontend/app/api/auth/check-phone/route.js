import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone } = body || {};

    if (!phone) {
      return NextResponse.json({ exists: false, error: "Phone number required" }, { status: 400 });
    }

    const rawDigits = String(phone).replace(/\D/g, "");
    if (rawDigits.length < 10) {
      return NextResponse.json({ exists: false, valid: false });
    }

    const exists = await authStore.checkPhoneExists(phone);
    return NextResponse.json({
      success: true,
      exists: Boolean(exists),
      phone: rawDigits.slice(-10),
    });
  } catch (err) {
    return NextResponse.json({ exists: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ exists: false, error: "Phone parameter required" }, { status: 400 });
    }

    const rawDigits = String(phone).replace(/\D/g, "");
    if (rawDigits.length < 10) {
      return NextResponse.json({ exists: false, valid: false });
    }

    const exists = await authStore.checkPhoneExists(phone);
    return NextResponse.json({
      success: true,
      exists: Boolean(exists),
      phone: rawDigits.slice(-10),
    });
  } catch (err) {
    return NextResponse.json({ exists: false, error: err.message }, { status: 500 });
  }
}
