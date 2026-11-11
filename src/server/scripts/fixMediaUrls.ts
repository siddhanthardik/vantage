import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is loaded from .env if not already set
if (!process.env.DATABASE_URL) {
  for (const envFileName of [".env", ".env.local", ".env.production"]) {
    const envPath = path.resolve(process.cwd(), envFileName);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = (match[2] || "").trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (!process.env[key]) process.env[key] = value;
          }
        }
      } catch {}
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("Vantage Wealth — Production Image Storage & URL Forensic Audit & Repair Utility");
  console.log("================================================================================");
  console.log("");

  // 1. Filesystem Verification & Directory Normalization
  console.log("--- 1. Filesystem Storage Audit ---");
  const publicDir = path.join(process.cwd(), "public");
  const lowercaseUploads = path.join(publicDir, "uploads");
  const uppercaseUploads = path.join(publicDir, "Uploads");

  if (!fs.existsSync(lowercaseUploads)) {
    console.log(`[Filesystem] Creating canonical directory: ${lowercaseUploads}`);
    fs.mkdirSync(lowercaseUploads, { recursive: true, mode: 0o755 });
  } else {
    console.log(`[Filesystem] Canonical directory exists: ${lowercaseUploads}`);
  }

  // Check if legacy uppercase 'Uploads' exists as an independent directory
  let uppercaseFilesMigrated = 0;
  if (fs.existsSync(uppercaseUploads)) {
    try {
      const stats = fs.lstatSync(uppercaseUploads);
      if (stats.isDirectory() && !stats.isSymbolicLink()) {
        console.log(`[Filesystem] Detected uppercase directory: ${uppercaseUploads}`);
        const files = fs.readdirSync(uppercaseUploads);
        for (const file of files) {
          const srcFile = path.join(uppercaseUploads, file);
          const destFile = path.join(lowercaseUploads, file);
          if (fs.statSync(srcFile).isFile()) {
            if (!fs.existsSync(destFile)) {
              fs.copyFileSync(srcFile, destFile);
              try { fs.chmodSync(destFile, 0o644); } catch {}
              console.log(`  ✓ Synced file to canonical uploads: ${file}`);
              uppercaseFilesMigrated++;
            }
          }
        }
      }
    } catch (e) {
      console.warn("  ! Note during uppercase folder inspection:", e);
    }
  }

  // Ensure world-readable permissions (0644) on all files in public/uploads
  try {
    const canonicalFiles = fs.readdirSync(lowercaseUploads);
    for (const file of canonicalFiles) {
      const filePath = path.join(lowercaseUploads, file);
      if (fs.statSync(filePath).isFile()) {
        try { fs.chmodSync(filePath, 0o644); } catch {}
      }
    }
    console.log(`[Filesystem] Total verified files in public/uploads: ${canonicalFiles.length}`);
  } catch (e) {
    console.warn("  ! Note during file permissions update:", e);
  }

  // Create Linux filesystem-level compatibility symlink if not already present
  if (process.platform !== "win32") {
    try {
      if (!fs.existsSync(uppercaseUploads)) {
        fs.symlinkSync(lowercaseUploads, uppercaseUploads, "dir");
        console.log(`[Filesystem] Created Linux compatibility symlink: public/Uploads -> public/uploads`);
      }
    } catch (e) {
      console.warn("  ! Note during symlink creation:", e);
    }
  }
  console.log("");

  // 2. Database URL Audit & Normalization
  console.log("--- 2. Database Record Normalization ---");
  let teamUpdatedCount = 0;
  let mediaUpdatedCount = 0;

  try {
    // Audit Team Members
    const teamMembers = await prisma.teamMember.findMany();
    console.log(`[Database] Found ${teamMembers.length} team member records in PostgreSQL.`);

    for (const member of teamMembers) {
      if (member.photoUrl && /^\/?uploads\//i.test(member.photoUrl)) {
        const canonical = member.photoUrl.replace(/^\/?uploads\//i, "/uploads/");
        if (canonical !== member.photoUrl) {
          console.log(`  Updating Team Member "${member.name}" (${member.slug}):`);
          console.log(`    Before: ${member.photoUrl}`);
          console.log(`    After:  ${canonical}`);

          await prisma.teamMember.update({
            where: { id: member.id },
            data: {
              photoUrl: canonical,
              updatedAt: new Date(),
            },
          });
          teamUpdatedCount++;
        }
      }
    }

    // Audit Media Items
    const mediaItems = await prisma.mediaItem.findMany();
    console.log(`[Database] Found ${mediaItems.length} media library records in PostgreSQL.`);

    for (const item of mediaItems) {
      if (item.url && /^\/?uploads\//i.test(item.url)) {
        const canonical = item.url.replace(/^\/?uploads\//i, "/uploads/");
        if (canonical !== item.url) {
          console.log(`  Updating Media Item "${item.filename}":`);
          console.log(`    Before: ${item.url}`);
          console.log(`    After:  ${canonical}`);

          await prisma.mediaItem.update({
            where: { id: item.id },
            data: {
              url: canonical,
            },
          });
          mediaUpdatedCount++;
        }
      }
    }
  } catch (dbErr: any) {
    console.error("Database query failed:", dbErr.message);
  }

  console.log("");
  console.log("--- 3. Audit & Repair Summary ---");
  console.log(`Filesystem assets migrated: ${uppercaseFilesMigrated}`);
  console.log(`Team member records updated: ${teamUpdatedCount}`);
  console.log(`Media library records updated: ${mediaUpdatedCount}`);
  console.log("✓ Audit and repair completed successfully.");
}

main()
  .catch((err) => {
    console.error("FATAL: Audit failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
