-- =====================================================================
-- ESS CHATBOT SaaS — COMPLETE STAGING INITIAL DATABASE SCHEMA & SEED
-- File: frontend/data/staging_initial_schema.sql
-- Environment: Staging (Safe for completely empty PostgreSQL databases)
-- Guaranteed Idempotency: CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING
-- Zero Destructive Statements: NO DROP TABLE, NO TRUNCATE
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- 2. CORE TENANCY & IDENTITY TABLES
-- ---------------------------------------------------------------------

-- Organizations Table
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(128) UNIQUE NOT NULL,
  "plan" VARCHAR(64) DEFAULT 'Enterprise',
  "status" VARCHAR(64) DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS "User" (
  "id" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" VARCHAR(64) DEFAULT 'MEMBER',
  "status" VARCHAR(64) DEFAULT 'ACTIVE',
  "emailVerifiedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization Memberships (User-to-Tenant Mapping with RBAC)
CREATE TABLE IF NOT EXISTS "OrganizationMembership" (
  "id" VARCHAR(64) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" VARCHAR(64) DEFAULT 'MEMBER',
  "status" VARCHAR(64) DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_org_user" UNIQUE ("organizationId", "userId")
);

-- ---------------------------------------------------------------------
-- 3. CHATBOT CONFIGURATION & VISITORS
-- ---------------------------------------------------------------------

-- Bots Table
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
  "company" VARCHAR(255),
  "websiteUrl" TEXT,
  "phoneNumber" VARCHAR(64),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visitors Table (Opaque visitor token hash tracking)
CREATE TABLE IF NOT EXISTS "Visitor" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "visitorTokenHash" VARCHAR(128) NOT NULL,
  "leadId" VARCHAR(128),
  "name" VARCHAR(255),
  "email" VARCHAR(255),
  "phone" VARCHAR(64),
  "metadata" JSONB DEFAULT '{}'::JSONB,
  "lastSeenAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "lastConversationAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_visitor_token_bot" UNIQUE ("botId", "visitorTokenHash")
);

-- ---------------------------------------------------------------------
-- 4. CONVERSATIONS & LEADS
-- ---------------------------------------------------------------------

