#!/usr/bin/env bash
# ==============================================================================
# EMPEROR NEXUS — STAGE 3 SRE SAFETY WATCHDOG & MULTI-METRIC CIRCUIT BREAKER
# ==============================================================================
# Monitors host and container health every 2 seconds during load tests.
# Enforces non-negotiable abort gates to protect the host and 24 co-tenants:
# A. Host CPU > 85% sustained for >10 seconds
# B. Host MemAvailable < 15 GiB
# C. Neighbor Containers: 24 specific containers checked via 'docker ps -a'
# D. Target PostgreSQL active connections >= 40
# E. Target Redis memory >= 80% of maxmemory
# F. Root filesystem free disk < 50 GB
# G. Application unexpected 5xx error rate > 5% sustained
# H. Precision test process termination (k6, sseConcurrencyClient, node test runners)
# ==============================================================================

set -u

AUDIT_LOG="${WATCHDOG_LOG_FILE:-./stage3_watchdog_audit.log}"
ERROR_LOG="${TEST_ERROR_LOG:-/tmp/stage3_test_errors.log}"
HEARTBEAT_FILE="${WATCHDOG_HEARTBEAT_FILE:-/tmp/watchdog_heartbeat.json}"
RUNNER_PID_FILE="${TEST_RUNNER_PID_FILE:-/tmp/stage3_test_runner.pid}"
TARGET_PG_CONTAINER="${TARGET_PG_CONTAINER:-ess-postgres-staging}"
TARGET_PG_DB="${TARGET_PG_DB:-ess_chatbot_staging}"
TARGET_REDIS_CONTAINER="${TARGET_REDIS_CONTAINER:-ess-redis-staging}"

# Baseline inventory of all 24 neighboring containers from Phase A discovery
NEIGHBOR_INVENTORY=(
  "admafia-frontend"
  "admafia-backend"
  "admafia-mongo"
  "admafia-redis"
  "admafia-mongo-express"
  "knotelle-app"
  "knotelle-db"
  "nutsandnutrition-app"
  "nutsandnutrition-db"
  "convoza-nginx"
  "convoza-admin"
  "convoza-website"
  "convoza-campaign-worker"
  "convoza-webhook-worker"
  "convoza-message-worker"
  "convoza-api"
  "convoza-postgres"
  "convoza-dashboard"
  "talknex-web"
  "talknex-api"
  "aviatorguide-app-1"
  "aviatorguide-db-1"
  "rockyblog-app-1"
  "rockyblog-db-1"
)

# Write atomic JSON heartbeat for load generator verification barrier
write_heartbeat() {
  local status="$1"
  local reason="${2:-}"
  local now_ts
  now_ts=$(date +%s 2>/dev/null || echo "0")
  now_ts=$((now_ts * 1000))
  local now_iso
  now_iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local hostname_val
  hostname_val=$(hostname 2>/dev/null || echo "unknown")

  cat <<EOF > "${HEARTBEAT_FILE}.tmp"
{
  "timestamp": ${now_ts},
  "iso": "${now_iso}",
  "hostname": "${hostname_val}",
  "pid": $$,
  "status": "${status}",
  "reason": "${reason}",
  "high_cpu_streak": ${HIGH_CPU_STREAK},
  "high_error_streak": ${HIGH_ERROR_STREAK}
}
EOF
  mv -f "${HEARTBEAT_FILE}.tmp" "${HEARTBEAT_FILE}" 2>/dev/null || true
}

# State trackers
HIGH_CPU_STREAK=0
HIGH_ERROR_STREAK=0

# Log auditable message
log_event() {
  local level="$1"
  local trigger="$2"
  local message="$3"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [$level] [$trigger] $message" | tee -a "$AUDIT_LOG"
}

