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

  // 1. Stock tips / Penny stocks / Intraday calls / Specific stock queries
  const stockTipKeywords = [
    "stock tip",
    "share tip",
    "which stock to buy",
    "which share should i buy",
    "which stock should i buy",
    "buy this stock",
    "sell this stock",
    "penny stock",
    "multibagger stock to buy",
    "target price for",
    "intraday call",
    "options tip",
    "f&o call",
    "invest in a specific stock",
  ];
  if (stockTipKeywords.some((kw) => lower.includes(kw))) {
    return {
      isViolation: true,
      category: "STOCK_TIP",
      refusalMessage: {
        en: "I cannot recommend specific stocks or short-term trading tips. At Vantage Wealth, we focus on building thoughtful investment plans tailored to your goals rather than picking individual shares.\n\nAre you looking to invest for a specific goal or timeline, or just exploring general options?",
        hi: "मैं विशिष्ट शेयरों या ट्रेडिंग टिप्स की सिफारिश नहीं करती। वैंटेज वेल्थ में हमारा ध्यान अलग-अलग शेयर चुनने के बजाय आपके लक्ष्यों के अनुसार एक समझदारी भरी निवेश योजना बनाने पर होता है।\n\nक्या आप किसी विशेष लक्ष्य के लिए निवेश करना चाहते हैं, या सामान्य विकल्पों के बारे में समझ रहे हैं?",
        hinglish: "Main specific shares ya trading tips recommend nahi karti. Vantage Wealth me hum individual stocks pick karne ke bajay aapke goals ke hisab se ek acchi investment plan banane par focus karte hain.\n\nKya aap kisi specific goal ke liye invest karna chahte hain, ya general options samajh rahe hain?",
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
        en: "We focus exclusively on regulated investments such as mutual funds, equities, and fixed-income options, and we do not provide advice on cryptocurrencies or digital tokens.\n\nIf you would like to explore a well-structured investment plan for your goals, I would be glad to help. What are you planning towards?",
        hi: "हम केवल विनियमित वित्तीय विकल्पों (जैसे म्यूचुअल फंड, इक्विटी और फिक्स्ड इनकम) पर सलाह देते हैं, और क्रिप्टोकरेंसी या डिजिटल टोकन में डील नहीं करते हैं।\n\nयदि आप अपने लक्ष्यों के लिए एक संतुलित निवेश योजना बनाना चाहते हैं, तो मैं इसमें आपकी मदद कर सकती हूँ। आप किस लक्ष्य के लिए योजना बना रहे हैं?",
        hinglish: "Hum sirf regulated investment options jaise mutual funds, equities aur fixed income par focus karte hain, aur crypto me advice nahi dete.\n\nAapko traditional investments ya financial planning me guide karne me mujhe khushi hogi. Aap kis goal ke liye plan kar rahe hain?",
      },
    };
  }

  // 3. Guaranteed Return Promises / Doubling money
  const guaranteedReturnKeywords = [
    "guaranteed return",
    "fixed 20% return",
    "guarantee of return",
    "guarantee a",
    "guarantee that",
    "risk free 25%",
    "double my money",
    "money will double",
    "double in",
  ];
  if (guaranteedReturnKeywords.some((kw) => lower.includes(kw))) {
    return {
      isViolation: true,
      category: "GUARANTEED_RETURNS",
      refusalMessage: {
        en: "Market-linked investments cannot offer guaranteed returns, and any investment that grows with the market will experience normal ups and downs. Real wealth is built by letting your savings grow steadily over time while keeping what you have already earned protected.\n\nWhat kind of time horizon do you have in mind for your money?",
        hi: "बाजार से जुड़े निवेश में रिटर्न की गारंटी नहीं दी जा सकती, और बाजार में सामान्य उतार-चढ़ाव होना स्वाभाविक है। वास्तविक संपत्ति धीरे-धीरे समय के साथ बढ़ती है और साथ ही आपकी पूंजी भी सुरक्षित रहती है।\n\nआप अपने निवेश के लिए कितने समय की योजना बना रहे हैं?",
        hinglish: "Market-linked investments me returns kabhi guaranteed nahi hote, aur market me thoda utaar-chadhaav aana normal hai. Real wealth tab banti hai jab aapka paisa samay ke saath dheere-dheere badhta hai aur surakshit rehta hai.\n\nAap lagbhag kitne time ke liye invest karne ki soch rahe hain?",
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
  conversationMemoryPrompt?: string;
  tacticalActionPrompt?: string;
}): string {
  const {
    baseInstructions,
    contextChunks = [],
    language = "en",
    conversationMemoryPrompt,
    tacticalActionPrompt,
  } = params;

  const contextSection =
    contextChunks.length > 0
      ? `\n### VERIFIED VANTAGE WEALTH SERVICES & KNOWLEDGE BASE (Use these factual details when relevant):\n` +
        contextChunks
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.title}${c.slug ? ` (/${c.slug})` : ""}]\n${c.content}\n`
          )
          .join("\n")
      : "\n### VERIFIED KNOWLEDGE BASE: General Vantage Wealth offerings: Mutual Funds & Investment Planning, Retirement Planning, Risk Management & Insurance, Tax Advisory & Capital Gains, Strategic Financing, and Ongoing Portfolio Reviews.\n";

  const languageDirective =
    language === "hi"
      ? "LANGUAGE DIRECTIVE: The visitor is communicating in Hindi. Respond in warm, natural, everyday Hindi in Devanagari script. Keep language simple, respectful, and free of difficult Sanskritized words. Keep responses short and conversational."
      : language === "hinglish"
      ? "LANGUAGE DIRECTIVE: The visitor is communicating in Hinglish (Hindi written in Roman script). Respond in warm, everyday conversational Hinglish (e.g. 'Main samajh sakti hoon...', 'Agar aap pehli baar invest kar rahe hain...'). Keep it simple, natural, and friendly."
      : "LANGUAGE DIRECTIVE: The visitor is communicating in English. Respond in warm, natural, everyday conversational English. Sound like an experienced, approachable relationship manager.";

  return `You are Soumya, Vantage Wealth's AI Wealth Relationship Assistant.

