import { NextRequest, NextResponse } from 'next/server'
import { executeDashboardVoiceTool } from '@/lib/dashboard/voice-executor'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, args } = body || {}

    if (!name) {
      return NextResponse.json(
        { status: 'error', error: 'Nome da ferramenta é obrigatório' },
        { status: 400 }
      )
    }

    const result = await executeDashboardVoiceTool(String(name), (args || {}) as Record<string, unknown>)

    if (result && result.success === false) {
      return NextResponse.json({
        status: 'error',
        error: result.error || 'Erro ao executar a ferramenta',
        ...result,
      })
    }

    return NextResponse.json({ status: 'success', ...result })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro na execução da ferramenta',
      },
      { status: 500 }
    )
  }
}
