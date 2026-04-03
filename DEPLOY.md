# Deploying Garden Manager

## How it works in production

The React frontend is built locally on your PC and uploaded to the server. Nginx serves the static frontend directly and proxies `/api` requests to Express running on port 3001. PM2 keeps Express running.

```
Browser → Nginx (port 80/443)
              ├── /api/*  → proxy to Express (port 3001, managed by PM2)
              │                  └── SQLite database
              └── /*      → /var/www/garden-manager/html (static files)
```

### Deployment files

| File | Runs on | Purpose |
|------|---------|---------|
| `ship.bat` | Your PC | Builds frontend, zips, uploads via SFTP, opens PuTTY |
| `sftp-garden.scr` | Your PC | SFTP commands used by `ship.bat` |
| `deploy.sh` | Server (once) | First-time setup: nginx config, PM2, build tools |
| `server-install.sh` | Server (each deploy) | Unzips, updates files, restarts services |

---

## First-time server setup

These steps only need to be done once.

### 1. Prerequisites on the server

SSH into the server and ensure these are installed:

- **Node.js 20+** — `node --version`
- **build-essential** — needed to compile `better-sqlite3`
- **PM2** — process manager

If not, install them:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3
sudo npm install -g pm2
```

### 2. Copy scripts to the server

From your PC, upload the setup and deploy scripts:

```bat
pscp -i "C:\Users\mike\Documents\SSH Keys\DigitalOcean-Dcc-Private.ppk" "C:\Users\mike\Documents\Code Projects\garden-manager2\deploy.sh" mike@rentontrack.org:/home/mike/garden-manager/deploy.sh
pscp -i "C:\Users\mike\Documents\SSH Keys\DigitalOcean-Dcc-Private.ppk" "C:\Users\mike\Documents\Code Projects\garden-manager2\server-install.sh" mike@rentontrack.org:/home/mike/garden-manager/server-install.sh
```

Then on the server, make them executable:

```bash
chmod +x ~/garden-manager/deploy.sh ~/garden-manager/server-install.sh
```

### 3. Run first-time setup

```bash
~/garden-manager/deploy.sh
```

This creates the nginx site config and enables it. After it runs, edit the `server_name` in the config:

```bash
sudo nano /etc/nginx/sites-available/garden-manager
```

Replace `YOUR_DOMAIN_OR_IP` with your domain or server IP, then reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Upload the database

If you have seed data locally that you want on the server, stop PM2 first (if running), upload, then start:

```bash
# On the server
pm2 stop garden-manager    # skip if first deploy
```

```bat
REM On your PC
pscp -i "C:\Users\mike\Documents\SSH Keys\DigitalOcean-Dcc-Private.ppk" "C:\Users\mike\Documents\Code Projects\garden-manager2\server\garden.db" mike@rentontrack.org:/home/mike/garden-manager/server/garden.db
```

```bash
# On the server
pm2 start garden-manager   # skip if first deploy — server-install.sh will start it
```

### 5. First deploy

Run `ship.bat` on your PC, then in the PuTTY window:

```bash
~/garden-manager/server-install.sh
```

---

## Deploying updates

After making code changes locally:

1. Double-click **`ship.bat`** on your PC
   - Builds the React frontend (`npm run build`)
   - Zips `dist/`, `server/db.js`, `server/index.js`, `package.json`, `package-lock.json`
   - Uploads `garden-manager.zip` to the server via SFTP
   - Opens a PuTTY SSH session

2. In the PuTTY window, run:

```bash
~/garden-manager/server-install.sh
```

That script:
- Backs up `garden.db` to `garden.db.bak`
- Copies the new frontend to `/var/www/garden-manager/html`
- Updates server code in `~/garden-manager/server/`
- Runs `npm install --omit=dev` (compiles native deps for Linux)
- Restarts Express via PM2
- Reloads nginx

> **Your data is safe.** The zip never contains `garden.db` — it stays untouched on the server.

---

## SSL (HTTPS) with Let's Encrypt

Optional — requires a domain name pointed at your server's IP.

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Backing up the database

All app data lives in `~/garden-manager/server/garden.db` on the server. Copy it to your PC:

```bat
pscp -i "C:\Users\mike\Documents\SSH Keys\DigitalOcean-Dcc-Private.ppk" mike@rentontrack.org:/home/mike/garden-manager/server/garden.db "C:\Users\mike\Documents\Code Projects\garden-manager2\garden-backup.db"
```

> Stop PM2 first (`pm2 stop garden-manager`) to avoid copying a database mid-write.

---

## Useful PM2 commands

Run these on the server:

```bash
pm2 status                          # see if the app is running
pm2 logs garden-manager             # view live logs
pm2 logs garden-manager --lines 50  # view last 50 log lines
pm2 restart garden-manager          # restart the app
pm2 stop garden-manager             # stop the app
```

---

## Troubleshooting

| Problem | Check |
|---|---|
| App not loading | `pm2 status` — is it online? `pm2 logs garden-manager` for errors |
| 502 Bad Gateway on /api calls | Express isn't running — check `pm2 status` and `pm2 logs` |
| Static pages load but API fails | Nginx config missing `/api/` proxy — check `/etc/nginx/sites-available/garden-manager` |
| API calls failing | `curl http://localhost:3001/api/seeds` directly on the server |
| `npm install` fails on server | Check build tools: `sudo apt-get install -y build-essential` |
| Changes not showing | Did you run `ship.bat` and then `server-install.sh`? |
| Database missing after deploy | `garden.db` is never in the zip. Upload it manually (see Backing up section) |
