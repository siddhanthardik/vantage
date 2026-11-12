/**
 * VANTAGE WEALTH — SOUMYA CONVERSATION INTELLIGENCE
 * Visitor Classification, Service Matching, Next Best Action & Advisor Handover (Parts 4–8)
 */

import { PrimaryIntent, IntentClassificationResult } from "./intentClassification";
import { ConversationMemoryContext } from "./conversationMemory";

export type VisitorClassification =
  | "NEW_PROSPECT"
  | "RETURNING_VISITOR"
  | "EXISTING_CLIENT"
  | "GENERAL_INFO_SEEKER"
  | "HIGH_INTENT_PROSPECT";

export type NextBestAction =
  | "ANSWER_QUESTION"
  | "ASK_CLARIFYING_QUESTION"
  | "EXPLAIN_SERVICE"
  | "CONTINUE_QUALIFICATION"
  | "OFFER_CONSULTATION"
  | "REQUEST_CALLBACK"
  | "ROUTE_EXISTING_CLIENT_SUPPORT"
  | "ROUTE_COMPLAINT"
  | "ESCALATE_TO_HUMAN"
  | "DECLINE_OUT_OF_SCOPE_REQUEST";

export interface MatchedServiceInfo {
  slug: string;
  title: string;
  relevanceRationale: string;
}

export const APPROVED_SERVICES: Record<string, MatchedServiceInfo> = {
  "investment-solutions": {
    slug: "investment-solutions",
    title: "Investment Solutions & Portfolio Advisory",
    relevanceRationale: "Helping clients build well-diversified investment plans primarily through mutual funds matched to their personal goals.",
  },
  "retirement-planning": {
    slug: "retirement-planning",
    title: "Retirement Planning",
    relevanceRationale: "Working out how much is needed for a comfortable retirement and setting up a structured investment roadmap.",
  },
  "risk-management-insurance": {
    slug: "risk-management-insurance",
    title: "Risk Management & Insurance Solutions",
    relevanceRationale: "Evaluating family term life and health protection requirements objectively with established insurance providers.",
  },
  "tax-advisory": {
    slug: "tax-advisory",
    title: "Tax Advisory & Tax Compliance",
    relevanceRationale: "Planning investment holding periods and capital gains to minimize unnecessary tax costs within legal rules.",
  },
  "strategic-financing": {
    slug: "strategic-financing",
    title: "Strategic Financing & Liability Solutions",
    relevanceRationale: "Assisting with property financing, home loans, or loans against securities through established lending partners.",
  },
  "ongoing-portfolio-reviews": {
    slug: "ongoing-portfolio-reviews",
    title: "Ongoing Portfolio Reviews",
    relevanceRationale: "Conducting an independent review of existing investments to spot overlaps, high fees, or misalignment with personal goals.",
  },
};

/**
 * Classifies visitor based on conversation evidence
 */
export function classifyVisitor(params: {
  userMessage: string;
  intentResult: IntentClassificationResult;
  isReturningSession: boolean;
  previousClass?: VisitorClassification;
}): VisitorClassification {
  const { userMessage, intentResult, isReturningSession, previousClass } = params;
  const lower = userMessage.toLowerCase();

  // 1. Existing client check
  if (
    intentResult.primaryIntent === "EXISTING_CLIENT_SUPPORT" ||
    lower.includes("existing client") ||
    lower.includes("current client") ||
    lower.includes("already a client") ||
    lower.includes("my account portfolio") ||
    lower.includes("investment statement") ||
    lower.includes("my statement") ||
    (intentResult.primaryIntent === "COMPLAINT_OR_ISSUE" &&
      (lower.includes("statement") || lower.includes("account") || lower.includes("email") || lower.includes("invested")))
  ) {
    return "EXISTING_CLIENT";
  }

  // 2. High-intent prospect check
  if (
    intentResult.primaryIntent === "CALLBACK_REQUEST" ||
    intentResult.primaryIntent === "PORTFOLIO_REVIEW" ||
    lower.includes("speak with an advisor") ||
    lower.includes("schedule a consultation") ||
    lower.includes("request callback") ||
    lower.includes("talk to someone")
  ) {
    return "HIGH_INTENT_PROSPECT";
  }

  // 3. General Information Seeker
  if (
    intentResult.inquirerMode === "INFORMATION" &&
    (intentResult.primaryIntent === "GENERAL_INFORMATION" ||
      lower.includes("what is") ||
      lower.includes("explain")) &&
    !lower.includes("lakh") &&
    !lower.includes("invest")
  ) {
    return "GENERAL_INFO_SEEKER";
  }

  // 4. Returning Visitor
  if (isReturningSession || previousClass === "RETURNING_VISITOR") {
    return "RETURNING_VISITOR";
  }

  return previousClass || "NEW_PROSPECT";
}

