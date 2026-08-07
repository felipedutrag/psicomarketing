import { supabase } from './supabase'
import { DASHBOARD_CONFIG, type Lead } from './config'
import { normalizePhone, type ScrapedPlace } from './maps-scraper'

export async function saveLeads(leads: Lead[]): Promise<void> {
  if (leads.length === 0) return
  const rows = leads.map((lead) => {
    const cleanLead: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(lead)) {
      if (v !== null && v !== undefined) {
        cleanLead[k] = v
      }
    }
    return cleanLead
  })
  const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as unknown as Lead[]
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as unknown as Lead
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const cleanUpdates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (v !== null && v !== undefined) {
      cleanUpdates[k] = v
    }
  }
  if (Object.keys(cleanUpdates).length === 0) return
  const { error } = await supabase.from('leads').update(cleanUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateLeadsBatch(ids: string[], updates: Partial<Lead>): Promise<void> {
  if (ids.length === 0) return
  const cleanUpdates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (v !== null && v !== undefined) {
      cleanUpdates[k] = v
    }
  }
  if (Object.keys(cleanUpdates).length === 0) return
  const { error } = await supabase.from('leads').update(cleanUpdates).in('id', ids)
  if (error) throw new Error(error.message)
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function clearLeads(): Promise<void> {
  const { error } = await supabase.from('leads').delete().neq('id', '')
  if (error) throw new Error(error.message)
}

export async function deleteLeadsWithoutPhone(): Promise<number> {
  const { data, error } = await supabase
    .from('leads')
    .delete()
    .or('whatsapp.is.null,whatsapp.eq.')
    .select('id')
  if (error) throw new Error(error.message)

  return (data || []).length
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
  // Dedup por número, normalizando para a mesma forma (ex.: 55 + DD + número).
  // Cobre leads de qualquer origem e tanto os enviados quanto os não enviados.
  const existingPhones = new Set(
    existing
      .map(l => (l.whatsapp ? normalizePhone(String(l.whatsapp)) : ''))
      .filter(Boolean)
  )

  const toSave: Lead[] = []
  for (const place of places) {
    const whatsapp = place.whatsapp ? normalizePhone(place.whatsapp) : ''
    const phoneKey = whatsapp.replace(/\D/g, '')
    if (phoneKey && existingPhones.has(phoneKey)) continue

    toSave.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      nome: place.nome,
      whatsapp,
      website: place.website,
      endereco: place.endereco,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    if (phoneKey) existingPhones.add(phoneKey)
  }

  await saveLeads(toSave)
  return toSave
}
