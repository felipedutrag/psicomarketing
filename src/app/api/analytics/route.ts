import { NextRequest, NextResponse } from 'next/server'
import { upsertAnalytics, getConvertingMessage } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body.id || body.mc_user_id || body.mcUserId
    const nome = body.nome || body.name || null
    const telefone = body.telefone || body.phone || body.whatsapp || null
    const email = body.email || null

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    const event = body.event === 'pagamento' || body.event === 'agendamento' ? body.event : 'landing_visit'
    const mcUserId = String(id)
    const convertingMessage = await getConvertingMessage(mcUserId)

    await upsertAnalytics({
      mcUserId,
      nome,
      telefone,
      email,
      event,
      convertingMessage,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ANALYTICS API] Erro:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
