import { prisma } from "@/lib/db/prisma";
import { KnowledgeSourceType, KnowledgeChunk } from "@prisma/client";

export interface CreateKnowledgeChunkInput {
  sourceType: KnowledgeSourceType;
  sourceId?: string;
  title: string;
  slug?: string;
  language?: string;
  content: string;
  normalizedContent?: string;
  tokens?: number;
  keywords?: string[];
  aliases?: string[];
  isActive?: boolean;
}

export interface SearchKnowledgeOptions {
  language?: string;
  sourceType?: KnowledgeSourceType;
  limit?: number;
}

export interface SearchResultChunk extends KnowledgeChunk {
  score: number;
}

/**
 * Normalizes text using Unicode NFKC normalization and trims whitespace.
 * Crucial for Devanagari combining characters, Nukta, and virama consistency.
 */
export function normalizeMultilingualText(text: string): string {
  if (!text) return "";
  return text.normalize("NFKC").trim();
}

/**
 * Repository for managing KnowledgeChunk entities and PostgreSQL-native retrieval
 */
export const chatKnowledgeRepository = {
  /**
   * Create a new knowledge chunk
   */
  async createChunk(input: CreateKnowledgeChunkInput): Promise<KnowledgeChunk> {
    const normalizedContent = input.normalizedContent || normalizeMultilingualText(input.content);

    return prisma.knowledgeChunk.create({
      data: {
        sourceType: input.sourceType,
        sourceId: input.sourceId || null,
        title: input.title.trim(),
        slug: input.slug || null,
        language: input.language || "en",
        content: input.content.trim(),
        normalizedContent,
        tokens: input.tokens || null,
        keywords: input.keywords || [],
        aliases: input.aliases || [],
        isActive: input.isActive ?? true,
      },
    });
  },

  /**
   * Update an existing knowledge chunk
   */
  async updateChunk(id: string, updates: Partial<CreateKnowledgeChunkInput>): Promise<KnowledgeChunk> {
    const dataToUpdate: Record<string, any> = { ...updates };
    if (updates.content && !updates.normalizedContent) {
      dataToUpdate.normalizedContent = normalizeMultilingualText(updates.content);
    }

    return prisma.knowledgeChunk.update({
      where: { id },
      data: dataToUpdate,
    });
  },

  /**
   * Retrieve a chunk by ID
   */
  async getChunkById(id: string): Promise<KnowledgeChunk | null> {
    return prisma.knowledgeChunk.findUnique({
      where: { id },
    });
  },

  /**
   * Delete a knowledge chunk
   */
  async deleteChunk(id: string): Promise<KnowledgeChunk> {
    return prisma.knowledgeChunk.delete({
      where: { id },
    });
  },

  /**
   * List knowledge chunks with optional filters
   */
  async listChunks(options: { sourceType?: KnowledgeSourceType; language?: string; isActive?: boolean; limit?: number }) {
    const { sourceType, language, isActive, limit = 100 } = options;
    const where: Record<string, any> = {};
    if (sourceType) where.sourceType = sourceType;
    if (language) where.language = language;
    if (isActive !== undefined) where.isActive = isActive;

    return prisma.knowledgeChunk.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
    });
  },

  /**
   * PostgreSQL-native multilingual search
   * Integrates:
   * 1. English Full-Text Search (tsvector + ts_rank)
   * 2. Devanagari Hindi normalized text matching
   * 3. Hinglish transliteration via pg_trgm fuzzy similarity and alias array containment
   */
  async searchKnowledge(query: string, options: SearchKnowledgeOptions = {}): Promise<SearchResultChunk[]> {
    const cleanQuery = normalizeMultilingualText(query);
    if (!cleanQuery) return [];

    const limit = options.limit || 5;
    const isDevanagari = /[\u0900-\u097F]/.test(cleanQuery);

    try {
      if (isDevanagari) {
        // Devanagari Hindi search path
        const rawResults: any[] = await prisma.$queryRaw`
          SELECT 
            *,
            CASE 
              WHEN "content" ILIKE '%' || ${cleanQuery} || '%' THEN 1.0
              WHEN "normalizedContent" ILIKE '%' || ${cleanQuery} || '%' THEN 0.9
              WHEN ${cleanQuery} = ANY("keywords") THEN 0.8
              ELSE 0.5
            END AS score
          FROM knowledge_chunks
          WHERE "isActive" = true
            AND (
              "content" ILIKE '%' || ${cleanQuery} || '%'
              OR "normalizedContent" ILIKE '%' || ${cleanQuery} || '%'
              OR "title" ILIKE '%' || ${cleanQuery} || '%'
              OR ${cleanQuery} = ANY("keywords")
              OR ${cleanQuery} = ANY("aliases")
            )
          ORDER BY score DESC, "updatedAt" DESC
          LIMIT ${limit};
        `;

        return rawResults.map((row) => ({
          ...row,
          score: Number(row.score) || 0.5,
        }));
      }

      // Latin Script path (English + Hinglish transliterations)
      // Uses combined FTS + pg_trgm similarity
      const rawResults: any[] = await prisma.$queryRaw`
        SELECT 
          *,
          GREATEST(
            ts_rank_cd(to_tsvector('english', "title" || ' ' || "content"), plainto_tsquery('english', ${cleanQuery})),
            similarity("title", ${cleanQuery}) * 1.5,
            similarity("content", ${cleanQuery}),
            CASE WHEN ${cleanQuery} = ANY("aliases") THEN 0.85 ELSE 0 END,
            CASE WHEN ${cleanQuery} = ANY("keywords") THEN 0.75 ELSE 0 END
          ) AS score
        FROM knowledge_chunks
        WHERE "isActive" = true
          AND (
            to_tsvector('english', "title" || ' ' || "content") @@ plainto_tsquery('english', ${cleanQuery})
            OR "title" % ${cleanQuery}
            OR "content" % ${cleanQuery}
            OR "title" ILIKE '%' || ${cleanQuery} || '%'
            OR "content" ILIKE '%' || ${cleanQuery} || '%'
            OR ${cleanQuery} = ANY("keywords")
            OR ${cleanQuery} = ANY("aliases")
          )
        ORDER BY score DESC, "updatedAt" DESC
        LIMIT ${limit};
      `;

      return rawResults.map((row) => ({
        ...row,
        score: Number(row.score) || 0.5,
      }));
    } catch (err) {
      console.warn("PostgreSQL full-text / trigram query fallback:", err);

      // Graceful fallback to Prisma standard query if raw query fails
      const fallbackChunks = await prisma.knowledgeChunk.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: cleanQuery, mode: "insensitive" } },
            { content: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        take: limit,
      });

      return fallbackChunks.map((chunk: KnowledgeChunk) => ({
        ...chunk,
        score: 0.5,
      }));
    }
  },

  /**
   * Synchronize published Services from CMS into KnowledgeChunks without fabricating information
   */
  async syncPublishedServices(): Promise<number> {
    const services = await prisma.service.findMany({
      where: { status: "PUBLISHED" },
    });

    let count = 0;
    for (const s of services) {
      const contentParts = [
        s.shortDesc,
        s.fullDesc,
        s.heroSubtext,
        Array.isArray(s.benefits)
          ? s.benefits.map((b: any) => `${b.title}: ${b.description}`).join(". ")
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      await prisma.knowledgeChunk.upsert({
        where: { id: `svc_${s.slug}` },
        create: {
          id: `svc_${s.slug}`,
          sourceType: KnowledgeSourceType.SERVICE_PAGE,
          sourceId: s.id,
          title: s.title,
          slug: s.slug,
          language: "en",
          content: contentParts,
          normalizedContent: normalizeMultilingualText(contentParts),
          keywords: [s.title.toLowerCase(), s.slug.replace(/-/g, " ")],
          aliases: [],
          isActive: true,
        },
        update: {
          title: s.title,
          content: contentParts,
          normalizedContent: normalizeMultilingualText(contentParts),
          lastSyncedAt: new Date(),
        },
      });
      count++;
    }

    return count;
  },

  /**
   * Synchronize published Articles from Insights CMS into KnowledgeChunks without fabricating information
   */
  async syncPublishedArticles(): Promise<number> {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
    });

    let count = 0;
    for (const a of articles) {
      const contentParts = [a.excerpt, a.content].filter(Boolean).join("\n\n");

      await prisma.knowledgeChunk.upsert({
        where: { id: `art_${a.slug}` },
        create: {
          id: `art_${a.slug}`,
          sourceType: KnowledgeSourceType.INSIGHT_ARTICLE,
          sourceId: a.id,
          title: a.title,
          slug: a.slug,
          language: "en",
          content: contentParts,
          normalizedContent: normalizeMultilingualText(contentParts),
          keywords: [a.title.toLowerCase(), a.categoryName.toLowerCase()],
          aliases: [],
          isActive: true,
        },
        update: {
          title: a.title,
          content: contentParts,
          normalizedContent: normalizeMultilingualText(contentParts),
          lastSyncedAt: new Date(),
        },
      });
      count++;
    }

    return count;
  },
};
