import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getAllMedia, saveMediaItem } from "@/server/repositories/mediaRepository";
import { validateImageUpload, uploadMediaFile } from "@/lib/storage/media";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const media = await getAllMedia();
    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load media assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // 1. Validation
    const validation = validateImageUpload({
      type: file.type,
      size: file.size,
      name: file.name,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Buffer conversion & Upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await uploadMediaFile(buffer, file.name, file.type);

    // 3. Save Record in Database
    const savedRecord = await saveMediaItem({
      filename: uploadResult.filename,
      originalName: uploadResult.originalName,
      url: uploadResult.url,
      mimeType: uploadResult.mimeType,
      sizeBytes: uploadResult.sizeBytes,
      storageType: uploadResult.storageType,
      altText,
    });

    // 4. Audit Log
    await logAuditEvent({
      action: "MEDIA_UPLOADED",
      entityType: "MEDIA",
      entityId: savedRecord.id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: {
        filename: savedRecord.filename,
        storageType: savedRecord.storageType,
        sizeBytes: savedRecord.sizeBytes,
      },
    });

    return NextResponse.json({ success: true, media: savedRecord }, { status: 201 });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload media file" },
      { status: 500 }
    );
  }
}
