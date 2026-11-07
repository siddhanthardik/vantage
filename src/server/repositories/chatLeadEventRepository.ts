import { prisma } from "@/lib/db/prisma";
import { ChatLeadEvent } from "@prisma/client";

export interface RecordEventInput {
  leadId: string;
  adminUserId?: string;
  eventType: string;
  metadata?: Record<string, any>;
}

/**
 * Repository for managing ChatLeadEvent audit trails in PostgreSQL
 */
export const chatLeadEventRepository = {
  /**
   * Record a lifecycle event for a lead
   */
  async recordEvent(input: RecordEventInput): Promise<ChatLeadEvent> {
    return prisma.chatLeadEvent.create({
      data: {
        leadId: input.leadId,
        adminUserId: input.adminUserId || null,
        eventType: input.eventType,
        metadata: input.metadata || {},
      },
    });
  },

  /**
   * Retrieve chronologically ordered events for a lead
   */
  async getEventsByLeadId(leadId: string): Promise<ChatLeadEvent[]> {
    return prisma.chatLeadEvent.findMany({
      where: { leadId },
      orderBy: { createdAt: "asc" },
      include: {
        adminUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },
};
