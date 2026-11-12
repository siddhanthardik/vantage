/**
 * VANTAGE WEALTH ASSISTANT — AI PROVIDER ABSTRACTION LAYER
 * Defines provider-independent contracts for LLM inference, streaming, and connection diagnostics.
 */

export interface ChatMessageTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GroundedContextChunk {
  id?: string;
  title: string;
  content: string;
  sourceType: string;
  slug?: string | null;
}

export interface GenerateAiResponseRequest {
  messages: ChatMessageTurn[];
  contextChunks?: GroundedContextChunk[];
  systemInstruction?: string;
  conversationMemoryPrompt?: string;
  tacticalActionPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  language?: "en" | "hi" | "hinglish";
}

export interface GenerateAiResponseResult {
  content: string;
  tokenCount?: number;
  citations?: Array<{ title: string; slug?: string; sourceType?: string }>;
  isFlagged?: boolean;
  flagReason?: string;
}

export type ConnectionStatus =
  | "CONNECTED"
  | "UNCONFIGURED"
  | "INVALID_KEY"
  | "RATE_LIMITED"
  | "MODEL_UNAVAILABLE"
  | "TIMEOUT"
  | "ERROR";

export interface ConnectionTestResult {
  ok: boolean;
  provider: string;
  model: string;
  status: ConnectionStatus;
  message: string;
  latencyMs?: number;
}

/**
 * Common provider-independent adapter interface.
 * Decouples conversation management from specific LLM vendors (Google Gemini, etc.).
 */
export interface AiProviderAdapter {
  readonly name: string;
  readonly defaultModel: string;

  /**
   * Generates a grounded response based on user turns and retrieved context chunks
   */
  generateResponse(request: GenerateAiResponseRequest): Promise<GenerateAiResponseResult>;

  /**
   * Diagnostic connection test to verify credentials and model reachability
   * without revealing sensitive API keys or credentials.
   */
  testConnection(): Promise<ConnectionTestResult>;
}
