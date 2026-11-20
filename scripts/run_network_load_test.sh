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

# 2. Watchdog Heartbeat Existence Check
if [ ! -f "$HEARTBEAT_FILE" ]; then
  echo "[FATAL SAFETY BARRIER] Watchdog heartbeat file not found: $HEARTBEAT_FILE" >&2
  echo "Start scripts/safety_watchdog.sh in background before launching load test!" >&2
  exit 1
fi

# 3. Parse and Validate Heartbeat Payload
HEARTBEAT_RAW=$(cat "$HEARTBEAT_FILE" 2>/dev/null || echo "{}")
WATCHDOG_STATUS=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('status',''))" 2>/dev/null || echo "")
WATCHDOG_PID=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('pid',''))" 2>/dev/null || echo "")
WATCHDOG_TS=$(python3 -c "import json; d=json.loads('''$HEARTBEAT_RAW'''); print(d.get('timestamp',0))" 2>/dev/null || echo "0")
NOW_TS=$(python3 -c "import time; print(int(time.time()*1000))" 2>/dev/null || echo "0")
AGE_MS=$((NOW_TS - WATCHDOG_TS))

if [ "$WATCHDOG_STATUS" != "HEALTHY" ]; then
  echo "[FATAL SAFETY BARRIER] Watchdog status is not HEALTHY (Current: '${WATCHDOG_STATUS}')." >&2
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

# 6. Execute k6 Network Load Test
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

# 7. Harvest Infrastructure & Database Telemetry
if [ -f "scripts/collect_telemetry.sh" ]; then
  echo "[TELEMETRY] Harvesting post-test infrastructure telemetry..."
  bash scripts/collect_telemetry.sh "${SCENARIO}" || true
fi

exit ${K6_EXIT_CODE}
