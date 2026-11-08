-- Additive Migration: Add primaryKeyword, secondaryKeywords, and faqs to Article and ArticleRevision
-- Preserves all existing tables, records, constraints, and data.

-- AlterTable Article
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "primaryKeyword" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "faqs" JSONB DEFAULT '[]'::jsonb;

-- AlterTable ArticleRevision
ALTER TABLE "ArticleRevision" ADD COLUMN IF NOT EXISTS "primaryKeyword" TEXT;
ALTER TABLE "ArticleRevision" ADD COLUMN IF NOT EXISTS "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArticleRevision" ADD COLUMN IF NOT EXISTS "faqs" JSONB DEFAULT '[]'::jsonb;
