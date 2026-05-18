import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const GOAL_WEIGHT = 185
const START_WEIGHT = 200

export default function WeightModule() {
  const [logs, setLogs] = useState([])
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true })
    if (data) setLogs(data)
    setLoading(false)
  }

  async function handleSave() {
    if (!weight || !date) {
      setStatus('Please enter a date and weight.')
      return
    }
    setSaving(true)
    setStatus(null)

    const { error } = await supabase
      .from('weight_logs')
      .upsert({ date, weight_lbs: parseFloat(weight), notes }, { onConflict: 'date' })

    if (error) {
      setStatus('Error saving. Please try again.')
    } else {
      setStatus('success')
      setWeight('')
      setNotes('')
      fetchLogs()
    }
    setSaving(false)
  }

  const chartData = logs.map((log, i) => {
    const window = logs.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((sum, l) => sum + parseFloat(l.weight_lbs), 0) / window.length
    return {
      date: new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(log.weight_lbs),
      avg: parseFloat(avg.toFixed(1)),
    }
  })

  const currentWeight = logs.length > 0 ? parseFloat(logs[logs.length - 1].weight_lbs) : null
  const lbsToGoal = currentWeight ? (currentWeight - GOAL_WEIGHT).toFixed(1) : null
  const lbsLost = currentWeight ? (START_WEIGHT - currentWeight).toFixed(1) : null

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Current</p>
          <p className="text-xl font-bold text-white">{currentWeight ? `${currentWeight} lbs` : '—'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Goal</p>
          <p className="text-xl font-bold text-white">{GOAL_WEIGHT} lbs</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">To Goal</p>
          <p className="text-xl font-bold text-white">{lbsToGoal ? `${lbsToGoal} lbs` : '—'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Lost</p>
          <p className="text-xl font-bold text-white">{lbsLost ? `${lbsLost} lbs` : '—'}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Weight Trend</p>
        {logs.length < 2 ? (
          <p className="text-zinc-600 text-sm">Log at least 2 entries to see your trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 11 }} width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <ReferenceLine y={GOAL_WEIGHT} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#22c55e', fontSize: 11 }} />
              <Line type="monotone" dataKey="weight" stroke="#52525b" strokeWidth={1} dot={{ fill: '#52525b', r: 3 }} name="Daily" />
              <Line type="monotone" dataKey="avg" stroke="#ffffff" strokeWidth={2} dot={false} name="7-day avg" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Log Weight</p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 197.4"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. post-cheat meal, low sleep..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Weight'}
          </button>
          {status === 'success' && <p className="text-sm text-green-400">Weight logged.</p>}
          {status && status !== 'success' && <p className="text-sm text-red-400">{status}</p>}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">History</p>
          <div className="flex flex-col gap-2">
            {[...logs].reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between border border-zinc-800 rounded-lg px-4 py-3">
                <span className="text-xs text-zinc-500">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-sm font-medium text-white">{log.weight_lbs} lbs</span>
                {log.notes && <span className="text-xs text-zinc-600 italic">{log.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}