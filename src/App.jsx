import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import FitnessModule from './FitnessModule'

const modules = [
  { id: 'fitness', label: 'Fitness', icon: '⚔️' },
  { id: 'finances', label: 'Finances', icon: '💰' },
  { id: 'career', label: 'Career', icon: '🧠' },
  { id: 'family', label: 'Family', icon: '🏠' },
  { id: 'olympus', label: 'Olympus', icon: '🏛️' },
]

export default function App() {
  const [active, setActive] = useState('fitness')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">Ghost Panther Protocol</h1>
          <p className="text-xs text-zinc-500 tracking-widest uppercase">Personal Life OS</p>
        </div>
        <span className="text-xs text-zinc-600">T00f-io</span>
      </header>

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 flex gap-1">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === m.id
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {active === 'fitness' && <FitnessModule />}
          {active !== 'fitness' && (
            <>
              <h2 className="text-2xl font-bold mb-1 capitalize">
                {modules.find((m) => m.id === active)?.label}
              </h2>
              <p className="text-zinc-500 text-sm mb-6">Module coming soon.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="h-3 w-24 bg-zinc-800 rounded mb-3" />
                    <div className="h-8 w-16 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

    </div>
  )
}