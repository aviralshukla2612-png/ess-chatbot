# EMPEROR NEXUS — STAGE 3 RESOURCE SAFETY, ABORT THRESHOLDS & NEIGHBOR PROTECTION PLAN

**Document ID:** `STAGE-3-SAFETY-PLAN-001`  
**Date:** November 20, 2026  
**Auditor / Site Reliability Engineer:** Antigravity Autonomous Performance & SRE Engineer  
**Baseline Git Commit:** `639b621`  
**Host Context:** Contabo Cloud VPS XL (16 vCPU AMD EPYC / 64 GB RAM / 28 Containers)  
**Status:** SAFETY MANDATE ESTABLISHED

---

## 1. OBJECTIVE & NON-NEGOTIABLE SAFETY CEILINGS

Emperor Nexus co-exists on this host alongside multiple independent client applications (`convoza`, `admafia`, `knotelle`, `nutsandnutrition`, `talknex`, etc.). 

The primary SRE objective of Stage 3 is to establish real application capacity **without risking the performance, uptime, or data integrity of neighboring workloads**.

### Resource Budgeting Limits
- **Maximum Allocated Test Budget:** **4 vCPUs** (25% of host compute) & **8 GiB RAM** (12.5% of host memory).
- **Initial Ramp-Up Utilization:** Tests will commence at **$< 1.5\text{ vCPUs}$** and **$< 2\text{ GiB RAM}$**.
- **Host Buffer Reserved for Neighbors:** **12 vCPUs** and **$> 50\text{ GiB RAM}$** remain permanently free for operating system and co-tenant workloads.

---

## 2. AUTOMATIC TEST ABORT MATRIX (CIRCUIT BREAKERS)

Every test runner and synthetic benchmark script is wired to an automated circuit breaker. If any of the following triggers are tripped, the test suite **aborts immediately within 2 seconds**:

| Circuit Breaker Trigger | Metric Source | Abort Threshold | Automated Action |
| :--- | :--- | :--- | :--- |
| **Host CPU Saturation** | `/proc/stat` / `top` | Host CPU $> 85\%$ sustained for $> 10\text{s}$ | **SIGTERM** to benchmark runner; freeze request generator |
| **Host Memory Depletion** | `/proc/meminfo` | Available RAM $< 15\text{ GiB}$ | **Immediate hard exit**; prevent kernel OOM killer |
| **Neighbor Stack Failure** | `docker ps` health | Any neighbor container status $\neq \text{Up}$ | **Immediate test abort**; log container name and event |
| **PostgreSQL Pool Saturation** | `pg_stat_activity` | Active connections on database $> 40$ | Halt connection acquisition; release pooled sockets |
| **Redis Memory Limit** | `INFO memory` | `used_memory` on Redis $> 80\%$ of `maxmemory` | Stop stream publishing; flush test keys |
| **Application Error Rate** | HTTP response status | Sustained unexpected 5xx errors $> 5.0\%$ | Abort current concurrency tier; record bottleneck |
| **Disk Space Contention** | `statvfs` on `/` | Available disk $< 50\text{ GB}$ ($< 17\%$ free) | Immediately cease writing test logs |

---

## 3. NEIGHBORING CONTAINER BASELINE & HEALTH MONITORING

Prior to launching any load test, the baseline state of all 24 non-Nexus containers is recorded. During and after testing, an automated health probe verifies that zero neighbor containers restarted, degraded, or accumulated unhandled errors.

### Monitored Neighbor Inventory:
```text
STACK 1 (Convoza - 9 containers):
- convoza-nginx, convoza-admin, convoza-website, convoza-api, convoza-postgres,
  convoza-dashboard, convoza-campaign-worker, convoza-webhook-worker, convoza-message-worker

STACK 2 (Admafia - 5 containers):
- admafia-mongo, admafia-backend, admafia-redis, admafia-frontend, admafia-mongo-express

STACK 3 (Knotelle - 2 containers):
- knotelle-app, knotelle-db

STACK 4 (Nuts & Nutrition - 2 containers):
- nutsandnutrition-app, nutsandnutrition-db

STACK 5 (Talknex - 2 containers):
- talknex-web, talknex-api

STACK 6 (Aviator Guide - 2 containers):
- aviatorguide-app-1, aviatorguide-db-1

STACK 7 (Rocky Blog - 2 containers):
- rockyblog-app-1, rockyblog-db-1
```

---

## 4. CONTINUOUS BACKGROUND HEALTH PROBE SPECIFICATION

During benchmark execution, a lightweight background probe script (`scripts/safety_watchdog.sh`) runs every 2 seconds:

```bash
#!/usr/bin/env bash
# Stage 3 Safety Watchdog & Circuit Breaker Daemon

while true; do
    # 1. Check Available RAM
    AVAIL_MEM_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    if [ "$AVAIL_MEM_KB" -lt 15728640 ]; then # 15 GiB in KB
        echo "[SAFETY_ABORT] Available RAM fell below 15 GiB ($((AVAIL_MEM_KB/1024)) MB). Terminating tests!" >&2
        pkill -f "k6" || true
        pkill -f "sseConcurrencyClient" || true
        exit 1
    fi

    # 2. Check Neighbor Containers Health
    UNHEALTHY=$(docker ps --format '{{.Names}} {{.Status}}' | grep -vE 'ess-|emperor-nexus' | grep -E 'Restarting|unhealthy|dead')
    if [ -n "$UNHEALTHY" ]; then
        echo "[SAFETY_ABORT] Neighbor container instability detected: $UNHEALTHY" >&2
        pkill -f "k6" || true
        exit 1
    fi

    # 3. Check Target PostgreSQL Connections
    ACTIVE_CONNS=$(docker exec ess-postgres-staging psql -U postgres -d ess_chatbot_staging -t -A -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo 0)
    if [ "$ACTIVE_CONNS" -ge 40 ]; then
        echo "[SAFETY_ABORT] PostgreSQL active connections reached $ACTIVE_CONNS (threshold 40). Halting!" >&2
        pkill -f "k6" || true
        exit 1
    fi

    sleep 2
done
```
