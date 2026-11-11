import fs from "fs";
import path from "path";
import { cacheTag } from "next/cache";
import { TeamMemberItem, TeamMemberFormData } from "@/types/team";
import { prisma } from "@/lib/db/prisma";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "lib", "db", "team-data.json");

interface DataStore {
  members: TeamMemberItem[];
}

function readDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading team data file:", error);
  }
  return { members: [] };
}

function writeDataStore(data: DataStore): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing team data file:", error);
  }
}

function syncLocalStoreFromDb(dbMembers: any[]): void {
  try {
    if (Array.isArray(dbMembers) && dbMembers.length > 0) {
      writeDataStore({
        members: dbMembers.map((m) => ({
          ...m,
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
          updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
        })),
      });
    }
  } catch (e) {
    console.warn("Failed to sync fallback store with DB:", e);
  }
}

export function normalizePhotoUrl(url?: string | null): string {
  if (!url) return "/images/about/founder-vineet-gupta.png";
  const trimmed = url.trim();
  if (/^\/?uploads\//i.test(trimmed)) {
    return trimmed.replace(/^\/?uploads\//i, "/uploads/");
  }
  return trimmed;
}

/**
 * Normalizes and formats experience string to include "Years"
 * E.g., "20+" -> "20+ Years", "15" -> "15 Years", "20+ Years" -> "20+ Years", "15+ yrs" -> "15+ Years"
 * Prevents duplicates like "20+ Years Years"
 */
export function formatExperience(val?: string | null): string {
  if (!val) return "";
  let trimmed = val.trim();
  if (!trimmed) return "";

  // Strip any existing repeated "years" or "yrs" suffix
  trimmed = trimmed.replace(/(\s*(years?|yrs?))+$/i, "");

  if (!trimmed) return "";
  return `${trimmed} Years`;
}

/**
 * Universal Cache Invalidation helper for Team & Founder data
 * Invalidates Cache Components cache tags and public/admin route caches
 */
export async function revalidateTeamCache(): Promise<void> {
  try {
    const { revalidateTag, revalidatePath } = await import("next/cache");
    // Next.js 16 Cache Components tag invalidation
    revalidateTag("team-founder", "max");
    revalidateTag("team-members", "max");
    revalidateTag("team", "max");

    // Public and Admin route cache invalidation
    revalidatePath("/about", "page");
    revalidatePath("/about");
    revalidatePath("/admin/team", "page");
    revalidatePath("/admin/team");
    revalidatePath("/", "layout");
  } catch (e) {
    console.warn("revalidateTeamCache notice:", e);
  }
}

/**
 * Fetch Founder Profile for Public About Page and Admin CMS.
 * Prioritizes PostgreSQL as the primary source of truth.
 */
export async function getFounderProfile(): Promise<TeamMemberItem | null> {
  "use cache";
  cacheTag("team-founder", "team");

  if (prisma) {
    try {
      const dbFounder = await prisma.teamMember.findFirst({
        where: { roleType: "FOUNDER" },
        orderBy: { createdAt: "asc" },
      });
      if (dbFounder) {
        return {
          ...dbFounder,
          photoUrl: normalizePhotoUrl(dbFounder.photoUrl),
          experienceYears: dbFounder.experienceYears ? formatExperience(dbFounder.experienceYears) : null,
          createdAt: dbFounder.createdAt.toISOString(),
          updatedAt: dbFounder.updatedAt.toISOString(),
        } as unknown as TeamMemberItem;
      }
      return null;
    } catch (e) {
      console.error("PostgreSQL getFounderProfile error:", e);
      throw new Error("Failed to query founder profile from PostgreSQL database.");
    }
  }

  const data = readDataStore();
  const founder = data.members.find((m) => m.roleType === "FOUNDER");
  return founder ? { ...founder, photoUrl: normalizePhotoUrl(founder.photoUrl), experienceYears: formatExperience(founder.experienceYears) } : null;
}

/**
 * Fetch Published Team Members (excluding Founder) ordered by display order.
 * Prioritizes PostgreSQL as the primary source of truth.
 */
export async function getPublishedTeamMembers(): Promise<TeamMemberItem[]> {
  "use cache";
  cacheTag("team-members", "team");

  if (prisma) {
    try {
      const dbMembers = await prisma.teamMember.findMany({
        where: { roleType: "TEAM", status: "PUBLISHED" },
        orderBy: { displayOrder: "asc" },
      });
      return dbMembers.map((m: any) => ({
        ...m,
        photoUrl: normalizePhotoUrl(m.photoUrl),
        experienceYears: m.experienceYears ? formatExperience(m.experienceYears) : null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })) as unknown as TeamMemberItem[];
    } catch (e) {
      console.error("PostgreSQL getPublishedTeamMembers error:", e);
      throw new Error("Failed to query published team members from PostgreSQL database.");
    }
  }

  const data = readDataStore();
  return data.members
    .filter((m) => m.roleType === "TEAM" && m.status === "PUBLISHED")
    .map((m) => ({ ...m, photoUrl: normalizePhotoUrl(m.photoUrl), experienceYears: formatExperience(m.experienceYears) }))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

/**
 * Fetch all Team Members and Founder for Admin CMS.
 * Prioritizes PostgreSQL as the primary source of truth and keeps fallback store synced.
 */
export async function getAllTeamMembers(): Promise<TeamMemberItem[]> {
  if (prisma) {
    try {
      const dbMembers = await prisma.teamMember.findMany({
        orderBy: [
          { roleType: "asc" }, // FOUNDER first
          { displayOrder: "asc" },
        ],
      });
      syncLocalStoreFromDb(dbMembers);
      return dbMembers.map((m: any) => ({
        ...m,
        photoUrl: normalizePhotoUrl(m.photoUrl),
        experienceYears: m.experienceYears ? formatExperience(m.experienceYears) : null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })) as unknown as TeamMemberItem[];
    } catch (e) {
      console.error("PostgreSQL getAllTeamMembers error:", e);
      throw new Error("Failed to query team members from PostgreSQL database.");
    }
  }

  const data = readDataStore();
  return data.members.map((m) => ({ ...m, experienceYears: formatExperience(m.experienceYears) })).sort((a, b) => {
    if (a.roleType === "FOUNDER" && b.roleType !== "FOUNDER") return -1;
    if (b.roleType === "FOUNDER" && a.roleType !== "FOUNDER") return 1;
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });
}

/**
 * Get Team Member by ID from PostgreSQL
 */
export async function getTeamMemberById(id: string): Promise<TeamMemberItem | null> {
  if (prisma) {
    try {
      const dbMember = await prisma.teamMember.findUnique({
        where: { id },
      });
      if (dbMember) {
        return {
          ...dbMember,
          photoUrl: normalizePhotoUrl(dbMember.photoUrl),
          experienceYears: dbMember.experienceYears ? formatExperience(dbMember.experienceYears) : null,
          createdAt: dbMember.createdAt.toISOString(),
          updatedAt: dbMember.updatedAt.toISOString(),
        } as unknown as TeamMemberItem;
      }
      return null;
    } catch (e) {
      console.error("PostgreSQL getTeamMemberById error:", e);
      throw new Error(`Failed to query team member ID "${id}" from PostgreSQL.`);
    }
  }

  const data = readDataStore();
  const member = data.members.find((m) => m.id === id);
  return member ? { ...member, photoUrl: normalizePhotoUrl(member.photoUrl), experienceYears: formatExperience(member.experienceYears) } : null;
}

/**
 * Get Team Member by Slug from PostgreSQL
 */
export async function getTeamMemberBySlug(slug: string): Promise<TeamMemberItem | null> {
  if (prisma) {
    try {
      const dbMember = await prisma.teamMember.findUnique({
        where: { slug },
      });
      if (dbMember) {
        return {
          ...dbMember,
          photoUrl: normalizePhotoUrl(dbMember.photoUrl),
          experienceYears: dbMember.experienceYears ? formatExperience(dbMember.experienceYears) : null,
          createdAt: dbMember.createdAt.toISOString(),
          updatedAt: dbMember.updatedAt.toISOString(),
        } as unknown as TeamMemberItem;
      }
      return null;
    } catch (e) {
      console.error("PostgreSQL getTeamMemberBySlug error:", e);
      throw new Error(`Failed to query team member slug "${slug}" from PostgreSQL.`);
    }
  }

  const data = readDataStore();
  const member = data.members.find((m) => m.slug === slug);
  return member ? { ...member, photoUrl: normalizePhotoUrl(member.photoUrl), experienceYears: formatExperience(member.experienceYears) } : null;
}

/**
 * Create a new Team Member directly in PostgreSQL, syncing to local fallback store.
 */
export async function createTeamMember(formData: Partial<TeamMemberFormData>): Promise<TeamMemberItem> {
  const id = `member_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = (formData.slug || formData.name || id)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const canonicalPhotoUrl = normalizePhotoUrl(formData.photoUrl);
  const canonicalExperience = formData.experienceYears?.trim()
    ? formatExperience(formData.experienceYears)
    : null;

  if (prisma) {
    const existing = await prisma.teamMember.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`Profile slug "${slug}" already exists in PostgreSQL.`);
    }

    try {
      const createdDb = await prisma.teamMember.create({
        data: {
          id,
          name: formData.name ? formData.name.trim() : "New Team Member",
          slug,
          roleType: formData.roleType || "TEAM",
          designation: formData.designation ? formData.designation.trim() : "Advisory Specialist",
          bio: formData.bio ? formData.bio.trim() : "",
          photoUrl: canonicalPhotoUrl,
          experienceYears: canonicalExperience,
          credentials: formData.credentials?.trim() || null,
          linkedInUrl: formData.linkedInUrl?.trim() || null,
          email: formData.email?.trim() || null,
          status: formData.status || "PUBLISHED",
          displayOrder: typeof formData.displayOrder === "number" ? formData.displayOrder : 0,
        },
      });

      const formatted: TeamMemberItem = {
        ...createdDb,
        photoUrl: normalizePhotoUrl(createdDb.photoUrl),
        experienceYears: createdDb.experienceYears ? formatExperience(createdDb.experienceYears) : null,
        createdAt: createdDb.createdAt.toISOString(),
        updatedAt: createdDb.updatedAt.toISOString(),
      } as unknown as TeamMemberItem;

      // Mirror to fallback store
      const data = readDataStore();
      data.members = data.members.filter((m) => m.id !== createdDb.id);
      data.members.push(formatted);
      writeDataStore(data);

      // Revalidate cache tags and public routes
      await revalidateTeamCache();

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL createTeamMember failed:", e);
      throw new Error(`Database error creating team member: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot create team member without PostgreSQL connection.");
}

/**
 * Update Team Member in PostgreSQL, mirroring changes to fallback store.
 */
export async function updateTeamMember(
  id: string,
  formData: Partial<TeamMemberFormData>
): Promise<TeamMemberItem> {
  if (prisma) {
    const existingDb = await prisma.teamMember.findUnique({ where: { id } });
    if (!existingDb) {
      throw new Error(`Team member with ID "${id}" does not exist in PostgreSQL.`);
    }

    let finalSlug = existingDb.slug;
    if (formData.slug && formData.slug !== existingDb.slug) {
      const checkSlug = formData.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const duplicate = await prisma.teamMember.findFirst({
        where: { slug: checkSlug, NOT: { id } },
      });
      if (duplicate) {
        throw new Error(`Slug "${checkSlug}" is already in use by another team member.`);
      }
      finalSlug = checkSlug;
    }

    const updatedPhotoUrl = formData.photoUrl !== undefined
      ? normalizePhotoUrl(formData.photoUrl)
      : normalizePhotoUrl(existingDb.photoUrl);

    const updatedExperience = formData.experienceYears !== undefined
      ? (formData.experienceYears?.trim() ? formatExperience(formData.experienceYears) : null)
      : existingDb.experienceYears;

    try {
      const updatedDb = await prisma.teamMember.update({
        where: { id },
        data: {
          name: formData.name !== undefined ? formData.name.trim() : existingDb.name,
          slug: finalSlug,
          designation: formData.designation !== undefined ? formData.designation.trim() : existingDb.designation,
          bio: formData.bio !== undefined ? formData.bio.trim() : existingDb.bio,
          photoUrl: updatedPhotoUrl,
          experienceYears: updatedExperience,
          credentials: formData.credentials !== undefined ? (formData.credentials?.trim() || null) : existingDb.credentials,
          linkedInUrl: formData.linkedInUrl !== undefined ? (formData.linkedInUrl?.trim() || null) : existingDb.linkedInUrl,
          email: formData.email !== undefined ? (formData.email?.trim() || null) : existingDb.email,
          status: formData.status !== undefined ? formData.status : existingDb.status,
          roleType: formData.roleType !== undefined ? formData.roleType : existingDb.roleType,
          displayOrder: typeof formData.displayOrder === "number" ? formData.displayOrder : existingDb.displayOrder,
        },
      });

      const formatted: TeamMemberItem = {
        ...updatedDb,
        photoUrl: normalizePhotoUrl(updatedDb.photoUrl),
        experienceYears: updatedDb.experienceYears ? formatExperience(updatedDb.experienceYears) : null,
        createdAt: updatedDb.createdAt.toISOString(),
        updatedAt: updatedDb.updatedAt.toISOString(),
      } as unknown as TeamMemberItem;

      // Mirror to fallback store
      const data = readDataStore();
      const idx = data.members.findIndex((m) => m.id === id);
      if (idx !== -1) {
        data.members[idx] = formatted;
      } else {
        data.members.push(formatted);
      }
      writeDataStore(data);

      // Revalidate cache tags and public routes
      await revalidateTeamCache();

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL updateTeamMember failed:", e);
      throw new Error(`Database error updating team member: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot update team member without PostgreSQL connection.");
}

/**
 * Delete Team Member from PostgreSQL (protects Founder profile)
 */
export async function deleteTeamMember(id: string): Promise<boolean> {
  if (prisma) {
    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      return false;
    }

    if (member.roleType === "FOUNDER") {
      throw new Error("The Founder profile cannot be deleted. You can modify details or set status to DRAFT instead.");
    }

    try {
      await prisma.teamMember.delete({ where: { id } });

      const data = readDataStore();
      data.members = data.members.filter((m) => m.id !== id);
      writeDataStore(data);

      // Revalidate cache tags and public routes
      await revalidateTeamCache();

      return true;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL deleteTeamMember failed:", e);
      throw new Error(`Database error deleting team member: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot delete team member without PostgreSQL connection.");
}

/**
 * Reorder Team Members in PostgreSQL
 */
export async function reorderTeamMembers(orderedIds: string[]): Promise<void> {
  if (prisma) {
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await prisma.teamMember.update({
          where: { id: orderedIds[i] },
          data: { displayOrder: i + 1 },
        });
      }

      // Sync updated order to fallback store
      const allMembers = await prisma.teamMember.findMany({
        orderBy: [{ roleType: "asc" }, { displayOrder: "asc" }],
      });
      syncLocalStoreFromDb(allMembers);

      // Revalidate cache tags and public routes
      await revalidateTeamCache();

      return;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL reorderTeamMembers failed:", e);
      throw new Error(`Database error reordering team members: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot reorder team members without PostgreSQL connection.");
}