-- Conversations Table
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "visitorId" VARCHAR(128),
  "leadId" VARCHAR(128),
  "visitorName" VARCHAR(255) DEFAULT 'Website Visitor',
  "visitorEmail" VARCHAR(255),
  "visitorPhone" VARCHAR(64),
  "visitorLocation" VARCHAR(128),
  "status" VARCHAR(64) DEFAULT 'Active',
  "isLead" BOOLEAN DEFAULT FALSE,
  "leadScore" VARCHAR(32),
  "lastMessage" TEXT,
  "qualificationState" JSONB DEFAULT '{}'::JSONB,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "historyExpiresAt" TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS "Message" (
  "id" VARCHAR(128) PRIMARY KEY,
  "conversationId" VARCHAR(128) NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "role" VARCHAR(32) NOT NULL,
  "content" TEXT NOT NULL,
  "tokens" INT,
  "latencyMs" INT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leads Table
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

-- ---------------------------------------------------------------------
-- 5. KNOWLEDGE BASE & VECTOR RETRIEVAL (NEXT.JS & FASTAPI)
-- ---------------------------------------------------------------------

-- Knowledge Documents Table (Next.js)
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

-- Knowledge Chunks Table with Vector(768) (Next.js)
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id" VARCHAR(128) PRIMARY KEY,
  "documentId" VARCHAR(128) REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "organizationId" VARCHAR(64) NOT NULL,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "chunkIndex" INT DEFAULT 0,
  "content" TEXT NOT NULL,
  "contentHash" VARCHAR(64),
  "embedding" VECTOR(768),
  "sourceUrl" TEXT,
  "pageTitle" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Chunks Table for FastAPI RAG Service (app/db.py compatibility)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  category VARCHAR(100),
  content TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 6. WEBSITE CRAWLER & WIDGET INTEGRATION
-- ---------------------------------------------------------------------

-- Website Knowledge Sources
CREATE TABLE IF NOT EXISTS "WebsiteSource" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "crawlScope" VARCHAR(32) DEFAULT 'entire',
  "maxPages" INT DEFAULT 50,
  "includePatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "excludePatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "syncSchedule" VARCHAR(32) DEFAULT 'manual',
  "status" VARCHAR(64) DEFAULT 'Pending',
  "pagesDiscovered" INT DEFAULT 0,
  "pagesIndexed" INT DEFAULT 0,
  "pagesSkipped" INT DEFAULT 0,
  "pagesFailed" INT DEFAULT 0,
  "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
  "lastError" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Website Pages
CREATE TABLE IF NOT EXISTS "WebsitePage" (
  "id" VARCHAR(128) PRIMARY KEY,
  "websiteSourceId" VARCHAR(128) NOT NULL REFERENCES "WebsiteSource"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL,
  "organizationId" VARCHAR(64) NOT NULL,
  "url" TEXT NOT NULL,
  "canonicalUrl" TEXT,
  "title" TEXT,
  "description" TEXT,
  "contentHash" VARCHAR(64),
  "crawlStatus" VARCHAR(64) DEFAULT 'Pending',
  "chunksCount" INT DEFAULT 0,
  "httpStatus" INT DEFAULT 200,
  "lastIndexedAt" TIMESTAMP WITH TIME ZONE,
  "lastError" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crawler Ingestion Jobs (crawlerQueue.js & schema.prisma)
CREATE TABLE IF NOT EXISTS "IngestionJob" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "websiteSourceId" VARCHAR(128),
  "status" VARCHAR(64) DEFAULT 'Pending',
  "url" TEXT,
  "maxPages" INT DEFAULT 50,
  "currentStep" VARCHAR(64) DEFAULT 'Queued',
  "progress" INT DEFAULT 0,
  "discoveredCount" INT DEFAULT 0,
  "indexedCount" INT DEFAULT 0,
  "failedCount" INT DEFAULT 0,
  "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "errorDetails" TEXT
);

-- Widget Installations & Verification
CREATE TABLE IF NOT EXISTS "WidgetInstallation" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "domain" VARCHAR(255) NOT NULL,
  "cmsProvider" VARCHAR(64),
  "installationType" VARCHAR(32) DEFAULT 'script',
  "installationStatus" VARCHAR(32) DEFAULT 'Unverified',
  "lastVerifiedAt" TIMESTAMP WITH TIME ZONE,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_widget_bot_domain" UNIQUE ("botId", "domain")
);

-- ---------------------------------------------------------------------
-- 7. BILLING, QUOTAS, AUDIT & INTEGRATIONS
-- ---------------------------------------------------------------------

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" VARCHAR(64) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "provider" VARCHAR(64) DEFAULT 'razorpay',
  "providerCustomerId" VARCHAR(128),
  "providerSubscriptionId" VARCHAR(128),
  "planId" VARCHAR(64) DEFAULT 'STARTER',
  "status" VARCHAR(64) DEFAULT 'active',
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage Records Table (Quota Enforcement)
CREATE TABLE IF NOT EXISTS "UsageRecord" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64),
  "conversationId" VARCHAR(128),
  "metric" VARCHAR(64) NOT NULL,
  "quantity" INT DEFAULT 1,
  "periodKey" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Keys Table (Server-to-Server Authentication)
CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id" VARCHAR(64) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "keyHash" VARCHAR(128) NOT NULL UNIQUE,
  "prefix" VARCHAR(32) NOT NULL,
  "role" VARCHAR(64) DEFAULT 'MEMBER',
  "lastUsedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing Events Table (Idempotent Webhook Receipts)
