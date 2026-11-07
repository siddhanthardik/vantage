"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Palette,
  Save,
  Clock,
  Headset,
  Phone,
  Eye,
  ShieldAlert,
  Send,
  MessageSquare,
} from "lucide-react";

export default function ChatAppearancePage() {
  const [settings, setSettings] = useState<any>({
    botName: "Vantage Wealth Assistant",
    isEnabled: true,
    welcomeMessageEn: "",
    disclaimerEn: "",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHoursStart: "09:30",
    workingHoursEnd: "18:30",
    timezone: "Asia/Kolkata",
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
        setNotification({ type: "success", text: "Appearance, hours, and branding settings saved!" });
      } else {
        setNotification({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch (e) {
      setNotification({ type: "error", text: "Save request failed." });
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-sans text-2xl font-bold text-[#172B46]">Chatbot Appearance & Behaviour</h1>
          <p className="text-xs text-stone-600 mt-1">
            Customize the public widget presentation, advisory business hours, and preview live widget rendering.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#172B46] hover:bg-[#253f63] rounded-lg transition-colors shadow-2xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-[#B08D57]" />
          {isSaving ? "Saving Settings..." : "Save Appearance"}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
              <Palette className="w-4 h-4 text-[#B08D57]" />
              Widget Branding
            </h3>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Bot Name (Displayed in Header & Launcher)
              </label>
              <input
                type="text"
                value={settings.botName || ""}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Public Welcome Text
              </label>
              <textarea
                rows={3}
                value={settings.welcomeMessageEn || ""}
                onChange={(e) => setSettings({ ...settings, welcomeMessageEn: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                required
              />
            </div>
          </div>

          {/* Business Callback Hours */}
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2 border-b border-stone-100 pb-2">
              <Clock className="w-4 h-4 text-[#B08D57]" />
              Advisory Desk Business Hours
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Start Time (24h)</label>
                <input
                  type="text"
                  value={settings.workingHoursStart || "09:30"}
                  onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">End Time (24h)</label>
                <input
                  type="text"
                  value={settings.workingHoursEnd || "18:30"}
                  onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-stone-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Timezone</label>
              <input
                type="text"
                value={settings.timezone || "Asia/Kolkata"}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full text-xs p-2 rounded border border-stone-300"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="temp-unavail"
                checked={settings.temporaryUnavailable ?? false}
                onChange={(e) => setSettings({ ...settings, temporaryUnavailable: e.target.checked })}
                className="accent-[#B08D57] w-4 h-4"
              />
              <label htmlFor="temp-unavail" className="text-xs font-semibold text-stone-700">
                Mark Advisory Desk as Temporarily Closed (Holidays / Emergency)
              </label>
            </div>
          </div>
        </form>

        {/* Live Visual Widget Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-bold text-[#172B46] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#B08D57]" />
              Live Widget Interactive Preview
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              Responsive Preview
            </span>
          </div>

          <div className="bg-[#EFECE6] p-6 rounded-2xl border border-stone-300 flex items-center justify-center min-h-[580px]">
            {/* Mocked Chat Window */}
            <div className="w-[360px] bg-[#F7F5F0] rounded-2xl shadow-xl border border-[#B08D57]/40 overflow-hidden flex flex-col h-[520px]">
              {/* Header */}
              <div className="bg-[#172B46] text-white px-4 py-3 flex items-center justify-between border-b border-[#B08D57]/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-[#B08D57]/50 flex items-center justify-center">
                    <Headset className="w-3.5 h-3.5 text-[#B08D57]" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-white">
                      {settings.botName || "Vantage Wealth Assistant"}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                <div className="bg-white text-[#172B46] p-3 rounded-xl border-l-2 border-l-[#B08D57] border border-stone-200/60 shadow-2xs text-[12px] leading-relaxed">
                  {settings.welcomeMessageEn || "Hello! Welcome to Vantage Wealth."}
                </div>

                <div className="flex justify-end">
                  <div className="bg-[#172B46] text-white p-2.5 rounded-xl text-[12px] max-w-[80%]">
                    Can you explain your Discretionary PMS services?
                  </div>
                </div>

                <div className="bg-white text-[#172B46] p-3 rounded-xl border-l-2 border-l-[#B08D57] border border-stone-200/60 shadow-2xs text-[12px] leading-relaxed">
                  Vantage Wealth provides active, multi-asset Discretionary PMS designed for capital preservation and compounding. Statutory ticket size begins at ₹50 Lakhs.
                </div>
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-white border-t border-stone-200">
                <div className="flex items-center gap-1.5 bg-[#F7F5F0] rounded-lg px-2.5 py-1.5 border border-stone-200">
                  <span className="text-xs text-stone-400 flex-1">Ask a question...</span>
                  <Send className="w-3.5 h-3.5 text-[#B08D57]" />
                </div>
                <p className="text-[8px] text-stone-400 text-center mt-1">
                  SEBI regulated advisory • Informational Assistant
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
