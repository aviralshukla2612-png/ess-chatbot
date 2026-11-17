import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { otpStore } from "@/lib/auth/otpStore";
import { signSessionToken, createSessionCookie } from "@/lib/auth/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, organizationName, phone, verificationToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

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

    // Verify OTP confirmation token
    if (!verificationToken || !otpStore.verifyVerificationToken(cleanPhone, verificationToken, "registration")) {
      return NextResponse.json(
        { success: false, error: "Please verify your mobile number with OTP before completing registration." },
        { status: 400 }
      );
    }

    const { user, organization, orgRole } = await authStore.register({
      email,
      password,
      name,
      organizationName,
      phone: cleanPhone,
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

    response.headers.set("Set-Cookie", createSessionCookie(token));
    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed" },
      { status: 400 }
    );
  }
}
