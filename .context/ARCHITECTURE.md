# System Architecture

## High-Level Overview

Full-stack app: React SPA frontend + Express REST API backend + SQLite database. In dev, Vite and Express run concurrently on separate ports; in production, Express serves the built React app.

```
Browser (React SPA)
    │  fetch('/api/...')
    ▼
Express API (server/index.js :3001)
    │  better-sqlite3
    ▼
SQLite (server/garden.db)
```

localStorage is used as a fast read cache for frost dates and zip code (written on save, read on startup). The canonical source is SQLite.

## Components

### Frontend — React SPA

**Purpose**: All UI, routing, and user interaction
**Tech stack**: React 19, Vite 8, react-router-dom v7, plain CSS
**Key files**:
- `src/App.jsx` — root component, nav shell, route definitions, loads settings from API on mount
- `src/index.css` — global styles and CSS design tokens
- `src/App.css` — app shell layout (nav, page-content)

**Routes**:
| Path | Component | Status |
|------|-----------|--------|
| `/` | Home | Stub |
| `/tasks` | DailyTasks | Done |
| `/seeds` | SeedInventory | Done |
| `/starts` | SeedStarts | Stub (workflow lives in SeedInventory) |
| `/frost` | FrostDates ("My Garden") | Done |

**Notes**: No global state — all state is local `useState` per page. No context, no Redux.

---

### Backend — Express REST API

**Purpose**: Data persistence, business logic
**Tech stack**: Express 5, Node.js (ESM), better-sqlite3
**Key files**:
- `server/index.js` — all route handlers
- `server/db.js` — database connection and schema migrations

**Endpoints**:
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/seeds` | List all seeds |
| POST | `/api/seeds` | Create seed |
| PUT | `/api/seeds/:id` | Update seed |
| DELETE | `/api/seeds/:id` | Delete seed |
| GET | `/api/sowing-events` | All sowing events (joined with seed) |
| GET | `/api/sowing-events/seed/:seedId` | Events for one seed |
| POST | `/api/sowing-events` | Create sowing event |
| PUT | `/api/sowing-events/:id` | Update sowing event |
| GET | `/api/tasks` | Pending tasks (joined with seed) |
| GET | `/api/tasks/sowing/:sowingEventId` | Tasks for one sowing event |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/settings` | All settings as `{ key: value }` |
| PUT | `/api/settings` | Upsert one or more settings |

---

### Database — SQLite

**Purpose**: Persistent storage
**Tech stack**: better-sqlite3, SQLite file at `server/garden.db`
**Schema**:

```sql
seeds (id, plantType, category, seasons[JSON], variety, status, dateAdded,
       vendor, itemNumber, link, maturityDays, harvestType,
       springSowLeadWeeks, springTransplantLeadWeeks, fallSowLeadWeeks,
       preferredSowingType, successionWeeks, anticipatedHeight,
       recommendedSpacing, hrsSun, notes)

sowing_events (id, seedId→seeds, plannedSowDate, actualSowDate,
               emergenceDate, transplantDate, sowingMethod,
               sowingContainer, sowingStatus, notes)

tasks (id, sowingEventId→sowing_events, category, description,
       notes, dueDate, status)

settings (key PK, value)
```

**Notes**: `seasons` is stored as a JSON string; serialization handled in `server/index.js` `toRow`/`fromRow` helpers. Sowing event IDs are generated as `YYMMDD-{seedRowId}-{count}`.

## Data Flow

1. User opens app → `App.jsx` fetches `/api/settings` and writes frost dates to localStorage
2. Page components fetch their data on mount via `useEffect` → `fetch('/api/...')`
3. User saves data → POST/PUT to API → API writes to SQLite → response updates local React state
4. DailyTasks "What needs starting?" reads frost dates from localStorage for date math, then fetches seeds + sowing events from API

## External Dependencies

| Dependency | Purpose | Version |
|-----------|---------|---------|
| react-router-dom | Client-side routing | v7 |
| express | REST API server | v5 |
| better-sqlite3 | Synchronous SQLite driver | v12 |
| concurrently | Run Vite + Express together in dev | v9 |
| wttr.in | Weather data (external API, no key needed) | — |
| open-meteo archive | Historical precipitation (external API) | — |

## Key Design Patterns

- **Page-as-form**: When editing, the page replaces its list view with a form component (e.g. `SeedInventory` renders `SeedForm` when `editingSeed !== null`)
- **localStorage cache**: Frost dates written to localStorage on save for fast client-side date math; SQLite is the source of truth
- **CSS variables**: All colors via `--soil`, `--moss`, `--sage`, `--sprout`, `--cream`, `--sky`, `--accent` defined in `src/index.css`
