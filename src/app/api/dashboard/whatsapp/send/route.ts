import { NextRequest, NextResponse } from 'next/server'
import { getLeads, updateLead } from '@/lib/dashboard/scraping'
import { setWhatsAppStatus, getRandomDelay, formatPhoneNumber } from '@/lib/dashboard/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadIds } = body

    // Buscar leads para enviar
    let leads = await getLeads()
    if (leadIds && leadIds.length > 0) {
      leads = leads.filter(lead => leadIds.includes(lead.id))
    } else {
      leads = leads.filter(lead => lead.status === 'personalized')
    }

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Nenhum lead pronto para envio' }, { status: 400 })
    }

    // Atualizar status para sending
    await setWhatsAppStatus('sending')

    // Simular envio (em produção, isso chamaria o script Node.js)
    // Por enquanto, vamos apenas marcar como enviados com delay
    const results = []
    for (const lead of leads) {
      const phone = formatPhoneNumber(lead.whatsapp)
      const message = lead.mensagem_personalizada || lead.mensagem_inicial

      if (!message) {
        continue
      }

      // Simular envio (delay para evitar ban)
      const delay = getRandomDelay()
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 1000))) // Delay reduzido para demo

      // Atualizar lead como enviado
      await updateLead(lead.id, {
        status: 'sent',
        data_envio: new Date().toISOString(),
      })

      results.push({
        lead: lead.nome,
        phone,
        status: 'sent',
      })
    }

    await setWhatsAppStatus('ready')

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      results 
    })
  } catch (error) {
    await setWhatsAppStatus('error')
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao enviar mensagens' }, { status: 500 })
  }
}
