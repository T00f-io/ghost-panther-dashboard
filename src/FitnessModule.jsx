import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'

function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function InsightPanel({ session, movements }) {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generateInsight() {
    setLoading(true)
    setInsight(null)

    const movementSummary = movements.map(m =>
      `${m.section} -- ${m.movement} (${m.implement}) ${m.sets} sets x ${m.reps} @ ${m.weight}${m.notes && m.notes !== '—' ? ' | Note: ' + m.notes : ''}`
    ).join('\n')

    const prompt = `You are a performance coach analyzing a training session for an athlete named JC. He is 40 years old, has a protected spinal history requiring decompression and mobility work, and is targeting fat loss to 185 lbs by October 2026. He trains primarily with kettlebells, macebells, clubbells, sandbags, and barbells.

Session date: ${session.date}
Arc: ${session.arc_name}

Session note:
${session.notes || 'No session note logged.'}

Movements logged:
${movementSummary}

Provide a concise analysis with three sections:
1. PERFORMANCE -- What stood out, what was strong, what was off
2. FLAGS -- Any injury signals, compensation patterns, or recovery concerns
3. RECOMMENDATIONS -- One or two specific actions for the next session

Keep it direct and coach-like. No fluff.`

    try {
      const response = await fetch('https://gpp-api-worker.t00f-io.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || 'No insight returned.'
      setInsight(text)
    } catch (err) {
      setInsight('Error generating insight. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="mt-4">
      <button
        onClick={generateInsight}
        disabled={loading}
        className="w-full py-2 px-4 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-white hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? 'Analyzing session...' : '⚡ Generate AI Insight'}
      </button>

      {insight && (
        <div className="mt-3 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-300 leading-relaxed prose prose-invert prose-xs max-w-none">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default function FitnessModule() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function fetchData() {
      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('date', { ascending: false })

      const { data: movementData } = await supabase
        .from('workout_movements')
        .select('implement')

      if (sessionData) {
        setSessions(sessionData)

        const implementCount = {}
        movementData?.forEach(({ implement }) => {
          if (implement && implement !== 'Bodyweight') {
            implementCount[implement] = (implementCount[implement] || 0) + 1
          }
        })
        const topImplement = Object.entries(implementCount)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

        const lastDate = new Date(sessionData[0]?.date + 'T00:00:00')
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        setStats({
          totalSessions: sessionData.length,
          topImplement,
          lastSession: lastDate,
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleSelect(session) {
    setSelected(session)
    const { data } = await supabase
      .from('workout_movements')
      .select('*')
      .eq('session_id', session.id)
    if (data) setMovements(data)
  }

  if (loading) return <p className="text-zinc-500">Loading sessions...</p>

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={stats.totalSessions} />
        <StatCard label="Last Session" value={stats.lastSession} />
        <StatCard label="Top Implement" value={stats.topImplement} />
        <StatCard label="Current Arc" value="Controlled Power" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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

              {selected.notes && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4 text-xs text-zinc-400 leading-relaxed">
                  {selected.notes}
                </div>
              )}

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

              <InsightPanel session={selected} movements={movements} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}