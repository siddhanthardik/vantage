import { NextRequest, NextResponse } from "next/server";
import { MessageRole } from "@prisma/client";
import { chatConversationRepository } from "@/server/repositories/chatConversationRepository";
import { chatMessageRepository } from "@/server/repositories/chatMessageRepository";
import { chatKnowledgeRepository } from "@/server/repositories/chatKnowledgeRepository";
import { chatbotSettingsRepository } from "@/server/repositories/chatbotSettingsRepository";
import { chatRateLimitRepository } from "@/server/repositories/chatRateLimitRepository";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { verifyAnonymousSessionToken, hashClientIp } from "@/lib/security/chatSecurity";
import { detectLanguage, extractLeadIntent } from "@/server/ai/languageAndIntent";
import { getAiProvider } from "@/server/ai/aiProviderFactory";

export async function POST(request: NextRequest) {
  try {
    const rawCookie = request.cookies.get("vw_chat_token")?.value;
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = hashClientIp(clientIp) || "anonymous";

    // 1. Session Verification
    const sessionAuth = verifyAnonymousSessionToken(rawCookie);
    if (!sessionAuth.valid || !sessionAuth.sessionId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired chat session. Please refresh." },
        { status: 401 }
      );
    }

    // 2. Multi-Worker Rate Limiting (PostgreSQL-backed)
    const rateLimit = await chatRateLimitRepository.checkRateLimit(`ip:${ipHash}`, 12, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "You are sending messages too quickly. Please wait a moment before sending another message.",
        },
        { status: 429 }
      );
    }

    // 3. Parse Body
    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json({ success: false, error: "conversationId is required." }, { status: 400 });
    }

    const trimmedContent = typeof content === "string" ? content.trim() : "";
    if (!trimmedContent) {
      return NextResponse.json({ success: false, error: "Message content cannot be empty." }, { status: 400 });
    }

    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Message exceeds maximum allowed length of 2,000 characters." },
        { status: 400 }
      );
    }

    // 4. Anti-IDOR Ownership Check: Ensure conversation belongs to authenticated anonymous session
    const conversation = await chatConversationRepository.getConversationById(conversationId, false);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
    }

    if (conversation.anonymousSessionId !== sessionAuth.sessionId) {
      return NextResponse.json({ success: false, error: "Access denied to this conversation." }, { status: 403 });
    }

    // 5. Automatic Language Recognition (NO toggle screen)
    const detectedLanguage = detectLanguage(trimmedContent);
    if (detectedLanguage !== conversation.language) {
      // Update detected conversation language in PostgreSQL
      await chatConversationRepository.touchConversation(conversationId, {
        language: detectedLanguage,
      });
    }

    // 6. Persist User Message Turn in PostgreSQL
    const userMessage = await chatMessageRepository.createMessage({
      conversationId,
      role: MessageRole.USER,
      content: trimmedContent,
      language: detectedLanguage,
    });

    // 7. Progressive Lead Intent Extraction
    const leadIntent = extractLeadIntent(trimmedContent);
    if (leadIntent.fullName || leadIntent.email || leadIntent.phone || leadIntent.financialObjective) {
      await chatLeadRepository.upsertLead({
        conversationId,
        fullName: leadIntent.fullName,
        email: leadIntent.email,
        phone: leadIntent.phone,
        financialObjective: leadIntent.financialObjective,
      });
    }

    // 8. Knowledge Base Retrieval
    const relevantChunks = await chatKnowledgeRepository.searchKnowledge(trimmedContent, {
      language: detectedLanguage,
      limit: 4,
    });

    // 9. Load Chatbot Settings
    const settings = await chatbotSettingsRepository.getSettings();

    // 10. Fetch Conversation History for multi-turn context
    const previousMessages = await chatMessageRepository.getMessagesByConversationId(conversationId, 10);
    const contextTurns = previousMessages.map((m) => ({
      role: m.role === MessageRole.ASSISTANT ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    // 11. Generate Grounded AI Response via Provider Adapter (Google Gemini)
    const aiProvider = getAiProvider();
    const aiResult = await aiProvider.generateResponse({
      messages: contextTurns,
      contextChunks: relevantChunks.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        sourceType: c.sourceType,
        slug: c.slug,
      })),
      systemInstruction: settings.systemInstructions || undefined,
      language: detectedLanguage,
    });

    // 12. Persist Assistant Response in PostgreSQL
    const assistantMessage = await chatMessageRepository.createMessage({
      conversationId,
      role: MessageRole.ASSISTANT,
      content: aiResult.content,
      tokenCount: aiResult.tokenCount,
      language: detectedLanguage,
      citations: aiResult.citations || null,
    });

    if (aiResult.isFlagged && aiResult.flagReason) {
      await chatMessageRepository.flagMessage(assistantMessage.id, aiResult.flagReason);
    }

    // 13. Determine if callback CTA should be offered
    const shouldSuggestCallback =
      leadIntent.wantsCallback ||
      trimmedContent.toLowerCase().includes("contact") ||
      trimmedContent.toLowerCase().includes("consultation") ||
      trimmedContent.toLowerCase().includes("pricing") ||
      trimmedContent.toLowerCase().includes("fees") ||
      aiResult.citations?.length === 0;

    return NextResponse.json({
      success: true,
      userMessageId: userMessage.id,
      message: {
        id: assistantMessage.id,
        role: "assistant",
        content: assistantMessage.content,
        citations: assistantMessage.citations,
        createdAt: assistantMessage.createdAt,
      },
      language: detectedLanguage,
      suggestCallback: shouldSuggestCallback,
      leadPrompt: leadIntent.wantsCallback ? "CALLBACK_PROMPT" : null,
    });
  } catch (err: any) {
    console.error("Chat message processing error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Our advisory concierge is momentarily unable to process this request. Please try again or request a callback.",
      },
      { status: 500 }
    );
  }
}
