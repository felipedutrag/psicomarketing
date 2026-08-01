const CALCOM_API = 'https://api.cal.com/v2'
const CALCOM_API_KEY = process.env.CALCOM_API_KEY || 'cal_live_2a726c8dcb6fa3733f5453dc936a9c26'
const CALCOM_EVENT_TYPE_ID = Number(process.env.CALCOM_EVENT_TYPE_ID || '5650035')
const CALCOM_TIMEZONE = process.env.CALCOM_TIMEZONE || 'America/Sao_Paulo'

function headers(version: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CALCOM_API_KEY}`,
    'cal-api-version': version,
  }
}

export function formatSlot(start: string): string {
  const d = new Date(start)
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: CALCOM_TIMEZONE })
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: CALCOM_TIMEZONE })
  const hour = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: CALCOM_TIMEZONE })
  return `${weekday}, ${day} às ${hour}`
}

export async function getNextAvailableSlots(days = 7, count = 8): Promise<string[]> {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const url = `${CALCOM_API}/slots?start=${startStr}&end=${endStr}&eventTypeId=${CALCOM_EVENT_TYPE_ID}&timeZone=${encodeURIComponent(CALCOM_TIMEZONE)}`
  console.log('[CALCOM] getNextAvailableSlots:', url)
  const res = await fetch(url, { headers: headers('2024-09-04'), cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(`Cal.com slots ${res.status}: ${JSON.stringify(json)}`)

  const byDay = json.data as Record<string, Array<{ start: string }>>
  const slots: string[] = []
  for (const day of Object.keys(byDay).sort()) {
    for (const s of byDay[day]) slots.push(s.start)
  }
  console.log('[CALCOM] Slots encontrados:', slots.length)
  return slots.slice(0, count)
}

export async function createBooking(start: string, attendeeName: string, attendeeEmail: string) {
  console.log('[CALCOM] createBooking:', start, attendeeName, attendeeEmail)
  const body = {
    start,
    eventTypeId: CALCOM_EVENT_TYPE_ID,
    attendee: {
      name: attendeeName,
      email: attendeeEmail,
      timeZone: CALCOM_TIMEZONE,
      language: 'pt-BR',
    },
  }
  const res = await fetch(`${CALCOM_API}/bookings`, {
    method: 'POST',
    headers: headers('2024-08-13'),
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Cal.com booking ${res.status}: ${JSON.stringify(json)}`)
  console.log('[CALCOM] Booking criado:', json.data?.uid, json.data?.meetingUrl)
  return json.data as { uid: string; meetingUrl: string; start: string; end: string; title: string }
}

export async function cancelBooking(uid: string, reason?: string) {
  console.log('[CALCOM] cancelBooking:', uid, reason)
  const res = await fetch(`${CALCOM_API}/bookings/${uid}/cancel`, {
    method: 'POST',
    headers: headers('2026-02-25'),
    body: JSON.stringify({ cancellationReason: reason || 'Cancelado pelo lead' }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Cal.com cancel ${res.status}: ${JSON.stringify(json)}`)
  console.log('[CALCOM] Booking cancelado:', uid)
  return json.data as { uid: string; start: string; end: string; title: string }
}
