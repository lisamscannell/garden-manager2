import { useState } from 'react'

const today = () => new Date().toISOString().split('T')[0]

function SowingForm({ seed, onSave, onCancel }) {
  const [form, setForm] = useState({
    actualSowDate: today(),
    emergenceDate: '',
    transplantDate: '',
    sowingMethod: '',
    sowingContainer: '',
    sowingStatus: 'Active',
    notes: '',
  })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.sowingMethod) e.sowingMethod = 'Required'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    try {
      const res = await fetch('/api/sowing-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, seedId: seed.id }),
      })
      if (!res.ok) {
        const text = await res.text()
        alert(`Server error: ${text}`)
        return
      }
      const created = await res.json()
      onSave(created)
    } catch (err) {
      alert(`Could not save: ${err.message}`)
    }
  }

  return (
    <div className="seed-form-page">
      <div className="seed-form-header">
        <h1 className="page-title">New Sowing Event</h1>
        <button className="ghost-btn" onClick={onCancel}>← Back to packet</button>
      </div>

      {/* Seed context — read only */}
      <div className="sowing-seed-context">
        <span className="sowing-seed-label">Seed Packet</span>
        <span className="sowing-seed-value">{seed.variety}</span>
        <span className="sowing-seed-type">{seed.plantType}</span>
      </div>

      <section className="form-section">
        <h2 className="form-section-title">Sowing Details</h2>
        <div className="form-grid">

          <div className="field-wrap">
            <label>Actual Sow Date</label>
            <input type="date" value={form.actualSowDate}
              onChange={e => set('actualSowDate', e.target.value)} />
          </div>

          <div className="field-wrap">
            <label>Sowing Method <span className="req">*</span></label>
            <select value={form.sowingMethod}
              onChange={e => set('sowingMethod', e.target.value)}
              className={errors.sowingMethod ? 'input-error' : ''}>
              <option value="">Select…</option>
              <option>Indoor Tray</option>
              <option>Outdoor Tray</option>
              <option>Direct Sow</option>
            </select>
            {errors.sowingMethod && <span className="field-error">{errors.sowingMethod}</span>}
          </div>

          <div className="field-wrap">
            <label>Sowing Container</label>
            <select value={form.sowingContainer}
              onChange={e => set('sowingContainer', e.target.value)}>
              <option value="">Select…</option>
              <option>Cell Pack</option>
              <option>Soil Block</option>
              <option>Other</option>
            </select>
          </div>

          <div className="field-wrap">
            <label>Status</label>
            <select value={form.sowingStatus}
              onChange={e => set('sowingStatus', e.target.value)}>
              <option>Anticipated</option>
              <option>Active</option>
              <option>Transplanted</option>
              <option>Completed</option>
              <option>Failed</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="field-wrap">
            <label>Emergence Date</label>
            <input type="date" value={form.emergenceDate}
              onChange={e => set('emergenceDate', e.target.value)} />
          </div>

          <div className="field-wrap">
            <label>Transplant Date</label>
            <input type="date" value={form.transplantDate}
              onChange={e => set('transplantDate', e.target.value)} />
          </div>

          <div className="field-wrap full-width">
            <label>Notes</label>
            <textarea value={form.notes} rows={3}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this sowing…" />
          </div>

        </div>
      </section>

      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>Save Sowing Event</button>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default SowingForm
