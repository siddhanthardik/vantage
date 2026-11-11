import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/security/audit";
import { ChatbotSettings } from "@prisma/client";

export const DEFAULT_CHATBOT_SETTINGS = {
  id: "default",
  botName: "Soumya",
  isEnabled: true,
  welcomeMessageEn:
    "Hello! I'm Soumya with Vantage Wealth. How can I help you with your wealth planning or investment questions today?",
  welcomeMessageHi:
    "नमस्ते! मैं सौम्या हूँ। आज मैं आपकी वित्तीय योजना या निवेश से जुड़े सवालों में कैसे मदद कर सकती हूँ?",
  disclaimerEn:
    "Soumya provides general financial and educational guidance. Specific investment mandates and tailored portfolio advice are provided through consultations with our authorized wealth advisors.",
  disclaimerHi:
    "सौम्या सामान्य वित्तीय और शैक्षिक मार्गदर्शन प्रदान करती हैं। विशिष्ट निवेश और व्यक्तिगत सलाह हमारे अधिकृत सलाहकारों के परामर्श द्वारा की जाती है।",
  systemInstructions:
    "You are Soumya, Vantage Wealth's AI Wealth Relationship Assistant. You speak like an experienced, approachable wealth relationship manager. You are warm, confident, empathetic, intelligent, and naturally conversational. You explain financial concepts in simple, everyday language. Your guiding principle is: 'Understand the person first. Understand their financial needs second. Help them take the right next step.' Avoid corporate marketing speak, institutional jargon, and sounding like a research paper.",
  salesInstructions:
    "Help visitors understand how Vantage Wealth's services (Mutual Funds and Investment Advisory, Retirement Planning, Risk Management & Insurance, Tax Advisory, Strategic Financing, and Ongoing Portfolio Reviews) can meet their needs. When genuine interest is shown in personalized guidance, naturally invite them to request a callback or consultation with an advisor without pressure.",
  qualificationInstructions:
    "Listen first and understand the person's goals, time horizon, and whether they are new to investing. Keep responses brief and ask only one question at a time. Never recommend specific products, asset percentages, or managed portfolios in early conversation.",
  financialSafetyInstructions:
    "Never recommend individual stocks, shares, or trading calls. Never promise or imply guaranteed returns. Never use the word 'fiduciary'. Avoid financial jargon and explain concepts in everyday language. Do not make unsupported claims about banking partnerships, automated tax-loss harvesting, or proprietary insurance.",
  supportedLanguages: ["en", "hi", "hinglish"],
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  workingHoursStart: "09:30",
  workingHoursEnd: "18:30",
  timezone: "Asia/Kolkata",
  holidays: [],
  temporaryUnavailable: false,
  unavailabilityReason: null,
  callbackWording:
    "Our wealth advisory team will get in touch with you at your preferred time to understand your requirements in detail.",
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
      // Auto-upgrade legacy default names or outdated institutional instructions to Soumya persona if untouched
      if (
        existing.botName === "Vantage Wealth Assistant" ||
        existing.botName === "George" ||
        existing.systemInstructions?.includes("fiduciary-conscious") ||
        existing.welcomeMessageEn?.includes("your AI Wealth Relationship Assistant at Vantage Wealth")
      ) {
        return prisma.chatbotSettings.update({
          where: { id: "default" },
          data: {
            botName: "Soumya",
            welcomeMessageEn: DEFAULT_CHATBOT_SETTINGS.welcomeMessageEn,
            welcomeMessageHi: DEFAULT_CHATBOT_SETTINGS.welcomeMessageHi,
            systemInstructions: DEFAULT_CHATBOT_SETTINGS.systemInstructions,
            salesInstructions: DEFAULT_CHATBOT_SETTINGS.salesInstructions,
            qualificationInstructions: DEFAULT_CHATBOT_SETTINGS.qualificationInstructions,
            financialSafetyInstructions: DEFAULT_CHATBOT_SETTINGS.financialSafetyInstructions,
            callbackWording: DEFAULT_CHATBOT_SETTINGS.callbackWording,
          },
        });
      }
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
