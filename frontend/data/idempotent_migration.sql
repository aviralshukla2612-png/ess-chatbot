-- =========================================================
-- ESS CHATBOT SaaS — COMPLETE POSTGRESQL & PGVECTOR MIGRATION
-- Generated: 2026-10-26T12:37:17.969Z
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

-- Organization & Bot: Beta Assistant (bot_test_b_1793018231600)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793018231600', 'Beta Retailers', 'org-bot_test_b_1793018231600', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793018231600', 'org_tenant_b_1793018231600', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793018231600)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793018231600', 'Alpha Dynamics', 'org-bot_test_a_1793018231600', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793018231600', 'org_tenant_a_1793018231600', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Dental Care Guide (bot_dental_1793018225081)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_dental_clinic_1793018225081', 'Smile Dental Clinic', 'org-bot_dental_1793018225081', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_dental_1793018225081', 'org_dental_clinic_1793018225081', 'Dental Care Guide', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Dental Care Guide. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Watch Advisor (bot_watches_1793018225081)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_retail_watches_1793018225081', 'Apex Luxury Watches', 'org-bot_watches_1793018225081', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_watches_1793018225081', 'org_retail_watches_1793018225081', 'Watch Advisor', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Watch Advisor. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793018111249)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793018111249', 'Beta Retailers', 'org-bot_test_b_1793018111249', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793018111249', 'org_tenant_b_1793018111249', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793018111249)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793018111249', 'Alpha Dynamics', 'org-bot_test_a_1793018111249', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793018111249', 'org_tenant_a_1793018111249', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Dental Care Guide (bot_dental_1793018104745)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_dental_clinic_1793018104745', 'Smile Dental Clinic', 'org-bot_dental_1793018104745', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_dental_1793018104745', 'org_dental_clinic_1793018104745', 'Dental Care Guide', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Dental Care Guide. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Watch Advisor (bot_watches_1793018104745)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_retail_watches_1793018104745', 'Apex Luxury Watches', 'org-bot_watches_1793018104745', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_watches_1793018104745', 'org_retail_watches_1793018104745', 'Watch Advisor', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Watch Advisor. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793018035636)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793018035636', 'Beta Retailers', 'org-bot_test_b_1793018035636', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793018035636', 'org_tenant_b_1793018035636', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793018035636)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793018035636', 'Alpha Dynamics', 'org-bot_test_a_1793018035636', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793018035636', 'org_tenant_a_1793018035636', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Dental Care Guide (bot_dental_1793018018522)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_dental_clinic_1793018018522', 'Smile Dental Clinic', 'org-bot_dental_1793018018522', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_dental_1793018018522', 'org_dental_clinic_1793018018522', 'Dental Care Guide', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Dental Care Guide. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Watch Advisor (bot_watches_1793018018522)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_retail_watches_1793018018522', 'Apex Luxury Watches', 'org-bot_watches_1793018018522', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_watches_1793018018522', 'org_retail_watches_1793018018522', 'Watch Advisor', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Watch Advisor. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Watch Advisor (bot_watches_1793017982775)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_retail_watches_1793017982775', 'Apex Luxury Watches', 'org-bot_watches_1793017982775', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_watches_1793017982775', 'org_retail_watches_1793017982775', 'Watch Advisor', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Watch Advisor. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Dental Care Guide (bot_dental_1793017905684)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_dental_clinic_1793017905684', 'Smile Dental Clinic', 'org-bot_dental_1793017905684', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_dental_1793017905684', 'org_dental_clinic_1793017905684', 'Dental Care Guide', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Dental Care Guide. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793017868059)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793017868059', 'Beta Retailers', 'org-bot_test_b_1793017868059', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793017868059', 'org_tenant_b_1793017868059', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793017868059)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793017868059', 'Alpha Dynamics', 'org-bot_test_a_1793017868059', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793017868059', 'org_tenant_a_1793017868059', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793017834790)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793017834790', 'Beta Retailers', 'org-bot_test_b_1793017834790', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793017834790', 'org_tenant_b_1793017834790', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793017834790)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793017834790', 'Alpha Dynamics', 'org-bot_test_a_1793017834790', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793017834790', 'org_tenant_a_1793017834790', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793017771315)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793017771315', 'Beta Retailers', 'org-bot_test_b_1793017771315', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793017771315', 'org_tenant_b_1793017771315', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793017771315)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793017771315', 'Alpha Dynamics', 'org-bot_test_a_1793017771315', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793017771315', 'org_tenant_a_1793017771315', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793017630003)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793017630003', 'Beta Retailers', 'org-bot_test_b_1793017630003', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793017630003', 'org_tenant_b_1793017630003', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793017630003)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793017630003', 'Alpha Dynamics', 'org-bot_test_a_1793017630003', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793017630003', 'org_tenant_a_1793017630003', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Dental Care Guide (bot_dental_1793017609239)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_dental_clinic_1793017609239', 'Smile Dental Clinic', 'org-bot_dental_1793017609239', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_dental_1793017609239', 'org_dental_clinic_1793017609239', 'Dental Care Guide', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Dental Care Guide. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Watch Advisor (bot_watches_1793017609239)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_retail_watches_1793017609239', 'Apex Luxury Watches', 'org-bot_watches_1793017609239', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_watches_1793017609239', 'org_retail_watches_1793017609239', 'Watch Advisor', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Watch Advisor. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Dental Care Guide (bot_dental_1793017540376)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_dental_clinic_1793017540376', 'Smile Dental Clinic', 'org-bot_dental_1793017540376', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_dental_1793017540376', 'org_dental_clinic_1793017540376', 'Dental Care Guide', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Dental Care Guide. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Watch Advisor (bot_watches_1793017540376)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_retail_watches_1793017540376', 'Apex Luxury Watches', 'org-bot_watches_1793017540376', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_watches_1793017540376', 'org_retail_watches_1793017540376', 'Watch Advisor', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Watch Advisor. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793015664157)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793015664157', 'Beta Retailers', 'org-bot_test_b_1793015664157', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793015664157', 'org_tenant_b_1793015664157', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793015664157)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793015664157', 'Alpha Dynamics', 'org-bot_test_a_1793015664157', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793015664157', 'org_tenant_a_1793015664157', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793014696245)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793014696245', 'Beta Retailers', 'org-bot_test_b_1793014696245', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793014696245', 'org_tenant_b_1793014696245', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793014696245)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793014696245', 'Alpha Dynamics', 'org-bot_test_a_1793014696245', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793014696245', 'org_tenant_a_1793014696245', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793014638524)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793014638524', 'Beta Retailers', 'org-bot_test_b_1793014638524', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793014638524', 'org_tenant_b_1793014638524', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793014638524)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793014638524', 'Alpha Dynamics', 'org-bot_test_a_1793014638524', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793014638524', 'org_tenant_a_1793014638524', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793014535887)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793014535887', 'Beta Retailers', 'org-bot_test_b_1793014535887', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793014535887', 'org_tenant_b_1793014535887', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793014535887)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793014535887', 'Alpha Dynamics', 'org-bot_test_a_1793014535887', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793014535887', 'org_tenant_a_1793014535887', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793014463877)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793014463877', 'Beta Retailers', 'org-bot_test_b_1793014463877', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793014463877', 'org_tenant_b_1793014463877', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793014463877)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793014463877', 'Alpha Dynamics', 'org-bot_test_a_1793014463877', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793014463877', 'org_tenant_a_1793014463877', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793014252476)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793014252476', 'Beta Retailers', 'org-bot_test_b_1793014252476', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793014252476', 'org_tenant_b_1793014252476', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793014252476)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793014252476', 'Alpha Dynamics', 'org-bot_test_a_1793014252476', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793014252476', 'org_tenant_a_1793014252476', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793014217732)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793014217732', 'Beta Retailers', 'org-bot_test_b_1793014217732', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793014217732', 'org_tenant_b_1793014217732', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793014217732)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793014217732', 'Alpha Dynamics', 'org-bot_test_a_1793014217732', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793014217732', 'org_tenant_a_1793014217732', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793013939816)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793013939816', 'Beta Retailers', 'org-bot_test_b_1793013939816', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793013939816', 'org_tenant_b_1793013939816', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793013939816)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793013939816', 'Alpha Dynamics', 'org-bot_test_a_1793013939816', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793013939816', 'org_tenant_a_1793013939816', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793013706431)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793013706431', 'Beta Retailers', 'org-bot_test_b_1793013706431', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793013706431', 'org_tenant_b_1793013706431', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793013706431)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793013706431', 'Alpha Dynamics', 'org-bot_test_a_1793013706431', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793013706431', 'org_tenant_a_1793013706431', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793012946206)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793012946206', 'Beta Retailers', 'org-bot_test_b_1793012946206', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793012946206', 'org_tenant_b_1793012946206', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793012946206)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793012946206', 'Alpha Dynamics', 'org-bot_test_a_1793012946206', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793012946206', 'org_tenant_a_1793012946206', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793012805311)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793012805311', 'Beta Retailers', 'org-bot_test_b_1793012805311', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793012805311', 'org_tenant_b_1793012805311', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793012805311)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793012805311', 'Alpha Dynamics', 'org-bot_test_a_1793012805311', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793012805311', 'org_tenant_a_1793012805311', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1793011950812)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1793011950812', 'Beta Retailers', 'org-bot_test_b_1793011950812', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1793011950812', 'org_tenant_b_1793011950812', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1793011950812)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1793011950812', 'Alpha Dynamics', 'org-bot_test_a_1793011950812', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1793011950812', 'org_tenant_a_1793011950812', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Beta Assistant (bot_test_b_1792761969466)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_b_1792761969466', 'Beta Retailers', 'org-bot_test_b_1792761969466', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_b_1792761969466', 'org_tenant_b_1792761969466', 'Beta Assistant', 'Direct-to-consumer sustainable apparel company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Organization & Bot: Alpha Assistant (bot_test_a_1792761969466)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_tenant_a_1792761969466', 'Alpha Dynamics', 'org-bot_test_a_1792761969466', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_test_a_1792761969466', 'org_tenant_a_1792761969466', 'Alpha Assistant', 'Autonomous robotics and warehouse automation company.', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Alpha Assistant. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

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
VALUES ('lead_1792760446848_aeq8', 'org_default', 'bot_test_b_1793018231600', 'Lead Beta', 'lead_b@beta.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1792760446827_9hvn', 'org_default', 'bot_test_b_1793018231600', 'Lead Alpha', 'lead_a@alpha.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
VALUES ('lead_1792760446772_mnx7', 'org_default', 'bot_test_b_1793018231600', 'Orphan Lead', 'orphan@example.com', '', 'Direct Inbound', 'Medium', 'New', 'Inquired via live chat widget', '₹50,000+', 'Web Chatbot Widget', NOW(), NOW())
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
VALUES ('doc_tenant_iso_1793018209325', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793018209325_0', 'doc_tenant_iso_1793018209325', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793018209308', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793018209308_0', 'doc_retry_test_1793018209308', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793018209302', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793018209302_0', 'doc_failed_1793018209302', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793018209293', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793018209293_0', 'doc_ready_1793018209293', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793018209281', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793018209281_0', 'doc_test_fail_1793018209281', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793018209253', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793018209253_0', 'doc_test_success_1793018209253', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793018209243', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793018209243_0', 'doc_test_init_1793018209243', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793018124907', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793018124907_0', 'doc_prod_fail_1793018124907', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793018124818', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793018124818_0', 'doc_embed_fail_1793018124818', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793018124670', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793018124670_0', 'doc_pers_1_1793018124670', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793018124670_1', 'doc_pers_1_1793018124670', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1793018088089', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793018088089_0', 'doc_tenant_iso_1793018088089', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793018088077', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793018088077_0', 'doc_retry_test_1793018088077', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793018088072', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793018088072_0', 'doc_failed_1793018088072', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793018088064', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793018088064_0', 'doc_ready_1793018088064', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793018088051', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793018088051_0', 'doc_test_fail_1793018088051', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793018088025', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793018088025_0', 'doc_test_success_1793018088025', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793018088017', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793018088017_0', 'doc_test_init_1793018088017', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793018049873', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793018049873_0', 'doc_prod_fail_1793018049873', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793018049743', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793018049743_0', 'doc_embed_fail_1793018049743', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793018049491', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793018049491_0', 'doc_pers_1_1793018049491', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793018049491_1', 'doc_pers_1_1793018049491', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1793017899139', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793017899139_0', 'doc_tenant_iso_1793017899139', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793017899119', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793017899119_0', 'doc_retry_test_1793017899119', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793017899110', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793017899110_0', 'doc_failed_1793017899110', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793017899078', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793017899078_0', 'doc_ready_1793017899078', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793017899066', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793017899066_0', 'doc_test_fail_1793017899066', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793017899012', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793017899012_0', 'doc_test_success_1793017899012', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793017898988', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793017898988_0', 'doc_test_init_1793017898988', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793017882791', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793017882791_0', 'doc_prod_fail_1793017882791', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793017882709', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793017882709_0', 'doc_embed_fail_1793017882709', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793017882545', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017882545_0', 'doc_pers_1_1793017882545', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017882545_1', 'doc_pers_1_1793017882545', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793017868985', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793017868985_0', 'doc_prod_fail_1793017868985', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793017868865', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793017868865_0', 'doc_embed_fail_1793017868865', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793017868520', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017868520_0', 'doc_pers_1_1793017868520', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017868520_1', 'doc_pers_1_1793017868520', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793017772005', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793017772005_0', 'doc_prod_fail_1793017772005', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793017771912', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793017771912_0', 'doc_embed_fail_1793017771912', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793017771673', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017771673_0', 'doc_pers_1_1793017771673', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017771673_1', 'doc_pers_1_1793017771673', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793017630904', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793017630904_0', 'doc_prod_fail_1793017630904', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793017630789', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793017630789_0', 'doc_embed_fail_1793017630789', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793017630353', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017630353_0', 'doc_pers_1_1793017630353', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793017630353_1', 'doc_pers_1_1793017630353', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1793017590993', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793017590993_0', 'doc_tenant_iso_1793017590993', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793017590970', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793017590970_0', 'doc_retry_test_1793017590970', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793017590963', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793017590963_0', 'doc_failed_1793017590963', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793017590949', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793017590949_0', 'doc_ready_1793017590949', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793017590938', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793017590938_0', 'doc_test_fail_1793017590938', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793017590889', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793017590889_0', 'doc_test_success_1793017590889', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793017590866', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793017590866_0', 'doc_test_init_1793017590866', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_dental_1793017540470', 'org_default', 'bot_dental_1793017540376', 'Dental Confidential Pricing', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_dental_1793017540470_0', 'doc_dental_1793017540470', 'org_default', 'bot_dental_1793017540376', 0, 'Smile Dental Clinic VIP implants cost $2,400 with proprietary ceramic crowns and nitrous oxide sedation.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_watches_1793017540470', 'org_default', 'bot_watches_1793017540376', 'Watch Warranty Policy', 'Document', 106, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_watches_1793017540470_0', 'doc_watches_1793017540470', 'org_default', 'bot_watches_1793017540376', 0, 'Apex Luxury Watches provides a 5-year Swiss certified warranty on all automatic calibers and chronographs.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793015682379', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793015682379_0', 'doc_prod_fail_1793015682379', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793015682229', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793015682229_0', 'doc_embed_fail_1793015682229', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793015681895', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793015681895_0', 'doc_pers_1_1793015681895', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793015681895_1', 'doc_pers_1_1793015681895', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793015665708', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793015665708_0', 'doc_prod_fail_1793015665708', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793015665601', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793015665601_0', 'doc_embed_fail_1793015665601', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793015665264', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793015665264_0', 'doc_pers_1_1793015665264', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793015665264_1', 'doc_pers_1_1793015665264', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1793015641764', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793015641764_0', 'doc_tenant_iso_1793015641764', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793015641731', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793015641731_0', 'doc_retry_test_1793015641731', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793015641719', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793015641719_0', 'doc_failed_1793015641719', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793015641712', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793015641712_0', 'doc_ready_1793015641712', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793015641700', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793015641700_0', 'doc_test_fail_1793015641700', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793015641632', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793015641632_0', 'doc_test_success_1793015641632', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793015641616', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793015641616_0', 'doc_test_init_1793015641616', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793014697289', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793014697289_0', 'doc_prod_fail_1793014697289', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793014697165', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793014697165_0', 'doc_embed_fail_1793014697165', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793014696843', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014696843_0', 'doc_pers_1_1793014696843', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014696843_1', 'doc_pers_1_1793014696843', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793014684440', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793014684440_0', 'doc_failed_1793014684440', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793014684392', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793014684392_0', 'doc_ready_1793014684392', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793014684354', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793014684354_0', 'doc_test_fail_1793014684354', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793014684220', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793014684220_0', 'doc_test_success_1793014684220', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793014684161', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793014684161_0', 'doc_test_init_1793014684161', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793014639838', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793014639838_0', 'doc_prod_fail_1793014639838', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793014639701', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793014639701_0', 'doc_embed_fail_1793014639701', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793014639106', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014639106_0', 'doc_pers_1_1793014639106', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014639106_1', 'doc_pers_1_1793014639106', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1793014627750', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793014627750_0', 'doc_tenant_iso_1793014627750', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793014627717', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793014627717_0', 'doc_retry_test_1793014627717', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793014627708', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793014627708_0', 'doc_failed_1793014627708', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793014627698', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793014627698_0', 'doc_ready_1793014627698', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793014627684', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793014627684_0', 'doc_test_fail_1793014627684', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793014627636', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793014627636_0', 'doc_test_success_1793014627636', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793014627617', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793014627617_0', 'doc_test_init_1793014627617', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1793014540790', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1793014540790_0', 'doc_tenant_iso_1793014540790', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1793014540754', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1793014540754_0', 'doc_retry_test_1793014540754', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1793014540735', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1793014540735_0', 'doc_failed_1793014540735', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1793014540721', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1793014540721_0', 'doc_ready_1793014540721', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1793014540677', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1793014540677_0', 'doc_test_fail_1793014540677', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1793014540441', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1793014540441_0', 'doc_test_success_1793014540441', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1793014540395', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1793014540395_0', 'doc_test_init_1793014540395', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793014536371', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014536371_0', 'doc_pers_1_1793014536371', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014536371_1', 'doc_pers_1_1793014536371', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_prod_fail_1793014465396', 'org_default', 'bot_test_b_1793018231600', 'Prod Failure Doc', 'Document', 73, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_prod_fail_1793014465396_0', 'doc_prod_fail_1793014465396', 'org_default', 'bot_test_b_1793018231600', 0, 'Testing that production mode fails safely when PostgreSQL is unavailable.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_embed_fail_1793014465158', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 49, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_embed_fail_1793014465158_0', 'doc_embed_fail_1793014465158', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text that should fail embedding inference.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_pers_1_1793014464571', 'org_default', 'bot_test_b_1793018231600', 'Enterprise Architecture Guide', 'PDF', 485, 'Ready', 2, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014464571_0', 'doc_pers_1_1793014464571', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_pers_1_1793014464571_1', 'doc_pers_1_1793014464571', 'org_default', 'bot_test_b_1793018231600', 1, 'for enterprise customers running mission-critical workloads.

Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792761975325', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792761975325_0', 'doc_tenant_iso_1792761975325', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792761975170', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792761975170_0', 'doc_retry_test_1792761975170', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792761975131', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792761975131_0', 'doc_failed_1792761975131', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792761975026', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792761975026_0', 'doc_ready_1792761975026', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792761974852', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792761974852_0', 'doc_test_fail_1792761974852', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792761974003', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792761974003_0', 'doc_test_success_1792761974003', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792761973959', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792761973959_0', 'doc_test_init_1792761973959', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792761780903', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792761780903_0', 'doc_tenant_iso_1792761780903', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792761780853', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792761780853_0', 'doc_retry_test_1792761780853', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792761780795', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792761780795_0', 'doc_failed_1792761780795', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792761780746', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792761780746_0', 'doc_ready_1792761780746', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792761780629', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792761780629_0', 'doc_test_fail_1792761780629', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792761780177', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792761780177_0', 'doc_test_success_1792761780177', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792761780160', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792761780160_0', 'doc_test_init_1792761780160', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792761734979', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792761734979_0', 'doc_tenant_iso_1792761734979', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792761734892', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792761734892_0', 'doc_retry_test_1792761734892', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792761734862', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792761734862_0', 'doc_failed_1792761734862', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792761734745', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792761734745_0', 'doc_ready_1792761734745', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792761734600', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792761734600_0', 'doc_test_fail_1792761734600', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792761734229', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792761734229_0', 'doc_test_success_1792761734229', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792761734215', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792761734215_0', 'doc_test_init_1792761734215', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760891667', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760891667_0', 'doc_tenant_iso_1792760891667', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760891556', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760891556_0', 'doc_retry_test_1792760891556', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760891546', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760891546_0', 'doc_failed_1792760891546', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760891377', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760891377_0', 'doc_ready_1792760891377', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760891169', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760891169_0', 'doc_test_fail_1792760891169', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760890588', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760890588_0', 'doc_test_success_1792760890588', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760890534', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760890534_0', 'doc_test_init_1792760890534', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760844951', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760844951_0', 'doc_tenant_iso_1792760844951', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760844855', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760844855_0', 'doc_retry_test_1792760844855', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760844847', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760844847_0', 'doc_failed_1792760844847', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760844733', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760844733_0', 'doc_ready_1792760844733', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760844505', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760844505_0', 'doc_test_fail_1792760844505', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760844037', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760844037_0', 'doc_test_success_1792760844037', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760844001', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760844001_0', 'doc_test_init_1792760844001', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760799616', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760799616_0', 'doc_tenant_iso_1792760799616', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760799517', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760799517_0', 'doc_retry_test_1792760799517', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760799450', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760799450_0', 'doc_failed_1792760799450', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760799360', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760799360_0', 'doc_ready_1792760799360', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760799298', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760799298_0', 'doc_test_fail_1792760799298', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760798877', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760798877_0', 'doc_test_success_1792760798877', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760798857', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760798857_0', 'doc_test_init_1792760798857', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760741613', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760741613_0', 'doc_tenant_iso_1792760741613', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760741459', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760741459_0', 'doc_retry_test_1792760741459', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760741331', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760741331_0', 'doc_failed_1792760741331', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760741124', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760741124_0', 'doc_ready_1792760741124', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760740980', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760740980_0', 'doc_test_fail_1792760740980', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_success_1792760740297', 'org_default', 'bot_test_b_1793018231600', 'Warranty Policy', 'Document', 102, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_success_1792760740297_0', 'doc_test_success_1792760740297', 'org_default', 'bot_test_b_1793018231600', 0, 'All hardware purchases include a 2-year warranty covering manufacturing defects and hardware failures.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_init_1792760740276', 'org_default', 'bot_test_b_1793018231600', 'Product Catalog', 'Document', 104, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_init_1792760740276_0', 'doc_test_init_1792760740276', 'org_default', 'bot_test_b_1793018231600', 0, 'Emperor Cloud ERP is an enterprise management system designed for logistics and supply chain operations.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_tenant_iso_1792760613701', 'org_default', 'bot_test_b_1793018231600', 'Internal Strategy', 'Document', 44, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_tenant_iso_1792760613701_0', 'doc_tenant_iso_1792760613701', 'org_default', 'bot_test_b_1793018231600', 0, 'Confidential financial roadmap for Tenant A.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_retry_test_1792760613549', 'org_default', 'bot_test_b_1793018231600', 'Pricing Guide', 'Document', 55, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_retry_test_1792760613549_0', 'doc_retry_test_1792760613549', 'org_default', 'bot_test_b_1793018231600', 0, 'Standard Tier is $49/mo and Enterprise Tier is $199/mo.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_failed_1792760613466', 'org_default', 'bot_test_b_1793018231600', 'Draft Unverified Doc', 'Document', 62, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_failed_1792760613466_0', 'doc_failed_1792760613466', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder of the company is John Doe who started it in 1990.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_ready_1792760613350', 'org_default', 'bot_test_b_1793018231600', 'Founder Bio', 'Document', 87, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_ready_1792760613350_0', 'doc_ready_1792760613350', 'org_default', 'bot_test_b_1793018231600', 0, 'The founder and CEO of Emperor Smart Solutions is Heet. He founded the company in 2024.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_test_fail_1792760613215', 'org_default', 'bot_test_b_1793018231600', 'Broken File', 'Document', 38, 'Ready', 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_test_fail_1792760613215_0', 'doc_test_fail_1792760613215', 'org_default', 'bot_test_b_1793018231600', 0, 'Sample text for simulated failure test', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793018220241_ql7j', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793018099891_xbz7', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793018013173_kuvg', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793017982946_3btn', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793017905783_295h', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793017609360_hez7', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793016602051_rikm', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793015654003_6rm7', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793014691885_xmol', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793014634340_ox4a', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793014537486_ki5y', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793014465756_wt8j', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793014255240_65bd', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793014205273_ht8m', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793013941559_gcuv', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793013708385_lxno', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793012947848_n4b5', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793012808004_x0nk', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1793011952886_avhn', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792761971870_nkww', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792761778917_3tto', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792761748536_3a67', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792760889292_itut', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792760858161_01v1', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_1792760446936_4dyf', 'org_default', 'bot_test_b_1793018231600', 'Orphan Visitor', '', '', 'Active', false, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1792754649681', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1793018231600', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1793018231600', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('wa_919876543210', 'org_default', 'bot_test_b_1792751631583', 'WhatsApp Lead', '', '919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('conv_medical_secret', 'org_default', 'bot_test_b_1793018231600', 'Patient John Doe', '', '+919876543210', 'Active', true, '', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Conversation" ("id", "organizationId", "botId", "visitorName", "visitorEmail", "visitorPhone", "status", "isLead", "lastMessage", "createdAt", "updatedAt")
VALUES ('c_eval_test_30', 'org_default', 'bot_test_b_1793018231600', 'Test Prospect', 'prospect@eval.com', '', 'Active', true, 'Need AI bot', NOW(), NOW())
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