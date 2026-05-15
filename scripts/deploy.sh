#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VetCare Pro — VPS deploy script
#
# Usage:
#   ./scripts/deploy.sh              # full deploy (rebuild + restart)
#   ./scripts/deploy.sh --migrate    # full deploy + run DB migrations
#   ./scripts/deploy.sh --logs       # tail live logs after deploy
#
# Requirements:
#   - SSH key added to VPS (run once: ssh-copy-id ubuntu@43.129.52.81)
#   - Or set VPS_PASSWORD env var to use password auth
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VPS_USER="ubuntu"
VPS_HOST="43.129.52.81"
REMOTE_DIR="/home/ubuntu/vetcare-pro"
ARCHIVE="/tmp/vetcare-deploy.tar.gz"

MIGRATE=false
SHOW_LOGS=false
for arg in "$@"; do
  case $arg in
    --migrate) MIGRATE=true ;;
    --logs)    SHOW_LOGS=true ;;
  esac
done

# ── SSH helper (key auth if available, password via env var otherwise) ────────
ssh_cmd() {
  if [ -n "${VPS_PASSWORD:-}" ]; then
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$@"
  else
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$@"
  fi
}

scp_cmd() {
  if [ -n "${VPS_PASSWORD:-}" ]; then
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$@"
  else
    scp -o StrictHostKeyChecking=no "$@"
  fi
}

# ── 1. Build archive (exclude everything not needed for Docker build) ─────────
echo "→ Creating deployment archive..."
tar \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*/node_modules' \
  --exclude='*/dist' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='artifacts/mockup-sandbox' \
  --exclude='.local' \
  --exclude='.config' \
  --exclude='.cache' \
  --exclude='attached_assets' \
  --exclude='.canvas' \
  --exclude='*.log' \
  -czf "$ARCHIVE" \
  -C "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" \
  .
echo "   Archive: $(du -sh "$ARCHIVE" | cut -f1)"

# ── 2. Upload ─────────────────────────────────────────────────────────────────
echo "→ Uploading to $VPS_HOST..."
scp_cmd "$ARCHIVE" "$VPS_USER@$VPS_HOST:/tmp/vetcare-deploy.tar.gz"
rm -f "$ARCHIVE"

# ── 3. Extract + rebuild + restart ───────────────────────────────────────────
echo "→ Deploying on VPS..."
ssh_cmd "
  set -e
  mkdir -p '$REMOTE_DIR'
  tar -xzf /tmp/vetcare-deploy.tar.gz -C '$REMOTE_DIR'
  rm -f /tmp/vetcare-deploy.tar.gz
  cd '$REMOTE_DIR'
  sudo docker compose up --build -d
"

# ── 4. Optional: run DB migrations ───────────────────────────────────────────
if [ "$MIGRATE" = true ]; then
  echo "→ Running DB migrations..."
  ssh_cmd "
    POSTGRES_PASSWORD=\$(grep POSTGRES_PASSWORD '$REMOTE_DIR/.env' | cut -d= -f2)
    sudo docker run --rm \
      --network vetcare-pro_default \
      -e DATABASE_URL=\"postgres://vetcare:\${POSTGRES_PASSWORD}@db:5432/vetcare\" \
      -v '$REMOTE_DIR':/workspace \
      node:24-slim \
      bash -c \"
        cp -r /workspace/. /app && cd /app &&
        corepack enable && corepack prepare pnpm@latest --activate &&
        pnpm install --frozen-lockfile --ignore-scripts 2>&1 | tail -2 &&
        pnpm --filter @workspace/db run push
      \"
  "
fi

# ── 5. Done ───────────────────────────────────────────────────────────────────
echo ""
echo "✓ Deployed to http://$VPS_HOST"

if [ "$SHOW_LOGS" = true ]; then
  echo "→ Tailing logs (Ctrl+C to stop)..."
  ssh_cmd "sudo docker compose -f '$REMOTE_DIR/docker-compose.yml' logs -f"
fi
