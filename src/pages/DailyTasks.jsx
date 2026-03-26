import { useEffect, useState } from 'react'
import SeedForm from './SeedForm'
import SowingForm from './SowingForm'
import TaskForm from './TaskForm'

function weeksUntilLastFrost() {
  const stored = localStorage.getItem('lastFrostDate') // MM-DD
  if (!stored) return null
  const today = new Date()
  const thisYear = today.getFullYear()
  let frost = new Date(`${thisYear}-${stored}`)
  if (frost < today) frost.setFullYear(thisYear + 1) // rolls to next spring if passed
  return (frost - today) / (1000 * 60 * 60 * 24 * 7)
}

function formatFrostDate() {
  const stored = localStorage.getItem('lastFrostDate')
  if (!stored) return null
  const [m, d] = stored.split('-')
  return new Date(2000, Number(m) - 1, Number(d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

function plannedThisWeek(events) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 3)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  return events.filter(e => {
    if (!e.plannedSowDate || e.actualSowDate) return false
    if (['Failed', 'Cancelled', 'Completed'].includes(e.sowingStatus)) return false
    return e.plannedSowDate <= cutoffStr
  }).sort((a, b) => a.plannedSowDate.localeCompare(b.plannedSowDate))
}

function calcUpcomingTransplants(events, seeds) {
  const frostStored = localStorage.getItem('lastFrostDate')
  if (!frostStored) return null

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const lower = new Date(todayDate)
  lower.setDate(lower.getDate() - 3)
  const upper = new Date(todayDate)
  upper.setDate(upper.getDate() + 7)
  const lowerStr = lower.toISOString().split('T')[0]
  const upperStr = upper.toISOString().split('T')[0]

  const thisYear = todayDate.getFullYear()
  let frost = new Date(`${thisYear}-${frostStored}`)
  if (frost < todayDate) frost.setFullYear(thisYear + 1)

  const seedMap = Object.fromEntries(seeds.map(s => [s.id, s]))

  const getTransplantDate = (e) => {
    const seed = seedMap[e.seedId]
    if (!seed?.springTransplantLeadWeeks) return null
    const d = new Date(frost)
    d.setDate(d.getDate() - Number(seed.springTransplantLeadWeeks) * 7)
    return d.toISOString().split('T')[0]
  }

  return events
    .filter(e => {
      if (e.sowingMethod === 'Direct Sow') return false
      if (e.sowingStatus !== 'Active') return false
      if (e.transplantDate) return false
      const transplantStr = getTransplantDate(e)
      if (!transplantStr) return false
      return transplantStr >= lowerStr && transplantStr <= upperStr
    })
    .map(e => ({ ...e, anticipatedTransplantDate: getTransplantDate(e) }))
    .sort((a, b) => a.anticipatedTransplantDate.localeCompare(b.anticipatedTransplantDate))
}

function DailyTasks() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingSeed, setEditingSeed] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [gardenTasks, setGardenTasks] = useState([])
  const [editingTask, setEditingTask] = useState(null)
  const [upcomingTransplants, setUpcomingTransplants] = useState([])

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setGardenTasks)

    Promise.all([
      fetch('/api/sowing-events').then(r => r.json()),
      fetch('/api/seeds').then(r => r.json()),
    ]).then(([events, seeds]) => {
      setUpcomingEvents(plannedThisWeek(events))
      const transplants = calcUpcomingTransplants(events, seeds)
      if (transplants !== null) setUpcomingTransplants(transplants)
    })
  }, [])

  async function handleSeedSave(seed) {
    const updated = await fetch(`/api/seeds/${seed.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seed),
    }).then(r => r.json())
    setResults(prev => prev.map(s => s.id === updated.id ? updated : s))
    setEditingSeed(null)
  }

  function handleEventSave(updated) {
    setUpcomingEvents(prev =>
      plannedThisWeek(prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
    )
    setEditingEvent(null)
  }

  function handleTaskSave(saved) {
    if (saved.status !== 'Pending') {
      setGardenTasks(prev => prev.filter(t => t.id !== saved.id))
    } else {
      setGardenTasks(prev => prev.map(t => t.id === saved.id ? { ...t, ...saved } : t))
    }
    setEditingTask(null)
  }

  if (editingSeed) {
    return <SeedForm
      initialData={editingSeed}
      onSave={handleSeedSave}
      onCancel={() => setEditingSeed(null)}
    />
  }

  if (editingEvent) {
    return <SowingForm
      initialData={editingEvent}
      onSave={handleEventSave}
      onCancel={() => setEditingEvent(null)}
    />
  }

  if (editingTask) {
    const sowingEvent = {
      id: editingTask.sowingEventId,
      variety: editingTask.variety,
      plantType: editingTask.plantType,
    }
    return <TaskForm
      sowingEvent={sowingEvent}
      initialData={editingTask}
      onSave={handleTaskSave}
      onCancel={() => setEditingTask(null)}
    />
  }

  async function findNeedsStarting() {
    const weeksToLastFrost = weeksUntilLastFrost()
    if (weeksToLastFrost === null) {
      setError('No last frost date set. Go to My Garden and save your dates first.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const [seeds, events] = await Promise.all([
        fetch('/api/seeds').then(r => r.json()),
        fetch('/api/sowing-events').then(r => r.json()),
      ])

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const thisYearStr = today.getFullYear().toString()

      // Build tracking sets from this year's sowing events:
      //   seededThisYear     — any active event (planned OR actual) → excludes from first-start checks
      //   fallSeededThisYear — active events after July 1 → excludes from fall first-start checks
      //   latestSowBySeed    — most recent ACTUAL sow date → used for succession interval only
      const seededThisYear = new Set()
      const fallSeededThisYear = new Set()
      const latestSowBySeed = {}

      events.forEach(e => {
        const dateStr = e.actualSowDate || e.plannedSowDate
        const isActive = !['Failed', 'Cancelled', 'Completed'].includes(e.sowingStatus)

        if (dateStr?.startsWith(thisYearStr) && isActive) {
          seededThisYear.add(e.seedId)
          if (dateStr >= `${thisYearStr}-07-01`) fallSeededThisYear.add(e.seedId)
        }

        if (e.actualSowDate?.startsWith(thisYearStr)) {
          if (!latestSowBySeed[e.seedId] || e.actualSowDate > latestSowBySeed[e.seedId]) {
            latestSowBySeed[e.seedId] = e.actualSowDate
          }
        }
      })

      const startedThisYear = new Set(Object.keys(latestSowBySeed))

      // Weeks until first frost — current year only, no rollover
      const firstFrostStored = localStorage.getItem('firstFrostDate')
      let weeksToFirstFrost = null
      if (firstFrostStored) {
        const ff = new Date(`${thisYearStr}-${firstFrostStored}`)
        weeksToFirstFrost = (ff - today) / (1000 * 60 * 60 * 24 * 7)
      }
      const firstFrostPassed = weeksToFirstFrost !== null && weeksToFirstFrost <= 0

      // ── Spring/Summer first starts ──
      // Only for seeds that have Spring or Summer in their seasons
      const springDue = seeds
        .filter(s => {
          const seasons = s.seasons ?? []
          if (!seasons.includes('Spring') && !seasons.includes('Summer')) return false
          if (!s.springSowLeadWeeks) return false
          if (Number(s.springSowLeadWeeks) <= weeksToLastFrost) return false
          if (seededThisYear.has(s.id)) return false
          if (s.status === 'Gone') return false
          return true
        })
        .map(s => ({
          ...s,
          _type: 'spring',
          _overdueness: Number(s.springSowLeadWeeks) - weeksToLastFrost,
        }))

      // ── Fall first starts ──
      // Only for seeds that have Fall in their seasons; use first frost of current year
      let fallDue = []
      if (weeksToFirstFrost !== null && !firstFrostPassed) {
        fallDue = seeds
          .filter(s => {
            const seasons = s.seasons ?? []
            if (!seasons.includes('Fall')) return false
            if (!s.fallSowLeadWeeks) return false
            if (Number(s.fallSowLeadWeeks) <= weeksToFirstFrost) return false
            if (fallSeededThisYear.has(s.id)) return false
            if (s.status === 'Gone') return false
            return true
          })
          .map(s => ({
            ...s,
            _type: 'fall',
            _overdueness: Number(s.fallSowLeadWeeks) - weeksToFirstFrost,
          }))
      }

      // ── Succession starts ──
      // Stop showing if first frost has passed (growing season over)
      let successionStarts = []
      if (!firstFrostPassed) {
        successionStarts = seeds
          .filter(s => {
            if (!s.successionWeeks || Number(s.successionWeeks) === 0) return false
            if (s.status === 'Gone') return false
            const lastSow = latestSowBySeed[s.id]
            if (!lastSow) return false // no start this year yet
            const daysSinceLast = (today - new Date(lastSow)) / (1000 * 60 * 60 * 24)
            return daysSinceLast >= Number(s.successionWeeks) * 7
          })
          .map(s => {
            const daysSinceLast = (today - new Date(latestSowBySeed[s.id])) / (1000 * 60 * 60 * 24)
            const overdueDays = daysSinceLast - Number(s.successionWeeks) * 7
            return {
              ...s,
              _type: 'succession',
              _lastSowDate: latestSowBySeed[s.id],
              _overdueness: overdueDays / 7,
              _weeksOverdue: Math.round(overdueDays / 7 * 10) / 10,
            }
          })
      }

      const allDue = [...springDue, ...fallDue, ...successionStarts]
        .sort((a, b) => b._overdueness - a._overdueness)

      setResults(allDue)
    } catch (err) {
      setError(`Could not load data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const weeksToLastFrost = weeksUntilLastFrost()
  const frostLabel = formatFrostDate()
  const weeksDisplay = weeksToLastFrost !== null ? Math.round(weeksToLastFrost * 10) / 10 : null
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div>
      <h1 className="page-title">Daily Tasks</h1>

      {/* ── Starts Planned This Week ── */}
      <div className="task-section">
        <div className="task-section-header">
          <div>
            <h2 className="task-section-title">Starts Planned This Week</h2>
            <p className="task-section-hint">Sowing events with a planned date in the next 3 days, not yet sown</p>
          </div>
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="task-empty">No starts planned in the next 3 days.</p>
        ) : (
          <div className="seed-list">
            {upcomingEvents.map(evt => {
              const isOverdue = evt.plannedSowDate < todayStr
              const isDueToday = evt.plannedSowDate === todayStr
              return (
                <div key={evt.id} className="seed-card"
                  onClick={() => setEditingEvent(evt)} style={{ cursor: 'pointer' }}>
                  <div className="seed-card-main">
                    <span className="seed-variety">{evt.variety}</span>
                    <span className="seed-plant-type">{evt.plantType}</span>
                  </div>
                  <div className="starts-meta">
                    {isOverdue && <span className="badge badge-orange">Overdue</span>}
                    {isDueToday && <span className="badge badge-green">Today</span>}
                    {!isOverdue && !isDueToday && (
                      <span className="starts-date">{formatDate(evt.plannedSowDate)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Garden Tasks ── */}
      <div className="task-section">
        <div className="task-section-header">
          <div>
            <h2 className="task-section-title">Garden Tasks</h2>
            <p className="task-section-hint">Pending tasks across all sowing events, sorted by due date</p>
          </div>
        </div>

        {gardenTasks.length === 0 ? (
          <p className="task-empty">No pending tasks. Add tasks from a sowing event.</p>
        ) : (
          <div className="seed-list">
            {gardenTasks.map(task => {
              const isOverdue = task.dueDate < todayStr
              const isDueToday = task.dueDate === todayStr
              return (
                <div key={task.id} className="seed-card"
                  onClick={() => setEditingTask(task)} style={{ cursor: 'pointer' }}>
                  <div className="seed-card-main">
                    <span className="seed-variety">
                      {task.category === 'Other' ? task.description : task.category}
                    </span>
                    <span className="seed-plant-type">{task.variety}</span>
                  </div>
                  <div className="starts-meta">
                    {isOverdue && <span className="badge badge-orange">Overdue</span>}
                    {isDueToday && <span className="badge badge-green">Today</span>}
                    {!isOverdue && !isDueToday && (
                      <span className="starts-date">{formatDate(task.dueDate)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming Transplants ── */}
      <div className="task-section">
        <div className="task-section-header">
          <div>
            <h2 className="task-section-title">Upcoming Transplants</h2>
            <p className="task-section-hint">Active starts due to go outdoors within the next 7 days</p>
          </div>
        </div>

        {upcomingTransplants.length === 0 ? (
          <p className="task-empty">
            {localStorage.getItem('lastFrostDate')
              ? 'No transplants due in the next 7 days.'
              : 'Set your last frost date in My Garden to see upcoming transplants.'}
          </p>
        ) : (
          <div className="seed-list">
            {upcomingTransplants.map(evt => {
              const isOverdue = evt.anticipatedTransplantDate < todayStr
              const isDueToday = evt.anticipatedTransplantDate === todayStr
              return (
                <div key={evt.id} className="seed-card"
                  onClick={() => setEditingEvent(evt)} style={{ cursor: 'pointer' }}>
                  <div className="seed-card-main">
                    <span className="seed-variety">{evt.variety}</span>
                    <span className="seed-plant-type">{evt.plantType} · {evt.sowingMethod}</span>
                  </div>
                  <div className="starts-meta">
                    {isOverdue && <span className="badge badge-orange">Overdue</span>}
                    {isDueToday && <span className="badge badge-green">Today</span>}
                    {!isOverdue && !isDueToday && (
                      <span className="starts-date">{formatDate(evt.anticipatedTransplantDate)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
          <p className="task-empty">All seeds are either started or not yet due.</p>
        )}

        {results !== null && results.length > 0 && (
          <div className="seed-list">
            {results.map(seed => {
              if (seed._type === 'succession') {
                return (
                  <div key={`${seed.id}-succession`} className="seed-card needs-starting-card"
                    onClick={() => setEditingSeed(seed)} style={{ cursor: 'pointer' }}>
                    <div className="seed-card-main">
                      <span className="seed-variety">{seed.variety}</span>
                      <span className="seed-plant-type">{seed.plantType}</span>
                    </div>
                    <div className="starts-meta">
                      <span className="badge badge-outline">Succession</span>
                      {seed._weeksOverdue >= 0.5
                        ? <span className="badge badge-orange">{seed._weeksOverdue}w overdue</span>
                        : <span className="badge badge-green">Due now</span>
                      }
                    </div>
                  </div>
                )
              }

              if (seed._type === 'fall') {
                const leadWeeks = Number(seed.fallSowLeadWeeks)
                const weeksLate = Math.round(seed._overdueness * 10) / 10
                return (
                  <div key={`${seed.id}-fall`} className="seed-card needs-starting-card"
                    onClick={() => setEditingSeed(seed)} style={{ cursor: 'pointer' }}>
                    <div className="seed-card-main">
                      <span className="seed-variety">{seed.variety}</span>
                      <span className="seed-plant-type">{seed.plantType}</span>
                    </div>
                    <div className="starts-meta">
                      <span className="badge badge-sky">Fall</span>
                      <span className="starts-date">{leadWeeks}w lead</span>
                      {weeksLate > 0
                        ? <span className="badge badge-orange">{weeksLate}w overdue</span>
                        : <span className="badge badge-green">Due now</span>
                      }
                    </div>
                  </div>
                )
              }

              // spring / summer
              const leadWeeks = Number(seed.springSowLeadWeeks)
              const weeksLate = weeksToLastFrost !== null
                ? Math.round((leadWeeks - weeksToLastFrost) * 10) / 10
                : null
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
