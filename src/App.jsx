import { useState } from 'react'
import FitnessModule from './FitnessModule'
import LogEntry from './LogEntry'
import WeightModule from './WeightModule'
import AnalyticsModule from './AnalyticsModule'
import InsightsModule from './InsightsModule'
import ProgramModule from './ProgramModule'
import MovementLibrary from './MovementLibrary'
import WorkoutGenerator from './WorkoutGenerator'
import BodyCompModule from './BodyCompModule'
import { useUser } from './UserContext'

export default function App() {
  const [view, setView] = useState('journal')
  const [refreshKey, setRefreshKey] = useState(0)
  const { users, currentUser, setCurrentUser } = useUser()

  function handleLogSuccess() {
    setRefreshKey(k => k + 1)
    setView('journal')
  }

  const personalTabs = [
    { id: 'journal', label: '⚔️ Journal' },
    { id: 'weight', label: '⚖️ Weight' },
    { id: 'bodycomp', label: '📏 Body Comp' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'insights', label: '🧠 Insights' },
    { id: 'log', label: '➕ Log' },
  ]

  const sharedTabs = [
    { id: 'program', label: '📋 Program' },
    { id: 'movements', label: '🗂️ Movements' },
    { id: 'generate', label: '⚡ Generate' },
  ]

  const tabs = [...personalTabs, ...sharedTabs]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Ghost Panther Protocol"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">Ghost Panther Protocol</h1>
            <p className="text-xs text-zinc-500 tracking-widest uppercase">Personal Fitness OS</p>
          </div>
        </div>

        {/* User toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {users.map(u => (
            <button
              key={u.slug}
              onClick={() => {
                setCurrentUser(u)
                setRefreshKey(k => k + 1)
                setView('journal')
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentUser?.slug === u.slug
                  ? 'bg-white text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950 px-6 flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
          {view === 'journal' && <FitnessModule key={refreshKey} user={currentUser} />}
          {view === 'program' && <ProgramModule />}
          {view === 'movements' && <MovementLibrary />}
          {view === 'generate' && <WorkoutGenerator user={currentUser} />}
          {view === 'weight' && <WeightModule key={refreshKey} user={currentUser} />}
          {view === 'bodycomp' && <BodyCompModule key={refreshKey} user={currentUser} />}
          {view === 'analytics' && <AnalyticsModule key={refreshKey} user={currentUser} />}
          {view === 'insights' && <InsightsModule key={refreshKey} user={currentUser} />}
          {view === 'log' && <LogEntry user={currentUser} onSuccess={handleLogSuccess} />}
        </div>
      </main>

    </div>
  )
}