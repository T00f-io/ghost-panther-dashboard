import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function ArcHistory({ user }) {
  const [arcs, setArcs] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)

    const { data: arcData } = await supabase
      .from('arc_config')
      .select('*')
      .eq('user_slug', user.slug)
      .order('created_at', { ascending: false })

    const { data: sessionData } = await supabase
      .from('workout_sessions')
      .select('id, date, arc_name, workout_type, focus')
      .eq('user_slug', user.slug)
      .order('date', { ascending: false })

    if (arcData) setArcs(arcData)
    if (sessionData) setSessions(sessionData)
    setLoading(false)
  }

  async function handleComplete(arc) {
    await supabase
      .from('arc_config')
      .update({ status: 'completed', active: false })
      .eq('id', arc.id)
    fetchData()
  }

  if (loading) return <p className="text-zinc-500">Loading arc history...</p>

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Arc History</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{arcs.length} arcs logged for {user?.name}</p>
        </div>
      </div>

      {arcs.length === 0 && (
        <p className="text-zinc-600 text-sm">No arc history yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {arcs.map((arc, i) => {
          const arcSessions = sessions.filter(s => s.arc_name === arc.arc_name)
          const start = new Date(arc.start_date + 'T00:00:00')
          const end = new Date(start)
          end.setDate(end.getDate() + arc.duration_days)
          const today = new Date()
          const isEnded = today > end
          const daysIn = Math.round((today - start) / (1000 * 60 * 60 * 24))
          const progress = Math.min(100, Math.round((daysIn / arc.duration_days) * 100))

          return (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{arc.arc_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      arc.status === 'active'
                        ? 'border-green-700 text-green-400'
                        : 'border-zinc-700 text-zinc-500'
                    }`}>
                      {arc.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                    {isEnded && arc.status === 'active' && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-700 text-yellow-400">
                        Ended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' → '}
                    {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}{arc.duration_days} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{arcSessions.length}</p>
                  <p className="text-xs text-zinc-500">sessions</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2">
                <div
                  className="bg-white h-1.5 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-xs text-zinc-600">
                  {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-zinc-500">{progress}% complete</span>
                <span className="text-xs text-zinc-600">
                  {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(selected === i ? null : i)}
                  className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {selected === i ? 'Hide Sessions' : `View ${arcSessions.length} Sessions`}
                </button>
                {arc.status === 'active' && isEnded && (
                  <button
                    onClick={() => handleComplete(arc)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-700 hover:border-yellow-500 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>

              {/* Session list */}
              {selected === i && arcSessions.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {arcSessions.map((s, j) => (
                    <div key={j} className="border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </span>
                      <div className="flex gap-2">
                        {s.workout_type && (
                          <span className="text-xs text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">
                            {s.workout_type}
                          </span>
                        )}
                        {s.focus && (
                          <span className="text-xs text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">
                            {s.focus}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}