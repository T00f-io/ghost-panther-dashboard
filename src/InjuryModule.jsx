import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const BODY_AREAS = [
  'Lower Back', 'Upper Back', 'Left Shoulder', 'Right Shoulder',
  'Left Hip', 'Right Hip', 'Left Knee', 'Right Knee',
  'Left Hamstring', 'Right Hamstring', 'Left Ankle', 'Right Ankle',
  'Neck', 'Left Elbow', 'Right Elbow', 'Core', 'Other'
]

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe']
const STATUS_OPTIONS = ['active', 'monitoring', 'resolved']

const SEVERITY_COLORS = {
  'Mild': 'text-yellow-400 border-yellow-700',
  'Moderate': 'text-orange-400 border-orange-700',
  'Severe': 'text-red-400 border-red-700',
}

const STATUS_COLORS = {
  'active': 'text-red-400 border-red-700',
  'monitoring': 'text-yellow-400 border-yellow-700',
  'resolved': 'text-green-400 border-green-700',
}

export default function InjuryModule({ user }) {
  const [injuries, setInjuries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    body_area: 'Lower Back',
    severity: 'Mild',
    notes: '',
  })

  useEffect(() => {
    if (user) fetchInjuries()
  }, [user])

  async function fetchInjuries() {
    setLoading(true)
    const { data } = await supabase
      .from('injuries')
      .select('*')
      .eq('user_slug', user.slug)
      .order('date', { ascending: false })
    if (data) setInjuries(data)
    setLoading(false)
  }

  async function handleSave() {
    if (!form.body_area || !form.date) {
      setStatus('Date and body area are required.')
      return
    }
    setSaving(true)
    setStatus(null)

    const { error } = await supabase.from('injuries').insert({
      user_slug: user.slug,
      date: form.date,
      body_area: form.body_area,
      severity: form.severity,
      status: 'active',
      source: 'manual',
      notes: form.notes,
    })

    if (error) {
      setStatus('Error saving injury.')
    } else {
      setStatus('success')
      setForm({
        date: new Date().toISOString().split('T')[0],
        body_area: 'Lower Back',
        severity: 'Mild',
        notes: '',
      })
      setShowForm(false)
      fetchInjuries()
    }
    setSaving(false)
  }

  async function handleUpdateStatus(id, newStatus) {
    await supabase
      .from('injuries')
      .update({ status: newStatus })
      .eq('id', id)
    fetchInjuries()
  }

  const active = injuries.filter(i => i.status !== 'resolved')
  const resolved = injuries.filter(i => i.status === 'resolved')

  if (loading) return <p className="text-zinc-500">Loading injury log...</p>

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Injury Log</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {active.length} active · {resolved.length} resolved
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setStatus(null) }}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Injury'}
        </button>
      </div>

      {/* Manual entry form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-white">New Injury Entry</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Severity</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {SEVERITY_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Body Area</label>
            <select
              value={form.body_area}
              onChange={e => setForm(f => ({ ...f, body_area: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              {BODY_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Describe the injury, how it feels, what triggered it..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log Injury'}
          </button>
          {status && status !== 'success' && <p className="text-xs text-red-400">{status}</p>}
        </div>
      )}

      {/* Active injuries */}
      {active.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Active & Monitoring</p>
          {active.map((injury, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{injury.body_area}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[injury.severity]}`}>
                      {injury.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[injury.status]}`}>
                      {injury.status}
                    </span>
                    {injury.source === 'auto' && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-blue-700 text-blue-400">
                        AI detected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {new Date(injury.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {injury.notes && (
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{injury.notes}</p>
              )}
              <div className="flex gap-2">
                {injury.status === 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(injury.id, 'monitoring')}
                    className="text-xs text-yellow-400 border border-yellow-700 hover:border-yellow-500 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Mark Monitoring
                  </button>
                )}
                <button
                  onClick={() => handleUpdateStatus(injury.id, 'resolved')}
                  className="text-xs text-green-400 border border-green-700 hover:border-green-500 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <p className="text-zinc-500 text-sm">No active injuries. Stay strong.</p>
        </div>
      )}

      {/* Resolved injuries */}
      {resolved.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Resolved</p>
          {resolved.map((injury, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{injury.body_area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[injury.severity]}`}>
                    {injury.severity}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(injury.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {injury.notes && <p className="text-xs text-zinc-600 mt-1">{injury.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}