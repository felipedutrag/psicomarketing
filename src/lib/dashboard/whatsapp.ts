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

export function formatPhoneNumber(phone: string | number): string {
  let cleanPhone = String(phone).replace(/\D/g, '')
  if (cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone
  return cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`
}

const DELAY_MIN_KEY = 'dashboard:config:send-delay-min'
const DELAY_MAX_KEY = 'dashboard:config:send-delay-max'

// Delay em SEGUNDOS (salvo no Redis para ser editável).
// Valores padrão vindos da configuração (2-5 minutos).
export async function getSendDelay(): Promise<{ delayMin: number; delayMax: number }> {
  const min = await redis.get<number>(DELAY_MIN_KEY)
  const max = await redis.get<number>(DELAY_MAX_KEY)
  return {
    delayMin: min != null ? min : Math.round(DASHBOARD_CONFIG.DELAY_MIN / 1000),
    delayMax: max != null ? max : Math.round(DASHBOARD_CONFIG.DELAY_MAX / 1000),
  }
}

export async function saveSendDelay(delayMin: number, delayMax: number): Promise<void> {
  await redis.set(DELAY_MIN_KEY, delayMin)
  await redis.set(DELAY_MAX_KEY, delayMax)
}

const LAST_SEND_KEY = 'dashboard:whatsapp:last-send'
const QUEUE_PAUSED_KEY = 'dashboard:whatsapp:queue-paused'
const SCHED_ENABLED_KEY = 'dashboard:config:schedule-enabled'
const SCHED_START_KEY = 'dashboard:config:schedule-start'
const SCHED_END_KEY = 'dashboard:config:schedule-end'

export interface ScheduleWindow {
  enabled: boolean
  start: string
  end: string
}

export async function getScheduleWindow(): Promise<ScheduleWindow> {
  const enabled = await redis.get<boolean>(SCHED_ENABLED_KEY)
  const start = await redis.get<string>(SCHED_START_KEY)
  const end = await redis.get<string>(SCHED_END_KEY)
  return { enabled: enabled ?? false, start: start || '09:00', end: end || '17:00' }
}

export async function saveScheduleWindow(enabled: boolean, start: string, end: string): Promise<void> {
  await redis.set(SCHED_ENABLED_KEY, enabled)
  await redis.set(SCHED_START_KEY, start)
  await redis.set(SCHED_END_KEY, end)
}

export async function getLastSendTime(): Promise<number | null> {
  const ts = await redis.get<number>(LAST_SEND_KEY)
  return ts ?? null
}

export async function setLastSendTime(ts: number): Promise<void> {
  await redis.set(LAST_SEND_KEY, ts)
}

export async function getQueuePaused(): Promise<boolean> {
  const paused = await redis.get<boolean>(QUEUE_PAUSED_KEY)
  return paused ?? false
}

export async function setQueuePaused(paused: boolean): Promise<void> {
  await redis.set(QUEUE_PAUSED_KEY, paused)
}

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
}

// true se a hora atual está dentro da janela (suporta janela que atravessa a meia-noite)
export function isWithinWindow(now: Date, schedule: ScheduleWindow): boolean {
  if (!schedule.enabled) return true
  const current = now.getHours() * 60 + now.getMinutes()
  const startMin = toMinutes(schedule.start)
  const endMin = toMinutes(schedule.end)
  if (endMin === startMin) return false
  if (endMin > startMin) return current >= startMin && current < endMin
  return current >= startMin || current < endMin // overnight, ex.: 22:00 -> 02:00
}

export async function getScheduleContext(now = new Date()): Promise<{
  schedule: ScheduleWindow
  withinWindow: boolean
  nextOpenAt: number | null
}> {
  const schedule = await getScheduleWindow()
  if (!schedule.enabled) {
    return { schedule, withinWindow: true, nextOpenAt: null }
  }
  const withinWindow = isWithinWindow(now, schedule)
  let nextOpenAt: number | null = null
  if (!withinWindow) {
    const [h, m] = schedule.start.split(':').map(Number)
    const candidate = new Date(now)
    candidate.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0)
    if (candidate.getTime() <= now.getTime() + 60000) {
      candidate.setDate(candidate.getDate() + 1)
    }
    nextOpenAt = candidate.getTime()
  }
  return { schedule, withinWindow, nextOpenAt }
}

// Gera um delay aleatório (exponencial/jitter) entre DELAY_MIN e DELAY_MAX (em ms)
export function getRandomDelay(delayMinMs: number, delayMaxMs: number): number {
  const randomFactor = Math.pow(Math.random(), 1.5)
  return Math.floor(delayMinMs + randomFactor * (delayMaxMs - delayMinMs))
}
