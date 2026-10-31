import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function resolveUploadDir() {
  const directPublic = path.join(process.cwd(), "public");
  const baseDir = fs.existsSync(directPublic) ? directPublic : path.join(process.cwd(), "frontend", "public");
  const targetDir = path.join(baseDir, "uploads");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") || formData.get("image");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    const mime = file.type || "";
    if (!mime.startsWith("image/") && !file.name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload a PNG, JPG, WEBP, or SVG." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image file exceeds 5MB size limit." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name || "") || (mime.includes("png") ? ".png" : mime.includes("svg") ? ".svg" : ".webp");
    const safeName = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const uploadDir = resolveUploadDir();
    const targetFile = path.join(uploadDir, safeName);

    fs.writeFileSync(targetFile, buffer);

    const relativeUrl = `/api/upload/image/${safeName}`;

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      fileName: file.name,
      size: buffer.length,
    });
  } catch (err) {
    console.error("Upload image error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
