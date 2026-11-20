# EMPEROR NEXUS — STAGE 3 INFRASTRUCTURE BASELINE & DISCOVERY REPORT

**Document ID:** `STAGE-3-INFRA-BASELINE-001`  
**Date:** November 20, 2026  
**Auditor / Lead Performance Engineer:** Antigravity Autonomous Performance & SRE Engineer  
**Baseline Git Commit:** `639b621` (Stage 2.8 Completed & Verified)  
**Target Environment:** Contabo Cloud VPS XL (`95.111.242.173`) & Emperor Nexus SaaS Stack  
**Discovery Mode:** READ-ONLY / EVIDENCE-BASED (Zero modifications made to host, containers, or configs)

---

## 1. EXECUTIVE INFRASTRUCTURE SUMMARY

Prior to conducting synthetic load testing, a thorough, evidence-based discovery was conducted on the Contabo host and the deployed Emperor Nexus container topology. 

### Key Infrastructure Findings:
1. **Compute Resources:** The host is a high-capacity **Contabo Cloud VPS XL** equipped with **16 vCPU AMD EPYC cores** (@ 2.0 GHz) and **62.79 GiB RAM**.
2. **Current Host Utilization:** Highly underutilized. Total RAM in use is **4.5 GiB (7.1%)**, leaving **58 GiB of physical memory free**. 15 out of 16 CPU cores are completely idle.
3. **Critical SRE Risk — Zero Swap:** The VPS has **`Swap: 0B`** configured. If memory bursts exceed limits, the Linux kernel Out-Of-Memory (OOM) killer will terminate processes without warning.
4. **Multi-Tenant VPS Co-Hosting:** The machine hosts **28 Docker containers** across multiple independent client projects (`convoza`, `admafia`, `knotelle`, `nutsandnutrition`, `talknex`, etc.). One background container (`admafia-mongo`) is actively using ~88% of 1 CPU core. All testing must enforce strict isolation and safety cutoffs to guarantee zero degradation to co-tenants.
5. **Architectural Bottlenecks Identified Pre-Test:**
   - **Nginx Ingress Concurrency Limit:** Bounded to `limit_conn emperor_nexus_conn 40;` per client IP.
   - **Nginx Ingress Rate Limit:** Chat endpoints capped at `45 requests/minute` with `burst=15 nodelay`.
   - **Next.js AI Concurrency Limiter:** Bounded to `20 active concurrent inferences` and an internal FIFO queue of `60 requests` (`frontend/lib/ai/inferenceProvider.js`).
   - **PostgreSQL Connection Ceiling:** Database server configured for `max_connections=60`; Next.js pool configured with `DB_POOL_MAX=15`.

---

## 2. DETAILED HARDWARE & OPERATING SYSTEM BASELINE

| Component | Measured Host Value | Technical Architecture & Baseline Details |
| :--- | :--- | :--- |
| **Hosting Provider** | Contabo | Cloud VPS XL tier, KVM Full Virtualization |
| **Operating System** | Ubuntu 24.04.5 LTS | Kernel `Linux 6.8.0-147-generic`, `x86_64` |
| **vCPU Allocation** | **16 vCPUs** | `AMD EPYC Processor (with IBPB)`, 1 Socket, 16 Cores @ 2.0 GHz |
| **Host CPU Utilization** | **5.5% Total** | 15.1 cores idle. `admafia-mongo` consuming ~88% of 1 core |
| **Physical RAM** | **62.79 GiB** | 4.5 GiB Used (7.1%), **58 GiB Available**, 7.7 GiB Buffer/Cache |
| **Swap Space** | **0 B** | **No swap file or partition configured** (High OOM risk) |
| **Primary Storage** | **300 GB NVMe / SSD** | `/dev/sda` (`ROTA: 0` = Fast SSD/NVMe). Partition `/dev/sda1` on ext4 |
| **Storage Utilization** | **124 GB Used / 166 GB Free** | **43% Used**, 166 GB free headroom (Safe buffer > 58 GB abort limit) |
| **Uplink Network** | Contabo 200–1000 Mbps | 32 TB/month unmetered bandwidth allocation |
| **Edge Ingress / WAF** | Cloudflare | Full SSL/TLS termination, DDoS protection, edge caching |

---

## 3. DOCKER CONTAINER TOPOLOGY & RESOURCE CONSUMPTION

A live inspection of all 28 containers active on the VPS was performed:

