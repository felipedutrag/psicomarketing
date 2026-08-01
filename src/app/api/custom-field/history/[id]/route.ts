import { loadHistory } from '@/lib/history'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const history = loadHistory()
    return new Response(JSON.stringify((history[params.id] as Array<unknown>) || []), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
