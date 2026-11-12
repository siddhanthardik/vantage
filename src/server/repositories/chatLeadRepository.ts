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
  salesStage?: string;
  serviceInterest?: string;
  assignedAdvisor?: string;
  nextFollowUpAt?: Date | null;
  lastContactAt?: Date | null;
  consultationStatus?: string;
  consultationAt?: Date | null;
  conversionDate?: Date | null;
  closureReason?: string;
  source?: string;
  campaign?: string;
  advisorNotes?: string;
  consentGiven?: boolean;
  consentTimestamp?: Date;
  consentIpHash?: string;
}

export interface ListLeadsOptions {
  status?: LeadQualificationStatus;
  salesStage?: string;
  serviceInterest?: string;
  assignedAdvisor?: string;
  hasPendingFollowUp?: boolean;
  search?: string;
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
    if (input.salesStage !== undefined) dataToSet.salesStage = input.salesStage;
    if (input.serviceInterest !== undefined) dataToSet.serviceInterest = input.serviceInterest;
    if (input.assignedAdvisor !== undefined) dataToSet.assignedAdvisor = input.assignedAdvisor;
    if (input.nextFollowUpAt !== undefined) dataToSet.nextFollowUpAt = input.nextFollowUpAt;
    if (input.lastContactAt !== undefined) dataToSet.lastContactAt = input.lastContactAt;
    if (input.consultationStatus !== undefined) dataToSet.consultationStatus = input.consultationStatus;
    if (input.consultationAt !== undefined) dataToSet.consultationAt = input.consultationAt;
    if (input.conversionDate !== undefined) dataToSet.conversionDate = input.conversionDate;
    if (input.closureReason !== undefined) dataToSet.closureReason = input.closureReason;
    if (input.source !== undefined) dataToSet.source = input.source;
    if (input.campaign !== undefined) dataToSet.campaign = input.campaign;
    if (input.advisorNotes !== undefined) dataToSet.advisorNotes = input.advisorNotes;
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
   * List leads with filtering, sales pipeline stages, and pagination
   */
  async listLeads(options: ListLeadsOptions = {}) {
    const {
      status,
      salesStage,
      serviceInterest,
      assignedAdvisor,
      hasPendingFollowUp,
      search,
      limit = 50,
      offset = 0,
    } = options;

    const where: any = {};
    if (status) where.status = status;
    if (salesStage) where.salesStage = salesStage;
    if (serviceInterest) where.serviceInterest = serviceInterest;
    if (assignedAdvisor) where.assignedAdvisor = assignedAdvisor;
    if (hasPendingFollowUp) {
      where.nextFollowUpAt = { not: null };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { financialObjective: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.chatLead.count({ where }),
      prisma.chatLead.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
        include: {
          conversation: {
            select: {
              id: true,
              messageCount: true,
              language: true,
              createdAt: true,
              primaryIntent: true,
              visitorClass: true,
            },
          },
          enquiry: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
          events: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              adminUser: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    return { total, items, limit, offset };
  },

  /**
   * Transitions a lead's sales pipeline stage and logs event
   */
  async updateSalesStage(
    leadId: string,
    newStage: string,
    adminUserId?: string,
    note?: string
  ): Promise<ChatLead> {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.chatLead.findUniqueOrThrow({ where: { id: leadId } });

      const isConverted = newStage === "CONVERTED";
      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          salesStage: newStage,
          status: isConverted
            ? LeadQualificationStatus.CONVERTED
            : newStage === "NOT_PROCEEDING"
            ? LeadQualificationStatus.CLOSED
            : existing.status,
          conversionDate: isConverted ? new Date() : existing.conversionDate,
          lastContactAt: new Date(),
        },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "STAGE_CHANGE",
          note: note || `Sales stage moved from ${existing.salesStage || "NEW_ENQUIRY"} to ${newStage}.`,
          metadata: { previousStage: existing.salesStage, newStage },
        },
      });

