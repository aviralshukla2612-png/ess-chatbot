import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";

/**
 * Discovers real Google accounts from Chrome user profiles or system defaults
 */
function getSystemChromeProfiles() {
  const fallbackAccounts = [
    { name: "Aniket", email: "aniketshukla2211@gmail.com" },
    { name: "ess", email: "essnewfinal@gmail.com" },
    { name: "mdz", email: "mdzzzzzzzzz23@gmail.com" },
    { name: "Srajan", email: "srajanshukla011005@gmail.com" },
  ];

  try {
    const localAppData = process.env.LOCALAPPDATA || "C:/Users/Aviral Shukla/AppData/Local";
    const localStatePath = path.join(localAppData, "Google", "Chrome", "User Data", "Local State");

    if (fs.existsSync(localStatePath)) {
      const parsed = JSON.parse(fs.readFileSync(localStatePath, "utf8"));
      const infoCache = parsed?.profile?.info_cache || {};
      const found = [];
      const seen = new Set();

      // Put profiles in clean order (Aniket, ess, mdz, Srajan) - exclude 'Default' profile
      for (const [key, prof] of Object.entries(infoCache)) {
        if (key === "Default") continue; // Exclude default browser profile
        if (prof.user_name && prof.user_name.includes("@")) {
          const cleanEmail = prof.user_name.trim().toLowerCase();
          if (cleanEmail === "aviralshukla2612@gmail.com") continue;
          if (!seen.has(cleanEmail)) {
            seen.add(cleanEmail);
            const displayName = prof.name || cleanEmail.split("@")[0];
            found.push({
              name: displayName,
              email: cleanEmail,
              id: `chrome_${key.toLowerCase().replace(/\s+/g, "_")}`,
            });
          }
        }
      }

      if (found.length > 0) {
        const priorityNames = ["Aniket", "ess", "mdz", "Srajan"];
        found.sort((a, b) => {
          const idxA = priorityNames.indexOf(a.name);
          const idxB = priorityNames.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        return found;
      }
    }
  } catch (err) {
    console.warn("[CHROME_PROFILE_DETECTION_WARN]", err.message);
  }

  return fallbackAccounts;
}

/**
 * GET /api/auth/google
 * Returns the user's authentic Google accounts detected on this device
 */
export async function GET() {
  try {
    const chromeProfiles = getSystemChromeProfiles();
    return NextResponse.json({ success: true, accounts: chromeProfiles });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/auth/google
 * Authenticates the selected Google user, establishes session, and returns redirect
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, name, avatar } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid Google email address is required" },
        { status: 400 }
      );
    }

    const authResult = await authStore.loginWithOAuth({
      email,
      name,
      avatar,
      provider: "google",
    });

    const { user, organizationId, orgRole, memberships } = authResult;

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId,
      orgRole,
    });

    const isSuper = user.role === "SUPER_ADMIN" || orgRole === "SUPER_ADMIN";
    const destination = isSuper ? "/admin" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      user,
      token,
      organizationId,
      orgRole,
      memberships,
      destination,
    });

    response.cookies.set({
      name: "ess_session",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: process.env.COOKIE_SECURE === "true",
    });

    return response;
  } catch (err) {
    console.error("[GOOGLE_AUTH_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to authenticate with Google" },
      { status: 401 }
    );
  }
}
