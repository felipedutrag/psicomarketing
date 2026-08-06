import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

function loadEnv(file) {
  const env = {}
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq > 0) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^"|"$/g, '')
  }
  return env
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') }

const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
})

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const LEADS_KEY = 'dashboard:leads'

async function main() {
  const keys = await redis.keys(`${LEADS_KEY}:*`)
  console.log('Leads encontrados no Redis:', keys.length)

  if (keys.length === 0) return

  const pipeline = redis.pipeline()
  for (const key of keys) pipeline.hgetall(key)
  const results = await pipeline.exec()

  const leads = results
    .filter(Boolean)
    .map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      whatsapp: String(lead.whatsapp || ''),
      website: lead.website || null,
      endereco: lead.endereco || null,
      mensagem_inicial: lead.mensagem_inicial || null,
      mensagem_personalizada: lead.mensagem_personalizada || null,
      status: lead.status || 'pending',
      na_fila: lead.na_fila === true || lead.na_fila === 'true' || lead.na_fila === 1,
      data_envio: lead.data_envio || null,
      data_resposta: lead.data_resposta || null,
      erro: lead.erro || null,
      created_at: lead.created_at || new Date().toISOString(),
    }))

  const { error, data } = await sb.from('leads').upsert(leads, { onConflict: 'id' })
  if (error) {
    console.error('ERRO ao inserir no Supabase:', error.message)
    process.exit(1)
  }
  console.log('Migrados com sucesso:', leads.length)
  console.log('Exemplo do primeiro lead:', JSON.stringify(leads[0], null, 2))
}

main().catch((e) => {
  console.error('Falha:', e)
  process.exit(1)
})
