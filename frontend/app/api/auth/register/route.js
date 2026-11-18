import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { otpStore } from "@/lib/auth/otpStore";
import { signSessionToken, createSessionCookie } from "@/lib/auth/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, organizationName, phone, verificationToken, password } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Mobile number is required for registration." },
        { status: 400 }
      );
    }

    const cleanPhone = otpStore.normalizePhone(phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number. Please enter a valid 10-digit number." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Verify OTP confirmation token
    if (!verificationToken || !otpStore.verifyVerificationToken(cleanPhone, verificationToken, "registration")) {
      return NextResponse.json(
        { success: false, error: "Please verify your mobile number with OTP before completing registration." },
        { status: 400 }
      );
    }

    const cleanName = (name || "").trim() || `User ${cleanPhone.slice(-4)}`;
    const cleanOrg = (organizationName || "").trim() || `${cleanName}'s Workspace`;

    const { user, organization, orgRole } = await authStore.register({
      name: cleanName,
      organizationName: cleanOrg,
      phone: cleanPhone,
      password,
      phoneVerified: true,
    });

    const token = signSessionToken({
      userId: user.id,
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
    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed" },
      { status: 400 }
    );
  }
}
