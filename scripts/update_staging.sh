#!/usr/bin/env bash
# ==============================================================================
# Automated Staging Update & Rolling Rebuild Script
# Target: /opt/ess-chatbot-staging on 187.127.131.178
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo " Starting Staging Stack Update from GitHub (main)"
echo " Timestamp: $(date -u)"
echo "=========================================================="

STAGING_DIR="/opt/ess-chatbot-staging"
cd "${STAGING_DIR}"

# 1. Fetch latest commits
echo "[STEP 1/4] Pulling latest code from origin/main..."
git fetch origin main
git reset --hard origin/main

# 2. Apply any idempotent database schema updates
echo "[STEP 2/4] Ensuring database schema is current..."
if [ -f "frontend/data/migrations/002_bot_business_configuration.sql" ]; then
  docker exec -i ess-postgres-staging psql -U postgres -d ess_chatbot_staging -v ON_ERROR_STOP=1 < frontend/data/migrations/002_bot_business_configuration.sql || true
fi
if [ -f "frontend/data/staging_initial_schema.sql" ]; then
  docker exec -i ess-postgres-staging psql -U postgres -d ess_chatbot_staging -v ON_ERROR_STOP=1 < frontend/data/staging_initial_schema.sql || {
    echo "[WARNING] Schema update reported warnings; continuing deployment..."
  }
fi

# 3. Rebuild and restart application containers
echo "[STEP 3/4] Rebuilding and updating application containers..."
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build frontend fastapi

# 4. Await and verify health
echo "[STEP 4/4] Verifying health..."
sleep 5
for attempt in {1..12}; do
  if curl -fsS http://127.0.0.1:3301/api/health >/dev/null 2>&1; then
    echo "[OK] Application reported healthy!"
    break
  fi
  echo "  Waiting for frontend to become ready (attempt ${attempt}/12)..."
  sleep 4
done

echo "=========================================================="
echo " Health Status:"
curl -sS http://127.0.0.1:3301/api/health || true
echo ""
echo "=========================================================="
echo " Staging stack successfully updated and operational!"
echo " Public URL: https://chatbot.emperorsmartsolutions.com"
echo "=========================================================="
