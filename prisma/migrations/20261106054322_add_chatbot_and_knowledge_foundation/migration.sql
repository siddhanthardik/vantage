-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ENDED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LeadQualificationStatus" AS ENUM ('COLLECTING', 'QUALIFIED', 'CALLBACK_REQUESTED', 'CONVERTED_TO_ENQUIRY', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "CallbackPreferredMethod" AS ENUM ('PHONE', 'EMAIL');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('SERVICE_PAGE', 'INSIGHT_ARTICLE', 'TEAM_PROFILE', 'STATIC_FAQ', 'DISCLAIMER_LEGAL');

-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BusinessSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Enquiry" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TeamMember" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "anonymousSessionId" VARCHAR(128) NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUserMessageAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipHash" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "language" VARCHAR(10),
    "citations" JSONB,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_leads" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "LeadQualificationStatus" NOT NULL DEFAULT 'COLLECTING',
    "fullName" VARCHAR(120),
    "email" VARCHAR(191),
    "phone" VARCHAR(32),
    "preferredMethod" "CallbackPreferredMethod" NOT NULL DEFAULT 'PHONE',
    "preferredTimeWindow" VARCHAR(100),
    "financialObjective" VARCHAR(255),
    "portfolioSize" VARCHAR(64),
    "notes" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" TIMESTAMP(3),
    "consentIpHash" VARCHAR(64),
    "enquiryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_lead_events" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "eventType" VARCHAR(64) NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "sourceId" VARCHAR(128),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "content" TEXT NOT NULL,
    "normalizedContent" TEXT,
    "tokens" INTEGER,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "botName" TEXT NOT NULL DEFAULT 'Vantage Wealth Assistant',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessageEn" TEXT NOT NULL,
    "welcomeMessageHi" TEXT NOT NULL,
    "disclaimerEn" TEXT NOT NULL,
    "disclaimerHi" TEXT NOT NULL,
    "systemInstructions" TEXT,
    "salesInstructions" TEXT,
    "qualificationInstructions" TEXT,
    "financialSafetyInstructions" TEXT,
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en', 'hi', 'hinglish']::TEXT[],
    "workingDays" TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']::TEXT[],
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:30',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '18:30',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "holidays" JSONB DEFAULT '[]',
    "temporaryUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "unavailabilityReason" VARCHAR(255),
    "callbackWording" TEXT NOT NULL,
    "maxTurnsPerSession" INTEGER NOT NULL DEFAULT 30,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rate_limit_buckets" (
    "key" VARCHAR(128) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "chat_conversations_anonymousSessionId_status_createdAt_idx" ON "chat_conversations"("anonymousSessionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "chat_conversations_status_updatedAt_idx" ON "chat_conversations"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_feedback_messageId_key" ON "chatbot_feedback"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_leads_conversationId_key" ON "chat_leads"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_leads_enquiryId_key" ON "chat_leads"("enquiryId");

-- CreateIndex
CREATE INDEX "chat_leads_status_createdAt_idx" ON "chat_leads"("status", "createdAt");

-- CreateIndex
CREATE INDEX "chat_leads_email_idx" ON "chat_leads"("email");

-- CreateIndex
CREATE INDEX "chat_leads_phone_idx" ON "chat_leads"("phone");

-- CreateIndex
CREATE INDEX "chat_lead_events_leadId_createdAt_idx" ON "chat_lead_events"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_lead_events_adminUserId_idx" ON "chat_lead_events"("adminUserId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_sourceType_language_isActive_idx" ON "knowledge_chunks"("sourceType", "language", "isActive");

-- CreateIndex
CREATE INDEX "knowledge_chunks_slug_idx" ON "knowledge_chunks"("slug");

-- CreateIndex
CREATE INDEX "chat_rate_limit_buckets_expiresAt_idx" ON "chat_rate_limit_buckets"("expiresAt");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_feedback" ADD CONSTRAINT "chatbot_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_leads" ADD CONSTRAINT "chat_leads_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_leads" ADD CONSTRAINT "chat_leads_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_lead_events" ADD CONSTRAINT "chat_lead_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "chat_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_lead_events" ADD CONSTRAINT "chat_lead_events_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Extension: pg_trgm for transliterated Hinglish and fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search and trigram indexes on knowledge_chunks
CREATE INDEX IF NOT EXISTS "knowledge_chunks_fts_idx" ON "knowledge_chunks" USING gin(to_tsvector('english', "title" || ' ' || "content"));
CREATE INDEX IF NOT EXISTS "knowledge_chunks_trgm_title_idx" ON "knowledge_chunks" USING gin("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "knowledge_chunks_trgm_content_idx" ON "knowledge_chunks" USING gin("content" gin_trgm_ops);