### 3.1 Emperor Nexus / ESS SaaS Target Stack
| Container Name | CPU % | Memory Usage / Limit | Mem % | Network Mode & Ports |
| :--- | :---: | :---: | :---: | :--- |
| `ess-frontend` | 0.00% | 70 MiB / 62.79 GiB | 0.11% | Loopback: `127.0.0.1:3300 -> 3000/tcp` (`ess_internal`) |
| `ess-postgres` | 0.00% | 31.9 MiB / 62.79 GiB | 0.05% | Isolated bridge: `5432/tcp` (`ess_internal`) |
| `emperor-nexus-redis` | 0.96% | 5.9 MiB / 96 MiB | 6.15% | Isolated bridge: `6379/tcp` (`emperor_nexus_internal`) |
| `emperor-nexus-postgres` | 0.00% | 33.8 MiB / 512 MiB | 6.60% | Isolated bridge: `5432/tcp` (`emperor_nexus_internal`) |

### 3.2 Co-Hosted Neighboring Applications (Non-Nexus Workloads)
| Application Stack | Active Containers | Total Memory | Active CPU Load | Risk Profile |
| :--- | :---: | :---: | :---: | :--- |
| **Admafia** | 5 containers (`mongo`, `backend`, `redis`, `frontend`, `mongo-express`) | 687 MiB | **88.6% of 1 core** | MongoDB active in background loop. |
| **Convoza** | 9 containers (`nginx`, `postgres`, `api`, `dashboard`, 3 workers, etc.) | 366 MiB | 0.03% | Idle B2B messaging stack. |
| **Knotelle** | 2 containers (`app`, `db`) | 273 MiB | 0.05% | Idle e-commerce web/db stack. |
| **Nuts & Nutrition**| 2 containers (`app`, `db`) | 225 MiB | 0.06% | Idle business web/db stack. |
| **Aviator Guide** | 2 containers (`app-1`, `db-1`) | 159 MiB | 0.00% | Idle web/db stack. |
| **Rocky Blog** | 2 containers (`app-1`, `db-1`) | 160 MiB | 0.00% | Idle web/db stack. |
| **Talknex** | 2 containers (`web`, `api`) | 101 MiB | 0.00% | Idle web/api stack. |

> **Neighbor Protection Guard:** Emperor Nexus load tests must never consume more than 4 host CPU cores or 8 GB RAM to ensure 100% stability for all neighboring production stacks.

---

## 4. APPLICATION & DATABASE CONFIGURATION LIMITS

### 4.1 Nginx Reverse Proxy (`nginx/emperornexus.com.conf`)
- **Upstream:** `http://127.0.0.1:3300` with `keepalive 32;`
- **Per-IP Connection Limit:** `limit_conn emperor_nexus_conn 40;`
- **Rate-Limit Zones:**
  - `emperor_nexus_otp`: `6 requests/minute`, burst `8 nodelay`
  - `emperor_nexus_chat`: `45 requests/minute`, burst `15 nodelay`
  - `emperor_nexus_general`: `120 requests/minute`, burst `40 nodelay`
- **Real-Time SSE Buffering:** `proxy_buffering off; proxy_cache off; proxy_set_header X-Accel-Buffering no;`
- **Timeouts:** Connect `10s`, Read `90s`, Send `90s`.

### 4.2 Application Runtime (`Next.js 16` on Node 20)
- **Node Heap Limit:** `NODE_OPTIONS=--max-old-space-size=768` (768 MB).
- **Inference Concurrency Limiter (`frontend/lib/ai/inferenceProvider.js`):**
  - Maximum concurrent active inference turns: `20`
  - Queue capacity: `60 requests`
  - Wait queue timeout: `15,000ms`
  - Max generation timeout: `45,000ms`
- **Application-Layer Rate Limiting (`frontend/lib/security/rateLimitPolicy.js`):**
  - `chat_ip`: `40 requests/min` (Sliding window)
  - `chat_visitor`: `30 requests/min`
  - `chat_conversation`: `20 requests/min`
  - `otp_send_ip`: `8 requests/10 min`
  - `ip_general`: `120 requests/min`
- **Concurrency Locks (`frontend/lib/security/concurrencyLock.js`):**
  - Multi-instance distributed Redis Lua semaphore (`ZSET` with TTL).
  - Conversation-level lock: Strictly 1 active generation per conversation (`maxConcurrent=1`).

### 4.3 PostgreSQL 16 & pgvector Database
- **Max Connections:** Configured as `60` in `docker-compose.contabo.yml`.
- **Application Pool (`frontend/lib/db/dbPool.js`):**
  - `DB_POOL_MAX = 15`
  - Idle timeout: `30,000ms`
  - Connection timeout: `5,000ms`
