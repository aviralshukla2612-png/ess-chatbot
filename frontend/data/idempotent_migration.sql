-- =========================================================
-- ESS CHATBOT SaaS — COMPLETE POSTGRESQL & PGVECTOR MIGRATION
-- Generated: 2026-10-29T05:36:07.951Z
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

-- 11. User Table
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

-- 12. OrganizationMembership Table
CREATE TABLE IF NOT EXISTS "OrganizationMembership" (
  "id" VARCHAR(64) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" VARCHAR(64) DEFAULT 'MEMBER',
  "status" VARCHAR(64) DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_org_user" UNIQUE ("organizationId", "userId")
);

-- 13. Subscription Table
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

-- 14. UsageRecord Table
CREATE TABLE IF NOT EXISTS "UsageRecord" (
  "id" VARCHAR(128) PRIMARY KEY,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "metric" VARCHAR(64) NOT NULL,
  "quantity" INT DEFAULT 1,
  "periodKey" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. ApiKey Table
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

-- 16. BillingEvent Table (Idempotent Webhooks)
CREATE TABLE IF NOT EXISTS "BillingEvent" (
  "id" VARCHAR(128) PRIMARY KEY,
  "provider" VARCHAR(64) NOT NULL,
  "eventId" VARCHAR(128) UNIQUE NOT NULL,
  "eventType" VARCHAR(128) NOT NULL,
  "organizationId" VARCHAR(64),
  "payload" JSONB,
  "processedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. WhatsAppMapping Table
CREATE TABLE IF NOT EXISTS "WhatsAppMapping" (
  "id" VARCHAR(64) PRIMARY KEY,
  "phoneNumberId" VARCHAR(128) UNIQUE NOT NULL,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "botId" VARCHAR(64) NOT NULL REFERENCES "Bot"("id") ON DELETE CASCADE,
  "webhookSecret" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & vector search
CREATE INDEX IF NOT EXISTS idx_bot_org ON "Bot" ("organizationId");
CREATE INDEX IF NOT EXISTS idx_conversation_tenant ON "Conversation" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_lead_tenant ON "Lead" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_document_tenant ON "KnowledgeDocument" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_chunk_tenant ON "KnowledgeChunk" ("organizationId", "botId");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User" ("email");
CREATE INDEX IF NOT EXISTS idx_membership_lookup ON "OrganizationMembership" ("organizationId", "userId");
CREATE INDEX IF NOT EXISTS idx_subscription_org ON "Subscription" ("organizationId");
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_hnsw 
ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Organization & Bot: aa (bot_aa)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_default', 'Emperor Smart Solutions', 'org-bot_aa', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_aa', 'org_default', 'aa', 'Official AI assistant for Emperor Smart Solutions.', '⚡', '#4f46e5', 'Active', 'You are the official AI assistant for Emperor Smart Solutions (ESS), founded by Yash Sharma (Founder) and Karan Makwana (Co-Founder). Provide verified facts about services, founders, developer hiring, office location in Ahmedabad, and budget tiers. Never fabricate or invent facts.', 'Hello! I am the AI assistant for Emperor Smart Solutions. How can I help you today?', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "type", "sizeBytes", "status", "chunksCount", "createdAt", "updatedAt")
VALUES ('doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 'Emperor_Smart_Solutions_Company_Profile.pdf', 'PDF', 5601, 'Ready', 5, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_emperor_smart_solutions_01_0', 'doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 0, 'Company Identity & Leadership — Emperor Smart Solutions:
Emperor Smart Solutions (ESS) was founded by Yash Sharma (Founder) and Karan Makwana (Co-Founder).
It is an ISO 27001 & ISO 9001 certified digital engineering and enterprise AI company with 50+ projects delivered and 30+ happy clients.
• Founder: Yash Sharma
• Co-Founder: Karan Makwana
• Head Office: 202, Shitiratna Complex, Panchvati, Navrangpura, Ahmedabad - 380009, Gujarat, India
• Phone & WhatsApp: +91 63591 20081
• Email: emperorsmartsolutions@gmail.com | sales@emperorsmartsolutions.com | contact@emperorsmartsolutions.com
• Business Hours: Monday to Saturday: 10:00 AM – 7:00 PM IST (Sunday closed)', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_emperor_smart_solutions_01_1', 'doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 1, 'Core Engineering Services — Emperor Smart Solutions:
1. Custom Software & Web: Next.js, React, Node.js, Flutter, React Native, iOS, Android, microservices.
2. Enterprise AI & Machine Learning: RAG As A Service, custom LLM fine-tuning (Llama 3, GPT-4o, Claude 3.5), autonomous agents (LangChain, LlamaIndex), Vibe Coding (Cursor AI, Claude Code).
3. Cloud & DevOps: AWS, Azure, GCP, Kubernetes (EKS, AKS, GKE), Terraform IaC, CI/CD, PostgreSQL, Redis.
4. Cybersecurity: Zero-Trust, penetration testing, SOC 2 Type II, ISO 27001, HIPAA readiness, Cloudflare/AWS WAF.
5. Data & BI: Snowflake, BigQuery, Databricks, Kafka, Spark, Airflow, PowerBI, Tableau.
6. Enterprise & FinTech: Odoo, ERPNext, SAP, Salesforce, Algo trading engines (Zerodha, Angel One APIs).', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_emperor_smart_solutions_01_2', 'doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 2, 'Developer Hiring & Engagement Models:
Emperor Smart Solutions offers flexible hiring models (Dedicated Pods, Hourly T&M, Fixed-Price Milestones):
• Trending AI Developers: Cursor AI, Lovable, Claude Code, Gemini AI, LangChain/RAG Engineers
• Full-Stack & Frontend: Next.js, React, Vue, Angular, MERN/MEAN
• Backend & APIs: Python/Django, Node.js, Laravel/PHP, ASP.NET Core, Go
• Mobile: Flutter, React Native, Swift, Kotlin
• Cloud/DevOps: AWS Architects, Kubernetes SRE, Terraform specialists.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_emperor_smart_solutions_01_3', 'doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 3, 'Pricing & Typical Budget Tiers — Emperor Smart Solutions:
• Rapid Prototypes: Under ₹50,000
• Standard Web & Mobile Modules: ₹50,000 – ₹2,00,000
• Comprehensive Bespoke Applications: ₹2,00,000 – ₹5,00,000
• Enterprise Platforms, AI Pipelines & Algo Trading: ₹5,00,000+
All projects include 100% bilateral NDA protection and 24-hour response SLA.', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "createdAt")
VALUES ('chk_doc_emperor_smart_solutions_01_4', 'doc_emperor_smart_solutions_01', 'org_default', 'bot_aa', 4, 'Industries & Proven Case Studies:
• Retail & eCommerce (Osia Hypermart: 150-store chain cloud POS, 99.99% uptime)
• FinTech & Trading (AI loan approval engine: reduced latency from 48h to under 3 min)
• Healthcare (HIPAA Telehealth & WebRTC platform serving 50,000+ monthly appointments)
• Logistics, Real Estate, HR Tech (Silver One), GIS Analytics, Education & Non-Profit.', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed Real Users
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status", "createdAt", "updatedAt")
VALUES 
  ('usr_6908bee7720343c7', 'Emperor Smart Solution', 'admin@emperorsmartsolutions.com', '$2b$10$w8fA2wJdGZ7.uHhG5F2Opu5e9D8b3Z7zF3K1x9a8b7c6d5e4f3g2h', 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW()),
  ('usr_aviral_01', 'Aviral Shukla', 'aviralshukla2612@gmail.com', '$2b$10$w8fA2wJdGZ7.uHhG5F2Opu5e9D8b3Z7zF3K1x9a8b7c6d5e4f3g2h', 'MEMBER', 'ACTIVE', NOW(), NOW()),
  ('usr_panjabi_01', 'Panjabi Parvindar', 'panjabiparvindar77@gmail.com', '$2b$10$w8fA2wJdGZ7.uHhG5F2Opu5e9D8b3Z7zF3K1x9a8b7c6d5e4f3g2h', 'MEMBER', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "status", "createdAt")
VALUES 
  ('mem_admin_01', 'org_default', 'usr_6908bee7720343c7', 'SUPER_ADMIN', 'ACTIVE', NOW()),
  ('mem_aviral_01', 'org_default', 'usr_aviral_01', 'ORG_OWNER', 'ACTIVE', NOW()),
  ('mem_panjabi_01', 'org_default', 'usr_panjabi_01', 'ORG_OWNER', 'ACTIVE', NOW())
ON CONFLICT ("organizationId", "userId") DO NOTHING;

COMMIT;