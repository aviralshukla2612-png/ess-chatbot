let NextResponse = {
  next: () => ({ status: 200, headers: new Headers() }),
  redirect: (url) => {
    const headers = new Headers();
    headers.set("location", typeof url === "string" ? url : url.toString());
    return { status: 307, headers };
  },
  json: (body, init) => Response.json(body, init),
};
try {
  const nextServer = await import("next/server.js");
  if (nextServer?.NextResponse) {
    NextResponse = nextServer.NextResponse;
  }
} catch {
  // Use compliant mock in standalone test environments where next is in frontend/node_modules
}

function base64UrlToUint8Array(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  return decodeURIComponent(
    atob(b64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

export function getEdgeSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (
      !secret ||
      secret.trim().length < 32 ||
      secret.includes("ess_dev_secret") ||
      secret.includes("replace_") ||
      secret.includes("placeholder") ||
      secret.includes("changeme") ||
      secret.includes("secret_key_here")
    ) {
      return null;
    }
    return secret.trim();
  }
  return secret || "ess_dev_secret_replace_in_prod_minimum_32_chars_long_123456";
}

/**
 * Cryptographically verify and decode HMAC-SHA256 session tokens on Edge / Node runtimes
 */
export async function verifyEdgeSession(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const secret = getEdgeSessionSecret();
  if (!secret) return null;

  try {
    // 1. Verify header algorithm is HS256
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    // 2. Cryptographic signature verification via Web Crypto API (SubtleCrypto)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(signature);
    const dataBytes = encoder.encode(`${encodedHeader}.${encodedPayload}`);

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!isValid) return null;

    // 3. Validate claims & expiry: strictly require valid numeric exp claim
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp !== "number" || isNaN(payload.exp) || payload.exp < now) {
      return null;
    }
    if (!payload.userId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Deprecated alias for backwards-compatibility; always strictly verifies signature
export const decodeEdgeSession = verifyEdgeSession;

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip public assets and public endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/widget.js") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/api/billing/webhook") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/preview")
  ) {
    return NextResponse.next();
  }

  // 2. Extract and cryptographically verify session cookie (Edge-compatible)
  const sessionCookie = request.cookies.get("ess_session")?.value;
  const session = sessionCookie ? await verifyEdgeSession(sessionCookie) : null;

  // 3. Protect all tenant dashboard routes (/dashboard, /bots, /knowledge, /conversations, /leads, /analytics, /integrations, /team, /settings)
  const isDashboardRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/bots" ||
    pathname.startsWith("/bots/") ||
    pathname === "/knowledge" ||
    pathname.startsWith("/knowledge/") ||
    pathname === "/conversations" ||
    pathname.startsWith("/conversations/") ||
    pathname === "/leads" ||
    pathname.startsWith("/leads/") ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/") ||
    pathname === "/integrations" ||
    pathname.startsWith("/integrations/") ||
    pathname === "/team" ||
    pathname.startsWith("/team/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/");

  if (isDashboardRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Protect /admin and /admin/* (Super Admin Only)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isSuper =
      session.role === "SUPER_ADMIN" ||
      session.orgRole === "SUPER_ADMIN";

    if (!isSuper) {
      // Forbidden: redirect regular tenant to dashboard
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "unauthorized_admin");
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bots/:path*",
    "/knowledge/:path*",
    "/conversations/:path*",
    "/leads/:path*",
    "/analytics/:path*",
    "/integrations/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
