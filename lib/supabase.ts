import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xfbxarvsckygplcmtbrl.supabase.co'
const supabaseAnonKey = 'sb_publishable_VBFcbDslzihgtVrrHk908A_WfsDnQ_J'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)