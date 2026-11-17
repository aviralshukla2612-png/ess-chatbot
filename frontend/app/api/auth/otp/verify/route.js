import { NextResponse } from "next/server";
import { otpStore } from "@/lib/auth/otpStore";

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, otp, purpose = "registration" } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const result = await otpStore.verifyOtp({ phone, otp, purpose });

    if (!result.success) {
      const status = result.banned ? 403 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      phone: result.phone,
      verificationToken: result.verificationToken,
      message: result.message,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}

