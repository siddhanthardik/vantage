// Safe Prisma Client Initializer
// Manages PostgreSQL database connection with fail-safe resilience

let prisma: any = null;

try {
  // If running in a script outside Next.js, load .env into process.env if needed
  if (!process.env.DATABASE_URL) {
    try {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
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
      }
    } catch {}
  }

  if (process.env.DATABASE_URL) {
    const { PrismaClient } = require("@prisma/client");
    const globalForPrisma = global as unknown as { prisma: any };
    prisma = globalForPrisma.prisma || new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "CRITICAL: DATABASE_URL environment variable is not defined. Production deployments require a connected PostgreSQL database."
    );
  }
} catch (e) {
  console.warn("Prisma Client initialization warning:", e);
  prisma = null;
}

/**
 * Diagnostic helper to verify PostgreSQL connectivity
 */
export async function verifyPostgresConnection(): Promise<{
  connected: boolean;
  status: string;
  error?: string;
}> {
  if (!process.env.DATABASE_URL) {
    return {
      connected: false,
      status: "DISCONNECTED",
      error: "DATABASE_URL environment variable is not configured. PostgreSQL connection string required.",
    };
  }

  if (!prisma) {
    return {
      connected: false,
      status: "UNAVAILABLE",
      error: "Prisma client could not be initialized.",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      status: "CONNECTED",
    };
  } catch (err: any) {
    return {
      connected: false,
      status: "CONNECTION_FAILED",
      error: err.message || "Failed to reach PostgreSQL server",
    };
  }
}

export { prisma };
