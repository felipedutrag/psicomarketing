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

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const MC_API = 'https://api.manychat.com/fb'
const MC_AUTH = env.MANYCHAT_API_KEY?.trim() || '4893318:6124c375829053829537d02892ea7ce8'

async function getSubscriberPhone(userId) {
  try {
    const res = await fetch(`${MC_API}/subscriber/getInfo?subscriber_id=${userId}`, {
      headers: { Authorization: `Bearer ${MC_AUTH}` },
    })
    const json = await res.json()
    const phone =
      json?.data?.phone ||
      json?.data?.phone_number ||
      json?.data?.whatsapp_phone ||
      json?.data?.system_fields?.phone ||
      json?.data?.custom_fields?.phone ||
      null
    return phone ? String(phone).replace(/\D/g, '') : null
  } catch (err) {
    console.error(`  [MC] Erro ao buscar telefone de ${userId}:`, err.message)
    return null
  }
}

async function findDashboardMessage(phone) {
  if (!phone || phone.length < 10) return null
  const patterns = [phone]
  if (phone.startsWith('55') && phone.length > 11) {
    patterns.push(phone.slice(2))
  } else if (phone.length <= 11) {
    patterns.push(`55${phone}`)
  }
  const or = patterns.map((p) => `whatsapp.ilike.%${p}%`).join(',')
  const { data, error } = await sb
    .from('leads')
    .select('mensagem_personalizada, mensagem_inicial')
    .or(or)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) {
    console.error('  [SUPA] Erro ao buscar lead:', error.message)
    return null
  }
  for (const lead of data || []) {
    const msg = lead.mensagem_personalizada || lead.mensagem_inicial
    if (msg && msg.trim()) return msg.trim().slice(0, 600)
  }
  return null
}

async function main() {
  const { data: analytics, error } = await sb
    .from('analytics')
    .select('id, mc_user_id, mensagem_conversao')
    .is('mensagem_conversao', null)

  if (error) {
    console.error('Erro ao buscar analytics:', error.message)
    process.exit(1)
  }

  console.log(`Analytics sem mensagem: ${analytics.length}`)

  let updated = 0
  for (const row of analytics) {
    const phone = await getSubscriberPhone(row.mc_user_id)
    if (!phone) continue
    const message = await findDashboardMessage(phone)
    if (!message) continue

    const { error: upErr } = await sb
      .from('analytics')
      .update({ mensagem_conversao: message, updated_at: new Date().toISOString() })
      .eq('id', row.id)

    if (upErr) {
      console.error(`Erro ao atualizar ${row.mc_user_id}:`, upErr.message)
    } else {
      updated++
      console.log(`  ✓ ${row.mc_user_id} (${row.id}) -> ${message.substring(0, 60)}...`)
    }
  }

  console.log(`\nConcluído. ${updated}/${analytics.length} atualizados.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
