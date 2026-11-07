import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const [
      conversationsByStatus,
      conversationsByLanguage,
      leadsByStatus,
      leadsByObjective,
      feedbackStats,
      totalFlagged,
    ] = await Promise.all([
      prisma.chatConversation.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.chatConversation.groupBy({
        by: ["language"],
        _count: { id: true },
      }),
      prisma.chatLead.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.chatLead.groupBy({
        by: ["financialObjective"],
        _count: { id: true },
        where: { financialObjective: { not: null } },
      }),
      prisma.chatbotFeedback.groupBy({
        by: ["rating"],
        _count: { id: true },
      }),
      prisma.chatMessage.count({ where: { isFlagged: true } }),
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        conversationsByStatus: conversationsByStatus.map((c: any) => ({
          status: c.status,
          count: c._count.id,
        })),
        conversationsByLanguage: conversationsByLanguage.map((c: any) => ({
          language: c.language,
          count: c._count.id,
        })),
        leadsByStatus: leadsByStatus.map((l: any) => ({
          status: l.status,
          count: l._count.id,
        })),
        leadsByObjective: leadsByObjective.map((o: any) => ({
          objective: o.financialObjective || "General Wealth Planning",
          count: o._count.id,
        })),
        feedbackStats: feedbackStats.map((f: any) => ({
          rating: f.rating === 5 ? "Positive (Thumbs Up)" : "Negative (Thumbs Down)",
          count: f._count.id,
        })),
        totalFlagged,
      },
    });
  } catch (err: any) {
    console.error("Admin chat analytics error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics." }, { status: 500 });
  }
}
