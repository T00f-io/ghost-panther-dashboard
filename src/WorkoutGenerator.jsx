import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'

const TIMES = ['20 min', '30 min', '45 min', '60 min', '90 min']
const FOCUSES = ['Strength', 'Power', 'Mobility', 'Recovery', 'Conditioning', 'Hypertrophy', 'Flow']
const EFFORTS = ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★']

export default function WorkoutGenerator() {
  const [movements, setMovements] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [workout, setWorkout] = useState(null)

  const [time, setTime] = useState('45 min')
  const [focus, setFocus] = useState('Strength')
  const [effort, setEffort] = useState('★★★☆☆')
  const [location, setLocation] = useState('home')

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

    const homeEquipment = equipment
      .filter(e => e.location === 'home')
      .map(e => `${e.name}${e.weights ? ' (' + e.weights + ')' : ''}${e.notes ? ' -- ' + e.notes : ''}`)
      .join('\n')

    const commercialEquipment = `Full commercial gym -- all machines, cables, barbells, dumbbells (5-120lb), pull-up bars, cable crossover, leg press, lat pulldown, seated row, leg curl, leg extension, hip abductor/adductor, incline/flat/decline bench`

    const movementList = movements
      .map(m => `${m.pattern} | ${m.implement} | ${m.movement} | Exertion: ${m.exertion}/5 | Purpose: ${m.purpose}`)
      .join('\n')

    const prompt = `You are JC's dedicated training coach. Design a complete workout session based on the parameters below.

Athlete profile:
- Age: 40, Tampa FL
- Program: Gohan Training Arc -- Gohan: Controlled Power
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

Available movements to draw from:
${movementList}

Design a complete workout with clearly labeled sections (WARM-UP, main blocks, FINISHER or COOL-DOWN as appropriate). For each movement include:
- Section label
- Movement name
- Implement
- Sets
- Reps or duration
- Suggested weight based on available equipment
- One brief coaching cue

Format the output as clean markdown with bold section headers. Keep it practical -- this is a session JC will execute immediately. Account for the time constraint. Do not include movements that require equipment not available at the selected location. Do not program axial spinal loading. Include at least one decompression or mobility movement.`

    try {
      const response = await fetch('https://gpp-api-worker.t00f-io.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      setWorkout(data.content?.[0]?.text || 'No workout generated.')
    } catch (err) {
      setWorkout('Error generating workout. Please try again.')
    }
    setGenerating(false)
  }

  if (loading) return <p className="text-zinc-500">Loading...</p>

  return (
    <div className="flex flex-col gap-6">

      {/* Config panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Build a Workout</h2>

        <div className="flex flex-col gap-4">

          {/* Location */}
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

          {/* Time */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {TIMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    time === t ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Focus</label>
            <div className="flex gap-2 flex-wrap">
              {FOCUSES.map(f => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    focus === f ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Effort */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Effort</label>
            <div className="flex gap-2 flex-wrap">
              {EFFORTS.map(e => (
                <button
                  key={e}
                  onClick={() => setEffort(e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    effort === e ? 'bg-white text-zinc-950' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {e}
                </button>
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

      {/* Generated workout */}
      {workout && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-sm text-zinc-300 leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown>{workout}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}