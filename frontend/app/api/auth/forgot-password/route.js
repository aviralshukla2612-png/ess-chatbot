import { NextResponse } from "next/server";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";
import { authStore } from "@/lib/db/authStore";
import { otpStore } from "@/lib/auth/otpStore";

/**
 * POST /api/auth/forgot-password
 * Rate-limited account recovery & password reset endpoint.
 */
export async function POST(request) {
  try {
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("password_reset", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const body = await request.json().catch(() => ({}));
    const { phone, password, verificationToken, email } = body;

    // Case 1: Mobile OTP-Verified Password Reset
    if (phone) {
      const rawDigits = String(phone).replace(/\D/g, "");
      if (rawDigits.length < 10) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: "Please enter a valid 10-digit mobile number." },
            { status: 400 }
          ),
          ipCheck.result
        );
      }

      const cleanPhone = otpStore.normalizePhone(phone);
      if (!cleanPhone) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: "Invalid mobile number format." },
            { status: 400 }
          ),
          ipCheck.result
        );
      }

      if (!password || password.length < 8) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: "Password must be at least 8 characters long." },
            { status: 400 }
          ),
          ipCheck.result
        );
      }

      // Atomically claim OTP verification token to prevent replay & race conditions (SEC-01)
      const claimResult = await otpStore.claimVerificationToken(cleanPhone, verificationToken, "password_reset");
      if (!claimResult.ok) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: claimResult.error || "OTP verification expired or invalid. Please verify your mobile number again." },
            { status: 403 }
          ),
          ipCheck.result
        );
      }

      // Update password in database and memory stores
      await authStore.resetPasswordWithPhone({
        phone: cleanPhone,
        newPassword: password,
      });

      return applyRateLimitHeaders(
        NextResponse.json({
          success: true,
          message: "Your password has been reset successfully. Please sign in with your new password.",
        }),
        ipCheck.result
      );
    }

    // Case 2: Email recovery fallback
    const cleanEmail = (email || "").toString().trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length > 160) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Please provide a valid 10-digit mobile number or email address." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    // Anti-enumeration response for email
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        message:
          "If an account matches that email address, recovery instructions have been dispatched. You can also sign in directly via Mobile OTP.",
      }),
      ipCheck.result
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Unable to process recovery request right now." },
      { status: 500 }
    );
  }
}
