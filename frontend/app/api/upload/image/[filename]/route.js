import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function resolveUploadDir() {
  const directPublic = path.join(process.cwd(), "public");
  const baseDir = fs.existsSync(directPublic) ? directPublic : path.join(process.cwd(), "frontend", "public");
  return path.join(baseDir, "uploads");
}

const MIME_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
};

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const uploadDir = resolveUploadDir();
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new NextResponse("Error reading file", { status: 500 });
  }
}
