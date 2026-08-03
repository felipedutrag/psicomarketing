import { NextRequest, NextResponse } from 'next/server'
import { getLeads, updateLead } from '@/lib/dashboard/scraping'
import { setWhatsAppStatus, getRandomDelay, formatPhoneNumber } from '@/lib/dashboard/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, message, leadIds } = body

    if (phone && message) {
      const { getWhatsAppClient } = await import('@/lib/whatsapp/manager')
      const client = getWhatsAppClient()

      if (!client.isReady()) {
        return NextResponse.json(
          { error: 'WhatsApp não conectado. Conecte-se primeiro para enviar mensagens.' },
          { status: 400 }
        )
      }

      const result = await client.sendMessage(phone, message)
      await setWhatsAppStatus('ready')
      return NextResponse.json({
        success: true,
        count: 1,
        results: [{ phone, status: 'sent', id: result?.id?.id || result?.id?._serialized || undefined }],
      })
    }

    // Envio em lote de leads
    let leads = await getLeads()
    if (leadIds && leadIds.length > 0) {
      leads = leads.filter(lead => leadIds.includes(lead.id))
    } else {
      leads = leads.filter(lead => lead.status === 'personalized')
    }

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Nenhum lead pronto para envio' }, { status: 400 })
    }

    await setWhatsAppStatus('sending')

    const { getWhatsAppClient } = await import('@/lib/whatsapp/manager')
    const client = getWhatsAppClient()
    if (!client.isReady()) {
      await setWhatsAppStatus('error')
      return NextResponse.json(
        { error: 'WhatsApp não conectado. Conecte-se primeiro para enviar mensagens.' },
        { status: 400 }
      )
    }

    const results = []
    for (const lead of leads) {
      const targetPhone = formatPhoneNumber(lead.whatsapp)
      const text = lead.mensagem_personalizada || lead.mensagem_inicial

      if (!text) {
        continue
      }

      try {
        await client.sendMessage(targetPhone, text)
        await updateLead(lead.id, {
          status: 'sent',
          data_envio: new Date().toISOString(),
        })
        results.push({ lead: lead.nome, phone: targetPhone, status: 'sent' })
      } catch (error) {
        await updateLead(lead.id, {
          status: 'error',
          erro: error instanceof Error ? error.message : 'Erro ao enviar',
        })
        results.push({ lead: lead.nome, phone: targetPhone, status: 'error' })
      }

      const delay = getRandomDelay()
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 1000)))
    }

    await setWhatsAppStatus('ready')

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    })
  } catch (error) {
    await setWhatsAppStatus('error')
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao enviar mensagens' }, { status: 500 })
  }
}