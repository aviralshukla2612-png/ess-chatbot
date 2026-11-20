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
    const body = await request.json().catch(() => ({}));
    const { email, password, phone, verificationToken, mode } = body;

    // 1. Per-IP distributed sliding-window login rate limit
    const ipCheck = await enforceRateLimit("login_ip", clientIp);
    if (!ipCheck.ok) {
      return ipCheck.response;
    }

    // 2. Per-account brute-force protection
    const accountKey = (email || phone || "").toString().trim().toLowerCase();
    if (accountKey) {
      const accountCheck = await enforceRateLimit("login_account", accountKey);
      if (!accountCheck.ok) {
        return accountCheck.response;
      }
    }

    let authResult;

    // Mobile Phone OTP Login Flow
    if (phone && (verificationToken || mode === "otp")) {
      const cleanPhone = otpStore.normalizePhone(phone);
      if (!cleanPhone) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: "Invalid mobile number. Please check the number entered." },
            { status: 400 }
          ),
          ipCheck.result
        );
      }

      // Verify cryptographic token from OTP verification
      const isValid = otpStore.verifyVerificationToken(cleanPhone, verificationToken, "login");
      if (!isValid) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: "Invalid or expired OTP session. Please request a new verification code." },
            { status: 400 }
          ),
          ipCheck.result
        );
      }

      authResult = await authStore.loginWithPhone({ phone: cleanPhone });
      if (!authResult.userFound) {
        // Keep verificationToken unconsumed so immediate registration handoff can complete once
        return applyRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              userFound: false,
              phone: cleanPhone,
              error: "No account found with this mobile number. Please register your account.",
            },
            { status: 404 }
          ),
          ipCheck.result
        );
      }

      // Consume token once login succeeds to prevent replay
      otpStore.consumeVerificationToken(verificationToken);
    } else if (phone && password) {
      // Mobile Phone & Password Login Flow
      authResult = await authStore.loginWithPhoneAndPassword({ phone, password });
    } else {
      // Standard Email & Password Flow
      if (!email || !password) {
        return applyRateLimitHeaders(
          NextResponse.json(
            { success: false, error: "Email and password are required" },
            { status: 400 }
          ),
          ipCheck.result
        );
      }

      authResult = await authStore.login({ email, password });
    }

    const { user, organizationId, orgRole, memberships } = authResult;

    const token = signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId,
      orgRole,
    });

    const response = NextResponse.json({
      success: true,
      user,
      token,
      organizationId,
      orgRole,
      memberships,
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
    const safeMsg =
      err?.message === "Account has been suspended. Please contact support."
        ? err.message
        : err?.message === "Invalid mobile number or password"
        ? err.message
        : "Invalid email or password";
    return NextResponse.json(
      { success: false, error: safeMsg },
      { status: 401 }
    );
  }
}
