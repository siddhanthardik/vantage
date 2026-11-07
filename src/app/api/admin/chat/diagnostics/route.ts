import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { testGeminiConnection } from "@/server/services/chatDiagnosticsService";
import { DEFAULT_GEMINI_MODEL } from "@/server/ai/geminiAdapter";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  return NextResponse.json({
    success: true,
    diagnostics: {
      provider: "Google Gemini",
      sdk: "@google/genai",
      configuredModel: model,
      hasApiKey,
      keyEnvironmentVariable: "GEMINI_API_KEY",
      keyMasked: hasApiKey ? "••••••••••••••••" : "Not configured in .env.local",
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const result = await testGeminiConnection();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("Diagnostic test error:", err);
    return NextResponse.json(
      {
        success: false,
        result: {
          ok: false,
          provider: "Google Gemini",
          model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
          status: "ERROR",
          message: err?.message || "Diagnostic test encountered an unexpected exception.",
        },
      },
      { status: 500 }
    );
  }
}