/**
 * Maps requirements to Vantage Wealth's 6 approved services
 */
export function matchApprovedService(
  intent: PrimaryIntent,
  memory: ConversationMemoryContext
): MatchedServiceInfo | undefined {
  if (intent === "RETIREMENT_PLANNING" || memory.financialGoal === "Retirement") {
    return APPROVED_SERVICES["retirement-planning"];
  }

  if (intent === "PORTFOLIO_REVIEW" || memory.hasExistingAdvisor) {
    return APPROVED_SERVICES["ongoing-portfolio-reviews"];
  }

  if (intent === "PROPERTY_AND_FINANCING") {
    return APPROVED_SERVICES["strategic-financing"];
  }

  if (intent === "TAX_ADVISORY") {
    return APPROVED_SERVICES["tax-advisory"];
  }

  if (intent === "INSURANCE_ENQUIRY") {
    return APPROVED_SERVICES["risk-management-insurance"];
  }

  if (
    intent === "INVESTMENT_PLANNING" ||
    intent === "MUTUAL_FUND_ENQUIRY" ||
    intent === "FAMILY_WEALTH_PLANNING" ||
    memory.investmentAmount
  ) {
    return APPROVED_SERVICES["investment-solutions"];
  }

  return undefined;
}

/**
 * Selects the Next Best Action for Soumya on this conversation turn
 */
export function determineNextBestAction(params: {
  intentResult: IntentClassificationResult;
  visitorClass: VisitorClassification;
  memory: ConversationMemoryContext;
  matchedService?: MatchedServiceInfo;
}): NextBestAction {
  const { intentResult, visitorClass, memory } = params;

  // 1. Complaint or urgent issue
  if (intentResult.primaryIntent === "COMPLAINT_OR_ISSUE") {
    return "ROUTE_COMPLAINT";
  }

  // 2. Existing client asking for account data
  if (visitorClass === "EXISTING_CLIENT" || intentResult.primaryIntent === "EXISTING_CLIENT_SUPPORT") {
    return "ROUTE_EXISTING_CLIENT_SUPPORT";
  }

  // 3. Callback requested
  if (intentResult.primaryIntent === "CALLBACK_REQUEST" || intentResult.inquirerMode === "REQUESTING_HUMAN") {
    return "REQUEST_CALLBACK";
  }

  // 4. Out of scope request
  if (intentResult.primaryIntent === "OUT_OF_SCOPE") {
    return "DECLINE_OUT_OF_SCOPE_REQUEST";
  }

  // 5. If visitor has shared both amount and timeline, offer consultation
  if (memory.investmentAmount && memory.timeHorizon) {
    return "OFFER_CONSULTATION";
  }

  // 6. If amount is volunteered but timeline is missing, ask clarifying question
  if (memory.investmentAmount && !memory.timeHorizon) {
    return "ASK_CLARIFYING_QUESTION";
  }

  // 7. If high intent prospect, continue qualification or offer consultation
  if (visitorClass === "HIGH_INTENT_PROSPECT") {
    return "CONTINUE_QUALIFICATION";
  }

  // 8. General question
  return "ANSWER_QUESTION";
}

/**
 * Generates dynamic tactical guidance for the Gemini prompt based on the chosen Next Action
 */
