import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getAllEnquiries } from "@/server/repositories/enquiryRepository";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "CONTACT" | "CONSULTATION" | "ALL"
  const status = url.searchParams.get("status"); // "NEW" | "CONTACTED" | "ARCHIVED" | "ALL"

  let enquiries = await getAllEnquiries();

  if (type && type !== "ALL") {
    enquiries = enquiries.filter((e) => e.type === type);
  }

  if (status && status !== "ALL") {
    enquiries = enquiries.filter((e) => e.status === status);
  }

  return NextResponse.json({ enquiries });
}
