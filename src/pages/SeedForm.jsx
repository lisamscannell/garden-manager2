import { useEffect, useState } from 'react'

const INACTIVE = ['Failed', 'Cancelled', 'Completed']

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

const PLANT_TYPES = [
  'Beans', 'Beets', 'Berries', 'Bok Choi', 'Brocolli', 'Cabbage',
  'Carrots', 'Cauliflower', 'Corn', 'Flower', 'Herbs', 'Melons',
  'Natives', 'Onions', 'Peas', 'Peppers', 'Potato', 'Radish',
  'Salad', 'Summer Squash', 'Tomatoes', 'Winter Squash',
]

const today = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  plantType: '',
  category: '',
  seasons: [],
  variety: '',
  status: 'In Stock',
  dateAdded: today(),
  vendor: '',
  itemNumber: '',
  link: '',
  maturityDays: '',
  harvestType: '',
  springSowLeadWeeks: '',
  springTransplantLeadWeeks: '',
  fallSowLeadWeeks: '',
  preferredSowingType: '',
  successionWeeks: '',
  anticipatedHeight: '',
  recommendedSpacing: '',
  hrsSun: '',
  notes: '',
}

function SeedForm({ onSave, onCancel, initialData, onNewSowingEvent }) {
  const isEditing = Boolean(initialData)
  const [form, setForm] = useState(isEditing ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [sowingEvents, setSowingEvents] = useState([])

  useEffect(() => {
    if (!isEditing) return
    fetch(`/api/sowing-events/seed/${initialData.id}`)
      .then(r => r.json())
      .then(events => setSowingEvents(events.filter(e => !INACTIVE.includes(e.sowingStatus))))
  }, [isEditing, initialData?.id])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function toggleSeason(season) {
    setForm(f => ({
      ...f,
      seasons: f.seasons.includes(season)
        ? f.seasons.filter(s => s !== season)
        : [...f.seasons, season],
    }))
  }

  function validate() {
    const e = {}
    if (!form.plantType) e.plantType = 'Required'
    if (!form.category) e.category = 'Required'
    if (!form.variety.trim()) e.variety = 'Required'
    if (!form.vendor.trim()) e.vendor = 'Required'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const seed = {
      ...form,
      id: isEditing ? initialData.id : `seed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      variety: form.variety.trim(),
      vendor: form.vendor.trim(),
    }
    onSave(seed)
  }

  return (
    <div className="seed-form-page">
      <div className="seed-form-header">
        <h1 className="page-title">{isEditing ? 'Edit Seed Packet' : 'Add Seed Packet'}</h1>
        <button className="ghost-btn" onClick={onCancel}>← Back to inventory</button>
      </div>

      {/* ── Section 1: About This Packet ── */}
      <section className="form-section">
        <h2 className="form-section-title">About This Packet</h2>
        <div className="form-grid">

          <div className="field-wrap">
            <label>Plant Type <span className="req">*</span></label>
            <select value={form.plantType} onChange={e => set('plantType', e.target.value)}
              className={errors.plantType ? 'input-error' : ''}>
              <option value="">Select…</option>
              {PLANT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            {errors.plantType && <span className="field-error">{errors.plantType}</span>}
          </div>

          <div className="field-wrap">
            <label>Category <span className="req">*</span></label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className={errors.category ? 'input-error' : ''}>
              <option value="">Select…</option>
              <option>Edible</option>
              <option>Flower</option>
              <option>Foliage</option>
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </div>

          <div className="field-wrap full-width">
            <label>Variety <span className="req">*</span></label>
            <input type="text" value={form.variety}
              onChange={e => set('variety', e.target.value)}
              placeholder="e.g. Cherokee Purple"
              className={errors.variety ? 'input-error' : ''} />
            {errors.variety && <span className="field-error">{errors.variety}</span>}
          </div>

          <div className="field-wrap full-width">
            <label>Season</label>
            <div className="checkbox-group">
              {['Spring', 'Summer', 'Fall'].map(s => (
                <label key={s} className="checkbox-label">
                  <input type="checkbox" checked={form.seasons.includes(s)}
                    onChange={() => toggleSeason(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2: Purchase Info ── */}
      <section className="form-section">
        <h2 className="form-section-title">Purchase Info</h2>
        <div className="form-grid">

          <div className="field-wrap">
            <label>Vendor <span className="req">*</span></label>
            <input type="text" value={form.vendor}
              onChange={e => set('vendor', e.target.value)}
              placeholder="e.g. Baker Creek"
              className={errors.vendor ? 'input-error' : ''} />
            {errors.vendor && <span className="field-error">{errors.vendor}</span>}
          </div>

          <div className="field-wrap">
            <label>Item #</label>
            <input type="text" value={form.itemNumber}
              onChange={e => set('itemNumber', e.target.value)}
              placeholder="Vendor item number" />
          </div>

          <div className="field-wrap full-width">
            <label>Link</label>
            <input type="url" value={form.link}
              onChange={e => set('link', e.target.value)}
              placeholder="https://…" />
          </div>

          <div className="field-wrap">
            <label>Date Added</label>
            <input type="date" value={form.dateAdded}
              onChange={e => set('dateAdded', e.target.value)} />
          </div>

          <div className="field-wrap">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option>In Stock</option>
              <option>Low</option>
              <option>Gone</option>
            </select>
          </div>

        </div>
      </section>

      {/* ── Section 3: Growing Details ── */}
      <section className="form-section">
        <h2 className="form-section-title">Growing Details</h2>
        <div className="form-grid">

          <div className="field-wrap">
            <label>Maturity Days</label>
            <input type="number" min="1" value={form.maturityDays}
              onChange={e => set('maturityDays', e.target.value)}
              placeholder="e.g. 75" />
          </div>

          <div className="field-wrap">
            <label>Harvest Type</label>
            <select value={form.harvestType} onChange={e => set('harvestType', e.target.value)}>
              <option value="">Select…</option>
              <option>Once</option>
              <option>Recurring</option>
            </select>
          </div>

          <div className="field-wrap">
            <label>Preferred Sowing Type</label>
            <select value={form.preferredSowingType} onChange={e => set('preferredSowingType', e.target.value)}>
              <option value="">Select…</option>
              <option>Indoor Trays</option>
              <option>Outdoor Trays</option>
              <option>Direct</option>
            </select>
          </div>

          <div className="field-wrap">
            <label>Hrs Sun</label>
            <input type="number" min="0" max="24" value={form.hrsSun}
              onChange={e => set('hrsSun', e.target.value)}
              placeholder="e.g. 6" />
          </div>

          <div className="field-wrap">
            <label>Spring Sow Lead Weeks</label>
            <input type="number" min="0" value={form.springSowLeadWeeks}
              onChange={e => set('springSowLeadWeeks', e.target.value)}
              placeholder="Weeks before last frost" />
          </div>

          <div className="field-wrap">
            <label>Spring Transplant Lead Weeks</label>
            <input type="number" min="0" value={form.springTransplantLeadWeeks}
              onChange={e => set('springTransplantLeadWeeks', e.target.value)}
              placeholder="Weeks before last frost" />
          </div>

          <div className="field-wrap">
            <label>Fall Sow Lead Weeks</label>
            <input type="number" min="0" value={form.fallSowLeadWeeks}
              onChange={e => set('fallSowLeadWeeks', e.target.value)}
              placeholder="Weeks before first frost" />
          </div>

          <div className="field-wrap">
            <label>Succession Weeks</label>
            <input type="number" min="0" value={form.successionWeeks}
              onChange={e => set('successionWeeks', e.target.value)}
              placeholder="Weeks between starts" />
          </div>

          <div className="field-wrap">
            <label>Anticipated Height</label>
            <input type="text" value={form.anticipatedHeight}
              onChange={e => set('anticipatedHeight', e.target.value)}
              placeholder='e.g. 4–6 ft' />
          </div>

          <div className="field-wrap">
            <label>Recommended Spacing</label>
            <input type="text" value={form.recommendedSpacing}
              onChange={e => set('recommendedSpacing', e.target.value)}
              placeholder='e.g. 18 in' />
          </div>

        </div>
      </section>

      {/* ── Section 4: Notes ── */}
      <section className="form-section">
        <h2 className="form-section-title">Notes</h2>
        <div className="field-wrap full-width">
          <textarea value={form.notes} rows={4}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any additional notes about this variety…" />
        </div>
      </section>

      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Save Seed Packet'}</button>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>

      {isEditing && onNewSowingEvent && (
        <div className="sowing-action">
          <button className="sowing-btn" onClick={() => onNewSowingEvent(initialData)}>
            🌱 New Sowing Event
          </button>
        </div>
      )}

      {isEditing && sowingEvents.length > 0 && (
        <div className="current-sowings">
          <h2 className="form-section-title">Current Sowings</h2>
          <div className="seed-list">
            {sowingEvents.map(evt => (
              <div key={evt.id} className="seed-card">
                <div className="seed-card-main">
                  <span className="seed-variety">
                    {evt.actualSowDate ? formatDate(evt.actualSowDate) : `Planned ${formatDate(evt.plannedSowDate)}`}
                  </span>
                  <span className="seed-plant-type">{evt.sowingMethod}</span>
                </div>
                <span className="badge badge-green">{evt.sowingStatus}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeedForm
