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

const PORT = 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
