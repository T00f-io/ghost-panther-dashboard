import { useState } from 'react'
import FitnessModule from './FitnessModule'
import LogEntry from './LogEntry'

export default function App() {
  const [view, setView] = useState('journal')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleLogSuccess() {
    setRefreshKey(k => k + 1)
    setView('journal')
  }

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
        <button
          onClick={() => setView('journal')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            view === 'journal'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⚔️ Journal
        </button>
        <button
          onClick={() => setView('log')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            view === 'log'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ➕ Log Workout
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {view === 'journal' && <FitnessModule key={refreshKey} />}
          {view === 'log' && <LogEntry onSuccess={handleLogSuccess} />}
        </div>
      </main>

    </div>
  )
}