- **Memory Parameters:** `shared_buffers=128MB`, `effective_cache_size=384MB`, `work_mem=4MB`, `maintenance_work_mem=64MB`.

### 4.4 Redis 7 Queue & Cache (`emperor-nexus-redis`)
- **Max Memory:** `64mb` (`--maxmemory 64mb --maxmemory-policy allkeys-lru`).
- **Persistence:** Disabled (`save ""` and `appendonly no`) for sub-millisecond memory performance.
- **Streams Architecture:** `stream:otp_dispatch` with consumer group `group:otp_workers` and DLQ `stream:otp_dispatch:dlq`.

---

## 5. THE SIX TARGET QUESTIONS & PRE-TEST ARCHITECTURAL ASSESSMENT

| Question | Architectural Constraint / Current Limitation | Expected Measured Bottleneck |
| :--- | :--- | :--- |
| **1. Simultaneous Visitors Supported** | Bounded by Nginx `limit_conn 40` per IP and Next.js static asset delivery. | Cloudflare edge absorbs static widget requests. Without Cloudflare, Nginx connection zone caps single IP testing at 40 concurrent conns. |
| **2. Simultaneous AI Conversations** | Explicitly bounded by `ConcurrencyLimiter(20, 60)` in `inferenceProvider.js`. | **Hard cap at 20 concurrent AI generations**. The 21st to 80th requests queue; 81st request returns HTTP 503 Provider Overloaded. |
| **3. Concurrent SSE Connections** | Node.js event loop handles thousands of idle connections; Nginx keepalive is set to 32. | Ephemeral SSE tickets expire in 60s; idle SSE heartbeat uses minimal memory (~15 KB per stream). |
| **4. Actual Primary Bottleneck** | **AI Inference Provider Throughput & In-App Concurrency Limiter (20 workers)**. | Not CPU or RAM. The application-level rate limiters and 20-worker inference concurrency throttle requests long before the 16 AMD EPYC cores reach 20% load. |
| **5. Behavior at Capacity** | Clean fail-safe rejection (`HTTP 429 Too Many Requests` or `HTTP 503 Provider Overloaded`). | No process crashing or unhandled rejections; concurrency limiter queue sheds load gracefully. |
| **6. Tenant Isolation Under Heavy Concurrency** | Stage 2.8 removed all fallback assignments (`|| "org_ess_default"`). | Session and conversation queries strictly partition by `organizationId`. Verification under 100 concurrent requests must confirm 0 cross-tenant data leakage. |

---

## 6. PHASE B-H TESTING METHODOLOGY & PROPOSED SAFETY PLAN

### 6.1 Test Infrastructure Requirements
- **Staging / Isolation Policy:**
  - In strict compliance with Safety Rule 9 & 10, **destructive testing and unmetered AI calls are forbidden against production**.
  - All automated benchmarks must utilize **mocked AI inference (`DEFAULT_AI_PROVIDER=mock`)** or dedicated test API keys with strict spending caps ($1.00 budget limit).
  - Synthetic test organizations (`org_test_alpha_stage3` and `org_test_beta_stage3`) will be provisioned with ephemeral test bots. Zero production user accounts, phone numbers, or real SMS gateways (`Fast2SMS`) will be invoked.

### 6.2 Automatic Safety Abort Thresholds
Testing scripts will automatically abort if any of the following occur:
1. **Host CPU Load:** Sustained host CPU $>85\%$ for $>10\text{ seconds}$.
2. **Host RAM Headroom:** Available memory $< 15\text{ GiB}$.
3. **Neighbor Impact:** Any neighbor container (`convoza-*`, `admafia-*`) status changes from `Up` to `Restarting` or `Unhealthy`.
4. **PostgreSQL Connections:** Active pool connections exceed 50 (approaching the 60 limit).
5. **Error Rate:** Uncontrolled errors exceed 5% (excluding expected HTTP 429/503 rate-limiting tests).

---

## 7. IMMEDIATE OPERATIONAL RECOMMENDATION BEFORE STAGE 3 EXECUTION

Prior to executing heavy concurrent connection tests, enable a **4 GB or 8 GB swap file** on the host:
```bash
sudo fallocate -l 8G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
*Rationale:* Even though 58 GB of RAM is available, kernel swap provides an essential safety net against sudden allocator spikes during high-concurrency network stress tests.
