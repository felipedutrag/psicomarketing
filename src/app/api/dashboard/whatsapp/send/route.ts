import { NextRequest, NextResponse } from 'next/server'
import { getLeads, updateLead } from '@/lib/dashboard/scraping'
import { setWhatsAppStatus, getRandomDelay, formatPhoneNumber, getSendDelay, setLastSendTime, getQueuePaused, getScheduleWindow, isWithinWindow, updateStats } from '@/lib/dashboard/whatsapp'
import { getWhatsAppClient, getWhatsAppClientIfExists } from '@/lib/whatsapp/manager'

const DEFAULT_MESSAGE =
  'Olá, me chamo Gabriele, achei seu contato no Google Meu Negócio e queria apresentar uma solução que pode aumentar seus atendimentos e reduzir gastos com anúncios. Você pode falar 1 minuto?'

// Envia mensagem com fallback de reconexão automática
async function sendWithReconnect(client: any, phone: string, message: string, maxRetries = 2): Promise<any> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar saúde antes de cada tentativa
      if (attempt > 1 || !client.isReady()) {
        console.log(`[SEND] Tentativa ${attempt}/${maxRetries} - verificando conexão...`)
        const healthy = await client.isHealthy()
        if (!healthy) {
          console.warn(`[SEND] Cliente não saudável, reconectando (tentativa ${attempt})...`)
          await client.stop()
          await new Promise(r => setTimeout(r, 2000))
          await client.start()
        }
      }
      
      const result = await client.sendMessage(phone, message)
      if (attempt > 1) {
        console.log(`[SEND] Reconexão bem-sucedida na tentativa ${attempt}`)
      }
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[SEND] Erro na tentativa ${attempt}:`, lastError.message)
      
      if (attempt < maxRetries) {
        // Esperar antes de tentar novamente
        await new Promise(r => setTimeout(r, 3000 * attempt))
      }
    }
  }
  
  throw lastError || new Error('Falha ao enviar após tentativas de reconexão')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, message, leadIds } = body

    if (phone && message) {
      const client = getWhatsAppClient()

      if (!client.isReady()) {
        return NextResponse.json(
          { error: 'WhatsApp não conectado. Conecte-se primeiro para enviar mensagens.' },
          { status: 400 }
        )
      }

      try {
        const result = await sendWithReconnect(client, phone, message)
        await setWhatsAppStatus('ready')
        return NextResponse.json({
          success: true,
          count: 1,
          results: [{ phone, status: 'sent', id: result?.id?.id || result?.id?._serialized || undefined }],
        })
      } catch (error) {
        await setWhatsAppStatus('error')
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao enviar mensagem' }, { status: 500 })
      }
    }

    // Envio em lote de leads
    let leads = await getLeads()
    if (leadIds && leadIds.length > 0) {
      leads = leads.filter(lead => leadIds.includes(lead.id))
    } else {
      // Sem seleção explícita, envia apenas os que estão na fila
      leads = leads.filter(lead => lead.na_fila === true && lead.status !== 'sent' && lead.status !== 'responded')
    }

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Nenhum lead pronto para envio' }, { status: 400 })
    }

    if (await getQueuePaused()) {
      return NextResponse.json({ error: 'A fila de envio está pausada. Retome-a antes de enviar.' }, { status: 400 })
    }

    const scheduleWindow = await getScheduleWindow()
    if (!isWithinWindow(new Date(), scheduleWindow)) {
      return NextResponse.json(
        { error: `Fora do horário de envio (${scheduleWindow.start} às ${scheduleWindow.end}). Aguarde a janela abrir.` },
        { status: 400 }
      )
    }

    await setWhatsAppStatus('sending')

    const client = getWhatsAppClient()
    if (!client.isReady()) {
      await setWhatsAppStatus('error')
      return NextResponse.json(
        { error: 'WhatsApp não conectado. Conecte-se primeiro para enviar mensagens.' },
        { status: 400 }
      )
    }

    const { delayMin, delayMax } = await getSendDelay()

    const results = []
    let skipped = 0

    for (const lead of leads) {
      if (!lead.whatsapp) {
        skipped++
        results.push({ lead: lead.nome, phone: '', status: 'skipped' })
        continue
      }

      const targetPhone = formatPhoneNumber(lead.whatsapp)
      const text = lead.mensagem_personalizada || lead.mensagem_inicial || DEFAULT_MESSAGE

      try {
        await sendWithReconnect(client, targetPhone, text)
        await updateLead(lead.id, {
          status: 'sent',
          na_fila: false,
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

      // Delay anti-ban configurável entre as mensagens
      const delay = getRandomDelay(delayMin * 1000, delayMax * 1000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Registra o fim do disparo para a fila calcular o próximo envio
    await setLastSendTime(Date.now())
    await updateStats()

    await setWhatsAppStatus('ready')

    return NextResponse.json({
      success: true,
      count: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      errored: results.filter(r => r.status === 'error').length,
      skipped,
      results,
    })
  } catch (error) {
    await setWhatsAppStatus('error')
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao enviar mensagens' }, { status: 500 })
  }
}