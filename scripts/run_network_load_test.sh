#!/usr/bin/env bash
# ==============================================================================
# EMPEROR NEXUS — STAGE 3 NETWORK LOAD TEST RUNNER WITH WATCHDOG START BARRIER
# ==============================================================================
# Enforces strict preflight checks before any k6 virtual users are launched:
# 1. Anti-workstation check: Refuses execution on Windows / non-VPS environments.
# 2. Watchdog liveness barrier: Verifies active watchdog process via PID check.
# 3. Heartbeat freshness barrier: Verifies /tmp/watchdog_heartbeat.json < 5s old.
# 4. Status barrier: Verifies watchdog status is strictly "HEALTHY".
# 5. PID registration: Registers runner PID in /tmp/stage3_test_runner.pid for
#    exact precision SIGKILL termination on any circuit-breaker trip.
# ==============================================================================

set -euo pipefail

HEARTBEAT_FILE="${WATCHDOG_HEARTBEAT_FILE:-/tmp/watchdog_heartbeat.json}"
RUNNER_PID_FILE="${TEST_RUNNER_PID_FILE:-/tmp/stage3_test_runner.pid}"
TARGET_HOST="${TARGET_HOST:-http://127.0.0.1:3301}"
SCENARIO="${1:-${SCENARIO:-level1_10vu}}"
if [ $# -ge 1 ]; then
  shift
fi

echo "================================================================================"
echo "EMPEROR NEXUS — PRE-FLIGHT LOAD RUNNER SAFETY BARRIER VERIFICATION"
echo "================================================================================"

# 1. Anti-Workstation Fallback Check
CURRENT_HOSTNAME=$(hostname 2>/dev/null || echo "unknown")
if [[ "$CURRENT_HOSTNAME" =~ LAPTOP|Windows|DESKTOP ]]; then
  echo "[FATAL SAFETY BARRIER] Load tests are strictly forbidden on local developer workstations ($CURRENT_HOSTNAME)." >&2
  echo "Must execute directly on the Contabo Cloud VPS (Ubuntu 24.04)." >&2
  exit 1
fi
echo "[PASS] Host check: Executing on target host '${CURRENT_HOSTNAME}' (Non-workstation verified)."

# 2. Ensure Staging Stack is Running on 127.0.0.1:3301 and Seed Data is Present
if command -v docker >/dev/null 2>&1; then
  mkdir -p frontend/data-staging 2>/dev/null || true
  if [ ! -f "frontend/data-staging/bots.json" ] || ! grep -q "bot_stage3_alpha_01" "frontend/data-staging/bots.json" 2>/dev/null; then
    echo "[DATA_SEED] Copying synthetic seed bots into frontend/data-staging/..."
    cp -rf frontend/data/* frontend/data-staging/ 2>/dev/null || true
    chmod -R 777 frontend/data-staging 2>/dev/null || true
    if [ -f "frontend/data-staging/platform_settings.json" ]; then
      sed -i 's/"aiProvider"[[:space:]]*:[[:space:]]*"ollama"/"aiProvider": "mock"/g' "frontend/data-staging/platform_settings.json" 2>/dev/null || true
    fi
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ess-frontend-staging"; then
      echo "[DATA_SEED] Restarting ess-frontend-staging to mount seed data..."
      docker restart ess-frontend-staging 2>/dev/null || true
      sleep 5
    fi
  fi

  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ess-frontend-staging"; then
    echo "[STARTUP] Staging stack (ess-frontend-staging) is not running on 127.0.0.1:3301."
    echo "[STARTUP] Launching isolated staging stack via docker compose -f docker-compose.staging.yml up -d ..."
    docker compose -f docker-compose.staging.yml up -d
    echo "[STARTUP] Waiting 12s for staging service health..."
    sleep 12
  else
    echo "[PASS] Staging stack (ess-frontend-staging) is active on 127.0.0.1:3301."
  fi

  # Auto-rebuild container if commit changed
  GIT_HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
  BUILD_STAMP_FILE="frontend/.build_stamp_staging"
  LAST_STAMP=$(cat "$BUILD_STAMP_FILE" 2>/dev/null || echo "")
  if [ "$GIT_HEAD" != "$LAST_STAMP" ] || [ "${REBUILD_STAGING:-0}" = "1" ]; then
    echo "[BUILD] Staging code has updated (Commit: ${GIT_HEAD}, Previous: ${LAST_STAMP}). Rebuilding staging frontend container with --no-cache..."
    export GIT_COMMIT="$GIT_HEAD"
    docker compose -f docker-compose.staging.yml build --no-cache frontend
    docker compose -f docker-compose.staging.yml up -d --force-recreate frontend
    echo "$GIT_HEAD" > "$BUILD_STAMP_FILE" 2>/dev/null || true
    echo "[BUILD] Waiting 15s for rebuilt staging container to become healthy..."
    sleep 15
  fi
fi

# 3. Ensure Safety Watchdog Daemon is Running
if ! pgrep -f "scripts/safety_watchdog.sh" > /dev/null 2>&1; then
  echo "[STARTUP] Watchdog daemon is not running. Cleaning stale signals and launching scripts/safety_watchdog.sh in background..."
  rm -f /tmp/stage3_abort_signal "${HEARTBEAT_FILE}" 2>/dev/null || true
  chmod +x scripts/safety_watchdog.sh 2>/dev/null || true
  nohup ./scripts/safety_watchdog.sh > stage3_watchdog.log 2>&1 &
  sleep 3
fi

if [ ! -f "$HEARTBEAT_FILE" ]; then
  echo "[FATAL SAFETY BARRIER] Watchdog heartbeat file not found: $HEARTBEAT_FILE after startup attempt." >&2
  exit 1
fi

# 3. Parse and Validate Heartbeat Payload
HEARTBEAT_RAW=$(cat "$HEARTBEAT_FILE" 2>/dev/null || echo "{}")
WATCHDOG_STATUS=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('status',''))" 2>/dev/null || echo "")
WATCHDOG_REASON=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('reason',''))" 2>/dev/null || echo "")
WATCHDOG_PID=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('pid',''))" 2>/dev/null || echo "")
WATCHDOG_TS=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('timestamp',0))" 2>/dev/null || echo "0")
NOW_TS=$(python3 -c "import time; print(int(time.time()*1000))" 2>/dev/null || echo "0")
AGE_MS=$((NOW_TS - WATCHDOG_TS))

if [ "$WATCHDOG_STATUS" != "HEALTHY" ]; then
  echo "[FATAL SAFETY BARRIER] Watchdog status is not HEALTHY (Current: '${WATCHDOG_STATUS}', Reason: '${WATCHDOG_REASON}')." >&2
  exit 1
fi

if [ "$AGE_MS" -gt 5000 ] || [ "$AGE_MS" -lt -5000 ]; then
  echo "[FATAL SAFETY BARRIER] Watchdog heartbeat is stale (${AGE_MS}ms old > 5000ms threshold)." >&2
  echo "The watchdog daemon may have crashed or stalled. Aborting!" >&2
  exit 1
fi

# 4. Verify Watchdog Process Liveness
if [ -n "$WATCHDOG_PID" ] && ! kill -0 "$WATCHDOG_PID" 2>/dev/null; then
  echo "[FATAL SAFETY BARRIER] Watchdog PID ${WATCHDOG_PID} is not running! Aborting." >&2
  exit 1
fi
echo "[PASS] Watchdog verified: PID ${WATCHDOG_PID} active, status HEALTHY, heartbeat age ${AGE_MS}ms."

# 5. Register Test Runner PID for Precision Process-Group Termination
echo "$$" > "$RUNNER_PID_FILE"
echo "[PASS] Registered test runner PID $$ in $RUNNER_PID_FILE."

# Trap cleanup on exit
cleanup() {
  rm -f "$RUNNER_PID_FILE" 2>/dev/null || true
  echo "[TEARDOWN] Removed runner PID file $RUNNER_PID_FILE."
}
trap cleanup EXIT INT TERM

# 6. Ensure k6 binary is available
if ! command -v k6 >/dev/null 2>&1; then
  echo "[STARTUP] k6 binary not found in PATH. Installing static k6 binary (v0.56.0 linux-amd64)..."
  if curl -sSL https://github.com/grafana/k6/releases/download/v0.56.0/k6-v0.56.0-linux-amd64.tar.gz | tar -xz -C /tmp 2>/dev/null; then
    mv /tmp/k6-v0.56.0-linux-amd64/k6 /usr/local/bin/k6 2>/dev/null || true
    chmod +x /usr/local/bin/k6 2>/dev/null || true
    rm -rf /tmp/k6-v0.56.0-linux-amd64 2>/dev/null || true
    echo "[PASS] k6 successfully installed: $(k6 version 2>/dev/null || echo 'installed')"
  fi
fi

if ! command -v k6 >/dev/null 2>&1; then
  echo "[FATAL ERROR] k6 could not be located or installed. Run 'apt-get install -y k6'." >&2
  exit 1
fi

# 7. Execute k6 Network Load Test
OUTPUT_JSON="stage3_${SCENARIO}_raw_k6.json"
SUMMARY_JSON="stage3_${SCENARIO}_summary.json"

echo "================================================================================"
echo "LAUNCHING K6 NETWORK LOAD TEST: SCENARIO=${SCENARIO} -> ${TARGET_HOST}"
echo "Summary output: ${SUMMARY_JSON}"
echo "Raw metrics:    ${OUTPUT_JSON}"
echo "================================================================================"

k6 run \
  --env TARGET_HOST="${TARGET_HOST}" \
  --env SCENARIO="${SCENARIO}" \
  --summary-export "${SUMMARY_JSON}" \
  --out json="${OUTPUT_JSON}" \
  tests/load/k6_scenarios.js "$@"
K6_EXIT_CODE=$?

echo "================================================================================"
echo "K6 RUN COMPLETED WITH EXIT CODE: ${K6_EXIT_CODE}"
echo "================================================================================"

# 8. Harvest Infrastructure & Database Telemetry
if [ -f "scripts/collect_telemetry.sh" ]; then
  echo "[TELEMETRY] Harvesting post-test infrastructure telemetry..."
  bash scripts/collect_telemetry.sh "${SCENARIO}" || true
fi

exit ${K6_EXIT_CODE}
