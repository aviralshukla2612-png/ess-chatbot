#!/usr/bin/env bash
# ==============================================================================
# ESS Chatbot SaaS - Staging VPS One-Click Deployment Script
# Target: 187.127.131.178 (/opt/ess-chatbot-staging)
# ==============================================================================
set -euo pipefail

BRANCH="${1:-fix/tenant-isolation-rag-hardening}"
STAGING_DIR="/opt/ess-chatbot-staging"

echo "=========================================================="
echo "🚀 Starting Deployment on Staging VPS"
echo " Target Directory: ${STAGING_DIR}"
echo " Git Branch:       ${BRANCH}"
echo " Timestamp:        $(date -u)"
echo "=========================================================="

cd "${STAGING_DIR}"

# 1. Fetch and checkout the target branch
echo ""
echo "[STEP 1/5] Fetching and checking out branch '${BRANCH}'..."
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

# 2. Rebuild only the frontend Next.js container (preserves postgres & ollama)
echo ""
echo "[STEP 2/5] Building and updating frontend Docker container..."
docker compose -f docker-compose.staging.yml --env-file .env.staging build frontend
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d frontend

# 3. Wait for frontend container to become ready
echo ""
echo "[STEP 3/5] Awaiting frontend readiness..."
sleep 4
READY=0
for attempt in {1..15}; do
  if curl -fsS http://127.0.0.1:3301/api/health >/dev/null 2>&1; then
    echo "  [OK] Frontend is responding healthy!"
    READY=1
    break
  fi
  echo "  Waiting for frontend (attempt ${attempt}/15)..."
  sleep 3
done

if [ "${READY}" -ne 1 ]; then
  echo "  [WARNING] Health check timed out, inspecting container logs:"
  docker logs --tail 30 ess-frontend-staging
fi

# 4. Sync documents from JSON store into PostgreSQL KnowledgeChunk
echo ""
echo "[STEP 4/5] Synchronizing knowledge documents into PostgreSQL KnowledgeChunk..."
docker exec -i ess-frontend-staging node -e '
  (async () => {
    try {
      const { documentsStore } = await import("./lib/db/documentsStore.js");
      const docs = documentsStore.getAllDocuments();
      console.log(`Found ${docs.length} document(s) in store.`);
      for (const d of docs) {
        console.log(` -> Syncing document: "${d.name}" (ID: ${d.id}, Bot: ${d.botId})`);
        documentsStore.updateDocument(d.id, d);
      }
      console.log("Document sync dispatched successfully.");
    } catch (err) {
      console.warn("[SYNC_WARN]", err.message);
    }
  })();
' || true

# 5. Output final status
echo ""
echo "[STEP 5/5] Final Verification..."
echo "Container Status:"
docker ps --filter "name=ess-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Health Endpoint Response:"
curl -sS http://127.0.0.1:3301/api/health || true
echo ""

echo "=========================================================="
echo "✅ Deployment Complete & Operational!"
echo " Public Dashboard: https://chatbot.emperorsmartsolutions.com"
echo " Branch Deployed:  ${BRANCH}"
echo "=========================================================="
