"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

export default function ChatInstructionsPage() {
  const [settings, setSettings] = useState<any>({
    botName: "Vantage Wealth Assistant",
    isEnabled: true,
    welcomeMessageEn: "",
    welcomeMessageHi: "",
    disclaimerEn: "",
    disclaimerHi: "",
    systemInstructions: "",
    salesInstructions: "",
    qualificationInstructions: "",
    financialSafetyInstructions: "",
    callbackWording: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/chat/instructions");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/chat/instructions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setNotification({ type: "success", text: "Chatbot instructions and system prompt successfully saved to PostgreSQL!" });
      } else {
        setNotification({ type: "error", text: data.error || "Failed to save instructions." });
      }
    } catch (e) {
      setNotification({ type: "error", text: "An error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-stone-500">
        <RefreshCw className="w-4 h-4 animate-spin text-[#B08D57] mr-2" /> Loading instructions...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Custom Instructions &amp; System Prompt
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Configure the fiduciary personality, sales boundaries, lead qualification guidelines, and grounding rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#172B46] hover:bg-[#253f63] rounded-sm transition-colors shadow-2xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-[#B08D57]" />
          {isSaving ? "Saving..." : "Save Instructions"}
        </button>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity & Welcome */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
          <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
            <Sparkles className="w-4 h-4 text-[#B08D57]" />
            Assistant Identity & Welcome Messages
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Assistant Display Name
              </label>
              <input
                type="text"
                value={settings.botName || ""}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="bot-enabled"
                checked={settings.isEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                className="accent-[#B08D57] w-4 h-4"
              />
              <label htmlFor="bot-enabled" className="text-xs font-semibold text-[#172B46]">
                Assistant Enabled (Public launcher is live)
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Initial English Welcome Message (Always used to open conversation)
            </label>
            <textarea
              rows={3}
              value={settings.welcomeMessageEn || ""}
              onChange={(e) => setSettings({ ...settings, welcomeMessageEn: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Hindi Welcome Message (Displayed if visitor switches to Devanagari Hindi)
            </label>
            <textarea
              rows={2}
              value={settings.welcomeMessageHi || ""}
              onChange={(e) => setSettings({ ...settings, welcomeMessageHi: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
            />
          </div>
        </div>

        {/* System Instructions & Tone */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
          <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
            <Sliders className="w-4 h-4 text-[#B08D57]" />
            Core Fiduciary System Instructions
          </h3>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Base System Prompt (Persona, Tone, Brand Identity)
            </label>
            <textarea
              rows={4}
              value={settings.systemInstructions || ""}
              onChange={(e) => setSettings({ ...settings, systemInstructions: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57] font-mono leading-relaxed"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Internal directive given to Google Gemini. Never exposed directly to public visitors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Sales & Fiduciary Positioning
              </label>
              <textarea
                rows={3}
                value={settings.salesInstructions || ""}
                onChange={(e) => setSettings({ ...settings, salesInstructions: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Lead Qualification Strategy
              </label>
              <textarea
                rows={3}
                value={settings.qualificationInstructions || ""}
                onChange={(e) => setSettings({ ...settings, qualificationInstructions: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
              />
            </div>
          </div>
        </div>

        {/* Safety & Compliance */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
          <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-[#B08D57]" />
            Financial Safety & Regulatory Disclaimers
          </h3>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Financial Safety Instructions (Negative constraints for LLM)
            </label>
            <textarea
              rows={3}
              value={settings.financialSafetyInstructions || ""}
              onChange={(e) => setSettings({ ...settings, financialSafetyInstructions: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                English Regulatory Disclaimer
              </label>
              <textarea
                rows={3}
                value={settings.disclaimerEn || ""}
                onChange={(e) => setSettings({ ...settings, disclaimerEn: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Callback Commitment Wording
              </label>
              <textarea
                rows={3}
                value={settings.callbackWording || ""}
                onChange={(e) => setSettings({ ...settings, callbackWording: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#172B46] hover:bg-[#253f63] text-white text-xs font-medium rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            {isSaving ? "Saving Configuration..." : "Save Instructions"}
          </button>
        </div>
      </form>
    </div>
  );
}
