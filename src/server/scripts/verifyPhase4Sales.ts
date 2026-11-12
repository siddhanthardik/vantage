import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs";
import { prisma } from "@/lib/db/prisma";
import { chatLeadRepository } from "../repositories/chatLeadRepository";
import { classifyVisitorIntent } from "../ai/intentClassification";
import {
  updateConversationMemory,
  ConversationMemoryContext,
} from "../ai/conversationMemory";
import {
  classifyVisitor,
  determineNextBestAction,
  generateAdvisorBriefing,
  formatTacticalActionDirective,
} from "../ai/conversationIntelligence";
import {
  buildGroundedSystemPrompt,
  checkFinancialSafetyViolation,
} from "../ai/financialSafetyGuardrails";

export interface Phase4TestResult {
  id: number;
  name: string;
  verdict: "PASSED" | "FAILED";
  details: string;
}

async function runPhase4Evaluation() {
  console.log("==================================================================================");
  console.log("   VANTAGE WEALTH — SOUMYA PHASE 4: SALES INTELLIGENCE & RELATIONSHIP TESTS");
  console.log("==================================================================================\n");

  const results: Phase4TestResult[] = [];

  const record = (id: number, name: string, passed: boolean, details: string) => {
    results.push({
      id,
      name,
      verdict: passed ? "PASSED" : "FAILED",
      details,
    });
    console.log(`[Test ${id}] ${name}: ${passed ? "✔ PASSED" : "✘ FAILED"} (${details})`);
  };

  let testLeadId: string = "";
  let testConvId: string = "";

  try {
    // 1. New investment enquiry
    {
      const text = "I want to invest some wealth, what are my options with Vantage?";
      const intent = classifyVisitorIntent(text);
      const isInvestment =
        intent.primaryIntent === "INVESTMENT_PLANNING" ||
        intent.primaryIntent === "GENERAL_SERVICE_ENQUIRY";
      record(
        1,
        "New investment enquiry",
        isInvestment,
        `Intent: ${intent.primaryIntent}, Mode: ${intent.inquirerMode}`
      );
    }

    // 2. Visitor exploring mutual funds without sales pressure
    {
      const text = "What mutual funds do you recommend? I'm just exploring options for now.";
      const intent = classifyVisitorIntent(text);
      const isMutualFunds = intent.primaryIntent === "MUTUAL_FUND_ENQUIRY";
      const dummyMemory: ConversationMemoryContext = {
        confirmedFacts: {},
        unresolvedRequests: [],
      };
      const directive = formatTacticalActionDirective("ANSWER_QUESTION", dummyMemory);
      const noPressure = !directive.includes("force") && !directive.includes("demand");
      record(
        2,
        "Visitor exploring mutual funds without sales pressure",
        isMutualFunds && noPressure,
        `Intent: ${intent.primaryIntent}, Directive encourages natural education`
      );
    }

    // 3. Retirement planning enquiry
    {
      const text = "I am 45 years old and looking to plan for my retirement in 15 years.";
      const intent = classifyVisitorIntent(text);
      const memContext: ConversationMemoryContext = {
        confirmedFacts: {},
        unresolvedRequests: [],
      };
      const updated = updateConversationMemory(memContext, text);
      const isRetirement = intent.primaryIntent === "RETIREMENT_PLANNING";
      const hasRetirementObjective =
        updated.financialGoal === "Retirement" ||
        updated.timeHorizon === "15 years" ||
        updated.serviceInterest === "retirement-planning";
      record(
        3,
        "Retirement planning enquiry",
        isRetirement && Boolean(hasRetirementObjective),
        `Intent: ${intent.primaryIntent}, Goal: ${updated.financialGoal}, Horizon: ${updated.timeHorizon}`
      );
    }

    // 4. Insurance enquiry
    {
      const text = "Can you help me evaluate keyman insurance and term life cover for my family?";
      const intent = classifyVisitorIntent(text);
      const isInsurance = intent.primaryIntent === "INSURANCE_ENQUIRY";
      record(
        4,
        "Insurance enquiry",
        isInsurance,
        `Intent: ${intent.primaryIntent}`
      );
    }

    // 5. Portfolio review request
    {
      const text = "I currently hold direct equities and mutual funds worth 3 Cr across 4 brokers and want a comprehensive portfolio review.";
      const intent = classifyVisitorIntent(text);
      const memContext: ConversationMemoryContext = {
        confirmedFacts: {},
        unresolvedRequests: [],
      };
      const updated = updateConversationMemory(memContext, text);
      const isPortfolioReview = intent.primaryIntent === "PORTFOLIO_REVIEW";
      const hasAmount = Boolean(updated.investmentAmount && (updated.investmentAmount.includes("3") || updated.investmentAmount.includes("Cr")));
      record(
        5,
        "Portfolio review request",
        isPortfolioReview && hasAmount,
        `Intent: ${intent.primaryIntent}, Extracted amount: ${updated.investmentAmount}`
      );
    }

    // 6. Visitor requesting a consultation
    {
      const text = "I'd like to book a private consultation with Vineet Gupta or an advisor this Thursday.";
      const intent = classifyVisitorIntent(text);
      const isCallbackOrConsult =
        intent.primaryIntent === "CALLBACK_REQUEST" ||
        intent.inquirerMode === "REQUESTING_HUMAN";
      const visitorClass = classifyVisitor({
        userMessage: text,
        intentResult: intent,
        isReturningSession: false,
      });
      const dummyMemory: ConversationMemoryContext = {
        confirmedFacts: {},
        unresolvedRequests: [],
      };
      const nextAction = determineNextBestAction({
        intentResult: intent,
        visitorClass,
        memory: dummyMemory,
      });
      const passed = isCallbackOrConsult && (nextAction === "REQUEST_CALLBACK" || nextAction === "OFFER_CONSULTATION");
      record(
        6,
        "Visitor requesting a consultation",
        passed,
        `Intent: ${intent.primaryIntent}, VisitorClass: ${visitorClass}, NextAction: ${nextAction}`
      );
    }

    // 7. Visitor declining contact sharing
    {
      const text = "I don't want to share my phone number right now, just answer my questions.";
      const intent = classifyVisitorIntent(text);
      const visitorClass = classifyVisitor({
        userMessage: text,
        intentResult: intent,
        isReturningSession: false,
      });
      const dummyMemory: ConversationMemoryContext = {
        confirmedFacts: {},
        unresolvedRequests: [],
      };
      const nextAction = determineNextBestAction({
        intentResult: intent,
        visitorClass,
        memory: dummyMemory,
      });
      // Should not aggressively block with force contact
      const passed = nextAction === "ANSWER_QUESTION" || nextAction === "ASK_CLARIFYING_QUESTION";
      record(
        7,
        "Visitor declining contact sharing",
        passed,
        `Next action gently falls back to: ${nextAction}`
      );
    }

    // 8. Consultation request without an available booking slot (no fake slot)
    {
      const prompt = buildGroundedSystemPrompt({});
      const noFakeSlots =
        prompt.includes("Advisory Desk coordinates all consultations personally") ||
        prompt.includes("You can click 'Request Callback' right here, or let me know a convenient time.") ||
        prompt.includes("Never invent partnerships, registrations, products, or services");
      record(
        8,
        "Consultation request without an available booking slot (no fake slot)",
        noFakeSlots,
        `System instructions coordinate personally via callback and forbid automated slot fabrication`
      );
    }

    // 9. Advisor briefing generation
    {
      const testMemory: ConversationMemoryContext = {
        financialGoal: "Consolidate real estate exit liquidity and plan multi-generational wealth",
        investmentAmount: "₹15–20 Crores",
        timeHorizon: "10+ years",
        familyGoals: "Married with 2 children (higher education abroad)",
        hasExistingAdvisor: true,
        investmentExperience: "EXPERIENCED",
        confirmedFacts: {
          "Residence": "Mumbai",
        },
        unresolvedRequests: [],
      };

      const briefing = generateAdvisorBriefing({
        leadName: "Vikram Singhania",
        phone: "+91 98200 12345",
        email: "vikram@example.com",
        preferredTime: "Weekday Evening (5 PM - 8 PM IST)",
        preferredMethod: "Phone Call",
        preferredLanguage: "English / Hinglish",
        intent: "FAMILY_WEALTH_PLANNING",
        memory: testMemory,
        conversationSnippet: "Client discussed ₹15-20 Cr liquidity and family structure.",
        reasonForHandover: "High-value prospective client requested private advisory discussion.",
      });

      const hasRequiredSections =
        briefing.includes("ADVISOR DISCOVERY BRIEFING") &&
        briefing.includes("Vikram Singhania") &&
        briefing.includes("₹15–20 Crores") &&
        briefing.toUpperCase().includes("RECOMMENDED ADVISOR NEXT STEPS");

      record(
        9,
        "Advisor briefing generation",
        hasRequiredSections,
        `Briefing formatted with comprehensive Part 10 structure`
      );
    }

    // Database test preparation: create conversation & lead for tests 10-17
    const testConv = await prisma.chatConversation.create({
      data: {
        anonymousSessionId: `phase4-anon-${Date.now()}`,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    testConvId = testConv.id;

    const createdLead = await chatLeadRepository.upsertLead({
      conversationId: testConv.id,
      fullName: "Ananya Deshmukh",
      email: `ananya.deshmukh.${Date.now()}@example.com`,
      phone: "+91 98111 22334",
      preferredMethod: "PHONE",
      preferredTimeWindow: "Weekday Afternoon (2 PM - 5 PM IST)",
      consentGiven: true,
      serviceInterest: "PORTFOLIO_MANAGEMENT",
      salesStage: "NEW_ENQUIRY",
      status: "NEW",
    });
    testLeadId = createdLead.id;

    // 10. Lead assignment
    {
      const assigned = await chatLeadRepository.assignAdvisor(testLeadId, "Vineet Gupta");
      const passed = assigned.assignedAdvisor === "Vineet Gupta";
      record(
        10,
        "Lead assignment",
        passed,
        `Assigned advisor: ${assigned.assignedAdvisor}`
      );
    }

    // 11. Follow-up creation
    {
      const targetDate = new Date(Date.now() + 86400000); // +24 hours
      const updated = await chatLeadRepository.setFollowUp(testLeadId, targetDate);
      const passed = Boolean(updated.nextFollowUpAt && new Date(updated.nextFollowUpAt).getTime() === targetDate.getTime());
      record(
        11,
        "Follow-up creation",
        passed,
        `Follow-up set to: ${updated.nextFollowUpAt?.toISOString()}`
      );
    }

    // 12. Follow-up rescheduling
    {
      const rescheduledDate = new Date(Date.now() + 172800000); // +48 hours
      const updated = await chatLeadRepository.setFollowUp(testLeadId, rescheduledDate);
      const passed = Boolean(updated.nextFollowUpAt && new Date(updated.nextFollowUpAt).getTime() === rescheduledDate.getTime());
      record(
        12,
        "Follow-up rescheduling",
        passed,
        `Rescheduled to: ${updated.nextFollowUpAt?.toISOString()}`
      );
    }

    // 13. Follow-up completion
    {
      const completed = await chatLeadRepository.completeFollowUp(testLeadId);
      const passed = completed.nextFollowUpAt === null && completed.lastContactAt !== null;
      record(
        13,
        "Follow-up completion",
        passed,
        `Follow-up cleared, last contact at: ${completed.lastContactAt?.toISOString()}`
      );
    }

    // 14. Lead stage transitions
    {
      const stage1 = await chatLeadRepository.updateSalesStage(testLeadId, "INITIAL_DISCOVERY");
      const stage2 = await chatLeadRepository.updateSalesStage(testLeadId, "QUALIFICATION");
      const stage3 = await chatLeadRepository.updateSalesStage(testLeadId, "CONSULTATION_REQUESTED");
      const stage4 = await chatLeadRepository.updateSalesStage(testLeadId, "CONSULTATION_SCHEDULED");
      const passed =
        stage1.salesStage === "INITIAL_DISCOVERY" &&
        stage2.salesStage === "QUALIFICATION" &&
        stage3.salesStage === "CONSULTATION_REQUESTED" &&
        stage4.salesStage === "CONSULTATION_SCHEDULED";
      record(
        14,
        "Lead stage transitions",
        passed,
        `Successfully transitioned through sales pipeline stages`
      );
    }

    // 15. Lead conversion
    {
      const converted = await chatLeadRepository.updateSalesStage(testLeadId, "CONVERTED");
      const passed = converted.salesStage === "CONVERTED" && converted.conversionDate !== null;
      record(
        15,
        "Lead conversion",
        passed,
        `Stage: ${converted.salesStage}, Conversion date: ${converted.conversionDate?.toISOString()}`
      );
    }

    // 16. Lead closure
    {
      const closed = await chatLeadRepository.closeLead(testLeadId, "Prospect decided to retain internal corporate trust");
      const passed =
        closed.salesStage === "NOT_PROCEEDING" &&
        closed.status === "CLOSED" &&
        closed.closureReason === "Prospect decided to retain internal corporate trust";
      record(
        16,
        "Lead closure",
        passed,
        `Stage: ${closed.salesStage}, Closure Reason: ${closed.closureReason}`
      );
    }

    // 17. Returning visitor with existing lead
    {
      const existing = await prisma.chatLead.findFirst({
        where: {
          OR: [
            { phone: "+91 98111 22334" },
            { id: testLeadId },
          ],
        },
      });
      const passed = existing !== null && existing.id === testLeadId;
      record(
        17,
        "Returning visitor with existing lead",
        passed,
        `Recognized existing lead record ID: ${existing?.id}`
      );
    }

    // 18. Existing client not incorrectly classified as a new prospect
    {
      const text = "I am an existing client of Vantage Wealth with Vineet, I need an updated statement.";
      const intent = classifyVisitorIntent(text);
      const classification = classifyVisitor({
        userMessage: text,
        intentResult: intent,
        isReturningSession: false,
      });
      const passed = classification === "EXISTING_CLIENT";
      record(
        18,
        "Existing client not incorrectly classified as a new prospect",
        passed,
        `Visitor classification: ${classification}`
      );
    }

    // 19. No invented appointment confirmation
    {
      const promptText = buildGroundedSystemPrompt({});
      const preservesTruthfulCoordinatedBooking =
        promptText.includes("Advisory Desk coordinates all consultations personally") ||
        promptText.includes("Request Callback") ||
        promptText.includes("Never invent partnerships, registrations, products, or services");
      record(
        19,
        "No invented appointment confirmation",
        preservesTruthfulCoordinatedBooking,
        `Prompt establishes callback coordination without fabricating appointment bookings`
      );
    }

    // 20. No personalised investment advice
    {
      const stockCheck = checkFinancialSafetyViolation("Should I buy this stock or get a stock tip for Reliance right now?");
      const passed = stockCheck.isViolation === true && stockCheck.category === "STOCK_TIP";
      record(
        20,
        "No personalised investment advice",
        passed,
        `Financial safety boundaries intercept stock tips: ${stockCheck.category}`
      );
    }

    console.log("\n==================================================================================");
    const passedCount = results.filter((r) => r.verdict === "PASSED").length;
    console.log(`PHASE 4 TEST SUMMARY: ${passedCount} / ${results.length} PASSED`);
    console.log("==================================================================================\n");

    // Clean up created test records
    if (testLeadId) {
      await prisma.chatLeadEvent.deleteMany({ where: { leadId: testLeadId } }).catch(() => {});
      await prisma.chatLead.delete({ where: { id: testLeadId } }).catch(() => {});
    }
    if (testConvId) {
      await prisma.chatConversation.delete({ where: { id: testConvId } }).catch(() => {});
    }

    // Save JSON results report
    fs.writeFileSync(
      "src/server/scripts/phase4_evaluation_results.json",
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalTests: results.length,
          passedCount,
          results,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Evaluation script encountered error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Evaluation();
