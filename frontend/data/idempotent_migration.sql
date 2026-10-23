-- =========================================================
-- ESS CHATBOT SaaS — COMPLETE POSTGRESQL & PGVECTOR MIGRATION
-- Generated: 2026-10-23T13:26:09.233Z
-- =========================================================
BEGIN;

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(128) UNIQUE NOT NULL,
  "plan" VARCHAR(64) DEFAULT 'Enterprise',
  "status" VARCHAR(64) DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bots Table
CREATE TABLE IF NOT EXISTS "Bot" (
  "id" VARCHAR(64) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "avatar" VARCHAR(32) DEFAULT '🤖',
  "primaryColor" VARCHAR(32) DEFAULT '#4f46e5',
  "status" VARCHAR(64) DEFAULT 'Active',
  "systemPrompt" TEXT,
  "welcomeMessage" TEXT DEFAULT 'Hello! How can I help you today?',
  "launcherPosition" VARCHAR(32) DEFAULT 'bottom-right',
  "brandingEnabled" BOOLEAN DEFAULT TRUE,
  "allowedDomains" TEXT[] DEFAULT ARRAY['*']::TEXT[],
  "webhookUrl" TEXT,
  "webhookSecret" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Conversations Table
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "visitorName" VARCHAR(255) DEFAULT 'Website Visitor',
  "visitorEmail" VARCHAR(255),
  "visitorPhone" VARCHAR(64),
  "visitorLocation" VARCHAR(128),
  "status" VARCHAR(64) DEFAULT 'Active',
  "isLead" BOOLEAN DEFAULT FALSE,
  "leadScore" VARCHAR(32),
  "lastMessage" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS "Message" (
  "id" VARCHAR(128) PRIMARY KEY,
  "conversationId" VARCHAR(128) NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "role" VARCHAR(32) NOT NULL,
  "content" TEXT NOT NULL,
  "tokens" INT,
  "latencyMs" INT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Leads Table
CREATE TABLE IF NOT EXISTS "Lead" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(64),
  "company" VARCHAR(255) DEFAULT 'Direct Inbound',
  "score" VARCHAR(32) DEFAULT 'Medium',
  "status" VARCHAR(64) DEFAULT 'New',
  "inquiry" TEXT,
  "budget" VARCHAR(64) DEFAULT '₹50,000+',
  "source" VARCHAR(128) DEFAULT 'Web Chatbot Widget',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Knowledge Documents Table
CREATE TABLE IF NOT EXISTS "KnowledgeDocument" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(32) DEFAULT 'PDF',
  "sizeBytes" INT DEFAULT 0,
  "status" VARCHAR(64) DEFAULT 'Ready',
  "chunksCount" INT DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Knowledge Chunks Table (with Vector(768))
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id" VARCHAR(128) PRIMARY KEY,
  "documentId" VARCHAR(128) NOT NULL REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "chunkIndex" INT DEFAULT 0,
  "content" TEXT NOT NULL,
  "contentHash" VARCHAR(64),
  "embedding" VECTOR(768),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Webhook Config Table
CREATE TABLE IF NOT EXISTS "WebhookConfig" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "events" TEXT[] DEFAULT ARRAY['lead_captured']::TEXT[],
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Log Table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL,
  "userId" VARCHAR(64),
  "action" VARCHAR(128) NOT NULL,
  "resourceType" VARCHAR(64) NOT NULL,
  "resourceId" VARCHAR(128) NOT NULL,
  "ipAddress" VARCHAR(64),
  "metadata" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & vector search
CREATE INDEX IF NOT EXISTS idx_bot_org ON "Bot" ("organizationId");
CREATE INDEX IF NOT EXISTS idx_conversation_tenant ON "Conversation" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_lead_tenant ON "Lead" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_document_tenant ON "KnowledgeDocument" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_chunk_tenant ON "KnowledgeChunk" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_hnsw 
ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Organization & Bot: Beta Assistant (bot_test_b_1792761776032)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792761776032', 'Beta Retailers', 'org-bot_test_b_1792761776032', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792761776032', 'org_tenant_b_1792761776032', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792761776032)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792761776032', 'Alpha Dynamics', 'org-bot_test_a_1792761776032', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792761776032', 'org_tenant_a_1792761776032', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792761759413)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792761759413', 'Beta Retailers', 'org-bot_test_b_1792761759413', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792761759413', 'org_tenant_b_1792761759413', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792761759413)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792761759413', 'Alpha Dynamics', 'org-bot_test_a_1792761759413', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792761759413', 'org_tenant_a_1792761759413', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792760887698)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792760887698', 'Beta Retailers', 'org-bot_test_b_1792760887698', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792760887698', 'org_tenant_b_1792760887698', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792760887698)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792760887698', 'Alpha Dynamics', 'org-bot_test_a_1792760887698', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792760887698', 'org_tenant_a_1792760887698', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792760870609)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792760870609', 'Beta Retailers', 'org-bot_test_b_1792760870609', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792760870609', 'org_tenant_b_1792760870609', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792760870609)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792760870609', 'Alpha Dynamics', 'org-bot_test_a_1792760870609', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792760870609', 'org_tenant_a_1792760870609', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792754649681)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792754649681', 'Beta Retailers', 'org-bot_test_b_1792754649681', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792754649681', 'org_tenant_b_1792754649681', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792754649680)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792754649681', 'Alpha Dynamics', 'org-bot_test_a_1792754649680', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792754649680', 'org_tenant_a_1792754649681', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792754581707)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792754581707', 'Beta Retailers', 'org-bot_test_b_1792754581707', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792754581707', 'org_tenant_b_1792754581707', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792754581707)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792754581707', 'Alpha Dynamics', 'org-bot_test_a_1792754581707', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792754581707', 'org_tenant_a_1792754581707', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792751683260)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792751683260', 'Beta Retailers', 'org-bot_test_b_1792751683260', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792751683260', 'org_tenant_b_1792751683260', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792751683260)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792751683260', 'Alpha Dynamics', 'org-bot_test_a_1792751683260', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792751683260', 'org_tenant_a_1792751683260', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792751631583)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792751631583', 'Beta Retailers', 'org-bot_test_b_1792751631583', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792751631583', 'org_tenant_b_1792751631583', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792751631583)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792751631583', 'Alpha Dynamics', 'org-bot_test_a_1792751631583', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792751631583', 'org_tenant_a_1792751631583', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792749238202)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792749238202', 'Beta Retailers', 'org-bot_test_b_1792749238202', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792749238202', 'org_tenant_b_1792749238202', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792749238202)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792749238202', 'Alpha Dynamics', 'org-bot_test_a_1792749238202', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792749238202', 'org_tenant_a_1792749238202', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792736848717)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792736848717', 'Beta Retailers', 'org-bot_test_b_1792736848717', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792736848717', 'org_tenant_b_1792736848717', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792736848717)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792736848717', 'Alpha Dynamics', 'org-bot_test_a_1792736848717', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792736848717', 'org_tenant_a_1792736848717', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792736767300)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792736767300', 'Beta Retailers', 'org-bot_test_b_1792736767300', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792736767300', 'org_tenant_b_1792736767300', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792736767300)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792736767300', 'Alpha Dynamics', 'org-bot_test_a_1792736767300', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792736767300', 'org_tenant_a_1792736767300', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792734618120)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792734618120', 'Beta Retailers', 'org-bot_test_b_1792734618120', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792734618120', 'org_tenant_b_1792734618120', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792734618120)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792734618120', 'Alpha Dynamics', 'org-bot_test_a_1792734618120', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792734618120', 'org_tenant_a_1792734618120', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792734604697)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792734604697', 'Beta Retailers', 'org-bot_test_b_1792734604697', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792734604697', 'org_tenant_b_1792734604697', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792734604697)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792734604697', 'Alpha Dynamics', 'org-bot_test_a_1792734604697', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792734604697', 'org_tenant_a_1792734604697', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792734482158)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792734482158', 'Beta Retailers', 'org-bot_test_b_1792734482158', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792734482158', 'org_tenant_b_1792734482158', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792734482158)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792734482158', 'Alpha Dynamics', 'org-bot_test_a_1792734482158', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792734482158', 'org_tenant_a_1792734482158', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792734359773)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792734359773', 'Beta Retailers', 'org-bot_test_b_1792734359773', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792734359773', 'org_tenant_b_1792734359773', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792734359773)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792734359773', 'Alpha Dynamics', 'org-bot_test_a_1792734359773', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792734359773', 'org_tenant_a_1792734359773', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: aa (bot_aa)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_ess_default', 'Emperor Smart Solutions', 'org-bot_aa', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_aa', 'org_ess_default', 'aa', 'Official AI Sales Representative for Emperor Smart Solutions.', '🤖', '#4f46e5', 'Active', 'You are Emperor AI, the official AI Sales Consultant for Emperor Smart Solutions. Assist visitors with Web, Mobile, ERP, and AI solutions.', 'Hello! I am Emperor AI, your AI Sales Consultant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1792760446848_aeq8', 'org_default', 'bot_test_b_1792761776032', 'Lead Beta', 'lead_b@beta.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1792760446827_9hvn', 'org_default', 'bot_test_b_1792761776032', 'Lead Alpha', 'lead_a@alpha.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1792760446772_mnx7', 'org_default', 'bot_test_b_1792761776032', 'Orphan Lead', 'orphan@example.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1792666528752_mh5r', 'org_default', 'bot_aa', 'Siddharth Mehta', 'siddharth.new@logistics.in', '+91 99000 88776', 'Mehta Freight Solutions', 'Hot', 'New', 'Custom ERP & GPS fleet tracking application', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_master_eval_1792666527562', 'org_default', 'bot_aa', 'Enterprise Client', 'client@enterprise.com', '+919876543210', 'Direct Inbound', 'Hot', 'NEW', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_alpha_confidential', 'org_default', 'bot_aa', 'VIP Buyer', 'vip@buyer.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1791889312212_yf2w', 'org_default', 'bot_aa', 'Aviral', '', '', 'Direct Inbound', 'Medium', 'New', 'Website Development: Business: Yes | Project: New website | Admin Panel: Yes | Online Payments: Yes', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792761780903', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792761780903_0', 'doc_tenant_iso_1792761780903', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792761780853', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792761780853_0', 'doc_retry_test_1792761780853', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792761780795', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792761780795_0', 'doc_failed_1792761780795', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792761780746', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792761780746_0', 'doc_ready_1792761780746', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792761780629', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792761780629_0', 'doc_test_fail_1792761780629', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792761780177', 'org_default', 'bot_test_b_1792761776032', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792761780177_0', 'doc_test_success_1792761780177', 'org_default', 'bot_test_b_1792761776032', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792761780160', 'org_default', 'bot_test_b_1792761776032', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792761780160_0', 'doc_test_init_1792761780160', 'org_default', 'bot_test_b_1792761776032', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792761734979', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792761734979_0', 'doc_tenant_iso_1792761734979', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792761734892', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792761734892_0', 'doc_retry_test_1792761734892', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792761734862', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792761734862_0', 'doc_failed_1792761734862', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792761734745', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792761734745_0', 'doc_ready_1792761734745', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792761734600', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792761734600_0', 'doc_test_fail_1792761734600', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792761734229', 'org_default', 'bot_test_b_1792761776032', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792761734229_0', 'doc_test_success_1792761734229', 'org_default', 'bot_test_b_1792761776032', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792761734215', 'org_default', 'bot_test_b_1792761776032', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792761734215_0', 'doc_test_init_1792761734215', 'org_default', 'bot_test_b_1792761776032', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760891667', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760891667_0', 'doc_tenant_iso_1792760891667', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760891556', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760891556_0', 'doc_retry_test_1792760891556', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760891546', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760891546_0', 'doc_failed_1792760891546', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760891377', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760891377_0', 'doc_ready_1792760891377', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760891169', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760891169_0', 'doc_test_fail_1792760891169', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760890588', 'org_default', 'bot_test_b_1792761776032', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760890588_0', 'doc_test_success_1792760890588', 'org_default', 'bot_test_b_1792761776032', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760890534', 'org_default', 'bot_test_b_1792761776032', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760890534_0', 'doc_test_init_1792760890534', 'org_default', 'bot_test_b_1792761776032', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760844951', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760844951_0', 'doc_tenant_iso_1792760844951', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760844855', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760844855_0', 'doc_retry_test_1792760844855', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760844847', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760844847_0', 'doc_failed_1792760844847', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760844733', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760844733_0', 'doc_ready_1792760844733', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760844505', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760844505_0', 'doc_test_fail_1792760844505', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760844037', 'org_default', 'bot_test_b_1792761776032', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760844037_0', 'doc_test_success_1792760844037', 'org_default', 'bot_test_b_1792761776032', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760844001', 'org_default', 'bot_test_b_1792761776032', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760844001_0', 'doc_test_init_1792760844001', 'org_default', 'bot_test_b_1792761776032', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760799616', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760799616_0', 'doc_tenant_iso_1792760799616', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760799517', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760799517_0', 'doc_retry_test_1792760799517', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760799450', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760799450_0', 'doc_failed_1792760799450', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760799360', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760799360_0', 'doc_ready_1792760799360', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760799298', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760799298_0', 'doc_test_fail_1792760799298', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760798877', 'org_default', 'bot_test_b_1792761776032', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760798877_0', 'doc_test_success_1792760798877', 'org_default', 'bot_test_b_1792761776032', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760798857', 'org_default', 'bot_test_b_1792761776032', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760798857_0', 'doc_test_init_1792760798857', 'org_default', 'bot_test_b_1792761776032', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760741613', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760741613_0', 'doc_tenant_iso_1792760741613', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760741459', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760741459_0', 'doc_retry_test_1792760741459', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760741331', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760741331_0', 'doc_failed_1792760741331', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760741124', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760741124_0', 'doc_ready_1792760741124', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760740980', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760740980_0', 'doc_test_fail_1792760740980', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760740297', 'org_default', 'bot_test_b_1792761776032', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760740297_0', 'doc_test_success_1792760740297', 'org_default', 'bot_test_b_1792761776032', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760740276', 'org_default', 'bot_test_b_1792761776032', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760740276_0', 'doc_test_init_1792760740276', 'org_default', 'bot_test_b_1792761776032', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760613701', 'org_default', 'bot_test_b_1792761776032', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760613701_0', 'doc_tenant_iso_1792760613701', 'org_default', 'bot_test_b_1792761776032', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760613549', 'org_default', 'bot_test_b_1792761776032', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760613549_0', 'doc_retry_test_1792760613549', 'org_default', 'bot_test_b_1792761776032', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760613466', 'org_default', 'bot_test_b_1792761776032', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760613466_0', 'doc_failed_1792760613466', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760613350', 'org_default', 'bot_test_b_1792761776032', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760613350_0', 'doc_ready_1792760613350', 'org_default', 'bot_test_b_1792761776032', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760613215', 'org_default', 'bot_test_b_1792761776032', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760613215_0', 'doc_test_fail_1792760613215', 'org_default', 'bot_test_b_1792761776032', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792761778917_3tto', 'org_default', 'bot_test_b_1792761776032', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792761748536_3a67', 'org_default', 'bot_test_b_1792761776032', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792760889292_itut', 'org_default', 'bot_test_b_1792761776032', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792760858161_01v1', 'org_default', 'bot_test_b_1792761776032', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792760446936_4dyf', 'org_default', 'bot_test_b_1792761776032', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1792754649681', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1792761776032', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1792761776032', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1792751631583', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1792761776032', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1792761776032', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_aa', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_aa', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_aa', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

COMMIT;