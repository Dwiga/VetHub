#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Vethub — One-time VPS setup script
#
# Run this ONCE on a fresh Ubuntu 24.04 VPS to install all dependencies and
# configure the system. After this, deploys happen entirely through GitHub
# Actions.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/your-org/vethub/main/deployment/scripts/setup-vps.sh | bash
#   # or locally:
#   sudo bash deployment/scripts/setup-vps.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Vethub — VPS Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. System packages ───────────────────────────────────────────────────────
echo "→ Updating system packages..."
sudo apt update -qq && sudo apt upgrade -y -qq

echo "→ Installing dependencies..."
sudo apt install -y -qq \
    curl \
    wget \
    git \
    unzip \
    rsync \
    postgresql \
    postgresql-contrib \
    ufw

# ── 2. Install Bun ─────────────────────────────────────────────────────────────
echo "→ Installing Bun..."
if ! command -v bun &>/dev/null; then
    curl -fsSL https://bun.sh/install | bash
    # Reload PATH for current session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi
echo "  Bun version: $(bun --version)"

# Ensure bun is in global PATH (link to /usr/local/bin)
sudo ln -sf "$(which bun)" /usr/local/bin/bun

# ── 3. Install Caddy ───────────────────────────────────────────────────────────
echo "→ Installing Caddy..."
if ! command -v caddy &>/dev/null; then
    sudo apt install -y -qq debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update -qq
    sudo apt install -y -qq caddy
fi
echo "  Caddy version: $(caddy --version)"

# ── 4. Configure PostgreSQL ──────────────────────────────────────────────────
echo "→ Configuring PostgreSQL..."

# Start and enable PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create the database and user if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='vetcare'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER vetcare WITH PASSWORD 'changeme';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='vetcare'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE vetcare OWNER vetcare;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vetcare TO vetcare;"

echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  IMPORTANT: Update the password in .env.production! │"
echo "  │  Then run: sudo -u postgres psql                    │"
echo "  │  ALTER USER vetcare WITH PASSWORD 'newpassword';    │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""

# Enable password auth for local TCP (for Bun to connect via localhost)
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' /etc/postgresql/*/main/pg_hba.conf
sudo sed -i 's/host    all             all             127.0.0.1\/32            scram-sha-256/host    all             all             127.0.0.1\/32            md5/' /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql

# ── 5. Create app directory ──────────────────────────────────────────────────
echo "→ Setting up app directory..."
sudo mkdir -p /var/www/pethub
sudo chown -R www-data:www-data /var/www/pethub

# Create log directory
sudo mkdir -p /var/log/pethub
sudo chown -R www-data:www-data /var/log/pethub

# ── 6. Create .env.production template ─────────────────────────────────────
echo "→ Creating .env.production template..."
if [ ! -f /var/www/pethub/.env.production ]; then
    cat > /tmp/.env.production << 'ENVEOF'
# ── Vethub — Production Environment ───────────────────────────────────────────
# This file is created by setup-vps.sh and MUST be kept secret.
# NEVER commit this file to git.
# NOTE: On each deploy, GitHub Actions overwrites this file with real secrets.

NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://vetcare:changeme@localhost:5432/vetcare?schema=public

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY

# Session
SESSION_SECRET=replace-with-a-long-random-string
ENVEOF
    sudo mv /tmp/.env.production /var/www/pethub/.env.production
    sudo chown www-data:www-data /var/www/pethub/.env.production
    sudo chmod 600 /var/www/pethub/.env.production
    echo "  Template created at /var/www/pethub/.env.production"
    echo "  ⚠  You can ignore it — GitHub Actions will overwrite it on deploy"
fi

# ── 7. Install systemd service ──────────────────────────────────────────────
echo "→ Installing systemd service..."
echo "
# Run setup later after deploy pushes the files
# For now, create a placeholder
" | tee /dev/null

# ── 8. Configure Caddy ───────────────────────────────────────────────────────
echo "→ Configuring Caddy..."
# Caddyfile will be placed by deploy workflow at /var/www/pethub/deployment/caddy/Caddyfile
# We create a symlink to the standard location
sudo mkdir -p /etc/caddy

# ── 9. Configure firewall ───────────────────────────────────────────────────
echo "→ Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ VPS setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Make sure these GitHub secrets are set:"
echo "       - VPS_HOST, VPS_USER, VPS_SSH_PRIVATE_KEY"
echo "       - DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY"
echo "       - VITE_CLERK_PUBLISHABLE_KEY, SESSION_SECRET"
echo "    2. Update /etc/postgresql/*/main/pg_hba.conf if needed"
echo "    3. Push to main to trigger the first deploy"
echo "    4. After first deploy, copy the Caddyfile:"
echo "       sudo cp /var/www/pethub/deployment/caddy/Caddyfile /etc/caddy/"
echo "       sudo sed -i 's/your-domain.com/YOUR_DOMAIN/g' /etc/caddy/Caddyfile"
echo "       sudo systemctl reload caddy"
echo ""
echo "  GitHub Secrets needed:"
echo "    - VPS_HOST, VPS_USER, VPS_SSH_PRIVATE_KEY"
echo "    - DATABASE_URL, VITE_CLERK_PUBLISHABLE_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
