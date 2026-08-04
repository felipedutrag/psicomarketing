import { NextRequest, NextResponse } from 'next/server'
import { GEMINI_LIVE_CONFIG } from '@/lib/gemini-live/config'
import { GEMINI_LIVE_TOOLS, buildSystemInstruction } from '@/lib/gemini-live/tools'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId') || 'session_default'
    const voiceName = searchParams.get('voiceName') || GEMINI_LIVE_CONFIG.DEFAULT_VOICE
    const nome = searchParams.get('nome') || undefined
    const id = searchParams.get('id') || undefined

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

    return NextResponse.json({
      key: apiKey,
      tools: GEMINI_LIVE_TOOLS,
      systemInstruction: buildSystemInstruction({ nome, id }),
      voiceName,
      sessionId,
      model: GEMINI_LIVE_CONFIG.DEFAULT_MODEL,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro no setup Gemini Live' },
      { status: 500 }
    )
  }
}
