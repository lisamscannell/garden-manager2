import { useState } from 'react'
import SeedForm from './SeedForm'

const STORAGE_KEY = 'gm-seeds'

function loadSeeds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

const STATUS_CLASS = {
  'In Stock': 'badge-green',
  'Low': 'badge-orange',
  'Gone': 'badge-gray',
}

function SeedInventory() {
  const [seeds, setSeeds] = useState(loadSeeds)
  const [showForm, setShowForm] = useState(false)

  function handleSave(seed) {
    const updated = [...seeds, seed]
    setSeeds(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setShowForm(false)
  }

  function handleDelete(id) {
    if (!window.confirm('Remove this seed packet?')) return
    const updated = seeds.filter(s => s.id !== id)
    setSeeds(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  if (showForm) {
    return <SeedForm onSave={handleSave} onCancel={() => setShowForm(false)} />
  }

  return (
    <div>
      <div className="inventory-header">
        <div>
          <h1 className="page-title">Seed Inventory</h1>
          <p className="page-subtitle">{seeds.length} packet{seeds.length !== 1 ? 's' : ''} on hand</p>
        </div>
        <button className="save-btn" onClick={() => setShowForm(true)}>+ Add Seed Packet</button>
      </div>

      {seeds.length === 0 ? (
        <div className="empty-state">
          <p>No seed packets yet.</p>
          <p>Add your first packet to get started.</p>
        </div>
      ) : (
        <div className="seed-list">
          {seeds.map(seed => (
            <div key={seed.id} className="seed-card">
              <div className="seed-card-main">
                <div className="seed-card-title">
                  <span className="seed-variety">{seed.variety}</span>
                  <span className="seed-plant-type">{seed.plantType}</span>
                </div>
                <div className="seed-card-meta">
                  <span className={`badge ${STATUS_CLASS[seed.status] || 'badge-green'}`}>{seed.status}</span>
                  <span className="badge badge-outline">{seed.category}</span>
                  {seed.seasons.map(s => (
                    <span key={s} className="badge badge-sky">{s}</span>
                  ))}
                </div>
                <div className="seed-card-details">
                  <span>{seed.vendor}</span>
                  {seed.itemNumber && <span>#{seed.itemNumber}</span>}
                  {seed.maturityDays && <span>{seed.maturityDays}d to maturity</span>}
                  {seed.preferredSowingType && <span>{seed.preferredSowingType}</span>}
                </div>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(seed.id)} title="Remove packet">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeedInventory
