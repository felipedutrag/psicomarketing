import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[MANYCHAT_CAL_WEBHOOK] Webhook recebido:', JSON.stringify(body).substring(0, 200))
    
    // Processar webhook do Cal.com para ManyChat
    // Adicionar lógica específica conforme necessário
    
    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('[MANYCHAT_CAL_WEBHOOK] Erro:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
