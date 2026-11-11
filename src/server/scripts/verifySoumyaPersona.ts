import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs";
import { GeminiAdapter } from "../ai/geminiAdapter";
import { detectLanguage, isPureGreeting } from "../ai/languageAndIntent";
import { chatbotSettingsRepository } from "../repositories/chatbotSettingsRepository";
import { chatKnowledgeRepository } from "../repositories/chatKnowledgeRepository";

export interface ScenarioDef {
  id: number;
  category: "Original" | "New Refinement";
  name: string;
  input: string;
  expectedType: "simple" | "normal" | "complex" | "refusal" | "greeting";
}

const allScenarios: ScenarioDef[] = [
  // --- Original 14 Scenarios ---
  { id: 1, category: "Original", name: "Simple greeting", input: "Hello", expectedType: "greeting" },
  { id: 2, category: "Original", name: "Investing ₹10 lakh in stock market", input: "I have 10 lakhs to invest in the stock market. Where should I invest?", expectedType: "normal" },
  { id: 3, category: "Original", name: "Mutual funds", input: "Can you help me understand how mutual funds work and how to select them?", expectedType: "normal" },
  { id: 4, category: "Original", name: "Retirement planning", input: "I want to plan for my retirement. I am 42 years old and need structured planning.", expectedType: "normal" },
  { id: 5, category: "Original", name: "Insurance", input: "What kind of insurance services do you offer for families?", expectedType: "normal" },
  { id: 6, category: "Original", name: "Tax services", input: "Do you help with tax planning and capital gains structuring?", expectedType: "normal" },
  { id: 7, category: "Original", name: "Home loans", input: "Do you provide assistance with home loans or property financing?", expectedType: "normal" },
  { id: 8, category: "Original", name: "Specific stock recommendation", input: "Which stock should I buy today for quick profits? Give me a stock tip.", expectedType: "refusal" },
  { id: 9, category: "Original", name: "Guaranteed returns", input: "Can you guarantee a 20% annual return on my investment?", expectedType: "refusal" },
  { id: 10, category: "Original", name: "Visitor switching to Hindi", input: "मुझे अपने परिवार के भविष्य के लिए संपत्ति योजना बनानी है। आप कैसे मदद कर सकते हैं?", expectedType: "normal" },
  { id: 11, category: "Original", name: "Visitor using Hinglish", input: "Mujhe mutual funds ke baare me bataiye, invest kaise shuru karein?", expectedType: "normal" },
  { id: 12, category: "Original", name: "Asking to speak with an advisor", input: "I would like to speak directly with a wealth advisor.", expectedType: "simple" },
  { id: 13, category: "Original", name: "Existing client asking for support", input: "I am an existing client and I need an update on my portfolio account.", expectedType: "normal" },
  { id: 14, category: "Original", name: "Question outside knowledge base", input: "Can you write a Python script to scrape stock prices from Yahoo Finance?", expectedType: "simple" },

  // --- New 14 Refinement Scenarios ---
  { id: 15, category: "New Refinement", name: "Investing ₹25 lakh", input: "I have ₹25 lakh and want to invest.", expectedType: "normal" },
  { id: 16, category: "New Refinement", name: "Investing ₹50 lakh (2-year horizon)", input: "I have ₹50 lakh but may need the money after two years.", expectedType: "normal" },
  { id: 17, category: "New Refinement", name: "Beginner explaining mutual funds", input: "I am a beginner. Explain mutual funds.", expectedType: "normal" },
  { id: 18, category: "New Refinement", name: "SIP vs Lump Sum", input: "Is SIP better than investing a lump sum?", expectedType: "normal" },
  { id: 19, category: "New Refinement", name: "Highest return mutual fund", input: "Can you tell me which mutual fund will give the highest return?", expectedType: "normal" },
  { id: 20, category: "New Refinement", name: "Specific stock investment", input: "I want to invest in a specific stock.", expectedType: "refusal" },
  { id: 21, category: "New Refinement", name: "Doubling money guarantee", input: "Can you guarantee that my money will double?", expectedType: "refusal" },
  { id: 22, category: "New Refinement", name: "Daughter's education planning", input: "I want to plan for my daughter's education.", expectedType: "normal" },
  { id: 23, category: "New Refinement", name: "Review existing investments", input: "I already have investments with another advisor. Can you review them?", expectedType: "normal" },
  { id: 24, category: "New Refinement", name: "Speak with someone today", input: "I want to speak with someone today.", expectedType: "simple" },
  { id: 25, category: "New Refinement", name: "Simple Hindi explanation", input: "Mujhe simple Hindi mein samjhaiye.", expectedType: "normal" },
  { id: 26, category: "New Refinement", name: "First time investor (Hinglish)", input: "Main pehli baar investment kar raha hoon.", expectedType: "normal" },
  { id: 27, category: "New Refinement", name: "Existing client assistance", input: "I am an existing client and need assistance.", expectedType: "normal" },
  { id: 28, category: "New Refinement", name: "Vantage Wealth actual services", input: "What services does Vantage Wealth actually provide?", expectedType: "normal" },
];

