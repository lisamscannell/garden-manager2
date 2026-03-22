import { useState } from 'react'
import SeedForm from './SeedForm'

function weeksUntilLastFrost() {
  const stored = localStorage.getItem('lastFrostDate') // MM-DD
  if (!stored) return null
  const today = new Date()
  const thisYear = today.getFullYear()
  let frost = new Date(`${thisYear}-${stored}`)
  if (frost < today) frost.setFullYear(thisYear + 1)
  const days = (frost - today) / (1000 * 60 * 60 * 24)
  return days / 7
}

function formatFrostDate() {
  const stored = localStorage.getItem('lastFrostDate')
  if (!stored) return null
  const [m, d] = stored.split('-')
  return new Date(2000, Number(m) - 1, Number(d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function DailyTasks() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingSeed, setEditingSeed] = useState(null)

  async function handleSeedSave(seed) {
    const updated = await fetch(`/api/seeds/${seed.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seed),
    }).then(r => r.json())
    setResults(prev => prev.map(s => s.id === updated.id ? updated : s))
    setEditingSeed(null)
  }

  if (editingSeed) {
    return <SeedForm
      initialData={editingSeed}
      onSave={handleSeedSave}
      onCancel={() => setEditingSeed(null)}
    />
  }

  async function findNeedsStarting() {
    const weeks = weeksUntilLastFrost()
    if (weeks === null) {
      setError('No last frost date set. Go to the Frost tab and save your dates first.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const [seeds, events] = await Promise.all([
        fetch('/api/seeds').then(r => r.json()),
        fetch('/api/sowing-events').then(r => r.json()),
      ])

      // Build a set of seedIds that already have a start this calendar year
      const thisYear = new Date().getFullYear().toString()
      const startedThisYear = new Set(
        events
          .filter(e => e.actualSowDate?.startsWith(thisYear))
          .map(e => e.seedId)
      )

      // Seeds that should be started: lead weeks > weeks remaining, not started yet this year
      const due = seeds.filter(s =>
        s.springSowLeadWeeks &&
        Number(s.springSowLeadWeeks) > weeks &&
        !startedThisYear.has(s.id) &&
        s.status !== 'Gone'
      )

      // Sort by most overdue first (highest lead weeks first)
      due.sort((a, b) => Number(b.springSowLeadWeeks) - Number(a.springSowLeadWeeks))

      setResults(due)
    } catch (err) {
      setError(`Could not load data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const weeks = weeksUntilLastFrost()
  const frostLabel = formatFrostDate()
  const weeksDisplay = weeks !== null ? Math.round(weeks * 10) / 10 : null

  return (
    <div>
      <h1 className="page-title">Daily Tasks</h1>

      {/* ── What needs starting? ── */}
      <div className="task-section">
        <div className="task-section-header">
          <div>
            <h2 className="task-section-title">What needs starting?</h2>
            {frostLabel && weeksDisplay !== null && (
              <p className="task-section-hint">
                Last frost: {frostLabel} · {weeksDisplay} weeks away
              </p>
            )}
          </div>
          <button className="save-btn save-btn-sm" onClick={findNeedsStarting} disabled={loading}>
            {loading ? 'Checking…' : 'Check now'}
          </button>
        </div>

        {error && <p className="import-error">{error}</p>}

        {results === null && !error && (
          <p className="task-empty">Tap "Check now" to see which seeds are due for starting.</p>
        )}

        {results !== null && results.length === 0 && (
          <p className="task-empty">All seeds with spring sow dates are either started or not yet due.</p>
        )}

        {results !== null && results.length > 0 && (
          <div className="seed-list">
            {results.map(seed => {
              const leadWeeks = Number(seed.springSowLeadWeeks)
              const weeksLate = weeks !== null ? Math.round((leadWeeks - weeks) * 10) / 10 : null
              return (
                <div key={seed.id} className="seed-card needs-starting-card"
                  onClick={() => setEditingSeed(seed)} style={{ cursor: 'pointer' }}>
                  <div className="seed-card-main">
                    <span className="seed-variety">{seed.variety}</span>
                    <span className="seed-plant-type">{seed.plantType}</span>
                  </div>
                  <div className="starts-meta">
                    <span className="starts-date">{leadWeeks}w lead</span>
                    {weeksLate !== null && weeksLate > 0 && (
                      <span className="badge badge-orange">{weeksLate}w overdue</span>
                    )}
                    {weeksLate !== null && weeksLate <= 0 && (
                      <span className="badge badge-green">Due now</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyTasks
