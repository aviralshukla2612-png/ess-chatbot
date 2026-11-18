import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { otpStore } from "@/lib/auth/otpStore";
import { signSessionToken } from "@/lib/auth/session";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

export async function POST(request) {
  try {
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("register_ip", clientIp);
    if (!ipCheck.ok) return ipCheck.response;

    const body = await request.json();
    const { name, organizationName, phone, verificationToken, password } = body;

    if (!phone) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Mobile number is required for registration." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    const cleanPhone = otpStore.normalizePhone(phone);
    if (!cleanPhone) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Invalid mobile number. Please enter a valid 10-digit number." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    if (!password || password.length < 8) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Password must be at least 8 characters." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    // Verify OTP confirmation token
    if (!verificationToken || !otpStore.verifyVerificationToken(cleanPhone, verificationToken, "registration")) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Please verify your mobile number with OTP before completing registration." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    const cleanName = (name || "").trim().slice(0, 100) || `User ${cleanPhone.slice(-4)}`;
    const cleanOrg = (organizationName || "").trim().slice(0, 120) || `${cleanName}'s Workspace`;

    const { user, organization, orgRole } = await authStore.register({
      name: cleanName,
      organizationName: cleanOrg,
      phone: cleanPhone,
      password,
      phoneVerified: true,
    });

    // Consume verification token so it cannot be replayed
    otpStore.consumeVerificationToken(verificationToken);

    const token = signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: organization.id,
      orgRole,
    });

    const response = NextResponse.json({
      success: true,
      user,
      organization,
      orgRole,
    });

    const isHttps =
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set({
      name: "ess_session",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: isHttps,
    });
    return applyRateLimitHeaders(response, ipCheck.result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed" },
      { status: 400 }
    );
  }
}
