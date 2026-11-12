import { NextRequest, NextResponse } from "next/server";
import { MessageRole, LeadQualificationStatus } from "@prisma/client";
import { chatConversationRepository } from "@/server/repositories/chatConversationRepository";
import { chatMessageRepository } from "@/server/repositories/chatMessageRepository";
import { chatKnowledgeRepository } from "@/server/repositories/chatKnowledgeRepository";
import { chatbotSettingsRepository } from "@/server/repositories/chatbotSettingsRepository";
import { chatRateLimitRepository } from "@/server/repositories/chatRateLimitRepository";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { supportCaseRepository } from "@/server/repositories/supportCaseRepository";
import { verifyAnonymousSessionToken, hashClientIp } from "@/lib/security/chatSecurity";
import { detectLanguage, extractLeadIntent, isPureGreeting } from "@/server/ai/languageAndIntent";
import { getAiProvider } from "@/server/ai/aiProviderFactory";
import { classifyVisitorIntent } from "@/server/ai/intentClassification";
import {
  updateConversationMemory,
  formatMemoryForPrompt,
  ConversationMemoryContext,
} from "@/server/ai/conversationMemory";
import {
  classifyVisitor,
  matchApprovedService,
  determineNextBestAction,
  formatTacticalActionDirective,
  computeLeadQualificationScore,
  generateAdvisorBriefing,
} from "@/server/ai/conversationIntelligence";

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

    // 6. Phase 2: Intent Recognition (14 Primary Categories + Urgency + Inquirer Mode)
    const intentResult = classifyVisitorIntent(trimmedContent, conversation.primaryIntent as any);

    // 7. Phase 2: Multi-Turn Conversation Memory (Entity extraction, anaphora resolution & corrections)
    const currentMemory = ((conversation as any).contextMemory as ConversationMemoryContext) || {
      confirmedFacts: {},
      unresolvedRequests: [],
    };
    const updatedMemory = updateConversationMemory(currentMemory, trimmedContent, detectedLanguage);
    const memoryPrompt = formatMemoryForPrompt(updatedMemory);

    // 8. Phase 2: Visitor Classification (NEW_PROSPECT, RETURNING_VISITOR, EXISTING_CLIENT, etc.)
    const isReturning = await chatConversationRepository.hasPriorConversations(sessionAuth.sessionId, conversationId);
    const visitorClass = classifyVisitor({
      userMessage: trimmedContent,
      intentResult,
      isReturningSession: isReturning,
      previousClass: (conversation as any).visitorClass as any,
    });

    // 9. Phase 2: Service Matching Engine (6 Vantage Wealth approved services)
    const matchedService = matchApprovedService(intentResult.primaryIntent, updatedMemory);

    // 10. Phase 2: Next Best Action Decision Engine
    const nextAction = determineNextBestAction({
      intentResult,
      visitorClass,
      memory: updatedMemory,
      matchedService,
    });

    // Phase 3: Support Case Creation, Duplicate Prevention & Status Check Handling
    const caseNumMatch = trimmedContent.match(/\b(VW-CASE-[A-Z0-9-]+)\b/i);
    if (caseNumMatch) {
      const queriedCase = await supportCaseRepository.findCaseByNumber(caseNumMatch[1]);
      if (queriedCase) {
        const clientPhone = updatedMemory.contactPhone || "";
        const clientEmail = (updatedMemory.contactEmail || "").toLowerCase();
        const casePhone = queriedCase.contactPhone || "";
        const caseEmail = (queriedCase.contactEmail || "").toLowerCase();

        const isVerified =
          (clientPhone && casePhone && clientPhone.slice(-8) === casePhone.slice(-8)) ||
          (clientEmail && caseEmail && clientEmail === caseEmail);

        if (isVerified) {
          updatedMemory.confirmedFacts["Support Case Verified Status"] =
            `Case ${queriedCase.caseNumber} is currently ${queriedCase.status}. Category: ${queriedCase.category.replace(/_/g, " ")}.`;
        } else {
          updatedMemory.confirmedFacts["Support Case Verification Notice"] =
            `Case ${queriedCase.caseNumber} requires registered phone or email verification before status can be disclosed.`;
        }
      }
    } else if (
      intentResult.primaryIntent === "COMPLAINT_OR_ISSUE" ||
      nextAction === "ROUTE_COMPLAINT" ||
      (intentResult.primaryIntent === "EXISTING_CLIENT_SUPPORT" &&
        /problem|issue|delay|not received|unresolved|complaint|waiting/i.test(trimmedContent))
    ) {
      const custName = updatedMemory.customerName || updatedMemory.confirmedFacts["Visitor Name"];
      const custContact = updatedMemory.contactPhone || updatedMemory.contactEmail;

      if (custName && custContact) {
        const openCase = await supportCaseRepository.findOpenCaseByContactOrConversation({
          conversationId,
          contactPhone: updatedMemory.contactPhone,
          contactEmail: updatedMemory.contactEmail,
        });

        if (!openCase) {
          const isUrgent =
            intentResult.urgency === "HIGH" || /urgent|loss|delay|fraud|disappointed/i.test(trimmedContent);
          const newCase = await supportCaseRepository.createCase({
            conversationId,
            customerName: custName,
            contactPhone: updatedMemory.contactPhone,
            contactEmail: updatedMemory.contactEmail,
            category:
              intentResult.primaryIntent === "COMPLAINT_OR_ISSUE"
                ? "SERVICE_COMPLAINT"
                : "GENERAL_ENQUIRY",
            subject: trimmedContent.slice(0, 100),
            description: trimmedContent,
            priority: isUrgent ? "URGENT" : "MEDIUM",
            status: isUrgent ? "ESCALATED" : "OPEN",
            advisorSummary: `Support Case auto-created for ${custName} (${custContact}): ${trimmedContent}`,
          });
          updatedMemory.confirmedFacts["Registered Support Case"] = newCase.caseNumber;
        } else {
          updatedMemory.confirmedFacts["Existing Support Case"] = openCase.caseNumber;
        }
      }
    }

    const tacticalPrompt = formatTacticalActionDirective(nextAction, updatedMemory);

    // 11. Persist User Message Turn in PostgreSQL
    const userMessage = await chatMessageRepository.createMessage({
      conversationId,
      role: MessageRole.USER,
      content: trimmedContent,
      language: detectedLanguage,
    });

    // 12. Knowledge Base Retrieval (skip for simple greetings to maximize efficiency)
    const isGreeting = isPureGreeting(trimmedContent);
    const relevantChunks = isGreeting
      ? []
      : await chatKnowledgeRepository.searchKnowledge(trimmedContent, {
          language: detectedLanguage,
          limit: 4,
        });

    // 13. Load Chatbot Settings
    const settings = await chatbotSettingsRepository.getSettings();

    // 14. Fetch Conversation History for multi-turn context
    const previousMessages = await chatMessageRepository.getMessagesByConversationId(conversationId, 10);
    const contextTurns = previousMessages.map((m) => ({
      role: m.role === MessageRole.ASSISTANT ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    // 15. Generate Grounded AI Response via Provider Adapter (Google Gemini with Phase 2 Memory & Tactical Guidance)
    const combinedSystemInstruction = [
      settings.systemInstructions,
      settings.salesInstructions ? `\nSales & Positioning Guidance:\n${settings.salesInstructions}` : "",
      settings.qualificationInstructions ? `\nConversational Discovery:\n${settings.qualificationInstructions}` : "",
      settings.financialSafetyInstructions ? `\nFinancial Safety & Boundaries:\n${settings.financialSafetyInstructions}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

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
      systemInstruction: combinedSystemInstruction || undefined,
      conversationMemoryPrompt: memoryPrompt || undefined,
      tacticalActionPrompt: tacticalPrompt || undefined,
      language: detectedLanguage,
    });

    // 16. Persist Assistant Response in PostgreSQL
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

    // 17. Phase 2: Progressive Lead Qualification, Scoring & Advisor Briefing
    const leadIntent = extractLeadIntent(trimmedContent);
    const existingLead = await chatLeadRepository.getLeadByConversationId(conversationId);

    const mergedName = leadIntent.fullName || existingLead?.fullName || null;
    const mergedPhone = leadIntent.phone || existingLead?.phone || null;
    const mergedEmail = leadIntent.email || existingLead?.email || null;
    const mergedObjective = leadIntent.financialObjective || updatedMemory.financialGoal || existingLead?.financialObjective || null;
    const mergedPortfolioSize = updatedMemory.investmentAmount || existingLead?.portfolioSize || null;

    const qualificationScore = computeLeadQualificationScore({
      fullName: mergedName,
      phone: mergedPhone,
      email: mergedEmail,
      financialObjective: mergedObjective,
      portfolioSize: mergedPortfolioSize,
      consentGiven: existingLead?.consentGiven,
    });

    // Determine lead status
    let leadStatus: LeadQualificationStatus = existingLead?.status || LeadQualificationStatus.NEW;
    if (intentResult.primaryIntent === "CALLBACK_REQUEST" || leadIntent.wantsCallback) {
      leadStatus = LeadQualificationStatus.CALLBACK_REQUESTED;
    } else if (qualificationScore >= 60) {
      leadStatus = LeadQualificationStatus.QUALIFIED;
    } else if (qualificationScore > 0 || updatedMemory.investmentAmount || updatedMemory.financialGoal) {
      leadStatus = LeadQualificationStatus.QUALIFYING;
    }

    // Phase 4: Sales Pipeline Stage & Consultation Status Mapping
    let salesStage = existingLead?.salesStage || "NEW_ENQUIRY";
    let consultationStatus = existingLead?.consultationStatus || "NONE";

    if (
      intentResult.primaryIntent === "CALLBACK_REQUEST" ||
      leadIntent.wantsCallback ||
      /consultation|speak with an advisor|arrange a call|schedule/i.test(trimmedContent)
    ) {
      salesStage = "CONSULTATION_REQUESTED";
      consultationStatus = "REQUESTED";
    } else if (
      qualificationScore >= 50 ||
      (updatedMemory.investmentAmount && updatedMemory.timeHorizon)
    ) {
      if (salesStage === "NEW_ENQUIRY" || salesStage === "INITIAL_DISCOVERY") {
        salesStage = "QUALIFICATION";
      }
    } else if (updatedMemory.investmentAmount || updatedMemory.financialGoal) {
      if (salesStage === "NEW_ENQUIRY") {
        salesStage = "INITIAL_DISCOVERY";
      }
    }

    let advisorSummary: string | undefined = undefined;
    if (
      intentResult.primaryIntent === "CALLBACK_REQUEST" ||
      visitorClass === "HIGH_INTENT_PROSPECT" ||
      qualificationScore >= 35
    ) {
      advisorSummary = generateAdvisorBriefing({
        leadName: mergedName,
        phone: mergedPhone,
        email: mergedEmail,
        preferredTime: updatedMemory.preferredCallbackTime || existingLead?.preferredTimeWindow,
        preferredMethod: existingLead?.preferredMethod,
        intent: intentResult.primaryIntent,
        matchedService,
        memory: updatedMemory,
        conversationSnippet: trimmedContent,
        reasonForHandover:
          intentResult.primaryIntent === "CALLBACK_REQUEST"
            ? "Visitor explicitly requested direct callback"
            : visitorClass === "HIGH_INTENT_PROSPECT"
            ? "High-intent prospect qualified during conversation"
            : "Progressive lead qualification threshold met",
      });
    }

    if (mergedName || mergedPhone || mergedEmail || mergedObjective || mergedPortfolioSize || qualificationScore > 0) {
      await chatLeadRepository.upsertLead({
        conversationId,
        fullName: mergedName || undefined,
        email: mergedEmail || undefined,
        phone: mergedPhone || undefined,
        financialObjective: mergedObjective || undefined,
        portfolioSize: mergedPortfolioSize || undefined,
        qualificationScore,
        urgency: intentResult.urgency,
        advisorSummary,
        salesStage,
        serviceInterest: matchedService?.title || undefined,
        consultationStatus,
        status: leadStatus,
      });
    }

    // 18. Update Conversation Intelligence State in PostgreSQL
    await chatConversationRepository.touchConversation(conversationId, {
      lastUserMessageAt: new Date(),
      language: detectedLanguage,
      primaryIntent: intentResult.primaryIntent,
      secondaryIntent: intentResult.secondaryIntent,
      visitorClass,
      matchedServiceSlug: matchedService?.slug,
      nextAction,
      contextMemory: updatedMemory as any,
    });

    // 19. Determine if callback CTA should be offered
    const shouldSuggestCallback =
      leadIntent.wantsCallback ||
      intentResult.primaryIntent === "CALLBACK_REQUEST" ||
      nextAction === "REQUEST_CALLBACK" ||
      nextAction === "OFFER_CONSULTATION";

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
