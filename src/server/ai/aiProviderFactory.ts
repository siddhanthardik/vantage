import { AiProviderAdapter } from "./types";
import { GeminiAdapter } from "./geminiAdapter";
import { MockAiAdapter } from "./mockAdapter";

let geminiInstance: GeminiAdapter | null = null;
let mockInstance: MockAiAdapter | null = null;

/**
 * Returns the appropriate AI provider instance.
 * Defaults to Google Gemini. Falls back to Mock provider when explicitly requested
 * or in automated test environments.
 */
export function getAiProvider(forcedType?: "gemini" | "mock"): AiProviderAdapter {
  if (forcedType === "mock" || process.env.USE_MOCK_AI === "true") {
    if (!mockInstance) {
      mockInstance = new MockAiAdapter();
    }
    return mockInstance;
  }

  // Google Gemini is the official selected provider
  if (!geminiInstance) {
    geminiInstance = new GeminiAdapter();
  }
  return geminiInstance;
}
