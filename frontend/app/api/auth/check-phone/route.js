import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

/**
 * POST /api/auth/check-phone
 * Rate-limited pre-registration phone availability check (SEC-03).
 */
export async function POST(request) {
  try {
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("phone_check_ip", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const body = await request.json().catch(() => ({}));
    const { phone } = body || {};

    if (!phone) {
      return applyRateLimitHeaders(
        NextResponse.json({ exists: false, error: "Phone number required" }, { status: 400 }),
        ipCheck.result
      );
    }

    const rawDigits = String(phone).replace(/\D/g, "");
    if (rawDigits.length < 10) {
      return applyRateLimitHeaders(
        NextResponse.json({ exists: false, valid: false }),
        ipCheck.result
      );
    }

    // Anti-enumeration (SEC-03): validate syntax and return generic valid response without revealing account existence
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        valid: true,
      }),
      ipCheck.result
    );
  } catch (err) {
    return NextResponse.json({ exists: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/auth/check-phone
 * Rate-limited pre-registration phone availability check (SEC-03).
 */
export async function GET(request) {
  try {
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("phone_check_ip", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return applyRateLimitHeaders(
        NextResponse.json({ exists: false, error: "Phone parameter required" }, { status: 400 }),
        ipCheck.result
      );
    }

    const rawDigits = String(phone).replace(/\D/g, "");
    if (rawDigits.length < 10) {
      return applyRateLimitHeaders(
        NextResponse.json({ exists: false, valid: false }),
        ipCheck.result
      );
    }

    // Anti-enumeration (SEC-03): validate syntax and return generic valid response without revealing account existence
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        valid: true,
      }),
      ipCheck.result
    );
  } catch (err) {
    return NextResponse.json({ exists: false, error: err.message }, { status: 500 });
  }
}
