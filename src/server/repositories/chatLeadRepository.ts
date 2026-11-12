import { prisma } from "@/lib/db/prisma";
import {
  ChatLead,
  LeadQualificationStatus,
  CallbackPreferredMethod,
  ConversationStatus,
  EnquiryStatus,
  EnquiryType,
} from "@prisma/client";

export interface UpsertLeadInput {
  conversationId: string;
  status?: LeadQualificationStatus;
  fullName?: string;
  email?: string;
  phone?: string;
  preferredMethod?: CallbackPreferredMethod;
  preferredTimeWindow?: string;
  financialObjective?: string;
  portfolioSize?: string;
  notes?: string;
  qualificationScore?: number;
  urgency?: string;
  advisorSummary?: string;
  consentGiven?: boolean;
  consentTimestamp?: Date;
  consentIpHash?: string;
}

export interface ListLeadsOptions {
  status?: LeadQualificationStatus;
  limit?: number;
  offset?: number;
}

/**
 * Repository for managing ChatLead entities and their progression in PostgreSQL
 */
export const chatLeadRepository = {
  /**
   * Upsert a lead associated with a conversation
   */
  async upsertLead(input: UpsertLeadInput): Promise<ChatLead> {
    const dataToSet: Record<string, any> = {};

    if (input.fullName !== undefined) dataToSet.fullName = input.fullName ? input.fullName.trim() : null;
    if (input.email !== undefined) dataToSet.email = input.email ? input.email.trim().toLowerCase() : null;
    if (input.phone !== undefined) dataToSet.phone = input.phone ? input.phone.trim() : null;
    if (input.preferredMethod !== undefined) dataToSet.preferredMethod = input.preferredMethod;
    if (input.preferredTimeWindow !== undefined) dataToSet.preferredTimeWindow = input.preferredTimeWindow;
    if (input.financialObjective !== undefined) dataToSet.financialObjective = input.financialObjective;
    if (input.portfolioSize !== undefined) dataToSet.portfolioSize = input.portfolioSize;
    if (input.status !== undefined) dataToSet.status = input.status;
    if (input.qualificationScore !== undefined) dataToSet.qualificationScore = input.qualificationScore;
    if (input.urgency !== undefined) dataToSet.urgency = input.urgency;
    if (input.advisorSummary !== undefined) dataToSet.advisorSummary = input.advisorSummary;
    if (input.notes !== undefined) dataToSet.notes = input.notes;
    if (input.consentGiven !== undefined) dataToSet.consentGiven = input.consentGiven;
    if (input.consentTimestamp !== undefined) dataToSet.consentTimestamp = input.consentTimestamp;
    if (input.consentIpHash !== undefined) dataToSet.consentIpHash = input.consentIpHash;

    return prisma.chatLead.upsert({
      where: { conversationId: input.conversationId },
      create: {
        conversationId: input.conversationId,
        status: LeadQualificationStatus.COLLECTING,
        ...dataToSet,
      },
      update: dataToSet,
    });
  },

  /**
   * Find lead by conversation ID with history events and enquiry linkage
   */
  async getLeadByConversationId(conversationId: string) {
    return prisma.chatLead.findUnique({
      where: { conversationId },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          include: {
            adminUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        enquiry: true,
      },
    });
  },

  /**
   * Find lead by ID
   */
  async getLeadById(id: string) {
    return prisma.chatLead.findUnique({
      where: { id },
      include: {
        conversation: true,
        events: {
          orderBy: { createdAt: "desc" },
          include: {
            adminUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        enquiry: true,
      },
    });
  },

  /**
   * Record explicit contact consent with timestamp and IP hash
   */
  async recordContactConsent(conversationId: string, consentIpHash: string): Promise<ChatLead> {
    const now = new Date();
    return prisma.chatLead.upsert({
      where: { conversationId },
      create: {
        conversationId,
        consentGiven: true,
        consentTimestamp: now,
        consentIpHash,
      },
      update: {
        consentGiven: true,
        consentTimestamp: now,
        consentIpHash,
      },
    });
  },

  /**
   * Update lead qualification status and log an audit event in a transaction
   */
  async updateQualification(
    leadId: string,
    status: LeadQualificationStatus,
    adminUserId?: string,
    note?: string
  ): Promise<ChatLead> {
    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: { status },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: `STATUS_CHANGE_TO_${status}`,
          metadata: note ? { note } : {},
        },
      });

      return updated;
    });
  },

  /**
   * Convert an authorized ChatLead to an operational Enquiry record.
   * Executed within a strict PostgreSQL transaction.
   */
  async convertToEnquiry(leadId: string, adminUserId?: string) {
    return prisma.$transaction(async (tx: any) => {
      const lead = await tx.chatLead.findUnique({
        where: { id: leadId },
        include: { conversation: true },
      });

      if (!lead) {
        throw new Error(`ChatLead with ID ${leadId} not found`);
      }

      if (lead.enquiryId) {
        throw new Error(`ChatLead ${leadId} has already been converted to Enquiry ${lead.enquiryId}`);
      }

      const fullName = lead.fullName || "Prospective Client (via Assistant)";
      const email = lead.email || "pending-email@vantage.local";
      const phone = lead.phone || "Not provided";
      const notes = [
        `Captured via Vantage Wealth Assistant.`,
        lead.financialObjective ? `Objective: ${lead.financialObjective}` : null,
        lead.portfolioSize ? `Portfolio Bracket: ${lead.portfolioSize}` : null,
        lead.preferredMethod ? `Preferred Contact: ${lead.preferredMethod}` : null,
        lead.preferredTimeWindow ? `Time Window: ${lead.preferredTimeWindow}` : null,
        lead.notes ? `User Notes: ${lead.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      // Create new Enquiry record
      const enquiry = await tx.enquiry.create({
        data: {
          type: EnquiryType.CONSULTATION,
          fullName,
          email,
          phone,
          preferredMode: lead.preferredMethod === CallbackPreferredMethod.PHONE ? "PHONE" : "EMAIL",
          preferredTime: lead.preferredTimeWindow || null,
          subject: `Chatbot Lead: ${lead.financialObjective || "Private Wealth Consultation"}`,
          message: notes,
          status: EnquiryStatus.NEW,
          createdAt: new Date(),
        },
      });

      // Update lead with enquiry link and converted status
      const updatedLead = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          enquiryId: enquiry.id,
          status: LeadQualificationStatus.CONVERTED_TO_ENQUIRY,
        },
      });

      // Update conversation status
      if (lead.conversationId) {
        await tx.chatConversation.update({
          where: { id: lead.conversationId },
          data: { status: ConversationStatus.CONVERTED },
        });
      }

      // Record lead event
      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "CONVERTED_TO_ENQUIRY",
          metadata: {
            enquiryId: enquiry.id,
            enquiryType: enquiry.type,
          },
        },
      });

      return { lead: updatedLead, enquiry };
    });
  },

  /**
   * List leads with filtering and pagination
   */
  async listLeads(options: ListLeadsOptions = {}) {
    const { status, limit = 50, offset = 0 } = options;
    const where = status ? { status } : {};

    const [total, items] = await prisma.$transaction([
      prisma.chatLead.count({ where }),
      prisma.chatLead.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          conversation: {
            select: {
              id: true,
              messageCount: true,
              language: true,
              createdAt: true,
            },
          },
          enquiry: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return { total, items, limit, offset };
  },
};
