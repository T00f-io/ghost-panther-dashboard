import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'

export default function InsightsModule() {
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('date', { ascending: true })

      const { data: movementData } = await supabase
        .from('workout_movements')
        .select('*')

      if (sessionData) setSessions(sessionData)
      if (movementData) setMovements(movementData)
      setLoading(false)
    }
    fetchData()
  }, [])

  async function generateCrossSessionInsight() {
    setGenerating(true)
    setInsight(null)

    const sessionSummaries = sessions.map(s => {
      const sessionMovements = movements
        .filter(m => m.session_id === s.id)
        .map(m => `${m.movement} (${m.implement}) ${m.sets}x${m.reps} @ ${m.weight}${m.notes ? ' | ' + m.notes : ''}`)
        .join(', ')

      return `${s.date} -- ${s.arc_name}
Notes: ${s.notes || 'None'}
Movements: ${sessionMovements}`
    }).join('\n\n')

    const prompt = `You are JC's dedicated training coach and journal analyst. Your role is critical-thinking expert advisor -- skeptical by default, research-based, results-oriented. Do not aim to agree or validate. Challenge flawed thinking directly using logic, evidence, and best practices. No fluff, filler, or performative language. Do not open with meta commentary or announce intent. Be clear, concise, and direct.

Athlete profile:
- Age: 40, Tampa FL
- Program: Gohan Training Arc (90 days, ends July 9, 2026)
- Current phase: Gohan: Controlled Power
- Training style: Functional strength, KB, sandbag, macebell, clubbell, axel bar, barbell, bodybuilding accessories
- Primary goals: Fat loss to 185 lbs by October 2026, postural correction, upper chest development, left hip complex strengthening, longevity
- Known flags: L5-S1 history (asymptomatic), anterior pelvic tilt, forward head posture, thoracic kyphosis, left hamstring tightness, bilateral shoulder impingement history (currently resolved), recurring bilateral knee observations under load, left hip flexor weakness confirmed

Full training history (${sessions.length} sessions):

${sessionSummaries}

Analyze the full training history and provide a macro coaching report with these sections:

**ARC SUMMARY**
Overall assessment of this training arc so far. Volume, consistency, progression. What the data actually shows -- not what JC might want to hear.

**INJURY & FLAG TRENDS**
Patterns across sessions. Which flags are recurring, which have resolved, which are being ignored. Be specific -- reference dates and movements.

**STRENGTH & MOVEMENT PATTERNS**
What is being overtrained, undertrained, or missing entirely relative to the stated goals. Reference specific movements and frequencies.

**RECOMMENDATIONS FOR REMAINING ARC**
Two to three specific, prioritized actions for the remaining sessions. Tied directly to the goals and flag history above.

Keep it direct. Reference specific sessions and dates where relevant. If the data is incomplete or ambiguous, say so.`

    try {
      const response = await fetch('https://gpp-api-worker.t00f-io.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || 'No insight returned.'
      setInsight(text)
    } catch (err) {
      setInsight('Error generating insight. Please try again.')
    }
    setGenerating(false)
  }

  if (loading) return <p className="text-zinc-500">Loading data...</p>

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Cross-Session Analysis</h2>
        <p className="text-xs text-zinc-500 mb-4">AI coaching report across all {sessions.length} logged sessions in this arc.</p>
        <button
          onClick={generateCrossSessionInsight}
          disabled={generating}
          className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {generating ? 'Analyzing full arc...' : '⚡ Generate Arc Report'}
        </button>
      </div>

      {insight && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-sm text-zinc-300 leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      )}

    </div>
  )
}