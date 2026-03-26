import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import db from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())

// seasons is stored as a JSON string in SQLite; convert in/out
function toRow(seed) {
  return { ...seed, seasons: JSON.stringify(seed.seasons ?? []) }
}
function fromRow(row) {
  if (!row) return null
  return { ...row, seasons: JSON.parse(row.seasons ?? '[]') }
}

// GET all seeds
app.get('/api/seeds', (req, res) => {
  const rows = db.prepare('SELECT * FROM seeds ORDER BY plantType, variety').all()
  res.json(rows.map(fromRow))
})

// POST a new seed
app.post('/api/seeds', (req, res) => {
  const seed = req.body
  db.prepare(`
    INSERT INTO seeds (
      id, plantType, category, seasons, variety, status, dateAdded, vendor,
      itemNumber, link, maturityDays, harvestType, springSowLeadWeeks,
      springTransplantLeadWeeks, fallSowLeadWeeks, preferredSowingType,
      successionWeeks, anticipatedHeight, recommendedSpacing, hrsSun, notes
    ) VALUES (
      @id, @plantType, @category, @seasons, @variety, @status, @dateAdded, @vendor,
      @itemNumber, @link, @maturityDays, @harvestType, @springSowLeadWeeks,
      @springTransplantLeadWeeks, @fallSowLeadWeeks, @preferredSowingType,
      @successionWeeks, @anticipatedHeight, @recommendedSpacing, @hrsSun, @notes
    )
  `).run(toRow(seed))
  res.json(fromRow(db.prepare('SELECT * FROM seeds WHERE id = ?').get(seed.id)))
})

// PUT (update) an existing seed
app.put('/api/seeds/:id', (req, res) => {
  const seed = { ...req.body, id: req.params.id }
  db.prepare(`
    UPDATE seeds SET
      plantType = @plantType, category = @category, seasons = @seasons,
      variety = @variety, status = @status, dateAdded = @dateAdded, vendor = @vendor,
      itemNumber = @itemNumber, link = @link, maturityDays = @maturityDays,
      harvestType = @harvestType, springSowLeadWeeks = @springSowLeadWeeks,
      springTransplantLeadWeeks = @springTransplantLeadWeeks,
      fallSowLeadWeeks = @fallSowLeadWeeks, preferredSowingType = @preferredSowingType,
      successionWeeks = @successionWeeks, anticipatedHeight = @anticipatedHeight,
      recommendedSpacing = @recommendedSpacing, hrsSun = @hrsSun, notes = @notes
    WHERE id = @id
  `).run(toRow(seed))
  res.json(fromRow(db.prepare('SELECT * FROM seeds WHERE id = ?').get(seed.id)))
})

// DELETE a seed
app.delete('/api/seeds/:id', (req, res) => {
  db.prepare('DELETE FROM seeds WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Sowing Events ─────────────────────────────────────────────────────────────

// Generate event ID: YYMMDD-{seed rowid}-{count within year for this seed}
function generateEventId(seedId, actualSowDate, plannedSowDate) {
  const d = actualSowDate || plannedSowDate || new Date().toISOString().split('T')[0]
  const datePart = d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10)
  const seedRowId = db.prepare('SELECT rowid FROM seeds WHERE id = ?').get(seedId)?.rowid ?? seedId
  const year = d.slice(0, 4)
  const { n } = db.prepare(
    `SELECT COUNT(*) as n FROM sowing_events WHERE seedId = ?
     AND COALESCE(actualSowDate, plannedSowDate) BETWEEN ? AND ?`
  ).get(seedId, `${year}-01-01`, `${year}-12-31`)
  return `${datePart}-${seedRowId}-${n + 1}`
}

// GET all sowing events (joined with seed variety for display)
app.get('/api/sowing-events', (req, res) => {
  const rows = db.prepare(`
    SELECT se.*, s.variety, s.plantType
    FROM sowing_events se
    JOIN seeds s ON se.seedId = s.id
    ORDER BY se.actualSowDate DESC
  `).all()
  res.json(rows)
})

// GET sowing events for a specific seed
app.get('/api/sowing-events/seed/:seedId', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM sowing_events WHERE seedId = ? ORDER BY actualSowDate DESC'
  ).all(req.params.seedId)
  res.json(rows)
})

// POST a new sowing event
app.post('/api/sowing-events', (req, res) => {
  const evt = req.body
  const id = generateEventId(evt.seedId, evt.actualSowDate, evt.plannedSowDate)
  db.prepare(`
    INSERT INTO sowing_events
      (id, seedId, plannedSowDate, actualSowDate, emergenceDate, transplantDate,
       sowingMethod, sowingContainer, sowingStatus, notes)
    VALUES
      (@id, @seedId, @plannedSowDate, @actualSowDate, @emergenceDate, @transplantDate,
       @sowingMethod, @sowingContainer, @sowingStatus, @notes)
  `).run({ ...evt, id })
  res.json(db.prepare('SELECT * FROM sowing_events WHERE id = ?').get(id))
})

// PUT (update) a sowing event — id never changes after creation
app.put('/api/sowing-events/:id', (req, res) => {
  const evt = { ...req.body, id: req.params.id }
  db.prepare(`
    UPDATE sowing_events SET
      plannedSowDate = @plannedSowDate, actualSowDate = @actualSowDate,
      emergenceDate = @emergenceDate, transplantDate = @transplantDate,
      sowingMethod = @sowingMethod, sowingContainer = @sowingContainer,
      sowingStatus = @sowingStatus, notes = @notes
    WHERE id = @id
  `).run(evt)
  res.json(db.prepare('SELECT * FROM sowing_events WHERE id = ?').get(evt.id))
})

// ── Settings ───────────────────────────────────────────────────────────────────

// GET all settings as a flat object { key: value, ... }
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const obj = Object.fromEntries(rows.map(r => [r.key, r.value]))
  res.json(obj)
})

// PUT one or more settings — body is { key: value, ... }
app.put('/api/settings', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value = @value')
  const saveAll = db.transaction(entries => {
    for (const [key, value] of entries) upsert.run({ key, value })
  })
  saveAll(Object.entries(req.body))
  res.json({ ok: true })
})

// ── Tasks ──────────────────────────────────────────────────────────────────────

// GET all pending tasks, joined with seed info for display
app.get('/api/tasks', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, s.variety, s.plantType
    FROM tasks t
    JOIN sowing_events se ON t.sowingEventId = se.id
    JOIN seeds s ON se.seedId = s.id
    WHERE t.status = 'Pending'
    ORDER BY t.dueDate ASC
  `).all()
  res.json(rows)
})

// GET tasks for a specific sowing event
app.get('/api/tasks/sowing/:sowingEventId', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM tasks WHERE sowingEventId = ? ORDER BY dueDate ASC'
  ).all(req.params.sowingEventId)
  res.json(rows)
})

// POST a new task
app.post('/api/tasks', (req, res) => {
  const task = req.body
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  db.prepare(`
    INSERT INTO tasks (id, sowingEventId, category, description, notes, dueDate, status)
    VALUES (@id, @sowingEventId, @category, @description, @notes, @dueDate, @status)
  `).run({ ...task, id, status: task.status ?? 'Pending' })
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id))
})

// PUT (update) a task
app.put('/api/tasks/:id', (req, res) => {
  const task = { ...req.body, id: req.params.id }
  db.prepare(`
    UPDATE tasks SET
      category = @category, description = @description,
      notes = @notes, dueDate = @dueDate, status = @status
    WHERE id = @id
  `).run(task)
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id))
})

// In production, serve the built React app and handle SPA routing
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
