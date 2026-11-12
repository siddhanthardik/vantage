import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Authoritative MIME type mapping for all supported photographic & vector assets
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

/**
 * Production-Safe Dynamic Image Delivery Route Handler
 * 
 * Serves uploaded photographic assets directly from disk:
 * 1. Resilient across case-sensitive Linux filesystems (handles /Uploads vs /uploads).
 * 2. Scans multiple persistent locations (public/uploads, public/Uploads, uploads, UPLOADS_DIR).
 * 3. Case-insensitive fallback ensures that files uploaded with differing casing always resolve.
 * 4. Enables Next.js Image Optimizer internal fetches to return HTTP 200 without 404 breaks.
 * 5. Emits RFC-compliant caching headers (Cache-Control: immutable, ETag, 304 Not Modified).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ file: string[] }> }
) {
  try {
    const { file } = await context.params;
    if (!file || file.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Join route segments to get relative file path (e.g., "siddhant-pp-photo-a1b2c3.jpg")
    const relativePath = file.join("/");

    // Path traversal security verification
    if (
      relativePath.includes("..") ||
      relativePath.startsWith("/") ||
      relativePath.startsWith("\\") ||
      path.isAbsolute(relativePath)
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Candidate persistent directories to search
    const candidateDirs: string[] = [];

    if (process.env.UPLOADS_DIR) {
      candidateDirs.push(path.resolve(process.env.UPLOADS_DIR));
    }

    candidateDirs.push(
      path.join(process.cwd(), "public", "uploads"),
      path.join(process.cwd(), "uploads")
    );

    let resolvedFilePath: string | null = null;

    for (const baseDir of candidateDirs) {
      if (!fs.existsSync(baseDir)) continue;

      // 1. Direct path lookup
      const directPath = path.join(baseDir, relativePath);
      if (fs.existsSync(directPath)) {
        try {
          if (fs.statSync(directPath).isFile()) {
            resolvedFilePath = directPath;
            break;
          }
        } catch {}
      }

      // 2. Case-insensitive filename fallback (critical for Linux VPS where requested casing differs)
      const subDir = path.dirname(directPath);
      const targetBaseName = path.basename(directPath).toLowerCase();

      if (fs.existsSync(subDir)) {
        try {
          const dirEntries = fs.readdirSync(subDir);
          const matchedEntry = dirEntries.find(
            (entry) => entry.toLowerCase() === targetBaseName
          );

          if (matchedEntry) {
            const matchedPath = path.join(subDir, matchedEntry);
            if (fs.statSync(matchedPath).isFile()) {
              resolvedFilePath = matchedPath;
              break;
            }
          }
        } catch {}
      }
    }

    if (!resolvedFilePath) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    // Read file metadata and determine MIME type
    const stat = fs.statSync(resolvedFilePath);
    const ext = path.extname(resolvedFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // ETag validation for HTTP 304 caching
    const etag = `"${stat.size}-${Math.floor(stat.mtimeMs)}"`;
    const ifNoneMatch = req.headers.get("if-none-match");

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const fileBuffer = fs.readFileSync(resolvedFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Upload delivery error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
