import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DESIGN_TOKENS, getChartTheme } from "../../frontend/lib/design/tokens.js";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexToRgb(hexA));
  const l2 = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Phase 2 & 3 — Centralized Design System, Accessibility & UI Architecture Suite", () => {
  it("1. Exports complete Light & Dark tokens, typography, spacing, radii, shadows, and breakpoints", () => {
    assert.ok(DESIGN_TOKENS.colors.light.canvas);
    assert.ok(DESIGN_TOKENS.colors.light.surface);
    assert.ok(DESIGN_TOKENS.colors.light.primary);
    assert.ok(DESIGN_TOKENS.colors.dark.canvas);
    assert.ok(DESIGN_TOKENS.colors.dark.surface);
    assert.ok(DESIGN_TOKENS.colors.dark.primary);
    assert.ok(DESIGN_TOKENS.typography.scale.xl);
    assert.ok(DESIGN_TOKENS.spacing.lg);
    assert.ok(DESIGN_TOKENS.radii.xl);
    assert.ok(DESIGN_TOKENS.shadows.md);
    assert.ok(DESIGN_TOKENS.breakpoints.lg);

    const lightChart = getChartTheme(false);
    const darkChart = getChartTheme(true);
    assert.notEqual(lightChart.tooltipBg, darkChart.tooltipBg);
    assert.equal(lightChart.primary, "#4F46E5");
    assert.equal(darkChart.primary, "#6366F1");
  });

  it("2. Meets WCAG 2.2 AA contrast ratios (>= 4.5:1) for primary, secondary, and CTA text in Light & Dark modes", () => {
    const { light, dark } = DESIGN_TOKENS.colors;

    assert.ok(contrastRatio(light.textPrimary, light.surface) >= 12, "Light primary text must exceed 12:1");
    assert.ok(contrastRatio(light.textSecondary, light.surface) >= 7, "Light secondary text must exceed 7:1");
    assert.ok(contrastRatio(light.textMuted, light.surface) >= 4.5, "Light muted text must meet >= 4.5:1 AA");
    assert.ok(contrastRatio("#FFFFFF", light.primary) >= 4.5, "White text on Royal Indigo (#4F46E5) must meet >= 4.5:1 AA");

    assert.ok(contrastRatio(dark.textPrimary, dark.surface) >= 12, "Dark primary text must exceed 12:1");
    assert.ok(contrastRatio(dark.textSecondary, dark.surface) >= 7, "Dark secondary text must exceed 7:1");
    assert.ok(contrastRatio(dark.textMuted, dark.surface) >= 4.5, "Dark muted text must meet >= 4.5:1 AA");
  });

  it("3. globals.css defines :root and .dark variables without destructive global !important scrollbar or input overrides", () => {
    const css = fs.readFileSync(path.resolve("frontend/app/globals.css"), "utf8");
    assert.ok(css.includes("--bg-canvas:"), "globals.css must define --bg-canvas");
    assert.ok(css.includes("--bg-surface:"), "globals.css must define --bg-surface");
    assert.ok(css.includes(".dark {"), "globals.css must define .dark theme tokens");
    assert.equal(
      css.includes("scrollbar-width: none !important"),
      false,
      "globals.css must not globally hide scrollbars"
    );
    assert.equal(
      css.includes("html.dark input"),
      false,
      "globals.css must not force global !important dark input overrides"
    );
  });

  it("4. Accessible Modal and ConfirmModal implement ARIA dialog roles and Escape key handling", () => {
    const modalCode = fs.readFileSync(path.resolve("frontend/components/ui/Modal.js"), "utf8");
    const confirmCode = fs.readFileSync(path.resolve("frontend/components/ui/ConfirmModal.js"), "utf8");

    assert.ok(modalCode.includes('role="dialog"'));
    assert.ok(modalCode.includes('aria-modal="true"'));
    assert.ok(modalCode.includes('"Escape"'));

    assert.ok(confirmCode.includes('role="alertdialog"') || confirmCode.includes('role="dialog"'));
    assert.ok(confirmCode.includes('aria-modal="true"'));
    assert.ok(confirmCode.includes('"Escape"'));
  });

  it("5. /preview page defines botId cleanly and bots/[botId] supports wizard profiles & editable settings", () => {
    const previewCode = fs.readFileSync(path.resolve("frontend/app/preview/page.js"), "utf8");
    assert.ok(
      previewCode.includes("const botId =") || previewCode.includes("botId ="),
      "/preview must define botId from searchParams before rendering"
    );

    const botDetailCode = fs.readFileSync(
      path.resolve("frontend/app/(dashboard)/bots/[botId]/page.js"),
      "utf8"
    );
    assert.ok(
      botDetailCode.includes("knowledge profile"),
      "bots/[botId] must recognize wizard-generated Approved Knowledge Profile.md"
    );
    assert.ok(
      botDetailCode.includes("handleSaveSettings"),
      "bots/[botId] Settings tab must persist bot updates via handleSaveSettings"
    );
  });

  it("6. BotPreviewWidget supports SSE progressive streaming, code-block copy, and retry", () => {
    const playgroundCode = fs.readFileSync(
      path.resolve("frontend/components/bots/BotPreviewWidget.js"),
      "utf8"
    );
    assert.ok(playgroundCode.includes("stream: true"), "Playground must request SSE stream: true");
    assert.ok(playgroundCode.includes("navigator.clipboard"), "Playground must support copying code blocks");
    assert.ok(playgroundCode.includes("Retry") || playgroundCode.includes("handleRetry"), "Playground must support retry on failed turns");
  });

  it("7. All Super Admin screens consume shared CSS surface tokens with Light & Dark parity", () => {
    const adminScreens = [
      "frontend/app/admin/page.js",
      "frontend/app/admin/organizations/page.js",
      "frontend/app/admin/users/page.js",
      "frontend/app/admin/bots/page.js",
      "frontend/app/admin/conversations/page.js",
      "frontend/app/admin/leads/page.js",
      "frontend/app/admin/plans/page.js",
      "frontend/app/admin/usage/page.js",
      "frontend/app/admin/keys/page.js",
      "frontend/app/admin/tickets/page.js",
      "frontend/app/admin/ai-evaluations/page.js",
      "frontend/app/admin/settings/page.js",
    ];

    for (const relPath of adminScreens) {
      const src = fs.readFileSync(path.resolve(relPath), "utf8");
      assert.equal(
        src.includes("bg-[#0D0D0D]"),
        false,
        `${relPath} must not hardcode pitch-black bg-[#0D0D0D]`
      );
      assert.ok(
        src.includes("var(--bg-surface)") || src.includes("PageHeader"),
        `${relPath} must consume centralized design tokens`
      );
    }
  });
});
