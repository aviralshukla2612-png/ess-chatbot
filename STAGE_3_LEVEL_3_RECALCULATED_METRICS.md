# EMPEROR NEXUS — STAGE 3 LEVEL 3 INDEPENDENT METRICS RECALCULATION

**Document ID:** `STAGE-3-L3-RECALC-001`  
**Audit Baseline Commit:** `6907648`  
**Audit Standard:** Raw Timestamp & Event Log Forensic Re-computation  

---

## 1. DURATION COMPARISON & TIMELINE FORENSICS

| Measurement Dimension | Configured Specification | Actual Monotonic Measurement | Deviation | Audit Classification |
|---|:---:|:---:|:---:|:---:|
| **Initial Baseline Duration** | 60.00 s | **0.126 s (126.5 ms)** | -99.79% | **FAILED** |
| **Ramp 1 Duration** | 60.00 s | **0.290 s (289.7 ms)** | -99.52% | **FAILED** |
| **Ramp 2 Duration** | 90.00 s | **0.646 s (646.3 ms)** | -99.28% | **FAILED** |
| **Ramp 3 Duration** | 90.00 s | **1.079 s (1,079.4 ms)**| -98.80% | **FAILED** |
| **Maximum Stress Duration** | 120.00 s | **1.488 s (1,488.0 ms)**| -98.76% | **FAILED** |
| **Total Test Execution Duration**| **420.00 s (7.0 min)** | **3.659 s (0.06 min)** | **-416.34 s (-99.13%)** | **FAILED** |

### Forensic Timeline Evidence:
- **Process Start Monotonic:** `2026-11-20T08:05:13.526Z`
- **Process Exit Monotonic:** `2026-11-20T08:05:17.185Z`
- **Elapsed Real Time:** $17.185 - 13.526 = \mathbf{3.659\text{ seconds}}$
- **Explanation:** The test script fired a single batch of parallel asynchronous promises for each stage rather than sustaining an active VU workload over the configured time duration.

---

## 2. INDEPENDENT THROUGHPUT RECALCULATION

Throughput is independently recalculated under two distinct operational definitions:
1. **Instantaneous Burst Throughput (In-Memory Processing Speed):** Calculated strictly over the sub-second burst execution window.
2. **Sustained Protocol Throughput:** Calculated amortized across the user-specified 420-second test window.

| Stage # | Stage Name | Successful Operations | Total Operations Attempted | Measured Burst Duration | **Recalculated Burst Throughput** | **Recalculated Sustained Throughput (420s)** |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| **1** | Initial Baseline (10 VUs) | 60 | 60 | 0.1265 s | **474.31 ops/s** | 1.00 ops/s (over 60s) |
| **2** | Ramp 1 (25 VUs) | 150 | 150 | 0.2897 s | **517.78 ops/s** | 2.50 ops/s (over 60s) |
| **3** | Ramp 2 (50 VUs) | 300 | 300 | 0.6463 s | **464.18 ops/s** | 3.33 ops/s (over 90s) |
| **4** | Ramp 3 (75 VUs) | 450 | 450 | 1.0794 s | **416.89 ops/s** | 5.00 ops/s (over 90s) |
| **5** | Maximum Stress (100 VUs) | 540 | 560 | 1.4880 s | **362.90 ops/s** | 4.50 ops/s (over 120s) |
| **TOTAL**| **All 5 Stages** | **1,500** | **1,520** | **3.659 s** | **409.95 ops/s** | **3.57 ops/s** |

---

## 3. ERROR RATE RECALCULATION & CONCURRENCY SHEDDING RECONCILIATION

In Stage 5, the previous execution report recorded 20 failed requests. Below is the audited error reconciliation:

- **Total Operation Invocations Attempted in Stage 5:**
  - 80 Successful VUs $\times$ 6 operations = 480 operations
  - 20 Overloaded VUs $\times$ 3 operations prior to failure = 60 operations
  - 20 Overloaded VUs $\times$ 1 chat turn failure = 20 failed operations
  - **Total Stage 5 Invocations:** $480 + 60 + 20 = \mathbf{560\text{ operations}}$
- **Stage 5 Error Rate:**
  $$\text{Stage 5 Error Rate} = \frac{20\text{ failures}}{560\text{ attempts}} = \mathbf{3.57\%}$$
  *(Previous report reported 3.70% by calculating $20 / 540$; correct mathematical denominator is 560 attempts).*
- **Overall Test Error Rate:**
  $$\text{Overall Error Rate} = \frac{20\text{ failures}}{1,520\text{ total attempts}} = \mathbf{1.32\%}$$

---

## 4. OPERATION-BY-OPERATION LATENCY RE-COMPUTATION

Based on raw latency arrays persisted in `stage3_level3_telemetry.json`:

| Operation | Total Invocations | p50 Latency (Median) | p95 Latency | p99 Latency | Max Measured Latency |
|---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/health` | 260 | 1.84 ms | 5.12 ms | 8.94 ms | 14.21 ms |
| `POST /api/.../session` | 260 | 3.65 ms | 11.89 ms | 17.43 ms | 24.50 ms |
| `POST /api/.../ticket` | 260 | 2.81 ms | 9.45 ms | 14.80 ms | 21.12 ms |
| `POST /api/.../chat` (Accepted) | 240 | 18.20 ms | 512.40 ms | 745.00 ms | 812.30 ms |
| `POST /api/.../chat` (Overloaded)| 20 | 0.42 ms | 0.85 ms | 1.10 ms | 1.45 ms |
| `POST /api/auth/otp/send` | 240 | 2.05 ms | 6.22 ms | 10.85 ms | 16.30 ms |
| `POST /api/leads` | 240 | 3.28 ms | 8.74 ms | 13.90 ms | 19.80 ms |

### Key Insight:
Notice the latency of the 20 overloaded chat requests: **p50 is 0.42 ms**!
This proves that the `ConcurrencyLimiter` rejected requests immediately upon queue saturation without performing any blocking CPU work or waiting for timeouts. It acted as an instant, zero-latency circuit breaker.
