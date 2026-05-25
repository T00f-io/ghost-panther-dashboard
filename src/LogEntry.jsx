import { useState } from 'react'
import { supabase } from './supabaseClient'

const ARC_OPTIONS = ['Controlled Power', 'Awakening Flow', 'Super Saiyan Resolve', 'Spirit Regeneration']
const TYPE_OPTIONS = ['Functional Strength Training', 'Strength Training', 'Recovery', 'Ruck', 'NEAT', 'Conditioning']
const FOCUS_OPTIONS = [
  'Heavy KB Strength',
  'Barbell Strength',
  'Axel Bar Strength',
  'Sandbag Strength',
  'Machine Hypertrophy',
  'Traditional Strength',
  'Med KB Flow + Mobility',
  'Macebell / Clubbell Flow',
  'Functional Circuit',
  'Mixed Implement',
  'Ruck',
  'NEAT -- Active Family Day',
  'NEAT -- Solo Activity',
  'Conditioning',
  'Active Recovery',
  'Mobility Focus',
  'Spirit Regen',
  'Other',
]

export default function LogEntry({ user, onSuccess }) {
  const [rawText, setRawText] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [arc, setArc] = useState('Controlled Power')
  const [workoutType, setWorkoutType] = useState('Functional Strength Training')
  const [focus, setFocus] = useState('Heavy KB Strength')
  const [aiCategorize, setAiCategorize] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  async function handleSubmit() {
    if (!rawText.trim() || !sessionDate) {
      setStatus('Please enter a date and your workout notes.')
      return
    }

    setLoading(true)
    setStatus(null)

    const categorizationInstruction = aiCategorize
      ? `Based on the raw notes, assign the most appropriate workout_type from this list: ${TYPE_OPTIONS.join(', ')}. And assign the most appropriate focus from this list: ${FOCUS_OPTIONS.join(', ')}. Use your best judgment based on the movements and context described.`
      : `Use these exact values -- workout_type: "${workoutType}", focus: "${focus}". Do not change them.`

    const prompt = `You are a workout log parser for an athlete named ${user.name}. Parse the raw training notes into structured JSON.

Athlete profile:
- Name: ${user.name}, Age: ${user.age}, Tampa FL
- ${user.profile}
- Known flags: ${user.flags}

Logging rules:
- Only add journal notes where ${user.name} provides feedback (pain, tightness, difficulty, ease, observations) -- do not editorialize on every movement
- Flag any pain, asymmetry, or joint issues clearly in the notes field
- If Apple Watch data is included (time, active cal, total cal, avg HR, peak HR, effort, distance) capture it in the session notes
- Be direct and concise -- no fluff
- CRITICAL: Only parse movements explicitly mentioned in the raw notes below. Do not add, infer, or invent any movements not directly stated. If a movement is not in the notes, it does not exist.

Categorization instruction:
${categorizationInstruction}

Return ONLY a valid JSON object with this exact structure, no explanation, no markdown, no code blocks:

{
  "workout_type": "string",
  "focus": "string",
  "notes": "string — session summary including any Apple Watch stats, flags, and meaningful observations. Direct and concise.",
  "movements": [
    {
      "section": "string — superset or block label e.g. SUPERSET A",
      "movement": "string — exercise name",
      "implement": "string — equipment used",
      "sets": "string — number of sets",
      "reps": "string — reps performed",
      "weight": "string — weight used",
      "notes": "string — only include if ${user.name} provided feedback on this movement, otherwise leave empty"
    }
  ]
}

Raw training notes:
${rawText}`

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
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          date: sessionDate,
          arc_name: arc,
          workout_type: parsed.workout_type,
          focus: parsed.focus,
          effort: '',
          notes: parsed.notes,
          user_slug: user.slug,
        })
        .select()
        .single()

      if (sessionError) throw new Error(sessionError.message)

      const movements = parsed.movements.map(m => ({
        session_id: sessionData.id,
        section: m.section,
        movement: m.movement,
        implement: m.implement,
        sets: m.sets,
        reps: m.reps,
        weight: m.weight,
        notes: m.notes,
        user_slug: user.slug,
      }))

      const { error: movError } = await supabase
        .from('workout_movements')
        .insert(movements)

      if (movError) throw new Error(movError.message)

      await supabase.from('raw_logs').insert({
        raw_text: rawText,
        session_date: sessionDate,
        parsed: true,
        user_slug: user.slug,
      })

      setStatus('success')
      setRawText('')
      setSessionDate('')
      if (onSuccess) onSuccess()

    } catch (err) {
      console.error(err)
      setStatus('Error parsing workout. Check console for details.')
    }

    setLoading(false)
  }

  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <h2 className="text-lg font-bold text-white mb-1">Log a Workout</h2>
      <p className="text-xs text-zinc-500 mb-4">Logging for <span className="text-white">{user?.name}</span></p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Arc</label>
          <select
            value={arc}
            onChange={e => setArc(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
          >
            {ARC_OPTIONS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>

        {/* AI categorize toggle */}
        <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
          <input
            type="checkbox"
            id="aiCategorize"
            checked={aiCategorize}
            onChange={e => setAiCategorize(e.target.checked)}
            className="w-4 h-4 accent-white"
          />
          <label htmlFor="aiCategorize" className="text-sm text-zinc-300 cursor-pointer">
            Let Claude assign workout type and focus based on my notes
          </label>
        </div>

        {/* Manual dropdowns -- greyed out when AI categorize is on */}
        {!aiCategorize && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Workout Type</label>
              <select
                value={workoutType}
                onChange={e => setWorkoutType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Focus</label>
              <select
                value={focus}
                onChange={e => setFocus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                {FOCUS_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Raw Workout Notes</label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={10}
            placeholder="Paste your raw Drafts notes here. Include Apple Watch stats if available..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Parsing and saving...' : 'Log Workout'}
        </button>

        {status === 'success' && <p className="text-sm text-green-400">Workout saved successfully.</p>}
        {status && status !== 'success' && <p className="text-sm text-red-400">{status}</p>}
      </div>
    </div>
  )
}