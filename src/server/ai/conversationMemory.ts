/**
 * VANTAGE WEALTH — SOUMYA CONVERSATION INTELLIGENCE
 * Multi-Turn Conversation Memory & Entity Context System (Part 3)
 */

export interface ConversationMemoryContext {
  financialGoal?: string;
  investmentAmount?: string;
  timeHorizon?: string;
  familyGoals?: string;
  serviceInterest?: string;
  investmentExperience?: "BEGINNER" | "EXPERIENCED" | "HAS_EXISTING_ADVISOR";
  hasExistingAdvisor?: boolean;
  preferredCallbackTime?: string;
  preferredLanguage?: string;
  confirmedFacts: Record<string, string>;
  lastCorrectionNote?: string;
  unresolvedRequests: string[];
}

/**
 * Extracts currency and investment amounts volunteered in conversational messages
 * Supports formats like: ₹25 lakh, 25 lakhs, 10L, 50 lakh, 1 cr, 30 lakhs
 */
export function extractInvestmentAmount(text: string): string | undefined {
  if (!text) return undefined;

  // 1. ₹ or Rs. with numbers and lakh/crore
  const amountMatch = text.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|lac|cr|crores?|k)?\b/i
  );

  if (amountMatch && amountMatch[1]) {
    const num = amountMatch[1];
    const unit = (amountMatch[2] || "").toLowerCase();

    if (unit.startsWith("l")) {
      return `₹${num} Lakh`;
    }
    if (unit.startsWith("c")) {
      return `₹${num} Crore`;
    }
    if (Number(num) >= 100000) {
      const inLakhs = (Number(num) / 100000).toFixed(1).replace(/\.0$/, "");
      return `₹${inLakhs} Lakh`;
    }
    if (unit === "" && (text.includes("₹") || text.toLowerCase().includes("rs"))) {
      return `₹${num}`;
    }
  }

  // Words like "ten lakhs", "twenty five lakh"
  const wordMatch = text.match(/\b(ten|twenty|twenty\s*five|thirty|fifty)\s*(?:lakh|lakhs)\b/i);
  if (wordMatch) {
    const word = wordMatch[1].toLowerCase().replace(/\s+/, "");
    const map: Record<string, string> = {
      ten: "₹10 Lakh",
      twenty: "₹20 Lakh",
      twentyfive: "₹25 Lakh",
      thirty: "₹30 Lakh",
      fifty: "₹50 Lakh",
    };
    return map[word] || undefined;
  }

  return undefined;
}

/**
 * Extracts time horizons volunteered in conversation
 * e.g. "after two years", "5 years", "after five years", "retire at 55", "in 10 years"
 */
export function extractTimeHorizon(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  // "after X years" or "for X years" with digits
  const yearsMatch = lower.match(/(?:after|for|in|next|around)?\s*(\d+)\s*(?:years?|saal)\b/);
  if (yearsMatch) {
    return `${yearsMatch[1]} years`;
  }

  // Word-based numbers: "after five years", "two years"
  const wordYearsMatch = lower.match(
    /(?:after|for|in|next|around)?\s*(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:years?|saal)\b/
  );
  if (wordYearsMatch) {
    const wordMap: Record<string, string> = {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
      seven: "7",
      eight: "8",
      nine: "9",
      ten: "10",
    };
    const num = wordMap[wordYearsMatch[1].toLowerCase()];
    if (num) return `${num} years`;
  }

  // Retirement age e.g. "retire at 55", "target age is 60"
  const ageMatch = lower.match(/(?:retire\s*at|target\s*age\s*(?:is)?|age)\s*(\d{2})/);
  if (ageMatch) {
    return `Retire at age ${ageMatch[1]}`;
  }

  if (lower.includes("short term") || lower.includes("jaldi")) {
    return "Short term (< 2 years)";
  }
  if (lower.includes("long term") || lower.includes("lambe samay")) {
    return "Long term (5+ years)";
  }

  return undefined;
}

/**
 * Extracts financial goal keywords from user input
 */
export function extractFinancialGoal(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  if (
    lower.includes("daughter") ||
    lower.includes("child") ||
    lower.includes("college education") ||
    lower.includes("children education") ||
    lower.includes("beti ki padhai") ||
    lower.includes("बच्चों की शिक्षा")
  ) {
    return "Child's Education";
  }
  if (lower.includes("retirement") || lower.includes("retire") || lower.includes("pension") || lower.includes("रिटायरमेंट")) {
    return "Retirement";
  }
  if (lower.includes("home loan") || lower.includes("buy a house") || lower.includes("property") || lower.includes("होम लोन")) {
    return "Property / Home Financing";
  }
  if (lower.includes("tax") || lower.includes("capital gains") || lower.includes("टैक्स")) {
    return "Tax Planning & Capital Gains";
  }
  if (lower.includes("insurance") || lower.includes("family protection") || lower.includes("बीमा")) {
    return "Family Protection & Insurance";
  }
  if (lower.includes("review") || lower.includes("second opinion")) {
    return "Existing Portfolio Review";
  }
  if (lower.includes("wealth creation") || lower.includes("grow my money") || lower.includes("invest") || lower.includes("निवेश")) {
    return "Wealth Creation & Growth";
  }

  return undefined;
}

/**
 * Detects if the current turn contains a correction to previous information
 * e.g., "Actually make that 30 lakh", "I meant 30 lakh, not 25", "change retirement age to 55"
 */
