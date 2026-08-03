import { NextRequest, NextResponse } from 'next/server'

interface VoiceHistoryRequestBody {
  sessionId: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as VoiceHistoryRequestBody
    return NextResponse.json({ success: true, saved: true, sessionId: body.sessionId })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
