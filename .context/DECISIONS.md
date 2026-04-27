# Architecture Decision Records

---

## ADR-001: SQLite + Express backend over localStorage-only

**Date**: ~2026-03
**Status**: Accepted

**Context**:
Initial plan was localStorage-only persistence. As the data model grew (seeds, sowing events, tasks), localStorage became limiting — no relational queries, no cross-tab consistency, size limits.

**Decision**:
Add an Express server with better-sqlite3. Frontend fetches from `/api/...` endpoints. localStorage is kept only as a read cache for frost dates (for fast client-side date math without an async call).

**Rationale**:
- better-sqlite3 is synchronous, which simplifies server code
- SQLite is zero-config — no separate database process
- Relational tables let us JOIN seeds → sowing_events → tasks cleanly

**Consequences**:
- (+) Full relational queries; data survives page reloads robustly
- (+) Can add server-side logic (e.g. sowing event ID generation)
- (-) Requires running the server; `npm run dev` uses `concurrently` to run both

**Relevant code**: `server/db.js`, `server/index.js`

---

## ADR-002: Plain CSS with design tokens, no utility frameworks

**Date**: ~2026-01 (project start)
**Status**: Accepted

**Context**:
Lisa is new to web development. Tailwind and CSS-in-JS add conceptual overhead on top of learning React.

**Decision**:
Plain CSS only. All colors as CSS variables in `src/index.css`: `--soil`, `--moss`, `--sage`, `--sprout`, `--cream`, `--sky`, `--accent`.

**Rationale**:
- Easier to understand and modify
- No build-time config
- CSS variables give consistency without a framework

**Consequences**:
- (+) Simple, readable, no dependencies
- (-) More verbose than utility classes for layout

**Relevant code**: `src/index.css`

---

## ADR-003: Tasks linked to sowing events, not directly to seeds

**Date**: ~2026-03
**Status**: Accepted

**Context**:
Garden tasks (fertilize, water, harden off) apply to a specific planting instance, not to a seed variety in general. A tomato planted in March and one planted in April need separate task tracking.

**Decision**:
`tasks.sowingEventId` references `sowing_events`, which in turn references `seeds`. Tasks display seed info via JOIN in the API.

**Rationale**:
- Each sowing event is an independent growing instance
- Tasks carry meaning relative to that instance's timeline (e.g. "transplant in 2 weeks")

**Consequences**:
- (+) Correct modeling — tasks are per-planting, not per-variety
- (-) Cannot create a task without first creating a sowing event

**Relevant code**: `server/db.js` (schema), `server/index.js` (task endpoints with JOIN)

---

## ADR-004: Frost dates stored as MM-DD strings

**Date**: ~2026-01
**Status**: Accepted

**Context**:
Frost dates are recurring annual events — "last frost is usually May 10 every year." Storing as a full `YYYY-MM-DD` requires updating every year.

**Decision**:
Store frost dates as `MM-DD` (e.g. `"05-10"`). When used for date math, append the current year at runtime.

**Rationale**:
- Set once, works every year
- Avoids "did I remember to update the year?" bugs

**Consequences**:
- (+) User sets it once, app handles the annual rollover
- (-) Requires year-appending logic wherever frost dates are used (see `FrostDates.jsx`, `DailyTasks.jsx`)

**Relevant code**: `src/pages/FrostDates.jsx`, `src/pages/DailyTasks.jsx`

---

<!-- Copy the template above for each new decision.
     Number sequentially: ADR-005, ADR-006, etc.
     When a decision is reversed, set Status to "Superseded by ADR-XXX" -->
