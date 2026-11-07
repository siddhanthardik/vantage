import { GeminiAdapter } from "../ai/geminiAdapter";
import { ConnectionTestResult } from "../ai/types";

/**
 * Server-side diagnostic service to test Google Gemini credentials and model connectivity.
 * Guarantees zero credential leakage in results or logs.
 */
export async function testGeminiConnection(): Promise<ConnectionTestResult> {
  const adapter = new GeminiAdapter();
  return adapter.testConnection();
}
