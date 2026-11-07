import { NextRequest, NextResponse } from "next/server";
import { chatConversationRepository } from "@/server/repositories/chatConversationRepository";
import { chatMessageRepository } from "@/server/repositories/chatMessageRepository";
import { chatbotSettingsRepository } from "@/server/repositories/chatbotSettingsRepository";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import {
  generateAnonymousSessionToken,
  verifyAnonymousSessionToken,
  hashClientIp,
} from "@/lib/security/chatSecurity";

export async function GET(request: NextRequest) {
  try {
    const rawCookie = request.cookies.get("vw_chat_token")?.value;
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = hashClientIp(clientIp);
    const userAgent = request.headers.get("user-agent") || undefined;

    let validToken = false;
    let sessionId: string | null = null;

    if (rawCookie) {
      const verification = verifyAnonymousSessionToken(rawCookie);
      validToken = verification.valid;
      sessionId = verification.sessionId;
    }

    // Load global settings for welcome message and suggested questions
    const settings = await chatbotSettingsRepository.getSettings();

    const defaultSuggestedQuestions = [
      "What wealth advisory services do you offer?",
      "How can I protect and preserve my family wealth?",
      "Tell me about your investment advisory services.",
      "How does retirement planning work?",
      "I would like to speak with your advisory team.",
    ];

    let conversation: any = null;
    let isNew = false;
    let signedTokenToSet: string | null = null;

    if (validToken && sessionId) {
      // Find existing active conversation
      conversation = await chatConversationRepository.getActiveConversationForSession(sessionId);
    }

    if (!conversation) {
      // Generate fresh session token
      signedTokenToSet = generateAnonymousSessionToken();
      sessionId = signedTokenToSet.split(".")[0];

      conversation = await chatConversationRepository.createConversation({
        anonymousSessionId: sessionId,
        language: "en",
        ipHash: ipHash || undefined,
        userAgent,
      });

      isNew = true;
    }

    // Fetch conversation messages
    const messages = await chatMessageRepository.getMessagesByConversationId(conversation.id);
    const lead = await chatLeadRepository.getLeadByConversationId(conversation.id);

    const response = NextResponse.json({
      success: true,
      conversationId: conversation.id,
      status: conversation.status,
      language: conversation.language,
      messageCount: conversation.messageCount,
      messages: messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        createdAt: m.createdAt,
        feedback: m.feedback ? { rating: m.feedback.rating } : null,
      })),
      lead: lead
        ? {
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            preferredMethod: lead.preferredMethod,
            preferredTimeWindow: lead.preferredTimeWindow,
            status: lead.status,
            consentGiven: lead.consentGiven,
          }
        : null,
      config: {
        botName: settings.botName,
        isEnabled: settings.isEnabled,
        welcomeMessage: settings.welcomeMessageEn,
        suggestedQuestions: defaultSuggestedQuestions,
        workingHours: `${settings.workingHoursStart} - ${settings.workingHoursEnd} ${settings.timezone}`,
        workingDays: settings.workingDays,
        temporaryUnavailable: settings.temporaryUnavailable,
        unavailabilityReason: settings.unavailabilityReason,
        disclaimer: settings.disclaimerEn,
      },
      isNew,
    });

    if (signedTokenToSet) {
      response.cookies.set("vw_chat_token", signedTokenToSet, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 4 * 60 * 60, // 4 hours
      });
    }

    return response;
  } catch (err: any) {
    console.error("Chat session initialization error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize advisory chat session.",
      },
      { status: 500 }
    );
  }
}
