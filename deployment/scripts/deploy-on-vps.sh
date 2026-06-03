#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Vethub — Post-deploy script (runs on VPS after rsync)
#
# Called by GitHub Actions after syncing files. Can also be run manually:
#   cd /var/www/pethub && sudo bash deployment/scripts/deploy-on-vps.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="/var/www/pethub"
cd "$DEPLOY_DIR"

# Bun installs to ~/.bun/bin/ — not in PATH for non-interactive SSH
export BUN_PATH="$HOME/.bun/bin"
export PATH="$BUN_PATH:$PATH"

echo "→ Installing production dependencies..."
bun install --production --frozen-lockfile

echo "→ Generating Prisma client for runtime..."
bunx prisma generate

echo "→ Running database migrations..."
bunx prisma migrate deploy

echo "→ Reloading systemd and restarting services..."
sudo systemctl daemon-reload

# If systemd service is not installed yet, install it
if [ ! -f /etc/systemd/system/pethub.service ]; then
    echo "→ Installing systemd service..."
    sudo cp deployment/systemd/pethub.service /etc/systemd/system/pethub.service
fi

sudo systemctl restart pethub

echo "→ Waiting for service to be ready..."
sleep 3

echo "→ Health check..."
curl -fsS http://localhost:3000/api/health || {
    echo "✗ Health check failed!"
    sudo journalctl -u pethub --no-pager -n 20
    exit 1
}

echo "✓ Deploy complete"
