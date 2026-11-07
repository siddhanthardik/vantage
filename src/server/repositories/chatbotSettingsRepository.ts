import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/security/audit";
import { ChatbotSettings } from "@prisma/client";

export const DEFAULT_CHATBOT_SETTINGS = {
  id: "default",
  botName: "Vantage Wealth Assistant",
  isEnabled: true,
  welcomeMessageEn:
    "Welcome to Vantage Wealth. How may I assist with your wealth planning, portfolio management, or advisory needs today?",
  welcomeMessageHi:
    "वैनटेज वेल्थ में आपका स्वागत है। आज मैं आपकी संपत्ति प्रबंधन, पोर्टफोलियो या वित्तीय परामर्श में क्या सहायता कर सकता हूँ?",
  disclaimerEn:
    "Vantage Wealth Assistant provides general informational guidance on our services and capabilities. It does not provide individualized financial advice, return guarantees, or stock tips. Regulated investment advisory and portfolio management are provided exclusively by authorized private wealth managers.",
  disclaimerHi:
    "वैनटेज वेल्थ असिस्टेंट केवल सेवाओं की सामान्य जानकारी प्रदान करता है। यह व्यक्तिगत निवेश सलाह या शेयर टिप्स नहीं देता है। विनियमित निवेश सेवाएं केवल अधिकृत वेल्थ मैनेजरों द्वारा दी जाती हैं।",
  systemInstructions:
    "You are the official digital concierge for Vantage Wealth, an elite private wealth management advisory firm serving high-net-worth individuals, entrepreneurs, and multi-generational families in India. Your demeanor is discreet, highly professional, fiduciary-conscious, and polished. You strictly refuse speculative stock tips or crypto advice.",
  salesInstructions:
    "Highlight Vantage Wealth's core specializations: Discretionary Portfolio Management, Estate & Succession Planning, Family Office Governance, and Alternative Investments. When prospective clients indicate meaningful asset planning needs, offer to arrange a confidential discussion with our private wealth directors.",
  qualificationInstructions:
    "Seek to understand: (1) Primary financial objective (growth, capital preservation, succession), (2) Timeline, and (3) General portfolio tier (e.g., ₹5 Cr+). Do not interrogate visitors. Inquire gracefully only after establishing conversational relevance.",
  financialSafetyInstructions:
    "Strict negative constraints: (1) Never recommend individual equity tickers or penny stocks. (2) Never guarantee returns. (3) Never endorse cryptocurrencies or unregulated contracts. (4) Remind visitors that investments are subject to market risks.",
  supportedLanguages: ["en", "hi", "hinglish"],
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  workingHoursStart: "09:30",
  workingHoursEnd: "18:30",
  timezone: "Asia/Kolkata",
  holidays: [],
  temporaryUnavailable: false,
  unavailabilityReason: null,
  callbackWording:
    "Our private wealth advisory desk will review your details and reach out to you during standard business hours (Monday to Friday, 9:30 AM to 6:30 PM IST).",
  maxTurnsPerSession: 30,
  rateLimitPerMinute: 8,
};

export type UpdateChatbotSettingsInput = Partial<Omit<ChatbotSettings, "id" | "createdAt" | "updatedAt">>;

/**
 * Repository for managing ChatbotSettings in PostgreSQL
 */
export const chatbotSettingsRepository = {
  /**
   * Retrieve the global ChatbotSettings singleton.
   * If not yet seeded in the database, automatically initializes with neutral default values.
   */
  async getSettings(): Promise<ChatbotSettings> {
    const existing = await prisma.chatbotSettings.findUnique({
      where: { id: "default" },
    });

    if (existing) {
      return existing;
    }

    return prisma.chatbotSettings.create({
      data: DEFAULT_CHATBOT_SETTINGS,
    });
  },

  /**
   * Update chatbot settings and record an administrative audit log event
   */
  async updateSettings(
    updates: UpdateChatbotSettingsInput,
    adminContext?: { userId?: string; userEmail?: string; ipAddress?: string }
  ): Promise<ChatbotSettings> {
    const updated = await prisma.chatbotSettings.upsert({
      where: { id: "default" },
      create: {
        ...DEFAULT_CHATBOT_SETTINGS,
        ...updates,
      },
      update: {
        ...updates,
      },
    });

    // Record audit event for administrative accountability
    await logAuditEvent({
      action: "CHATBOT_SETTINGS_UPDATE",
      entityType: "CHATBOT_SETTINGS",
      entityId: "default",
      userEmail: adminContext?.userEmail || "admin",
      ipAddress: adminContext?.ipAddress || null,
      details: {
        userId: adminContext?.userId || null,
        changedFields: Object.keys(updates),
        isEnabled: updated.isEnabled,
        workingDays: updated.workingDays,
        workingHours: `${updated.workingHoursStart} - ${updated.workingHoursEnd} ${updated.timezone}`,
      },
    });

    return updated;
  },

  /**
   * Public-safe settings view (excludes internal prompts and limits)
   */
  async getPublicSettings() {
    const settings = await this.getSettings();
    return {
      botName: settings.botName,
      isEnabled: settings.isEnabled,
      welcomeMessageEn: settings.welcomeMessageEn,
      welcomeMessageHi: settings.welcomeMessageHi,
      disclaimerEn: settings.disclaimerEn,
      disclaimerHi: settings.disclaimerHi,
      supportedLanguages: settings.supportedLanguages,
      workingDays: settings.workingDays,
      workingHoursStart: settings.workingHoursStart,
      workingHoursEnd: settings.workingHoursEnd,
      timezone: settings.timezone,
      temporaryUnavailable: settings.temporaryUnavailable,
      unavailabilityReason: settings.unavailabilityReason,
      callbackWording: settings.callbackWording,
    };
  },
};
