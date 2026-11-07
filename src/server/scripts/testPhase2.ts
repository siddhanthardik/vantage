import { PrismaClient, MessageRole, LeadQualificationStatus, CallbackPreferredMethod, KnowledgeSourceType, ConversationStatus } from "@prisma/client";
import { chatConversationRepository } from "../repositories/chatConversationRepository";
import { chatMessageRepository } from "../repositories/chatMessageRepository";
import { chatLeadRepository } from "../repositories/chatLeadRepository";
import { chatLeadEventRepository } from "../repositories/chatLeadEventRepository";
import { chatbotSettingsRepository } from "../repositories/chatbotSettingsRepository";
import { chatKnowledgeRepository } from "../repositories/chatKnowledgeRepository";
import { chatRateLimitRepository } from "../repositories/chatRateLimitRepository";
import { generateAnonymousSessionToken, hashClientIp } from "@/lib/security/chatSecurity";

// Separate PrismaClient instance to guarantee independent persistence verification
const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${name}${details ? ` - ${details}` : ""}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("VANTAGE WEALTH ASSISTANT — PHASE 2 DATABASE & REPOSITORY TEST SUITE");
  console.log("================================================================================\n");

  const testSessionToken = generateAnonymousSessionToken();
  const testSessionId = testSessionToken.split(".")[0];
  let conversationId = "";
  let leadId = "";

  // --------------------------------------------------------------------------
  // TEST 1: Conversation creation & retrieval
  // --------------------------------------------------------------------------
  try {
    console.log("1. Running: Conversation creation and retrieval...");
    const conv = await chatConversationRepository.createConversation({
      anonymousSessionId: testSessionId,
      language: "en",
      userAgent: "TestRunner/Phase2",
      ipHash: hashClientIp("192.168.1.100") || undefined,
    });

    conversationId = conv.id;
    assert(Boolean(conv.id), "Conversation must have an ID");
    assert(conv.status === ConversationStatus.ACTIVE, "Status must be ACTIVE");

    const fetched = await chatConversationRepository.getConversationById(conv.id);
    assert(fetched !== null && fetched.id === conv.id, "Fetched conversation must match");

    const active = await chatConversationRepository.getActiveConversationForSession(testSessionId);
    assert(active !== null && active.id === conv.id, "Active session lookup must find conversation");

    results.push({ name: "Conversation creation & retrieval", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Conversation creation & retrieval", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 2: Message persistence, ordering, and feedback
  // --------------------------------------------------------------------------
  try {
    console.log("2. Running: Message persistence and chronological ordering...");
    const m1 = await chatMessageRepository.createMessage({
      conversationId,
      role: MessageRole.USER,
      content: "What are your services for private wealth management?",
      language: "en",
    });

    const m2 = await chatMessageRepository.createMessage({
      conversationId,
      role: MessageRole.ASSISTANT,
      content: "Vantage Wealth provides Discretionary Portfolio Management and Estate Planning.",
      language: "en",
    });

    const messages = await chatMessageRepository.getMessagesByConversationId(conversationId);
    assert(messages.length === 2, "Must retrieve exactly 2 messages");
    assert(messages[0].id === m1.id, "First message must be USER");
    assert(messages[1].id === m2.id, "Second message must be ASSISTANT");

    // Verify atomic messageCount increment on conversation
    const updatedConv = await chatConversationRepository.getConversationById(conversationId);
    assert(updatedConv?.messageCount === 2, "Conversation messageCount must be 2");

    // Record user feedback on assistant message
    const feedback = await chatMessageRepository.recordFeedback(m2.id, 5, "Clear and helpful");
    assert(feedback.rating === 5, "Feedback rating must be 5");

    results.push({ name: "Message persistence & ordering", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Message persistence & ordering", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 3: Lead creation and progressive updates
  // --------------------------------------------------------------------------
  try {
    console.log("3. Running: Lead creation and progressive updates...");
    // Step 1: Initial discovery
    const l1 = await chatLeadRepository.upsertLead({
      conversationId,
      financialObjective: "Multi-family office governance",
    });
    leadId = l1.id;
    assert(l1.status === LeadQualificationStatus.COLLECTING, "Initial lead status must be COLLECTING");
    assert(l1.financialObjective === "Multi-family office governance", "Financial objective must match");

    // Step 2: Progressive enrichment
    const l2 = await chatLeadRepository.upsertLead({
      conversationId,
      fullName: "Anand Singhania",
      email: "anand.singhania@example.com",
      phone: "+91 98200 12345",
      preferredMethod: CallbackPreferredMethod.PHONE,
      preferredTimeWindow: "Weekday Afternoon (2 PM - 5 PM)",
      portfolioSize: "₹10 Cr - ₹25 Cr",
    });

    assert(l2.id === l1.id, "Lead ID must remain constant on upsert");
    assert(l2.fullName === "Anand Singhania", "Full name must be updated");
    assert(l2.phone === "+91 98200 12345", "Phone must be updated");
    assert(l2.preferredMethod === CallbackPreferredMethod.PHONE, "Preferred method must be PHONE");

    results.push({ name: "Lead creation & progressive updates", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Lead creation & progressive updates", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Contact consent persistence
  // --------------------------------------------------------------------------
  try {
    console.log("4. Running: Contact consent persistence...");
    const ipHash = hashClientIp("203.0.113.42")!;
    const consentLead = await chatLeadRepository.recordContactConsent(conversationId, ipHash);

    assert(consentLead.consentGiven === true, "consentGiven must be true");
    assert(consentLead.consentTimestamp instanceof Date, "consentTimestamp must be a valid Date");
    assert(consentLead.consentIpHash === ipHash, "consentIpHash must match");

    results.push({ name: "Contact consent persistence", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Contact consent persistence", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 5: Callback request state and event logging
  // --------------------------------------------------------------------------
  try {
    console.log("5. Running: Callback request state & lead event logging...");
    const updatedLead = await chatLeadRepository.updateQualification(
      leadId,
      LeadQualificationStatus.CALLBACK_REQUESTED,
      undefined,
      "Visitor requested phone callback during afternoon"
    );

    assert(updatedLead.status === LeadQualificationStatus.CALLBACK_REQUESTED, "Status must be CALLBACK_REQUESTED");

    const events = await chatLeadEventRepository.getEventsByLeadId(leadId);
    assert(events.length >= 1, "Must have at least 1 lead event");
    assert(events[events.length - 1].eventType === "STATUS_CHANGE_TO_CALLBACK_REQUESTED", "Event type must match");

    results.push({ name: "Callback request state & event logging", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Callback request state & event logging", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 6: Lead-to-Enquiry conversion relationship
  // --------------------------------------------------------------------------
  let createdEnquiryId = "";
  try {
    console.log("6. Running: Lead-to-Enquiry conversion relationship...");
    const conversion = await chatLeadRepository.convertToEnquiry(leadId);
    createdEnquiryId = conversion.enquiry.id;

    assert(Boolean(conversion.enquiry.id), "Enquiry must have an ID");
    assert(conversion.lead.enquiryId === conversion.enquiry.id, "Lead must be linked to Enquiry");
    assert(conversion.lead.status === LeadQualificationStatus.CONVERTED_TO_ENQUIRY, "Lead status must be CONVERTED_TO_ENQUIRY");

    // Verify conversation was transitioned to CONVERTED
    const conv = await chatConversationRepository.getConversationById(conversationId);
    assert(conv?.status === ConversationStatus.CONVERTED, "Conversation status must be CONVERTED");

    results.push({ name: "Lead-to-Enquiry conversion relationship", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Lead-to-Enquiry conversion relationship", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 7: Enquiry deletion preserving ChatLead (onDelete: SetNull)
  // --------------------------------------------------------------------------
  try {
    console.log("7. Running: Enquiry deletion preserving ChatLead (onDelete: SetNull)...");
    assert(Boolean(createdEnquiryId), "Requires createdEnquiryId from Test 6");

    // Directly delete the operational enquiry
    await prisma.enquiry.delete({
      where: { id: createdEnquiryId },
    });

    // Verify ChatLead survived and enquiryId became null
    const survivingLead = await prisma.chatLead.findUnique({
      where: { id: leadId },
    });

    assert(survivingLead !== null, "ChatLead MUST survive Enquiry deletion");
    assert(survivingLead?.enquiryId === null, "enquiryId on ChatLead must be set to null");

    results.push({ name: "Enquiry deletion preserving ChatLead (onDelete: SetNull)", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Enquiry deletion preserving ChatLead (onDelete: SetNull)", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 8: Admin deletion preserving historical lead events (onDelete: SetNull)
  // --------------------------------------------------------------------------
  try {
    console.log("8. Running: Admin deletion preserving lead events (onDelete: SetNull)...");
    // Create temporary admin user
    const tempAdmin = await prisma.adminUser.create({
      data: {
        email: `temp_admin_${Date.now()}@vantage.test`,
        name: "Temporary Test Admin",
        passwordHash: "dummyhashforphasetwo",
      },
    });

    // Record an event authored by this admin
    const event = await chatLeadEventRepository.recordEvent({
      leadId,
      adminUserId: tempAdmin.id,
      eventType: "ADMIN_NOTES_REVIEWED",
      metadata: { review: "Approved for partner consultation" },
    });

    assert(event.adminUserId === tempAdmin.id, "Event must record admin user ID");

    // Delete the admin user
    await prisma.adminUser.delete({
      where: { id: tempAdmin.id },
    });

    // Fetch the lead event
    const survivingEvent = await prisma.chatLeadEvent.findUnique({
      where: { id: event.id },
    });

    assert(survivingEvent !== null, "ChatLeadEvent MUST survive AdminUser deletion");
    assert(survivingEvent?.adminUserId === null, "adminUserId on event must be set to null");

    results.push({ name: "Admin deletion preserving lead events (onDelete: SetNull)", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Admin deletion preserving lead events (onDelete: SetNull)", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 9: Accidental Conversation Deletion Protection (onDelete: Restrict)
  // --------------------------------------------------------------------------
  try {
    console.log("9. Running: Accidental conversation deletion protection (onDelete: Restrict)...");
    let caughtError = false;
    try {
      // Trying to delete a conversation that has a ChatLead MUST fail due to Restrict
      await prisma.chatConversation.delete({
        where: { id: conversationId },
      });
    } catch (e: any) {
      caughtError = true;
      assert(
        e.code === "P2003" || e.code === "P2014" || e.message.includes("Foreign key constraint") || e.message.includes("violates"),
        "Must be a foreign key constraint violation"
      );
    }

    assert(caughtError, "Deleting conversation with lead must be rejected by foreign key constraint");

    results.push({ name: "Conversation deletion protection (onDelete: Restrict)", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Conversation deletion protection (onDelete: Restrict)", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 10: Chatbot settings persistence & updates
  // --------------------------------------------------------------------------
  try {
    console.log("10. Running: Chatbot settings persistence & updates...");
    const settings = await chatbotSettingsRepository.getSettings();
    assert(Boolean(settings.botName), "Bot name must exist");
    assert(settings.workingDays.length === 5, "Default working days must be 5 days");

    // Update settings
    const updated = await chatbotSettingsRepository.updateSettings({
      botName: "Vantage Private Wealth Assistant",
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
    });

    assert(updated.botName === "Vantage Private Wealth Assistant", "Updated name must persist");
    assert(updated.workingHoursStart === "09:00", "Working start must persist");

    // Restore default
    await chatbotSettingsRepository.updateSettings({
      botName: "Vantage Wealth Assistant",
      workingHoursStart: "09:30",
      workingHoursEnd: "18:30",
    });

    results.push({ name: "Chatbot settings persistence & updates", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Chatbot settings persistence & updates", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 11: Multilingual Knowledge chunk creation and search
  // --------------------------------------------------------------------------
  const createdChunkIds: string[] = [];
  try {
    console.log("11. Running: Multilingual Knowledge chunk creation & native search...");
    // 1. English chunk
    const enChunk = await chatKnowledgeRepository.createChunk({
      sourceType: KnowledgeSourceType.STATIC_FAQ,
      title: "Family Office Structuring & Estate Transition",
      content: "Vantage Wealth assists multi-generational families in setting up discretionary family trusts and estate succession vehicles.",
      language: "en",
      keywords: ["family office", "trust", "succession"],
    });
    createdChunkIds.push(enChunk.id);

    // 2. Hindi chunk in Devanagari
    const hiChunk = await chatKnowledgeRepository.createChunk({
      sourceType: KnowledgeSourceType.STATIC_FAQ,
      title: "पारिवारिक ट्रस्ट और संपत्ति संरक्षण सलाहकार",
      content: "वैनटेज वेल्थ भारतीय परिवारों के लिए पारिवारिक ट्रस्ट और संपत्ति उत्तराधिकार की संरचना में विशेष परामर्श प्रदान करता है।",
      language: "hi",
      keywords: ["पारिवारिक ट्रस्ट", "उत्तराधिकार", "संपत्ति"],
    });
    createdChunkIds.push(hiChunk.id);

    // 3. Hinglish chunk with transliterated terms
    const hinglishChunk = await chatKnowledgeRepository.createChunk({
      sourceType: KnowledgeSourceType.STATIC_FAQ,
      title: "Portfolio Management Services aur Tax Bachao",
      content: "Hamari discretionary PMS service me tax-efficient nivesh aur capital preservation par dhyan diya jata hai.",
      language: "hinglish",
      keywords: ["nivesh", "bachat", "tax bachao"],
      aliases: ["portfolio management", "tax planning"],
    });
    createdChunkIds.push(hinglishChunk.id);

    // Test English search
    const enResults = await chatKnowledgeRepository.searchKnowledge("discretionary family trusts");
    assert(enResults.length > 0, "English search must find matching chunk");
    assert(enResults.some((r) => r.id === enChunk.id), "Must match enChunk");

    // Test Devanagari Hindi search
    const hiResults = await chatKnowledgeRepository.searchKnowledge("पारिवारिक ट्रस्ट");
    assert(hiResults.length > 0, "Hindi search must find matching Devanagari chunk");
    assert(hiResults.some((r) => r.id === hiChunk.id), "Must match hiChunk");

    // Test Hinglish transliterated search
    const hinglishResults = await chatKnowledgeRepository.searchKnowledge("tax bachao nivesh");
    assert(hinglishResults.length > 0, "Hinglish search must find matching chunk");

    results.push({ name: "Multilingual Knowledge creation & native search", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Multilingual Knowledge creation & native search", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 12: Concurrent rate limiting and expiry behavior
  // --------------------------------------------------------------------------
  try {
    console.log("12. Running: Concurrent rate limiting & expiry behavior...");
    const rateLimitKey = `test_rate_limit_${Date.now()}`;
    const limit = 4;
    const windowSeconds = 2; // 2 second window for quick expiry test

    // Fire 6 concurrent requests simultaneously
    const promises = Array.from({ length: 6 }).map(() =>
      chatRateLimitRepository.checkRateLimit(rateLimitKey, limit, windowSeconds)
    );
    const outcomes = await Promise.all(promises);

    const allowedCount = outcomes.filter((o) => o.allowed).length;
    const blockedCount = outcomes.filter((o) => !o.allowed).length;

    assert(allowedCount === 4, `Exactly 4 requests must be allowed (got ${allowedCount})`);
    assert(blockedCount === 2, `Exactly 2 requests must be blocked (got ${blockedCount})`);

    // Wait 2.2 seconds for window to expire
    console.log("   Waiting 2.2s for rate-limit window expiry...");
    await new Promise((res) => setTimeout(res, 2200));

    // Next request must reset and be allowed
    const postExpiry = await chatRateLimitRepository.checkRateLimit(rateLimitKey, limit, windowSeconds);
    assert(postExpiry.allowed === true, "Request post-expiry must be allowed");
    assert(postExpiry.currentCount === 1, `Counter must reset to 1 (got ${postExpiry.currentCount})`);

    // Clean up test bucket
    await chatRateLimitRepository.resetRateLimit(rateLimitKey);

    results.push({ name: "Concurrent rate limiting & expiry behavior", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Concurrent rate limiting & expiry behavior", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // CLEANUP: Clean up all temporary test records
  // --------------------------------------------------------------------------
  try {
    console.log("Cleaning up test records...");
    // Clean chunks
    for (const id of createdChunkIds) {
      await prisma.knowledgeChunk.delete({ where: { id } }).catch(() => {});
    }

    // Clean feedback & messages
    if (conversationId) {
      await prisma.chatMessage.deleteMany({ where: { conversationId } }).catch(() => {});
      await prisma.chatLeadEvent.deleteMany({ where: { leadId } }).catch(() => {});
      await prisma.chatLead.deleteMany({ where: { conversationId } }).catch(() => {});
      await prisma.chatConversation.delete({ where: { id: conversationId } }).catch(() => {});
    }

    console.log("   ✔ Test records cleaned up successfully.\n");
  } catch (err) {
    console.warn("Cleanup warning:", err);
  } finally {
    await prisma.$disconnect();
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("TEST RESULTS SUMMARY");
  console.log("================================================================================");
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`[${status}] ${r.name}`);
    if (!r.passed) {
      allPassed = false;
      console.log(`       Error: ${r.error}`);
    }
  }
  console.log("================================================================================");
  console.log(`TOTAL: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log("================================================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
