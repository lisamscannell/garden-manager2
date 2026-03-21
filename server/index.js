import express from 'express'
import cors from 'cors'
import db from './db.js'

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
function generateEventId(seedId, actualSowDate) {
  const d = actualSowDate  // YYYY-MM-DD
  const datePart = d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10)
  const seedRowId = db.prepare('SELECT rowid FROM seeds WHERE id = ?').get(seedId)?.rowid ?? seedId
  const year = d.slice(0, 4)
  const { n } = db.prepare(
    `SELECT COUNT(*) as n FROM sowing_events
     WHERE seedId = ? AND actualSowDate BETWEEN ? AND ?`
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
  const id = generateEventId(evt.seedId, evt.actualSowDate)
  db.prepare(`
    INSERT INTO sowing_events
      (id, seedId, actualSowDate, emergenceDate, transplantDate,
       sowingMethod, sowingContainer, sowingStatus, notes)
    VALUES
      (@id, @seedId, @actualSowDate, @emergenceDate, @transplantDate,
       @sowingMethod, @sowingContainer, @sowingStatus, @notes)
  `).run({ ...evt, id })
  res.json(db.prepare('SELECT * FROM sowing_events WHERE id = ?').get(id))
})

// PUT (update) a sowing event — id never changes after creation
app.put('/api/sowing-events/:id', (req, res) => {
  const evt = { ...req.body, id: req.params.id }
  db.prepare(`
    UPDATE sowing_events SET
      actualSowDate = @actualSowDate, emergenceDate = @emergenceDate,
      transplantDate = @transplantDate, sowingMethod = @sowingMethod,
      sowingContainer = @sowingContainer, sowingStatus = @sowingStatus,
      notes = @notes
    WHERE id = @id
  `).run(evt)
  res.json(db.prepare('SELECT * FROM sowing_events WHERE id = ?').get(evt.id))
})

const PORT = 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
