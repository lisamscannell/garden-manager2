import { useState, useEffect } from 'react'
import TaskForm from './TaskForm'

const today = () => new Date().toISOString().split('T')[0]

function calcPlannedSowDate(springSowLeadWeeks) {
  const stored = localStorage.getItem('lastFrostDate') // MM-DD
  if (!stored || !springSowLeadWeeks) return null
  const year = new Date().getFullYear()
  let frost = new Date(`${year}-${stored}`)
  if (frost < new Date()) frost.setFullYear(year + 1)
  frost.setDate(frost.getDate() - Number(springSowLeadWeeks) * 7)
  return frost.toISOString().split('T')[0]
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

const EMPTY_FORM = {
  plannedSowDate: '',
  actualSowDate: '',
  emergenceDate: '',
  transplantDate: '',
  sowingMethod: '',
  sowingContainer: '',
  sowingStatus: 'Active',
  notes: '',
}

function SowingForm({ seed, initialData, onSave, onCancel }) {
  const isEditing = Boolean(initialData)
  const [form, setForm] = useState(isEditing ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [tasks, setTasks] = useState([])
  const [editingTask, setEditingTask] = useState(null) // null | true (new) | task object (edit)

  useEffect(() => {
    if (!isEditing) return
    fetch(`/api/tasks/sowing/${initialData.id}`)
      .then(r => r.json())
      .then(setTasks)
  }, [isEditing, initialData?.id])

  function set(field, value) {
    setForm(f => {
      const updated = { ...f, [field]: value }
      if (field === 'plannedSowDate' && value && !f.actualSowDate) {
        const today = new Date().toISOString().split('T')[0]
        updated.sowingStatus = value > today ? 'Anticipated' : 'Active'
      }
      return updated
    })
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.sowingMethod) e.sowingMethod = 'Required'
    return e
  }

  function handleTaskSave(saved) {
    setTasks(prev => {
      const exists = prev.find(t => t.id === saved.id)
      return exists ? prev.map(t => t.id === saved.id ? saved : t) : [...prev, saved]
    })
    setEditingTask(null)
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    try {
      let res
      if (isEditing) {
        res = await fetch(`/api/sowing-events/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        res = await fetch('/api/sowing-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, seedId: seed.id }),
        })
      }
      if (!res.ok) {
        const text = await res.text()
        alert(`Server error: ${text}`)
        return
      }
      onSave(await res.json())
    } catch (err) {
      alert(`Could not save: ${err.message}`)
    }
  }

  if (editingTask !== null) {
    return (
      <TaskForm
        sowingEvent={initialData}
        initialData={editingTask === true ? null : editingTask}
        onSave={handleTaskSave}
        onCancel={() => setEditingTask(null)}
      />
    )
  }

  const todayStr = today()

  return (
    <div className="seed-form-page">
      <div className="seed-form-header">
        <h1 className="page-title">{isEditing ? 'Edit Sowing Event' : 'New Sowing Event'}</h1>
        <button className="ghost-btn" onClick={onCancel}>← Back</button>
      </div>

      {/* Seed context — read only */}
      <div className="sowing-seed-context">
        <span className="sowing-seed-label">Seed Packet</span>
        <span className="sowing-seed-value">{isEditing ? initialData.variety : seed.variety}</span>
        <span className="sowing-seed-type">{isEditing ? initialData.plantType : seed.plantType}</span>
        {isEditing && <span className="sowing-seed-id">{initialData.id}</span>}
      </div>

      <section className="form-section">
        <h2 className="form-section-title">Sowing Details</h2>
        <div className="form-grid">

          {!form.actualSowDate && (
            <div className="field-wrap">
              <div className="field-label-row">
                <label>Planned Sow Date</label>
                {seed?.springSowLeadWeeks && localStorage.getItem('lastFrostDate') && (
                  <button type="button" className="calc-btn"
                    onClick={() => {
                      const d = calcPlannedSowDate(seed.springSowLeadWeeks)
                      if (d) set('plannedSowDate', d)
                    }}>
                    Calculate from frost date
                  </button>
                )}
              </div>
              <input type="date" value={form.plannedSowDate}
                onChange={e => set('plannedSowDate', e.target.value)} />
            </div>
          )}

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
              <option>Milk Jug Greenhouse</option>
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
        <button className="save-btn" onClick={handleSave}>
          {isEditing ? 'Save Changes' : 'Save Sowing Event'}
        </button>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>

      {isEditing && (
        <div className="sowing-action">
          <button className="sowing-btn" onClick={() => setEditingTask(true)}>
            + Add Task
          </button>

          {tasks.length > 0 && (
            <div className="current-sowings">
              <h2 className="form-section-title">Tasks</h2>
              <div className="seed-list">
                {tasks.map(task => {
                  const isOverdue = task.status === 'Pending' && task.dueDate < todayStr
                  return (
                    <div key={task.id} className="seed-card"
                      onClick={() => setEditingTask(task)} style={{ cursor: 'pointer' }}>
                      <div className="seed-card-main">
                        <span className="seed-variety">
                          {task.category === 'Other' ? task.description : task.category}
                        </span>
                        <span className="seed-plant-type">{initialData.variety} · Due {formatDate(task.dueDate)}</span>
                      </div>
                      <div className="starts-meta">
                        {isOverdue && <span className="badge badge-orange">Overdue</span>}
                        <span className={`badge ${
                          task.status === 'Completed' ? 'badge-green'
                          : task.status === 'Cancelled' ? 'badge-gray'
                          : 'badge-sky'
                        }`}>{task.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SowingForm
