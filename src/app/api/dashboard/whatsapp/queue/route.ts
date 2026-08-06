import { NextRequest, NextResponse } from 'next/server'
import { getLeads, updateLeadsBatch } from '@/lib/dashboard/scraping'
import { getSendDelay, getLastSendTime, getQueuePaused, setQueuePaused, getScheduleContext } from '@/lib/dashboard/whatsapp'

// Fila explícita: só entram leads com na_fila === true (adicionados manualmente)
export async function GET() {
  try {
    const leads = await getLeads()
    const queue = leads.filter(
      lead => lead.na_fila === true && lead.status !== 'sent' && lead.status !== 'responded'
    )
    const { delayMin, delayMax } = await getSendDelay()
    const lastSendAt = await getLastSendTime()
    const paused = await getQueuePaused()
    const { schedule, withinWindow, nextOpenAt } = await getScheduleContext()

    return NextResponse.json({
      queue,
      delayMin,
      delayMax,
      lastSendAt,
      paused,
      schedule,
      withinWindow,
      nextOpenAt,
      now: Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar fila de envio' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, leadIds } = body

    switch (action) {
      case 'add': {
        if (!leadIds || leadIds.length === 0) {
          return NextResponse.json({ error: 'Nenhum lead informado' }, { status: 400 })
        }
        await updateLeadsBatch(leadIds, { na_fila: true })
        return NextResponse.json({ success: true, count: leadIds.length })
      }

      case 'remove': {
        if (!leadIds || leadIds.length === 0) {
          return NextResponse.json({ error: 'Nenhum lead informado' }, { status: 400 })
        }
        await updateLeadsBatch(leadIds, { na_fila: false })
        return NextResponse.json({ success: true, count: leadIds.length })
      }

      case 'clear': {
        const leads = await getLeads()
        const queued = leads.filter(
          lead => lead.na_fila === true && lead.status !== 'sent' && lead.status !== 'responded'
        )
        await updateLeadsBatch(queued.map(lead => lead.id), { na_fila: false })
        return NextResponse.json({ success: true, count: queued.length })
      }

      case 'pause': {
        await setQueuePaused(true)
        return NextResponse.json({ success: true, paused: true })
      }

      case 'resume': {
        await setQueuePaused(false)
        return NextResponse.json({ success: true, paused: false })
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao modificar fila de envio' },
      { status: 500 }
    )
  }
}