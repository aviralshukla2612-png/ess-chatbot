# EMPEROR NEXUS — STAGE 3 HOST SWAP IMPLEMENTATION & ROLLBACK PLAN

**Document ID:** `STAGE-3-SWAP-PLAN-001`  
**Date:** November 20, 2026  
**Auditor / Linux Systems Engineer:** Antigravity Autonomous Performance & SRE Engineer  
**Baseline Git Commit:** `639b621`  
**Target Host:** Contabo Cloud VPS XL (`95.111.242.173`)  
**Status:** SPECIFICATION DOCUMENTED ONLY (No host configuration modified)

---

## 1. HOST INSPECTION & MOTIVATION

### 1.1 Current Baseline State
Live diagnostic checks in Phase A revealed:
```text
=== MEMORY & SWAP ===
               total        used        free      shared  buff/cache   available
Mem:            62Gi       4.5Gi        51Gi       207Mi       7.7Gi        58Gi
Swap:             0B          0B          0B

=== DISK SPACE ===
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/sda1      ext4  290G  124G  166G  43% /
```

### 1.2 The Operational SRE Risk of Zero Swap
While the host currently possesses **58 GiB of available RAM**, running a high-concurrency production node hosting 28 Docker containers with **zero swap** poses a critical operational vulnerability:
1. **Aggressive OOM Invocations:** In Linux, if an unconstrained memory allocation spike occurs (e.g. during an unindexed database query or massive JSON parse in Node.js), the kernel cannot page out idle anonymous memory. It immediately triggers the Out-Of-Memory (OOM) killer, which abruptly terminates the process with the highest `oom_score` (frequently PostgreSQL or Next.js).
2. **Buffer/Cache Eviction:** Without swap, the Linux virtual memory manager is forced to aggressively evict filesystem page caches to reclaim memory, degrading disk I/O performance across all hosted stacks.
3. **Headroom Available:** The root NVMe drive `/dev/sda1` has **166 GB of free space**. Allocating an 8 GB swap file consumes only **4.8% of available disk** and creates a dependable safety buffer.

---

## 2. PROPOSED 8-GB SWAP IMPLEMENTATION PROCEDURE

The following sequence safely creates, secures, tunes, and persists an 8 GB swap area:

### Step 1: Pre-Allocation Check
```bash
# Verify no active swap exists
swapon --show
free -h
```

### Step 2: Allocate Contiguous 8 GB Swap File
```bash
# Efficiently allocate 8GB space
sudo fallocate -l 8G /swapfile

# Fallback if fallocate is unsupported on custom ext4 flags:
# sudo dd if=/dev/zero of=/swapfile bs=1M count=8192 status=progress
```

### Step 3: Enforce Strict Root-Only Permissions
```bash
# Crucial security step: prevent non-root users/containers from reading swapped memory
sudo chmod 600 /swapfile
```

### Step 4: Initialize Swap Signature & Activate
```bash
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Step 5: Configure Kernel Virtual Memory Tuning (`sysctl`)
To ensure Linux uses swap **only as an emergency relief valve** and never swaps active processes during normal workloads:
```bash
# Lower swappiness from default 60 to 10 (swap only under >90% memory pressure)
sudo sysctl vm.swappiness=10
sudo sysctl vm.vfs_cache_pressure=50

# Persist sysctl parameters across reboots
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.d/99-emperor-swap.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.d/99-emperor-swap.conf
```

### Step 6: Persist in `/etc/fstab`
```bash
# Backup fstab before editing
sudo cp /etc/fstab /etc/fstab.bak.$(date +%F)

# Append swap entry
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 7: Final Verification
```bash
free -h
swapon --show
```
*Expected Output:* `Swap: 8.0Gi total, 0B used, 8.0Gi free`.

---

## 3. COMPLETE ROLLBACK & RESTORATION PROCEDURE

If at any point swap must be completely removed, execute the following non-destructive rollback:

### Step 1: Deactivate Active Swap Space
```bash
sudo swapoff -v /swapfile
```

### Step 2: Remove Entry from `/etc/fstab`
```bash
# Remove the /swapfile line from /etc/fstab
sudo sed -i '\|/swapfile|d' /etc/fstab
```

### Step 3: Remove Sysctl Tuning File
```bash
sudo rm -f /etc/sysctl.d/99-emperor-swap.conf
sudo sysctl vm.swappiness=60
sudo sysctl vm.vfs_cache_pressure=100
```

### Step 4: Safely Delete the Swap File
```bash
sudo rm -f /swapfile
```

### Step 5: Verify Clean Return to Zero Swap
```bash
free -h
swapon --show
```
*Result:* Returns host to the exact baseline documented in Phase A (`Swap: 0B`).
