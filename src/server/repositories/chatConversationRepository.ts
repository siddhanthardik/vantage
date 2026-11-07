import { prisma } from "@/lib/db/prisma";
import { ConversationStatus, ChatConversation } from "@prisma/client";

export interface CreateConversationInput {
  anonymousSessionId: string;
  language?: string;
  userAgent?: string;
  ipHash?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ListConversationsOptions {
  status?: ConversationStatus;
  limit?: number;
  offset?: number;
}

/**
 * Repository for managing ChatConversation entities in PostgreSQL
 */
export const chatConversationRepository = {
  /**
   * Create a new conversation session
   */
  async createConversation(input: CreateConversationInput): Promise<ChatConversation> {
    const expiresAt = input.expiresAt || new Date(Date.now() + 4 * 60 * 60 * 1000); // 4-hour default validity

    return prisma.chatConversation.create({
      data: {
        anonymousSessionId: input.anonymousSessionId,
        language: input.language || "en",
        userAgent: input.userAgent || null,
        ipHash: input.ipHash || null,
        expiresAt,
        metadata: input.metadata || {},
      },
    });
  },

  /**
   * Find conversation by ID with optional messages
   */
  async getConversationById(id: string, includeMessages: boolean = false) {
    return prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: includeMessages
          ? {
              orderBy: { createdAt: "asc" },
            }
          : false,
        lead: true,
      },
    });
  },

  /**
   * Find the active conversation for a given anonymous session
   */
  async getActiveConversationForSession(anonymousSessionId: string): Promise<ChatConversation | null> {
    const now = new Date();
    return prisma.chatConversation.findFirst({
      where: {
        anonymousSessionId,
        status: ConversationStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Atomically touch a conversation to update activity timestamps
   */
  async touchConversation(
    id: string,
    updates?: { lastUserMessageAt?: Date; expiresAt?: Date; language?: string }
  ): Promise<ChatConversation> {
    return prisma.chatConversation.update({
      where: { id },
      data: {
        ...(updates?.lastUserMessageAt ? { lastUserMessageAt: updates.lastUserMessageAt } : {}),
        ...(updates?.expiresAt ? { expiresAt: updates.expiresAt } : {}),
        ...(updates?.language ? { language: updates.language } : {}),
      },
    });
  },

  /**
   * Atomically increment the message count of a conversation
   */
  async incrementMessageCount(id: string): Promise<ChatConversation> {
    return prisma.chatConversation.update({
      where: { id },
      data: {
        messageCount: { increment: 1 },
      },
    });
  },

  /**
   * Update conversation status (ACTIVE, ENDED, EXPIRED, CONVERTED)
   */
  async updateStatus(id: string, status: ConversationStatus): Promise<ChatConversation> {
    return prisma.chatConversation.update({
      where: { id },
      data: { status },
    });
  },

  /**
   * Transition expired conversations to EXPIRED status
   */
  async expireStaleConversations(): Promise<number> {
    const result = await prisma.chatConversation.updateMany({
      where: {
        status: ConversationStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: ConversationStatus.EXPIRED,
      },
    });
    return result.count;
  },

  /**
   * Delete a conversation.
   * Note: Referential integrity rule onDelete: Restrict prevents deletion if a ChatLead exists.
   */
  async deleteConversation(id: string): Promise<ChatConversation> {
    return prisma.chatConversation.delete({
      where: { id },
    });
  },

  /**
   * List conversations with pagination for admin inspection
   */
  async listConversations(options: ListConversationsOptions = {}) {
    const { status, limit = 50, offset = 0 } = options;
    const where = status ? { status } : {};

    const [total, items] = await prisma.$transaction([
      prisma.chatConversation.count({ where }),
      prisma.chatConversation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          lead: true,
          _count: {
            select: { messages: true },
          },
        },
      }),
    ]);

    return { total, items, limit, offset };
  },
};
