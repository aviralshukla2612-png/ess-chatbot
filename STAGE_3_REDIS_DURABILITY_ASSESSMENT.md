# EMPEROR NEXUS — STAGE 3 REDIS DURABILITY & OTP QUEUE VULNERABILITY ASSESSMENT

**Document ID:** `STAGE-3-REDIS-DURABILITY-001`  
**Date:** November 20, 2026  
**Auditor / Principal Infrastructure Architect:** Antigravity Autonomous Performance & SRE Engineer  
**Baseline Git Commit:** `639b621` (Stage 2.8 Hardened)  
**Target Environment:** Production Redis (`emperor-nexus-redis` / `redis:7-alpine`)  
**Status:** AUDIT COMPLETED — ARCHITECTURAL UPGRADE PROPOSED (Zero production changes executed)

---

## 1. EXECUTIVE SUMMARY & CRITICAL VULNERABILITY ALERT

In Stage 2.8, the Emperor Nexus asynchronous OTP dispatch architecture was modernized to use **Redis Streams** (`stream:otp_dispatch`), Consumer Groups (`group:otp_workers`), and a Dead-Letter Queue (`stream:otp_dispatch:dlq`).

However, discovery in Phase A revealed that the production Redis container is running with:
```bash
redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru --save "" --appendonly no
```

> [!CAUTION]
> **CRITICAL RELIABILITY & DATA LOSS VULNERABILITY:**  
> Running Redis Streams inside an in-memory Redis instance with **persistence disabled (`save ""` and `appendonly no`)** and **blind eviction (`allkeys-lru`)** creates a severe architectural flaw: **unprocessed OTP jobs, pending recovery lists, and DLQ diagnostics will be silently destroyed during container restarts, host reboots, or memory pressure.**

---

## 2. DETAILED FAILURE MODE & THREAT ANALYSIS

### 2.1 Threat Scenario 1: Redis Container Restart or Crash
- **Current Behavior:** Because snapshotting (`save ""`) and AOF (`appendonly no`) are disabled, Redis stores all keys strictly in volatile container RAM.
- **Impact:** Any `docker compose restart redis`, container crash, OOM kill, or host reboot completely wipes the database.
- **SaaS Consequence:** Any user who requested a password reset or registration OTP immediately before the crash is permanently stranded. The stream message is destroyed, `XAUTOCLAIM` has nothing to recover, and no SMS is ever sent.

### 2.2 Threat Scenario 2: Blind Key Eviction Under `allkeys-lru`
- **Current Behavior:** Redis memory is capped at `64mb` with `maxmemory-policy allkeys-lru`.
- **The Eviction Flaw:** Under `allkeys-lru`, Redis evicts the least recently used key regardless of whether it has an expiration (TTL) or not.
- **The Mechanism of Data Loss:**
  1. The application shares Redis between:
     - Rate-limiting sliding windows (`ratelimit:*`)
     - Concurrency semaphores (`concurrency:*`)
     - SSE tickets (`sse:tkt:*`)
     - OTP Streams (`stream:otp_dispatch`)
     - Dead-Letter Queue (`stream:otp_dispatch:dlq`)
  2. If a sudden burst of traffic creates thousands of rate-limit or SSE keys that consume the 64 MB limit, Redis searches for keys to evict.
  3. If `stream:otp_dispatch` or `stream:otp_dispatch:dlq` has not been written to within the LRU window, **Redis will evict the entire Stream key itself!**
  4. Once evicted, all queued jobs, consumer group offsets, and pending entry lists (PEL) are instantly deleted without throwing an application error.

### 2.3 Threat Scenario 3: Stream and Consumer Group Metadata Eviction
- Redis Streams store consumer groups and PEL internally as part of the stream key data structure.
- When an eviction policy removes stream entries or drops the key, all unacknowledged jobs held by workers are eradicated.

---

## 3. PRODUCTION DURABILITY ARCHITECTURE RECOMMENDATIONS

To achieve genuine enterprise-grade durability for OTP dispatch and account security, the following three remediation strategies are evaluated:

| Remediation Strategy | Implementation Details | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :---: |
| **Strategy 1: Enable AOF Persistence** | Enable `appendonly yes` with `appendfsync everysec` on a persistent Docker volume. | Survives process crashes and container reboots with max 1 second loss window. | Minor disk I/O overhead. | **MANDATORY BASELINE** |
| **Strategy 2: Change Eviction Policy to `volatile-lru`** | Change `maxmemory-policy` from `allkeys-lru` to `volatile-lru`. | Keys without TTL (like Streams and DLQ) are **never evicted**. Cache keys with TTL are evicted first. | If non-TTL keys exceed 64MB, writes throw `OOM command not allowed`. | **RECOMMENDED FOR COMBINED REDIS** |
| **Strategy 3: Dedicated Redis Queue Instance** | Split into two Redis instances: `emperor-nexus-redis-cache` (64MB, LRU) and `emperor-nexus-redis-queue` (64MB, AOF, `noeviction`). | Total physical isolation between volatile rate-limit caching and durable transactional job queues. | Requires running 2 small Redis containers (~15 MB RAM each). | **GOLD STANDARD (ENTERPRISE)** |

---

## 4. PROPOSED PRODUCTION CONFIGURATION SPECIFICATION

### Option A: Hardened Unified Redis (Single Container Upgrade)
This is the simplest in-place upgrade. It introduces AOF disk persistence, safe eviction, and a persistent Docker volume:

```yaml
  redis:
    image: redis:7-alpine
    container_name: emperor-nexus-redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --no-appendfsync-on-rewrite yes
      --auto-aof-rewrite-percentage 100
      --auto-aof-rewrite-min-size 16mb
      --maxmemory 128mb
      --maxmemory-policy volatile-lru
    volumes:
      - emperor_nexus_redis_data:/data
    networks:
      - emperor_nexus_internal
    mem_limit: 192m
    cpus: 0.5
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
```

#### Why This Completely Solves the Vulnerability:
1. **`appendonly yes` + `appendfsync everysec`:** All `XADD`, `XACK`, and `XDEL` stream commands are flushed to disk every second. If Redis crashes or restarts, it replays the AOF log upon startup and restores every unacknowledged job.
2. **`maxmemory-policy volatile-lru`:** Stream keys (`stream:otp_dispatch` and `stream:otp_dispatch:dlq`) do **not** have an expiration set. Redis is explicitly prohibited from evicting them. Only ephemeral rate-limit keys and tickets that possess an explicit TTL will be evicted when memory pressure occurs.
3. **`emperor_nexus_redis_data:/data`:** Persistent Docker named volume guarantees data survives container re-creation and host reboots.

---

## 5. NON-DESTRUCTIVE VERIFICATION IN STAGING

In strict compliance with safety rules, this durability strategy will be validated in the **isolated staging environment (`ess-redis-staging`)** during Phase B:
1. Enqueue 50 synthetic OTP jobs.
2. Crash/kill the staging Redis container (`docker kill ess-redis-staging`).
3. Restart the container (`docker start ess-redis-staging`).
4. Execute `XAUTOCLAIM` / `XREADGROUP` to verify that **100% of pending stream entries are restored and processed without data loss**.
