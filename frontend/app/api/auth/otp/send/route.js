import { NextResponse } from "next/server";
import { otpStore } from "@/lib/auth/otpStore";
import { otpQueue } from "@/lib/auth/otpQueue";
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

    const body = await request.json().catch(() => ({}));
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

    const cleanPhone = otpStore.normalizePhone(phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number format." },
        { status: 400 }
      );
    }

    // 2. Enforce per-phone cooldown and 24h ban consistently across all numbers
    const eligibility = await otpStore.checkCooldownAndBan(cleanPhone);
    if (!eligibility.ok) {
      const status = eligibility.banned ? 403 : 429;
      const errRes = NextResponse.json(
        {
          success: false,
          error: eligibility.error,
          cooldown: eligibility.cooldown || false,
          cooldownSeconds: eligibility.cooldownSeconds || 60,
          banned: eligibility.banned || false,
        },
        { status }
      );
      if (eligibility.cooldownSeconds) {
        errRes.headers.set("Retry-After", String(eligibility.cooldownSeconds));
      }
      return applyRateLimitHeaders(errRes, ipCheck.result);
    }

    // 3. SEC-03-B: Asynchronous dispatch for password reset (eliminates enumeration oracles)
    if (purpose === "password_reset" || purpose === "forgot_password") {
      // Record 60s cooldown immediately so repeated requests receive identical HTTP 429
      await otpStore.recordCooldown(cleanPhone);

      // Enqueue background dispatch job (verifies account existence and sends SMS asynchronously)
      await otpQueue.enqueue({ phone: cleanPhone, purpose, name });

      // Return standardized public response (sub-3ms, identical for registered & unregistered)
      return applyRateLimitHeaders(
        NextResponse.json({
          success: true,
          message: "If an account is associated with this number, a verification code has been dispatched.",
          phone: cleanPhone,
          cooldownSeconds: 60,
        }),
        ipCheck.result
      );
    }

    // 4. Registration and Login flows
    const result = await otpStore.sendOtp({ phone: cleanPhone, purpose, name });

    if (!result.success) {
      const status = result.banned
        ? 403
        : result.cooldown
        ? 429
        : result.gatewayFailed
        ? 502
        : 400;
      const errRes = NextResponse.json(
        {
          success: false,
          error: result.error || "Unable to dispatch verification code.",
          cooldown: result.cooldown || false,
          cooldownSeconds: result.cooldownSeconds || 60,
          banned: result.banned || false,
        },
        { status }
      );
      if (result.cooldown && result.cooldownSeconds) {
        errRes.headers.set("Retry-After", String(result.cooldownSeconds));
      }
      return applyRateLimitHeaders(errRes, ipCheck.result);
    }

    // Return standardized response WITHOUT sensitive provider metadata (SEC-03-B)
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        message: result.message || "A verification code has been dispatched to your mobile number.",
        phone: cleanPhone,
        cooldownSeconds: result.cooldownSeconds || 60,
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
