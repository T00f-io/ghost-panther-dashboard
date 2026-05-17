import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hiyeqaiqfsmtiugzvxph.supabase.co/'
const SUPABASE_ANON_KEY = 'sb_publishable_TW3r-nHlWDyfBZyvxSkiTw__uCtqhMG'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)