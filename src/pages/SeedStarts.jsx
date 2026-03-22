import { useEffect, useState } from 'react'
import SowingForm from './SowingForm'

const STATUS_CLASS = {
  'Anticipated': 'badge-gray',
  'Active':      'badge-green',
  'Transplanted':'badge-sky',
  'Completed':   'badge-outline',
  'Failed':      'badge-orange',
  'Cancelled':   'badge-gray',
}

const INACTIVE = ['Failed', 'Completed', 'Cancelled']

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

function groupEvents(events) {
  const watchForEmergence = []
  const activeIndoors = []
  const activeOutdoors = []
  const inGround = []
  const anticipated = []
  const errors = []

  for (const e of events) {
    if (e.sowingStatus === 'Active' && !e.emergenceDate) {
      watchForEmergence.push(e)
    } else if (e.sowingStatus === 'Active' && e.emergenceDate && !e.transplantDate) {
      if (e.sowingMethod === 'Indoor Tray') activeIndoors.push(e)
      else activeOutdoors.push(e)
    } else if (e.sowingStatus === 'Transplanted') {
      inGround.push(e)
    } else if (e.sowingStatus === 'Anticipated') {
      anticipated.push(e)
    } else {
      errors.push(e)
    }
  }

  return { watchForEmergence, activeIndoors, activeOutdoors, inGround, anticipated, errors }
}

function EventCard({ evt, onClick }) {
  return (
    <div className="seed-card starts-card" onClick={() => onClick(evt)} style={{ cursor: 'pointer' }}>
      <div className="seed-card-main">
        <span className="seed-variety">{evt.variety}</span>
        <span className="seed-plant-type">{evt.plantType}</span>
      </div>
      <div className="starts-meta">
        <span className="starts-date">{formatDate(evt.actualSowDate)}</span>
        <span className={`badge ${STATUS_CLASS[evt.sowingStatus] || 'badge-gray'}`}>
          {evt.sowingStatus}
        </span>
      </div>
    </div>
  )
}

function EventGroup({ label, events, onClickEvent }) {
  if (events.length === 0) return null
  return (
    <div className="starts-group">
      <h2 className="starts-group-label">{label}</h2>
      <div className="seed-list">
        {events.map(evt => (
          <EventCard key={evt.id} evt={evt} onClick={onClickEvent} />
        ))}
      </div>
    </div>
  )
}

function SeedStarts() {
  const [events, setEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/sowing-events').then(r => r.json()).then(setEvents)
  }, [])

  function handleSave(updated) {
    setEvents(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
    setEditingEvent(null)
  }

  if (editingEvent) {
    return <SowingForm
      initialData={editingEvent}
      onSave={handleSave}
      onCancel={() => setEditingEvent(null)}
    />
  }

  const visibleEvents = events.filter(e => showAll || !INACTIVE.includes(e.sowingStatus))
  const { watchForEmergence, activeIndoors, activeOutdoors, inGround, anticipated, errors } = groupEvents(visibleEvents)
  const inactiveCount = events.filter(e => INACTIVE.includes(e.sowingStatus)).length

  return (
    <div>
      <div className="inventory-header">
        <h1 className="page-title">Seed Starts</h1>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No sowing events yet.</p>
          <p>Open a seed packet and tap "New Sowing Event" to get started.</p>
        </div>
      ) : (
        <>
          <EventGroup label="Watch for Emergence" events={watchForEmergence} onClickEvent={setEditingEvent} />
          <EventGroup label="Active Starts (Indoors)" events={activeIndoors} onClickEvent={setEditingEvent} />
          <EventGroup label="Active Starts (Outdoors)" events={activeOutdoors} onClickEvent={setEditingEvent} />
          <EventGroup label="Starts in Ground" events={inGround} onClickEvent={setEditingEvent} />
          <EventGroup label="Anticipated Starts" events={anticipated} onClickEvent={setEditingEvent} />
          <EventGroup label="Errors" events={errors} onClickEvent={setEditingEvent} />
        </>
      )}

      {!showAll && inactiveCount > 0 && (
        <p className="show-all-toggle">
          <button className="ghost-btn" onClick={() => setShowAll(true)}>
            Show inactive events ({inactiveCount})
          </button>
        </p>
      )}
      {showAll && (
        <p className="show-all-toggle">
          <button className="ghost-btn" onClick={() => setShowAll(false)}>Hide inactive events</button>
        </p>
      )}
    </div>
  )
}

export default SeedStarts
