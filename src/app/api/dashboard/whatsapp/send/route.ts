import { NextRequest, NextResponse } from 'next/server'
import { getLeads, getLeadById, updateLead } from '@/lib/dashboard/scraping'
import { setWhatsAppStatus, getWhatsAppStatus, getRandomDelay, formatPhoneNumber, getSendDelay, setLastSendTime, getQueuePaused, getScheduleWindow, isWithinWindow, updateStats } from '@/lib/dashboard/whatsapp'
import { getWhatsAppClient, getWhatsAppClientIfExists, initializeWhatsApp } from '@/lib/whatsapp/manager'

const DEFAULT_MESSAGE =
  'Olá, me chamo Gabriele, achei seu contato no Google Meu Negócio e queria apresentar uma solução que pode aumentar seus atendimentos e reduzir gastos com anúncios. Você pode falar 1 minuto?'

// Lock de concorrência em memória (processo único). O status 'sending' no Redis
// é usado apenas para exibição no painel — usar o Redis como lock fazia o envio
// ficar bloqueado para sempre ("já está em processamento") se o processo
// morresse no meio do disparo, pois o status persistia.
let sendInProgress = false

// Garante que o cliente esteja conectado antes de enviar. Se não estiver,
// tenta (re)conectar aguardando o ready. Retorna true se pronto, false caso
// contrário (ex.: cooldown de reconexão ativo ou QR pendente).
async function ensureWhatsAppReady(client: any): Promise<boolean> {
  if (client.isReady()) return true

  console.log('[SEND] WhatsApp não conectado, tentando reconectar...')
  try {
    await initializeWhatsApp()
    return await client.waitForReady(45000)
  } catch (error) {
    console.error('[SEND] Falha na reconexão:', error instanceof Error ? error.message : error)
    return false
  }
}

// Envia mensagem com fallback de reconexão automática
async function sendWithReconnect(client: any, phone: string, message: string, maxRetries = 2): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar saúde antes de cada tentativa (incluindo a primeira)
      console.log(`[SEND] Tentativa ${attempt}/${maxRetries} - verificando conexão...`)
      const connected = await ensureWhatsAppReady(client)
      if (!connected) {
        throw new Error('WhatsApp não conectado após tentativa de reconexão')
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
        // Força stop/start limpo antes da próxima tentativa para sair de estados ruins
        try {
          await client.stop()
        } catch {
          // ignora
        }
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

      // Não retorna 400 imediatamente: tenta reconectar antes
      if (!(await ensureWhatsAppReady(client))) {
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

    // Nunca reenviar leads já enviados ou que responderam, mesmo se selecionados.
    leads = leads.filter(lead => lead.status !== 'sent' && lead.status !== 'responded')

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Nenhum lead pronto para envio' }, { status: 400 })
    }

    if (await getQueuePaused()) {
      return NextResponse.json({ error: 'A fila de envio está pausada. Retome-a antes de enviar.' }, { status: 400 })
    }

    if (sendInProgress) {
      return NextResponse.json({ error: 'A fila de envio já está em processamento.' }, { status: 400 })
    }

    const scheduleWindow = await getScheduleWindow()
    if (!isWithinWindow(new Date(), scheduleWindow)) {
      return NextResponse.json(
        { error: `Fora do horário de envio (${scheduleWindow.start} às ${scheduleWindow.end}). Aguarde a janela abrir.` },
        { status: 400 }
      )
    }

    sendInProgress = true
    await setWhatsAppStatus('sending')

    const client = getWhatsAppClient()
    if (!(await ensureWhatsAppReady(client))) {
      sendInProgress = false
      await setWhatsAppStatus('error')
      return NextResponse.json(
        { error: 'WhatsApp não conectado. Conecte-se primeiro para enviar mensagens.' },
        { status: 400 }
      )
    }

    const { delayMin, delayMax } = await getSendDelay()

    const results = []
    let skipped = 0

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      if (!lead.whatsapp) {
        skipped++
        results.push({ lead: lead.nome, phone: '', status: 'skipped' })
        continue
      }

      // Verificação atômica: recarrega o lead para garantir que não foi enviado por outra instância
      const currentLead = await getLeadById(lead.id)
      if (!currentLead || currentLead.status === 'sent' || currentLead.status === 'responded') {
        continue
      }

      const targetPhone = formatPhoneNumber(currentLead.whatsapp)
      const text = currentLead.mensagem_personalizada || currentLead.mensagem_inicial || DEFAULT_MESSAGE

      try {
        await sendWithReconnect(client, targetPhone, text)
        await updateLead(currentLead.id, {
          status: 'sent',
          na_fila: false,
          data_envio: new Date().toISOString(),
        })
        results.push({ lead: currentLead.nome, phone: targetPhone, status: 'sent' })
      } catch (error) {
        await updateLead(currentLead.id, {
          status: 'error',
          erro: error instanceof Error ? error.message : 'Erro ao enviar',
        })
        results.push({ lead: currentLead.nome, phone: targetPhone, status: 'error' })
      }

      // Delay anti-ban configurável entre as mensagens (não após a última)
      if (i < leads.length - 1) {
        const delay = getRandomDelay(delayMin * 1000, delayMax * 1000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
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
  } finally {
    // Garante que o lock é liberado mesmo se o processo continuar após erro
    sendInProgress = false
  }
}