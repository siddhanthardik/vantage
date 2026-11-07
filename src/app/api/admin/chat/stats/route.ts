import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      totalConversations,
      conversationsToday,
      conversationsThisWeek,
      totalLeads,
      qualifiedLeads,
      callbackRequestsPending,
      convertedLeads,
      flaggedMessages,
      recentConversations,
    ] = await Promise.all([
      prisma.chatConversation.count(),
      prisma.chatConversation.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.chatConversation.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.chatLead.count(),
      prisma.chatLead.count({ where: { status: "QUALIFIED" } }),
      prisma.chatLead.count({ where: { status: "CALLBACK_REQUESTED" } }),
      prisma.chatLead.count({ where: { status: "CONVERTED_TO_ENQUIRY" } }),
      prisma.chatMessage.count({ where: { isFlagged: true } }),
      prisma.chatConversation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          lead: true,
          _count: { select: { messages: true } },
        },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      stats: {
        totalConversations,
        conversationsToday,
        conversationsThisWeek,
        totalLeads,
        qualifiedLeads,
        callbackRequestsPending,
        convertedLeads,
        flaggedMessages,
        conversionRate,
      },
      recentConversations,
    });
  } catch (err: any) {
    console.error("Admin chat stats error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats." }, { status: 500 });
  }
}
