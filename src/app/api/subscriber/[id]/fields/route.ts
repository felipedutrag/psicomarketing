import { getSubscriber } from '@/lib/manychat'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await getSubscriber(params.id)
    const fields = data?.data?.custom_fields || []
    return new Response(JSON.stringify({ subscriber_id: params.id, custom_fields: fields }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
