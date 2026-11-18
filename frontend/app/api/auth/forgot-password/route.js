import { NextResponse } from "next/server";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

/**
 * POST /api/auth/forgot-password
 * Rate-limited account recovery endpoint (returns anti-enumeration response).
 */
export async function POST(request) {
  try {
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("password_reset", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").toString().trim().toLowerCase();

    if (!email || !email.includes("@") || email.length > 160) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Please provide a valid email address." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    // Anti-enumeration response: never disclose whether the email exists in the system
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        message:
          "If an account matches that email address, recovery instructions have been dispatched. You can also sign in directly via Mobile OTP.",
      }),
      ipCheck.result
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process recovery request right now." },
      { status: 500 }
    );
  }
}
