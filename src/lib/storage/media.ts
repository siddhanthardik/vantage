import fs from "fs";
import path from "path";
import crypto from "crypto";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface UploadedFileResult {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  storageType: "LOCAL" | "R2";
}

/**
 * Validate image file by MIME type and size
 */
export function validateImageUpload(file: { type: string; size: number; name: string }): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format (${file.type}). Allowed types: JPG, PNG, WebP, SVG, GIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  return { valid: true };
}

/**
 * Upload buffer to Cloudflare R2 if configured, or local filesystem
 */
export async function uploadMediaFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadedFileResult> {
  const ext = path.extname(originalFilename).toLowerCase() || ".png";
  const sanitizedBase = path
    .basename(originalFilename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 40);

  const randomHash = crypto.randomBytes(6).toString("hex");
  const uniqueFilename = `${sanitizedBase}-${randomHash}${ext}`;

  // Check if Cloudflare R2 credentials are fully configured
  const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  const isR2Configured = Boolean(r2AccountId && r2AccessKey && r2SecretKey && r2Bucket && r2PublicUrl);

  if (isR2Configured) {
    try {
      // Cloudflare R2 S3-Compatible Upload
      const r2Url = `${r2PublicUrl?.replace(/\/$/, "")}/${uniqueFilename}`;
      const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${uniqueFilename}`;

      // In production, when R2 credentials are set, dispatches PUT request
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "Content-Length": buffer.length.toString(),
          "X-Amz-Content-Sha256": crypto.createHash("sha256").update(buffer).digest("hex"),
        },
        body: new Uint8Array(buffer),
      });

      if (response.ok) {
        return {
          filename: uniqueFilename,
          originalName: originalFilename,
          url: r2Url,
          mimeType,
          sizeBytes: buffer.length,
          storageType: "R2",
        };
      }
      console.warn("R2 upload responded with non-200. Falling back to secure local storage:", response.status);
    } catch (r2Err) {
      console.warn("R2 upload failed. Falling back to local storage:", r2Err);
    }
  }

  // Local Storage Handler: Persistent public/uploads/
  const uploadsDir = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
  }

  const filePath = path.join(uploadsDir, uniqueFilename);
  fs.writeFileSync(filePath, buffer);

  // Set explicit world-readable permissions (0644) so Linux web servers & Next.js workers can read
  try {
    fs.chmodSync(filePath, 0o644);
  } catch {}

  // Canonical canonical URL format: always lowercase /uploads/[filename]
  const canonicalUrl = `/uploads/${uniqueFilename}`;

  return {
    filename: uniqueFilename,
    originalName: originalFilename,
    url: canonicalUrl,
    mimeType,
    sizeBytes: buffer.length,
    storageType: "LOCAL",
  };
}
