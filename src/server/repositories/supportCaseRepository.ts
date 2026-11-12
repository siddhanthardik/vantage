import { prisma } from "@/lib/db/prisma";
import {
  SupportCase,
  SupportCaseCategory,
  SupportCaseStatus,
  SupportCasePriority,
  SupportCaseEvent,
  Prisma,
} from "@prisma/client";

export interface CreateSupportCaseInput {
  conversationId?: string;
  leadId?: string;
  customerName: string;
  contactEmail?: string;
  contactPhone?: string;
  category: SupportCaseCategory;
  subcategory?: string;
  subject: string;
  description: string;
  priority?: SupportCasePriority;
  status?: SupportCaseStatus;
  assignedTo?: string;
  assignedAdminId?: string;
  advisorSummary?: string;
}

export interface ListCasesFilter {
  search?: string;
  category?: SupportCaseCategory;
  status?: SupportCaseStatus;
  priority?: SupportCasePriority;
  assignedAdminId?: string;
  page?: number;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Generates a unique, professional, human-readable case reference
 * Format: VW-CASE-YYMMDD-XXXX (e.g. VW-CASE-261112-1001)
 */
export async function generateCaseNumber(tx?: Prisma.TransactionClient): Promise<string> {
  const db = tx || prisma;
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  const countToday = await db.supportCase.count({
    where: {
      caseNumber: {
        startsWith: `VW-CASE-${datePrefix}`,
      },
    },
  });

  const seq = String(countToday + 1001);
  return `VW-CASE-${datePrefix}-${seq}`;
}

export const supportCaseRepository = {
  /**
   * Creates a new support case within a database transaction, logging creation events
   */
  async createCase(
    input: CreateSupportCaseInput,
    adminUserId?: string
  ): Promise<SupportCase & { events: SupportCaseEvent[] }> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const caseNumber = await generateCaseNumber(tx);

      const priority = input.priority || "MEDIUM";
      const defaultStatus: SupportCaseStatus = priority === "URGENT" ? "ESCALATED" : "OPEN";

      const created = await tx.supportCase.create({
        data: {
          caseNumber,
          conversationId: input.conversationId || null,
          leadId: input.leadId || null,
          customerName: input.customerName.trim(),
          contactEmail: input.contactEmail?.trim() || null,
          contactPhone: input.contactPhone?.trim() || null,
          category: input.category,
          subcategory: input.subcategory?.trim() || null,
          subject: input.subject.trim(),
          description: input.description.trim(),
          priority,
          status: input.status || defaultStatus,
          assignedTo: input.assignedTo?.trim() || null,
          assignedAdminId: input.assignedAdminId || null,
          advisorSummary: input.advisorSummary?.trim() || null,
          lastActivityAt: new Date(),
        },
      });

      // Initial event: CREATED
      await tx.supportCaseEvent.create({
        data: {
          caseId: created.id,
          adminUserId: adminUserId || null,
          eventType: "CREATED",
          isInternal: false,
          note: `Support case created with initial priority ${created.priority} and category ${created.category}.`,
          metadata: {
            source: input.conversationId ? "CHATBOT_SOUMYA" : "ADMIN_DESK",
            caseNumber,
          },
        },
      });

      // If created with HIGH or URGENT priority, log an ESCALATED event
      if (created.priority === "URGENT" || created.priority === "HIGH") {
        await tx.supportCaseEvent.create({
          data: {
            caseId: created.id,
            adminUserId: adminUserId || null,
            eventType: "ESCALATED",
            isInternal: true,
            note: `High priority case automatically flagged for supervisory review (${created.priority}).`,
            metadata: { priority: created.priority },
          },
        });
      }

      const fresh = await tx.supportCase.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          events: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return fresh;
    });
  },

  /**
   * Finds an active unresolved case for a customer to prevent duplicate case creation
   */
  async findOpenCaseByContactOrConversation(params: {
    conversationId?: string;
    contactPhone?: string;
    contactEmail?: string;
    category?: SupportCaseCategory;
  }): Promise<SupportCase | null> {
    const { conversationId, contactPhone, contactEmail, category } = params;

    const activeStatuses: SupportCaseStatus[] = [
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "WAITING_FOR_CUSTOMER",
      "WAITING_FOR_TEAM",
      "ESCALATED",
    ];

    const orClauses: Prisma.SupportCaseWhereInput[] = [];

    if (conversationId) {
      orClauses.push({ conversationId });
    }
    if (contactPhone && contactPhone.length >= 8) {
      orClauses.push({ contactPhone });
    }
    if (contactEmail && contactEmail.includes("@")) {
      orClauses.push({ contactEmail });
    }

    if (orClauses.length === 0) return null;

    return prisma.supportCase.findFirst({
      where: {
        status: { in: activeStatuses },
        OR: orClauses,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Retrieves case by caseNumber
   */
  async findCaseByNumber(
    caseNumber: string,
    includeInternalNotes: boolean = false
  ): Promise<(SupportCase & { events: SupportCaseEvent[] }) | null> {
    return prisma.supportCase.findUnique({
      where: { caseNumber: caseNumber.trim().toUpperCase() },
      include: {
        events: {
          where: includeInternalNotes ? undefined : { isInternal: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /**
   * Retrieves case by ID with full details (for admin view)
   */
  async getCaseById(id: string) {
    return prisma.supportCase.findUnique({
      where: { id },
      include: {
        assignedAdmin: {
          select: { id: true, name: true, email: true, role: true },
        },
        conversation: {
          select: {
            id: true,
            createdAt: true,
            primaryIntent: true,
            visitorClass: true,
            messageCount: true,
          },
        },
        lead: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            qualificationScore: true,
            urgency: true,
          },
        },
        events: {
          include: {
            adminUser: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /**
   * Paginated list of support cases with multi-attribute filtering
   */
  async listCases(filters: ListCasesFilter = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportCaseWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.assignedAdminId) {
      where.assignedAdminId = filters.assignedAdminId;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { caseNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { contactEmail: { contains: q, mode: "insensitive" } },
        { contactPhone: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [cases, total] = await Promise.all([
      prisma.supportCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          assignedAdmin: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { events: true },
          },
        },
      }),
      prisma.supportCase.count({ where }),
    ]);

    return {
      cases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Updates case status and logs event
   */
  async updateStatus(
    id: string,
    newStatus: SupportCaseStatus,
    adminUserId?: string,
    note?: string
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.supportCase.findUniqueOrThrow({ where: { id } });

      const isResolving = newStatus === "RESOLVED" || newStatus === "CLOSED";
      const isReopening = existing.status === "RESOLVED" || existing.status === "CLOSED";

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          status: newStatus,
          lastActivityAt: new Date(),
          resolvedAt: isResolving ? new Date() : isReopening ? null : existing.resolvedAt,
        },
      });

      await tx.supportCaseEvent.create({
        data: {
          caseId: id,
          adminUserId: adminUserId || null,
          eventType: isReopening && newStatus === "OPEN" ? "REOPENED" : "STATUS_CHANGE",
          isInternal: false,
          note: note || `Status changed from ${existing.status} to ${newStatus}.`,
          metadata: { previousStatus: existing.status, newStatus },
        },
      });

      return updated;
    });
  },

  /**
   * Assigns case to an advisor / admin user
   */
  async assignCase(
    id: string,
    params: { assignedTo?: string; assignedAdminId?: string },
    adminUserId?: string,
    note?: string
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.supportCase.findUniqueOrThrow({ where: { id } });

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          assignedTo: params.assignedTo !== undefined ? params.assignedTo : existing.assignedTo,
          assignedAdminId:
            params.assignedAdminId !== undefined
              ? params.assignedAdminId
              : existing.assignedAdminId,
          status: existing.status === "OPEN" ? "ASSIGNED" : existing.status,
          lastActivityAt: new Date(),
        },
      });

      await tx.supportCaseEvent.create({
        data: {
          caseId: id,
          adminUserId: adminUserId || null,
          eventType: "ASSIGNED",
          isInternal: true,
          note:
            note ||
            `Case assigned to ${params.assignedTo || params.assignedAdminId || "unassigned"}.`,
          metadata: { ...params },
        },
      });

      return updated;
    });
  },

  /**
   * Adds an internal note (strictly hidden from public chatbot)
   */
  async addInternalNote(id: string, note: string, adminUserId?: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const event = await tx.supportCaseEvent.create({
        data: {
          caseId: id,
          adminUserId: adminUserId || null,
          eventType: "NOTE_ADDED",
          isInternal: true,
          note: note.trim(),
        },
      });

      await tx.supportCase.update({
        where: { id },
        data: { lastActivityAt: new Date() },
      });

      return event;
    });
  },

  /**
   * Updates resolution notes and marks case as RESOLVED
   */
  async resolveCase(id: string, resolutionNotes: string, adminUserId?: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          status: "RESOLVED",
          resolutionNotes: resolutionNotes.trim(),
          resolvedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      await tx.supportCaseEvent.create({
        data: {
          caseId: id,
          adminUserId: adminUserId || null,
          eventType: "RESOLVED",
          isInternal: false,
          note: `Case resolved. Resolution summary: ${resolutionNotes.trim()}`,
        },
      });

      return updated;
    });
  },

  /**
   * Changes case priority and logs escalation event if elevated
   */
  async updatePriority(
    id: string,
    newPriority: SupportCasePriority,
    adminUserId?: string,
    reason?: string
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.supportCase.findUniqueOrThrow({ where: { id } });

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          priority: newPriority,
          status:
            newPriority === "URGENT" && existing.status !== "RESOLVED" && existing.status !== "CLOSED"
              ? "ESCALATED"
              : existing.status,
          lastActivityAt: new Date(),
        },
      });

      await tx.supportCaseEvent.create({
        data: {
          caseId: id,
          adminUserId: adminUserId || null,
          eventType: newPriority === "URGENT" || newPriority === "HIGH" ? "ESCALATED" : "PRIORITY_CHANGE",
          isInternal: true,
          note: reason || `Priority updated from ${existing.priority} to ${newPriority}.`,
          metadata: { previousPriority: existing.priority, newPriority },
        },
      });

      return updated;
    });
  },

  /**
   * Aggregates live case metrics for the Admin Support Desk
   */
  async getSupportMetrics() {
    const [total, open, assigned, inProgress, escalated, resolved, closed, highPriority] =
      await Promise.all([
        prisma.supportCase.count(),
        prisma.supportCase.count({ where: { status: "OPEN" } }),
        prisma.supportCase.count({ where: { status: "ASSIGNED" } }),
        prisma.supportCase.count({ where: { status: "IN_PROGRESS" } }),
        prisma.supportCase.count({ where: { status: "ESCALATED" } }),
        prisma.supportCase.count({ where: { status: "RESOLVED" } }),
        prisma.supportCase.count({ where: { status: "CLOSED" } }),
        prisma.supportCase.count({
          where: {
            priority: { in: ["HIGH", "URGENT"] },
            status: { notIn: ["RESOLVED", "CLOSED"] },
          },
        }),
      ]);

    return {
      total,
      open,
      assigned,
      inProgress,
      escalated,
      resolved,
      closed,
      pendingAction: open + assigned + inProgress + escalated,
      highPriority,
    };
  },
};
