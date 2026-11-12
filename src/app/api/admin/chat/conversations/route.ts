import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { ConversationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ConversationStatus | null;
    const language = searchParams.get("language");
    const primaryIntent = searchParams.get("primaryIntent");
    const visitorClass = searchParams.get("visitorClass");
    const matchedService = searchParams.get("matchedService");
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (status && Object.values(ConversationStatus).includes(status)) {
      where.status = status;
    }
    if (language) {
      where.language = language;
    }
    if (primaryIntent) {
      where.primaryIntent = primaryIntent;
    }
    if (visitorClass) {
      where.visitorClass = visitorClass;
    }
    if (matchedService) {
      where.matchedServiceSlug = matchedService;
    }
    if (query) {
      where.OR = [
        { id: { contains: query } },
        { anonymousSessionId: { contains: query } },
        { lead: { fullName: { contains: query, mode: "insensitive" } } },
        { lead: { email: { contains: query, mode: "insensitive" } } },
        { lead: { phone: { contains: query } } },
      ];
    }

    const [total, conversations] = await Promise.all([
      prisma.chatConversation.count({ where }),
      prisma.chatConversation.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          lead: true,
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("Admin list conversations error:", err);
    return NextResponse.json({ success: false, error: "Failed to list conversations." }, { status: 500 });
  }
}
