import { useEffect, useRef, useState } from 'react'
import SeedForm from './SeedForm'
import SowingForm from './SowingForm'


// ── CSV helpers ──────────────────────────────────────────────────────────────

// Column headers used in the template and expected on import (order doesn't matter)
const CSV_HEADERS = [
  'Plant Type', 'Category', 'Season', 'Variety', 'Status', 'Date Added',
  'Vendor', 'Item #', 'Link', 'Maturity Days', 'Harvest Type',
  'Spring Sow Lead Weeks', 'Spring Transplant Lead Weeks', 'Fall Sow Lead Weeks',
  'Preferred Sowing Type', 'Succession Weeks', 'Anticipated Height',
  'Recommended Spacing', 'Hrs Sun', 'Notes',
]

// Map CSV column name → internal field name
const HEADER_TO_FIELD = {
  'plant type':                    'plantType',
  'category':                      'category',
  'season':                        'seasons',        // stored as array
  'variety':                       'variety',
  'status':                        'status',
  'date added':                    'dateAdded',
  'vendor':                        'vendor',
  'item #':                        'itemNumber',
  'link':                          'link',
  'maturity days':                 'maturityDays',
  'harvest type':                  'harvestType',
  'spring sow lead weeks':         'springSowLeadWeeks',
  'spring transplant lead weeks':  'springTransplantLeadWeeks',
  'fall sow lead weeks':           'fallSowLeadWeeks',
  'preferred sowing type':         'preferredSowingType',
  'succession weeks':              'successionWeeks',
  'anticipated height':            'anticipatedHeight',
  'recommended spacing':           'recommendedSpacing',
  'hrs sun':                       'hrsSun',
  'notes':                         'notes',
}

