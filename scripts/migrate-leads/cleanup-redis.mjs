import { Redis } from '@upstash/redis'
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

const LEADS_KEY = 'dashboard:leads'

async function main() {
  const keys = await redis.keys(`${LEADS_KEY}:*`)
  console.log('Chaves de leads no Redis:', keys.length)
  if (keys.length === 0) {
    console.log('Nada para limpar.')
    return
  }
  await redis.del(...keys)
  const remaining = await redis.keys(`${LEADS_KEY}:*`)
  console.log('Chaves restantes:', remaining.length)
}

main().catch((e) => {
  console.error('Falha:', e)
  process.exit(1)
})
