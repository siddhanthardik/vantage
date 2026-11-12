import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { supportCaseRepository } from "@/server/repositories/supportCaseRepository";
import { SupportCaseCategory, SupportCasePriority, SupportCaseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/support
 * List support cases with filtering, search, and pagination
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = (searchParams.get("category") as SupportCaseCategory) || undefined;
    const status = (searchParams.get("status") as SupportCaseStatus) || undefined;
    const priority = (searchParams.get("priority") as SupportCasePriority) || undefined;
    const assignedAdminId = searchParams.get("assignedAdminId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await supportCaseRepository.listCases({
      search,
      category,
      status,
      priority,
      assignedAdminId,
      page,
      limit,
    });

    const metrics = await supportCaseRepository.getSupportMetrics();

    return NextResponse.json({
      success: true,
      data: result.cases,
      pagination: result.pagination,
      metrics,
    });
  } catch (error: any) {
    console.error("Failed to list support cases:", error);
    return NextResponse.json(
      { error: "Failed to load support cases", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/support
 * Create a new support case from the administrative desk
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const {
      customerName,
      contactEmail,
      contactPhone,
      category,
      subcategory,
      subject,
      description,
      priority,
      status,
      assignedTo,
      assignedAdminId,
      advisorSummary,
    } = body;

    if (!customerName || !subject || !description) {
      return NextResponse.json(
        { error: "Customer name, subject, and description are required." },
        { status: 400 }
      );
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: auth.session.email },
      select: { id: true },
    });

    const created = await supportCaseRepository.createCase(
      {
        customerName,
        contactEmail,
        contactPhone,
        category: category || "GENERAL_ENQUIRY",
        subcategory,
        subject,
        description,
        priority: priority || "MEDIUM",
        status: status || "OPEN",
        assignedTo,
        assignedAdminId,
        advisorSummary,
      },
      adminUser?.id
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create support case:", error);
    return NextResponse.json(
      { error: "Failed to create support case", details: error.message },
      { status: 500 }
    );
  }
}
