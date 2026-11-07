-- Migration: Add TeamMember model and Enums
-- Supports Founder & Team Management CMS

DO $$ BEGIN
  CREATE TYPE "MemberRole" AS ENUM ('FOUNDER', 'TEAM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MemberStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "roleType" "MemberRole" NOT NULL DEFAULT 'TEAM',
    "designation" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "photoUrl" TEXT,
    "experienceYears" TEXT,
    "credentials" TEXT,
    "linkedInUrl" TEXT,
    "email" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'PUBLISHED',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TeamMember_roleType_status_displayOrder_idx" ON "TeamMember"("roleType", "status", "displayOrder");

-- Seed Founder profile if not already present
INSERT INTO "TeamMember" (
    "id",
    "name",
    "slug",
    "roleType",
    "designation",
    "bio",
    "photoUrl",
    "experienceYears",
    "credentials",
    "linkedInUrl",
    "status",
    "displayOrder",
    "createdAt",
    "updatedAt"
) VALUES (
    'founder-vineet-gupta',
    'Mr. Vineet Gupta',
    'vineet-gupta',
    'FOUNDER',
    'Founder & Principal Advisor',
    'Vineet Gupta is the founder of Vantage Wealth with a deep passion for helping individuals and families achieve their financial goals. With a strong foundation in financial markets and wealth advisory, he brings a disciplined, long-term and client-centric approach to wealth management.

Under his leadership, Vantage Wealth operates with uncompromising integrity, ensuring that each portfolio architecture is custom-tailored to the specific risk parameters, liquidity requirements, and multi-generational vision of the families we advise.',
    '/images/about/founder-vineet-gupta.png',
    '15+ Years',
    NULL,
    '',
    'PUBLISHED',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;
