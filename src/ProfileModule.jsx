import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function ProfileModule({ user, onUpdate }) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    goal_weight: '',
    current_weight: '',
    profile: '',
    flags: '',
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        age: user.age || '',
        goal_weight: user.goal_weight || '',
        current_weight: user.current_weight || '',
        profile: user.profile || '',
        flags: user.flags || '',
      })
    }
  }, [user])

  async function handleSave() {
    setSaving(true)
    setStatus(null)

    const { error } = await supabase
      .from('users')
      .update({
        name: form.name,
        age: parseInt(form.age),
        goal_weight: parseFloat(form.goal_weight),
        current_weight: parseFloat(form.current_weight),
        profile: form.profile,
        flags: form.flags,
      })
      .eq('slug', user.slug)

    if (error) {
      setStatus('Error saving profile.')
    } else {
      setStatus('success')
      if (onUpdate) onUpdate()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Profile</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Editing profile for <span className="text-white">{user?.name}</span>. 
          These details are used by Claude for personalized coaching insights.
        </p>

        <div className="flex flex-col gap-4">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Current Weight</label>
              <input
                type="number"
                step="0.1"
                value={form.current_weight}
                onChange={e => setForm(f => ({ ...f, current_weight: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Goal Weight</label>
              <input
                type="number"
                step="0.1"
                value={form.goal_weight}
                onChange={e => setForm(f => ({ ...f, goal_weight: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widests mb-1 block">Profile</label>
            <p className="text-xs text-zinc-600 mb-1">Training style, goals, background -- used in AI coaching prompts</p>
            <textarea
              value={form.profile}
              onChange={e => setForm(f => ({ ...f, profile: e.target.value }))}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Known Flags</label>
            <p className="text-xs text-zinc-600 mb-1">Injury history, physical limitations -- used in AI coaching prompts</p>
            <textarea
              value={form.flags}
              onChange={e => setForm(f => ({ ...f, flags: e.target.value }))}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          {status === 'success' && <p className="text-sm text-green-400">Profile saved successfully.</p>}
          {status && status !== 'success' && <p className="text-sm text-red-400">{status}</p>}
        </div>
      </div>

    </div>
  )
}