import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import FrostDates from './pages/FrostDates'
import SeedInventory from './pages/SeedInventory'
import SeedStarts from './pages/SeedStarts'
import DailyTasks from './pages/DailyTasks'
import './App.css'

function App() {
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        if (settings.lastFrostDate) localStorage.setItem('lastFrostDate', settings.lastFrostDate)
        if (settings.firstFrostDate) localStorage.setItem('firstFrostDate', settings.firstFrostDate)
        if (settings.zipCode) localStorage.setItem('zipCode', settings.zipCode)
      })
      .catch(() => { /* settings not critical on startup */ })
  }, [])

  return (
    <BrowserRouter>
      <div className="app-shell">

        {/* Top Navigation */}
        <nav className="top-nav">
          <NavLink to="/" className="nav-logo">🌱 Garden Manager</NavLink>
          <div className="nav-links">
            <NavLink to="/tasks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 Tasks</NavLink>
            <NavLink to="/seeds" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📦 Seeds</NavLink>
            <NavLink to="/starts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🌱 Starts</NavLink>
            <NavLink to="/frost" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🌿 My Garden</NavLink>
          </div>
        </nav>

        {/* Page Content */}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<DailyTasks />} />
            <Route path="/seeds" element={<SeedInventory />} />
            <Route path="/starts" element={<SeedStarts />} />
            <Route path="/frost" element={<FrostDates />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

export default App