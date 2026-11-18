import { NextResponse } from "next/server";
import { verifyCsrfOrigin } from "@/lib/security/rateLimitPolicy";

function clearCookieOnResponse(response, request) {
  const isHttps =
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https";

  response.cookies.set({
    name: "ess_session",
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
  });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function POST(request) {
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.ok) {
    return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  return clearCookieOnResponse(response, request);
}

/**
 * GET /api/auth/logout
 * Protected against cross-site <img>/<script> forced-logout CSRF via Sec-Fetch-Site check.
 */
export async function GET(request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  const fetchMode = request.headers.get("sec-fetch-mode");

  // Block cross-site subresource logout CSRF while permitting direct same-origin navigation
  if (
    (fetchSite && fetchSite === "cross-site") ||
    (fetchMode && fetchMode !== "navigate" && fetchSite !== "same-origin")
  ) {
    return NextResponse.json(
      { success: false, error: "Use POST /api/auth/logout for session termination." },
      { status: 405 }
    );
  }

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  return clearCookieOnResponse(response, request);
}
