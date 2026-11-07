import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { ConversationStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { feedback: true },
        },
        lead: {
          include: {
            events: {
              orderBy: { createdAt: "desc" },
              include: { adminUser: { select: { name: true, email: true } } },
            },
            enquiry: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" },
        }
      );
    }

    return NextResponse.json(
      { success: true, conversation },
      {
        headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" },
      }
    );
  } catch (err: any) {
    console.error("Admin conversation detail error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversation details." },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" },
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(ConversationStatus).includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value." }, { status: 400 });
    }

    const updated = await prisma.chatConversation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error("Admin update conversation status error:", err);
    return NextResponse.json({ success: false, error: "Failed to update conversation status." }, { status: 500 });
  }
}
