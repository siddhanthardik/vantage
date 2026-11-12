/**
 * VANTAGE WEALTH — SOUMYA CONVERSATION INTELLIGENCE
 * Intent Classification System (Part 2)
 */

export type PrimaryIntent =
  | "INVESTMENT_PLANNING"
  | "MUTUAL_FUND_ENQUIRY"
  | "RETIREMENT_PLANNING"
  | "INSURANCE_ENQUIRY"
  | "TAX_ADVISORY"
  | "PROPERTY_AND_FINANCING"
  | "PORTFOLIO_REVIEW"
  | "FAMILY_WEALTH_PLANNING"
  | "GENERAL_SERVICE_ENQUIRY"
  | "EXISTING_CLIENT_SUPPORT"
  | "CALLBACK_REQUEST"
  | "COMPLAINT_OR_ISSUE"
  | "GENERAL_INFORMATION"
  | "OUT_OF_SCOPE";

export type InquirerMode = "INFORMATION" | "EXPLORING_SERVICE" | "REQUESTING_HUMAN";
export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH";

export interface IntentClassificationResult {
  primaryIntent: PrimaryIntent;
  secondaryIntent?: PrimaryIntent;
  urgency: UrgencyLevel;
  inquirerMode: InquirerMode;
  confidence: number;
  extractedKeywords: string[];
}

/**
 * Normalizes text for intent matching across English, Hindi, and Hinglish
 */
function cleanText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\p{N}\s₹$]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic intent rule patterns with multilingual keyword coverage
 */
const INTENT_PATTERNS: Array<{
  intent: PrimaryIntent;
  keywords: RegExp[];
  priority: number;
}> = [
  // 1. Existing Client Support & Complaints (highest priority)
  {
    intent: "COMPLAINT_OR_ISSUE",
    priority: 100,
    keywords: [
      /\b(complaint|shikayat|problem|issue|delay|not working|not received|unhappy|disappointed|galat|fraud|loss incurred)\b/i,
      /(शिकायत|समस्या|परेशानी|धोखा|गलत)/,
    ],
  },
  {
    intent: "EXISTING_CLIENT_SUPPORT",
    priority: 95,
    keywords: [
      /\b(existing client|current client|already a client|account update|portfolio update|my account|mera account|already invested with vantage|my relationship manager|statement|valuation)\b/i,
      /\b(existing.*client|purana.*client)\b/i,
      /(मौजूदा ग्राहक|पुराना ग्राहक|मेरा खाता|स्टेटमेंट)/,
    ],
  },
  // 2. Direct Human Contact / Callback Request
  {
    intent: "CALLBACK_REQUEST",
    priority: 90,
    keywords: [
      /\b(speak directly|speak with an advisor|talk to someone|call me back|request callback|callback|phone par baat|baat karni hai|call karo|connect with advisor|schedule a call|speak today|speak with someone today)\b/i,
      /\b(want to speak|need to talk|someone to call|speak with a human)\b/i,
      /(बात करनी है|कॉल करो|सलाहकार से बात|फोन करो)/,
    ],
  },
  // 3. Specific Financial Services
  {
    intent: "PORTFOLIO_REVIEW",
    priority: 85,
    keywords: [
      /\b(review.*portfolio|portfolio review|review my investments|investments with another advisor|second opinion|overlap|check my mutual funds|existing investments|comprehensive review|portfolio.*review|review.*holdings|review.*brokers)\b/i,
      /\b(portfolio.*check|investments.*review)\b/i,
    ],
  },
  {
    intent: "RETIREMENT_PLANNING",
    priority: 80,
    keywords: [
      /\b(retirement|retire|pension|retire at|sewanivriti|budhape|retirement planning|retire ho raha)\b/i,
      /(रिटायरमेंट|पेंशन|सेवानिवृत्ति)/,
    ],
  },
  {
    intent: "PROPERTY_AND_FINANCING",
    priority: 80,
    keywords: [
      /\b(home loan|housing loan|property financing|loan against property|lap|loan against securities|las|mortgage|ghar lene ke liye loan|property loan)\b/i,
      /(होम लोन|प्रॉपर्टी लोन|कर्ज)/,
    ],
  },
  {
    intent: "TAX_ADVISORY",
    priority: 80,
    keywords: [
      /\b(tax|capital gains|tax planning|tax structuring|tax advice|tax efficiency|income tax|ltcg|stcg|tax bachat)\b/i,
      /(टैक्स|कर बचत|कैपिटल गेन)/,
    ],
  },
  {
    intent: "INSURANCE_ENQUIRY",
    priority: 80,
    keywords: [
      /\b(insurance|term plan|term life|health insurance|family protection|mediclaim|bima|beema|life cover|coverage)\b/i,
      /(बीमा|टर्म इंश्योरेंस|हेल्थ इंश्योरेंस)/,
    ],
  },
  {
    intent: "FAMILY_WEALTH_PLANNING",
    priority: 78,
    keywords: [
      /\b(family wealth|daughter.*education|child.*education|son.*education|children education|beti ki padhai|baccho ki education|family trust|succession|inheritance|wasiyat)\b/i,
      /(बच्चों की शिक्षा|शिक्षा के लिए|बेटी की पढ़ाई|पारिवारिक संपत्ति)/,
    ],
  },
  {
    intent: "MUTUAL_FUND_ENQUIRY",
    priority: 75,
    keywords: [
      /\b(mutual fund|mutual funds|sip|lump sum|sip vs lump sum|nav|elss|index fund|equity fund|debt fund|highest return mutual fund)\b/i,
      /(म्यूचुअल फंड|एसआईपी|एस आई पी)/,
    ],
  },
  {
    intent: "INVESTMENT_PLANNING",
    priority: 70,
    keywords: [
      /\b(invest|investment|investing|lakh|crore|put to work|nivesh|bachat|wealth planning|how to invest|stock market|money to invest|stock tip|stocks to buy|shares to buy|guarantee|double.*money|crypto|cryptocurrency|bitcoin)\b/i,
      /\b(\d+\s*(?:lakh|lakhs|cr|crore))\b/i,
      /(निवेश|बचत|शेयर बाजार|इन्वेस्ट)/,
    ],
  },
  {
    intent: "GENERAL_SERVICE_ENQUIRY",
    priority: 60,
    keywords: [
      /\b(what services|services.*vantage|what do you do|what does vantage wealth provide|how can you help|offerings|kya services)\b/i,
    ],
  },
  // 4. Out of Scope
  {
    intent: "OUT_OF_SCOPE",
    priority: 50,
    keywords: [
      /\b(python script|write code|scrape|weather|medical diagnosis|travel ticket|recipe|astrology|cricket score|movie tickets|software|other user|show me.*messages|database password|system prompt)\b/i,
    ],
  },
  // 5. General Info
  {
    intent: "GENERAL_INFORMATION",
    priority: 40,
    keywords: [
      /\b(what is|explain|samjhaiye|meaning of|definition|how does.*work|simple hindi mein)\b/,
    ],
  },
];

