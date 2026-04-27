# Development Environment Setup

## Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node)
- No database setup needed — SQLite file is created automatically

## Installation

```bash
# Clone or open the repo
cd garden-manager

# Install dependencies (frontend + backend)
npm install
```

## Environment Variables

None required. No `.env` file needed for local development.

## Running Locally

```bash
npm run dev
```

This uses `concurrently` to start two processes simultaneously:
- **Vite** (React frontend) on `http://localhost:5173` (or next available port)
- **Express API** on `http://localhost:3001`

Vite proxies `/api/...` requests to Express (configured in `vite.config.js`).

The SQLite database file (`server/garden.db`) is created automatically on first run.

## Building for Production

```bash
npm run build   # builds React app to dist/
npm start       # runs Express in production mode, serves dist/
```

In production mode, Express serves the built React app and handles SPA routing. Both frontend and API run on port 3001 (or `$PORT`).

## Linting

```bash
npm run lint
```

## Common Issues

### "Cannot find module better-sqlite3"
**Fix**: Run `npm install` — native module may need to be rebuilt for your Node version.

### Port already in use
**Fix**: Kill the process on port 3001 or 5173, or set `PORT=xxxx` env var before `npm run dev`.

### garden.db not found / empty data
**Fix**: The DB file is at `server/garden.db` and is created automatically by `server/db.js` on startup. If data is missing, the tables may have been recreated — `db.js` uses `CREATE TABLE IF NOT EXISTS` so existing data is preserved on restarts.
