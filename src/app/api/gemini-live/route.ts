import { NextRequest, NextResponse } from 'next/server'
import { GEMINI_LIVE_CONFIG, GEMINI_LIVE_VOICES } from '@/lib/gemini-live/config'
import { GEMINI_LIVE_TOOLS, SYSTEM_INSTRUCTION } from '@/lib/gemini-live/tools'

interface RequestBody {
  action: string
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json() as RequestBody
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY não configurada no ambiente.',
      }, { status: 500 })
    }

    if (action === 'get-session-config') {
      const wsUrl = `${GEMINI_LIVE_CONFIG.WS_BASE_URL}?key=${apiKey}`

      return NextResponse.json({
        success: true,
        wsUrl,
        model: GEMINI_LIVE_CONFIG.DEFAULT_MODEL,
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [
          {
            functionDeclarations: GEMINI_LIVE_TOOLS,
          },
        ],
        voices: GEMINI_LIVE_VOICES,
      })
    }

    return NextResponse.json({ success: true, message: 'Ação realizada' })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro no servidor de IA',
    }, { status: 500 })
  }
}
