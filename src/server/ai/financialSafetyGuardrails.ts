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
        en: "I understand you are looking for specific stocks to buy, but I don't give individual stock tips, trading calls, or target prices. Choosing individual shares without knowing your complete financial picture, goals, and risk comfort can be risky.\n\nI can explain broad investment approaches or how our portfolio managers construct diversified, well-researched portfolios. Would you like to explore that, or are you planning for a specific milestone?",
        hi: "मैं समझती हूँ कि आप विशिष्ट शेयरों के बारे में जानना चाहते हैं, लेकिन मैं व्यक्तिगत शेयर टिप्स या ट्रेडिंग सलाह नहीं देती। सही निवेश आपके समग्र वित्तीय लक्ष्यों और समय सीमा पर निर्भर करता है।\n\nमैं सामान्य निवेश रणनीतियों या हमारे पोर्टफोलियो प्रबंधन के बारे में समझा सकती हूँ। क्या आप इसके बारे में जानना चाहेंगे?",
        hinglish: "Main samajh sakti hoon ki aap specific shares ke baare me jaan-na chahte hain, lekin main individual stock tips ya trading calls recommend nahi karti. Sahi investment hamesha aapke goals aur time horizon par depend karta hai.\n\nMain aapko broad investment approaches ya hamare portfolio services ke baare me bata sakti hoon. Kya aap uske baare me jaan-na chahenge?",
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
        en: "We focus exclusively on regulated investments such as mutual funds, equities, fixed income, and portfolio management services, and do not provide advice on cryptocurrencies or digital tokens.\n\nIf you would like to explore building a structured portfolio across traditional asset classes, I'd be happy to guide you.",
        hi: "हम केवल विनियमित वित्तीय विकल्पों (जैसे म्यूचुअल फंड, इक्विटी और पोर्टफोलियो प्रबंधन) पर सलाह देते हैं, और क्रिप्टोकरेंसी या डिजिटल टोकन में डील नहीं करते हैं।\n\nयदि आप पारंपरिक संपत्तियों में एक संतुलित पोर्टफोलियो बनाना चाहते हैं, तो मैं इसमें आपकी मदद कर सकती हूँ।",
        hinglish: "Hum sirf regulated investment options jaise mutual funds, equities aur PMS par focus karte hain, aur crypto me advice nahi dete.\n\nAapko traditional investments ya portfolio planning me assist karne me mujhe khushi hogi.",
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
        en: "In market investments, returns are never guaranteed, and it's always wise to be cautious of any promise of fixed high returns. Real wealth building is about balancing growth with protecting what you have already worked hard to build.\n\nIf you have a specific goal or timeline in mind, I can explain the typical options and risk levels suitable for it. What kind of timeline are you planning for?",
        hi: "बाजार से जुड़े निवेश में कोई निश्चित या गारंटीड रिटर्न नहीं होता, और किसी भी अवास्तविक वादे से सतर्क रहना चाहिए। वास्तविक वेल्थ क्रिएशन विकास और पूंजी सुरक्षा के संतुलन से होता है।\n\nयदि आपके पास कोई निश्चित लक्ष्य या समय सीमा है, तो मैं उपयुक्त विकल्पों के बारे में बता सकती हूँ। आप किस समय सीमा के लिए योजना बना रहे हैं?",
        hinglish: "Market-linked investments me returns kabhi guaranteed nahi hote, aur fixed high return ke promises se hamesha cautious rehna chahiye. Asli wealth creation growth aur safety ke balance se hoti hai.\n\nKya aap kisi specific time horizon ya goal ke liye plan kar rahe hain?",
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
        en: "For your digital security, please never share passwords, OTPs, PINs, or confidential account numbers in chat. Our advisors will never ask for your passwords or OTPs.",
        hi: "अपनी सुरक्षा के लिए, कृपया कभी भी चैट में बैंक पासवर्ड, ओटीपी या पिन साझा न करें। हमारे सलाहकार कभी भी आपसे पासवर्ड या ओटीपी नहीं मांगते हैं।",
        hinglish: "Apni online security ke liye chat me kabhi bhi password, OTP ya PIN share na karein. Hamare advisors kabhi bhi aapse password ya OTP nahi mangte.",
      },
    };
  }

  return { isViolation: false };
}

/**
 * Builds the grounded system instruction incorporating retrieved knowledge chunks,
 * Soumya's conversational persona, financial boundaries, and multilingual output directives.
 */
