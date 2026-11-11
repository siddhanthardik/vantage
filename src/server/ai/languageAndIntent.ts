/**
 * Language detection and conversational intent parsing for Vantage Wealth Assistant
 */

export type DetectedLanguage = "en" | "hi" | "hinglish";

/**
 * Detects whether incoming user text is in English, Devanagari Hindi, or Hinglish (transliterated Hindi).
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || typeof text !== "string") return "en";

  // 1. Devanagari Unicode Block: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }

  // 2. Hinglish keyword heuristics (common Hindi conversational tokens written in Latin script)
  const lower = text.toLowerCase();
  const hinglishTokens = [
    /\b(aap|aapka|aapki|aapke|tum|tumhara|tumhari)\b/,
    /\b(hai|hain|ho|hu|hoon|tha|the|thi)\b/,
    /\b(kya|kaise|kaun|kab|kahan|kaha|kyun|kyon)\b/,
    /\b(karna|karein|kare|kijiye|chahiye|hoga|hogi|hote|hota|karo)\b/,
    /\b(nivesh|bachat|sampatti|paisa|paise|rupaye|dhan)\b/,
    /\b(mera|meri|mere|humara|humari|humare)\b/,
    /\b(mujhe|humein|unko|inhe|usko|maine)\b/,
    /\b(baat|sampark|karo|batao|bataiye|bataye|samjhao|samjhaiye)\b/,
    /\b(parivar|khandan|wasiyat)\b/,
    /\b(ke\s+baare\s+me|ke\s+bare\s+me|ke\s+baare\s+mein|ke\s+bare\s+mein)\b/,
  ];

  let matchCount = 0;
  for (const regex of hinglishTokens) {
    if (regex.test(lower)) {
      matchCount++;
      if (matchCount >= 1) {
        return "hinglish";
      }
    }
  }

  // Single strong hinglish keyword check
  if (/\b(kripya|dhanyawaad|dhanyavad|namaste|namaskar|shukriya|pranam)\b/.test(lower)) {
    return "hinglish";
  }

  return "en";
}

export interface ExtractedLeadData {
  fullName?: string;
  phone?: string;
  email?: string;
  financialObjective?: string;
  wantsCallback?: boolean;
}

/**
 * Extracts potential contact details or financial objectives from conversational text.
 */
export function extractLeadIntent(text: string): ExtractedLeadData {
  const result: ExtractedLeadData = {};
  if (!text) return result;

  const lower = text.toLowerCase();

  // Callback intent check
  if (
    lower.includes("callback") ||
    lower.includes("call me") ||
    lower.includes("call back") ||
    lower.includes("speak with") ||
    lower.includes("talk to") ||
    lower.includes("phone par baat") ||
    lower.includes("sampark karein") ||
    lower.includes("consultation chahiye")
  ) {
    result.wantsCallback = true;
  }

  // Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].trim().toLowerCase();
  }

  // Extract Indian / International Phone Number
  const phoneMatch = text.match(/(?:\+91[\s-]?)?[6789]\d{9}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0].trim();
  }

  // Extract Name (e.g. "my name is Anand Singhania" or "I am Anand")
  const nameMatch = text.match(/(?:my name is|i am|this is|naam hai)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && nameMatch[1]) {
    const rawName = nameMatch[1].trim();
    if (!["vantage", "wealth", "assistant", "client"].includes(rawName.toLowerCase())) {
      result.fullName = rawName;
    }
  }

  // Extract objective keywords
  if (lower.includes("retirement") || lower.includes("pension")) {
    result.financialObjective = "Retirement Planning";
  } else if (lower.includes("succession") || lower.includes("estate") || lower.includes("trust") || lower.includes("will")) {
    result.financialObjective = "Estate & Succession Planning";
  } else if (lower.includes("portfolio") || lower.includes("pms") || lower.includes("investment")) {
    result.financialObjective = "Discretionary Portfolio Management";
  } else if (lower.includes("family office") || lower.includes("governance")) {
    result.financialObjective = "Family Office Governance";
  } else if (lower.includes("tax") || lower.includes("tax saving")) {
    result.financialObjective = "Tax Advisory";
  }

  return result;
}

/**
 * Detects whether the user's message is a simple salutation or polite greeting.
 */
export function isPureGreeting(text: string): boolean {
  if (!text) return false;

  const clean = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

  const greetingExactPatterns = [
    "hi",
    "hii",
    "hiii",
    "hello",
    "helloo",
    "hey",
    "heyy",
    "heya",
    "hi there",
    "hello there",
    "hey there",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "good day",
    "namaste",
    "namaskar",
    "namaste ji",
    "namaskar ji",
    "hi vantage",
    "hello vantage",
    "hey vantage",
    "vantage assistant",
    "hi how are you",
    "hello how are you",
    "how are you",
  ];

  if (greetingExactPatterns.includes(clean)) {
    return true;
  }

  const greetingRegex = /^(?:hi|hello|hey|greetings|namaste|namaskar)(?:\s+(?:there|vantage|assistant|team|sir|maam|madam|ji))?$/i;
  return greetingRegex.test(clean);
}

/**
 * Returns the polite, concise greeting response requested for Vantage Wealth.
 */
export function getGreetingResponse(language: DetectedLanguage = "en"): string {
  if (language === "hi") {
    return "नमस्ते! मैं सौम्या हूँ, वैनटेज वेल्थ में आपकी एआई वेल्थ रिलेशनशिप असिस्टेंट।\n\nआज मैं आपके वित्तीय लक्ष्यों या निवेश से जुड़े सवालों में कैसे मदद कर सकती हूँ?";
  }
  if (language === "hinglish") {
    return "Hello! Main Soumya hoon, Vantage Wealth se aapki AI Wealth Relationship Assistant.\n\nAaj main aapke financial goals ya investment planning me kaise help kar sakti hoon?";
  }
  return "Hello! I'm Soumya, your AI Wealth Relationship Assistant at Vantage Wealth.\n\nHow may I help you with your financial goals or questions today?";
}
