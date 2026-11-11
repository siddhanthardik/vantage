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
    /\b(aap|aapka|aapki|aapke)\b/,
    /\b(hai|hain|ho|hu|hoon)\b/,
    /\b(kya|kaise|kaun|kab|kaha|kyun)\b/,
    /\b(karna|karein|kijiye|chahiye|hoga|hogi)\b/,
    /\b(nivesh|bachat|sampatti|paisa|paise|dhan)\b/,
    /\b(mera|meri|mere|humara|humari|humare)\b/,
    /\b(mujhe|humein|unko|inhe)\b/,
    /\b(baat|sampark|call|karo|batao|samjhao)\b/,
    /\b(parivar|khandan|wasiyat)\b/,
  ];

  let matchCount = 0;
  for (const regex of hinglishTokens) {
    if (regex.test(lower)) {
      matchCount++;
      if (matchCount >= 2) {
        return "hinglish";
      }
    }
  }

  // Single strong hinglish keyword check
  if (/\b(kripya|dhanyawaad|namaste|shukriya|namaskar)\b/.test(lower)) {
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
    return "वैनटेज वेल्थ में आपका स्वागत है।\n\nआज मैं आपकी वेल्थ एडवाइजरी या पोर्टफोलियो योजना में किस प्रकार सहायता कर सकता हूँ?";
  }
  if (language === "hinglish") {
    return "Welcome to Vantage Wealth.\n\nAaj main aapki wealth advisory ya portfolio considerations me kaise assist kar sakta hoon?";
  }
  return "Welcome to Vantage Wealth.\n\nHow may I assist you with your wealth advisory or portfolio considerations today?";
}
