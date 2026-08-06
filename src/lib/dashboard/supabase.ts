import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[SUPABASE] Variáveis de ambiente SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configuradas.')
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'public-anon-placeholder'
)
