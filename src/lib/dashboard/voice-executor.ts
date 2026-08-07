import { scrapeLeadsByCities } from './maps-scraper'
import {
  getLeads,
  saveLeads,
  saveScrapedLeads,
  deleteLead,
  updateLead,
  updateLeadsBatch,
  clearLeads,
  getLeadById,
} from './scraping'
import {
  updateStats,
  getStats,
  getWhatsAppStatus,
  setWhatsAppStatus,
  formatPhoneNumber,
  getSendDelay,
  saveSendDelay,
  getQueuePaused,
  setQueuePaused,
} from './whatsapp'
import { personalizeMessages } from './ai-personalizer'
import { initializeWhatsApp, getWhatsAppClient, getWhatsAppClientIfExists } from '@/lib/whatsapp/manager'
import type { Lead } from './config'

export type DashboardVoiceToolResult = Record<string, unknown>

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function toStrArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).filter(Boolean)
}

function toIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).filter(Boolean)
}

function filterByCity(leads: Lead[], cidade: string): Lead[] {
  const needle = cidade.trim().toLowerCase()
  if (!needle) return leads
  return leads.filter(
    lead =>
      (lead.endereco || '').toLowerCase().includes(needle) ||
      (lead.nome || '').toLowerCase().includes(needle)
  )
}

async function ensureWhatsAppReady(): Promise<boolean> {
  const client = getWhatsAppClient()
  if (client.isReady()) return true
  try {
    await initializeWhatsApp()
    return await client.waitForReady(45000)
  } catch {
    return false
  }
}

