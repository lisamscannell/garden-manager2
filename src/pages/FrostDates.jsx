import { useState, useEffect } from 'react'

function FrostDates() {
  const [lastFrost, setLastFrost] = useState('')
  const [firstFrost, setFirstFrost] = useState('')
  const [saved, setSaved] = useState(false)

  // Load saved dates when page opens
  useEffect(() => {
    const savedLast = localStorage.getItem('lastFrostDate')
    const savedFirst = localStorage.getItem('firstFrostDate')
    if (savedLast) setLastFrost(savedLast)
    if (savedFirst) setFirstFrost(savedFirst)
  }, [])

  // Save dates to local storage
  function handleSave() {
    localStorage.setItem('lastFrostDate', lastFrost)
    localStorage.setItem('firstFrostDate', firstFrost)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Calculate days until last frost
  function daysUntilLastFrost() {
    if (!lastFrost) return null
    const today = new Date()
    const thisYear = today.getFullYear()
    const frostThisYear = new Date(`${thisYear}-${lastFrost}`)
    if (frostThisYear < today) {
      frostThisYear.setFullYear(thisYear + 1)
    }
    const diff = Math.ceil((frostThisYear - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntil = daysUntilLastFrost()

  return (
    <div className="frost-page">
      <h1 className="page-title">🌡 Frost Dates</h1>
      <p className="page-subtitle">
        Set your local frost dates — these drive your entire planting schedule.
      </p>

      {/* Days until frost banner */}
      {daysUntil !== null && (
        <div className="frost-banner">
          <span className="frost-banner-number">{daysUntil}</span>
          <span className="frost-banner-label">days until last frost</span>
        </div>
      )}

      {/* Form */}
      <div className="frost-card">
        <div className="frost-field">
          <label>🌸 Average Last Frost Date (spring)</label>
          <p className="field-hint">The last date you typically get frost in spring. For New Boston MI, this is around May 10.</p>
          <input
            type="date"
            value={lastFrost ? `2000-${lastFrost}` : ''}
            onChange={e => setLastFrost(e.target.value.slice(5))}
          />
        </div>

        <div className="frost-field">
          <label>🍂 Average First Frost Date (fall)</label>
          <p className="field-hint">The first date you typically get frost in fall. For New Boston MI, this is around October 15.</p>
          <input
            type="date"
            value={firstFrost ? `2000-${firstFrost}` : ''}
            onChange={e => setFirstFrost(e.target.value.slice(5))}
          />
        </div>

        <button className="save-btn" onClick={handleSave}>
          {saved ? '✅ Saved!' : 'Save Frost Dates'}
        </button>
      </div>
    </div>
  )
}

export default FrostDates