import { NextRequest, NextResponse } from 'next/server'
import { saveLeads, getLeads, clearLeads, parseManualInput } from '@/lib/dashboard/scraping'
import { updateStats } from '@/lib/dashboard/whatsapp'
import type { Lead } from '@/lib/dashboard/config'

export async function GET() {
  try {
    const leads = await getLeads()
    return NextResponse.json({ leads })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, data } = body

    if (action === 'import') {
      const { input } = data
      const parsedLeads = parseManualInput(input)
      await saveLeads(parsedLeads as unknown as Lead[])
      await updateStats()
      return NextResponse.json({ success: true, count: parsedLeads.length })
    }

    if (action === 'clear') {
      await clearLeads()
      await updateStats()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao processar leads' }, { status: 500 })
  }
}
