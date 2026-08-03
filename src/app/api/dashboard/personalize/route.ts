import { NextRequest, NextResponse } from 'next/server'
import { personalizeMessages } from '@/lib/dashboard/ai-personalizer'
import { getLeads, updateLead } from '@/lib/dashboard/scraping'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { baseMessage, customPrompt, leadIds } = body

    if (!baseMessage) {
      return NextResponse.json({ error: 'Mensagem base é obrigatória' }, { status: 400 })
    }

    // Buscar leads selecionados ou todos pendentes
    let leads = await getLeads()
    if (leadIds && leadIds.length > 0) {
      leads = leads.filter(lead => leadIds.includes(lead.id))
    } else {
      leads = leads.filter(lead => lead.status === 'pending')
    }

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Nenhum lead encontrado para personalizar' }, { status: 400 })
    }

    // Personalizar mensagens com IA
    const personalized = await personalizeMessages({
      leads: leads.map(lead => ({ nome: lead.nome, whatsapp: lead.whatsapp })),
      baseMessage,
      customPrompt,
    })

    // Atualizar leads com mensagens personalizadas
    for (const item of personalized) {
      const lead = leads.find(l => l.whatsapp === item.whatsapp)
      if (lead) {
        await updateLead(lead.id, {
          mensagem_personalizada: item.mensagem_personalizada,
          status: 'personalized',
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: personalized.length,
      messages: personalized 
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao personalizar mensagens' }, { status: 500 })
  }
}
