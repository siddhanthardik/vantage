import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { LeadQualificationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as LeadQualificationStatus | null;
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (status && Object.values(LeadQualificationStatus).includes(status)) {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { financialObjective: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.chatLead.count({ where }),
      prisma.chatLead.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          conversation: {
            select: {
              id: true,
              messageCount: true,
              language: true,
              status: true,
              createdAt: true,
            },
          },
          enquiry: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
          events: {
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
              adminUser: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("Admin list leads error:", err);
    return NextResponse.json({ success: false, error: "Failed to list leads." }, { status: 500 });
  }
}
