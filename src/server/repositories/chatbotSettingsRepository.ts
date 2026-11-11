import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/security/audit";
import { ChatbotSettings } from "@prisma/client";

export const DEFAULT_CHATBOT_SETTINGS = {
  id: "default",
  botName: "Soumya",
  isEnabled: true,
  welcomeMessageEn:
    "Hello! I'm Soumya, your AI Wealth Relationship Assistant at Vantage Wealth. How may I assist you with your financial goals or questions today?",
  welcomeMessageHi:
    "नमस्ते! मैं सौम्या हूँ, वैनटेज वेल्थ में आपकी एआई वेल्थ रिलेशनशिप असिस्टेंट। आज मैं आपके वित्तीय लक्ष्यों या निवेश से जुड़े सवालों में कैसे मदद कर सकती हूँ?",
  disclaimerEn:
    "Soumya provides general financial and educational guidance. Specific investment mandates and regulated portfolio management are provided through tailored consultations with our authorized advisors.",
  disclaimerHi:
    "सौम्या सामान्य वित्तीय और शैक्षिक मार्गदर्शन प्रदान करती हैं। विशिष्ट निवेश और पोर्टफोलियो प्रबंधन हमारे अधिकृत सलाहकारों के परामर्श द्वारा किया जाता है।",
  systemInstructions:
    "You are Soumya, Vantage Wealth's AI Wealth Relationship Assistant. You are warm, intelligent, composed, approachable, discreet, professional, and naturally conversational. You explain financial concepts in simple everyday language. Your guiding principle is: 'Understand the person first. Understand their financial needs second. Help them take the right next step.'",
  salesInstructions:
    "Help visitors understand how Vantage Wealth's services (Portfolio Management / PMS, Mutual Funds, Retirement Planning, Family Office / Estate Succession, Insurance, Tax, and Financing) can meet their needs. When genuine interest is shown in personalized guidance, naturally invite them to request a callback or consultation with an advisor without pressure.",
  qualificationInstructions:
    "Understand the person's goals, time horizon, and situation naturally. Ask only one question at a time. Never interrogate visitors or demand immediate contact details.",
  financialSafetyInstructions:
    "Do not provide individual stock tips, entry/exit prices, or short-term trading calls. Do not give generic asset allocation percentages disguised as personal advice. Do not promise or imply guaranteed returns for market-linked investments. Speak calmly and objectively without fear-based language.",
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
        existing.systemInstructions?.includes("fiduciary-conscious")
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
