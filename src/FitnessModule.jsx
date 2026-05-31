import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'
import ArcConfig from './ArcConfig'

function InjuryBanner({ user }) {
  const [activeInjuries, setActiveInjuries] = useState([])

  useEffect(() => {
    async function fetchInjuries() {
      const { data } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_slug', user.slug)
        .in('status', ['active', 'monitoring'])
        .order('date', { ascending: false })
      if (data) setActiveInjuries(data)
    }
    fetchInjuries()
  }, [user])

  if (activeInjuries.length === 0) return null

  const SEVERITY_COLORS = {
    'Mild': 'border-yellow-700 bg-yellow-950',
    'Moderate': 'border-orange-700 bg-orange-950',
    'Severe': 'border-red-700 bg-red-950',
  }

  const SEVERITY_TEXT = {
    'Mild': 'text-yellow-400',
    'Moderate': 'text-orange-400',
    'Severe': 'text-red-400',
  }

  return (
    <div className="flex flex-col gap-2">
      {activeInjuries.map((injury, i) => (
        <div key={i} className={`border rounded-xl px-5 py-3 flex items-center justify-between ${SEVERITY_COLORS[injury.severity]}`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">🩹</span>
            <div>
              <p className={`text-sm font-medium ${SEVERITY_TEXT[injury.severity]}`}>
                {injury.body_area} -- {injury.severity}
              </p>
              {injury.notes && (
                <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-md">{injury.notes}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              {new Date(injury.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className={`text-xs ${injury.status === 'active' ? 'text-red-400' : 'text-yellow-400'}`}>
              {injury.status}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function InsightPanel({ session, movements, user }) {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generateInsight() {
    setLoading(true)
    setInsight(null)

    const movementSummary = movements.map(m =>
      `${m.section} -- ${m.movement} (${m.implement}) ${m.sets} sets x ${m.reps} @ ${m.weight}${m.notes && m.notes !== '—' ? ' | Note: ' + m.notes : ''}`
    ).join('\n')

    const prompt = `You are ${user.name}'s dedicated training coach and journal analyst. Your role is critical-thinking expert advisor -- skeptical by default, research-based, results-oriented. Do not aim to agree or validate. Challenge flawed thinking directly using logic, evidence, and best practices. No fluff, filler, or performative language. Do not open with meta commentary or announce intent. Be clear, concise, and direct.

Athlete profile:
- Name: ${user.name}, Age: ${user.age}, Tampa FL
- ${user.profile}
- Known flags: ${user.flags}

Session date: ${session.date}
Arc: ${session.arc_name}
Type: ${session.workout_type || ''}
Focus: ${session.focus || ''}

Session notes:
${session.notes || 'No session note logged.'}

Movements logged:
${movementSummary}

Analyze this session with three sections:

**PERFORMANCE**
What stood out, what was strong, what was off. Reference specific movements and loads. Only note what is meaningful -- do not editorialize every movement.

**FLAGS**
Any injury signals, compensation patterns, or recovery concerns. Cross-reference known flags above. If nothing flagged, say so directly.

**RECOMMENDATIONS**
One or two specific, actionable items for the next session. No generic advice.

Keep post-analysis commentary tight -- only what is actionable or meaningfully observed. If something is incomplete or unclear from the log, say so instead of filling gaps.`

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

export default function FitnessModule({ user }) {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [arcKey, setArcKey] = useState(0)
  const [arcFilter, setArcFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    setSelected(null)

    const { data: sessionData } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_slug', user.slug)
      .order('date', { ascending: false })

    const { data: movementData } = await supabase
      .from('workout_movements')
      .select('implement')
      .eq('user_slug', user.slug)

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

      const lastDate = sessionData[0]
        ? new Date(sessionData[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—'

      setStats({
        totalSessions: sessionData.length,
        topImplement,
        lastSession: lastDate,
      })
    }
    setLoading(false)
  }

  async function handleSelect(session) {
    setSelected(session)
    const { data } = await supabase
      .from('workout_movements')
      .select('*')
      .eq('session_id', session.id)
    if (data) setMovements(data)
  }

  if (loading) return <p className="text-zinc-500">Loading sessions...</p>

  const arcs = ['All', ...new Set(sessions.map(s => s.arc_name).filter(Boolean))]
  const types = ['All', ...new Set(sessions.map(s => s.workout_type).filter(Boolean))]

  const filtered = sessions.filter(s => {
    const matchArc = arcFilter === 'All' || s.arc_name === arcFilter
    const matchType = typeFilter === 'All' || s.workout_type === typeFilter
    return matchArc && matchType
  })

  return (
    <div className="flex flex-col gap-6">

      <ArcConfig key={arcKey} user={user} onUpdate={() => setArcKey(k => k + 1)} />

      <InjuryBanner user={user} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Sessions" value={stats.totalSessions} />
        <StatCard label="Last Session" value={stats.lastSession} />
        <StatCard label="Top Implement" value={stats.topImplement} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          {arcs.map(a => (
            <button
              key={a}
              onClick={() => setArcFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                arcFilter === a ? 'bg-white text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-white text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1 flex flex-col gap-3">
          {filtered.length === 0 && (
            <p className="text-zinc-600 text-sm">No sessions match your filters.</p>
          )}
          {filtered.map((s) => (
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
              {s.focus && <p className="text-xs text-zinc-500 mt-0.5">{s.focus}</p>}
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
              <h3 className="text-lg font-bold text-white mb-1">{selected.arc_name}</h3>
              <div className="flex gap-2 mb-4">
                {selected.workout_type && <span className="text-xs text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">{selected.workout_type}</span>}
                {selected.focus && <span className="text-xs text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">{selected.focus}</span>}
              </div>

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

              <InsightPanel session={selected} movements={movements} user={user} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}