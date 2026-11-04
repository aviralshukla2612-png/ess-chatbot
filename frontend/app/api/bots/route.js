import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";
import { documentsStore } from "@/lib/db/documentsStore";
import { queryDb } from "@/lib/db/dbPool";
import { websitesDb } from "@/lib/db/websites";
import { n8nClient } from "@/lib/n8n/client";
import { validateUrlForSSRF } from "@/lib/security/ssrf";
import { validateProhibitedContent } from "@/lib/security/contentModeration";
import { requireAuth, requireOrgRole, ROLES } from "@/lib/auth/guard";
import { billingService } from "@/lib/billing/billingService";
import { generateKnowledgeMarkdown } from "@/lib/wizard/industryTemplates";

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
      // 1. Mandatory 7-day free trial & autopay check
      const sub = await billingService.getSubscription(principal.organizationId);
      const hasAutopay = Boolean(
        sub &&
        sub.providerSubscriptionId &&
        !sub.providerSubscriptionId.startsWith("sub_reg_") &&
        (sub.status === "active" || sub.status === "trialing")
      );

      if (!hasAutopay) {
        return NextResponse.json(
          {
            success: false,
            error: "TRIAL_AUTOPAY_MANDATORY",
            message: "Setting up your 7-day free trial with Razorpay autopay is mandatory before creating an AI chatbot.",
            code: "TRIAL_AUTOPAY_MANDATORY",
          },
          { status: 402 }
        );
      }

      // 2. Strict 1-bot limit for regular users and sub-admins
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

    // Strict Acceptable Use Policy: Permanent Ban on Gambling, Betting, and Adult Content
    const contentCheck = validateProhibitedContent({
      name: body.name,
      company: body.company,
      description: body.description,
      systemPrompt: body.systemPrompt,
      instructions: body.instructions,
      welcomeMessage: body.welcomeMessage,
      websiteUrl: body.websiteUrl,
      allowedDomains: body.allowedDomains,
    });
    if (!contentCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: contentCheck.error,
          code: "PROHIBITED_CATEGORY_VIOLATION",
          category: contentCheck.violation,
        },
        { status: 400 }
      );
    }

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

    // 1. Synthesize and Ingest Approved Business Knowledge Profile into RAG store
    if (body.knowledgeMarkdown || body.questionnaireAnswers || body.industry) {
      try {
        const profileContent =
          body.knowledgeMarkdown ||
          generateKnowledgeMarkdown({
            industry: body.industry,
            commonDetails: body.businessDetails || {
              businessName: body.company || bot.name,
              description: body.description,
              websiteUrl: body.websiteUrl,
              phoneNumber: body.phoneNumber,
            },
            questionnaireAnswers: body.questionnaireAnswers || {},
            assistantConfig: body.assistantConfig || {},
          });

        const companyName = body.businessDetails?.businessName || body.company || bot.name || "Business";
        documentsStore.addDocument({
          id: `doc_profile_${bot.id}`,
          botId: bot.id,
          name: `${companyName} - Approved Knowledge Profile.md`,
          type: "Company Profile",
          content: profileContent,
        });

        // Persist BotQuestionnaire metadata
        queryDb(
          `INSERT INTO "BotQuestionnaire" ("id", "botId", "organizationId", "industry", "answers", "completionStatus")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT ("id") DO UPDATE SET "answers" = EXCLUDED."answers", "updatedAt" = CURRENT_TIMESTAMP;`,
          [
            `bq_${bot.id}`,
            bot.id,
            principal.organizationId,
            body.industry || "other",
            JSON.stringify(body.questionnaireAnswers || {}),
            "completed",
          ]
        ).catch(() => {});
      } catch (err) {
        console.warn("[BOT_KNOWLEDGE_INGEST_WARN]", err.message);
      }
    }

    // 2. Ingest any user-uploaded files
    if (Array.isArray(body.documents) && body.documents.length > 0) {
      for (const doc of body.documents) {
        if (doc.name && doc.content) {
          try {
            documentsStore.addDocument({
              id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              botId: bot.id,
              name: doc.name,
              type: doc.type || "Document",
              content: doc.content,
            });
          } catch (e) {}
        }
      }
    }

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
