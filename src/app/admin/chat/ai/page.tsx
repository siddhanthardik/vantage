"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Shield,
  Key,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export default function AiDiagnosticsPage() {
  const [config, setConfig] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function loadConfig() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/chat/diagnostics");
      const data = await res.json();
      if (data.success) {
        setConfig(data.diagnostics);
      }
    } catch (e) {
      console.error("Failed to load AI diagnostics:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function runConnectionTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/chat/diagnostics", {
        method: "POST",
      });
      const data = await res.json();
      setTestResult(data.result);
    } catch (e: any) {
      setTestResult({
        ok: false,
        status: "ERROR",
        message: e?.message || "Failed to reach server diagnostics handler.",
      });
    } finally {
      setIsTesting(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            AI Configuration &amp; Diagnostics
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Diagnostic verification of Google Gemini Developer API integration, model health, and latency.
          </p>
        </div>

        <button
          onClick={runConnectionTest}
          disabled={isTesting}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#172B46] hover:bg-[#253f63] rounded-sm transition-colors shadow-2xs disabled:opacity-50"
        >
          <Activity className={`w-3.5 h-3.5 text-[#B08D57] ${isTesting ? "animate-spin" : ""}`} />
          {isTesting ? "Testing Connection..." : "Run Connection Test"}
        </button>
      </div>

      {/* Provider Details Card */}
      <div className="bg-white p-5 rounded-sm border border-stone-200/80 shadow-2xs space-y-4">
        <h2 className="text-[16px] lg:text-[18px] font-semibold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
          <Cpu className="w-4 h-4 text-[#B08D57]" />
          Provider Architecture &amp; Environment
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#F7F5F0] rounded-sm border border-stone-200">
            <span className="text-stone-500 block text-[11px] uppercase tracking-wider font-medium">AI Provider</span>
            <span className="font-semibold text-[#172B46] text-[15px] flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#B08D57]" />
              {config?.provider || "Google Gemini"}
            </span>
            <span className="text-[12px] text-stone-600 block mt-1">
              Google AI Studio Developer API via official SDK ({config?.sdk || "@google/genai"})
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F5F0] rounded-sm border border-stone-200">
            <span className="text-stone-500 block text-[11px] uppercase tracking-wider font-medium">Active Model</span>
            <span className="font-semibold text-[#172B46] text-[15px] font-mono mt-0.5 block">
              {config?.configuredModel || "gemini-3.8-flash"}
            </span>
            <span className="text-[12px] text-stone-600 block mt-1">
              Configured via GEMINI_MODEL (1M token context window)
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F5F0] rounded-sm border border-stone-200">
            <span className="text-stone-500 block text-[11px] uppercase tracking-wider font-medium">Authentication Mechanism</span>
            <span className="font-semibold text-[#172B46] text-[14px] block mt-0.5">
              Native Gemini API Key Authentication
            </span>
            <span className="text-[12px] text-stone-600 block mt-1">
              Key variable: <code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">{config?.keyEnvironmentVariable}</code>
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F5F0] rounded-sm border border-stone-200">
            <span className="text-stone-500 block text-[11px] uppercase tracking-wider font-medium">API Key Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Key className="w-3.5 h-3.5 text-[#B08D57]" />
              <span className="font-mono text-[13px] font-semibold text-[#172B46]">
                {config?.keyMasked}
              </span>
            </div>
            <span className="text-[12px] text-stone-600 block mt-1">
              {config?.hasApiKey
                ? "Key detected in server environment."
                : "Add GEMINI_API_KEY to your local .env.local file."}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Test Diagnostics Result */}
      {testResult && (
        <div
          className={`p-5 rounded-sm border shadow-2xs space-y-3 ${
            testResult.ok
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : "bg-red-50/70 border-red-200 text-red-950"
          }`}
        >
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <div className="flex items-center gap-2">
              {testResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="font-semibold text-[15px]">
                Diagnostic Result: {testResult.status}
              </h3>
            </div>

            {testResult.latencyMs !== undefined && (
              <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-black/5">
                Latency: {testResult.latencyMs}ms
              </span>
            )}
          </div>

          <p className="text-[14px] leading-relaxed">{testResult.message}</p>

          <div className="text-[12px] opacity-80 pt-1">
            <span>Provider: {testResult.provider}</span> • <span>Model: {testResult.model}</span>
          </div>
        </div>
      )}

      {/* Technical Notes Card */}
      <div className="bg-white p-5 rounded-sm border border-stone-200/80 shadow-2xs text-[13px] space-y-2 text-stone-600">
        <h3 className="font-semibold text-[#172B46] text-[13px] uppercase tracking-wider">
          Security &amp; Operational Architecture
        </h3>
        <ul className="list-disc pl-4 space-y-1 text-[13px] text-stone-600">
          <li>All calls to Google Gemini are made server-to-server from the Next.js backend runtime.</li>
          <li>Visitor browser requests communicate solely with our own Next.js endpoints (<code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">/api/chat/*</code>).</li>
          <li>All user prompts are sanitized server-side, removing email, phone, PAN, and Aadhaar numbers prior to LLM dispatch.</li>
          <li>Zero browser-side API keys or client credential exposure.</li>
        </ul>
      </div>
    </div>
  );
}
