#!/bin/bash
# Garden Manager — first-time server setup
# Run once to create the nginx site config and install dependencies

set -e

echo "=== First-time setup for Garden Manager ==="

# Ensure prerequisites
echo "Checking Node.js..."
node --version || { echo "Install Node.js 20+ first"; exit 1; }

echo "Installing build tools if needed..."
sudo apt-get install -y build-essential python3

echo "Installing PM2 if needed..."
command -v pm2 >/dev/null || sudo npm install -g pm2

# Create directories
mkdir -p ~/garden-manager/server
sudo mkdir -p /var/www/garden-manager/html

# Create nginx site config
sudo tee /etc/nginx/sites-available/garden-manager > /dev/null <<'NGINX'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    root /var/www/garden-manager/html;
    index index.html;

    # API requests → Express
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Everything else → React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

echo ""
echo ">>> Edit the server_name in /etc/nginx/sites-available/garden-manager"
echo ">>> Replace YOUR_DOMAIN_OR_IP with your domain or server IP"
echo ""

# Enable the site
sudo ln -sf /etc/nginx/sites-available/garden-manager /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "=== Setup complete. Now run ship.bat locally, then ~/garden-manager/server-install.sh ==="
