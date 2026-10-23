-- =====================================================================
-- Migration 002: Business Configuration & Website Knowledge Persistence
-- Additive and Idempotent Schema Migration
-- =====================================================================

-- 1. Add business configuration columns to "Bot" table
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "company" VARCHAR(255);
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(64);

-- 2. Enhance "KnowledgeChunk" table to support direct website page ingestion
-- Make documentId nullable so website chunks can be persisted with or without a document
ALTER TABLE "KnowledgeChunk" ALTER COLUMN "documentId" DROP NOT NULL;
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "pageTitle" TEXT;

-- 3. Ensure B-tree and HNSW indexes exist for performant tenant retrieval
CREATE INDEX IF NOT EXISTS idx_bot_company ON "Bot" ("company");
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_bot_source ON "KnowledgeChunk" ("botId", "sourceUrl");
