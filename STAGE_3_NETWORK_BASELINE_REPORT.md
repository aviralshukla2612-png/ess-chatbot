# EMPEROR NEXUS — STAGE 3 NETWORK BASELINE & VPS PREFLIGHT REPORT

**Document ID:** `STAGE-3-NET-BASELINE-001`  
**Date:** November 20, 2026  
**Auditor / Principal SRE:** Autonomous Principal SRE & DevOps Architect  
**Baseline Git Commit:** `ac0bf67`  
**Target Host:** Contabo Cloud VPS XL (`95.111.242.173`)  

---

## 1. MANDATORY VPS PRE-FLIGHT VERIFICATION PROTOCOL

In strict accordance with SRE Rule 3:
> *"Before installing or running anything: Verify actual Contabo VPS hostname, Ubuntu version, CPU, RAM, Docker daemon, staging containers, staging volumes, loopback-only staging binding, all neighboring containers, and available RAM/disk. If the VPS cannot be accessed or verified, STOP. Never silently switch to the local development machine."*

### 1.1 VPS Host Baseline Specification

| Verification Check | Target Specification | Live VPS Command | Expected Pass Value |
|---|---|---|---|
| **1. Hostname** | Contabo Cloud VPS | `hostname` | `vmi3189237` |
| **2. Operating System** | Ubuntu 24.04 LTS | `lsb_release -d` | `Ubuntu 24.04.5 LTS` |
| **3. CPU Architecture** | 16 AMD EPYC Cores | `lscpu \| grep 'Model name'` | `AMD EPYC Processor (with IBPB)` |
| **4. Physical RAM** | 62.79 GiB total | `free -h` | `total: 62Gi`, `available: >50Gi` |
| **5. Storage Headroom** | 300 GB NVMe | `df -h /` | `Avail: >150G` (Abort if <50G) |
| **6. Docker Daemon** | Running 28 containers | `docker ps -q \| wc -l` | $\ge 24$ neighbor containers `Up` |
| **7. Staging Binding** | Loopback only | `netstat -tlpn \| grep 3301` | `127.0.0.1:3301` (Zero 0.0.0.0) |
| **8. Staging Volumes** | Isolated named volumes | `docker volume ls` | `pgvector_staging_data`, `redis_staging_data` |

---

## 2. TURNKEY HOST DIAGNOSTIC & VERIFICATION COMMAND

To execute all 8 pre-flight verification checks in a single atomic inspection on the VPS terminal (`vscode-terminal:///vscode-terminal/ssh/22900`):

```bash
echo "=== 1. HOST IDENTITY & HARDWARE ===" && \
hostname && \
uname -srm && \
cat /etc/os-release | grep PRETTY_NAME && \
lscpu | grep -E "Model name|CPU\(s\):" && \
echo -e "\n=== 2. MEMORY & DISK CAPACITY ===" && \
free -h && \
df -h / && \
echo -e "\n=== 3. 24 NEIGHBOR CONTAINER INVENTORY ===" && \
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "admafia|convoza|knotelle|nutsandnutrition|aviatorguide|rockyblog|talknex" && \
echo -e "\n=== 4. STAGING NETWORK BINDING & ISOLATION ===" && \
docker compose -f docker-compose.staging.yml ps 2>/dev/null || echo "Staging not currently running"
```

---

## 3. TURNKEY LEVEL 1 EXECUTION SEQUENCE ON VPS

Once the preflight verification passes, the Level 1 test sequence is executed in two steps:

### Step 1: Start the Live Safety Watchdog Daemon
```bash
cd /home/ubuntu/emperor-nexus
git fetch origin main && git checkout main && git pull origin main
chmod +x scripts/safety_watchdog.sh
nohup ./scripts/safety_watchdog.sh > stage3_watchdog.log 2>&1 &
echo "Watchdog PID: $!"
sleep 3
cat /tmp/watchdog_heartbeat.json
```

### Step 2: Launch k6 Level 1 Load Test (10 VUs for 120s)
```bash
# Verify watchdog heartbeat is active (<5s old)
cat /tmp/watchdog_heartbeat.json

# Execute Level 1 network load test
k6 run --env TARGET_HOST=http://127.0.0.1:3301 \
       --env SCENARIO=level1_baseline \
       --out json=stage3_level1_raw_k6.json \
       tests/load/k6_scenarios.js
```

---

## 4. PRE-LEVEL 1 SAFETY GATE STATUS

- **Corrected Architecture Specification:** **COMPLETE** ([`STAGE_3_CORRECTED_TEST_ARCHITECTURE.md`](file:///d:/chatbot/STAGE_3_CORRECTED_TEST_ARCHITECTURE.md))
- **Watchdog Start Barrier & Heartbeat Engine:** **IMPLEMENTED** ([`STAGE_3_WATCHDOG_RUNTIME_VERIFICATION.md`](file:///d:/chatbot/STAGE_3_WATCHDOG_RUNTIME_VERIFICATION.md))
- **k6 Scenario Suite Hardened:** **IMPLEMENTED** ([`tests/load/k6_scenarios.js`](file:///d:/chatbot/tests/load/k6_scenarios.js))
- **Execution Gate:** **Awaiting live VPS verification run in terminal.**
