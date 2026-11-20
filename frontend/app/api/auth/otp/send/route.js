import { NextResponse } from "next/server";
import { otpStore } from "@/lib/auth/otpStore";
import { authStore } from "@/lib/db/authStore";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

export async function POST(request) {
  try {
    // 1. Per-IP SMS pumping protection
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("otp_send_ip", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const body = await request.json();
    const { phone, purpose = "registration", name } = body;

    if (!phone) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Mobile number is required." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    const rawDigits = String(phone).replace(/\D/g, "");
    if (rawDigits.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Anti-enumeration protection (SEC-03):
    // For password_reset, if phone not registered, return generic success without leaking existence or sending SMS
    if (purpose === "password_reset" || purpose === "forgot_password") {
      const exists = await authStore.checkPhoneExists(phone);
      if (!exists) {
        return applyRateLimitHeaders(
          NextResponse.json({
            success: true,
            message: `If an account is associated with this number, a verification code has been dispatched.`,
            phone,
            cooldownSeconds: 60,
          }),
          ipCheck.result
        );
      }
    }

    const result = await otpStore.sendOtp({ phone, purpose, name });

    if (!result.success) {
      const status = result.banned
        ? 403
        : result.cooldown
        ? 429
        : result.gatewayFailed
        ? 502
        : 400;
      const errRes = NextResponse.json(result, { status });
      if (result.cooldown && result.cooldownSeconds) {
        errRes.headers.set("Retry-After", String(result.cooldownSeconds));
      }
      return applyRateLimitHeaders(errRes, ipCheck.result);
    }

    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        message: result.message,
        phone: result.phone,
        messageId: result.messageId || null,
        provider: result.provider || "dlt_allsmssolution",
        latencyMs: result.latencyMs || null,
        cooldownSeconds: result.cooldownSeconds,
      }),
      ipCheck.result
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch OTP." },
      { status: 500 }
    );
  }
}
