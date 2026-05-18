import { useState } from 'react'

const PROGRAM = [
  {
    day: 1,
    name: 'Med KB Flow + Mobility',
    arc: 'Gohan: Awakening Flow',
    effort: '★★★☆☆',
    focus: 'Flow • Rotation • Mobility',
    movements: [
      { section: 'WARM-UP', movement: 'Rope Flow — Underhand / Overhand', implement: 'None', sets: '1', reps: '2 minutes', weight: 'Bodyweight' },
      { section: 'WARM-UP', movement: 'Hip Openers', implement: 'Bodyweight', sets: '1', reps: '1–2 minutes', weight: 'Bodyweight' },
      { section: 'WARM-UP', movement: 'Shoulder CARs', implement: 'Bodyweight', sets: '1', reps: '1–2 minutes', weight: 'Bodyweight' },
      { section: 'WARM-UP', movement: 'Light KB Deadlifts', implement: 'Kettlebell', sets: '1', reps: '10 reps', weight: '20kg' },
      { section: 'EMOM BLOCK', movement: 'KB Swing → Clean → Press + Rotation', implement: 'Kettlebell', sets: '5', reps: 'Odd: 6 reps / side', weight: '20kg' },
      { section: 'EMOM BLOCK', movement: 'Slamball Deadlift Toss', implement: 'Slamball', sets: '5', reps: 'Even: 10 reps', weight: '35lbs' },
      { section: 'MONSTER SET', movement: 'Windmill', implement: 'Kettlebell', sets: '4', reps: '8 / side', weight: '20kg' },
      { section: 'MONSTER SET', movement: 'Single-Leg Deadlift', implement: 'Kettlebell', sets: '4', reps: '8 / side', weight: '20kg' },
      { section: 'MONSTER SET', movement: 'Slant Board Squat', implement: 'Bodyweight', sets: '4', reps: '8 reps', weight: 'Bodyweight' },
      { section: 'MONSTER SET', movement: 'Pushups', implement: 'Bodyweight', sets: '4', reps: '12–15 reps', weight: 'Bodyweight' },
      { section: 'FLOW BLOCK', movement: 'Mace 360s', implement: 'Macebell', sets: '3', reps: '8 reps', weight: '18lbs' },
      { section: 'FLOW BLOCK', movement: 'Sandbag Toss', implement: 'Sandbag', sets: '3', reps: '8 reps', weight: '60lbs' },
      { section: 'FLOW BLOCK', movement: 'Pushups', implement: 'Bodyweight', sets: '3', reps: '12–15 reps', weight: 'Bodyweight' },
      { section: 'FINISHER', movement: 'Farmer Carry', implement: 'Kettlebell', sets: '3', reps: '60–90 ft', weight: '2x 20kgs' },
      { section: 'FINISHER', movement: 'Pull-Ups', implement: 'Pull-Up Bar', sets: '3', reps: '6–8 reps', weight: 'Bodyweight' },
      { section: 'FINISHER', movement: 'Dips', implement: 'Bodyweight', sets: '3', reps: '6–8 reps', weight: 'Bodyweight' },
    ]
  },
  {
    day: 2,
    name: 'Machine Hypertrophy',
    arc: 'Gohan: Body Forging',
    effort: '★★★☆☆',
    focus: 'Muscle Building',
    movements: [
      { section: 'WARM-UP', movement: 'Machine Warm-Up', implement: 'Machine', sets: '1', reps: '10 reps', weight: 'Light' },
      { section: 'WARM-UP', movement: 'Band Shoulder Warm-Up', implement: 'Bands', sets: '1', reps: '10 reps', weight: 'Light' },
      { section: 'CIRCUIT', movement: 'Hammer Strength Chest Press', implement: 'Machine', sets: '4', reps: '8–10 reps', weight: 'Moderate' },
      { section: 'CIRCUIT', movement: 'Seated Cable Row', implement: 'Machine', sets: '4', reps: '8–10 reps', weight: 'Moderate' },
      { section: 'CIRCUIT', movement: 'Lat Pulldown', implement: 'Machine', sets: '4', reps: '8–10 reps', weight: 'Moderate' },
      { section: 'CIRCUIT', movement: 'Leg Press', implement: 'Machine', sets: '4', reps: '8–10 reps', weight: 'Moderate' },
      { section: 'CIRCUIT', movement: 'Leg Extension', implement: 'Machine', sets: '3', reps: '8–10 reps', weight: 'Moderate' },
      { section: 'CIRCUIT', movement: 'Leg Curl', implement: 'Machine', sets: '3', reps: '8–10 reps', weight: 'Moderate' },
      { section: 'CIRCUIT', movement: 'Hip Abductor / Adductor', implement: 'Machine', sets: '3', reps: '15 reps', weight: 'Moderate' },
      { section: 'FINISHER', movement: 'Cable Laterals', implement: 'Machine', sets: '2–3', reps: '8–12 reps', weight: 'Light' },
      { section: 'FINISHER', movement: 'Rope Pressdowns', implement: 'Machine', sets: '2–3', reps: '10–12 reps', weight: 'Moderate' },
      { section: 'FINISHER', movement: 'Cable Curls', implement: 'Machine', sets: '2–3', reps: '10–12 reps', weight: 'Moderate' },
    ]
  },
  {
    day: 3,
    name: 'Heavy KB Strength',
    arc: 'Gohan: Controlled Power',
    effort: '★★★★☆',
    focus: 'Strength • Power',
    movements: [
      { section: 'WARM-UP', movement: 'Light Swings', implement: 'Kettlebell', sets: '1', reps: '10 reps', weight: '20kg' },
      { section: 'WARM-UP', movement: 'Rope Flow', implement: 'None', sets: '1', reps: '2 minutes', weight: 'Bodyweight' },
      { section: 'WARM-UP', movement: 'Hip Hinge Drills', implement: 'Bodyweight', sets: '1', reps: '10 reps', weight: 'Bodyweight' },
      { section: 'EMOM BLOCK', movement: 'Heavy KB Cleans', implement: 'Kettlebell', sets: '4', reps: 'Minute 1: 5 reps', weight: '32kg' },
      { section: 'EMOM BLOCK', movement: 'KB Front Rack Squats', implement: 'Kettlebell', sets: '4', reps: 'Minute 2: 5 reps', weight: '32kg' },
      { section: 'EMOM BLOCK', movement: 'Heavy Swings', implement: 'Kettlebell', sets: '4', reps: 'Minute 3: 10 reps', weight: '32kg' },
      { section: 'STRENGTH BLOCK', movement: 'Single-Leg Deadlift', implement: 'Kettlebell', sets: '4', reps: '6 / side', weight: '32kg' },
      { section: 'STRENGTH BLOCK', movement: 'Bent-Over KB Row', implement: 'Kettlebell', sets: '4', reps: '8–10 reps', weight: '32kg' },
      { section: 'FINISHER', movement: 'Goblet Squat', implement: 'Kettlebell', sets: 'AMRAP', reps: '5 reps', weight: '24kg' },
      { section: 'FINISHER', movement: 'Push Press', implement: 'Kettlebell', sets: 'AMRAP', reps: '5 reps', weight: '24kg' },
      { section: 'FINISHER', movement: 'Plank Drag-Through', implement: 'Sandbag', sets: 'AMRAP', reps: '5 reps', weight: '16–20kg' },
    ]
  },
  {
    day: 4,
    name: 'Active Recovery',
    arc: 'Gohan: Spirit Regeneration',
    effort: '★★☆☆☆',
    focus: 'Mobility • Recovery',
    movements: [
      { section: 'RECOVERY', movement: 'Rope Flow', implement: 'None', sets: '1', reps: '10–15 minutes', weight: 'Bodyweight' },
      { section: 'FLOW BLOCK', movement: 'Mace 360s', implement: 'Macebell', sets: '4', reps: '10 reps', weight: '20lbs' },
      { section: 'FLOW BLOCK', movement: 'Clubbell Circles', implement: 'Clubbell', sets: '4', reps: '10 reps', weight: '15lbs' },
      { section: 'RECOVERY', movement: 'Mobility Flow', implement: 'Bodyweight', sets: '1', reps: '10 minutes', weight: 'Bodyweight' },
    ]
  },
  {
    day: 5,
    name: 'Traditional Strength',
    arc: 'Gohan: Super Saiyan Resolve',
    effort: '★★★★★',
    focus: 'High-Intensity Strength',
    movements: [
      { section: 'WARM-UP', movement: 'Mobility Flow', implement: 'None', sets: '1', reps: '2 minutes', weight: 'Bodyweight' },
      { section: 'STRENGTH BLOCK', movement: 'Back Squat', implement: 'Barbell', sets: '6', reps: '2x8 / 2x5 / 2x2', weight: '135 / 185 / 225lbs' },
      { section: 'STRENGTH BLOCK', movement: 'Deadlift', implement: 'Barbell', sets: '5', reps: '10–12 reps', weight: 'Heavy' },
      { section: 'STRENGTH BLOCK', movement: 'Pendlay Row', implement: 'Barbell', sets: '4', reps: '8–10 reps', weight: 'Heavy' },
      { section: 'STRENGTH BLOCK', movement: 'Bench Press', implement: 'Barbell', sets: '4', reps: '8–10 reps (1¼)', weight: 'Heavy' },
      { section: 'FINISHER', movement: 'Bicep Curl', implement: 'Dumbbell', sets: '4', reps: '8 reps', weight: 'Moderate–Heavy' },
      { section: 'FINISHER', movement: 'Tricep Extension', implement: 'EZ-Bar', sets: '4', reps: '8 reps', weight: 'Moderate–Heavy' },
    ]
  },
  {
    day: 6,
    name: 'Ruck Day',
    arc: 'Gohan: Endurance of the Wilderness',
    effort: '★★☆☆☆',
    focus: 'Endurance • Aerobic Conditioning',
    movements: [
      { section: 'RECOVERY', movement: 'Yoga Flow', implement: 'Bodyweight', sets: '1', reps: '10 minutes', weight: 'Bodyweight' },
      { section: 'ENDURANCE', movement: 'Ruck Walk', implement: 'Weighted Pack', sets: '1', reps: '2–3 miles', weight: '30–45lb Pack' },
    ]
  },
]