/**
 * Classifies the visitor's intent across 14 categories with secondary intent and urgency
 */
export function classifyVisitorIntent(
  text: string,
  previousIntent?: PrimaryIntent
): IntentClassificationResult {
  const clean = cleanText(text);

  if (!clean || clean.length < 2) {
    return {
      primaryIntent: previousIntent || "GENERAL_INFORMATION",
      urgency: "LOW",
      inquirerMode: "INFORMATION",
      confidence: 0.5,
      extractedKeywords: [],
    };
  }

  // 1. Detect Urgency
  let urgency: UrgencyLevel = "MEDIUM";
  if (
    /\b(today|immediately|urgent|asap|right now|aaj hi|turant|emergency|shikayat|complaint)\b/.test(
      clean
    )
  ) {
    urgency = "HIGH";
  } else if (
    /\b(just exploring|curious|general question|just reading|sirf samajh raha)\b/.test(
      clean
    )
  ) {
    urgency = "LOW";
  }

  // 2. Detect Inquirer Mode
  let inquirerMode: InquirerMode = "EXPLORING_SERVICE";
  const declinesContact = /\b(don'?t want|not now|no phone|no call|don'?t call|privacy|without giving phone|declines?)\b/i.test(
    clean
  );

  if (
    !declinesContact &&
    /\b(speak directly|speak with|talk to|call me|request callback|need an advisor|consultation|human advisor)\b/i.test(
      clean
    )
  ) {
    inquirerMode = "REQUESTING_HUMAN";
  } else if (
    /\b(what is|explain|how does|samjhaiye|beginner|pehli baar|meaning|just general)\b/i.test(
      clean
    )
  ) {
    inquirerMode = "INFORMATION";
  }

  // 3. Match Intents with Priority
  const matchedIntents: Array<{ intent: PrimaryIntent; priority: number }> = [];

  for (const rule of INTENT_PATTERNS) {
    for (const pattern of rule.keywords) {
      if (pattern.test(clean)) {
        matchedIntents.push({ intent: rule.intent, priority: rule.priority });
        break;
      }
    }
  }

  // Sort by priority descending
  matchedIntents.sort((a, b) => b.priority - a.priority);

  let primary: PrimaryIntent = "GENERAL_INFORMATION";
  let secondary: PrimaryIntent | undefined = undefined;

  if (matchedIntents.length > 0) {
    primary = matchedIntents[0].intent;
    if (matchedIntents.length > 1 && matchedIntents[1].intent !== primary) {
      secondary = matchedIntents[1].intent;
    }
  } else if (previousIntent) {
    primary = previousIntent;
  }

  // If callback was requested alongside an investment inquiry, make CALLBACK_REQUEST primary and the other secondary
  if (matchedIntents.some((m) => m.intent === "CALLBACK_REQUEST") && primary !== "CALLBACK_REQUEST") {
    secondary = primary;
    primary = "CALLBACK_REQUEST";
  }

  return {
    primaryIntent: primary,
    secondaryIntent: secondary,
    urgency,
    inquirerMode,
    confidence: matchedIntents.length > 0 ? 0.9 : 0.6,
    extractedKeywords: clean.split(/\s+/).slice(0, 10),
  };
}
