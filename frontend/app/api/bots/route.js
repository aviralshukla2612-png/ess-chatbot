import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";
import { websitesDb } from "@/lib/db/websites";
import { n8nClient } from "@/lib/n8n/client";
import { validateUrlForSSRF } from "@/lib/security/ssrf";
import { requireAuth, requireOrgRole, ROLES } from "@/lib/auth/guard";

// Helper to normalize phone numbers safely without changing meaning
function normalizePhoneNumber(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount < 7) return null;
  return trimmed;
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { searchParams } = new URL(request.url);
    const requestedOrg = searchParams.get("organizationId");

    const isSuperAdmin = principal.platformRole === ROLES.SUPER_ADMIN || principal.orgRole === ROLES.SUPER_ADMIN;
    const targetOrgId = isSuperAdmin ? (requestedOrg || null) : principal.organizationId;

    const bots = await botsStore.getBotsAsync(targetOrgId);

    return NextResponse.json({ success: true, bots });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json();

    const isSuperAdmin = principal.platformRole === ROLES.SUPER_ADMIN || principal.orgRole === ROLES.SUPER_ADMIN;
    if (!isSuperAdmin) {
      const existingBots = await botsStore.getBotsAsync(principal.organizationId);
      if (existingBots && existingBots.length >= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Bot creation limit reached: User and Sub-Admin accounts are restricted to creating 1 bot.",
            code: "BOT_LIMIT_EXCEEDED",
          },
          { status: 403 }
        );
      }
    }

    // Enforce tenant boundary: bot belongs to caller's organizationId
    body.organizationId = principal.organizationId;

    // Normalize and validate contact details
    if (body.phoneNumber || body.phone) {
      body.phoneNumber = normalizePhoneNumber(body.phoneNumber || body.phone);
    }
    if (body.company && typeof body.company === "string") {
      body.company = body.company.trim();
    }

    // Validate websiteUrl if supplied
    let validatedBaseUrl = null;
    if (body.websiteUrl && typeof body.websiteUrl === "string" && body.websiteUrl.trim()) {
      const ssrfCheck = await validateUrlForSSRF(body.websiteUrl.trim());
      if (!ssrfCheck.valid) {
        return NextResponse.json({ success: false, error: ssrfCheck.error }, { status: 400 });
      }
      validatedBaseUrl = ssrfCheck.normalizedUrl;
      body.websiteUrl = validatedBaseUrl;
    }

    const bot = botsStore.upsertBot(body, principal.organizationId);

    // If websiteUrl was provided, automatically register the website source and trigger crawler
    if (validatedBaseUrl) {
      try {
        const source = await websitesDb.createWebsiteSource({
          organizationId: principal.organizationId,
          botId: bot.id,
          name: `${bot.name || "Business"} Website`,
          baseUrl: validatedBaseUrl,
          crawlScope: "entire",
          maxPages: 50,
        });

        const job = await websitesDb.createIngestionJob(source.id, bot.id, principal.organizationId);
        await n8nClient.triggerIngestionWorkflow({
          jobId: job.id,
          websiteSource: source,
          botId: bot.id,
          organizationId: principal.organizationId,
        });
      } catch (ingestErr) {
        console.warn("[BOT_WEBSITE_INIT_WARN]", ingestErr.message);
      }
    }

    return NextResponse.json({ success: true, bot });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
