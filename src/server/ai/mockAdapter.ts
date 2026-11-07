import {
  AiProviderAdapter,
  GenerateAiResponseRequest,
  GenerateAiResponseResult,
  ConnectionTestResult,
} from "./types";
import {
  sanitizePromptForPrivacy,
  checkFinancialSafetyViolation,
} from "./financialSafetyGuardrails";

/**
 * Mock AI Provider Adapter for deterministic, fast, offline automated tests
 * and development environments without incurring paid API calls.
 */
export class MockAiAdapter implements AiProviderAdapter {
  readonly name = "Mock AI Provider";
  readonly defaultModel = "mock-fiduciary-v1";
  public simulateOffline = false;
  public simulateRateLimit = false;

  async testConnection(): Promise<ConnectionTestResult> {
    if (this.simulateOffline) {
      return {
        ok: false,
        provider: this.name,
        model: this.defaultModel,
        status: "UNCONFIGURED",
        message: "Simulated offline state for testing.",
      };
    }

    if (this.simulateRateLimit) {
      return {
        ok: false,
        provider: this.name,
        model: this.defaultModel,
        status: "RATE_LIMITED",
        message: "Simulated rate limit error (429).",
      };
    }

    return {
      ok: true,
      provider: this.name,
      model: this.defaultModel,
      status: "CONNECTED",
      message: "Mock provider connected successfully.",
      latencyMs: 12,
    };
  }

  async generateResponse(request: GenerateAiResponseRequest): Promise<GenerateAiResponseResult> {
    const userTurns = request.messages.filter((m) => m.role === "user");
    const lastUserTurn = userTurns[userTurns.length - 1]?.content || "";
    const language = request.language || "en";

    // 1. Safety verification
    const safety = checkFinancialSafetyViolation(lastUserTurn);
    if (safety.isViolation && safety.refusalMessage) {
      return {
        content: safety.refusalMessage[language] || safety.refusalMessage.en,
        isFlagged: true,
        flagReason: safety.category,
      };
    }

    // 2. Privacy verification
    const { sanitized, redactedTypes } = sanitizePromptForPrivacy(lastUserTurn);

    // 3. Grounded response based on context chunks
    if (request.contextChunks && request.contextChunks.length > 0) {
      const topChunk = request.contextChunks[0];
      return {
        content: `According to our ${topChunk.title} documentation, Vantage Wealth provides structured private advisory. ${topChunk.content.slice(
          0,
          180
        )}... For customized planning, please request a callback.`,
        citations: [{ title: topChunk.title, slug: topChunk.slug || undefined, sourceType: topChunk.sourceType }],
        tokenCount: 45,
      };
    }

    // Default response
    const defaultText =
      language === "hi"
        ? "वैनटेज वेल्थ में आपका स्वागत है। हम विवेकाधीन पोर्टफोलियो प्रबंधन (PMS) और पारिवारिक संपत्ति संरक्षण में सहायता प्रदान करते हैं।"
        : language === "hinglish"
        ? "Vantage Wealth me aapka swagat hai. Hum Discretionary PMS aur family trust planning provide karte hain."
        : "Welcome to Vantage Wealth. We specialize in Discretionary Portfolio Management (PMS), Estate & Succession Planning, and Family Office Advisory. How may we assist your family today?";

    return {
      content: defaultText,
      tokenCount: 32,
    };
  }
}
