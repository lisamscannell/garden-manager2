#!/bin/bash
# Garden Manager — server-side deploy script
# Run after ship.bat uploads garden-manager.zip

set -e

ZIP=~/garden-manager.zip
APP_DIR=~/garden-manager
WEB_ROOT=/var/www/garden-manager/html

if [ ! -f "$ZIP" ]; then
    echo "ERROR: $ZIP not found. Did ship.bat upload it?"
    exit 1
fi

echo "=== Deploying Garden Manager ==="

# Unzip to a temp location
rm -rf ~/garden-manager-staging
unzip "$ZIP" -d ~/garden-manager-staging

# ── Frontend: copy dist/ to nginx web root ──
sudo rm -rf "$WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo cp -r ~/garden-manager-staging/dist/* "$WEB_ROOT"

# ── Backend: update server code ──
mkdir -p "$APP_DIR/server"

# Backup database if it exists
if [ -f "$APP_DIR/server/garden.db" ]; then
    cp "$APP_DIR/server/garden.db" "$APP_DIR/server/garden.db.bak"
    echo "Database backed up to garden.db.bak"
fi

# Copy server files and package manifests (never overwrites garden.db)
cp ~/garden-manager-staging/server/db.js "$APP_DIR/server/"
cp ~/garden-manager-staging/server/index.js "$APP_DIR/server/"
cp ~/garden-manager-staging/package.json "$APP_DIR/"
cp ~/garden-manager-staging/package-lock.json "$APP_DIR/"

cd "$APP_DIR"
npm install --omit=dev

# ── Restart services ──
if pm2 describe garden-manager > /dev/null 2>&1; then
    pm2 restart garden-manager
else
    pm2 start npm --name "garden-manager" -- start
    pm2 save
    echo "First deploy — run: pm2 startup (and follow its instructions)"
fi

sudo systemctl reload nginx

# Clean up
rm -rf ~/garden-manager-staging "$ZIP"

echo "=== Deploy complete ==="
