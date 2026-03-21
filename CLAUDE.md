# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Architecture

React + Vite SPA with client-side routing via `react-router-dom` v7.

**Routing** is defined in [src/App.jsx](src/App.jsx) with 5 routes: `/` (Home), `/tasks` (DailyTasks), `/seeds` (SeedInventory), `/starts` (SeedStarts), `/frost` (FrostDates).

**State** is local React hooks only — no global state library. Persistence uses `localStorage` directly (see [src/pages/FrostDates.jsx](src/pages/FrostDates.jsx) for the pattern).

**Styling** uses plain CSS with garden-themed design tokens defined as CSS variables in [src/index.css](src/index.css) (`--soil`, `--moss`, `--sage`, `--sprout`, `--cream`, `--sky`, `--accent`). No Tailwind or CSS-in-JS.

**Page status**: Only `FrostDates` is implemented. The other four pages (`Home`, `DailyTasks`, `SeedInventory`, `SeedStarts`) are placeholder stubs.

## Project Goal
A vegetable garden management app to help the gardener know what actions to take each day, based on what has been planted and key dates.

## Who Is Building This
Lisa — IT Business Analyst, strong technical background (SQL, Power Query, VBA, GraphQL) but new to web development. Explain WHY when introducing new concepts. One feature at a time.

## Gardener's Location
New Boston, MI — average last frost ~May 10, first frost ~Oct 15.

## Feature Roadmap (in priority order)
1. **Frost Dates** ✅ Done
2. **Seed Inventory** — CRUD interface for seed packets. Fields: name/variety, species/type, days to germination, weeks to start before last frost, indoor vs direct sow flag, notes, quantity/year purchased
3. **Seed Starts** — Individual starting events tied to seed inventory. Fields: which seed, date started, number of cells, status (started/germinated/potted up/hardening off/transplanted), event log
4. **Daily Tasks** — Dynamically generated task list based on today's date vs frost date, seed start statuses, and calculated planting dates
5. **Event Tracking** — Key event log per seed start with dates

## Coding Preferences
- Plain CSS only, use existing CSS variables
- Keep components simple and readable
- localStorage acceptable now, database is a future concern
- Mobile-friendly (used on phone and laptop)
- Build one feature at a time

## Next Step
Build the Seed Inventory page — a working CRUD interface to add, view, and delete seed packets, saved to localStorage.