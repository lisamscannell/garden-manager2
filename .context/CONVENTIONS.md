# Project Conventions

## Language and Runtime

- **Language**: JavaScript (no TypeScript)
- **Version**: Node.js (ESM modules — `"type": "module"` in package.json)
- **Package manager**: npm

## Code Style

- **Linter**: ESLint 9 (flat config) with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- **Formatter**: None configured — consistent with existing code style
- **Type checker**: None (plain JS)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `SeedInventory`, `SowingForm` |
| Component files | PascalCase | `SeedInventory.jsx`, `TaskForm.jsx` |
| Non-component files | camelCase | `db.js`, `index.js` |
| Functions | camelCase | `handleSave`, `parseCSV`, `fetchWeather` |
| State variables | camelCase | `seeds`, `editingSeed`, `showForm` |
| CSS classes | kebab-case | `seed-card`, `save-btn`, `page-title` |
| DB column names | camelCase | `plantType`, `springSowLeadWeeks` |
| Internal-only fields | `_prefixed` | `_type`, `_overdueness`, `_lastSowDate` |

## Styling Rules

- **Plain CSS only** — no Tailwind, no CSS-in-JS, no styled-components
- Use existing CSS variables for all colors: `var(--soil)`, `var(--moss)`, `var(--sage)`, `var(--sprout)`, `var(--cream)`, `var(--sky)`, `var(--accent)`
- Page-level styles go in `src/index.css`
- Component-specific layout can use inline `style={{}}` for one-off adjustments
- Mobile-first — the app is used on phone and laptop

## Component Patterns

- **State**: Local `useState` only — no global state, no Context API, no Redux
- **Effects**: `useEffect` with empty `[]` for on-mount data fetching
- **Form pattern**: Parent page renders the form component full-page when editing (replaces list view)
  ```jsx
  if (editingSeed) return <SeedForm ... />
  // otherwise render list
  ```
- **API calls**: Plain `fetch()` — no axios or query library
- **Error handling**: `alert()` for save errors, inline `<p>` for display errors

## Data Conventions

- **Frost dates**: Stored as `MM-DD` strings (e.g. `"05-10"`), never full ISO dates
- **All other dates**: ISO format `YYYY-MM-DD`
- **`seasons` field**: JavaScript array `["Spring", "Summer"]`; stored as JSON string in SQLite
- **IDs**: `seed-{timestamp}-{random}` for seeds; `YYMMDD-{rowid}-{n}` for sowing events; `task-{timestamp}-{random}` for tasks

## File Organization

```
src/
  pages/          # One file per route/page
  App.jsx         # Router + nav shell
  App.css         # App shell layout only
  index.css       # Global styles + CSS variables
  main.jsx        # React entry point

server/
  index.js        # All Express routes
  db.js           # DB connection + schema
  garden.db       # SQLite data file
```

## Git Conventions

- Commit messages are plain English descriptions (no enforced type prefix)
- Commit when a feature is working, not per-file

## Import Order

1. React and React hooks (`import { useState } from 'react'`)
2. react-router-dom
3. Local components (`import SeedForm from './SeedForm'`)
4. CSS files
