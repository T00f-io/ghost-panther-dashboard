import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function FitnessModule() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('date', { ascending: false })
      if (!error) setSessions(data)
      setLoading(false)
    }
    fetchSessions()
  }, [])

  async function handleSelect(session) {
    setSelected(session)
    const { data, error } = await supabase
      .from('workout_movements')
      .select('*')
      .eq('session_id', session.id)
    if (!error) setMovements(data)
  }

  if (loading) return <p className="text-zinc-500">Loading sessions...</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Session list */}
      <div className="lg:col-span-1 flex flex-col gap-3">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              selected?.id === s.id
                ? 'border-white bg-zinc-800'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
            }`}
          >
            <p className="text-xs text-zinc-500 mb-1">
              {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
              })}
            </p>
            <p className="text-sm font-medium text-white leading-snug">{s.arc_name}</p>
          </button>
        ))}
      </div>

      {/* Session detail */}
      <div className="lg:col-span-2">
        {!selected ? (
          <div className="border border-zinc-800 rounded-xl p-6 text-zinc-500 text-sm">
            Select a session to view details.
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl p-6">
            <p className="text-xs text-zinc-500 mb-1">
              {new Date(selected.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
            <h3 className="text-lg font-bold text-white mb-4">{selected.arc_name}</h3>

            {/* Session note */}
            {selected.notes && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4 text-xs text-zinc-400 leading-relaxed">
                {selected.notes}
              </div>
            )}

            {/* Movements */}
            <div className="flex flex-col gap-2">
              {movements.map((m, i) => (
                <div key={i} className="border border-zinc-800 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500">{m.section}</span>
                    <span className="text-xs text-zinc-600">{m.implement}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{m.movement}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {[m.sets && `${m.sets} sets`, m.reps, m.weight].filter(Boolean).join(' · ')}
                  </p>
                  {m.notes && m.notes !== '—' && (
                    <p className="text-xs text-zinc-600 mt-1 italic">{m.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}