export function formatTacticalActionDirective(action: NextBestAction, memory: ConversationMemoryContext): string {
  switch (action) {
    case "REQUEST_CALLBACK":
      return `TACTICAL DIRECTIVE: The visitor wants human contact. Acknowledge warmly, let them know you would be glad to connect them with a senior wealth advisor, and invite them to use the 'Request Callback' option in this chat or share a convenient time. Keep it brief (1–2 sentences).`;

    case "ROUTE_EXISTING_CLIENT_SUPPORT":
      return `TACTICAL DIRECTIVE: The visitor is an existing client. For privacy reasons, explain warmly that live account data is not displayed in this chat, and offer to coordinate directly with their dedicated Relationship Manager or advisory desk.`;

    case "ROUTE_COMPLAINT":
      return `TACTICAL DIRECTIVE: The visitor has raised an issue or complaint. Express genuine empathy, take their concern seriously without defensiveness, and offer immediate human escalation via callback so the advisory team can resolve it.`;

    case "DECLINE_OUT_OF_SCOPE_REQUEST":
      return `TACTICAL DIRECTIVE: Politely and pleasantly decline non-wealth requests (like coding, medical, travel) and warmly clarify that your expertise is wealth planning and financial services.`;

    case "OFFER_CONSULTATION":
      return `TACTICAL DIRECTIVE: The visitor has shared key details (amount: ${memory.investmentAmount || "volunteered"}, horizon: ${memory.timeHorizon || "noted"}). Acknowledge their situation warmly, explain how general options depend on this timeline without giving stock picks or allocation percentages, and naturally suggest that a private discussion with an advisor would help design a tailored plan.`;

    case "ASK_CLARIFYING_QUESTION":
      return `TACTICAL DIRECTIVE: The visitor mentioned investing ${memory.investmentAmount || "a sum"}, but their time horizon or goal is still unknown. Do NOT recommend investments or asset percentages yet. Acknowledge the amount warmly, explain that the right option depends on when the money is needed, and ask ONE question about their timeframe.`;

    case "CONTINUE_QUALIFICATION":
      return `TACTICAL DIRECTIVE: Continue conversational discovery gently. Ask one relevant question to understand their milestone or current situation. Do NOT interrogate or ask multiple questions.`;

    case "ANSWER_QUESTION":
    default:
      return `TACTICAL DIRECTIVE: Answer the visitor's question simply and clearly in 1–2 short paragraphs using everyday analogies. Conclude with ONE friendly question to see what they are planning towards.`;
  }
}

/**
 * Computes progressive lead qualification score (0–100%)
 */
export function computeLeadQualificationScore(params: {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  financialObjective?: string | null;
  portfolioSize?: string | null;
  preferredTimeWindow?: string | null;
  consentGiven?: boolean;
}): number {
  let score = 0;
  if (params.fullName) score += 20;
  if (params.phone || params.email) score += 25;
  if (params.financialObjective) score += 20;
  if (params.portfolioSize) score += 15;
  if (params.preferredTimeWindow) score += 10;
  if (params.consentGiven) score += 10;
  return Math.min(score, 100);
}

/**
 * Generates an executive briefing for human advisors when a lead or callback is requested
 */
export function generateAdvisorBriefing(params: {
  leadName?: string | null;
  phone?: string | null;
  email?: string | null;
  preferredTime?: string | null;
  preferredMethod?: string | null;
  intent: PrimaryIntent;
  matchedService?: MatchedServiceInfo;
  memory: ConversationMemoryContext;
  conversationSnippet: string;
  reasonForHandover: string;
}): string {
  const {
    leadName,
    phone,
    email,
    preferredTime,
    preferredMethod,
    intent,
    matchedService,
    memory,
    conversationSnippet,
    reasonForHandover,
  } = params;

  return `### ADVISOR DISCOVERY BRIEFING
**Visitor Name:** ${leadName || "Prospective Client (Not disclosed)"}
**Contact Info:** ${phone ? `Phone: ${phone}` : "No phone provided"} | ${email ? `Email: ${email}` : "No email provided"}
**Preferred Callback Time:** ${preferredTime || "Standard Business Hours"}
**Preferred Channel:** ${preferredMethod || "Phone Call"}
**Primary Intent:** ${intent}
**Matched Service:** ${matchedService ? matchedService.title : "General Wealth Planning"}
**Volunteered Amount:** ${memory.investmentAmount || "Not specified"}
**Target Horizon:** ${memory.timeHorizon || "Not specified"}
**Goal / Requirement:** ${memory.financialGoal || "General Advisory"}
**Investor Profile:** ${memory.investmentExperience || "General Prospect"}
**Handover Reason:** ${reasonForHandover}

**Key Conversation Context:**
${conversationSnippet}
`;
}
