import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { waitUntil } from '@vercel/functions'

const redis = Redis.fromEnv()

// O waitUntil mantém o runtime vivo após o response; tempo total = debounce (5s) + Gemini + envio
export const maxDuration = 180

// Função interna para processar a IA (importada do process-ai)
async function processAI(body: Record<string, unknown>) {
  try {
    // Em produção usa o domínio público (o VERCEL_URL aponta para o deployment
    // protegido e o fetch interno retorna 401 Protected deployment)
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.psicomarketing.online'
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3001'

    const response = await fetch(`${baseUrl}/api/process-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const text = await response.text()
    console.log('[WEBHOOK_BG] Process-ai status:', response.status)
    console.log('[WEBHOOK_BG] Process-ai response:', text.substring(0, 500))
  } catch (err) {
    console.error('[WEBHOOK_BG] Process-ai error:', err)
  }
}

export async function GET() {
  console.log('[WEBHOOK] GET request received')
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is active' })
}

export async function POST(req: NextRequest) {
  console.log('[WEBHOOK] ========================================')
  console.log('[WEBHOOK] REQUEST RECEBIDA')
  console.log('[WEBHOOK] ========================================')
  console.log('[WEBHOOK] Method:', req.method)
  console.log('[WEBHOOK] URL:', req.url)
  console.log('[WEBHOOK] Headers:', Object.fromEntries(req.headers.entries()))

  try {
    const body = await req.json()
    const { id: userId, first_name: firstName, last_input_text: userText, phone, whatsapp_phone } = body

    // Remove thread do body pois não usamos mais (centralizado no Redis)
    const { thread, ...bodyWithoutThread } = body

    console.log('[WEBHOOK] Recebido:', { userId, firstName, userText, phone, whatsapp_phone })

    if (!userId || !userText) {
      console.error('[WEBHOOK] Missing data:', { userId, userText })
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const bufferKey = `buffer:${userId}`
    const versionKey = `version:${userId}`

    // 1. Concatena a mensagem ao buffer do usuário no Redis
    await redis.rpush(bufferKey, userText)
    await redis.expire(bufferKey, 120)
    console.log('[WEBHOOK] Buffer atualizado:', bufferKey)

    // 2. Incrementa a versão do estado
    await redis.incr(versionKey)
    await redis.expire(versionKey, 120)
    console.log('[WEBHOOK] Version incrementada:', versionKey)

    // 4. Dispara a chamada interna de processamento via waitUntil.
    //    No Vercel, background task sem await é cancelada quando a função responde;
    //    o waitUntil mantém a execução viva após o response 200.
    //    OBS: O process-ai tem 5s de debounce antes de processar
    console.log('[WEBHOOK] Disparando process-ai em background...')
    console.log('[WEBHOOK] Body enviado:', JSON.stringify(bodyWithoutThread).substring(0, 200))

    waitUntil(processAI(bodyWithoutThread).catch(err => {
      console.error('[WEBHOOK] Erro no processamento background:', err)
    }))

    // 5. Responde imediatamente ao ManyChat com HTTP 200 OK (< 200ms)
    console.log('[WEBHOOK] Resposta enviada ao ManyChat')
    return NextResponse.json({ status: 'received' })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[WEBHOOK_ERROR]', errorMessage, err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}