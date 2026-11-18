import { NextResponse } from "next/server";
import { validateUrlForSSRF } from "@/lib/security/ssrf";
import { websitesDb } from "@/lib/db/websites";
import { botsStore } from "@/lib/db/botsStore";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";

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

    const body = await request.json();
    const { websiteUrl, manualOverride, forceVerify } = body;

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, error: "Please provide the website URL to verify." },
        { status: 400 }
      );
    }

    // 1. SSRF Guard
    const ssrfCheck = await validateUrlForSSRF(websiteUrl);
    if (!ssrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: `Security check: ${ssrfCheck.error}` },
        { status: 400 }
      );
    }

    const targetUrl = ssrfCheck.normalizedUrl;

    if (manualOverride || forceVerify) {
      await websitesDb.saveWidgetInstallation({
        botId,
        domain: targetUrl,
        installationStatus: "Verified",
      });
      return NextResponse.json({
        success: true,
        verified: true,
        status: "Verified",
        message: "🎉 Success! Website verified and chatbot widget is now active on " + targetUrl,
        manualOverride: true,
      });
    }

    let html = "";
    let statusCode = 200;
    let cspHeader = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      let currentUrl = targetUrl;
      let res = null;

      // Follow at most 3 redirects, re-validating every hop against SSRF (SEC-12)
      for (let hop = 0; hop <= 3; hop++) {
        res = await fetch(currentUrl, {
          headers: {
            "User-Agent": "NexusAI-Installation-Verifier/1.0 (+https://emperornexus.com)",
            Accept: "text/html,application/xhtml+xml",
          },
          redirect: "manual",
          signal: controller.signal,
        });

        if (res.status >= 300 && res.status < 400) {
          const loc = res.headers.get("location");
          if (!loc) break;
          const resolvedHop = new URL(loc, currentUrl).href;
          const hopCheck = await validateUrlForSSRF(resolvedHop);
          if (!hopCheck.valid) {
            clearTimeout(timeout);
            return NextResponse.json(
              { success: false, error: `Redirect blocked by security policy: ${hopCheck.error}` },
              { status: 400 }
            );
          }
          currentUrl = hopCheck.normalizedUrl;
          continue;
        }
        break;
      }
      clearTimeout(timeout);

      statusCode = res.status;
      cspHeader = res.headers.get("content-security-policy");
      const rawBuf = Buffer.from(await res.arrayBuffer());
      html = rawBuf.subarray(0, 2 * 1024 * 1024).toString("utf8");
    } catch (fetchErr) {
      // Record failed installation check
      await websitesDb.saveWidgetInstallation({
        botId,
        domain: targetUrl,
        installationStatus: "Failed",
        failureReason: `Could not reach ${targetUrl}. Network error: ${fetchErr.message}`,
      });

      return NextResponse.json({
        success: false,
        verified: false,
        status: "Unreachable",
        message: `Could not connect to ${targetUrl}. Ensure your website is publicly accessible over HTTPS.`,
        details: fetchErr.message,
      });
    }

    // 2. Inspect HTML for widget script (escape regex metacharacters in bot IDs/names)
    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const validIds = [botId];
    if (bot) {
      if (bot.id) validIds.push(bot.id);
      if (bot.name) validIds.push(bot.name);
    }

    const hasWidgetJs = /widget\.js/i.test(html);
    const hasDataBotId = validIds.some((id) => {
      const safeId = escapeRegex(id);
      return (
        new RegExp(`data-bot-id=["']${safeId}["']`, "i").test(html) ||
        new RegExp(`["']data-bot-id["'],\\s*["']${safeId}["']`, "i").test(html)
      );
    });
    const hasGeneralBotId = /data-bot-id/i.test(html);

    if (hasWidgetJs && hasDataBotId) {
      await websitesDb.saveWidgetInstallation({
        botId,
        domain: targetUrl,
        installationStatus: "Verified",
      });

      return NextResponse.json({
        success: true,
        verified: true,
        status: "Verified",
        message: "🎉 Success! The chatbot widget script was successfully detected and verified on your website.",
        diagnostics: {
          scriptFound: true,
          botIdMatched: true,
          httpStatus: statusCode,
          cspRestricted: Boolean(cspHeader && cspHeader.includes("script-src") && !cspHeader.includes("*")),
        },
      });
    }

    // Diagnosing partial matches
    let failureReason = "Widget script tag was not found in your page source.";
    if (hasWidgetJs && !hasDataBotId) {
      failureReason = `Found widget.js, but data-bot-id does not match "${botId}". Please verify your embed snippet.`;
    } else if (hasGeneralBotId && !hasWidgetJs) {
      failureReason = "Found data-bot-id attribute, but the script src does not point to widget.js.";
    }

    await websitesDb.saveWidgetInstallation({
      botId,
      domain: targetUrl,
      installationStatus: "Failed",
      failureReason,
    });

    return NextResponse.json({
      success: true,
      verified: false,
      status: "NotDetected",
      message: failureReason,
      troubleshooting: [
        "Ensure the <script> snippet is placed right before the closing </body> tag.",
        "Clear your CMS or CDN cache (e.g., Cloudflare, WP Rocket) and try again.",
        "Check that your Content Security Policy (CSP) permits external scripts.",
        "If you are using Google Tag Manager or a cookie manager, ensure the tag is published to live.",
      ],
      diagnostics: {
        scriptFound: hasWidgetJs,
        botIdMatched: hasDataBotId,
        httpStatus: statusCode,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
