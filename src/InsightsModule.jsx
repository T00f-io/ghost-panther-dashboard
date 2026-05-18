import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'

export default function InsightsModule() {
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [arcInsight, setArcInsight] = useState(null)
  const [weekInsight, setWeekInsight] = useState(null)
  const [generatingArc, setGeneratingArc] = useState(false)
  const [generatingWeek, setGeneratingWeek] = useState(false)

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

  const COACH_PROFILE = `You are JC's dedicated training coach and journal analyst. Your role is critical-thinking expert advisor -- skeptical by default, research-based, results-oriented. Do not aim to agree or validate. Challenge flawed thinking directly using logic, evidence, and best practices. No fluff, filler, or performative language. Do not open with meta commentary or announce intent. Be clear, concise, and direct.

Athlete profile:
- Age: 40, Tampa FL
- Program: Gohan Training Arc (90 days, ends July 9, 2026)
- Current phase: Gohan: Controlled Power
- Training style: Functional strength, KB, sandbag, macebell, clubbell, axel bar, barbell, bodybuilding accessories
- Primary goals: Fat loss to 185 lbs by October 2026, postural correction, upper chest development, left hip complex strengthening, longevity
- Known flags: L5-S1 history (asymptomatic), anterior pelvic tilt, forward head posture, thoracic kyphosis, left hamstring tightness, bilateral shoulder impingement history (currently resolved), recurring bilateral knee observations under load, left hip flexor weakness confirmed`

  async function generateArcInsight() {
    setGeneratingArc(true)
    setArcInsight(null)

    const sessionSummaries = sessions.map(s => {
      const sessionMovements = movements
        .filter(m => m.session_id === s.id)
        .map(m => `${m.movement} (${m.implement}) ${m.sets}x${m.reps} @ ${m.weight}${m.notes ? ' | ' + m.notes : ''}`)
        .join(', ')
      return `${s.date} -- ${s.arc_name}\nNotes: ${s.notes || 'None'}\nMovements: ${sessionMovements}`
    }).join('\n\n')

    const prompt = `${COACH_PROFILE}

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
      setArcInsight(data.content?.[0]?.text || 'No insight returned.')
    } catch (err) {
      setArcInsight('Error generating insight. Please try again.')
    }
    setGeneratingArc(false)
  }

  async function generateWeekInsight() {
    setGeneratingWeek(true)
    setWeekInsight(null)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSessions = sessions.filter(s => new Date(s.date + 'T00:00:00') >= sevenDaysAgo)

    if (recentSessions.length === 0) {
      setWeekInsight('No sessions logged in the last 7 days.')
      setGeneratingWeek(false)
      return
    }

    const sessionSummaries = recentSessions.map(s => {
      const sessionMovements = movements
        .filter(m => m.session_id === s.id)
        .map(m => `${m.movement} (${m.implement}) ${m.sets}x${m.reps} @ ${m.weight}${m.notes ? ' | ' + m.notes : ''}`)
        .join(', ')
      return `${s.date} -- ${s.arc_name}\nNotes: ${s.notes || 'None'}\nMovements: ${sessionMovements}`
    }).join('\n\n')

    const prompt = `${COACH_PROFILE}

Last 7 days of training (${recentSessions.length} sessions):

${sessionSummaries}

Generate a weekly training summary with these sections:

**WEEK SUMMARY**
What got done this week. Volume, session count, session types. Direct assessment of whether this week moved the needle.

**FLAGS THIS WEEK**
Any injury signals, fatigue indicators, or compensation patterns from this week only. If nothing flagged, say so directly.

**READINESS ASSESSMENT**
Based on this week's load and recovery -- what is JC's likely readiness for the coming week? What should he prioritize or avoid?

**THIS WEEK'S FOCUS**
One or two specific priorities for the next 7 days tied to the current arc goals.

Keep it tight. This is a weekly check-in, not an arc review.`

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
      setWeekInsight(data.content?.[0]?.text || 'No insight returned.')
    } catch (err) {
      setWeekInsight('Error generating insight. Please try again.')
    }
    setGeneratingWeek(false)
  }

  if (loading) return <p className="text-zinc-500">Loading data...</p>

  return (
    <div className="flex flex-col gap-6">

      {/* Weekly report */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Weekly Summary</h2>
        <p className="text-xs text-zinc-500 mb-4">AI coaching report for the last 7 days.</p>
        <button
          onClick={generateWeekInsight}
          disabled={generatingWeek}
          className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {generatingWeek ? 'Analyzing this week...' : '📅 Generate Weekly Report'}
        </button>
      </div>

      {weekInsight && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-sm text-zinc-300 leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown>{weekInsight}</ReactMarkdown>
        </div>
      )}

      {/* Arc report */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Arc Report</h2>
        <p className="text-xs text-zinc-500 mb-4">AI coaching report across all {sessions.length} logged sessions in this arc.</p>
        <button
          onClick={generateArcInsight}
          disabled={generatingArc}
          className="w-full py-2 px-4 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-white hover:text-white transition-colors disabled:opacity-50"
        >
          {generatingArc ? 'Analyzing full arc...' : '⚡ Generate Arc Report'}
        </button>
      </div>

      {arcInsight && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-sm text-zinc-300 leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown>{arcInsight}</ReactMarkdown>
        </div>
      )}

    </div>
  )
}