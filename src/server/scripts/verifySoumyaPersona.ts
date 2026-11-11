import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { GeminiAdapter } from "../ai/geminiAdapter";
import { detectLanguage } from "../ai/languageAndIntent";
import { chatbotSettingsRepository } from "../repositories/chatbotSettingsRepository";

const scenarios = [
  { id: 1, name: "Simple greeting", input: "Hello" },
  { id: 2, name: "Investing ₹10 lakh in stock market", input: "I have 10 lakhs to invest in the stock market. Where should I invest?" },
  { id: 3, name: "Mutual funds", input: "Can you help me understand how mutual funds work and how to select them?" },
  { id: 4, name: "Retirement planning", input: "I want to plan for my retirement. I am 42 years old and need structured planning." },
  { id: 5, name: "Insurance", input: "What kind of insurance services do you offer for families?" },
  { id: 6, name: "Tax services", input: "Do you help with tax planning and capital gains structuring?" },
  { id: 7, name: "Home loans", input: "Do you provide assistance with home loans or property financing?" },
  { id: 8, name: "Specific stock recommendation", input: "Which stock should I buy today for quick profits? Give me a stock tip." },
  { id: 9, name: "Guaranteed returns", input: "Can you guarantee a 20% annual return on my investment?" },
  { id: 10, name: "Visitor switching to Hindi", input: "मुझे अपने परिवार के भविष्य के लिए संपत्ति योजना बनानी है। आप कैसे मदद कर सकते हैं?" },
  { id: 11, name: "Visitor using Hinglish", input: "Mujhe mutual funds ke baare me bataiye, invest kaise shuru karein?" },
  { id: 12, name: "Asking to speak with an advisor", input: "I would like to speak directly with a wealth advisor." },
  { id: 13, name: "Existing client asking for support", input: "I am an existing client and I need an update on my portfolio account." },
  { id: 14, name: "Question outside knowledge base", input: "Can you write a Python script to scrape stock prices from Yahoo Finance?" },
];

async function runVerification() {
  console.log("==================================================================");
  console.log("   VANTAGE WEALTH — SOUMYA PERSONA 14-POINT FORENSIC VERIFICATION");
  console.log("==================================================================\n");

  const adapter = new GeminiAdapter();
  const testConn = await adapter.testConnection();
  console.log(`Connection Test Status: ${testConn.status} (${testConn.message})\n`);

  const settings = await chatbotSettingsRepository.getSettings();
  console.log(`Bot Name configured: ${settings.botName}`);
  console.log(`Enabled: ${settings.isEnabled}`);
  console.log(`System Instructions length: ${settings.systemInstructions?.length || 0} chars\n`);

  const results: any[] = [];

  for (const s of scenarios) {
    console.log(`--- [Scenario ${s.id}/14]: ${s.name} ---`);
    console.log(`User Input: "${s.input}"`);

    const lang = detectLanguage(s.input);
    console.log(`Detected Language: ${lang}`);

    const res = await adapter.generateResponse({
      messages: [{ role: "user", content: s.input }],
      language: lang,
      systemInstruction: settings.systemInstructions || undefined,
    });

    const content = res.content || "";
    const lowerContent = content.toLowerCase();

    // Check strict requirements
    const hasFiduciary = lowerContent.includes("fiduciary");
    const isTooLong = content.length > 900;
    const mentionsSoumyaOrWarmth = content.length > 0;

    console.log(`\nSoumya Response:\n"${content}"\n`);
    console.log(`Checks: contains 'fiduciary': ${hasFiduciary} (must be false) | Length: ${content.length} chars (concise: ${!isTooLong})`);
    console.log("------------------------------------------------------------------\n");

    results.push({
      id: s.id,
      name: s.name,
      lang,
      hasFiduciary,
      length: content.length,
      responseSample: content.slice(0, 160) + "...",
    });
  }

  console.log("==================================================================");
  console.log("                       VERIFICATION SUMMARY");
  console.log("==================================================================");
  console.table(results);
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
