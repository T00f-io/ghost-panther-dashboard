import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function LogEntry({ onSuccess }) {
  const [rawText, setRawText] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  async function handleSubmit() {
    if (!rawText.trim() || !sessionDate) {
      setStatus('Please enter a date and your workout notes.')
      return
    }

    setLoading(true)
    setStatus(null)

    const prompt = `You are a workout log parser. Convert the following raw training notes into structured JSON.

Return ONLY a valid JSON object with this exact structure, no explanation, no markdown, no code blocks:

{
  "arc_name": "string — the training arc name if mentioned, otherwise 'Controlled Power'",
  "workout_type": "string — brief description of session type",
  "effort": "string — effort rating if mentioned, otherwise ''",
  "focus": "string — training focus if mentioned, otherwise ''",
  "notes": "string — overall session summary or day notes",
  "movements": [
    {
      "section": "string — superset or block label e.g. SUPERSET A",
      "movement": "string — exercise name",
      "implement": "string — equipment used",
      "sets": "string — number of sets",
      "reps": "string — reps performed",
      "weight": "string — weight used",
      "notes": "string — any notes about this movement"
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

      // Insert session
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          date: sessionDate,
          arc_name: parsed.arc_name,
          workout_type: parsed.workout_type,
          effort: parsed.effort,
          focus: parsed.focus,
          notes: parsed.notes,
        })
        .select()
        .single()

      if (sessionError) throw new Error(sessionError.message)

      // Insert movements
      const movements = parsed.movements.map(m => ({
        session_id: sessionData.id,
        section: m.section,
        movement: m.movement,
        implement: m.implement,
        sets: m.sets,
        reps: m.reps,
        weight: m.weight,
        notes: m.notes,
      }))

      const { error: movError } = await supabase
        .from('workout_movements')
        .insert(movements)

      if (movError) throw new Error(movError.message)

      // Save raw log
      await supabase.from('raw_logs').insert({
        raw_text: rawText,
        session_date: sessionDate,
        parsed: true,
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
      <h2 className="text-lg font-bold text-white mb-4">Log a Workout</h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">
            Session Date
          </label>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">
            Raw Workout Notes
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={10}
            placeholder="Paste your raw Drafts notes here..."
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

        {status === 'success' && (
          <p className="text-sm text-green-400">Workout saved successfully.</p>
        )}
        {status && status !== 'success' && (
          <p className="text-sm text-red-400">{status}</p>
        )}
      </div>
    </div>
  )
}