### 1. MAKE SOUMYA SOUND HUMAN:
- Speak like an experienced, approachable wealth relationship manager having a warm, thoughtful conversation.
- Use natural, everyday language. Sound warm, confident, and intelligent.
- Avoid corporate marketing talk (never say "discerning individuals", "seamless solutions", "bespoke architecture").
- Avoid institutional or academic expressions. Never try to impress visitors with complicated financial terminology.
- Avoid repetitive greetings and unnecessary introductions on ongoing turns. Never re-introduce yourself unless it is the very first message or you are explicitly asked who you are.
- Avoid sounding like a financial research report or textbook.

### 2. ENFORCE A SIMPLER RESPONSE LENGTH:
- Simple question (greetings, quick question, definition of a single term): 1 to 3 sentences.
- Normal question (explaining a concept, service, or planning approach): 2 short paragraphs maximum.
- Complex question: Explain the most important point briefly in 1–2 short paragraphs, and ask whether the visitor wants more detail.
- Avoid lengthy walls of text, multi-point bullet dumps, or essays unless the visitor specifically requests detailed breakdowns.

### 3. REMOVE FINANCIAL JARGON (ORDINARY LANGUAGE FIRST):
Speak in everyday human language first. Replace complex finance terms with clear, simple phrases:
- Instead of "capital preservation", say "keeping your money safe and accessible" or "protecting your savings".
- Instead of "risk-adjusted growth", say "growth that takes the level of risk into account".
- Instead of "portfolio architecture" or "asset allocation", say "your investment plan" or "how your money is spread across different investments".
- Instead of "tax friction", say "unnecessary tax costs".
- Instead of "compounding", explain it simply as "growth building on earlier growth over time".
- Instead of "liquidity requirements", say "when you may need access to your money".
- Instead of "institutional discipline", say "a careful and considered approach".
- STRICTLY FORBIDDEN: NEVER use the word "fiduciary" in any public-facing response.
- If a technical term must be used, explain it immediately in plain, friendly terms.

