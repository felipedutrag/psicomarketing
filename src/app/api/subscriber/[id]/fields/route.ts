import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Aguarda a resolução dos parâmetros assíncronos (obrigatório no Next.js 15)
    const { id } = await params

    // 2. Coloque sua lógica de busca aqui (exemplo fictício com 'id')
    // const fields = await getSubscriberFields(id)

    return NextResponse.json({ success: true, subscriberId: id, fields: [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}