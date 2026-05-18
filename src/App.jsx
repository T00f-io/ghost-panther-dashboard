import { useState } from 'react'
import FitnessModule from './FitnessModule'
import LogEntry from './LogEntry'
import WeightModule from './WeightModule'
import AnalyticsModule from './AnalyticsModule'
import InsightsModule from './InsightsModule'

export default function App() {
  const [view, setView] = useState('journal')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleLogSuccess() {
    setRefreshKey(k => k + 1)
    setView('journal')
  }

  const tabs = [
    { id: 'journal', label: '⚔️ Journal' },
    { id: 'weight', label: '⚖️ Weight' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'insights', label: '🧠 Insights' },
    { id: 'log', label: '➕ Log' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">Ghost Panther Protocol</h1>
          <p className="text-xs text-zinc-500 tracking-widest uppercase">Personal Fitness OS</p>
        </div>
        <span className="text-xs text-zinc-600">T00f-io</span>
      </header>

      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950 px-6 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              view === t.id
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {view === 'journal' && <FitnessModule key={refreshKey} />}
          {view === 'weight' && <WeightModule />}
          {view === 'analytics' && <AnalyticsModule />}
          {view === 'insights' && <InsightsModule />}
          {view === 'log' && <LogEntry onSuccess={handleLogSuccess} />}
        </div>
      </main>

    </div>
  )
}