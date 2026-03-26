import { useState, useEffect } from 'react'

function FrostDates() {
  const [lastFrost, setLastFrost] = useState('')
  const [firstFrost, setFirstFrost] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [saved, setSaved] = useState(false)
  const [weather, setWeather] = useState(null)
  const [weatherError, setWeatherError] = useState(null)

  useEffect(() => {
    const savedLast = localStorage.getItem('lastFrostDate')
    const savedFirst = localStorage.getItem('firstFrostDate')
    const savedZip = localStorage.getItem('zipCode')
    if (savedLast) setLastFrost(savedLast)
    if (savedFirst) setFirstFrost(savedFirst)
    if (savedZip) {
      setZipCode(savedZip)
      fetchWeather(savedZip)
    }
  }, [])

  async function fetchWeather(zip) {
    if (!zip || zip.length < 5) return
    setWeatherError(null)
    try {
      const res = await fetch(`https://wttr.in/${zip}?format=j1`)
      if (!res.ok) throw new Error('Weather unavailable')
      const data = await res.json()
      const current = data.current_condition[0]
      const today = data.weather[0]
      const lat = data.nearest_area[0].latitude
      const lon = data.nearest_area[0].longitude

      const dayLabels = ['Today', 'Tomorrow']
      const forecast = data.weather.map((day, i) => {
        const totalMM = day.hourly.reduce((sum, h) => sum + Number(h.precipMM), 0)
        const inches = Math.round(totalMM * 0.0394 * 100) / 100
        const label = dayLabels[i] ?? new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
        return { label, inches }
      })

      const fmt = d => d.toISOString().split('T')[0]
      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 1)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)

      let precipIn = null
      try {
        const pRes = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${fmt(startDate)}&end_date=${fmt(endDate)}&daily=precipitation_sum&precipitation_unit=inch&timezone=America%2FDetroit`
        )
        if (pRes.ok) {
          const pData = await pRes.json()
          const sums = pData.daily?.precipitation_sum ?? []
          precipIn = Math.round(sums.reduce((acc, v) => acc + (v ?? 0), 0) * 100) / 100
        }
      } catch (_) {
        // precipitation is optional
      }

      setWeather({
        temp: current.temp_F,
        desc: current.weatherDesc[0].value,
        high: today.maxtempF,
        low: today.mintempF,
        precipIn,
        forecast,
      })
    } catch {
      setWeatherError('Could not load weather.')
    }
  }

  function handleSave() {
    localStorage.setItem('lastFrostDate', lastFrost)
    localStorage.setItem('firstFrostDate', firstFrost)
    localStorage.setItem('zipCode', zipCode)
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastFrostDate: lastFrost, firstFrostDate: firstFrost, zipCode }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    fetchWeather(zipCode)
  }

  function daysUntilLastFrost() {
    if (!lastFrost) return null
    const today = new Date()
    const thisYear = today.getFullYear()
    const frostThisYear = new Date(`${thisYear}-${lastFrost}`)
    if (frostThisYear < today) frostThisYear.setFullYear(thisYear + 1)
    return Math.ceil((frostThisYear - today) / (1000 * 60 * 60 * 24))
  }

  const daysUntil = daysUntilLastFrost()

  return (
    <div className="frost-page">
      <h1 className="page-title">🌿 My Garden</h1>
      <p className="page-subtitle">
        Set your local frost dates — these drive your entire planting schedule.
      </p>

      {/* Weather */}
      {weather && (
        <div className="weather-card">
          <div className="weather-temp">{weather.temp}°F</div>
          <div className="weather-desc">{weather.desc}</div>
          <div className="weather-range">↑ {weather.high}° · ↓ {weather.low}°</div>
          {weather.precipIn !== null && (
            <div className="weather-precip">☔ {weather.precipIn}" last 7 days</div>
          )}
          {weather.forecast && (
            <div className="weather-forecast">
              {weather.forecast.map(day => (
                <div key={day.label} className="weather-forecast-day">
                  <span className="weather-forecast-label">{day.label}</span>
                  <span className="weather-forecast-val">{day.inches}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {weatherError && <p className="task-empty">{weatherError}</p>}

      {/* Days until frost banner */}
      {daysUntil !== null && (
        <div className="frost-banner">
          <span className="frost-banner-number">{daysUntil}</span>
          <span className="frost-banner-label">days until last frost</span>
        </div>
      )}

      {/* Garden Settings */}
      <h2 className="page-subtitle" style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--soil)' }}>Garden Settings</h2>
      <div className="frost-card">
        <div className="frost-field">
          <label>📍 Zip Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zipCode}
            onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 48164"
          />
        </div>

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
          {saved ? '✅ Saved!' : 'Save Garden Settings'}
        </button>
      </div>
    </div>
  )
}

export default FrostDates
