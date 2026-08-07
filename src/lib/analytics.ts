import { supabase } from '@/lib/dashboard/supabase'
import { getSubscriber } from '@/lib/manychat'

export type AnalyticsEvent = 'landing_visit' | 'agendamento' | 'pagamento'

export interface AnalyticsInput {
  mcUserId: string
  nome?: string | null
  telefone?: string | null
  email?: string | null
  event: AnalyticsEvent
  convertingMessage?: string | null
  externalId?: string | null
}

export interface PaymentInput {
  mcUserId?: string | null
  externalId?: string | null
  transactionId?: string | null
  orderId?: string | null
  status: string
  tipo?: string
  amountCents?: number | null
  amountBRL?: number | null
  payerName?: string | null
  payerEmail?: string | null
  payerPhone?: string | null
  payerDocument?: string | null
  paidAt?: string | null
  raw?: unknown
}

const STAGE_PRIORITY: Record<string, number> = {
  f_quebra_objecao: 1,
  f_interessado: 2,
  f_fechamento: 3,
  pago: 4,
}

const MAX_MESSAGE_LENGTH = 600

// Retorna a "mensagem que converteu": a mensagem de prospecção enviada pela
// dashboard (a que passa pela lista de leads — mensagem_personalizada/mensagem_inicial).
// Localiza o assinante no ManyChat pelo mc_user_id, obtém o telefone e busca o
// lead correspondente na tabela `leads` da dashboard.
export async function getConvertingMessage(mcUserId: string): Promise<string | null> {
  try {
    let phone: string | null = null
    try {
      const info = await getSubscriber(mcUserId)
      phone =
        info?.data?.phone ||
        info?.data?.phone_number ||
        info?.data?.whatsapp_phone ||
        info?.data?.system_fields?.phone ||
        info?.data?.custom_fields?.phone ||
        null
      if (phone) phone = String(phone).replace(/\D/g, '')
    } catch (err) {
      console.error('[ANALYTICS] Erro ao buscar telefone do assinante:', err)
    }

    if (!phone || phone.length < 10) return null

    // Tenta casar com e sem o DDI 55 (a dashboard normaliza com 55; o ManyChat pode variar)
    const patterns = [phone]
    if (phone.startsWith('55') && phone.length > 11) {
      patterns.push(phone.slice(2))
    } else if (phone.length <= 11) {
      patterns.push(`55${phone}`)
    }

    const or = patterns.map((p) => `whatsapp.ilike.%${p}%`).join(',')
    const { data, error } = await supabase
      .from('leads')
      .select('mensagem_personalizada, mensagem_inicial')
      .or(or)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[ANALYTICS] Erro ao buscar lead na dashboard:', error)
      return null
    }

    if (data && data.length > 0) {
      for (const lead of data) {
        const msg = lead.mensagem_personalizada || lead.mensagem_inicial
        if (msg && msg.trim()) {
          return msg.trim().slice(0, MAX_MESSAGE_LENGTH)
        }
      }
    }
    return null
  } catch (err) {
    console.error('[ANALYTICS] Erro ao buscar mensagem que converteu:', err)
    return null
  }
}

// Registra (ou atualiza) a linha do lead no funil. 1 linha por mc_user_id.
export async function upsertAnalytics(input: AnalyticsInput): Promise<void> {
  try {
    const { mcUserId, nome, telefone, email, event, convertingMessage, externalId } = input
    if (!mcUserId) return
    const now = new Date().toISOString()
    const eventStage = event === 'pagamento' ? 'pago' : event === 'agendamento' ? 'f_fechamento' : 'f_interessado'

    const { data: existing } = await supabase
      .from('analytics')
      .select('stage, acessou_landing_at, agendou_at, pagou_at, mensagem_conversao, nome, telefone, email, external_id')
      .eq('mc_user_id', mcUserId)
      .maybeSingle()

    const merged: Record<string, unknown> = {
      mc_user_id: mcUserId,
      updated_at: now,
    }

    if (nome) merged.nome = nome
    if (telefone) merged.telefone = telefone
    if (email) merged.email = email
    if (externalId) merged.external_id = externalId

    const currentStage = existing?.stage
    if (!currentStage || (STAGE_PRIORITY[eventStage] ?? 0) > (STAGE_PRIORITY[currentStage] ?? 0)) {
      merged.stage = eventStage
    }

    if (!existing?.acessou_landing_at && event === 'landing_visit') merged.acessou_landing_at = now
    if (!existing?.agendou_at && event === 'agendamento') merged.agendou_at = now
    if (!existing?.pagou_at && event === 'pagamento') merged.pagou_at = now

    if (convertingMessage) merged.mensagem_conversao = convertingMessage

    const { error } = await supabase.from('analytics').upsert(merged, { onConflict: 'mc_user_id' })
    if (error) console.error('[ANALYTICS] Erro no upsert:', error)
  } catch (err) {
    console.error('[ANALYTICS] Erro no upsert:', err)
  }
}

// Insere (ou atualiza de forma idempotente) um pagamento por transaction_id.
export async function insertPayment(
  input: PaymentInput
): Promise<{ paymentId: number | null; renewalLinkSent: boolean }> {
  try {
    const values: Record<string, unknown> = {
      mc_user_id: input.mcUserId || null,
      external_id: input.externalId || null,
      transaction_id: input.transactionId || null,
      order_id: input.orderId || null,
      status: input.status,
      tipo: input.tipo || 'assinatura',
      amount_cents: input.amountCents ?? null,
      amount_brl: input.amountBRL ?? null,
      payer_name: input.payerName || null,
      payer_email: input.payerEmail || null,
      payer_phone: input.payerPhone || null,
      payer_document: input.payerDocument || null,
      paid_at: input.paidAt || null,
      raw: input.raw ? JSON.stringify(input.raw) : null,
    }

    const base = supabase.from('payments').upsert(values, { onConflict: 'transaction_id' })

    if (input.transactionId) {
      const { data, error } = await base.select('id, renewal_link_sent').maybeSingle()
      if (error) {
        console.error('[ANALYTICS] Erro ao inserir pagamento:', error)
        return { paymentId: null, renewalLinkSent: false }
      }
      return { paymentId: data?.id ?? null, renewalLinkSent: data?.renewal_link_sent ?? false }
    }

    const { error } = await base
    if (error) console.error('[ANALYTICS] Erro ao inserir pagamento:', error)
    return { paymentId: null, renewalLinkSent: false }
  } catch (err) {
    console.error('[ANALYTICS] Erro ao inserir pagamento:', err)
    return { paymentId: null, renewalLinkSent: false }
  }
}

export async function markRenewalSent(transactionId: string, link: string): Promise<void> {
  try {
    await supabase
      .from('payments')
      .update({ renewal_link: link, renewal_link_sent: true, renewal_sent_at: new Date().toISOString() })
      .eq('transaction_id', transactionId)
  } catch (err) {
    console.error('[ANALYTICS] Erro ao marcar renovação enviada:', err)
  }
}

export function buildRenewalLink(opts: {
  mcUserId?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
}): string {
  const params = new URLSearchParams({ renovacao: '1' })
  if (opts.mcUserId) params.set('mc_subscriber_id', opts.mcUserId)
  if (opts.name) params.set('name', opts.name)
  if (opts.email) params.set('email', opts.email)
  if (opts.phone) params.set('phone', opts.phone)
  return `https://psicomarketing.online/checkout?${params.toString()}`
}
