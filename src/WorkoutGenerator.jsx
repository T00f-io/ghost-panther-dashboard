import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'

const TIMES = ['20 min', '30 min', '45 min', '60 min', '90 min']
const FOCUSES = ['Strength', 'Power', 'Mobility', 'Recovery', 'Conditioning', 'Hypertrophy', 'Flow']
const EFFORTS = ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★']
const ARC_OPTIONS = ['Controlled Power', 'Awakening Flow', 'Super Saiyan Resolve', 'Spirit Regeneration']
const TYPE_OPTIONS = ['Functional Strength Training', 'Strength Training', 'Recovery', 'Ruck', 'NEAT', 'Conditioning']
const FOCUS_OPTIONS = [
  'Heavy KB Strength', 'Barbell Strength', 'Axel Bar Strength', 'Sandbag Strength',
  'Machine Hypertrophy', 'Traditional Strength', 'Med KB Flow + Mobility',
  'Macebell / Clubbell Flow', 'Functional Circuit', 'Mixed Implement', 'Ruck',
  'NEAT -- Active Family Day', 'NEAT -- Solo Activity', 'Conditioning',
  'Active Recovery', 'Mobility Focus', 'Spirit Regen', 'Other'
]

export default function WorkoutGenerator({ user }) {
  const [movements, setMovements] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [logging, setLogging] = useState(false)
  const [workout, setWorkout] = useState(null)
  const [parsedWorkout, setParsedWorkout] = useState(null)
  const [logStatus, setLogStatus] = useState(null)

  const [time, setTime] = useState('45 min')
  const [focus, setFocus] = useState('Strength')
  const [effort, setEffort] = useState('★★★☆☆')
  const [location, setLocation] = useState('home')
  const [arc, setArc] = useState('Controlled Power')
  const [workoutType, setWorkoutType] = useState('Functional Strength Training')
  const [workoutFocus, setWorkoutFocus] = useState('Heavy KB Strength')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function fetchData() {
      const { data: movData } = await supabase.from('movements').select('*')
      const { data: equData } = await supabase.from('equipment').select('*')
      if (movData) setMovements(movData)
      if (equData) setEquipment(equData)
      setLoading(false)
    }
    fetchData()
  }, [])

  async function generateWorkout() {
    setGenerating(true)
    setWorkout(null)
    setParsedWorkout(null)
    setLogStatus(null)

    const homeEquipment = equipment
      .filter(e => e.location === 'home')
      .map(e => `${e.name}${e.weights ? ' (' + e.weights + ')' : ''}${e.notes ? ' -- ' + e.notes : ''}`)
      .join('\n')

    const commercialEquipment = `Full commercial gym -- all machines, cables, barbells, dumbbells (5-120lb), pull-up bars, cable crossover, leg press, lat pulldown, seated row, leg curl, leg extension, incline/flat/decline bench`

    const movementList = movements
      .map(m => `${m.pattern} | ${m.implement} | ${m.movement} | Exertion: ${m.exertion}/5 | Purpose: ${m.purpose}`)
      .join('\n')

    const prompt = `You are JC's dedicated training coach. Design a complete workout session based on the parameters below. Return TWO things separated by "---JSON---":

PART 1: A clean markdown workout plan for display.
PART 2: A JSON object for logging (after the ---JSON--- separator).

Athlete profile:
- Age: 40, Tampa FL
- Program: Gohan Training Arc -- ${arc}
- Primary goals: Fat loss to 185 lbs by October 2026, postural correction, upper chest development, left hip complex strengthening, longevity
- Known flags: L5-S1 history (asymptomatic), anterior pelvic tilt, forward head posture, thoracic kyphosis, left hamstring tightness, bilateral shoulder impingement history (currently resolved), recurring bilateral knee observations under load, left hip flexor weakness confirmed
- No axial spinal loading. Include decompression and mobility work in every session.

Session parameters:
- Duration: ${time}
- Focus: ${focus}
- Effort: ${effort}
- Location: ${location === 'home' ? 'Home Gym' : 'Commercial Gym'}

Available equipment:
${location === 'home' ? homeEquipment : commercialEquipment}

Available movements:
${movementList}

For PART 1: Clean markdown with bold section headers, movement name, implement, sets, reps, weight, and one coaching cue per movement.

For PART 2 (after ---JSON---): Return ONLY valid JSON, no markdown, no code blocks:
{
  "notes": "string -- brief session summary",
  "movements": [
    {
      "section": "string",
      "movement": "string",
      "implement": "string",
      "sets": "string",
      "reps": "string",
      "weight": "string",
      "notes": "string"
    }
  ]
}`

    try {
      const response = await fetch('https://gpp-api-worker.t00f-io.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const fullText = data.content?.[0]?.text || ''
      console.log('Worker response:', JSON.stringify(data))

      const parts = fullText.split('---JSON---')
      setWorkout(parts[0].trim())

      if (parts[1]) {
        try {
          const clean = parts[1].replace(/```json|```/g, '').trim()
          setParsedWorkout(JSON.parse(clean))
        } catch (jsonErr) {
          console.log('JSON parse failed:', jsonErr.message)
          console.log('Raw JSON text:', parts[1])
          setParsedWorkout(null)
        }
      }
    } catch (err) {
      console.log('Error detail:', err.message, err.stack)
      setWorkout('Error generating workout: ' + err.message)
    }
    setGenerating(false)
  }
  async function handleLogWorkout() {
    if (!parsedWorkout) return
    setLogging(true)
    setLogStatus(null)

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          date: sessionDate,
          arc_name: arc,
          workout_type: workoutType,
          focus: workoutFocus,
          effort: effort,
          notes: parsedWorkout.notes,
          user_slug: user.slug,
        })
        .select()
        .single()

      if (sessionError) throw new Error(sessionError.message)

      const movementsToInsert = parsedWorkout.movements.map(m => ({
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
        .insert(movementsToInsert)

      if (movError) throw new Error(movError.message)

      setLogStatus('success')
    } catch (err) {
      setLogStatus('Error logging workout: ' + err.message)
    }
    setLogging(false)
  }

  if (loading) return <p className="text-zinc-500">Loading...</p>

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Build a Workout</h2>

        <div className="flex flex-col gap-4">

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Location</label>
            <div className="flex gap-2">
              {['home', 'commercial'].map(l => (
                <button
                  key={l}
                  onClick={() => setLocation(l)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location === l ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {l === 'home' ? '🏠 Home Gym' : '🏋️ Commercial Gym'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {TIMES.map(t => (
                <button key={t} onClick={() => setTime(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    time === t ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Focus</label>
            <div className="flex gap-2 flex-wrap">
              {FOCUSES.map(f => (
                <button key={f} onClick={() => setFocus(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    focus === f ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >{f}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Effort</label>
            <div className="flex gap-2 flex-wrap">
              {EFFORTS.map(e => (
                <button key={e} onClick={() => setEffort(e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    effort === e ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >{e}</button>
              ))}
            </div>
          </div>

          <button
            onClick={generateWorkout}
            disabled={generating}
            className="w-full py-3 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {generating ? 'Building your workout...' : '⚡ Generate Workout'}
          </button>
        </div>
      </div>

      {workout && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <div className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed mb-6">
            <ReactMarkdown>{workout}</ReactMarkdown>
          </div>

          {parsedWorkout && (
            <div className="border-t border-zinc-800 pt-5 flex flex-col gap-3">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Log This Workout</p>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Arc</label>
                  <select
                    value={arc}
                    onChange={e => setArc(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {ARC_OPTIONS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                  <select
                    value={workoutType}
                    onChange={e => setWorkoutType(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Focus</label>
                  <select
                    value={workoutFocus}
                    onChange={e => setWorkoutFocus(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {FOCUS_OPTIONS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleLogWorkout}
                disabled={logging || logStatus === 'success'}
                className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {logging ? 'Logging...' : logStatus === 'success' ? '✓ Logged to Journal' : '➕ Log This Workout'}
              </button>
              {logStatus === 'success' && (
                <p className="text-sm text-green-400">Workout saved to your Journal.</p>
              )}
              {logStatus && logStatus !== 'success' && (
                <p className="text-sm text-red-400">{logStatus}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}