# Deploying Garden Manager to Digital Ocean

## How it works in production

In development, Vite and the Express API run as two separate processes. In production, a single Express server does everything: it handles all `/api/*` routes and serves the pre-built React frontend as static files. A process manager (PM2) keeps it running, and Nginx sits in front to handle port 80/443 and your domain name.

```
Browser → Nginx (port 80/443) → Express (port 3001)
                                      ├── /api/* routes (SQLite)
                                      └── everything else → dist/index.html
```

---

## Prerequisites

- A GitHub account with this repository pushed to it
- A domain name pointed at your Droplet's IP (optional but recommended for SSL)

---

## Step 1 — Push to GitHub

If you haven't already, create a GitHub repository and push the project.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/garden-manager.git
git push -u origin main
```

> The `server/garden.db` database file is excluded from git (it's in `.gitignore`). Your data lives only on the server — it will not be wiped when you redeploy code.

---

## Step 2 — Create a Droplet

1. Log in to [digitalocean.com](https://digitalocean.com)
2. Click **Create → Droplets**
3. Choose:
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$12/month** (2GB RAM, 1 CPU)
     - 2GB is recommended because `npm install` compiles native binaries (`better-sqlite3`) and needs the headroom
   - **Region:** Closest to you
   - **Authentication:** SSH Key (paste your public key) — safer than a password
4. Click **Create Droplet**
5. Copy the Droplet's **IP address** from the dashboard

---

## Step 3 — Connect to the Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

---

## Step 4 — Create a non-root user

Running as root is risky. Create a regular user for day-to-day use.

```bash
adduser garden
usermod -aG sudo garden

# Copy your SSH key to the new user so you can log in as them
rsync --archive --chown=garden:garden ~/.ssh /home/garden
```

Log out and back in as the new user for all remaining steps:

```bash
ssh garden@YOUR_DROPLET_IP
```

---

## Step 5 — Configure the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Step 6 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # should print v20.x.x
npm --version
```

---

## Step 7 — Install build tools (required for better-sqlite3)

`better-sqlite3` compiles native code during `npm install`. This requires build tools.

```bash
sudo apt-get install -y build-essential python3
```

---

## Step 8 — Install PM2

PM2 is a process manager that keeps the app running and restarts it if it crashes or the server reboots.

```bash
sudo npm install -g pm2
```

---

## Step 9 — Deploy the app

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/garden-manager.git
cd garden-manager

# Install all dependencies (this will compile better-sqlite3 — takes ~1 minute)
npm install

# Build the React frontend
npm run build

# Start the production server with PM2
pm2 start npm --name "garden-manager" -- start

# Save the process list so it restarts after a server reboot
pm2 save

# Configure PM2 to start on boot
pm2 startup
# ↑ This prints a command to run — copy and run that command
```

At this point the app is running on port 3001. Test it:

```bash
curl http://localhost:3001/api/seeds
# Should return [] or a JSON array
```

---

## Step 10 — Install and configure Nginx

Nginx listens on port 80 and forwards requests to Express on port 3001.

```bash
sudo apt-get install -y nginx
```

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/garden-manager
```

Paste this (replace `YOUR_DOMAIN_OR_IP` with your domain name or Droplet IP):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/garden-manager /etc/nginx/sites-enabled/
sudo nginx -t          # test the config — should say "ok"
sudo systemctl restart nginx
```

Your app is now accessible at `http://YOUR_DOMAIN_OR_IP`.

---

## Step 11 — Add SSL (HTTPS) with Let's Encrypt

Requires a domain name pointed at your Droplet's IP. If you're using just an IP address, skip this step.

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically update your Nginx config for HTTPS and set up auto-renewal. Your app will be available at `https://yourdomain.com`.

---

## Redeploying after code changes

When you make changes to the app locally:

```bash
# On your local machine — commit and push
git add .
git commit -m "Description of changes"
git push
```

Then on the server:

```bash
ssh garden@YOUR_DROPLET_IP
cd garden-manager

git pull                  # get the latest code
npm install               # in case dependencies changed
npm run build             # rebuild the React frontend
pm2 restart garden-manager
```

> **Your data is safe.** The `server/garden.db` file is not in git and is never touched by `git pull`.

---

## Backing up the database

The entire app's data lives in `server/garden.db` on the Droplet. Copy it to your local machine:

```bash
# Run this on your local machine
scp garden@YOUR_DROPLET_IP:~/garden-manager/server/garden.db ./garden-backup-$(date +%Y%m%d).db
```

Consider running this periodically or setting up a cron job on the Droplet to copy it to Digital Ocean Spaces (their S3-compatible object storage).

---

## Useful PM2 commands

```bash
pm2 status                        # see if the app is running
pm2 logs garden-manager           # view live logs
pm2 logs garden-manager --lines 50  # view last 50 log lines
pm2 restart garden-manager        # restart the app
pm2 stop garden-manager           # stop the app
```

---

## Troubleshooting

| Problem | Check |
|---|---|
| App not loading | `pm2 status` — is it online? `pm2 logs garden-manager` for errors |
| 502 Bad Gateway | Express isn't running — check `pm2 status` |
| API calls failing | `curl http://localhost:3001/api/seeds` directly on the server |
| Port 80 blocked | `sudo ufw status` — is port 80 allowed? |
| `npm install` fails | Check build tools are installed: `sudo apt-get install -y build-essential` |
| Changes not showing | Did you run `npm run build` and `pm2 restart garden-manager`? |