CREATE TABLE IF NOT EXISTS "BillingEvent" (
  "id" VARCHAR(128) PRIMARY KEY,
  "provider" VARCHAR(64) NOT NULL,
  "eventId" VARCHAR(128) UNIQUE NOT NULL,
  "eventType" VARCHAR(128) NOT NULL,
  "organizationId" VARCHAR(64),
  "payload" JSONB,
  "processedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Configurations
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

-- Webhook Delivery Log
CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  "id" VARCHAR(128) PRIMARY KEY,
  "webhookConfigId" VARCHAR(128) NOT NULL REFERENCES "WebhookConfig"("id") ON DELETE CASCADE,
  "event" VARCHAR(64) NOT NULL,
  "statusCode" INT,
  "responseBody" TEXT,
  "success" BOOLEAN DEFAULT FALSE,
  "attemptCount" INT DEFAULT 1,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table
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

-- WhatsApp Phone Number Mappings
CREATE TABLE IF NOT EXISTS "WhatsAppMapping" (
  "id" VARCHAR(64) PRIMARY KEY,
  "phoneNumberId" VARCHAR(128) UNIQUE NOT NULL,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "webhookSecret" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 8. INDEXES (HNSW Vector + Multi-Tenant B-Tree Performance)
-- ---------------------------------------------------------------------

-- HNSW Vector Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_hnsw 
ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Multi-Tenant B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_bot_org ON "Bot" ("organizationId");
CREATE INDEX IF NOT EXISTS idx_visitor_lookup ON "Visitor" ("botId", "visitorTokenHash");
CREATE INDEX IF NOT EXISTS idx_visitor_tenant ON "Visitor" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON "Conversation" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_conversation_visitor ON "Conversation" ("visitorId", "lastActivityAt");
CREATE INDEX IF NOT EXISTS idx_conversation_history_expiry ON "Conversation" ("historyExpiresAt");
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON "Lead" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON "KnowledgeDocument" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tenant ON "KnowledgeChunk" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User" ("email");
CREATE INDEX IF NOT EXISTS idx_membership_lookup ON "OrganizationMembership" ("organizationId", "userId");
CREATE INDEX IF NOT EXISTS idx_subscription_org ON "Subscription" ("organizationId");
CREATE INDEX IF NOT EXISTS idx_usage_org_metric_period ON "UsageRecord" ("organizationId", "metric", "periodKey");
CREATE INDEX IF NOT EXISTS idx_apikey_hash ON "ApiKey" ("keyHash");
CREATE INDEX IF NOT EXISTS idx_websitesource_tenant ON "WebsiteSource" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_websitepage_source ON "WebsitePage" ("websiteSourceId");
CREATE INDEX IF NOT EXISTS idx_widget_bot ON "WidgetInstallation" ("botId");
CREATE INDEX IF NOT EXISTS idx_ingestion_tenant ON "IngestionJob" ("organizationId", "botId");

-- ---------------------------------------------------------------------
-- 9. SAFE INITIAL STAGING SEED DATA (IDEMPOTENT)
-- ---------------------------------------------------------------------

-- Default Primary Organization
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_ess_default', 'Emperor Smart Solutions', 'org-ess-default', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Default Secondary Organization (Matches legacy bot_aa org)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_default', 'Emperor Smart Solutions Default', 'org-bot-aa', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Note: Administrator user accounts are NEVER seeded with hardcoded passwords in SQL files.
-- Run 'node scripts/bootstrap_admin.js' to securely bootstrap the initial superadmin account at runtime.

-- Default Active Subscription
INSERT INTO "Subscription" ("id", "organizationId", "provider", "planId", "status", "currentPeriodStart", "currentPeriodEnd")
VALUES ('sub_ess_default', 'org_ess_default', 'razorpay', 'ENTERPRISE', 'active', NOW(), NOW() + INTERVAL '1 year')
ON CONFLICT ("id") DO NOTHING;

-- Primary Staging AI Chatbot (bot_aa)
INSERT INTO "Bot" (
  "id", "organizationId", "name", "description", "avatar", "primaryColor", "status",
  "systemPrompt", "welcomeMessage", "createdAt", "updatedAt"
)
VALUES (
  'bot_aa',
  'org_default',
  'aa',
  'Official AI assistant for Emperor Smart Solutions.',
  '⚡',
  '#4f46e5',
  'Active',
  'You are the official AI assistant for Emperor Smart Solutions (ESS), founded by Yash Sharma (Founder) and Karan Makwana (Co-Founder). Provide verified facts about services, founders, developer hiring, office location in Ahmedabad, and budget tiers. Never fabricate or invent facts.',
  'Hello! I am the AI assistant for Emperor Smart Solutions. How can I help you today?',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Mirror bot_aa into org_ess_default for multi-tenant continuity
INSERT INTO "Bot" (
  "id", "organizationId", "name", "description", "avatar", "primaryColor", "status",
  "systemPrompt", "welcomeMessage", "createdAt", "updatedAt"
)
VALUES (
  'bot_aa_primary',
  'org_ess_default',
  'Emperor Assistant',
  'Official Primary AI Assistant for Emperor Smart Solutions.',
  '🤖',
  '#4f46e5',
  'Active',
  'You are the official AI sales executive for Emperor Smart Solutions.',
  'Hello! How can Emperor Smart Solutions help your business today?',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Baseline Knowledge Document
INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 'Emperor_Smart_Solutions_Master_Corporate_Profile.pdf', 'PDF', 14200, 'Ready', 4, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Baseline Knowledge Chunks (with content text for BM25 and fallback retrieval)
INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES (
  'chk_doc_emperor_smart_solutions_01_1',
  'doc_emperor_smart_solutions_01',
  'org_default',
  'bot_aa',
  1,
  'Company Overview: Emperor Smart Solutions is an IT and Software Consultancy headquartered in Ahmedabad, Gujarat, India. Leadership: Yash Sharma (Founder) and Karan Makwana (Co-Founder). Core Competencies: Autonomous AI Chatbots, Full-Stack SaaS Platforms, Custom ERP & CRM Solutions, Mobile Application Engineering, Cloud Infrastructure & DevOps.',
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES (
  'chk_doc_emperor_smart_solutions_01_2',
  'doc_emperor_smart_solutions_01',
  'org_default',
  'bot_aa',
  2,
  'Developer Hiring & Engagement Models: Dedicated Developer Pods, Hourly T&M, Fixed-Price Milestones. Tech Stack: Next.js, React, Node.js, Python, PostgreSQL, Flutter, AWS, Docker.',
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES (
  'chk_doc_emperor_smart_solutions_01_3',
  'doc_emperor_smart_solutions_01',
  'org_default',
  'bot_aa',
  3,
  'Pricing Tiers: Rapid Prototypes: Under ₹50,000. Standard Web/Mobile Modules: ₹50,000 - ₹2,00,000. Enterprise Software: ₹2,00,000 - ₹5,00,000+.',
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES (
  'chk_doc_emperor_smart_solutions_01_4',
  'doc_emperor_smart_solutions_01',
  'org_default',
  'bot_aa',
  4,
  'Support & Guarantees: All engagements include 100% bilateral NDA protection and 30 days of complimentary post-launch hypercare support.',
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Seed FastAPI knowledge_chunks table
INSERT INTO knowledge_chunks (id, title, category, content, created_at)
VALUES (
  1,
  'Emperor Smart Solutions Corporate Profile',
  'Company Information',
  'Emperor Smart Solutions founders: Karan Makwana & Yash Sharma. Comprehensive IT consultancy offering custom software, AI chatbot pipelines, Next.js web applications, and mobile app engineering.',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Synchronize sequence for knowledge_chunks serial primary key
SELECT setval(pg_get_serial_sequence('knowledge_chunks', 'id'), COALESCE((SELECT MAX(id) FROM knowledge_chunks), 1));

COMMIT;