# Precision test runner process termination
# STRICT SRE RULE: Zero broad 'pkill -f' commands. Only targets exact PID / PGID from RUNNER_PID_FILE.
terminate_test_runners() {
  log_event "ALERT" "PROCESS_TERMINATION" "Executing precision shutdown of active benchmark runner..."
  local target_pid=""

  if [ -f "$RUNNER_PID_FILE" ]; then
    target_pid=$(cat "$RUNNER_PID_FILE" 2>/dev/null || echo "")
  elif [ -n "${TEST_RUNNER_PID:-}" ]; then
    target_pid="$TEST_RUNNER_PID"
  fi

  if [ -n "$target_pid" ] && kill -0 "$target_pid" 2>/dev/null; then
    log_event "INFO" "PROCESS_TERMINATION" "Terminating target test runner process group / PID: $target_pid"
    # Attempt graceful shutdown of process group first, fallback to individual PID
    kill -TERM -"$target_pid" 2>/dev/null || kill -TERM "$target_pid" 2>/dev/null || true
    sleep 1
    # Force kill if still active
    if kill -0 "$target_pid" 2>/dev/null; then
      kill -KILL -"$target_pid" 2>/dev/null || kill -KILL "$target_pid" 2>/dev/null || true
    fi
    rm -f "$RUNNER_PID_FILE" 2>/dev/null || true
    log_event "INFO" "PROCESS_TERMINATION" "Target runner process $target_pid terminated successfully."
  else
    log_event "WARN" "PROCESS_TERMINATION" "No active test runner process found for PID: '${target_pid}'."
  fi
}

# Circuit Breaker Trigger Function
trigger_abort() {
  local trigger_code="$1"
  local details="$2"
  log_event "FATAL" "$trigger_code" "CIRCUIT BREAKER TRIPPED: $details. Aborting load test immediately!"
  write_heartbeat "ABORTED" "$trigger_code: $details"
  terminate_test_runners
  echo "CIRCUIT_BREAKER_ABORT: $trigger_code - $details" > /tmp/stage3_abort_signal
  exit 1
}

# ------------------------------------------------------------------------------
# 1. CPU Utilization Check (2-sample delta calculation)
# ------------------------------------------------------------------------------
check_cpu_utilization() {
  # Read /proc/stat
  if [ -f "/proc/stat" ]; then
    read -r cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat
    local prev_idle=$((idle + iowait))
    local prev_total=$((user + nice + system + idle + iowait + irq + softirq + steal))

    sleep 1

    read -r cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat
    local idle_now=$((idle + iowait))
    local total_now=$((user + nice + system + idle + iowait + irq + softirq + steal))

    local total_diff=$((total_now - prev_total))
    local idle_diff=$((idle_now - prev_idle))

    if [ "$total_diff" -gt 0 ]; then
      local cpu_utilization=$((100 * (total_diff - idle_diff) / total_diff))
      if [ "$cpu_utilization" -gt 85 ]; then
        HIGH_CPU_STREAK=$((HIGH_CPU_STREAK + 1))
        log_event "WARN" "CPU_PRESSURE" "Host CPU at ${cpu_utilization}% (Streak: ${HIGH_CPU_STREAK}/5 ticks)"
        if [ "$HIGH_CPU_STREAK" -ge 5 ]; then # 5 checks * ~2s = >10 seconds sustained
          trigger_abort "CPU_SATURATION" "Host CPU sustained at ${cpu_utilization}% for >10 seconds"
        fi
      else
        HIGH_CPU_STREAK=0
      fi
    fi
  fi
}

# ------------------------------------------------------------------------------
# 2. Host Memory (MemAvailable) Check
# ------------------------------------------------------------------------------
check_memory() {
  if [ -f "/proc/meminfo" ]; then
    local avail_kb
    avail_kb=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    local limit_kb=15728640 # 15 GiB in KB
    if [ "$avail_kb" -lt "$limit_kb" ]; then
      local avail_gib=$((avail_kb / 1024 / 1024))
      trigger_abort "MEMORY_EXHAUSTION" "Available host memory fell to ${avail_gib} GiB (<15 GiB threshold)"
    fi
  fi
}

# ------------------------------------------------------------------------------
# 3. Neighboring Container Health Check (24 specific containers via docker ps -a)
# ------------------------------------------------------------------------------
check_neighbor_containers() {
  if command -v docker >/dev/null 2>&1; then
    local ps_output
    ps_output=$(docker ps -a --format '{{.Names}}|{{.Status}}' 2>/dev/null || echo "")

    for expected_name in "${NEIGHBOR_INVENTORY[@]}"; do
      # Protect co-tenants, but skip containers with confirmed pre-existing outage at baseline (e.g. talknex-api)
      if echo " ${NEIGHBOR_EXCLUDE:-talknex-api} " | grep -qw "$expected_name"; then
        continue
      fi

      local line
      line=$(echo "$ps_output" | grep -E "^${expected_name}\|" || true)

      if [ -z "$line" ]; then
        trigger_abort "NEIGHBOR_MISSING" "Neighbor container '${expected_name}' is missing from docker ps -a"
      fi

      local status
      status=$(echo "$line" | cut -d '|' -f 2)

      if echo "$status" | grep -iqE "restarting|dead|unhealthy"; then
        trigger_abort "NEIGHBOR_UNHEALTHY" "Neighbor container '${expected_name}' entered unhealthy/restarting state: ${status}"
      fi

      if echo "$status" | grep -iqE "exited \([1-9]"; then
        trigger_abort "NEIGHBOR_CRASHED" "Neighbor container '${expected_name}' crashed with non-zero exit: ${status}"
      fi
    done
  fi
}

