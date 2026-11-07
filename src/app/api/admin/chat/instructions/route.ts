import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { chatbotSettingsRepository } from "@/server/repositories/chatbotSettingsRepository";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const settings = await chatbotSettingsRepository.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error("Admin get instructions error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch instructions." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await request.json();

    const allowedFields = [
      "botName",
      "isEnabled",
      "welcomeMessageEn",
      "welcomeMessageHi",
      "disclaimerEn",
      "disclaimerHi",
      "systemInstructions",
      "salesInstructions",
      "qualificationInstructions",
      "financialSafetyInstructions",
      "workingDays",
      "workingHoursStart",
      "workingHoursEnd",
      "timezone",
      "holidays",
      "temporaryUnavailable",
      "unavailabilityReason",
      "callbackWording",
      "maxTurnsPerSession",
      "rateLimitPerMinute",
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: auth.session.email },
      select: { id: true },
    });

    const updated = await chatbotSettingsRepository.updateSettings(updates, {
      userId: adminUser?.id,
      userEmail: auth.session.email,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Chatbot settings and instructions successfully saved.",
    });
  } catch (err: any) {
    console.error("Admin update instructions error:", err);
    return NextResponse.json({ success: false, error: "Failed to update instructions." }, { status: 500 });
  }
}
