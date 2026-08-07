import { NextRequest, NextResponse } from 'next/server'
import { GEMINI_LIVE_CONFIG } from '@/lib/gemini-live/config'
import { DASHBOARD_VOICE_TOOLS, buildDashboardVoiceInstruction } from '@/lib/dashboard/voice'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId') || 'dashboard_voice_session'
    const voiceName = searchParams.get('voiceName') || GEMINI_LIVE_CONFIG.DEFAULT_VOICE

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

    return NextResponse.json({
      key: apiKey,
      tools: DASHBOARD_VOICE_TOOLS,
      systemInstruction: buildDashboardVoiceInstruction(),
      voiceName,
      sessionId,
      model: GEMINI_LIVE_CONFIG.DEFAULT_MODEL,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro no setup da Voz da Dashboard' },
      { status: 500 }
    )
  }
}
