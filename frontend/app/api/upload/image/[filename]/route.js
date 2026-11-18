import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

function resolveCandidateUploadDirs() {
  const dirs = [];
  const directData = path.join(process.cwd(), "data", "uploads");
  const nestedData = path.join(process.cwd(), "frontend", "data", "uploads");
  const directPublic = path.join(process.cwd(), "public", "uploads");
  const nestedPublic = path.join(process.cwd(), "frontend", "public", "uploads");
  for (const d of [directData, nestedData, directPublic, nestedPublic]) {
    if (fs.existsSync(/*turbopackIgnore: true*/ d)) dirs.push(d);
  }
  return dirs;
}

// Only safe non-executable raster image MIME types are served inline
const SAFE_RASTER_MIME_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    // Strict whitelist: alphanumeric, underscore, hyphen, single extension dot only
    if (!filename || !/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif)$/i.test(filename)) {
      return new NextResponse("Invalid or unsupported image filename", { status: 400 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = SAFE_RASTER_MIME_MAP[ext];
    if (!contentType) {
      return new NextResponse("Unsupported file type", { status: 415 });
    }

    let targetPath = null;
    for (const dir of resolveCandidateUploadDirs()) {
      const candidate = path.resolve(dir, filename);
      if (candidate.startsWith(path.resolve(dir) + path.sep) && fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
        targetPath = candidate;
        break;
      }
    }

    if (!targetPath) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await fsp.readFile(/*turbopackIgnore: true*/ targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Error reading file", { status: 500 });
  }
}
