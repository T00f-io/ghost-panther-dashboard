import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a']

export default function AnalyticsModule({ user }) {
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const { data: sessionData } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_slug', user.slug)
      .order('date', { ascending: true })

    const { data: movementData } = await supabase
      .from('workout_movements')
      .select('*')
      .eq('user_slug', user.slug)

    if (sessionData) setSessions(sessionData)
    if (movementData) setMovements(movementData)
    setLoading(false)
  }

  if (loading) return <p className="text-zinc-500">Loading analytics...</p>

  const weekMap = {}
  sessions.forEach(s => {
    const d = new Date(s.date + 'T00:00:00')
    const week = `${d.getMonth() + 1}/${d.getDate() - d.getDay() + 1}`
    weekMap[week] = (weekMap[week] || 0) + 1
  })
  const weekData = Object.entries(weekMap).map(([week, count]) => ({ week, sessions: count }))

  const implementMap = {}
  movements.forEach(m => {
    if (m.implement && m.implement !== 'Bodyweight' && m.implement !== 'BW' && m.implement !== 'None') {
      implementMap[m.implement] = (implementMap[m.implement] || 0) + 1
    }
  })
  const implementData = Object.entries(implementMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const movementMap = {}
  movements.forEach(m => {
    if (m.movement) movementMap[m.movement] = (movementMap[m.movement] || 0) + 1
  })
  const topMovements = Object.entries(movementMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Sessions</p>
          <p className="text-xl font-bold text-white">{sessions.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Movements</p>
          <p className="text-xl font-bold text-white">{movements.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Avg Per Session</p>
          <p className="text-xl font-bold text-white">{sessions.length ? Math.round(movements.length / sessions.length) : '—'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Unique Movements</p>
          <p className="text-xl font-bold text-white">{Object.keys(movementMap).length}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Sessions per Week</p>
        {sessions.length === 0 ? (
          <p className="text-zinc-600 text-sm">No sessions logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#a1a1aa' }} itemStyle={{ color: '#ffffff' }} />
              <Bar dataKey="sessions" fill="#ffffff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Implement Frequency</p>
          {implementData.length === 0 ? (
            <p className="text-zinc-600 text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={implementData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {implementData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} itemStyle={{ color: '#ffffff' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Top Movements</p>
          {topMovements.length === 0 ? (
            <p className="text-zinc-600 text-sm">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topMovements.map(([movement, count], i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 truncate mr-4">{movement}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-white rounded-full" style={{ width: `${(count / topMovements[0][1]) * 80}px` }} />
                    <span className="text-xs text-zinc-500 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}