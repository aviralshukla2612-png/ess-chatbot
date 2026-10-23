-- =========================================================
-- ESS CHATBOT SaaS — COMPLETE POSTGRESQL & PGVECTOR MIGRATION
-- Generated: 2026-10-23T06:27:28.591Z
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

-- Organization & Bot: Beta Tech Support (bot_beta_valid)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
VALUES ('org_reg_beta_222', 'Default Org', 'org-bot_beta_valid', 'Enterprise', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Bot" ("id", "organizationId", "name", "description", "avatar", "primaryColor", "status", "systemPrompt", "welcomeMessage", "createdAt", "updatedAt")
VALUES ('bot_beta_valid', 'org_reg_beta_222', 'Beta Tech Support', '', '🤖', '#4f46e5', 'Active', '', 'Hello! I am Beta Tech Support. How can I help you today?', NOW(), NOW())
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