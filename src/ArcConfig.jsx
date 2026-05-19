import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function ArcConfig({ user, onUpdate }) {
  const [arc, setArc] = useState(null)
  const [editing, setEditing] = useState(false)
  const [arcName, setArcName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState(90)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (user) fetchArc()
  }, [user])

  async function fetchArc() {
    const { data } = await supabase
      .from('arc_config')
      .select('*')
      .eq('active', true)
      .eq('user_slug', user.slug)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) {
      setArc(data)
      setArcName(data.arc_name)
      setStartDate(data.start_date)
      setDuration(data.duration_days)
    } else {
      setArc(null)
    }
  }

  async function handleSave() {
    if (!arcName || !startDate || !duration) {
      setStatus('All fields required.')
      return
    }
    setSaving(true)
    setStatus(null)

    await supabase
      .from('arc_config')
      .update({ active: false })
      .eq('active', true)
      .eq('user_slug', user.slug)

    const { error } = await supabase
      .from('arc_config')
      .insert({ arc_name: arcName, start_date: startDate, duration_days: parseInt(duration), active: true, user_slug: user.slug })

    if (error) {
      setStatus('Error saving arc.')
    } else {
      setStatus('success')
      setEditing(false)
      fetchArc()
      if (onUpdate) onUpdate()
    }
    setSaving(false)
  }

  if (!arc) return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">No Active Arc</p>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
      >
        + Start Arc
      </button>
      {editing && (
        <div className="flex flex-col gap-3 mt-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Arc Name</label>
            <input type="text" value={arcName} onChange={e => setArcName(e.target.value)} placeholder="e.g. Mobility Foundation" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Duration (days)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Start Arc'}</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
          </div>
          {status && status !== 'success' && <p className="text-xs text-red-400">{status}</p>}
        </div>
      )}
    </div>
  )

  const today = new Date()
  const start = new Date(arc.start_date + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + arc.duration_days)
  const totalDays = arc.duration_days
  const daysIn = Math.round((today - start) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.max(0, Math.round((end - today) / (1000 * 60 * 60 * 24)))
  const progress = Math.min(100, Math.round((daysIn / totalDays) * 100))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      {!editing ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Current Arc</p>
              <p className="text-sm font-bold text-white mt-0.5">{arc.arc_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Day {daysIn} of {totalDays}</p>
                <p className="text-xs text-zinc-500">{daysLeft} days remaining</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
              >
                Edit Arc
              </button>
            </div>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-zinc-600">{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="text-xs text-zinc-500 font-medium">{progress}% complete</span>
            <span className="text-xs text-zinc-600">{end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Configure Arc</p>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Arc Name</label>
            <input type="text" value={arcName} onChange={e => setArcName(e.target.value)} placeholder="e.g. Mobility Foundation" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Duration (days)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Start Arc'}</button>
            <button onClick={() => { setEditing(false); setStatus(null) }} className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
          </div>
          {status && status !== 'success' && <p className="text-xs text-red-400">{status}</p>}
        </div>
      )}
    </div>
  )
}