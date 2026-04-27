# Master Implementation Plan

## Project: Garden Manager

## Overview

A vegetable garden management app for Lisa (New Boston, MI — last frost ~May 10, first frost ~Oct 15). Helps her know what to do each day based on what's planted, what's been started, and key frost dates.

## Success Criteria

- [x] Know when to start seeds indoors based on frost dates
- [x] Track seed inventory with full details
- [x] Track individual sowing events (when started, status, method)
- [x] Daily task list showing what needs action today
- [ ] A polished home page dashboard that shows the most important info at a glance

---

## Phase 1: Frost Dates ✅

**Goal**: Set up garden location and frost date baseline

### 1.1 Garden Settings
- [x] Zip code input for weather
- [x] Last frost date (spring) input
- [x] First frost date (fall) input
- [x] Days-until-last-frost banner
- [x] Live weather widget (wttr.in + open-meteo historical precip)
- [x] Persist to SQLite via `/api/settings`

---

## Phase 2: Seed Inventory ✅

**Goal**: CRUD interface for seed packets

### 2.1 Core CRUD
- [x] Add / edit / delete seed packets
- [x] Fields: plantType, category, seasons, variety, status, vendor, itemNumber, link, maturityDays, harvestType, sowLeadWeeks, spacing, hrsSun, notes
- [x] Filter by category (Edible / Flower / Foliage) and season (All / Spring / Summer / Fall)
- [x] Hide/show "Gone" status packets

### 2.2 Bulk Import
- [x] CSV template download
- [x] CSV import with header mapping

---

## Phase 3: Seed Starts ✅

**Goal**: Track individual sowing instances tied to seed inventory

### 3.1 Sowing Events
- [x] Create sowing event from a seed (via SeedForm → SowingForm)
- [x] Fields: seedId, plannedSowDate, actualSowDate, emergenceDate, transplantDate, sowingMethod, sowingContainer, sowingStatus, notes
- [x] Edit existing sowing events
- [x] Auto-generated event IDs (YYMMDD-{rowid}-{n})

---

## Phase 4: Daily Tasks ✅

**Goal**: Dynamic task list based on dates and sowing statuses

### 4.1 Sections
- [x] Starts Planned This Week — sowing events with plannedSowDate within 3 days, not yet sown
- [x] Garden Tasks — pending tasks sorted by due date
- [x] Upcoming Transplants — active starts due outdoors within 7 days (based on springTransplantLeadWeeks)
- [x] What Needs Starting? — seeds overdue for first start or succession based on frost date math

### 4.2 Task Management
- [x] Create / edit tasks linked to sowing events
- [x] Task fields: category, description, notes, dueDate, status
- [x] Mark tasks done (removes from Pending list)

---

## Phase 5: Polish & Home Dashboard

**Goal**: Wrap up loose ends and build the Home page

### 5.1 Home Page
- [ ] Summary of today's most urgent tasks
- [ ] Quick stats: seeds in inventory, active starts, days until last frost
- [ ] Link to each section

### 5.2 Event Tracking (from original roadmap)
- [ ] Detailed per-sowing event log with timestamped entries
- [ ] Tie to sowing status transitions (e.g. "germinated on 03/15")

---

## Timeline Dependencies

```
Phase 1 (Frost Dates) ──► Phase 2 (Seed Inventory) ──► Phase 3 (Seed Starts)
                                                                │
                                                                ▼
                                                        Phase 4 (Daily Tasks)
                                                                │
                                                                ▼
                                                        Phase 5 (Polish)
```

## Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| Frost date math edge cases (year rollover) | Med | Tested manually; DailyTasks handles both spring and fall frost |
| SQLite file not found / corrupted | High | db.js creates tables on startup; garden.db is gitignored |
| Mobile usability | Med | Test on phone regularly; mobile-first CSS |
