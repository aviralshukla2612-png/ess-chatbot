# EMPEROR NEXUS — STAGE 3 LEVEL 3 FAILURES, BOTTLENECK ANALYSIS & RECOMMENDATIONS

**Document ID:** `STAGE-3-L3-RECS-001`  
**Test Suite:** Phase C Level 3 Controlled Stress Test  
**Baseline Git Commit:** `e681984`  
**Target Load:** 100 Virtual Users (VUs)  

---

## 1. DETAILED ANALYSIS OF THE 100-VU CAPACITY FAILURE MODE

### 1.1 The Empirical Bottleneck Observed
During Stage 5 (100 simultaneous VUs), Emperor Nexus sustained an overall HTTP success rate of **96.30%**, but encountered **20 failed chat turn requests** (3.70% error rate).

### 1.2 Root Cause Analysis
Inspection of `frontend/lib/ai/inferenceProvider.js` reveals the exact bottleneck mechanism:

```javascript
class ConcurrencyLimiter {
  constructor(maxConcurrent = 15, maxQueue = 50) { ... }
}
const globalLimiter = new ConcurrencyLimiter(20, 60);
```

- **Active Worker Pool:** Fixed at **20 concurrent executions**.
- **In-Memory FIFO Queue:** Fixed at **60 waiting slots**.
- **Combined System Capacity:** $20 + 60 = \mathbf{80\text{ concurrent inference turns}}$.
- **Failure Trigger:** When 100 VUs submitted chat inquiries simultaneously with zero think time:
  1. Requests 1 through 20 acquired active execution slots immediately.
  2. Requests 21 through 80 were accepted into the wait queue.
  3. Requests 81 through 100 hit line 20 of `inferenceProvider.js`:
     ```javascript
     if (this.queue.length >= this.maxQueue) {
       throw new Error("Provider overloaded: concurrency limit and queue capacity reached.");
     }
     ```
  4. These 20 requests were rejected with `HTTP 503 Provider Overloaded`.

### 1.3 Architectural Evaluation
This is **intentional, safe load shedding**. Rather than allowing unbounded Node.js heap allocations, event loop starvation, or external API rate limit exhaustion, the application sheds excess load gracefully. However, from an SRE capacity perspective, **80 concurrent turns is the hard ceiling of the current configuration**.

---

## 2. COMPREHENSIVE BOTTLENECK MATRIX ACROSS THE STACK

| Component | Measured Capacity Ceiling | Bottleneck Mechanism | Severity | Recommended Fix |
|---|:---:|---|:---:|---|
| **AI Inference Provider** | **80 concurrent turns** | In-app `ConcurrencyLimiter(20, 60)` | **HIGH (Capacity ceiling)** | Scale limiter dynamically based on provider tier (e.g., `ConcurrencyLimiter(50, 150)` for Groq cloud LPUs). |
| **Nginx Reverse Proxy** | **40 conn / IP & 45 chat req/min** | `limit_conn 40` & `limit_req 45r/m` | **MEDIUM (Single-IP limiter)** | Maintain Cloudflare CF-Connecting-IP pass-through so real users are not bucketed into one IP. |
| **PostgreSQL 16 Database** | **60 server / 15 pool conns** | `max_connections=60`, `DB_POOL_MAX=15` | **LOW (Safe at 100 VUs)** | Deploy PgBouncer when scaling beyond 200 concurrent tenants. |
| **Redis 7 Stream & Cache** | **64 MB memory limit** | `save ""` & `appendonly no` on prod | **CRITICAL (Data loss risk)** | Enable AOF persistence (`appendonly yes`) and `noeviction` policy on production Redis. |
| **Linux Host Operating System** | **Swap: 0B** | Zero swap memory configured on VPS | **HIGH (Kernel OOM risk)** | Provision 4 GB or 8 GB swapfile as planned in `STAGE_3_SWAP_CONFIGURATION_PLAN.md`. |

---

## 3. CONCRETE SRE & ARCHITECTURAL RECOMMENDATIONS

### Recommendation 1: Provider-Aware Concurrency Tuning
Update `frontend/lib/ai/inferenceProvider.js` to scale concurrency limits based on the active provider:
- **Local Ollama on CPU:** Keep `ConcurrencyLimiter(2, 10)` to prevent 100% CPU starvation.
- **Local Ollama on GPU:** Set `ConcurrencyLimiter(10, 30)`.
- **Cloud Groq LPU / OpenAI:** Set `ConcurrencyLimiter(60, 200)` to fully utilize high cloud API concurrency limits without 503 drops.

### Recommendation 2: Production Redis Durability Parity
Production Redis must immediately adopt the durability configuration proven in Stage 3 staging:
```yaml
command: >
  redis-server
  --appendonly yes
  --appendfsync everysec
  --maxmemory 128mb
  --maxmemory-policy noeviction
```
This protects the OTP Redis Stream `stream:otp_dispatch` against container restarts and eviction loss.

### Recommendation 3: Configure Host Swap Space
Execute the approved swap configuration plan:
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
```
This eliminates the critical risk of sudden kernel OOM kills.

### Recommendation 4: Upstream Nginx Keepalive Alignment
Increase Nginx backend keepalive from 32 to 64:
```nginx
upstream emperor_nexus_backend {
    server 127.0.0.1:3300;
    keepalive 64;
}
```
This reduces TCP handshake latency during sudden traffic bursts.
