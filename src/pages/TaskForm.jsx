import { useState } from 'react'

const today = () => new Date().toISOString().split('T')[0]
const CATEGORIES = ['Pot Up', 'Prune', 'Fertilize', 'Other']

function TaskForm({ sowingEvent, initialData, onSave, onCancel }) {
  const isEditing = Boolean(initialData?.id)
  const [form, setForm] = useState(
    isEditing
      ? { ...initialData }
      : { category: '', description: '', notes: '', dueDate: today(), status: 'Pending' }
  )
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.category) e.category = 'Required'
    if (form.category === 'Other' && !form.description?.trim()) e.description = 'Required when category is Other'
    if (!form.dueDate) e.dueDate = 'Required'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    try {
      let res
      if (isEditing) {
        res = await fetch(`/api/tasks/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sowingEventId: sowingEvent.id }),
        })
      }
      if (!res.ok) { alert(`Server error: ${await res.text()}`); return }
      onSave(await res.json())
    } catch (err) {
      alert(`Could not save: ${err.message}`)
    }
  }

  return (
    <div className="seed-form-page">
      <div className="seed-form-header">
        <h1 className="page-title">{isEditing ? 'Edit Task' : 'Add Task'}</h1>
        <button className="ghost-btn" onClick={onCancel}>← Back</button>
      </div>

      <div className="sowing-seed-context">
        <span className="sowing-seed-label">Sowing Event</span>
        <span className="sowing-seed-value">{sowingEvent.variety}</span>
        <span className="sowing-seed-type">{sowingEvent.plantType}</span>
        <span className="sowing-seed-id">{sowingEvent.id}</span>
      </div>

      <section className="form-section">
        <h2 className="form-section-title">Task Details</h2>
        <div className="form-grid">

          <div className="field-wrap">
            <label>Category <span className="req">*</span></label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className={errors.category ? 'input-error' : ''}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </div>

          <div className="field-wrap">
            <label>Due Date <span className="req">*</span></label>
            <input type="date" value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              className={errors.dueDate ? 'input-error' : ''} />
            {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
          </div>

          {form.category === 'Other' && (
            <div className="field-wrap full-width">
              <label>Description <span className="req">*</span></label>
              <input type="text" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of the task"
                className={errors.description ? 'input-error' : ''} />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>
          )}

          <div className="field-wrap full-width">
            <label>Notes</label>
            <textarea value={form.notes} rows={3}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes…" />
          </div>

          {isEditing && (
            <div className="field-wrap">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Pending</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
          )}

        </div>
      </section>

      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>
          {isEditing ? 'Save Changes' : 'Add Task'}
        </button>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default TaskForm