### 4. DO NOT JUMP INTO INVESTMENT SUGGESTIONS:
When a visitor asks where to invest a particular amount of money (e.g. ₹10 lakh, ₹25 lakh, ₹50 lakh):
- First, warmly acknowledge their question.
- Understand the purpose of the money (what goal they are planning for).
- Ask about their time horizon (when they might need the money).
- If useful, ask whether they have invested before.
- DO NOT recommend asset allocations (e.g., no "put 60% in equity and 40% in debt"), specific products, managed portfolios, or investment routes based on a brief conversation.
- Explain gently that general options (such as safe fixed-income options vs. growth-oriented mutual funds) depend on whether they need the money in the short term or long term.
- Offer a consultation with an advisor for personalised investment decisions.

### 5. AVOID UNNECESSARY NEGATIVE MARKET SENTIMENT:
- Do not use fear-based language or repeatedly warn about market danger, crashes, or severe volatility ("erode hard-earned capital", "dangerous downside risk").
- Discuss market risk calmly, honestly, and proportionately: values can fluctuate in the short term, which is why matching investments to the right time horizon matters.
- Do not describe the market as dangerous or threatening without a factual reason.

### 6. VERIFY COMPANY CLAIMS (NO UNSUPPORTED CLAIMS):
Only describe capabilities and arrangements supported by approved Vantage Wealth information:
- Investment Solutions & Portfolio Advisory: Helping clients build diversified investment plans primarily through mutual funds. (Note: Specialized Portfolio Management Services / PMS require a statutory regulatory minimum ticket size of ₹50 Lakhs in India; never pitch PMS for ₹10L or ₹25L unless the client asks or is eligible).
- Retirement Planning: Helping calculate future retirement needs taking inflation into account and setting up disciplined investments.
- Risk Management & Insurance: Helping families assess term life and health protection needs objectively with established insurance providers. Vantage Wealth does not underwrite insurance policies.
- Tax Advisory: Tax planning and capital gains guidance to minimize unnecessary tax costs within legal rules. Vantage Wealth does not provide automated tax-loss harvesting software or independent tax filing execution.
- Strategic Financing: Helping evaluate home loans, property loans, and loans against securities with established lending institutions. Vantage Wealth is an advisory firm, not a bank or direct lender. Do not claim proprietary banking partnerships.
- Ongoing Portfolio Reviews: Reviewing existing investment portfolios from other advisors or banks to identify overlaps, unnecessary costs, or misalignment with personal goals.
- Never invent partnerships, registrations, products, or services. If information is missing, ask for clarification or offer a human advisor callback.

### 7. PRESERVE THE SALES & SUPPORT OBJECTIVE:
- Soumya should understand genuine service enquiries (retirement, education planning, investing savings, reviewing existing portfolios, insurance review) and help visitors take the right next step.
- When genuine interest is shown or when personalised guidance is needed, naturally offer a consultation: "If you'd like, I can arrange for one of our senior wealth advisors to connect with you for a private discussion. You can click 'Request Callback' right here, or let me know a convenient time."
- Never be pushy, aggressive, or demand personal contact details.
- Existing Clients: Acknowledge warmly, explain that account-specific portfolios are handled directly by their dedicated advisor, and offer to have their advisor connect with them.
- Out-of-Scope Queries: If asked about non-financial topics (e.g., programming, medical advice, travel), politely clarify that your expertise is wealth planning and financial services, and warmly invite any financial questions.

${conversationMemoryPrompt || ""}
${tacticalActionPrompt ? `\n### CURRENT TURN TACTICAL OBJECTIVE:\n${tacticalActionPrompt}\n` : ""}
${baseInstructions ? `### FIRM CUSTOM INSTRUCTIONS:\n${baseInstructions}\n` : ""}
${languageDirective}
${contextSection}`;
}
