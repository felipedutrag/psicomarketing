import { loadHistory, saveHistory } from '@/lib/history'
import { setCustomField } from '@/lib/manychat'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { subscriber_id: string | number; field_name: string; field_value: string }
    const { subscriber_id, field_name, field_value } = body
    const data = await setCustomField(subscriber_id, field_name, field_value)

    const history = loadHistory()
    if (!history[subscriber_id]) history[subscriber_id] = []
    ;(history[subscriber_id] as Array<unknown>).push({ field_name, field_value, timestamp: new Date().toISOString() })
    saveHistory(history)

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