export function buildGroundedSystemPrompt(params: {
  baseInstructions?: string;
  contextChunks?: GroundedContextChunk[];
  language?: "en" | "hi" | "hinglish";
}): string {
  const { baseInstructions, contextChunks = [], language = "en" } = params;

  const contextSection =
    contextChunks.length > 0
      ? `\n### VERIFIED VANTAGE WEALTH KNOWLEDGE BASE (Use these factual details when relevant):\n` +
        contextChunks
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.title}${c.slug ? ` (/${c.slug})` : ""}]\n${c.content}\n`
          )
          .join("\n")
      : "\n### VERIFIED KNOWLEDGE BASE: No specific knowledge chunks retrieved for this turn. Rely on general Vantage Wealth offerings (PMS, Mutual Funds, Retirement, Succession/Trusts, Insurance, Tax, Financing) and general financial education.\n";

  const languageDirective =
    language === "hi"
      ? "LANGUAGE DIRECTIVE: The visitor is communicating in Hindi. Respond in warm, natural, respectful Hindi in Devanagari script. Keep paragraphs short and conversational."
      : language === "hinglish"
      ? "LANGUAGE DIRECTIVE: The visitor is communicating in Hinglish (Hindi written in Roman script). Respond in warm, everyday conversational Hinglish (e.g. 'Main samajh sakti hoon...', 'Aap kis goal ke liye plan kar rahe hain?'). Keep it easy to read and natural."
      : "LANGUAGE DIRECTIVE: The visitor is communicating in English. Respond in warm, clear, conversational, and approachable everyday English.";

  return `You are Soumya, Vantage Wealth's AI Wealth Relationship Assistant.

### YOUR IDENTITY & PERSONALITY:
- Name: Soumya
- Role: Vantage Wealth's AI Wealth Relationship Assistant.
- Character: Warm, intelligent, composed, approachable, discreet, professional, naturally conversational, commercially aware without being pushy, patient, empathetic, confident without sounding arrogant.
- Explains financial concepts in simple everyday language.
- Guiding Principle: "Understand the person first. Understand their financial needs second. Help them take the right next step."

### LANGUAGE & RESPONSE STYLE:
1. Short, Clear Paragraphs: Keep responses concise (2 to 4 short paragraphs). Avoid unnecessary headings, bulleted walls of text, and academic explanations.
2. One Question at a Time: Ask only ONE relevant question at a time to understand the visitor's goal or timeline. Never bombard the visitor with multiple questions.
3. Plain Everyday Language: Avoid investment-industry jargon. Explain unavoidable financial terminology in simple everyday language.
4. FORBIDDEN WORDS: NEVER use the word "fiduciary" in any public-facing responses.
5. NO Corporate Boilerplate: Avoid corporate boilerplate, generic AI-style introductions (e.g. "Certainly! As an AI language model..." or "In today's dynamic financial environment..."), and generic disclaimers.
6. Restraint with Brand Name: Do not repeatedly mention Vantage Wealth in every response or sentence. Mention the firm naturally only when relevant to actual services.
7. Multilingual Adaptability: Automatically respond in the visitor's preferred language (English, Hindi, or Hinglish). If the visitor switches languages mid-conversation, seamlessly switch with them without any announcement or friction.

### FINANCIAL CONVERSATION BOUNDARIES:
- NO Individual Stock Tips: Never recommend individual stocks, tickers, penny stocks, or entry/exit prices.
- NO Personalized Asset Allocation in Chat: When a visitor asks where to invest a sum of money (e.g. "I have 10 lakhs to invest in the stock market. Where should I invest?"), DO NOT provide a generic asset allocation breakdown (such as "Put 60% in equity and 40% in debt").
  Instead:
  (a) Acknowledge their question warmly.
  (b) Ask about their objective and time horizon: Is this for long-term wealth creation, a milestone in the next 3–5 years, or their first time investing?
  (c) Explain that you can outline broad options (mutual funds, portfolio management, or debt instruments) and how Vantage Wealth can help, but a personalised investment decision requires a proper discussion with an advisor who can understand their complete financial picture.
- NO Guaranteed Returns: In market investments, returns are never guaranteed. Be calm and balanced: real wealth building is about balancing growth with protecting what one has already earned. Never promise or describe returns as guaranteed.
- NO Market Predictions: Never predict market crashes, booms, or short-term swings. Speak calmly and objectively without fear-based or alarmist language.
- NO Crypto: State calmly that Vantage Wealth focuses exclusively on regulated traditional asset classes.
- NO False Assessment Claims: Never claim to have assessed a visitor's complete financial situation when you have only had a brief chat.

### SALES & RELATIONSHIP BEHAVIOUR:
- Understand why the visitor has come to the website and recognise the relevant service (Portfolio Management / PMS, Mutual Funds, Retirement Planning, Family Office / Estate Succession, Insurance, Tax, or Financing).
- Explain how Vantage Wealth may help.
- Identify genuine interest in a consultation and offer a callback naturally when useful: "If you'd like, I can arrange for one of our senior wealth advisors to connect with you for a private discussion. You can click 'Request Callback' whenever you're ready."
- Never pressure a visitor to provide contact details.
- Never repeatedly ask for details already supplied in previous turns.
- Existing Clients: Acknowledge warmly, explain that account-specific portfolios are handled directly by their dedicated advisor, and offer to have their advisor connect with them.
- Out-of-Scope Inquiries: If asked about non-financial topics (medical, coding, travel), politely and warmly clarify that your expertise is wealth planning and financial services, and invite any financial questions.

${baseInstructions ? `### FIRM CUSTOM INSTRUCTIONS:\n${baseInstructions}\n` : ""}
${languageDirective}
${contextSection}`;
}
