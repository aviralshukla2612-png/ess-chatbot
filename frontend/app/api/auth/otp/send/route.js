import { NextResponse } from "next/server";
import { otpStore } from "@/lib/auth/otpStore";

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, purpose = "registration", name } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Mobile number is required." },
        { status: 400 }
      );
    }

    const result = await otpStore.sendOtp({ phone, purpose, name });

    if (!result.success) {
      const status = result.banned ? 403 : result.cooldown ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      phone: result.phone,
      cooldownSeconds: result.cooldownSeconds,
      debugOtp: result.debugOtp,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch OTP." },
      { status: 500 }
    );
  }
}

