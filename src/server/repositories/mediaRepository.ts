import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";

export interface MediaItemRecord {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  storageType: "LOCAL" | "R2";
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), "src", "lib", "db", "media-data.json");

interface MediaDataStore {
  media: MediaItemRecord[];
}

function readDataStore(): MediaDataStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading media data file:", error);
  }
  return { media: [] };
}

function writeDataStore(data: MediaDataStore): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing media data file:", error);
  }
}

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^\/?uploads\//i.test(trimmed)) {
    return trimmed.replace(/^\/?uploads\//i, "/uploads/");
  }
  return trimmed;
}

export async function getAllMedia(): Promise<MediaItemRecord[]> {
  if (prisma) {
    try {
      const items = await prisma.mediaItem.findMany({
        orderBy: { createdAt: "desc" },
      });
      return items.map((item: any) => ({
        ...item,
        url: normalizeMediaUrl(item.url),
        createdAt: item.createdAt.toISOString(),
      }));
    } catch (e) {
      console.error("PostgreSQL getAllMedia query error:", e);
      throw new Error("Failed to query media items from PostgreSQL.");
    }
  }

  const store = readDataStore();
  return store.media.map((m) => ({ ...m, url: normalizeMediaUrl(m.url) }));
}

export async function getMediaById(id: string): Promise<MediaItemRecord | null> {
  if (prisma) {
    try {
      const item = await prisma.mediaItem.findUnique({ where: { id } });
      if (!item) return null;
      return {
        ...item,
        url: normalizeMediaUrl(item.url),
        createdAt: item.createdAt.toISOString(),
      };
    } catch (e) {
      console.error("PostgreSQL getMediaById query error:", e);
      throw new Error(`Failed to query media item ID "${id}" from PostgreSQL.`);
    }
  }

  const store = readDataStore();
  const found = store.media.find((m) => m.id === id) || null;
  return found ? { ...found, url: normalizeMediaUrl(found.url) } : null;
}

export async function saveMediaItem(
  data: Omit<MediaItemRecord, "id" | "createdAt">
): Promise<MediaItemRecord> {
  const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const canonicalUrl = normalizeMediaUrl(data.url);

  if (prisma) {
    try {
      const created = await prisma.mediaItem.create({
        data: {
          id,
          filename: data.filename,
          originalName: data.originalName,
          url: canonicalUrl,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          storageType: data.storageType,
          altText: data.altText || null,
          width: data.width || null,
          height: data.height || null,
          createdAt: now,
        },
      });

      const formatted: MediaItemRecord = {
        ...created,
        createdAt: created.createdAt.toISOString(),
      };

      // Mirror to fallback store
      const store = readDataStore();
      store.media.unshift(formatted);
      writeDataStore(store);

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL saveMediaItem failed:", e);
      throw new Error(`Database error saving media asset to PostgreSQL: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot save media asset without PostgreSQL connection.");
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  if (prisma) {
    const existing = await prisma.mediaItem.findUnique({ where: { id } });
    if (!existing) return false;

    // Safety check: Prevent deleting media actively referenced by existing pages
    const [serviceRef, articleRef, teamRef, settingsRef] = await Promise.all([
      prisma.service.findFirst({
        where: {
          OR: [
            { thumbnailImage: { contains: existing.filename } },
            { heroImage: { contains: existing.filename } },
            { ogImage: { contains: existing.filename } },
          ],
        },
      }),
      prisma.article.findFirst({
        where: {
          OR: [
            { coverImage: { contains: existing.filename } },
            { ogImage: { contains: existing.filename } },
            { content: { contains: existing.filename } },
          ],
        },
      }),
      prisma.teamMember.findFirst({
        where: { photoUrl: { contains: existing.filename } },
      }),
      prisma.businessSettings.findFirst({
        where: { heroImageUrl: { contains: existing.filename } },
      }),
    ]);

    if (serviceRef || articleRef || teamRef || settingsRef) {
      const location = serviceRef
        ? `Service "${serviceRef.title}"`
        : articleRef
        ? `Article "${articleRef.title}"`
        : teamRef
        ? `Team Member "${teamRef.name}"`
        : "Homepage Hero Settings";
      throw new Error(
        `Cannot delete media asset "${existing.originalName}": It is actively referenced by ${location}. Please replace or remove the image in the editor before deleting it.`
      );
    }

    // Remove local file if stored locally
    if (existing.storageType === "LOCAL") {
      try {
        const candidatePaths = [
          path.join(process.cwd(), "public", "uploads", existing.filename),
          path.join(process.cwd(), "public", "Uploads", existing.filename),
        ];
        if (process.env.UPLOADS_DIR) {
          candidatePaths.unshift(path.join(path.resolve(process.env.UPLOADS_DIR), existing.filename));
        }

        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            break;
          }
        }
      } catch (e) {
        console.warn("Failed to remove local media file:", e);
      }
    }

    try {
      await prisma.mediaItem.delete({ where: { id } });

      const store = readDataStore();
      store.media = store.media.filter((m) => m.id !== id);
      writeDataStore(store);

      return true;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL deleteMediaItem failed:", e);
      throw new Error(`Database error deleting media asset from PostgreSQL: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot delete media asset without PostgreSQL connection.");
}
