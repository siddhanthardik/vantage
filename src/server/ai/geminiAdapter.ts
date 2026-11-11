import { GoogleGenAI } from "@google/genai";
import {
  AiProviderAdapter,
  GenerateAiResponseRequest,
  GenerateAiResponseResult,
  ConnectionTestResult,
  ConnectionStatus,
} from "./types";
import {
  sanitizePromptForPrivacy,
  checkFinancialSafetyViolation,
  buildGroundedSystemPrompt,
} from "./financialSafetyGuardrails";
import { isPureGreeting, getGreetingResponse } from "./languageAndIntent";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/**
 * Google Gemini AI Provider Adapter for Vantage Wealth Assistant.
 * Uses the official @google/genai SDK with native API key authentication.
 */
export class GeminiAdapter implements AiProviderAdapter {
  readonly name = "Google Gemini";
  readonly defaultModel: string;
  private client: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY?.trim() || null;
    this.defaultModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

    if (this.apiKey) {
      // Native Gemini Developer API authentication
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Diagnostic connection test to verify API key validity, model availability, and network latency
   * without exposing credentials.
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const model = this.defaultModel;

    if (!this.apiKey || !this.client) {
      return {
        ok: false,
        provider: this.name,
        model,
        status: "UNCONFIGURED",
        message: "GEMINI_API_KEY environment variable is not configured in .env.local.",
      };
    }

    const startTime = Date.now();
    try {
      // Diagnostic verification ping to test API key and model readiness
      const response = await this.client.models.generateContent({
        model,
        contents: "Respond with the word pong",
        config: {
          temperature: 0.1,
        },
      });

      const latencyMs = Date.now() - startTime;

      const outputText = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (response && outputText !== undefined) {
        return {
          ok: true,
          provider: this.name,
          model,
          status: "CONNECTED",
          message: `Successfully connected to Google Gemini Developer API (${model}). Diagnostic response: "${outputText.trim()}"`,
          latencyMs,
        };
      }

      return {
        ok: false,
        provider: this.name,
        model,
        status: "ERROR",
        message: "Gemini returned an empty or unparseable response.",
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const parsed = this.mapGeminiError(err);

      return {
        ok: false,
        provider: this.name,
        model,
        status: parsed.status,
        message: parsed.userMessage,
        latencyMs,
      };
    }
  }

  /**
   * Generates a grounded, privacy-sanitized, fiduciary-compliant response via Google Gemini
   */
  async generateResponse(request: GenerateAiResponseRequest): Promise<GenerateAiResponseResult> {
    const model = this.defaultModel;
    const language = request.language || "en";

    // 1. Identify last user message
    const userTurns = request.messages.filter((m) => m.role === "user");
    const lastUserTurn = userTurns[userTurns.length - 1]?.content || "";

    // 2. Pre-generation check: Financial safety & fiduciary regulations (SEBI)
    const safetyCheck = checkFinancialSafetyViolation(lastUserTurn);
    if (safetyCheck.isViolation && safetyCheck.refusalMessage) {
      const refusalText = safetyCheck.refusalMessage[language] || safetyCheck.refusalMessage.en;
      return {
        content: refusalText,
        isFlagged: true,
        flagReason: safetyCheck.category,
      };
    }

    // 3. Greeting check: Immediate polite, simple greeting without corporate bloat
    if (isPureGreeting(lastUserTurn)) {
      return {
        content: getGreetingResponse(language as any),
        isFlagged: false,
      };
    }

    // 4. Fallback if Gemini client is unconfigured
    if (!this.client || !this.apiKey) {
      const unconfiguredMsg =
        language === "hi"
          ? "वैनटेज वेल्थ असिस्टेंट सेवा अस्थायी रूप से ऑफलाइन है। कृपया सीधे हमारे कार्यालय से +91 98765 43210 पर संपर्क करें।"
          : language === "hinglish"
          ? "Vantage Wealth Assistant currently offline hai. Kripya hamare office se directly contact karein."
          : "The Vantage Wealth AI concierge service is temporarily unconfigured on this environment. Please reach our advisory desk directly at hello@vantagewealth.in or +91 98765 43210.";

      return {
        content: unconfiguredMsg,
        isFlagged: false,
      };
    }

    // 4. Privacy Sanitization: Redact PII (email, phone, PAN, Aadhaar) before dispatching to LLM
    const sanitizedMessages = request.messages.map((m) => {
      if (m.role === "user") {
        const { sanitized } = sanitizePromptForPrivacy(m.content);
        return { role: m.role, content: sanitized };
      }
      return m;
    });

    // 5. Construct grounded system prompt with retrieved context
    const systemInstruction = buildGroundedSystemPrompt({
      baseInstructions: request.systemInstruction,
      contextChunks: request.contextChunks,
      language,
    });

    // 6. Format contents array for Gemini API (user / model turns)
    const contents = sanitizedMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const response = await this.client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: request.temperature ?? 0.3, // Low temperature for high precision and factual grounding
          maxOutputTokens: request.maxOutputTokens ?? 1024,
        },
      });

      const responseText = response.text?.trim() || "";

      // 7. Extract citations based on context chunks referenced in answer
      const citations: Array<{ title: string; slug?: string; sourceType?: string }> = [];
      if (request.contextChunks && request.contextChunks.length > 0) {
        for (const chunk of request.contextChunks) {
          if (
            responseText.toLowerCase().includes(chunk.title.toLowerCase()) ||
            (chunk.slug && responseText.includes(chunk.slug))
          ) {
            citations.push({
              title: chunk.title,
              slug: chunk.slug || undefined,
              sourceType: chunk.sourceType,
            });
          }
        }
      }

      return {
        content: responseText,
        citations: citations.length > 0 ? citations : undefined,
        tokenCount: response.usageMetadata?.totalTokenCount,
      };
    } catch (err: any) {
      console.error("Gemini API generateContent error:", err?.message || err);
      const parsed = this.mapGeminiError(err);

      // Return user-friendly fiduciary fallback response
      let fallbackMsg =
        "Our digital wealth concierge is momentarily unable to process this request. For immediate assistance, our private wealth directors can be reached at +91 98765 43210.";

      if (parsed.status === "RATE_LIMITED") {
        fallbackMsg =
          language === "hi"
            ? "हमारे सलाहकार सर्वर पर इस समय भारी ट्रैफिक है। कृपया थोड़ी देर बाद पुनः प्रयास करें या हमें ईमेल करें।"
            : "Our advisory desk is currently experiencing high demand. Please try again in a moment, or request a callback.";
      }

      return {
        content: fallbackMsg,
        isFlagged: true,
        flagReason: parsed.status,
      };
    }
  }

  /**
   * Maps raw Gemini SDK / HTTP error objects to safe categorized status codes and messages
   */
  private mapGeminiError(err: any): { status: ConnectionStatus; userMessage: string } {
    const msg = String(err?.message || err || "").toLowerCase();
    const status = err?.status || err?.statusCode || 0;

    if (
      status === 401 ||
      status === 403 ||
      msg.includes("api_key_invalid") ||
      msg.includes("api key not valid") ||
      msg.includes("permission_denied") ||
      msg.includes("unauthenticated")
    ) {
      return {
        status: "INVALID_KEY",
        userMessage: "Authentication failed. The provided GEMINI_API_KEY is invalid or unauthorized.",
      };
    }

    if (
      status === 429 ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota") ||
      msg.includes("rate limit")
    ) {
      return {
        status: "RATE_LIMITED",
        userMessage: "Google Gemini quota exhausted or rate limit reached (429).",
      };
    }

    if (
      status === 404 ||
      msg.includes("not_found") ||
      msg.includes("model not found") ||
      msg.includes("is not supported")
    ) {
      return {
        status: "MODEL_UNAVAILABLE",
        userMessage: `Configured model (${this.defaultModel}) is not available or not permitted for this API key.`,
      };
    }

    if (msg.includes("timeout") || msg.includes("aborted") || msg.includes("etimedout")) {
      return {
        status: "TIMEOUT",
        userMessage: "Connection to Google Gemini timed out after the request threshold.",
      };
    }

    return {
      status: "ERROR",
      userMessage: `Gemini service error: ${err?.message || "Unknown error"}`,
    };
  }
}