// Parse a CSV string into an array of row objects keyed by header
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  // Split one CSV line, respecting double-quoted fields
  function splitLine(line) {
    const cells = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }  // escaped quote
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cells.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur)
    return cells.map(c => c.trim())
  }

  const headers = splitLine(lines[0]).map(h => h.toLowerCase())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cells = splitLine(lines[i])

    // Skip completely empty rows
    if (cells.every(c => !c)) continue

    const today = new Date().toISOString().split('T')[0]
    const seed = {
      id: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`,
      plantType: '', category: '', seasons: [], variety: '',
      status: 'In Stock', dateAdded: today, vendor: '',
      itemNumber: '', link: '', maturityDays: '', harvestType: '',
      springSowLeadWeeks: '', springTransplantLeadWeeks: '', fallSowLeadWeeks: '',
      preferredSowingType: '', successionWeeks: '', anticipatedHeight: '',
      recommendedSpacing: '', hrsSun: '', notes: '',
    }

    headers.forEach((header, idx) => {
      const field = HEADER_TO_FIELD[header]
      if (!field) return
      const val = cells[idx] ?? ''
      if (field === 'seasons') {
        seed.seasons = val ? val.split(';').map(s => s.trim()).filter(Boolean) : []
      } else {
        seed[field] = val
      }
    })

    // Skip rows missing all required fields
    if (!seed.plantType && !seed.variety && !seed.vendor) continue

    rows.push(seed)
  }

  return rows
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',')
  const example = [
    'Tomatoes', 'Edible', 'Summer', 'Cherokee Purple', 'In Stock',
    new Date().toISOString().split('T')[0],
    'Baker Creek', 'TOM-001', '', '80', 'Recurring', '8', '2', '',
    'Indoor Trays', '3', '4-6 ft', '24 in', '8', 'Indeterminate heirloom',
  ].join(',')
  const csv = `${header}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'seed-inventory-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ────────────────────────────────────────────────────────────────

function SeedInventory() {
  const [seeds, setSeeds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSeed, setEditingSeed] = useState(null)
  const [sowingForSeed, setSowingForSeed] = useState(null)
  const [importError, setImportError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [category, setCategory] = useState('Edible')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/seeds').then(r => r.json()).then(setSeeds)
  }, [])

  async function handleSave(seed) {
    if (editingSeed) {
      const updated = await fetch(`/api/seeds/${seed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed),
      }).then(r => r.json())
      setSeeds(prev => prev.map(s => s.id === updated.id ? updated : s))
      setEditingSeed(null)
    } else {
      const created = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed),
      }).then(r => r.json())
      setSeeds(prev => [...prev, created])
      setShowForm(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this seed packet?')) return
    await fetch(`/api/seeds/${id}`, { method: 'DELETE' })
    setSeeds(prev => prev.filter(s => s.id !== id))
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportError(null)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const rows = parseCSV(evt.target.result)
      if (rows.length === 0) {
        setImportError('No valid rows found. Make sure your CSV uses the template headers.')
        return
      }
      const created = await Promise.all(rows.map(row =>
        fetch('/api/seeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        }).then(r => r.json())
      ))
      setSeeds(prev => [...prev, ...created])
      alert(`Imported ${created.length} seed packet${created.length !== 1 ? 's' : ''}.`)
    }
    reader.readAsText(file)

    // Reset so the same file can be re-imported after a fix
    e.target.value = ''
  }

  if (sowingForSeed) {
    return <SowingForm
      seed={sowingForSeed}
      onSave={() => { setSowingForSeed(null); setEditingSeed(sowingForSeed) }}
      onCancel={() => { setSowingForSeed(null); setEditingSeed(sowingForSeed) }}
    />
  }

  if (editingSeed) {
    return <SeedForm
      onSave={handleSave}
      onCancel={() => setEditingSeed(null)}
      initialData={editingSeed}
      onNewSowingEvent={seed => { setEditingSeed(null); setSowingForSeed(seed) }}
    />
  }

  if (showForm) {
    return <SeedForm onSave={handleSave} onCancel={() => setShowForm(false)} />
  }

  return (
    <div>
      <div className="inventory-header">
        <h1 className="page-title">Seed Inventory</h1>
        <button className="save-btn save-btn-sm" onClick={() => setShowForm(true)}>+ Add</button>
        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <div className="category-toggle">
        {['Edible', 'Flower', 'Foliage'].map(cat => (
          <button
            key={cat}
            className={`category-btn${category === cat ? ' category-btn-active' : ''}`}
            onClick={() => setCategory(cat)}
          >{cat}</button>
        ))}
      </div>

      {importError && <p className="import-error">{importError}</p>}

      {seeds.length === 0 ? (
        <div className="empty-state">
          <p>No seed packets yet.</p>
          <p>Add one manually, or download the CSV template to bulk import.</p>
        </div>
      ) : (
        <div className="seed-list">
          {seeds
            .filter(s => s.category === category)
            .filter(s => showAll || s.status !== 'Gone')
            .sort((a, b) => a.plantType.localeCompare(b.plantType) || a.variety.localeCompare(b.variety))
            .map(seed => (
            <div key={seed.id} className="seed-card">
              <div className="seed-card-main" onClick={() => setEditingSeed(seed)}>
                <span className="seed-variety">{seed.variety}</span>
                <span className="seed-plant-type">{seed.plantType}</span>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(seed.id)} title="Remove packet">✕</button>
            </div>
          ))}
        </div>
      )}

      {!showAll && seeds.some(s => s.category === category && s.status === 'Gone') && (
        <p className="show-all-toggle">
          <button className="ghost-btn" onClick={() => setShowAll(true)}>
            Show Gone packets ({seeds.filter(s => s.category === category && s.status === 'Gone').length})
          </button>
        </p>
      )}
      {showAll && (
        <p className="show-all-toggle">
          <button className="ghost-btn" onClick={() => setShowAll(false)}>Hide Gone packets</button>
        </p>
      )}

      <div className="bottom-actions">
        <button className="ghost-btn" onClick={downloadTemplate}>Download Template</button>
        <button className="ghost-btn" onClick={() => fileInputRef.current.click()}>Import CSV</button>
      </div>
    </div>
  )
}

export default SeedInventory
