import { NextRequest, NextResponse } from 'next/server'

interface DashboardVoiceHistoryBody {
  userId?: string
  sessionId?: string
  history?: unknown[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DashboardVoiceHistoryBody
    return NextResponse.json({ success: true, logged: true, sessionId: body.sessionId })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao registrar histórico' },
      { status: 500 }
    )
  }
}
