-- =====================================================================
-- Migration 003: Industry-Based Bot Wizard Persistence
-- Additive and Idempotent Schema Migration
-- =====================================================================

-- 1. Add industry and structured onboarding columns to "Bot" table
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "industry" VARCHAR(100);
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "businessDetails" JSONB;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "questionnaire" JSONB;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "assistantConfig" JSONB;

-- 2. Create BotQuestionnaire table for long-term draft & survey persistence
CREATE TABLE IF NOT EXISTS "BotQuestionnaire" (
    "id" VARCHAR(64) PRIMARY KEY,
    "botId" VARCHAR(64) NOT NULL,
    "organizationId" VARCHAR(64) NOT NULL,
    "industry" VARCHAR(100) NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "completionStatus" VARCHAR(32) NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_bot_industry ON "Bot" ("industry");
CREATE INDEX IF NOT EXISTS idx_bot_questionnaire_bot ON "BotQuestionnaire" ("botId");
CREATE INDEX IF NOT EXISTS idx_bot_questionnaire_org ON "BotQuestionnaire" ("organizationId");

