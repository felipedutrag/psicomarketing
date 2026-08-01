import { loadHistory } from '@/lib/history'

export async function GET() {
  try {
    return new Response(JSON.stringify(loadHistory()), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
