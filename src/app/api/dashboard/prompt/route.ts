import { NextRequest, NextResponse } from 'next/server'
import { getCustomPrompt, setCustomPrompt, resetToDefault, getDefaultPrompt } from '@/lib/dashboard/prompt-manager'

export async function GET() {
  try {
    const customPrompt = await getCustomPrompt()
    const defaultPrompt = await getDefaultPrompt()
    
    return NextResponse.json({ 
      customPrompt, 
      defaultPrompt,
      hasCustom: !!customPrompt
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar prompt' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, prompt } = body

    if (action === 'save') {
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 })
      }
      await setCustomPrompt(prompt)
      return NextResponse.json({ success: true })
    }

    if (action === 'reset') {
      await resetToDefault()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao salvar prompt' }, { status: 500 })
  }
}
