import { prisma } from "@/lib/db/prisma";
import { MessageRole, ChatMessage } from "@prisma/client";

export interface CreateMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  language?: string;
  citations?: any;
}

/**
 * Repository for managing ChatMessage and ChatbotFeedback entities in PostgreSQL
 */
export const chatMessageRepository = {
  /**
   * Create a message and update conversation metadata atomically in a transaction
   */
  async createMessage(input: CreateMessageInput): Promise<ChatMessage> {
    const now = new Date();

    return prisma.$transaction(async (tx: any) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          tokenCount: input.tokenCount || null,
          language: input.language || null,
          citations: input.citations || null,
          createdAt: now,
        },
      });

      // Update conversation counter and activity timestamp
      const conversationUpdateData: Record<string, any> = {
        messageCount: { increment: 1 },
        updatedAt: now,
      };

      if (input.role === MessageRole.USER) {
        conversationUpdateData.lastUserMessageAt = now;
      }

      await tx.chatConversation.update({
        where: { id: input.conversationId },
        data: conversationUpdateData,
      });

      return message;
    });
  },

  /**
   * Retrieve messages for a conversation ordered chronologically
   */
  async getMessagesByConversationId(conversationId: string, limit?: number): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        feedback: true,
      },
    });
  },

  /**
   * Flag a message for review/safety
   */
  async flagMessage(messageId: string, flagReason: string): Promise<ChatMessage> {
    return prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isFlagged: true,
        flagReason,
      },
    });
  },

  /**
   * Record or update user feedback (1=negative, 5=positive) on an assistant message
   */
  async recordFeedback(messageId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    return prisma.chatbotFeedback.upsert({
      where: { messageId },
      create: {
        messageId,
        rating,
        comment: comment || null,
      },
      update: {
        rating,
        comment: comment || null,
      },
    });
  },

  /**
   * Retrieve a single message with its feedback
   */
  async getMessageById(messageId: string) {
    return prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        feedback: true,
        conversation: {
          select: {
            id: true,
            anonymousSessionId: true,
            status: true,
          },
        },
      },
    });
  },
};
