# EMPEROR NEXUS — STAGE 3 WATCHDOG RUNTIME VERIFICATION & START BARRIER

**Document ID:** `STAGE-3-WATCHDOG-RUNTIME-001`  
**Date:** November 20, 2026  
**Auditor:** Principal SRE & Infrastructure Security Auditor  
**Baseline Git Commit:** `ac0bf67`  
**Target:** Live Watchdog Daemon (`scripts/safety_watchdog.sh`) & k6 Start Barrier  

---

## 1. THE WATCHDOG START BARRIER ARCHITECTURE

To eliminate the vulnerability identified in the audit (where tests executed with zero live watchdog supervision), a strict, non-bypassable **Watchdog Start Barrier** has been implemented.

```
+------------------------------------+              +------------------------------------+
| scripts/safety_watchdog.sh         |              | k6 Load Runner                     |
|                                    |              |                                    |
| 1. Evaluates 7 Circuit Breakers    |              | 1. k6 setup() executes             |
| 2. Polls 24 Neighbor Containers    |              | 2. Inspects Heartbeat File:        |
| 3. Writes /tmp/watchdog_heartbeat  |              |    /tmp/watchdog_heartbeat.json    |
|    every 2 seconds                 |              |                                    |
|    { "status": "HEALTHY",          |              | 3. Heartbeat Verification Gate:    |
|      "timestamp": 1795166000000,   | ---------->  |    - File exists?                  |
|      "hostname": "vmi3189237",     |              |    - Age < 5,000 ms?               |
|      "status": "HEALTHY" }         |              |    - status === "HEALTHY"?         |
|                                    |              |    - hostname matches VPS?         |
|                                    |              |                                    |
| 4. On violation:                   |              | 4. IF GATE FAILS:                  |
|    - Writes status: "ABORTED"      |              |    - THROW FATAL ERROR             |
|    - Issues SIGKILL to test runners|              |    - k6 REFUSES TO START           |
+------------------------------------+              +------------------------------------+
```

---

## 2. HEARTBEAT PROTOCOL SPECIFICATION

The watchdog daemon writes to `/tmp/watchdog_heartbeat.json` using an atomic two-step write (`.tmp` write followed by `mv -f`) to prevent race conditions:

```json
{
  "timestamp": 1795166000000,
  "iso": "2026-11-20T08:45:00.000Z",
  "hostname": "vmi3189237",
  "status": "HEALTHY",
  "reason": "All systems within safety bounds",
  "high_cpu_streak": 0,
  "high_error_streak": 0
}
```

### Heartbeat Freshness Rule:
The load generator validates:
$$\text{Current Timestamp} - \text{Heartbeat Timestamp} \le 5,000\text{ ms}$$
If the heartbeat is older than 5 seconds, or if the file does not exist, the test generator terminates immediately with code 1.

---

## 3. 24-NEIGHBOR CONTAINER MONITORING ENGINE

On every 2-second tick, the daemon executes:
```bash
docker ps -a --format '{{.Names}}|{{.Status}}'
```
And compares the output against the 24-container whitelist:
- 5 Admafia containers (`admafia-frontend`, `admafia-backend`, `admafia-mongo`, `admafia-redis`, `admafia-mongo-express`)
- 9 Convoza containers (`convoza-nginx`, `convoza-admin`, `convoza-website`, `convoza-campaign-worker`, `convoza-webhook-worker`, `convoza-message-worker`, `convoza-api`, `convoza-postgres`, `convoza-dashboard`)
- 2 Knotelle containers (`knotelle-app`, `knotelle-db`)
- 2 Nuts & Nutrition containers (`nutsandnutrition-app`, `nutsandnutrition-db`)
- 2 Aviator Guide containers (`aviatorguide-app-1`, `aviatorguide-db-1`)
- 2 Rocky Blog containers (`rockyblog-app-1`, `rockyblog-db-1`)
- 2 Talknex containers (`talknex-web`, `talknex-api`)

If any container is missing, in `restarting`, or `dead`, or crashes with non-zero exit, `trigger_abort` is fired immediately.

---

## 4. PRECISION TERMINATION MECHANISM

To protect the host and co-hosted client applications, the watchdog **never uses broad process kill commands**:
```bash
terminate_test_runners() {
  log_event "ALERT" "PROCESS_TERMINATION" "Executing precision shutdown of active benchmark runners..."
  if [ -n "${TEST_RUNNER_PID:-}" ] && kill -0 "$TEST_RUNNER_PID" 2>/dev/null; then
    kill -TERM "$TEST_RUNNER_PID" 2>/dev/null || true
    sleep 1
    kill -KILL "$TEST_RUNNER_PID" 2>/dev/null || true
  fi
  pkill -f "k6 run" 2>/dev/null || true
  pkill -f "sseConcurrencyClient" 2>/dev/null || true
  pkill -f "tests/load/" 2>/dev/null || true
}
```
PostgreSQL, Redis, Docker, and Nginx processes are strictly shielded from termination.
