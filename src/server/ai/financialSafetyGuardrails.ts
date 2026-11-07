import { GroundedContextChunk } from "./types";

/**
 * Regex patterns for Indian and international PII and sensitive credentials
 */
const PATTERNS = {
  // Email address
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  // Indian phone numbers (+91, 0, or 10-digit mobile)
  phone: /(?:\+91[\s-]?)?[6789]\d{9}|\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b/g,
  // Indian PAN card (5 letters, 4 numbers, 1 letter)
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi,
  // Indian Aadhaar card (12 digits with or without spaces/hyphens)
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // Credit / Debit card (13 to 19 digits)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
  // Bank IFSC code (4 letters, 0, 6 alphanumeric)
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi,
  // Sensitive account inquiry words (passwords, OTPs, PINs)
  credentials: /\b(?:otp|password|pin|cvv|secret\s*key|bank\s*password|login\s*password)\s*[:=]\s*\S+/gi,
};

/**
 * Sanitizes input text by redacting PII and sensitive identifiers before dispatch to LLM providers.
 * Enforces DPDP Act 2023 compliance and strict visitor privacy.
 */
export function sanitizePromptForPrivacy(text: string): { sanitized: string; redactedTypes: string[] } {
  if (!text) return { sanitized: "", redactedTypes: [] };

  const redactedTypes: string[] = [];
  let sanitized = text;

  if (PATTERNS.email.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.email, "[EMAIL_PROTECTED]");
    redactedTypes.push("EMAIL");
  }

  if (PATTERNS.phone.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.phone, "[PHONE_PROTECTED]");
    redactedTypes.push("PHONE");
  }

  if (PATTERNS.pan.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.pan, "[PAN_REDACTED]");
    redactedTypes.push("PAN");
  }

  if (PATTERNS.aadhaar.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.aadhaar, "[AADHAAR_REDACTED]");
    redactedTypes.push("AADHAAR");
  }

  if (PATTERNS.creditCard.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.creditCard, "[CARD_REDACTED]");
    redactedTypes.push("CARD");
  }

  if (PATTERNS.ifsc.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.ifsc, "[IFSC_REDACTED]");
    redactedTypes.push("IFSC");
  }

  if (PATTERNS.credentials.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.credentials, "[CREDENTIALS_REDACTED]");
    redactedTypes.push("CREDENTIALS");
  }

  return { sanitized, redactedTypes };
}

/**
 * Pre-generation check for speculative financial queries that violate SEBI regulations
 * or firm fiduciary safety policies.
 */
export function checkFinancialSafetyViolation(query: string): {
  isViolation: boolean;
  category?: "STOCK_TIP" | "CRYPTO" | "GUARANTEED_RETURNS" | "CREDENTIAL_HARVESTING";
  refusalMessage?: { en: string; hi: string; hinglish: string };
} {
  const lower = query.toLowerCase();

  // 1. Stock tips / Penny stocks / Intraday calls
  const stockTipKeywords = [
    "stock tip",
    "share tip",
    "which stock to buy",
    "which share should i buy",
    "buy this stock",
    "sell this stock",
    "penny stock",
    "multibagger stock to buy",
    "target price for",
    "intraday call",
    "options tip",
    "f&o call",
  ];
  if (stockTipKeywords.some((kw) => lower.includes(kw))) {
    return {
      isViolation: true,
      category: "STOCK_TIP",
      refusalMessage: {
        en: "As a SEBI-registered fiduciary wealth management firm, Vantage Wealth does not offer individual stock tips, intraday speculative advice, or target prices. We provide comprehensive, long-term discretionary portfolio management (PMS), multi-asset allocation, and family succession advisory. Would you like to know more about our Discretionary Portfolio Management Services?",
        hi: "वैनटेज वेल्थ एक विनियमित वेल्थ मैनेजमेंट फर्म है। हम व्यक्तिगत शेयर टिप्स, इंट्राडे ट्रेडिंग या सट्टा सलाह प्रदान नहीं करते हैं। हम लंबी अवधि के पोर्टफोलियो प्रबंधन (PMS) और पारिवारिक संपत्ति संरक्षण पर ध्यान केंद्रित करते हैं। क्या आप हमारी पोर्टफोलियो प्रबंधन सेवाओं के बारे में जानना चाहते हैं?",
        hinglish: "Vantage Wealth SEBI-compliant wealth management firm hai. Hum individual stock tips ya intraday trading advice provide nahi karte. Hum long-term portfolio management (PMS) aur estate planning par focus karte hain. Kya aap hamari Portfolio Management Services ke baare me jaan-na chahenge?",
      },
    };
  }

  // 2. Cryptocurrencies / Unregulated digital tokens
  const cryptoKeywords = [
    "bitcoin",
    "crypto",
    "ethereum",
    "dogecoin",
    "nft investment",
    "crypto trading bot",
    "binance",
  ];
  if (cryptoKeywords.some((kw) => lower.includes(kw))) {
    return {
      isViolation: true,
      category: "CRYPTO",
      refusalMessage: {
        en: "Vantage Wealth exclusively advises on regulated financial assets in accordance with Reserve Bank of India (RBI) and SEBI guidelines. We do not provide cryptocurrency trading, token management, or virtual digital asset advisory.",
        hi: "वैनटेज वेल्थ केवल भारतीय रिज़र्व बैंक (RBI) और सेबी (SEBI) के दिशानिर्देशों के तहत विनियमित वित्तीय संपत्तियों में सलाह देता है। हम क्रिप्टोकरेंसी या अनियंत्रित डिजिटल टोकन में निवेश की सलाह नहीं देते हैं।",
        hinglish: "Vantage Wealth sirf RBI aur SEBI ke rules ke mutabiq regulated financial assets me deal karta hai. Hum crypto trading ya digital tokens me advisory provide nahi karte hain.",
      },
    };
  }

  // 3. Guaranteed Return Promises
  const guaranteedReturnKeywords = [
    "guaranteed return",
    "fixed 20% return",
    "guarantee of return",
    "risk free 25%",
    "double my money in",
  ];
  if (guaranteedReturnKeywords.some((kw) => lower.includes(kw))) {
    return {
      isViolation: true,
      category: "GUARANTEED_RETURNS",
      refusalMessage: {
        en: "All market-linked financial investments carry inherent market risks. In compliance with regulatory standards, Vantage Wealth does not guarantee fixed returns or capital doubling. Our investment mandates prioritize risk-adjusted capital preservation and structured wealth compounding.",
        hi: "बाजार से जुड़े सभी निवेशों में जोखिम शामिल होता है। विनियामक मानकों के अनुसार, वैनटेज वेल्थ किसी भी निश्चित रिटर्न या गारंटी का वादा नहीं करता है। हमारा मुख्य उद्देश्य पूंजी की सुरक्षा और संतुलित वृद्धि है।",
        hinglish: "Market linked investments me market risk shamil hota hai. Regulations ke mutabiq Vantage Wealth kisi fixed return ka promise nahi karta. Hamara focus capital preservation aur risk-adjusted returns par rehta hai.",
      },
    };
  }

  // 4. Sensitive Credential Ingestion Prevention
  const credentialKeywords = [
    "here is my password",
    "my otp is",
    "my pin is",
    "my netbanking login",
  ];
  if (credentialKeywords.some((kw) => lower.includes(kw))) {
    return {
      isViolation: true,
      category: "CREDENTIAL_HARVESTING",
      refusalMessage: {
        en: "For your digital security, never share your banking passwords, OTPs, PINs, or credentials in chat. Vantage Wealth advisors will NEVER ask you for your account passwords or OTPs.",
        hi: "अपनी सुरक्षा के लिए, कभी भी चैट में बैंक पासवर्ड, ओटीपी या पिन साझा न करें। वैनटेज वेल्थ कभी भी आपके पासवर्ड या ओटीपी की मांग नहीं करता है।",
        hinglish: "Apni online security ke liye chat me kabhi bhi password, OTP ya PIN share na karein. Vantage Wealth ke advisors kabhi bhi aapse password ya OTP nahi mangte.",
      },
    };
  }

  return { isViolation: false };
}

