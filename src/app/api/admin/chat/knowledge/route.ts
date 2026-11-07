import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { knowledgeIngestionService } from "@/server/ai/knowledgeIngestionService";
import { chatKnowledgeRepository } from "@/server/repositories/chatKnowledgeRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const sourceType = searchParams.get("sourceType");

    if (query) {
      // Test PostgreSQL hybrid search
      const searchResults = await chatKnowledgeRepository.searchKnowledge(query, {
        limit: 20,
      });

      return NextResponse.json({
        success: true,
        chunks: searchResults,
        isSearch: true,
      });
    }

    const where: Record<string, any> = {};
    if (sourceType) {
      where.sourceType = sourceType;
    }

    const [total, chunks, sourceCounts] = await Promise.all([
      prisma.knowledgeChunk.count({ where }),
      prisma.knowledgeChunk.findMany({
        where,
        take: 50,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.knowledgeChunk.groupBy({
        by: ["sourceType"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      chunks,
      total,
      sourceCounts: sourceCounts.reduce((acc: any, curr: any) => {
        acc[curr.sourceType] = curr._count.id;
        return acc;
      }, {}),
    });
  } catch (err: any) {
    console.error("Admin get knowledge error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch knowledge chunks." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "sync";

    if (action === "sync") {
      const syncResult = await knowledgeIngestionService.syncAllPublishedContent();

      await logAuditEvent({
        action: "KNOWLEDGE_BASE_SYNC",
        entityType: "KNOWLEDGE_BASE",
        userEmail: auth.session.email,
        details: syncResult,
      });

      return NextResponse.json({
        success: true,
        message: "Knowledge base synchronized successfully with published CMS content.",
        syncResult,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (err: any) {
    console.error("Admin knowledge sync error:", err);
    return NextResponse.json({ success: false, error: "Failed to synchronize knowledge base." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ success: false, error: "id and isActive (boolean) are required." }, { status: 400 });
    }

    const updated = await prisma.knowledgeChunk.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, chunk: updated });
  } catch (err: any) {
    console.error("Admin update knowledge chunk error:", err);
    return NextResponse.json({ success: false, error: "Failed to update chunk status." }, { status: 500 });
  }
}
