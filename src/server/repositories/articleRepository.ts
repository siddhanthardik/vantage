import fs from "fs";
import path from "path";
import { connection } from "next/server";
import { ArticleItem, ArticleFormData, ArticleRevisionItem } from "@/types/article";
import { prisma } from "@/lib/db/prisma";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "lib", "db", "articles-data.json");
const REVISIONS_FILE_PATH = path.join(process.cwd(), "src", "lib", "db", "article-revisions.json");

interface DataStore {
  articles: ArticleItem[];
}

interface RevisionsStore {
  revisions: ArticleRevisionItem[];
}

function readDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading articles data file:", error);
  }
  return { articles: [] };
}

function writeDataStore(data: DataStore): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing articles data file:", error);
  }
}

function readRevisionsStore(): RevisionsStore {
  try {
    if (fs.existsSync(REVISIONS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(REVISIONS_FILE_PATH, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading revisions file:", error);
  }
  return { revisions: [] };
}

function writeRevisionsStore(data: RevisionsStore): void {
  try {
    const dir = path.dirname(REVISIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REVISIONS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing revisions file:", error);
  }
}

function syncLocalArticlesCache(dbArticles: ArticleItem[]): void {
  try {
    const store = readDataStore();
    store.articles = dbArticles;
    writeDataStore(store);
  } catch (e) {
    console.warn("Failed to sync local articles cache:", e);
  }
}

export async function getPublishedArticles(): Promise<ArticleItem[]> {
  await connection();
  const now = new Date();

  if (prisma) {
    try {
      const dbArticles = await prisma.article.findMany({
        where: {
          OR: [
            { status: "PUBLISHED" },
            {
              status: "SCHEDULED",
              scheduledFor: { lte: now },
            },
          ],
        },
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { publishedAt: "desc" },
      });

      return dbArticles.map((a: any) => ({
        ...a,
        category: a.categoryName,
        tags: a.tags ? a.tags.map((t: any) => t.tag.name) : [],
      }));
    } catch (e) {
      console.error("PostgreSQL getPublishedArticles query error:", e);
      throw new Error("Failed to query published articles from PostgreSQL.");
    }
  }

  const data = readDataStore();
  const nowTime = now.getTime();

  return data.articles
    .filter((a) => {
      if (a.status === "PUBLISHED") return true;
      if (a.status === "SCHEDULED" && a.scheduledFor) {
        return new Date(a.scheduledFor).getTime() <= nowTime;
      }
      return false;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getAllArticles(): Promise<ArticleItem[]> {
  if (prisma) {
    try {
      const dbArticles = await prisma.article.findMany({
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const formatted = dbArticles.map((a: any) => ({
        ...a,
        category: a.categoryName,
        tags: a.tags ? a.tags.map((t: any) => t.tag.name) : [],
      }));

      syncLocalArticlesCache(formatted);
      return formatted;
    } catch (e) {
      console.error("PostgreSQL getAllArticles query error:", e);
      throw new Error("Failed to query articles from PostgreSQL.");
    }
  }

  const data = readDataStore();
  return [...data.articles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getArticleBySlug(slug: string): Promise<ArticleItem | null> {
  const cleanSlug = slug.trim().toLowerCase();

  if (prisma) {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: cleanSlug },
        include: {
          tags: { include: { tag: true } },
        },
      });
      if (article) {
        return {
          ...article,
          category: article.categoryName,
          tags: article.tags ? article.tags.map((t: any) => t.tag.name) : [],
        };
      }
      return null;
    } catch (e) {
      console.error("PostgreSQL getArticleBySlug error:", e);
      throw new Error(`Failed to query article "${cleanSlug}" from PostgreSQL.`);
    }
  }

  const data = readDataStore();
  return data.articles.find((a) => a.slug.toLowerCase() === cleanSlug) || null;
}

export async function getArticleById(id: string): Promise<ArticleItem | null> {
  if (prisma) {
    try {
      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          tags: { include: { tag: true } },
        },
      });
      if (article) {
        return {
          ...article,
          category: article.categoryName,
          tags: article.tags ? article.tags.map((t: any) => t.tag.name) : [],
        };
      }
      return null;
    } catch (e) {
      console.error("PostgreSQL getArticleById error:", e);
      throw new Error(`Failed to query article ID "${id}" from PostgreSQL.`);
    }
  }

  const data = readDataStore();
  return data.articles.find((a) => a.id === id) || null;
}

export async function getFeaturedArticle(): Promise<ArticleItem | null> {
  const published = await getPublishedArticles();
  return published.find((a) => a.isFeatured) || published[0] || null;
}

export async function getRelatedArticles(
  currentSlug: string,
  category?: string,
  limit: number = 3
): Promise<ArticleItem[]> {
  const published = await getPublishedArticles();
  return published
    .filter((a) => a.slug !== currentSlug)
    .filter((a) => (category ? a.category === category || true : true))
    .slice(0, limit);
}

export async function getArticleRevisions(articleId: string): Promise<ArticleRevisionItem[]> {
  if (prisma) {
    try {
      const revs = await prisma.articleRevision.findMany({
        where: { articleId },
        orderBy: { version: "desc" },
      });
      return revs.map((r: any) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch (e) {
      console.error("PostgreSQL getArticleRevisions error:", e);
      throw new Error("Failed to query article revisions from PostgreSQL.");
    }
  }

  const store = readRevisionsStore();
  return store.revisions
    .filter((r) => r.articleId === articleId)
    .sort((a, b) => b.version - a.version);
}

export async function saveArticleRevision(
  articleId: string,
  articleData: {
    title: string;
    excerpt: string;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
  },
  authorEmail?: string
): Promise<ArticleRevisionItem> {
  if (prisma) {
    try {
      const existingRevs = await prisma.articleRevision.findMany({
        where: { articleId },
        orderBy: { version: "desc" },
      });
      const nextVersion = existingRevs.length > 0 ? existingRevs[0].version + 1 : 1;
      const revId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();

      const createdRev = await prisma.articleRevision.create({
        data: {
          id: revId,
          articleId,
          version: nextVersion,
          title: articleData.title,
          excerpt: articleData.excerpt,
          content: articleData.content,
          seoTitle: articleData.seoTitle || null,
          seoDescription: articleData.seoDescription || null,
          authorEmail: authorEmail || "admin@vantagewealth.in",
          createdAt: now,
        },
      });

      return {
        ...createdRev,
        createdAt: createdRev.createdAt.toISOString(),
      };
    } catch (e: any) {
      console.error("PostgreSQL saveArticleRevision failed:", e);
      throw new Error(`Failed to save article revision to PostgreSQL: ${e.message}`);
    }
  }

  throw new Error("Database client not available. Cannot save revision without PostgreSQL connection.");
}

export async function createArticle(
  formData: ArticleFormData,
  authorEmail?: string
): Promise<ArticleItem> {
  const newSlug = formData.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");

  if (prisma) {
    const existing = await prisma.article.findUnique({ where: { slug: newSlug } });
    if (existing) {
      throw new Error(`An article with slug "${newSlug}" already exists in PostgreSQL.`);
    }

    const newId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const publishedAt = formData.status === "SCHEDULED" && formData.scheduledFor
      ? new Date(formData.scheduledFor)
      : now;

    try {
      const created = await prisma.article.create({
        data: {
          id: newId,
          slug: newSlug,
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim(),
          content: formData.content.trim(),
          categoryName: formData.category || "Wealth Planning",
          readTime: formData.readTime || "5 min read",
          coverImage: formData.coverImage || "/images/insights/featured-article.png",
          ogImage: formData.ogImage || formData.coverImage || null,
          authorName: formData.authorName || "Vantage Research Desk",
          isFeatured: formData.isFeatured || false,
          status: formData.status || "PUBLISHED",
          publishedAt,
          scheduledFor: formData.status === "SCHEDULED" && formData.scheduledFor ? new Date(formData.scheduledFor) : null,
          seoTitle: formData.seoTitle || `${formData.title.trim()} | Vantage Wealth Insights`,
          seoDescription: formData.seoDescription || formData.excerpt.trim(),
          createdAt: now,
          updatedAt: now,
        },
      });

      // Automatically snapshot initial revision in PostgreSQL
      await saveArticleRevision(created.id, created, authorEmail);

      const formatted: ArticleItem = {
        ...created,
        category: created.categoryName,
        tags: formData.tags || ["Advisory", "Wealth Management"],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        publishedAt: created.publishedAt.toISOString(),
        scheduledFor: created.scheduledFor ? created.scheduledFor.toISOString() : undefined,
      };

      // Mirror to fallback cache
      const store = readDataStore();
      store.articles.unshift(formatted);
      writeDataStore(store);

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL createArticle failed:", e);
      throw new Error(`Database error creating article: ${e.message || "PostgreSQL write failure"}`);
    }
  }

  throw new Error("Database client not available. Cannot create article without PostgreSQL connection.");
}

export async function updateArticle(
  id: string,
  formData: Partial<ArticleFormData>,
  authorEmail?: string
): Promise<ArticleItem> {
  if (prisma) {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Article with ID "${id}" does not exist in PostgreSQL.`);
    }

    let finalSlug = existing.slug;
    if (formData.slug && formData.slug !== existing.slug) {
      const checkSlug = formData.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");

      const duplicate = await prisma.article.findFirst({
        where: { slug: checkSlug, NOT: { id } },
      });
      if (duplicate) {
        throw new Error(`Slug "${checkSlug}" is already in use by another article.`);
      }
      finalSlug = checkSlug;
    }

    try {
      const updated = await prisma.article.update({
        where: { id },
        data: {
          slug: finalSlug,
          title: formData.title !== undefined ? formData.title.trim() : existing.title,
          excerpt: formData.excerpt !== undefined ? formData.excerpt.trim() : existing.excerpt,
          content: formData.content !== undefined ? formData.content.trim() : existing.content,
          categoryName: formData.category !== undefined ? formData.category : existing.categoryName,
          readTime: formData.readTime !== undefined ? formData.readTime : existing.readTime,
          coverImage: formData.coverImage !== undefined ? formData.coverImage : existing.coverImage,
          ogImage: formData.ogImage !== undefined ? formData.ogImage : existing.ogImage,
          authorName: formData.authorName !== undefined ? formData.authorName : existing.authorName,
          isFeatured: formData.isFeatured !== undefined ? formData.isFeatured : existing.isFeatured,
          status: formData.status !== undefined ? formData.status : existing.status,
          scheduledFor: formData.scheduledFor !== undefined ? (formData.scheduledFor ? new Date(formData.scheduledFor) : null) : existing.scheduledFor,
          seoTitle: formData.seoTitle !== undefined ? formData.seoTitle : existing.seoTitle,
          seoDescription: formData.seoDescription !== undefined ? formData.seoDescription : existing.seoDescription,
        },
      });

      // Snapshot revision in PostgreSQL
      await saveArticleRevision(id, updated, authorEmail);

      const formatted: ArticleItem = {
        ...updated,
        category: updated.categoryName,
        tags: formData.tags || ["Advisory", "Wealth Management"],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        publishedAt: updated.publishedAt.toISOString(),
        scheduledFor: updated.scheduledFor ? updated.scheduledFor.toISOString() : undefined,
      };

      // Mirror to fallback cache
      const store = readDataStore();
      const idx = store.articles.findIndex((a) => a.id === id);
      if (idx !== -1) {
        store.articles[idx] = formatted;
      } else {
        store.articles.unshift(formatted);
      }
      writeDataStore(store);

      return formatted;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL updateArticle failed:", e);
      throw new Error(`Database error updating article: ${e.message || "PostgreSQL write failure"}`);
    }
  }

  throw new Error("Database client not available. Cannot update article without PostgreSQL connection.");
}

export async function restoreArticleRevision(
  articleId: string,
  version: number,
  authorEmail?: string
): Promise<ArticleItem> {
  const revisions = await getArticleRevisions(articleId);
  const targetRevision = revisions.find((r) => r.version === version);

  if (!targetRevision) {
    throw new Error(`Revision version ${version} not found in database for article.`);
  }

  return updateArticle(
    articleId,
    {
      title: targetRevision.title,
      excerpt: targetRevision.excerpt,
      content: targetRevision.content,
      seoTitle: targetRevision.seoTitle,
      seoDescription: targetRevision.seoDescription,
    },
    authorEmail
  );
}

export async function deleteArticle(id: string): Promise<boolean> {
  if (prisma) {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }

    try {
      await prisma.article.delete({ where: { id } });

      const store = readDataStore();
      store.articles = store.articles.filter((a) => a.id !== id);
      writeDataStore(store);

      return true;
    } catch (e: any) {
      console.error("CRITICAL: PostgreSQL deleteArticle failed:", e);
      throw new Error(`Database error deleting article: ${e.message || "PostgreSQL write failure"}`);
    }
  }

  throw new Error("Database client not available. Cannot delete article without PostgreSQL connection.");
}
