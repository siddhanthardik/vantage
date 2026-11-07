import { GeminiAdapter, DEFAULT_GEMINI_MODEL } from "../ai/geminiAdapter";
import { MockAiAdapter } from "../ai/mockAdapter";
import { getAiProvider } from "../ai/aiProviderFactory";
import {
  sanitizePromptForPrivacy,
  checkFinancialSafetyViolation,
  buildGroundedSystemPrompt,
} from "../ai/financialSafetyGuardrails";
import { chatKnowledgeRepository } from "../repositories/chatKnowledgeRepository";
import { prisma } from "@/lib/db/prisma";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${name}${details ? ` - ${details}` : ""}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("VANTAGE WEALTH ASSISTANT — PHASE 3 AI PROVIDER & KNOWLEDGE TEST SUITE");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST 1: Gemini Adapter instantiation & default configuration
  // --------------------------------------------------------------------------
  try {
    console.log("1. Running: Gemini Adapter initialization & defaults...");
    const gemini = new GeminiAdapter();
    assert(gemini.name === "Google Gemini", "Provider name must be 'Google Gemini'");
    assert(
      gemini.defaultModel === "gemini-3.8-flash",
      `Default model must be 'gemini-3.8-flash' (got ${gemini.defaultModel})`
    );

    results.push({ name: "Gemini Adapter initialization & defaults", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Gemini Adapter initialization & defaults", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 2: Server-side Connection Test (Safe unconfigured / unauthenticated status)
  // --------------------------------------------------------------------------
  try {
    console.log("2. Running: Safe server-side connection test without credential leakage...");
    const gemini = new GeminiAdapter();
    const testResult = await gemini.testConnection();

    // Verify properties exist and no secret is leaked
    assert(typeof testResult.ok === "boolean", "testResult.ok must be boolean");
    assert(Boolean(testResult.provider), "Provider name must be present");
    assert(Boolean(testResult.status), "Status must be present");
    assert(!testResult.message.includes("AIza"), "Must NOT reveal Google API key in message");

    // Since GEMINI_API_KEY is not yet populated with a live key, it should safely return UNCONFIGURED or INVALID_KEY
    assert(
      testResult.status === "UNCONFIGURED" || testResult.status === "INVALID_KEY" || testResult.status === "CONNECTED",
      `Status must be a known safe status (got ${testResult.status})`
    );

    results.push({ name: "Safe server-side connection test", passed: true });
    console.log(`   ✔ Passed (Status: ${testResult.status})\n`);
  } catch (err: any) {
    results.push({ name: "Safe server-side connection test", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 3: Privacy Sanitization (Redaction of Email, Phone, PAN, Aadhaar)
  // --------------------------------------------------------------------------
  try {
    console.log("3. Running: Privacy Sanitization (PII & sensitive identifiers)...");
    const testInput =
      "Hello, my name is Rajesh. Email me at rajesh.kumar@example.com or call +91 9876543210. My PAN is ABCDE1234F and Aadhaar is 1234-5678-9012.";

    const { sanitized, redactedTypes } = sanitizePromptForPrivacy(testInput);

    assert(!sanitized.includes("rajesh.kumar@example.com"), "Email must be redacted");
    assert(!sanitized.includes("+91 9876543210") && !sanitized.includes("9876543210"), "Phone must be redacted");
    assert(!sanitized.includes("ABCDE1234F"), "PAN must be redacted");
    assert(!sanitized.includes("1234-5678-9012"), "Aadhaar must be redacted");

    assert(sanitized.includes("[EMAIL_PROTECTED]"), "Must insert EMAIL_PROTECTED placeholder");
    assert(sanitized.includes("[PHONE_PROTECTED]"), "Must insert PHONE_PROTECTED placeholder");
    assert(sanitized.includes("[PAN_REDACTED]"), "Must insert PAN_REDACTED placeholder");
    assert(sanitized.includes("[AADHAAR_REDACTED]"), "Must insert AADHAAR_REDACTED placeholder");

    assert(redactedTypes.includes("EMAIL"), "redactedTypes must include EMAIL");
    assert(redactedTypes.includes("PHONE"), "redactedTypes must include PHONE");
    assert(redactedTypes.includes("PAN"), "redactedTypes must include PAN");
    assert(redactedTypes.includes("AADHAAR"), "redactedTypes must include AADHAAR");

    results.push({ name: "Privacy sanitization (PII & sensitive identifiers)", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Privacy sanitization (PII & sensitive identifiers)", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Financial Safety Guardrail — Stock Picking & Speculation Refusal
  // --------------------------------------------------------------------------
  try {
    console.log("4. Running: Financial Safety — Stock picking refusal (SEBI compliance)...");
    const query = "Which penny stock should I buy today for quick multibagger returns?";
    const check = checkFinancialSafetyViolation(query);

    assert(check.isViolation === true, "Must flag stock tip inquiry as violation");
    assert(check.category === "STOCK_TIP", "Category must be STOCK_TIP");
    assert(Boolean(check.refusalMessage?.en), "Must provide English refusal");
    assert(Boolean(check.refusalMessage?.hi), "Must provide Hindi refusal");
    assert(Boolean(check.refusalMessage?.hinglish), "Must provide Hinglish refusal");
    assert(check.refusalMessage!.en.includes("SEBI"), "English refusal must cite SEBI compliance");

    results.push({ name: "Financial Safety — Stock picking refusal", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Financial Safety — Stock picking refusal", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 5: Financial Safety Guardrail — Crypto & Guaranteed Returns Refusal
  // --------------------------------------------------------------------------
  try {
    console.log("5. Running: Financial Safety — Crypto & guaranteed returns refusal...");
    const cryptoQuery = "Can you help me invest ₹50 Lakhs in Bitcoin and crypto trading bots?";
    const cryptoCheck = checkFinancialSafetyViolation(cryptoQuery);

    assert(cryptoCheck.isViolation === true, "Must flag crypto inquiry as violation");
    assert(cryptoCheck.category === "CRYPTO", "Category must be CRYPTO");
    assert(cryptoCheck.refusalMessage!.en.includes("RBI"), "Refusal must cite RBI/SEBI regulations");

    const returnQuery = "I want a guaranteed return of 25% annually with zero risk.";
    const returnCheck = checkFinancialSafetyViolation(returnQuery);

    assert(returnCheck.isViolation === true, "Must flag guaranteed return inquiry");
    assert(returnCheck.category === "GUARANTEED_RETURNS", "Category must be GUARANTEED_RETURNS");

    results.push({ name: "Financial Safety — Crypto & guaranteed returns refusal", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Financial Safety — Crypto & guaranteed returns refusal", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 6: Multilingual System Prompt Construction & Context Grounding
  // --------------------------------------------------------------------------
  try {
    console.log("6. Running: System Prompt construction & Grounding injection...");
    const prompt = buildGroundedSystemPrompt({
      baseInstructions: "Custom firm fiduciary tone.",
      language: "hi",
      contextChunks: [
        {
          id: "test_c1",
          title: "Discretionary Portfolio Management",
          sourceType: "SERVICE_PAGE",
          slug: "services/pms",
          content: "Active asset allocation with statutory minimum ticket size of ₹50 Lakhs.",
        },
      ],
    });

    assert(prompt.includes("LANGUAGE DIRECTIVE"), "Must include language directive");
    assert(prompt.includes("Hindi (Devanagari script)"), "Must instruct Devanagari Hindi output");
    assert(prompt.includes("Discretionary Portfolio Management"), "Must include chunk title");
    assert(prompt.includes("₹50 Lakhs"), "Must include chunk content");
    assert(prompt.includes("FIDUCIARY BOUNDARIES"), "Must include fiduciary boundary instructions");

    results.push({ name: "System Prompt construction & Grounding injection", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "System Prompt construction & Grounding injection", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 7: Mock Provider Execution (Offline & Zero-Cost Test Verification)
  // --------------------------------------------------------------------------
  try {
    console.log("7. Running: Mock Provider offline execution & citation resolution...");
    const mockProvider = new MockAiAdapter();

    const response = await mockProvider.generateResponse({
      messages: [{ role: "user", content: "Tell me about your Wealth Protection services" }],
      contextChunks: [
        {
          id: "chunk_wp",
          title: "Wealth Protection",
          sourceType: "SERVICE_PAGE",
          slug: "services/insurance",
          content: "Holistic asset insulation strategies for high net worth families in India.",
        },
      ],
      language: "en",
    });

    assert(Boolean(response.content), "Response must have text content");
    assert(response.content.includes("Wealth Protection"), "Response must mention chunk title");
    assert(response.citations !== undefined && response.citations.length > 0, "Must return citations");
    assert(response.citations![0].title === "Wealth Protection", "Citation title must match");
    assert(response.citations![0].slug === "services/insurance", "Citation slug must match");

    results.push({ name: "Mock Provider offline execution & citations", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Mock Provider offline execution & citations", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 8: AI Provider Factory contract
  // --------------------------------------------------------------------------
  try {
    console.log("8. Running: AI Provider Factory fallback & selection contract...");
    const defaultProvider = getAiProvider();
    assert(defaultProvider.name === "Google Gemini", "Default provider must be Google Gemini");

    const forcedMock = getAiProvider("mock");
    assert(forcedMock.name === "Mock AI Provider", "Explicit mock request must return Mock provider");

    results.push({ name: "AI Provider Factory fallback & selection contract", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "AI Provider Factory fallback & selection contract", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 9: Ingested Knowledge Base Verification (13 active chunks)
  // --------------------------------------------------------------------------
  try {
    console.log("9. Running: Ingested Knowledge Base verification...");
    const chunkCount = await prisma.knowledgeChunk.count({ where: { isActive: true } });
    assert(chunkCount >= 13, `Expected at least 13 active chunks (found ${chunkCount})`);

    const services = await prisma.knowledgeChunk.count({
      where: { sourceType: "SERVICE_PAGE", isActive: true },
    });
    assert(services === 7, `Expected 7 service chunks (found ${services})`);

    const articles = await prisma.knowledgeChunk.count({
      where: { sourceType: "INSIGHT_ARTICLE", isActive: true },
    });
    assert(articles === 4, `Expected 4 article chunks (found ${articles})`);

    const team = await prisma.knowledgeChunk.count({
      where: { sourceType: "TEAM_PROFILE", isActive: true },
    });
    assert(team === 2, `Expected 2 team chunks (found ${team})`);

    results.push({ name: "Ingested Knowledge Base verification (13 chunks)", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Ingested Knowledge Base verification", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // TEST 10: PostgreSQL Native Multilingual Knowledge Search on Live Chunks
  // --------------------------------------------------------------------------
  try {
    console.log("10. Running: Multilingual Knowledge Search on Live Chunks...");
    // 1. English Search
    const retirementResults = await chatKnowledgeRepository.searchKnowledge("Retirement");
    assert(retirementResults.length > 0, "Retirement search must return results");
    assert(
      retirementResults.some((r) => r.title.includes("Retirement")),
      "Must match Retirement Planning"
    );

    // 2. Transliterated Hinglish Search
    const niveshResults = await chatKnowledgeRepository.searchKnowledge("nivesh");
    assert(niveshResults.length > 0, "Hinglish nivesh search must return matching services");

    // 3. Tax Planning Search
    const taxResults = await chatKnowledgeRepository.searchKnowledge("Tax Planning");
    assert(taxResults.length > 0, "Tax search must return results");

    results.push({ name: "Multilingual Knowledge Search on Live Chunks", passed: true });
    console.log("   ✔ Passed\n");
  } catch (err: any) {
    results.push({ name: "Multilingual Knowledge Search on Live Chunks", passed: false, error: err.message });
    console.error("   ✖ Failed:", err.message, "\n");
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("PHASE 3 TEST RESULTS SUMMARY");
  console.log("================================================================================");
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`[${status}] ${r.name}`);
    if (!r.passed) {
      allPassed = false;
      console.log(`       Error: ${r.error}`);
    }
  }
  console.log("================================================================================");
  console.log(
    `TOTAL: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${
      results.filter((r) => !r.passed).length
    }`
  );
  console.log("================================================================================\n");

  await prisma.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
