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
  Clock,
  Eye,
  CalendarOff,
  Headset,
  Send,
  Phone,
  Palette,
} from "lucide-react";

export default function ChatSettingsAndInstructionsPage() {
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
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHoursStart: "09:30",
    workingHoursEnd: "18:30",
    timezone: "Asia/Kolkata",
    temporaryUnavailable: false,
    unavailabilityReason: "",
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
        setNotification({
          type: "success",
          text: "Chatbot identity, instructions, appearance, and holiday settings successfully saved!",
        });
      } else {
        setNotification({ type: "error", text: data.error || "Failed to save settings." });
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
        <RefreshCw className="w-4 h-4 animate-spin text-[#B08D57] mr-2" /> Loading chatbot settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-semibold text-[#172B46] tracking-tight leading-tight">
            Chatbot Settings &amp; Custom Instructions
          </h1>
          <p className="text-[13px] text-stone-600 mt-1">
            Manage assistant identity, holiday &amp; offline mode, welcome messages, fiduciary persona, and live widget presentation.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-[#172B46] hover:bg-[#253f63] rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#B08D57]" />
          {isSaving ? "Saving Settings..." : "Save All Settings"}
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700 text-base leading-none">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration Columns (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Assistant Identity & Status */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
              <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
                <Sparkles className="w-4 h-4 text-[#B08D57]" />
                Assistant Identity &amp; Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Assistant Display Name (Bot Name)
                  </label>
                  <input
                    type="text"
                    value={settings.botName || ""}
                    onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                    placeholder="e.g. George, Vantage Wealth Assistant"
                    required
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Displayed in the chat drawer header, tooltips, and floating launcher badge.
                  </p>
                </div>

                <div className="flex flex-col justify-center pt-1">
                  <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="checkbox"
                      id="bot-enabled"
                      checked={settings.isEnabled ?? true}
                      onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                      className="accent-[#B08D57] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="bot-enabled" className="text-xs font-semibold text-[#172B46] cursor-pointer">
                      Assistant Enabled (Live on Website)
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 px-1">
                    Uncheck to completely hide the floating chat launcher across all public pages.
                  </p>
                </div>
              </div>

              {/* Holiday & Temporary Closure Mode */}
              <div className="pt-2 border-t border-stone-100">
                <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="temp-unavail"
                      checked={settings.temporaryUnavailable ?? false}
                      onChange={(e) => setSettings({ ...settings, temporaryUnavailable: e.target.checked })}
                      className="accent-[#B08D57] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="temp-unavail" className="text-xs font-bold text-amber-950 flex items-center gap-1.5 cursor-pointer">
                      <CalendarOff className="w-4 h-4 text-[#B08D57]" />
                      Put Assistant on Holiday / Temporary Closure Mode
                    </label>
                  </div>

                  {settings.temporaryUnavailable && (
                    <div className="pl-6 space-y-1.5">
                      <label className="text-[11px] font-semibold text-amber-900 block">
                        Holiday / Temporary Closure Notice Message
                      </label>
                      <input
                        type="text"
                        value={settings.unavailabilityReason || ""}
                        onChange={(e) => setSettings({ ...settings, unavailabilityReason: e.target.value })}
                        placeholder="Our advisory desk is observing a scheduled holiday. Callback requests will be addressed promptly when operations resume."
                        className="w-full text-xs p-2 rounded border border-amber-300 bg-white text-stone-800 focus:outline-none focus:border-[#B08D57]"
                      />
                      <p className="text-[10.5px] text-amber-800">
                        This notice will appear at the top of the chat widget during holiday periods. Visitors can still request callbacks.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Welcome Messages */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
              <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
                <MessageSquare className="w-4 h-4 text-[#B08D57]" />
                Welcome Messages
              </h3>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Initial English Welcome Message
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
                  Hindi Welcome Message (Displayed if visitor communicates in Hindi)
                </label>
                <textarea
                  rows={2}
                  value={settings.welcomeMessageHi || ""}
                  onChange={(e) => setSettings({ ...settings, welcomeMessageHi: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                />
              </div>
            </div>

            {/* 3. System Instructions & Tone */}
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
                    Sales &amp; Fiduciary Positioning
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

            {/* 4. Safety & Compliance */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
              <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
                <ShieldAlert className="w-4 h-4 text-[#B08D57]" />
                Financial Safety &amp; Disclaimers
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
          </div>

          {/* Right Column: Live Interactive Widget Preview */}
          <div className="space-y-4">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#B08D57]" />
                  Live Widget Interactive Preview
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#B08D57]/15 text-[#B08D57] px-2 py-0.5 rounded">
                  Real-time
                </span>
              </div>

              {/* Simulated Chat Drawer */}
              <div className="w-full rounded-2xl bg-[#F7F5F0] border border-[#B08D57]/40 shadow-lg overflow-hidden flex flex-col font-sans">
                {/* Header */}
                <div className="bg-[#172B46] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-[#B08D57]/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A975] via-[#B08D57] to-[#91703E] flex items-center justify-center shrink-0">
                      <Headset className="w-3.5 h-3.5 text-[#172B46]" />
                    </div>
                    <span className="text-[13px] font-semibold text-white truncate">
                      {settings.botName || "Vantage Wealth Assistant"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                {/* Holiday notice if active */}
                {settings.temporaryUnavailable && (
                  <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[10.5px] text-amber-900 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">Notice:</span>
                    <span className="leading-tight">
                      {settings.unavailabilityReason || "Our advisory desk is currently observing a scheduled holiday."}
                    </span>
                  </div>
                )}

                {/* Body Preview */}
                <div className="p-3.5 space-y-2.5 min-h-[220px] max-h-[300px] overflow-y-auto text-[12.5px] leading-relaxed">
                  {/* Assistant Bubble */}
                  <div className="max-w-[88%] bg-white text-[#172B46] border-l-2 border-l-[#B08D57] p-3 rounded-xl shadow-2xs border border-stone-200/70">
                    <p className="whitespace-pre-line text-[12px] leading-relaxed">
                      {settings.welcomeMessageEn ||
                        "Welcome to Vantage Wealth. How may I assist with your wealth planning, portfolio management, or advisory needs today?"}
                    </p>
                  </div>

                  {/* Sample User Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#172B46] text-white p-2.5 rounded-xl text-[12px] shadow-2xs">
                      Can you explain your Discretionary PMS services?
                    </div>
                  </div>

                  {/* Sample Response */}
                  <div className="max-w-[88%] bg-white text-[#172B46] border-l-2 border-l-[#B08D57] p-3 rounded-xl shadow-2xs border border-stone-200/70">
                    <p className="text-[12px] leading-relaxed">
                      Vantage Wealth provides active, multi-asset Discretionary PMS designed for capital preservation and compounding. Statutory ticket size begins at ₹50 Lakhs.
                    </p>
                  </div>
                </div>

                {/* Quick Action Bar Preview */}
                <div className="px-3 py-1.5 bg-stone-100/80 border-t border-stone-200/80 flex justify-end items-center text-[11px]">
                  <span className="text-[#B08D57] font-medium flex items-center gap-1 text-[11px]">
                    <Phone className="w-2.5 h-2.5" /> Request Callback
                  </span>
                </div>

                {/* Fake Input */}
                <div className="p-2.5 bg-white border-t border-stone-200/80 flex items-center gap-1.5">
                  <div className="flex-1 text-[12px] px-3 py-1.5 bg-[#F7F5F0] rounded-lg border border-stone-200 text-stone-400">
                    Ask a question...
                  </div>
                  <div className="p-1.5 bg-[#172B46] text-white rounded-lg">
                    <Send className="w-3.5 h-3.5 text-[#B08D57]" />
                  </div>
                </div>
              </div>

              {/* Status Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs space-y-2">
                <h4 className="font-semibold text-[#172B46] text-[12px]">Configuration Status</h4>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Assistant Name:</span>
                  <span className="font-medium text-[#172B46]">{settings.botName || "Default"}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Launcher Status:</span>
                  <span className={`font-semibold ${settings.isEnabled ? "text-emerald-600" : "text-stone-400"}`}>
                    {settings.isEnabled ? "Live (Visible)" : "Hidden"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Holiday Mode:</span>
                  <span className={`font-semibold ${settings.temporaryUnavailable ? "text-amber-600" : "text-emerald-600"}`}>
                    {settings.temporaryUnavailable ? "Holiday Active" : "Normal Operation"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#172B46] hover:bg-[#253f63] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving Configuration..." : "Save All Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
