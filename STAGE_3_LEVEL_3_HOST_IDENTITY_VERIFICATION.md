# EMPEROR NEXUS — STAGE 3 LEVEL 3 HOST IDENTITY FORENSIC REPORT

**Document ID:** `STAGE-3-L3-HOST-001`  
**Audit Baseline Commit:** `6907648`  
**Audit Purpose:** Resolve conflicting hardware descriptions, memory variances, and host execution environments  

---

## 1. DUAL-HOST INVENTORY & SPECIFICATION COMPARISON

The audit forensically examined the two distinct physical/virtual machines involved in Stage 3:
1. **The Production / Discovery Host (VPS):** Contabo Cloud VPS XL (`vmi3189237` / `95.111.242.173`).
2. **The Test Execution Workstation (Local):** Windows 11 Developer Machine (`LAPTOP-U24G7707`).

| Parameter | Host A: Production / Remote VPS (`vmi3189237`) | Host B: Test Execution Host (`LAPTOP-U24G7707`) | Source of Truth / Evidence |
|---|---|---|---|
| **Hostname** | `vmi3189237` | `LAPTOP-U24G7707` | Terminal prompt vs `os.hostname()` |
| **Operating System** | Ubuntu 24.04.5 LTS (Linux 6.8.0-147-generic) | Windows 11 Pro (NT 10.0.26200.0) | `hostnamectl` vs `os.platform()` |
| **Machine Architecture**| `x86_64` | `x64` | Linux `lscpu` vs Node `os.arch()` |
| **CPU Model** | **AMD EPYC Processor (with IBPB)** | **Intel(R) Core(TM) Ultra 9 285H** | `lscpu` vs `os.cpus()[0].model` |
| **Logical CPU Cores** | 16 vCPUs (@ 2.0 GHz) | 16 logical processors (P/E cores) | `nproc` vs `os.cpus().length` |
| **Total Physical RAM** | **62.79 GiB (64 GB)** | **31.37 GiB (32 GB)** | Linux `free -m` vs `os.totalmem()` |
| **Available RAM** | **58.31 GiB (at discovery baseline)** | **7.15 GiB (at test baseline)** | `/proc/meminfo` vs `os.freemem()` |
| **Configured Swap** | **0 B (No swapfile)** | Windows Paging File Managed | Linux `swapon --show` vs Windows |
| **Host Uptime** | ~14 days | ~403.2 hours (16.8 days) | Linux `uptime` vs `os.uptime()` |
| **Docker Daemon** | Active (28 containers running) | Inactive locally (Docker desktop off) | `docker stats` vs Windows pipe error |

---

## 2. RESOLUTION OF THE HARDWARE DISCREPANCY

### Finding:
In `STAGE_3_INFRASTRUCTURE_BASELINE.md`, the platform hardware was accurately documented as an **AMD EPYC 16-core CPU with 62.79 GiB of RAM**. 

However, in `STAGE_3_LEVEL_3_EXECUTION_REPORT.md` and `stage3_level3_telemetry.json`, the telemetry recorded an **Intel Core Ultra 9 285H processor with 31.37 GiB of RAM and 7.15 GiB of available RAM**.

### Cause:
The script `tests/load/level3ControlledStressRunner.js` was invoked directly in the local PowerShell terminal (`node tests/load/level3ControlledStressRunner.js`) on the Windows workstation. Because the runner dynamically sampled `os.cpus()` and `os.freemem()`, it recorded the hardware of `LAPTOP-U24G7707`.

The actual Contabo production VPS was **completely untouched** by this test execution. Zero packets were transmitted to port 3300 or port 3301 on `95.111.242.173`.

---

## 3. WATCHDOG MEMORY FLOOR EVALUATION

The Stage 3 Safety Watchdog specification mandates:
> **Abort Criterion B:** Abort test execution immediately if Host `MemAvailable` falls below **15 GiB**.

### Evaluation Against Local Test Host:
- Measured Available Memory at test start: **7.15 GiB**.
- Threshold: **15.00 GiB**.
- **Violation:** $7.15\text{ GiB} < 15.00\text{ GiB}$ (Deficit: **7.85 GiB**).

### Determination:
Had the safety watchdog daemon been running on the test host during execution, **it would have triggered an immediate abort at Stage 1 startup (Tick 0)** and terminated the runner before sending any requests. The test was able to execute to completion only because the watchdog daemon was not active.
