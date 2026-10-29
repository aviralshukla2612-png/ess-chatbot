import { NextResponse } from "next/server";
import { validateUrlForSSRF } from "@/lib/security/ssrf";
import { websitesDb } from "@/lib/db/websites";
import { botsStore } from "@/lib/db/botsStore";
import { n8nClient } from "@/lib/n8n/client";
import { requireAuth, requireOrgRole, ROLES } from "@/lib/auth/guard";

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot || (!isSuperAdmin && bot.organizationId !== principal.organizationId)) {
      return NextResponse.json({ success: true, sources: [] });
    }

    const sources = await websitesDb.getWebsiteSources(botId, isSuperAdmin ? null : principal.organizationId);
    return NextResponse.json({ success: true, sources });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const targetOrgId = bot.organizationId || principal.organizationId;
    const body = await request.json();

    const {
      name,
      baseUrl,
      crawlScope = "entire",
      maxPages = 50,
      includePatterns = [],
      excludePatterns = [],
      syncSchedule = "manual",
    } = body;

    if (!baseUrl) {
      return NextResponse.json({ success: false, error: "Website URL is required." }, { status: 400 });
    }

    // 1. SSRF and Domain Security Verification
    const ssrfCheck = await validateUrlForSSRF(baseUrl);
    if (!ssrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 400 }
      );
    }

    // 2. Create Website Source Record with authentic tenant organizationId
    const source = await websitesDb.createWebsiteSource({
      organizationId: targetOrgId,
      botId,
      name: name?.trim() || ssrfCheck.hostname,
      baseUrl: ssrfCheck.normalizedUrl,
      crawlScope,
      maxPages: Math.min(Math.max(Number(maxPages) || 50, 1), 500),
      includePatterns: includePatterns || [],
      excludePatterns: excludePatterns || [],
      syncSchedule,
    });

    // 3. Create Background Ingestion Job
    const job = await websitesDb.createIngestionJob(source.id, botId, targetOrgId);

    // 4. Trigger n8n Workflow / Background Pipeline (Non-blocking)
    const dispatch = await n8nClient.triggerIngestionWorkflow({
      jobId: job.id,
      websiteSource: source,
      botId,
      organizationId: targetOrgId,
    });

    return NextResponse.json(
      {
        success: true,
        source,
        job,
        dispatched: dispatch.dispatched,
        engine: dispatch.engine,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
