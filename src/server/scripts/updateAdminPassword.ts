import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../lib/security/password";

const prisma = new PrismaClient();

async function main() {
  const targetEmail = (process.env.ADMIN_EMAIL || process.argv[2] || "admin@vantagewealth.in").toLowerCase().trim();
  const newPassword = process.env.NEW_ADMIN_PASSWORD || process.argv[3];

  if (!newPassword || newPassword.length < 12) {
    console.error("ERROR: A new password of at least 12 characters is required.");
    console.error("Usage: NEW_ADMIN_PASSWORD='your-secure-password' npx tsx src/server/scripts/updateAdminPassword.ts [email]");
    process.exit(1);
  }

  const existingUser = await prisma.adminUser.findUnique({
    where: { email: targetEmail },
  });

  if (!existingUser) {
    console.error(`ERROR: Administrator account with email '${targetEmail}' was not found in the database.`);
    process.exit(1);
  }

  const newHash = await hashPassword(newPassword);

  await prisma.adminUser.update({
    where: { email: targetEmail },
    data: {
      passwordHash: newHash,
      updatedAt: new Date(),
    },
  });

  console.log(`✓ Password successfully updated and cryptographically hashed for administrator: ${targetEmail}`);
}

main()
  .catch((err) => {
    console.error("Failed to update administrator password:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
