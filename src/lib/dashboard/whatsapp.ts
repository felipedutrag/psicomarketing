import { Redis } from '@upstash/redis'
import { DASHBOARD_CONFIG, type WhatsAppStatus, type Lead } from './config'

const redis = Redis.fromEnv()

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const status = await redis.get(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY) as WhatsAppStatus
  return status || 'disconnected'
}

export async function setWhatsAppStatus(status: WhatsAppStatus): Promise<void> {
  await redis.set(DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY, status)
}

export async function getQRCode(): Promise<string | null> {
  const qrCode = await redis.get(`${DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY}:qr`)
  return qrCode as string | null
}

export async function setQRCode(qrCode: string): Promise<void> {
  await redis.set(`${DASHBOARD_CONFIG.WHATSAPP_STATUS_KEY}:qr`, qrCode)
}

export async function updateStats(): Promise<void> {
  const leads = await redis.keys(`${DASHBOARD_CONFIG.LEADS_KEY}:*`)
  const stats = {
    total_leads: leads.length,
    pending: 0,
    personalized: 0,
    sent: 0,
    responded: 0,
    error: 0,
    response_rate: 0,
    last_updated: new Date().toISOString(),
  }

  for (const key of leads) {
    const lead = await redis.hgetall(key) as Record<string, unknown> | null
    if (!lead) continue
    const status = lead.status as string
    if (status in stats) {
      stats[status as keyof typeof stats]++
    }
  }

  if (stats.sent > 0) {
    stats.response_rate = (stats.responded / stats.sent) * 100
  }

  await redis.set(DASHBOARD_CONFIG.STATS_KEY, JSON.stringify(stats))
}

export async function getStats() {
  const stats = await redis.get(DASHBOARD_CONFIG.STATS_KEY)
  if (!stats) return null
  return typeof stats === 'string' ? JSON.parse(stats) : stats
}

export function formatPhoneNumber(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone
  return cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`
}

export function getRandomDelay(): number {
  const { DELAY_MIN, DELAY_MAX } = DASHBOARD_CONFIG
  const randomFactor = Math.pow(Math.random(), 1.5)
  return Math.floor(DELAY_MIN + randomFactor * (DELAY_MAX - DELAY_MIN))
}
