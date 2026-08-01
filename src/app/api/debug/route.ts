import { NextRequest, NextResponse } from 'next/server'
import { sendMessage, getSubscriber } from '@/lib/manychat'

export async function GET(request: Request) {
  const req = request as Request & { nextUrl?: URL }
  return new Response(JSON.stringify({
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    query: Object.fromEntries((req.nextUrl || new URL(request.url)).searchParams.entries()),
    url: request.url,
  }), { headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, text } = body

    console.log('[DEBUG] Testando ManyChat API')
    console.log('[DEBUG] userId:', userId)
    console.log('[DEBUG] text:', text)

    // Test getSubscriber
    console.log('[DEBUG] Testando getSubscriber...')
    const subscriber = await getSubscriber(userId)
    console.log('[DEBUG] getSubscriber result:', subscriber)

    // Test sendMessage
    console.log('[DEBUG] Testando sendMessage...')
    const messageResult = await sendMessage(userId, text)
    console.log('[DEBUG] sendMessage result:', messageResult)

    return NextResponse.json({
      status: 'ok',
      subscriber,
      messageResult
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[DEBUG] Error:', errorMessage, err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
