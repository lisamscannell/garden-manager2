import { useEffect, useState } from 'react'

const STATUS_CLASS = {
  'Anticipated': 'badge-gray',
  'Active':      'badge-green',
  'Transplanted':'badge-sky',
  'Completed':   'badge-outline',
  'Failed':      'badge-orange',
  'Cancelled':   'badge-gray',
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

function SeedStarts() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/api/sowing-events').then(r => r.json()).then(setEvents)
  }, [])

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
        <div className="seed-list">
          {events.map(evt => (
            <div key={evt.id} className="seed-card starts-card">
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
          ))}
        </div>
      )}
    </div>
  )
}

export default SeedStarts
