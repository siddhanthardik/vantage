import { prisma } from "@/lib/db/prisma";
import { KnowledgeSourceType } from "@prisma/client";
import { normalizeMultilingualText } from "../repositories/chatKnowledgeRepository";

/**
 * Service to synchronize published CMS data into the KnowledgeBase repository
 * without fabricating information or hallucinating details.
 */
export const knowledgeIngestionService = {
  /**
   * Synchronize published Services, Insights, and Team profiles
   */
  async syncAllPublishedContent(): Promise<{
    servicesIndexed: number;
    articlesIndexed: number;
    teamIndexed: number;
    totalChunks: number;
  }> {
    const servicesIndexed = await this.syncServices();
    const articlesIndexed = await this.syncArticles();
    const teamIndexed = await this.syncTeam();

    const totalChunks = await prisma.knowledgeChunk.count({
      where: { isActive: true },
    });

    return {
      servicesIndexed,
      articlesIndexed,
      teamIndexed,
      totalChunks,
    };
  },

  /**
   * Ingest published Services with multilingual keywords and transliteration aliases
   */
  async syncServices(): Promise<number> {
    const services = await prisma.service.findMany({
      where: { status: "PUBLISHED" },
    });

    let count = 0;
    for (const s of services) {
      // Build factual text representation strictly from database fields
      const contentSections = [
        s.shortDesc,
        s.fullDesc,
        s.heroSubtext,
        Array.isArray(s.benefits)
          ? "Key Benefits: " +
            s.benefits.map((b: any) => `${b.title || ""}: ${b.description || ""}`).join("; ")
          : null,
        Array.isArray(s.features)
          ? "Capabilities: " +
            s.features.map((f: any) => `${f.title || ""}: ${f.description || ""}`).join("; ")
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      // Domain-specific multilingual aliases for Indian wealth investors
      const aliases: string[] = [s.slug.replace(/-/g, " ")];
      const keywords: string[] = [s.title.toLowerCase()];

      if (s.slug.includes("portfolio") || s.slug.includes("investment")) {
        aliases.push("nivesh", "portfolio management", "pms", "share market nivesh", "wealth growth");
        keywords.push("nivesh", "pms", "investments", "equity", "debt");
      }
      if (s.slug.includes("estate") || s.slug.includes("succession") || s.slug.includes("trust")) {
        aliases.push("parivar trust", "wasiyat", "succession planning", "family inheritance", "trust setup");
        keywords.push("succession", "inheritance", "family trust", "will", "estate");
      }
      if (s.slug.includes("family-office") || s.slug.includes("governance")) {
        aliases.push("family office", "khandani business", "multi family office", "governance");
        keywords.push("family office", "governance", "hnwi");
      }

      await prisma.knowledgeChunk.upsert({
        where: { id: `service_${s.slug}` },
        create: {
          id: `service_${s.slug}`,
          sourceType: KnowledgeSourceType.SERVICE_PAGE,
          sourceId: s.id,
          title: s.title,
          slug: `services/${s.slug}`,
          language: "en",
          content: contentSections,
          normalizedContent: normalizeMultilingualText(contentSections),
          keywords,
          aliases,
          isActive: true,
          lastSyncedAt: new Date(),
        },
        update: {
          title: s.title,
          content: contentSections,
          normalizedContent: normalizeMultilingualText(contentSections),
          keywords,
          aliases,
          lastSyncedAt: new Date(),
        },
      });

      count++;
    }

    return count;
  },

  /**
   * Ingest published Research & Insight articles
   */
  async syncArticles(): Promise<number> {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
    });

    let count = 0;
    for (const a of articles) {
      const contentParts = [
        `Category: ${a.categoryName}`,
        `Author: ${a.authorName}`,
        a.excerpt,
        a.content,
      ]
        .filter(Boolean)
        .join("\n\n");

      await prisma.knowledgeChunk.upsert({
        where: { id: `article_${a.slug}` },
        create: {
          id: `article_${a.slug}`,
          sourceType: KnowledgeSourceType.INSIGHT_ARTICLE,
          sourceId: a.id,
          title: a.title,
          slug: `insights/${a.slug}`,
          language: "en",
          content: contentParts,
          normalizedContent: normalizeMultilingualText(contentParts),
          keywords: [a.title.toLowerCase(), a.categoryName.toLowerCase()],
          aliases: [a.slug.replace(/-/g, " ")],
          isActive: true,
          lastSyncedAt: new Date(),
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

  /**
   * Ingest published Team Member and Founder leadership profiles
   */
  async syncTeam(): Promise<number> {
    const members = await prisma.teamMember.findMany({
      where: { status: "PUBLISHED" },
    });

    let count = 0;
    for (const m of members) {
      const contentParts = [
        `Name: ${m.name}`,
        `Designation: ${m.designation}`,
        m.experienceYears ? `Experience: ${m.experienceYears}` : null,
        m.credentials ? `Credentials: ${m.credentials}` : null,
        m.bio,
      ]
        .filter(Boolean)
        .join("\n\n");

      await prisma.knowledgeChunk.upsert({
        where: { id: `team_${m.slug}` },
        create: {
          id: `team_${m.slug}`,
          sourceType: KnowledgeSourceType.TEAM_PROFILE,
          sourceId: m.id,
          title: `${m.name} (${m.designation})`,
          slug: `about`,
          language: "en",
          content: contentParts,
          normalizedContent: normalizeMultilingualText(contentParts),
          keywords: [m.name.toLowerCase(), m.designation.toLowerCase(), "leadership", "founder"],
          aliases: [m.slug.replace(/-/g, " ")],
          isActive: true,
          lastSyncedAt: new Date(),
        },
        update: {
          title: `${m.name} (${m.designation})`,
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
