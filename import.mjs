import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://hiyeqaiqfsmtiugzvxph.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_TW3r-nHlWDyfBZyvxSkiTw__uCtqhMG'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const csv = readFileSync('./Workout Log.csv', 'utf8')

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      row.push(field.trim())
      field = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++
      row.push(field.trim())
      if (row.some(f => f)) rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row) }
  return rows
}

const rows = parseCSV(csv)
const dataRows = rows.slice(1)

let sessions = []
let currentSession = null
let sessionId = 1
const seenDates = new Set()

for (const row of dataRows) {
  const date = row[0] || ''
  const arc = row[1] || ''
  const workoutNote = row[9] || ''

  if (date && date !== 'Date' && !seenDates.has(date)) {
    seenDates.add(date)
    currentSession = {
      id: sessionId++,
      date: new Date(date).toISOString().split('T')[0],
      arc_name: arc,
      workout_type: arc,
      effort: '',
      focus: '',
      notes: workoutNote,
    }
    sessions.push(currentSession)
  }
}

console.log(`Parsed ${sessions.length} sessions`)

const { error: sError } = await supabase.from('workout_sessions').insert(sessions)
if (sError) console.error('Session insert error:', sError.message)
else console.log('Sessions inserted successfully')