export function detectCorrection(text: string): { isCorrection: boolean; field?: string; note?: string } {
  const lower = text.toLowerCase();
  const correctionIndicators = [
    "actually",
    "i meant",
    "correction",
    "change that to",
    "make that",
    "instead of",
    "not 25",
    "galti se",
    "badal dijiye",
  ];

  const hasCorrectionWord = correctionIndicators.some((word) => lower.includes(word));
  if (!hasCorrectionWord) {
    return { isCorrection: false };
  }

  const newAmount = extractInvestmentAmount(text);
  if (newAmount) {
    return {
      isCorrection: true,
      field: "investmentAmount",
      note: `Updated investment amount to ${newAmount}`,
    };
  }

  const newHorizon = extractTimeHorizon(text);
  if (newHorizon) {
    return {
      isCorrection: true,
      field: "timeHorizon",
      note: `Updated time horizon to ${newHorizon}`,
    };
  }

  const callbackTimeMatch = text.match(
    /\b(today|tomorrow|afternoon|morning|evening|2 pm|3 pm|4 pm|5 pm|10 am|11 am|weekday|weekend)\b/i
  );
  if (callbackTimeMatch && (hasCorrectionWord || lower.includes("change"))) {
    return {
      isCorrection: true,
      field: "preferredCallbackTime",
      note: `Updated preferred callback time to ${text.trim()}`,
    };
  }

  return { isCorrection: true, note: "User made an adjustment to previous statements." };
}

/**
 * Updates structured conversation memory across turns, resolving anaphora and applying corrections
 */
export function updateConversationMemory(
  currentMemory: ConversationMemoryContext | undefined,
  userMessage: string,
  language: string = "en"
): ConversationMemoryContext {
  const memory: ConversationMemoryContext = currentMemory || {
    confirmedFacts: {},
    unresolvedRequests: [],
  };

  const lower = userMessage.toLowerCase();

  // 1. Check for Corrections first
  const correction = detectCorrection(userMessage);
  if (correction.isCorrection) {
    memory.lastCorrectionNote = correction.note;
    if (correction.field === "investmentAmount") {
      const updatedAmount = extractInvestmentAmount(userMessage);
      if (updatedAmount) {
        memory.investmentAmount = updatedAmount;
        memory.confirmedFacts["Investment Amount"] = updatedAmount;
      }
    }
    if (correction.field === "timeHorizon") {
      const updatedHorizon = extractTimeHorizon(userMessage);
      if (updatedHorizon) {
        memory.timeHorizon = updatedHorizon;
        memory.confirmedFacts["Time Horizon"] = updatedHorizon;
      }
    }
    if (correction.field === "preferredCallbackTime") {
      memory.preferredCallbackTime = userMessage.trim();
      memory.confirmedFacts["Preferred Callback Time"] = userMessage.trim();
    }
  } else {
    // 2. Normal extraction (only update if not already set or explicitly volunteered)
    const amount = extractInvestmentAmount(userMessage);
    if (amount) {
      memory.investmentAmount = amount;
      memory.confirmedFacts["Investment Amount"] = amount;
    }

    const horizon = extractTimeHorizon(userMessage);
    if (horizon) {
      memory.timeHorizon = horizon;
      memory.confirmedFacts["Time Horizon"] = horizon;
    }

    const goal = extractFinancialGoal(userMessage);
    if (goal) {
      memory.financialGoal = goal;
      memory.confirmedFacts["Primary Goal"] = goal;
    }
  }

  // 3. Experience Detection
  if (
    lower.includes("beginner") ||
    lower.includes("first time") ||
    lower.includes("pehli baar") ||
    lower.includes("new to investing")
  ) {
    memory.investmentExperience = "BEGINNER";
    memory.confirmedFacts["Experience"] = "First-time investor / Beginner";
  } else if (
    lower.includes("another advisor") ||
    lower.includes("existing advisor") ||
    lower.includes("already have investments") ||
    lower.includes("currently investing with")
  ) {
    memory.investmentExperience = "HAS_EXISTING_ADVISOR";
    memory.hasExistingAdvisor = true;
    memory.confirmedFacts["Advisor Status"] = "Has investments with another advisor/platform";
  }

  // 4. Preferred Callback Time
  const callbackTimeMatch = userMessage.match(
    /\b(today|tomorrow|afternoon|morning|evening|2 pm|3 pm|4 pm|5 pm|weekday|weekend)\b/i
  );
  if (callbackTimeMatch && (lower.includes("call") || lower.includes("speak") || lower.includes("contact"))) {
    memory.preferredCallbackTime = userMessage.trim();
    memory.confirmedFacts["Preferred Callback Time"] = userMessage.trim();
  }

  // 5. Language preference
  memory.preferredLanguage = language;

  return memory;
}

/**
 * Builds a prompt injection string detailing known conversation memory and resolved entities
 * Ensures Soumya NEVER asks questions already answered.
 */
export function formatMemoryForPrompt(memory: ConversationMemoryContext): string {
  const facts = Object.entries(memory.confirmedFacts || {});
  if (facts.length === 0 && !memory.lastCorrectionNote) {
    return "";
  }

  let prompt = "\n### CONVERSATION MEMORY (Known facts volunteered in this conversation — DO NOT ask again for these):\n";
  for (const [key, val] of facts) {
    prompt += `- ${key}: ${val}\n`;
  }

  if (memory.lastCorrectionNote) {
    prompt += `- RECENT CORRECTION: ${memory.lastCorrectionNote} (Acknowledge this change naturally)\n`;
  }

  prompt += "\nRULES FOR USING MEMORY:\n";
  prompt += "1. If the visitor uses words like 'it', 'this money', or 'these funds', refer naturally to the amount/goal stored in memory.\n";
  prompt += "2. DO NOT ask the visitor what their investment amount or timeline is if it is already recorded in the memory above.\n";
  prompt += "3. Distinguish confirmed facts from assumptions. Build smoothly on what the visitor has already shared.\n";

  return prompt;
}
