import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function BodyCompModule({ user }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_lbs: '',
    body_fat_pct: '',
    waist_in: '',
    chest_in: '',
    hips_in: '',
    arms_in: '',
    thighs_in: '',
    notes: '',
  })

  useEffect(() => {
    if (user) fetchLogs()
  }, [user])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('body_comp')
      .select('*')
      .eq('user_slug', user.slug)
      .order('date', { ascending: false })
    if (data) setLogs(data)
    setLoading(false)
  }

  async function handleSave() {
    if (!form.date) {
      setStatus('Date is required.')
      return
    }
    setSaving(true)
    setStatus(null)

    const payload = {
      user_slug: user.slug,
      date: form.date,
      notes: form.notes || null,
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      waist_in: form.waist_in ? parseFloat(form.waist_in) : null,
      chest_in: form.chest_in ? parseFloat(form.chest_in) : null,
      hips_in: form.hips_in ? parseFloat(form.hips_in) : null,
      arms_in: form.arms_in ? parseFloat(form.arms_in) : null,
      thighs_in: form.thighs_in ? parseFloat(form.thighs_in) : null,
    }

    const { error } = await supabase.from('body_comp').insert(payload)

    if (error) {
      setStatus('Error saving. Please try again.')
    } else {
      setStatus('success')
      setForm({
        date: new Date().toISOString().split('T')[0],
        weight_lbs: '', body_fat_pct: '', waist_in: '',
        chest_in: '', hips_in: '', arms_in: '', thighs_in: '', notes: '',
      })
      setShowForm(false)
      fetchLogs()
    }
    setSaving(false)
  }

  function Field({ label, field, placeholder }) {
    return (
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
        <input
          type="number"
          step="0.1"
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
        />
      </div>
    )
  }

  if (loading) return <p className="text-zinc-500">Loading...</p>

  const latest = logs[0]
  const previous = logs[1]

  function diff(field) {
    if (!latest || !previous) return null
    const a = parseFloat(latest[field])
    const b = parseFloat(previous[field])
    if (isNaN(a) || isNaN(b)) return null
    const d = (a - b).toFixed(1)
    return d > 0 ? `+${d}` : `${d}`
  }

  function diffColor(field, lowerIsBetter = true) {
    const d = diff(field)
    if (!d) return 'text-zinc-500'
    const n = parseFloat(d)
    if (lowerIsBetter) return n < 0 ? 'text-green-400' : n > 0 ? 'text-red-400' : 'text-zinc-500'
    return n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-zinc-500'
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Latest snapshot */}
      {latest && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Latest Check-in</p>
              <p className="text-sm text-white mt-0.5">
                {new Date(latest.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {previous && <p className="text-xs text-zinc-600">vs previous check-in</p>}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Weight', field: 'weight_lbs', unit: 'lbs', lower: true },
              { label: 'Body Fat', field: 'body_fat_pct', unit: '%', lower: true },
              { label: 'Waist', field: 'waist_in', unit: '"', lower: true },
              { label: 'Chest', field: 'chest_in', unit: '"', lower: false },
              { label: 'Hips', field: 'hips_in', unit: '"', lower: true },
              { label: 'Arms', field: 'arms_in', unit: '"', lower: false },
              { label: 'Thighs', field: 'thighs_in', unit: '"', lower: true },
            ].map(({ label, field, unit, lower }) => latest[field] ? (
              <div key={field} className="border border-zinc-800 rounded-lg px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{latest[field]}{unit}</p>
                {diff(field) && (
                  <p className={`text-xs mt-0.5 ${diffColor(field, lower)}`}>{diff(field)}{unit}</p>
                )}
              </div>
            ) : null)}
          </div>

          {latest.notes && (
            <p className="text-xs text-zinc-500 mt-4 italic">{latest.notes}</p>
          )}
        </div>
      )}

      {/* Log new check-in button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{logs.length} check-ins logged</p>
        <button
          onClick={() => { setShowForm(!showForm); setStatus(null) }}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Check-in'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-sm font-medium text-white">New Body Comp Check-in</p>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Weight (lbs)" field="weight_lbs" placeholder="e.g. 197.4" />
            <Field label="Body Fat %" field="body_fat_pct" placeholder="e.g. 22.5" />
            <Field label='Waist (in)' field="waist_in" placeholder='e.g. 34.5' />
            <Field label='Chest (in)' field="chest_in" placeholder='e.g. 42.0' />
            <Field label='Hips (in)' field="hips_in" placeholder='e.g. 38.0' />
            <Field label='Arms (in)' field="arms_in" placeholder='e.g. 14.5' />
            <Field label='Thighs (in)' field="thighs_in" placeholder='e.g. 23.0' />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="How are you feeling, any observations..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Check-in'}
          </button>

          {status && status !== 'success' && <p className="text-xs text-red-400">{status}</p>}
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">History</p>
          <div className="flex flex-col gap-2">
            {logs.map((log, i) => (
              <div key={i} className="border border-zinc-800 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-sm font-medium text-white">{log.weight_lbs ? `${log.weight_lbs} lbs` : '—'}</span>
                </div>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {log.body_fat_pct && <span className="text-xs text-zinc-500">BF: {log.body_fat_pct}%</span>}
                  {log.waist_in && <span className="text-xs text-zinc-500">Waist: {log.waist_in}"</span>}
                  {log.chest_in && <span className="text-xs text-zinc-500">Chest: {log.chest_in}"</span>}
                  {log.hips_in && <span className="text-xs text-zinc-500">Hips: {log.hips_in}"</span>}
                  {log.arms_in && <span className="text-xs text-zinc-500">Arms: {log.arms_in}"</span>}
                  {log.thighs_in && <span className="text-xs text-zinc-500">Thighs: {log.thighs_in}"</span>}
                </div>
                {log.notes && <p className="text-xs text-zinc-600 mt-1 italic">{log.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}