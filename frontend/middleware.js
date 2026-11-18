import { NextResponse } from "next/server";

const FALLBACK_DEV_SECRET = "ess_dev_secret_replace_in_prod_minimum_32_chars_long_123456";

function getEdgeSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === "production") {
    return process.env.SESSION_SECRET || "";
  }
  return process.env.SESSION_SECRET || FALLBACK_DEV_SECRET;
}

function base64UrlToUint8Array(base64Url) {
  let b64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cryptographically verify HMAC-SHA256 session JWT in Edge Runtime using Web Crypto API.
 */
export async function verifyEdgeSession(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const secret = getEdgeSessionSecret();
  if (!secret) return null;

  try {
    const [encodedHeader, encodedPayload, encodedSig] = parts;
    const encoder = new TextEncoder();

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(encodedSig);
    const dataBytes = encoder.encode(`${encodedHeader}.${encodedPayload}`);

    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, dataBytes);
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(encodedPayload));
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

function applySecurityHeaders(response, pathname, disableCache = false) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  if (!pathname.startsWith("/preview") && !pathname.startsWith("/widget.js")) {
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
  }
  if (disableCache) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 0. Redirect /register to /login?tab=register
  if (pathname === "/register" || pathname.startsWith("/register/")) {
    const target = new URL("/login", request.url);
    request.nextUrl.searchParams.forEach((val, key) => target.searchParams.set(key, val));
    if (!target.searchParams.has("tab")) target.searchParams.set("tab", "register");
    return applySecurityHeaders(NextResponse.redirect(target), pathname, true);
  }

  // 1. Skip public assets and public endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-") ||
    pathname.startsWith("/widget.js") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/api/billing/webhook") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/preview")
  ) {
    return applySecurityHeaders(
      NextResponse.next(),
      pathname,
      pathname === "/login" || pathname === "/forgot-password"
    );
  }

  // 2. Extract and cryptographically verify session cookie (Edge Web Crypto HMAC-SHA256)
  const sessionCookie = request.cookies.get("ess_session")?.value;
  const session = sessionCookie ? await verifyEdgeSession(sessionCookie) : null;

  // 3. Block non-SUPER_ADMIN callers from /api/admin/* right at the Edge
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    if (!session) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        ),
        pathname,
        true
      );
    }
    if (session.role !== "SUPER_ADMIN") {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Forbidden: Platform Super Admin privileges required." },
          { status: 403 }
        ),
        pathname,
        true
      );
    }
    return applySecurityHeaders(NextResponse.next(), pathname, true);
  }

  // 4. Protect ALL tenant dashboard & workspace routes
  const protectedRoutes = [
    "/dashboard",
    "/bots",
    "/knowledge",
    "/conversations",
    "/leads",
    "/analytics",
    "/integrations",
    "/team",
    "/billing",
    "/support",
    "/settings",
  ];

  const isTenantRoute = protectedRoutes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isTenantRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), pathname, true);
    }
    return applySecurityHeaders(NextResponse.next(), pathname, true);
  }

  // 5. Protect /admin and /admin/* (Strict Platform SUPER_ADMIN role ONLY)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), pathname, true);
    }

    if (session.role !== "SUPER_ADMIN") {
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "unauthorized_admin");
      return applySecurityHeaders(NextResponse.redirect(dashboardUrl), pathname, true);
    }

    return applySecurityHeaders(NextResponse.next(), pathname, true);
  }

  return applySecurityHeaders(NextResponse.next(), pathname, false);
}

export const config = {
  matcher: [
    "/login",
    "/register/:path*",
    "/register",
    "/dashboard/:path*",
    "/dashboard",
    "/bots/:path*",
    "/bots",
    "/knowledge/:path*",
    "/knowledge",
    "/conversations/:path*",
    "/conversations",
    "/leads/:path*",
    "/leads",
    "/analytics/:path*",
    "/analytics",
    "/integrations/:path*",
    "/integrations",
    "/team/:path*",
    "/team",
    "/billing/:path*",
    "/billing",
    "/support/:path*",
    "/support",
    "/settings/:path*",
    "/settings",
    "/admin/:path*",
    "/admin",
    "/api/admin/:path*",
    "/api/admin",
  ],
};
