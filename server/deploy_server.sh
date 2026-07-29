#!/usr/bin/env bash
# ==============================================================================
# Danger Ghost - 1-Click Server Deployment Script for DeSoHosting VPS
# VPS IP: 68.122.49.144 | Port: 3000
# ==============================================================================
set -e

echo "=========================================================="
echo "      DANGER GHOST - BACKEND DEPLOYMENT SCRIPT            "
echo "=========================================================="

# 1. Update package list & install essential build tools and SQLite libraries
echo "[1/6] Updating packages and installing Git, curl & build dependencies..."
sudo apt-get update -y
sudo apt-get install -y git curl build-essential sqlite3 libsqlite3-dev

# 2. Install Node.js 20 LTS via NodeSource (if not already Node 20)
echo "[2/6] Verifying/Installing Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1)" != "v20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "-> Node.js version: $(node -v)"
echo "-> NPM version:     $(npm -v)"

# 3. Install PM2 globally
echo "[3/6] Installing PM2 process manager..."
sudo npm install -g pm2

# 4. Clone or pull GitHub repository
echo "[4/6] Setting up repository: https://github.com/becopro/danger-ghost.git..."
INSTALL_DIR="$HOME/danger-ghost"
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "-> Existing repository detected. Pulling latest updates..."
    cd "$INSTALL_DIR"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master || echo "Git pull completed."
else
    echo "-> Cloning repository..."
    git clone https://github.com/becopro/danger-ghost.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 5. Navigate to server/ and install dependencies
echo "[5/6] Installing backend dependencies in server/..."
cd "$INSTALL_DIR/server"
npm install
# Explicitly install sqlite3 and google-auth-library required by index.js and db.js
npm install sqlite3 google-auth-library dotenv express socket.io cors

# 6. Start backend with PM2 on port 3000
echo "[6/6] Starting Danger Ghost multiplayer server with PM2..."
pm2 delete danger-ghost-server 2>/dev/null || true
pm2 start index.js --name "danger-ghost-server" --time
pm2 save
pm2 startup | tail -n 1 || true

echo "=========================================================="
echo "  SUCCESS! DANGER GHOST SERVER IS RUNNING ON PORT 3000    "
echo "=========================================================="
echo " Useful PM2 Commands:"
echo " -> Check status:  pm2 status"
echo " -> View logs:     pm2 logs danger-ghost-server"
echo " -> Restart:       pm2 restart danger-ghost-server"
echo "=========================================================="
