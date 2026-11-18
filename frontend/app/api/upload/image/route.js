import crypto from "crypto";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireOrgRole, ROLES } from "@/lib/auth/guard";
import {
  enforceRateLimit,
  applyRateLimitHeaders,
  getAiResourceLimits,
} from "@/lib/security/rateLimitPolicy";

/**
 * Store uploaded binary images OUTSIDE Next.js `public/` so static serving can never
 * bypass route-handler security headers or execute uploaded content as HTML/SVG.
 */
function resolvePrivateUploadDir() {
  const directData = path.join(process.cwd(), "data");
  const baseDir = fs.existsSync(directData)
    ? directData
    : path.join(process.cwd(), "frontend", "data");
  return path.join(baseDir, "uploads");
}

/**
 * Inspect binary magic bytes to determine authentic raster image format.
 * SVG and HTML are intentionally excluded to eliminate Stored XSS (SEC-05).
 */
function detectRasterFormatFromMagicBytes(buf) {
  if (!buf || buf.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { ext: ".png", mime: "image/png" };
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: ".jpg", mime: "image/jpeg" };
  }

  // GIF87a / GIF89a: 47 49 46 38 (37|39) 61
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return { ext: ".gif", mime: "image/gif" };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return { ext: ".webp", mime: "image/webp" };
  }

  return null;
}

export async function POST(request) {
  try {
    // 1. Require authenticated ORG_OWNER or ORG_ADMIN
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;

    // 2. Enforce file upload rate limit
    const rateCheck = await enforceRateLimit(
      "file_upload",
      principal.organizationId || principal.userId
    );
    if (!rateCheck.ok) return rateCheck.response;

    const formData = await request.formData();
    const file = formData.get("file") || formData.get("image");

    if (!file || typeof file === "string") {
      return applyRateLimitHeaders(
        NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 }),
        rateCheck.result
      );
    }

    const { maxImageBytes } = getAiResourceLimits();
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0 || buffer.length > maxImageBytes) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: `Image file must be between 1 byte and ${Math.round(maxImageBytes / (1024 * 1024))}MB.` },
          { status: 400 }
        ),
        rateCheck.result
      );
    }

    // 3. Strict binary magic-byte validation (never trust client filename extension or MIME header)
    const detected = detectRasterFormatFromMagicBytes(buffer);
    if (!detected) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Unsupported or unsafe image format. Please upload a valid PNG, JPG, WEBP, or GIF image (SVG/HTML are disallowed for security).",
          },
          { status: 400 }
        ),
        rateCheck.result
      );
    }

    const safeName = `logo_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${detected.ext}`;
    const uploadDir = resolvePrivateUploadDir();
    await fsp.mkdir(uploadDir, { recursive: true });

    const targetFile = path.join(uploadDir, safeName);
    await fsp.writeFile(targetFile, buffer);

    const relativeUrl = `/api/upload/image/${safeName}`;

    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        url: relativeUrl,
        mimeType: detected.mime,
        size: buffer.length,
      }),
      rateCheck.result
    );
  } catch (err) {
    console.error("Upload image error:", err);
    return NextResponse.json({ success: false, error: "Failed to upload image." }, { status: 500 });
  }
}
