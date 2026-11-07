import { NextRequest, NextResponse } from "next/server";
import { chatMessageRepository } from "@/server/repositories/chatMessageRepository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, rating, comment } = body;

    if (!messageId || typeof messageId !== "string") {
      return NextResponse.json({ success: false, error: "messageId is required." }, { status: 400 });
    }

    const numRating = Number(rating);
    if (![1, 5].includes(numRating)) {
      return NextResponse.json({ success: false, error: "Rating must be 1 (negative) or 5 (positive)." }, { status: 400 });
    }

    const feedback = await chatMessageRepository.recordFeedback(
      messageId,
      numRating,
      typeof comment === "string" ? comment.slice(0, 500) : undefined
    );

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
      },
    });
  } catch (err: any) {
    console.error("Feedback recording error:", err);
    return NextResponse.json({ success: false, error: "Failed to record feedback." }, { status: 500 });
  }
}
