import { NextResponse } from "next/server";
import { otpStore } from "@/lib/auth/otpStore";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

export async function POST(request) {
  try {
    // 1. Per-IP OTP brute-force / lockout-griefing protection
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("otp_verify_ip", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const body = await request.json();
    const { phone, otp, purpose = "registration" } = body;

    if (!phone || !otp) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Mobile number and 6-digit OTP code are required." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    const result = await otpStore.verifyOtp({ phone, otp, purpose });

    if (!result.success) {
      const status = result.banned ? 403 : 400;
      return applyRateLimitHeaders(NextResponse.json(result, { status }), ipCheck.result);
    }

    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        verified: true,
        phone: result.phone,
        verificationToken: result.verificationToken,
        message: result.message,
      }),
      ipCheck.result
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
