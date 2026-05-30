#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Vethub — Post-deploy script (runs on VPS after rsync)
#
# Called by GitHub Actions after syncing files. Can also be run manually:
#   cd /var/www/vethub && sudo bash deployment/scripts/deploy-on-vps.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="/var/www/vethub"
cd "$DEPLOY_DIR"

echo "→ Installing production dependencies..."
bun install --production --frozen-lockfile

echo "→ Generating Prisma client for runtime..."
bunx prisma generate

echo "→ Running database migrations..."
bunx prisma migrate deploy

echo "→ Reloading systemd and restarting services..."
sudo systemctl daemon-reload

# If systemd service is not installed yet, install it
if [ ! -f /etc/systemd/system/vethub.service ]; then
    echo "→ Installing systemd service..."
    sudo cp deployment/systemd/vethub.service /etc/systemd/system/vethub.service
fi

sudo systemctl restart vethub

echo "→ Waiting for service to be ready..."
sleep 3

echo "→ Health check..."
curl -fsS http://localhost:3000/api/health || {
    echo "✗ Health check failed!"
    sudo journalctl -u vethub --no-pager -n 20
    exit 1
}

echo "✓ Deploy complete"
