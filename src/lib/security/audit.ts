import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  details?: Record<string, any> | null;
}

const AUDIT_LOG_FILE = path.join(process.cwd(), "src", "lib", "db", "audit-logs.json");

function appendLocalAuditLog(entry: AuditLogEntry & { id: string; createdAt: string }) {
  try {
    const dir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let logs: any[] = [];
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, "utf-8"));
    }

    logs.unshift(entry);
    // Keep max 1000 logs in local file
    if (logs.length > 1000) logs = logs.slice(0, 1000);

    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Local audit log write failed:", err);
  }
}

/**
 * Record an immutable security and administrative audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const now = new Date().toISOString();
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const logRecord = {
    id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId || null,
    userEmail: entry.userEmail || "system",
    ipAddress: entry.ipAddress || "unknown",
    details: entry.details || null,
    createdAt: now,
  };

  if (prisma) {
    try {
      await prisma.auditLog.create({
        data: {
          id: logRecord.id,
          action: logRecord.action,
          entityType: logRecord.entityType,
          entityId: logRecord.entityId,
          userEmail: logRecord.userEmail,
          ipAddress: logRecord.ipAddress,
          details: logRecord.details as any,
          createdAt: new Date(now),
        },
      });
      return;
    } catch (err) {
      console.warn("Prisma audit log insert failed, falling back to local audit log:", err);
    }
  }

  appendLocalAuditLog(logRecord);
}

/**
 * Query recent audit logs for Admin inspection
 */
export async function getAuditLogs(limit: number = 50): Promise<any[]> {
  if (prisma) {
    try {
      const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      if (logs && logs.length > 0) return logs;
    } catch (e) {
      console.warn("Prisma audit logs lookup failed:", e);
    }
  }

  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOG_FILE, "utf-8");
      return JSON.parse(raw).slice(0, limit);
    }
  } catch (e) {
    console.error("Failed to read local audit logs:", e);
  }

  return [];
}