      return updated;
    });
  },

  /**
   * Assigns an advisor to lead
   */
  async assignAdvisor(
    leadId: string,
    advisorName: string,
    adminUserId?: string,
    note?: string
  ): Promise<ChatLead> {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.chatLead.findUniqueOrThrow({ where: { id: leadId } });

      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          assignedAdvisor: advisorName.trim(),
          salesStage:
            existing.salesStage === "NEW_ENQUIRY" ? "INITIAL_DISCOVERY" : existing.salesStage,
        },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "ADVISOR_ASSIGNED",
          note: note || `Advisor assigned: ${advisorName.trim()}.`,
          metadata: { advisor: advisorName.trim() },
        },
      });

      return updated;
    });
  },

  /**
   * Schedules or reschedules an operational follow-up
   */
  async setFollowUp(
    leadId: string,
    followUpDate: Date,
    adminUserId?: string,
    note?: string
  ): Promise<ChatLead> {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.chatLead.findUniqueOrThrow({ where: { id: leadId } });

      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          nextFollowUpAt: followUpDate,
        },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "FOLLOW_UP_SET",
          note:
            note ||
            `Follow-up scheduled for ${followUpDate.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}.`,
          metadata: { followUpDate: followUpDate.toISOString() },
        },
      });

      return updated;
    });
  },

  /**
   * Marks a follow-up interaction completed
   */
  async completeFollowUp(
    leadId: string,
    adminUserId?: string,
    note?: string
  ): Promise<ChatLead> {
    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          nextFollowUpAt: null,
          lastContactAt: new Date(),
        },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "FOLLOW_UP_COMPLETED",
          note: note || "Follow-up contact completed.",
          metadata: { completedAt: new Date().toISOString() },
        },
      });

      return updated;
    });
  },

  /**
   * Adds an internal advisor note to lead
   */
  async addAdvisorNote(leadId: string, noteText: string, adminUserId?: string) {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.chatLead.findUniqueOrThrow({ where: { id: leadId } });

      const updatedNotes = existing.advisorNotes
        ? `${existing.advisorNotes}\n\n[${new Date().toLocaleDateString("en-IN")}] ${noteText.trim()}`
        : `[${new Date().toLocaleDateString("en-IN")}] ${noteText.trim()}`;

      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          advisorNotes: updatedNotes,
          lastContactAt: new Date(),
        },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "NOTE_ADDED",
          note: noteText.trim(),
        },
      });

      return updated;
    });
  },

  /**
   * Closes or marks a lead as not proceeding
   */
  async closeLead(leadId: string, reason: string, adminUserId?: string): Promise<ChatLead> {
    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.chatLead.update({
        where: { id: leadId },
        data: {
          salesStage: "NOT_PROCEEDING",
          status: LeadQualificationStatus.CLOSED,
          closureReason: reason.trim(),
          nextFollowUpAt: null,
        },
      });

      await tx.chatLeadEvent.create({
        data: {
          leadId,
          adminUserId: adminUserId || null,
          eventType: "LEAD_CLOSED",
          note: `Lead closed: ${reason.trim()}`,
          metadata: { closureReason: reason.trim() },
        },
      });

      return updated;
    });
  },

  /**
   * Calculates live Sales Pipeline Metrics directly from PostgreSQL
   */
  async getSalesPipelineMetrics() {
    const [
      total,
      newEnquiries,
      qualification,
      consultationRequested,
      consultationScheduled,
      converted,
      closed,
      pendingFollowUps,
      investmentServiceCount,
      retirementCount,
      taxCount,
    ] = await Promise.all([
      prisma.chatLead.count(),
      prisma.chatLead.count({ where: { salesStage: "NEW_ENQUIRY" } }),
      prisma.chatLead.count({ where: { salesStage: "QUALIFICATION" } }),
      prisma.chatLead.count({ where: { salesStage: "CONSULTATION_REQUESTED" } }),
      prisma.chatLead.count({ where: { salesStage: "CONSULTATION_SCHEDULED" } }),
      prisma.chatLead.count({ where: { salesStage: "CONVERTED" } }),
      prisma.chatLead.count({ where: { salesStage: "NOT_PROCEEDING" } }),
      prisma.chatLead.count({ where: { nextFollowUpAt: { not: null } } }),
      prisma.chatLead.count({ where: { serviceInterest: { contains: "investment", mode: "insensitive" } } }),
      prisma.chatLead.count({ where: { serviceInterest: { contains: "retirement", mode: "insensitive" } } }),
      prisma.chatLead.count({ where: { serviceInterest: { contains: "tax", mode: "insensitive" } } }),
    ]);

    return {
      total,
      newEnquiries,
      qualification,
      consultationRequested,
      consultationScheduled,
      converted,
      closed,
      pendingFollowUps,
      byService: {
        investment: investmentServiceCount,
        retirement: retirementCount,
        tax: taxCount,
      },
    };
  },
};
