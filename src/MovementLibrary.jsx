import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const PATTERNS = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Mobility']
const CATEGORIES = ['All', 'Functional', 'Strength', 'Bodyweight', 'Mobility & Recovery']
const EXERTION_LABELS = { 1: '★☆☆☆☆', 2: '★★☆☆☆', 3: '★★★☆☆', 4: '★★★★☆', 5: '★★★★★' }

const CATEGORY_MAP = {
  'Functional': ['Kettlebell', 'Macebell', 'Clubbell', 'Sandbag', 'Slamball', 'Battle Ropes', 'TRX'],
  'Strength': ['Barbell', 'Dumbbell', 'Machine', 'Axel Bar', 'EZ-Bar'],
  'Bodyweight': ['Bodyweight'],
  'Mobility & Recovery': ['None', 'Release Ball', 'Lacrosse Ball', 'Bands'],
}

export default function MovementLibrary() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pattern, setPattern] = useState('All')
  const [category, setCategory] = useState('All')
  const [implement, setImplement] = useState('All')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({
    pattern: 'Push', implement: '', movement: '', cues: '', purpose: '', exertion: 3
  })

  useEffect(() => {
    fetchMovements()
  }, [])

  async function fetchMovements() {
    const { data } = await supabase
      .from('movements')
      .select('*')
      .order('movement', { ascending: true })
    if (data) setMovements(data)
    setLoading(false)
  }

  async function handleAdd() {
    if (!form.movement || !form.implement) {
      setStatus('Movement name and implement are required.')
      return
    }
    setSaving(true)
    setStatus(null)
    const { error } = await supabase.from('movements').insert({
      pattern: form.pattern,
      implement: form.implement,
      movement: form.movement,
      cues: form.cues,
      purpose: form.purpose,
      exertion: parseInt(form.exertion),
    })
    if (error) {
      setStatus('Error saving movement.')
    } else {
      setStatus('success')
      setForm({ pattern: 'Push', implement: '', movement: '', cues: '', purpose: '', exertion: 3 })
      setShowAdd(false)
      fetchMovements()
    }
    setSaving(false)
  }

  const implementList = ['All', ...new Set(movements.map(m => m.implement).filter(Boolean).sort())]

  const filtered = movements.filter(m => {
    const matchSearch = search === '' ||
      m.movement?.toLowerCase().includes(search.toLowerCase()) ||
      m.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      m.cues?.toLowerCase().includes(search.toLowerCase())
    const matchPattern = pattern === 'All' || m.pattern === pattern
    const matchImplement = implement === 'All' || m.implement === implement
    const matchCategory = category === 'All' ||
      (CATEGORY_MAP[category] && CATEGORY_MAP[category].includes(m.implement))
    return matchSearch && matchPattern && matchImplement && matchCategory
  })

  if (loading) return <p className="text-zinc-500">Loading movements...</p>

  return (
    <div className="flex flex-col gap-6">

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search movements, purpose, or cues..."
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
      />

      {/* Category filter */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Category</p>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCategory(c); setImplement('All') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === c ? 'bg-white text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern filter */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Pattern</p>
        <div className="flex gap-2 flex-wrap">
          {PATTERNS.map(p => (
            <button
              key={p}
              onClick={() => setPattern(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pattern === p ? 'bg-white text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Implement filter */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Implement</p>
        <div className="flex gap-2 flex-wrap">
          {implementList.map(imp => (
            <button
              key={imp}
              onClick={() => setImplement(imp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                implement === imp ? 'bg-white text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + add button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{filtered.length} movements</p>
        <button
          onClick={() => { setShowAdd(!showAdd); setStatus(null) }}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Movement'}
        </button>
      </div>

      {/* Add movement form */}
      {showAdd && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-white">New Movement</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Pattern</label>
              <select
                value={form.pattern}
                onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                {['Push', 'Pull', 'Legs', 'Core', 'Mobility'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Implement</label>
              <input
                type="text"
                value={form.implement}
                onChange={e => setForm(f => ({ ...f, implement: e.target.value }))}
                placeholder="e.g. Kettlebell"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Movement Name</label>
            <input
              type="text"
              value={form.movement}
              onChange={e => setForm(f => ({ ...f, movement: e.target.value }))}
              placeholder="e.g. Single Arm KB Swing"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Cues</label>
            <input
              type="text"
              value={form.cues}
              onChange={e => setForm(f => ({ ...f, cues: e.target.value }))}
              placeholder="e.g. Hinge hard, snap hips, float the bell"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Purpose</label>
            <input
              type="text"
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              placeholder="e.g. Hip power, glutes, hamstrings"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Exertion (1–5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={form.exertion}
              onChange={e => setForm(f => ({ ...f, exertion: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-2 px-4 rounded-lg bg-white text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Movement'}
          </button>
          {status && status !== 'success' && <p className="text-xs text-red-400">{status}</p>}
        </div>
      )}

      {/* Movement list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {filtered.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelected(selected?.id === m.id ? null : m)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                selected?.id === m.id
                  ? 'border-white bg-zinc-800'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{m.movement}</p>
                <span className="text-xs text-zinc-600">{m.implement}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">{m.pattern}</span>
                <span className="text-xs text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{EXERTION_LABELS[m.exertion]}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-zinc-600 text-sm">No movements match your filters.</p>
          )}
        </div>

        <div className="lg:sticky lg:top-6">
          {selected ? (
            <div className="border border-zinc-700 rounded-xl p-5 bg-zinc-900">
              <p className="text-xs text-zinc-500 mb-0.5">{selected.pattern} · {selected.implement}</p>
              <h3 className="text-lg font-bold text-white mb-3">{selected.movement}</h3>
              {selected.cues && (
                <div className="mb-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Cues</p>
                  <p className="text-sm text-zinc-300">{selected.cues}</p>
                </div>
              )}
              {selected.purpose && (
                <div className="mb-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Purpose</p>
                  <p className="text-sm text-zinc-300">{selected.purpose}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Exertion</p>
                <p className="text-sm text-white">{EXERTION_LABELS[selected.exertion]}</p>
              </div>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl p-5 text-zinc-600 text-sm">
              Select a movement to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}