const SECTION_COLORS = {
  'WARM-UP': 'text-yellow-500',
  'EMOM BLOCK': 'text-orange-400',
  'MONSTER SET': 'text-blue-400',
  'FLOW BLOCK': 'text-purple-400',
  'FINISHER': 'text-red-400',
  'STRENGTH BLOCK': 'text-white',
  'CIRCUIT': 'text-green-400',
  'RECOVERY': 'text-zinc-400',
  'ENDURANCE': 'text-cyan-400',
}

export default function ProgramModule() {
  const [selectedDay, setSelectedDay] = useState(0)
  const day = PROGRAM[selectedDay]

  return (
    <div className="flex flex-col gap-6">

      {/* Day selector */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {PROGRAM.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              selectedDay === i
                ? 'border-white bg-zinc-800'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
            }`}
          >
            <p className="text-xs text-zinc-500 mb-1">Day {d.day}</p>
            <p className="text-sm font-medium text-white leading-snug">{d.name}</p>
            <p className="text-xs text-zinc-600 mt-1">{d.effort}</p>
          </button>
        ))}
      </div>

      {/* Day detail */}
      <div className="border border-zinc-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{day.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{day.arc}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white">{day.effort}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{day.focus}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {day.movements.map((m, i) => (
            <div key={i} className="border border-zinc-800 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${SECTION_COLORS[m.section] || 'text-zinc-500'}`}>
                  {m.section}
                </span>
                <span className="text-xs text-zinc-600">{m.implement}</span>
              </div>
              <p className="text-sm font-medium text-white">{m.movement}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {[m.sets && `${m.sets} sets`, m.reps, m.weight].filter(Boolean).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}