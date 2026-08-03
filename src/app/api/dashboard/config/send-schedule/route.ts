import { NextRequest, NextResponse } from 'next/server'
import { getScheduleWindow, saveScheduleWindow } from '@/lib/dashboard/whatsapp'

export async function GET() {
  try {
    const schedule = await getScheduleWindow()
    return NextResponse.json({ schedule })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar horário de envio' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { enabled, start, end } = body

    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/
    if (!validTime.test(start) || !validTime.test(end)) {
      return NextResponse.json(
        { error: 'Informe horários válidos no formato HH:MM (ex.: 09:00 e 17:00)' },
        { status: 400 }
      )
    }

    if (start === end) {
      return NextResponse.json(
        { error: 'O horário de início e fim não podem ser iguais' },
        { status: 400 }
      )
    }

    await saveScheduleWindow(!!enabled, start, end)
    return NextResponse.json({ success: true, schedule: { enabled: !!enabled, start, end } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar horário de envio' },
      { status: 500 }
    )
  }
}