# ------------------------------------------------------------------------------
# 4. Target Staging PostgreSQL Connections Check
# ------------------------------------------------------------------------------
check_postgres_connections() {
  if command -v docker >/dev/null 2>&1; then
    local active_conns
    active_conns=$(docker exec "$TARGET_PG_CONTAINER" psql -U postgres -d "$TARGET_PG_DB" -t -A -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "0")
    if [[ "$active_conns" =~ ^[0-9]+$ ]] && [ "$active_conns" -ge 40 ]; then
      trigger_abort "POSTGRES_POOL_SATURATION" "Target PostgreSQL active connections reached ${active_conns} (threshold: 40)"
    fi
  fi
}

# ------------------------------------------------------------------------------
# 5. Target Staging Redis Memory Check
# ------------------------------------------------------------------------------
check_redis_memory() {
  if command -v docker >/dev/null 2>&1; then
    local mem_info
    mem_info=$(docker exec "$TARGET_REDIS_CONTAINER" redis-cli INFO memory 2>/dev/null || true)
    if [ -n "$mem_info" ]; then
      local used
      local max
      used=$(echo "$mem_info" | grep -E "^used_memory:" | cut -d ':' -f 2 | tr -d '\r')
      max=$(echo "$mem_info" | grep -E "^maxmemory:" | cut -d ':' -f 2 | tr -d '\r')

      if [ -n "$used" ] && [ -n "$max" ] && [ "$max" -gt 0 ]; then
        local pct=$((100 * used / max))
        if [ "$pct" -ge 80 ]; then
          trigger_abort "REDIS_MEMORY_SATURATION" "Target Redis memory at ${pct}% of maxmemory (threshold: 80%)"
        fi
      fi
    fi
  fi
}

# ------------------------------------------------------------------------------
# 6. Disk Space Check
# ------------------------------------------------------------------------------
check_disk_space() {
  local avail_kb
  avail_kb=$(df -k / | awk 'NR==2 {print $4}')
  local min_kb=52428800 # 50 GB in KB
  if [ "$avail_kb" -lt "$min_kb" ]; then
    local avail_gb=$((avail_kb / 1024 / 1024))
    trigger_abort "DISK_HEADROOM_DEPLETED" "Root filesystem free space fell to ${avail_gb} GB (<50 GB threshold)"
  fi
}

# ------------------------------------------------------------------------------
# 7. Sustained Application 5xx Error Rate Check
# ------------------------------------------------------------------------------
check_application_errors() {
  if [ -f "$ERROR_LOG" ]; then
    local total
    local errors
    total=$(tail -n 100 "$ERROR_LOG" | wc -l)
    errors=$(tail -n 100 "$ERROR_LOG" | grep -c "HTTP_5" || true)

    if [ "$total" -gt 20 ]; then
      local err_pct=$((100 * errors / total))
      if [ "$err_pct" -gt 5 ]; then
        HIGH_ERROR_STREAK=$((HIGH_ERROR_STREAK + 1))
        log_event "WARN" "ERROR_RATE_ELEVATED" "Sampled 5xx error rate at ${err_pct}% (Streak: ${HIGH_ERROR_STREAK}/3)"
        if [ "$HIGH_ERROR_STREAK" -ge 3 ]; then # >6 seconds sustained
          trigger_abort "HIGH_ERROR_RATE" "Sustained application 5xx error rate at ${err_pct}% (>5% threshold)"
        fi
      else
        HIGH_ERROR_STREAK=0
      fi
    fi
  fi
}

# ------------------------------------------------------------------------------
# MAIN SUPERVISOR LOOP
# ------------------------------------------------------------------------------
log_event "INFO" "WATCHDOG_STARTUP" "Stage 3 Safety Watchdog initialized. Monitoring 24 neighbors and 7 circuit breakers."
write_heartbeat "HEALTHY" "Watchdog initialized"

while true; do
  check_cpu_utilization
  check_memory
  check_neighbor_containers
  check_postgres_connections
  check_redis_memory
  check_disk_space
  check_application_errors
  write_heartbeat "HEALTHY" "All systems within safety bounds"
  sleep 1
done
