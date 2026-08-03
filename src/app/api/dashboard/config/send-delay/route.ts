import { NextRequest, NextResponse } from 'next/server'
import { getSendDelay, saveSendDelay } from '@/lib/dashboard/whatsapp'

export async function GET() {
  try {
    const delay = await getSendDelay()
    return NextResponse.json({ delay })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar delay' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const delayMin = Math.max(Number(body.delayMin), 1)
    const delayMax = Math.max(Number(body.delayMax), delayMin)

    await saveSendDelay(delayMin, delayMax)
    return NextResponse.json({ success: true, delay: { delayMin, delayMax } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao salvar delay' }, { status: 500 })
  }
}
