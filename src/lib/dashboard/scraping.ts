import { Redis } from '@upstash/redis'
import { DASHBOARD_CONFIG, type Lead } from './config'
import { normalizePhone, type ScrapedPlace } from './maps-scraper'

const redis = Redis.fromEnv()

export async function saveLeads(leads: Lead[]): Promise<void> {
  for (const lead of leads) {
    const cleanLead: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(lead)) {
      if (v !== null && v !== undefined) {
        cleanLead[k] = v
      }
    }
    await redis.hset(`${DASHBOARD_CONFIG.LEADS_KEY}:${lead.id}`, cleanLead)
  }
}

export async function getLeads(): Promise<Lead[]> {
  const keys = await redis.keys(`${DASHBOARD_CONFIG.LEADS_KEY}:*`)
  if (keys.length === 0) return []

  const pipeline = redis.pipeline()
  for (const key of keys) {
    pipeline.hgetall(key)
  }
  const results = await pipeline.exec() as (Record<string, unknown> | null)[]

  const leads: Lead[] = []
  for (const lead of results) {
    if (lead && lead.id) {
      leads.push(lead as unknown as Lead)
    }
  }

  return leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const lead = await redis.hgetall(`${DASHBOARD_CONFIG.LEADS_KEY}:${id}`) as Record<string, unknown> | null
  return lead && lead.id ? (lead as unknown as Lead) : null
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const cleanUpdates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (v !== null && v !== undefined) {
      cleanUpdates[k] = v
    }
  }
  if (Object.keys(cleanUpdates).length > 0) {
    await redis.hset(`${DASHBOARD_CONFIG.LEADS_KEY}:${id}`, cleanUpdates)
  }
}

export async function deleteLead(id: string): Promise<void> {
  await redis.del(`${DASHBOARD_CONFIG.LEADS_KEY}:${id}`)
}

export async function clearLeads(): Promise<void> {
  const keys = await redis.keys(`${DASHBOARD_CONFIG.LEADS_KEY}:*`)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

export function parseManualInput(input: string): Partial<Lead>[] {  const lines = input.split('\n').filter(line => line.trim())
  const leads: Partial<Lead>[] = []
  
  for (const line of lines) {
    // Formato esperado: nome,whatsapp,website (opcional)
    const parts = line.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      leads.push({
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        nome: parts[0],
        whatsapp: parts[1].replace(/\D/g, ''),
        website: parts[2] || undefined,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    }
  }
  
  return leads
}

export async function saveScrapedLeads(places: ScrapedPlace[]): Promise<Lead[]> {
  const existing = await getLeads()
  const existingPhones = new Set(existing.map(l => l.whatsapp).filter(Boolean))

  const toSave: Lead[] = []
  for (const place of places) {
    const whatsapp = place.whatsapp ? normalizePhone(place.whatsapp) : ''
    if (whatsapp && existingPhones.has(whatsapp)) continue

    toSave.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      nome: place.nome,
      whatsapp,
      website: place.website,
      endereco: place.endereco,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    if (whatsapp) existingPhones.add(whatsapp)
  }

  await saveLeads(toSave)
  return toSave
}
