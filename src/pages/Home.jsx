import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Helpers ──────────────────────────────────────────────────────────────────

function weeksUntilLastFrost() {
  const stored = localStorage.getItem('lastFrostDate')
  if (!stored) return null
  const today = new Date()
  const thisYear = today.getFullYear()
  let frost = new Date(`${thisYear}-${stored}`)
  if (frost < today) frost.setFullYear(thisYear + 1)
  return (frost - today) / (1000 * 60 * 60 * 24 * 7)
}

function formatFrostDate() {
  const stored = localStorage.getItem('lastFrostDate')
  if (!stored) return null
  const [m, d] = stored.split('-')
  return new Date(2000, Number(m) - 1, Number(d))
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

function calcAvgDaysBySeed(events) {
  const bySeed = {}
  for (const e of events) {
    if (!e.actualSowDate || !e.emergenceDate) continue
    if (!bySeed[e.seedId]) bySeed[e.seedId] = { total: 0, count: 0 }
    const days = Math.round(
      (new Date(e.emergenceDate) - new Date(e.actualSowDate)) / (1000 * 60 * 60 * 24)
    )
    bySeed[e.seedId].total += days
    bySeed[e.seedId].count += 1
  }
  const result = {}
  for (const [seedId, { total, count }] of Object.entries(bySeed)) {
    result[seedId] = Math.round(total / count)
  }
  return result
}

const TERMINAL = ['Failed', 'Cancelled', 'Completed']

// ── Component ─────────────────────────────────────────────────────────────────

function Home() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [seeds, setSeeds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/sowing-events').then(r => r.json()),
      fetch('/api/seeds').then(r => r.json()),
    ]).then(([t, e, s]) => {
      setTasks(t)
      setEvents(e)
      setSeeds(s)
      setLoading(false)
    })
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const thisYearStr = today.getFullYear().toString()
  const currentYear = today.getFullYear()
  const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7)
  const in7DaysStr = in7Days.toISOString().split('T')[0]

  // ── Garden Pulse ─────────────────────────────────────────────────────────────
  const weeksToFrost = weeksUntilLastFrost()
  const daysToFrost = weeksToFrost !== null ? Math.round(weeksToFrost * 7) : null
  const frostLabel = formatFrostDate()
  const activeStartsCount = events.filter(e => e.sowingStatus === 'Active').length

  // ── Action Needed ─────────────────────────────────────────────────────────────

  // 1. Overdue tasks
  const overdueTasks = tasks.filter(t => t.dueDate < todayStr)

  // 2. Planned starts where planned date has passed but seed hasn't been sown
  const overdueStarts = events.filter(e =>
    e.plannedSowDate &&
    e.plannedSowDate < todayStr &&
    !e.actualSowDate &&
    !TERMINAL.includes(e.sowingStatus)
  )

  // 3. Seeds overdue for starting (spring/summer, simplified)
  let overdueToStart = []
  if (weeksToFrost !== null) {
    const seededThisYear = new Set()
    events.forEach(e => {
      const dateStr = e.actualSowDate || e.plannedSowDate
      const isOpenEvent = !TERMINAL.includes(e.sowingStatus)
      const isActiveOrAnticipated = ['Active', 'Anticipated'].includes(e.sowingStatus)
      if ((dateStr?.startsWith(thisYearStr) && isOpenEvent) || isActiveOrAnticipated) {
        seededThisYear.add(e.seedId)
      }
    })
    overdueToStart = seeds.filter(s => {
      if (!s.springSowLeadWeeks) return false
      if (s.status === 'Gone') return false
      if (s.skipYear === currentYear) return false
      if (seededThisYear.has(s.id)) return false
      const seasons = s.seasons ?? []
      if (!seasons.includes('Spring') && !seasons.includes('Summer')) return false
      return Number(s.springSowLeadWeeks) > weeksToFrost
    })
  }

  // ── Watch This Week ───────────────────────────────────────────────────────────

  // 1. Starts expected to emerge in the next 7 days
  const avgDaysBySeed = calcAvgDaysBySeed(events)
  const emergenceSoon = events
    .filter(e => {
      if (e.sowingStatus !== 'Active' || e.emergenceDate || !e.actualSowDate) return false
      const avg = avgDaysBySeed[e.seedId]
      if (!avg) return false
      const expected = new Date(e.actualSowDate)
      expected.setDate(expected.getDate() + avg)
      const expectedStr = expected.toISOString().split('T')[0]
      return expectedStr >= todayStr && expectedStr <= in7DaysStr
    })
    .map(e => {
      const avg = avgDaysBySeed[e.seedId]
      const expected = new Date(e.actualSowDate)
      expected.setDate(expected.getDate() + avg)
      return { ...e, expectedEmergenceDate: expected.toISOString().split('T')[0] }
    })
    .sort((a, b) => a.expectedEmergenceDate.localeCompare(b.expectedEmergenceDate))

  // 2. Upcoming transplants in the next 7 days
  const lastFrostStored = localStorage.getItem('lastFrostDate')
  let upcomingTransplants = []
  if (lastFrostStored) {
    const frostYear = today.getFullYear()
    let frost = new Date(`${frostYear}-${lastFrostStored}`)
    if (frost < today) frost.setFullYear(frostYear + 1)
    const seedMap = Object.fromEntries(seeds.map(s => [s.id, s]))
    const lower = new Date(today); lower.setDate(lower.getDate() - 3)
    const lowerStr = lower.toISOString().split('T')[0]
    upcomingTransplants = events
      .filter(e => {
        if (e.sowingMethod === 'Direct Sow') return false
        if (e.sowingStatus !== 'Active') return false
        if (e.transplantDate) return false
        const seed = seedMap[e.seedId]
        if (!seed?.springTransplantLeadWeeks) return false
        const td = new Date(frost)
        td.setDate(td.getDate() - Number(seed.springTransplantLeadWeeks) * 7)
        const tdStr = td.toISOString().split('T')[0]
        return tdStr >= lowerStr && tdStr <= in7DaysStr
      })
      .map(e => {
        const seed = seedMap[e.seedId]
        const td = new Date(frost)
        td.setDate(td.getDate() - Number(seed.springTransplantLeadWeeks) * 7)
        return { ...e, anticipatedTransplantDate: td.toISOString().split('T')[0] }
      })
      .sort((a, b) => a.anticipatedTransplantDate.localeCompare(b.anticipatedTransplantDate))
  }

  // 3. Edible plants in ground with expected first harvest in the next 7 days
  const harvestSoon = events
    .filter(e => {
      if (e.category !== 'Edible') return false
      if (!e.transplantDate || !e.maturityDays) return false
      if (e.sowingStatus !== 'Transplanted' && !(e.sowingStatus === 'Active' && e.transplantDate)) return false
      const d = new Date(e.transplantDate)
      d.setDate(d.getDate() + Number(e.maturityDays))
      const harvestStr = d.toISOString().split('T')[0]
      return harvestStr >= todayStr && harvestStr <= in7DaysStr
    })
    .map(e => {
      const d = new Date(e.transplantDate)
      d.setDate(d.getDate() + Number(e.maturityDays))
      return { ...e, expectedHarvestDate: d.toISOString().split('T')[0] }
    })
    .sort((a, b) => a.expectedHarvestDate.localeCompare(b.expectedHarvestDate))

  const hasActions = overdueTasks.length > 0 || overdueStarts.length > 0 || overdueToStart.length > 0
  const hasWatchItems = emergenceSoon.length > 0 || upcomingTransplants.length > 0 || harvestSoon.length > 0

  if (loading) return <p className="task-empty">Loading…</p>

  return (
    <div className="dashboard">

      {/* ── Garden Pulse ── */}
      <div className="pulse-row">
        <div className="pulse-chip">
          <span className="pulse-value">
            {daysToFrost !== null ? Math.abs(daysToFrost) : '—'}
          </span>
          <span className="pulse-label">
            {daysToFrost === null && 'frost date not set'}
            {daysToFrost !== null && daysToFrost >= 0 && `days to last frost${frostLabel ? ` (${frostLabel})` : ''}`}
            {daysToFrost !== null && daysToFrost < 0 && 'days past last frost'}
          </span>
        </div>
        <div className="pulse-chip">
          <span className="pulse-value">{activeStartsCount}</span>
          <span className="pulse-label">active starts</span>
        </div>
        <div className="pulse-chip">
          <span className="pulse-value">{tasks.length}</span>
          <span className="pulse-label">pending tasks</span>
        </div>
      </div>

      {/* ── Action Needed ── */}
      {hasActions && (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Action Needed</h2>

          {overdueTasks.map(task => (
            <div key={task.id} className="dash-card dash-card-urgent" onClick={() => navigate('/tasks')}>
              <div className="dash-card-main">
                <span className="dash-card-label">
                  {task.category === 'Other' ? task.description : task.category}
                </span>
                <span className="dash-card-sub">{task.variety} · due {formatDate(task.dueDate)}</span>
              </div>
              <span className="badge badge-orange">Overdue task</span>
            </div>
          ))}

          {overdueStarts.map(evt => (
            <div key={evt.id} className="dash-card dash-card-urgent" onClick={() => navigate('/starts')}>
              <div className="dash-card-main">
                <span className="dash-card-label">{evt.variety}</span>
                <span className="dash-card-sub">{evt.plantType} · planned {formatDate(evt.plannedSowDate)}</span>
              </div>
              <span className="badge badge-orange">Overdue start</span>
            </div>
          ))}

          {overdueToStart.length > 0 && (
            <div className="dash-card dash-card-urgent" onClick={() => navigate('/tasks')}>
              <div className="dash-card-main">
                <span className="dash-card-label">
                  {overdueToStart.length} seed{overdueToStart.length !== 1 ? 's' : ''} overdue to start
                </span>
                <span className="dash-card-sub">
                  {overdueToStart.slice(0, 3).map(s => s.variety).join(', ')}
                  {overdueToStart.length > 3 ? ` +${overdueToStart.length - 3} more` : ''}
                </span>
              </div>
              <span className="badge badge-orange">Tasks →</span>
            </div>
          )}
        </section>
      )}

      {/* ── Watch This Week ── */}
      {hasWatchItems && (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Watch This Week</h2>

          {emergenceSoon.map(evt => (
            <div key={`emerge-${evt.id}`} className="dash-card" onClick={() => navigate('/starts')}>
              <div className="dash-card-main">
                <span className="dash-card-label">{evt.variety}</span>
                <span className="dash-card-sub">
                  {evt.plantType} · expected {formatDate(evt.expectedEmergenceDate)}
                </span>
              </div>
              <span className="badge badge-green">Emerging soon</span>
            </div>
          ))}

          {upcomingTransplants.map(evt => (
            <div key={`transplant-${evt.id}`} className="dash-card" onClick={() => navigate('/starts')}>
              <div className="dash-card-main">
                <span className="dash-card-label">{evt.variety}</span>
                <span className="dash-card-sub">
                  {evt.plantType} · transplant {formatDate(evt.anticipatedTransplantDate)}
                </span>
              </div>
              <span className="badge badge-sky">Transplant due</span>
            </div>
          ))}

          {harvestSoon.map(evt => (
            <div key={`harvest-${evt.id}`} className="dash-card" onClick={() => navigate('/starts')}>
              <div className="dash-card-main">
                <span className="dash-card-label">{evt.variety}</span>
                <span className="dash-card-sub">
                  {evt.plantType} · first harvest {formatDate(evt.expectedHarvestDate)}
                </span>
              </div>
              <span className="badge badge-sprout">Harvest soon</span>
            </div>
          ))}
        </section>
      )}

      {/* ── All clear ── */}
      {!hasActions && !hasWatchItems && (
        <div className="dashboard-all-clear">
          <p className="dashboard-all-clear-title">All caught up!</p>
          <p className="dashboard-all-clear-sub">Nothing urgent for today. Check back tomorrow.</p>
        </div>
      )}

    </div>
  )
}

export default Home
