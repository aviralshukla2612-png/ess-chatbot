import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { queryDb } from "@/lib/db/dbPool";
import fs from "fs";
import path from "path";

// Protected system resources that must NEVER be deleted under any circumstances
const PROTECTED_BOT_IDS = new Set(["bot_aa"]);
const PROTECTED_ORG_IDS = new Set(["org_ess_01", "org_ess_default"]);

const REQUIRED_CONFIRM_TOKEN = "CONFIRM_DELETE_DUMMY_RECORDS";

export async function POST(request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      dryRun = true,
      confirm,
      targetBotIds = [],
      targetOrgIds = [],
      includeEvalRecords = false,
    } = body;

    // Reject all name-based or wildcards: only explicit IDs and specific eval markers are supported
    const safeTargetBotIds = (Array.isArray(targetBotIds) ? targetBotIds : []).filter(
      (id) => typeof id === "string" && !PROTECTED_BOT_IDS.has(id) && id.trim().length > 0
    );

    const safeTargetOrgIds = (Array.isArray(targetOrgIds) ? targetOrgIds : []).filter(
      (id) => typeof id === "string" && !PROTECTED_ORG_IDS.has(id) && id.trim().length > 0
    );

    // 1. Dry-run preview mode (Default safety behavior)
    if (dryRun === true || confirm !== REQUIRED_CONFIRM_TOKEN) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        executed: false,
        message:
          "Dry-run preview mode. No records were modified or deleted. To execute cleanup, provide explicit IDs, set dryRun: false, and provide confirmation token.",
        requiredConfirmation: REQUIRED_CONFIRM_TOKEN,
        preview: {
          targetBotIds: safeTargetBotIds,
          targetOrgIds: safeTargetOrgIds,
          includeEvalRecords: Boolean(includeEvalRecords),
          protectedResourcesPreserved: {
            bots: Array.from(PROTECTED_BOT_IDS),
            organizations: Array.from(PROTECTED_ORG_IDS),
          },
        },
      });
    }

    // 2. Execution mode (Requires dryRun: false AND valid confirmation token)
    let deletedBotsCount = 0;
    let deletedOrgsCount = 0;
    let deletedLeadsCount = 0;
    let deletedConvsCount = 0;

    // Explicit ID-only bot deletion (No wildcard name queries)
    if (safeTargetBotIds.length > 0) {
      const botRes = await queryDb(
        'DELETE FROM "Bot" WHERE "id" = ANY($1::text[]) AND "id" != \'bot_aa\';',
        [safeTargetBotIds]
      );
      deletedBotsCount = botRes.rowCount || 0;
    }

    // Explicit ID-only organization deletion (No wildcard name queries)
    if (safeTargetOrgIds.length > 0) {
      const orgRes = await queryDb(
        'DELETE FROM "Organization" WHERE "id" = ANY($1::text[]) AND "id" NOT IN (\'org_ess_01\', \'org_ess_default\');',
        [safeTargetOrgIds]
      );
      deletedOrgsCount += orgRes.rowCount || 0;
    }

    // Explicit test harness records only if includeEvalRecords is explicitly enabled
    if (includeEvalRecords) {
      const leadRes = await queryDb(`
        DELETE FROM "Lead"
        WHERE "email" LIKE '%@eval.test%'
           OR "email" LIKE '%@example.com%';
      `);
      deletedLeadsCount = leadRes.rowCount || 0;

      const convRes = await queryDb(`
        DELETE FROM "Conversation"
        WHERE "id" LIKE 'c_eval_%'
           OR "id" LIKE 'sim_%'
           OR "id" LIKE 'test_%';
      `);
      deletedConvsCount = convRes.rowCount || 0;
    }

    // Clean JSON files safely for explicit IDs only
    const cleanJsonFile = (filename, filterFn) => {
      const p1 = path.join(process.cwd(), "frontend", "data", filename);
      const p2 = path.join(process.cwd(), "data", filename);
      const target = fs.existsSync(p1) ? p1 : (fs.existsSync(p2) ? p2 : null);
      if (target) {
        try {
          const raw = fs.readFileSync(target, "utf8");
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const cleaned = list.filter(filterFn);
            fs.writeFileSync(target, JSON.stringify(cleaned, null, 2), "utf8");
          }
        } catch (e) {
          console.warn(`Could not clean ${filename}:`, e.message);
        }
      }
    };

    if (safeTargetBotIds.length > 0) {
      cleanJsonFile("bots.json", (b) => !safeTargetBotIds.includes(b.id));
    }

    if (includeEvalRecords) {
      cleanJsonFile("leads.json", (l) => {
        const isDummyEmail = l.email?.includes("@eval.test") || l.email?.includes("@example.com");
        return !isDummyEmail;
      });

      cleanJsonFile("conversations.json", (c) => {
        const isTestId =
          c.id?.startsWith("sim_") || c.id?.startsWith("test_") || c.id?.startsWith("c_eval_");
        return !isTestId;
      });
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      executed: true,
      message: "Cleanup executed successfully for specified explicit target IDs.",
      summary: {
        deletedBots: deletedBotsCount,
        deletedOrganizations: deletedOrgsCount,
        deletedLeads: deletedLeadsCount,
        deletedConversations: deletedConvsCount,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