export async function executeDashboardVoiceTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<DashboardVoiceToolResult> {
  switch (name) {
    case 'executarScraping': {
      const cities = toStrArray(args.cidades)
      const leadsPerCity = Math.min(Math.max(Number(args.leadsPorCidade) || 10, 1), 50)
      const templateUrl = args.urlModelo
        ? String(args.urlModelo).trim()
        : 'https://www.google.com/maps/search/psicologos+em+${CIDADE}'

      if (cities.length === 0) {
        return { success: false, error: 'Informe ao menos uma cidade para a extração.' }
      }
      if (!templateUrl.includes('${CIDADE}')) {
        return {
          success: false,
          error: 'A URL modelo deve conter o placeholder ${CIDADE}.',
        }
      }

      const scraped = await scrapeLeadsByCities(templateUrl, cities, leadsPerCity)
      const saved = await saveScrapedLeads(scraped)
      await updateStats()

      return {
        success: true,
        message: `Extração concluída: ${saved.length} novos leads importados de ${scraped.length} encontrados (${cities.length} cidades).`,
        count: saved.length,
        scraped: scraped.length,
        cidades: cities,
        leadsPorCidade: leadsPerCity,
        resultados: saved.map(l => ({ nome: l.nome, whatsapp: l.whatsapp })),
      }
    }

    case 'conectarWhatsApp': {
      try {
        await initializeWhatsApp()
        const status = await getWhatsAppStatus()
        return {
          success: true,
          message:
            status === 'ready' || status === 'connected'
              ? 'WhatsApp conectado com sucesso.'
              : 'WhatsApp em conexão. Se necessário, escaneie o QR code exibido no painel.',
          status,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Falha ao conectar o WhatsApp.',
        }
      }
    }

    case 'desconectarWhatsApp': {
      const client = getWhatsAppClientIfExists()
      if (client) {
        await client.stop()
      } else {
        await setWhatsAppStatus('disconnected')
      }
      return { success: true, message: 'WhatsApp desconectado.', status: 'disconnected' }
    }

    case 'statusWhatsApp': {
      const status = await getWhatsAppStatus()
      const labels: Record<string, string> = {
        disconnected: 'desconectado',
        connecting: 'conectando',
        connected: 'conectado',
        ready: 'pronto para envio',
        sending: 'enviando mensagens',
        error: 'com erro',
      }
      return {
        success: true,
        message: `O WhatsApp está ${labels[status] || status}.`,
        status,
      }
    }

    case 'verEstatisticas': {
      await updateStats()
      const stats = await getStats()
      return { success: true, stats }
    }

    case 'verLeads': {
      const cidade = String(args.cidade || '').trim()
      const status = String(args.status || '').trim()
      const limite = Math.min(Math.max(Number(args.limite) || 20, 1), 100)

      let leads = await getLeads()
      if (cidade) leads = filterByCity(leads, cidade)
      if (status) leads = leads.filter(l => l.status === status)

      const limited = leads.slice(0, limite)
      return {
        success: true,
        message: `${leads.length} lead(s) encontrado(s).`,
        count: leads.length,
        leads: limited.map(l => ({
          id: l.id,
          nome: l.nome,
          whatsapp: l.whatsapp,
          cidade: l.endereco || '',
          status: l.status,
          na_fila: Boolean(l.na_fila),
        })),
      }
    }

    case 'adicionarLeads': {
      const contatos = Array.isArray(args.contatos) ? args.contatos : []
      const leads: Lead[] = []

      for (const c of contatos) {
        const obj = (c || {}) as Record<string, unknown>
        const nome = String(obj.nome || '').trim()
        const whatsapp = String(obj.whatsapp || '').replace(/\D/g, '')
        if (!nome || !whatsapp) continue
        leads.push({
          id: randomId('lead'),
          nome,
          whatsapp,
          website: obj.website ? String(obj.website).trim() : undefined,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      }

      if (leads.length === 0) {
        return {
          success: false,
          error: 'Nenhum contato válido informado (nome e whatsapp são obrigatórios).',
        }
      }

      await saveLeads(leads)
      await updateStats()
      return {
        success: true,
        message: `${leads.length} lead(s) adicionado(s) com sucesso.`,
        count: leads.length,
        leads: leads.map(l => ({ id: l.id, nome: l.nome, whatsapp: l.whatsapp })),
      }
    }

    case 'removerLeads': {
      const ids = toIds(args.ids)
      const cidade = String(args.cidade || '').trim()
      const whatsapp = String(args.whatsapp || '').replace(/\D/g, '')

      if (ids.length === 0 && !cidade && !whatsapp) {
        return {
          success: false,
          error: 'Informe IDs, uma cidade ou um número de whatsapp para remover leads.',
        }
      }

      let leads = await getLeads()
      if (ids.length > 0) {
        leads = leads.filter(l => ids.includes(l.id))
      } else if (cidade) {
        leads = filterByCity(leads, cidade)
      } else if (whatsapp) {
        leads = leads.filter(l => String(l.whatsapp || '').replace(/\D/g, '') === whatsapp)
      }

      if (leads.length === 0) {
        return { success: true, message: 'Nenhum lead correspondente encontrado.', count: 0 }
      }

      for (const lead of leads) {
        await deleteLead(lead.id)
      }
      await updateStats()
      return {
        success: true,
        message: `${leads.length} lead(s) removido(s).`,
        count: leads.length,
      }
    }

    case 'limparLeads': {
      await clearLeads()
      await updateStats()
      return { success: true, message: 'Todos os leads foram removidos.' }
    }

    case 'adicionarListaEspera': {
      const ids = toIds(args.ids)
      const cidade = String(args.cidade || '').trim()
      const escopo = String(args.escopo || '').trim()

      let leads = await getLeads()
      if (ids.length > 0) {
        leads = leads.filter(l => ids.includes(l.id))
      } else if (cidade) {
        leads = filterByCity(leads, cidade)
      } else if (escopo === 'todos') {
        leads = leads.filter(l => l.status !== 'sent' && l.status !== 'responded')
      } else {
        return {
          success: false,
          error: 'Informe IDs, uma cidade ou escopo "todos" para adicionar à lista de espera.',
        }
      }

      leads = leads.filter(l => l.status !== 'sent' && l.status !== 'responded')
      if (leads.length === 0) {
        return { success: true, message: 'Nenhum lead disponível para adicionar à lista de espera.', count: 0 }
      }

      await updateLeadsBatch(
        leads.map(l => l.id),
        { na_fila: true }
      )
      return {
        success: true,
        message: `${leads.length} lead(s) adicionado(s) à lista de espera.`,
        count: leads.length,
      }
    }

    case 'removerListaEspera': {
      const ids = toIds(args.ids)
      const cidade = String(args.cidade || '').trim()

      let leads = await getLeads()
      if (ids.length > 0) {
        leads = leads.filter(l => ids.includes(l.id))
      } else if (cidade) {
        leads = filterByCity(leads, cidade)
      } else {
        return {
          success: false,
          error: 'Informe IDs ou uma cidade para remover da lista de espera.',
        }
      }

      leads = leads.filter(l => l.na_fila === true)
      if (leads.length === 0) {
        return { success: true, message: 'Nenhum lead na lista de espera correspondente.', count: 0 }
      }

      await updateLeadsBatch(
        leads.map(l => l.id),
        { na_fila: false }
      )
      return {
        success: true,
        message: `${leads.length} lead(s) removido(s) da lista de espera.`,
        count: leads.length,
      }
    }

    case 'pausarFila': {
      await setQueuePaused(true)
      return { success: true, message: 'A fila de disparo foi pausada.', paused: true }
    }

    case 'retomarFila': {
      await setQueuePaused(false)
      return { success: true, message: 'A fila de disparo foi retomada.', paused: false }
    }

    case 'personalizarMensagens': {
      const baseMessage = String(args.mensagemBase || '').trim()
      if (!baseMessage) {
        return { success: false, error: 'A mensagem base é obrigatória para personalizar.' }
      }
      const customPrompt = args.promptPersonalizado ? String(args.promptPersonalizado).trim() : undefined
      const ids = toIds(args.ids)
      const cidade = String(args.cidade || '').trim()

      let leads = await getLeads()
      if (ids.length > 0) {
        leads = leads.filter(l => ids.includes(l.id))
      } else if (cidade) {
        leads = filterByCity(leads, cidade)
      } else {
        leads = leads.filter(l => l.status === 'pending')
      }

      if (leads.length === 0) {
        return {
          success: false,
          error: 'Nenhum lead encontrado para personalizar.',
        }
      }

      const personalized = await personalizeMessages({
        leads: leads.map(l => ({ nome: l.nome, whatsapp: String(l.whatsapp) })),
        baseMessage,
        customPrompt,
      })

      const byWhatsapp = new Map<string, string>()
      for (const item of personalized) {
        byWhatsapp.set(String(item.whatsapp), item.mensagem_personalizada)
      }

      for (const lead of leads) {
        const mensagem = byWhatsapp.get(String(lead.whatsapp)) || baseMessage.replace(/{nome}/gi, lead.nome)
        await updateLead(lead.id, {
          mensagem_personalizada: mensagem,
          status: 'personalized',
        })
      }

      return {
        success: true,
        message: `${leads.length} mensagem(ns) personalizada(s) com sucesso.`,
        count: leads.length,
      }
    }

    case 'enviarMensagem': {
      const leadId = String(args.leadId || '').trim()
      const whatsapp = String(args.whatsapp || '').trim()
      const mensagem = String(args.mensagem || '').trim()

      let targetPhone = whatsapp
      let text = mensagem

      if (leadId) {
        const lead = await getLeadById(leadId)
        if (!lead) {
          return { success: false, error: 'Lead não encontrado.' }
        }
        targetPhone = String(lead.whatsapp || '')
        text = mensagem || lead.mensagem_personalizada || lead.mensagem_inicial || ''
      }

      if (!targetPhone || !text) {
        return {
          success: false,
          error: 'Informe um número/whatsapp válido e o texto da mensagem.',
        }
      }

      if (!(await ensureWhatsAppReady())) {
        return {
          success: false,
          error: 'WhatsApp não conectado. Conecte-se primeiro para enviar mensagens.',
        }
      }

      try {
        const client = getWhatsAppClient()
        await client.sendMessage(formatPhoneNumber(targetPhone), text)
        if (leadId) {
          await updateLead(leadId, {
            status: 'sent',
            na_fila: false,
            data_envio: new Date().toISOString(),
          })
        }
        await updateStats()
        return { success: true, message: 'Mensagem enviada com sucesso.', phone: targetPhone }
      } catch (error) {
        await setWhatsAppStatus('error')
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Falha ao enviar a mensagem.',
        }
      }
    }

    case 'configurarDelay': {
      const delayMin = Math.max(Number(args.delayMin) || 0, 1)
      const delayMax = Math.max(Number(args.delayMax) || delayMin, delayMin)
      await saveSendDelay(delayMin, delayMax)
      return {
        success: true,
        message: `Intervalo anti-ban configurado: ${delayMin}s a ${delayMax}s.`,
        delayMin,
        delayMax,
      }
    }

    case 'statusFila': {
      const paused = await getQueuePaused()
      const { delayMin, delayMax } = await getSendDelay()
      return {
        success: true,
        paused,
        delayMin,
        delayMax,
        message: paused
          ? 'A fila está pausada.'
          : `A fila está ativa com intervalo de ${delayMin}s a ${delayMax}s.`,
      }
    }

    default:
      return { success: false, error: `Ferramenta desconhecida: ${name}` }
  }
}
