import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getAuditLogs } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const logs = await getAuditLogs(100);
  return NextResponse.json({ logs });
}