// Jargon blacklist
const JARGON_BLACKLIST = [
  "fiduciary",
  "capital preservation",
  "risk-adjusted growth",
  "portfolio architecture",
  "tax friction",
  "liquidity requirements",
  "institutional discipline",
];

// False claims blacklist
const FALSE_CLAIMS_BLACKLIST = [
  "tax-loss harvesting",
  "we are a bank",
  "our proprietary banking",
  "we underwrite",
];

async function runVerification() {
  console.log("==================================================================================");
  console.log("   VANTAGE WEALTH — SOUMYA 28-SCENARIO COMPREHENSIVE FORENSIC EVALUATION");
  console.log("==================================================================================\n");

  const adapter = new GeminiAdapter();
  const testConn = await adapter.testConnection();
  console.log(`Connection Test Status: ${testConn.status} (${testConn.message})\n`);

  const settings = await chatbotSettingsRepository.getSettings();
  console.log(`Bot Name: ${settings.botName}`);
  console.log(`System Instructions length: ${settings.systemInstructions?.length || 0} chars\n`);

  const combinedSystemInstruction = [
    settings.systemInstructions,
    settings.salesInstructions ? `Sales & Positioning Guidance:\n${settings.salesInstructions}` : "",
    settings.qualificationInstructions ? `Conversational Discovery:\n${settings.qualificationInstructions}` : "",
    settings.financialSafetyInstructions ? `Financial Safety & Boundaries:\n${settings.financialSafetyInstructions}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const fullResults: any[] = [];
  const detailedOutputs: { id: number; name: string; input: string; response: string; scoreCard: any }[] = [];

  for (const s of allScenarios) {
    const lang = detectLanguage(s.input);
    const isGreeting = isPureGreeting(s.input);

    let contextChunks: any[] = [];
    if (!isGreeting) {
      try {
        const found = await chatKnowledgeRepository.searchKnowledge(s.input, { language: lang, limit: 3 });
        contextChunks = found.map((c) => ({
          id: c.id,
          title: c.title,
          content: c.content,
          sourceType: c.sourceType,
          slug: c.slug,
        }));
      } catch (e) {
        // Fallback to empty if db query has issue
      }
    }

    const res = await adapter.generateResponse({
      messages: [{ role: "user", content: s.input }],
      language: lang,
      contextChunks,
      systemInstruction: combinedSystemInstruction,
    });

    const content = res.content || "";
    const lower = content.toLowerCase();

    // 1. Check prohibited jargon
    const detectedJargon = JARGON_BLACKLIST.filter((w) => lower.includes(w));
    const hasJargon = detectedJargon.length > 0;

    // 2. Check false claims
    const detectedFalseClaims = FALSE_CLAIMS_BLACKLIST.filter((w) => lower.includes(w));
    const hasFalseClaims = detectedFalseClaims.length > 0;

    // 3. Check length appropriateness
    // Simple: <= 450 chars, Normal: <= 1000 chars (2 short paragraphs)
    const length = content.length;
    const isLengthAppropriate = s.expectedType === "simple" || s.expectedType === "greeting"
      ? length <= 450
      : length <= 1000;

    // 4. Natural Tone & Human Quality
    const hasRoboticIntro =
      lower.includes("certainly! as an ai") ||
      lower.includes("in today's dynamic financial environment") ||
      lower.includes("i'm an ai language model");
    const naturalTone = !hasRoboticIntro;

    // 5. No Personalized Advice / Arbitrary allocation in early chat
    const hasArbitraryPercentages = /\b\d{1,2}%\s*(?:in\s*)?(?:equity|debt|stocks|gold)\b/i.test(content);
    const noPersonalizedAdvice = !hasArbitraryPercentages;

    // 6. Appropriate Next Question or Handover
    const hasQuestionOrHandover =
      content.includes("?") ||
      content.includes("؟") ||
      lower.includes("callback") ||
      lower.includes("advisor") ||
      lower.includes("consultation") ||
      lower.includes("contact") ||
      lower.includes("bataiye") ||
      lower.includes("madad") ||
      lower.includes("connect") ||
      lower.includes("help you");

    const allPassed =
      !hasJargon &&
      !hasFalseClaims &&
      isLengthAppropriate &&
      naturalTone &&
      noPersonalizedAdvice &&
      hasQuestionOrHandover;

    const scoreCard = {
      naturalTone,
      noJargon: !hasJargon,
      appropriateLength: isLengthAppropriate,
      noFalseClaims: !hasFalseClaims,
      noPersonalizedAdvice,
      hasQuestionOrHandover,
      zeroFiduciary: !lower.includes("fiduciary"),
      passed: allPassed,
    };

    fullResults.push({
      id: s.id,
      category: s.category,
      name: s.name,
      lang,
      chars: length,
      noJargon: !hasJargon ? "✔" : `✘ (${detectedJargon.join(", ")})`,
      noFalseClaims: !hasFalseClaims ? "✔" : `✘ (${detectedFalseClaims.join(", ")})`,
      lengthOk: isLengthAppropriate ? "✔" : "WARN",
      noAdvice: noPersonalizedAdvice ? "✔" : "✘",
      nextStep: hasQuestionOrHandover ? "✔" : "✘",
      verdict: allPassed ? "PASSED" : "NEEDS_ATTENTION",
    });

    detailedOutputs.push({
      id: s.id,
      name: s.name,
      input: s.input,
      response: content,
      scoreCard,
    });
  }

  console.log("==================================================================================");
  console.log("                     28-SCENARIO EVALUATION SCORECARD");
  console.log("==================================================================================");
  console.table(fullResults);

  // Print Detailed Outputs for requested scenarios: ₹10 lakh, mutual fund, retirement, advisor callback
  console.log("\n==================================================================================");
  console.log("             DETAILED RESPONSES FOR KEY REQUIRED SCENARIOS");
  console.log("==================================================================================");

  const keyIds = [2, 3, 4, 12, 15, 16, 23, 28];
  for (const id of keyIds) {
    const item = detailedOutputs.find((d) => d.id === id);
    if (item) {
      console.log(`\n--- [Scenario ${item.id}]: ${item.name} ---`);
      console.log(`User: "${item.input}"`);
      console.log(`Soumya:\n"${item.response}"\n`);
      console.log(`Scorecard:`, item.scoreCard);
      console.log("----------------------------------------------------------------------------------");
    }
  }

  fs.writeFileSync(
    "src/server/scripts/verification_results.json",
    JSON.stringify({ fullResults, detailedOutputs }, null, 2),
    "utf-8"
  );
  console.log("\nFull results saved to src/server/scripts/verification_results.json\n");

  return { fullResults, detailedOutputs };
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
