# Project Status

**Last updated**: 2026-04-27

## Current Position

**Phase**: Phase 5 — Polish & Maintenance
**Subphase**: All core features implemented
**Progress**: ~95% complete

## Recently Completed

- Seed Inventory — full CRUD, CSV import/export, category/season filters
- Seed Starts (Sowing Events) — create, track status, event log per start
- Daily Tasks page — 4 sections: Starts Planned This Week, Garden Tasks, Upcoming Transplants, What Needs Starting
- Task persistence — tasks stored in SQLite, editable via TaskForm
- Garden settings persistence — frost dates and zip code saved to SQLite via `/api/settings`
- **2026-04-26**: Fixed "New Sowing Event" button missing when opening a seed from Daily Tasks "What Needs Starting?" — wired up `onNewSowingEvent` and `onOpenSowingEvent` props in DailyTasks, added `sowingForSeed` and `seedForReturn` states
- **2026-04-26**: Added "Dense Container" option to Sowing Container dropdown in SowingForm
- **2026-04-26**: Skip Year feature — seeds can be skipped for the current calendar year from "What Needs Starting?" cards; `skipYear INTEGER` column added to seeds table; skipped seeds auto-reappear next year; Un-skip available in SeedForm
- **2026-04-26**: "Start Now" button on "What Needs Starting?" cards — opens new sowing event form directly without going through the seed detail form
- **2026-04-27**: Sowing form auto-sets Status = Anticipated when Planned Sow Date is entered; Status = Active when Actual Sow Date is entered
- **2026-04-27**: Fixed "What Needs Starting?" suppression — Active/Anticipated events now suppress seeds regardless of whether a date is filled in
- **2026-04-27**: Avg Days to Emergence stat on Seed Packet form (Growing Details section) — calculated from all historical sowing events with both actualSowDate and emergenceDate
- **2026-04-27**: Expected emergence date on Seed Starts "Watch for Emergence" section — computed per-seed from historical average, shown as "sow date → expected date" in green italic

## In Progress

- (Nothing actively in progress)

## Next Up

1. Add Home page dashboard (currently a stub) — summary of today's most urgent items
2. Event Tracking — key event log per seed start with dates (listed in roadmap but not fully fleshed out)

## Active Files and Modules

```
src/pages/
├── FrostDates.jsx         [status: done]
├── SeedInventory.jsx      [status: done]
├── SeedForm.jsx           [status: done]
├── SowingForm.jsx         [status: done]
├── DailyTasks.jsx         [status: done]
├── TaskForm.jsx           [status: done]
├── Home.jsx               [status: stub — not yet implemented]
└── SeedStarts.jsx         [status: stub — SeedStarts route redirects through SeedInventory workflow]

server/
├── index.js               [status: done — all REST endpoints]
├── db.js                  [status: done — seeds, sowing_events, tasks, settings tables]
└── garden.db              [status: live data]
```

## Recent Decisions

- **2026-03-xx**: Migrated persistence from localStorage to SQLite (see DECISIONS.md #ADR-001)
- **2026-03-xx**: Tasks linked to sowing events, not seeds directly (see DECISIONS.md #ADR-003)

## Open Questions

- **Q**: Should the Home page show a summary dashboard or redirect to Tasks?
  - Leaning toward: Summary dashboard with today's most urgent items
  - Blocked by: Not yet prioritized

## Notes for Claude

- `seasons` field on seeds is stored as a JSON string in SQLite (`'["Spring","Summer"]'`) but parsed to an array in JS — always pass as array from the frontend, the server handles serialization
- Frost dates are stored as `MM-DD` strings (e.g. `"05-10"`), not full ISO dates — date math appends the current year
- The `/frost` route is labeled "My Garden" in the nav — it handles garden settings, not just frost
- `SeedStarts` page route (`/starts`) is a stub; seed start workflow lives inside `SeedInventory` via `SowingForm`
- `skipYear` on seeds is an INTEGER (year number, e.g. 2026) or null — not a boolean; comparison is `s.skipYear !== currentYear` so it auto-expires each January
- DailyTasks has two sowing-related states: `sowingForSeed` (new event) and `editingEvent` (edit existing); `seedForReturn` tracks which seed to go back to when an event was opened from within SeedForm
- `SeedStarts.jsx` is NOT a stub — it's a fully implemented page with grouped sections: Watch for Emergence, Active Indoors, Active Outdoors, In Ground, Anticipated
- Avg Days to Emergence is computed client-side from all sowing events (no DB column); calculated in both SeedForm (per-packet stat) and SeedStarts (for expected emergence date display)