/**
 * Builds the grounded system instruction incorporating retrieved knowledge chunks,
 * brand guidelines, and multilingual output directives.
 */
export function buildGroundedSystemPrompt(params: {
  baseInstructions?: string;
  contextChunks?: GroundedContextChunk[];
  language?: "en" | "hi" | "hinglish";
}): string {
  const { baseInstructions, contextChunks = [], language = "en" } = params;

  const contextSection =
    contextChunks.length > 0
      ? `\n### GROUNDED KNOWLEDGE BASE (Use ONLY verified firm facts from these chunks):\n` +
        contextChunks
          .map(
            (c, i) =>
              `[Chunk ${i + 1} | Source: ${c.sourceType} | Title: "${c.title}"${c.slug ? ` | Slug: /${c.slug}` : ""}]\n${c.content}\n`
          )
          .join("\n")
      : "\n### GROUNDED KNOWLEDGE BASE: No specific database chunk found for this turn. Rely strictly on general firm capabilities and refuse unverified claims.\n";

  const languageDirective =
    language === "hi"
      ? "LANGUAGE DIRECTIVE: The visitor is communicating in Hindi. Respond in fluent, polite, grammatically correct Hindi (Devanagari script), maintaining a respectful private wealth advisory tone."
      : language === "hinglish"
      ? "LANGUAGE DIRECTIVE: The visitor is communicating in Hinglish (Hindi written in Latin script). Respond in natural, polished Hinglish with accurate financial terms and a dignified tone."
      : "LANGUAGE DIRECTIVE: Respond in sophisticated, clear, professional English suitable for ultra-high-net-worth individuals and family offices.";

  return `${baseInstructions || "You are the official digital concierge for Vantage Wealth, an elite private wealth management advisory firm in India."}

${languageDirective}

### FIDUCIARY BOUNDARIES & CONDUCT RULES:
1. Grounding: Answer questions using the verified knowledge base chunks below. Do not fabricate partners, awards, minimums, or performance numbers not explicitly in the context.
2. No Speculation: Strictly refuse requests for individual stock tips, penny stocks, or day-trading recommendations.
3. No Crypto: State that Vantage Wealth advises exclusively on regulated RBI/SEBI asset classes.
4. Privacy: NEVER ask visitors for PAN, Aadhaar, bank account numbers, passwords, or OTPs.
5. Progressive Engagement: Do not aggressively demand personal contact details. Only suggest a confidential discussion when the visitor asks for personalized portfolio planning or human follow-up.
6. Tone: Fiduciary, understated luxury, discreet, and patient (matching the Vantage Wealth brand voice).
${contextSection}`;
}
