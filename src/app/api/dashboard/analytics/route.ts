import { NextResponse } from 'next/server'
import { supabase } from '@/lib/dashboard/supabase'

export const dynamic = 'force-dynamic'

interface AnalyticsRow {
  id: number
  mc_user_id: string
  nome: string | null
  telefone: string | null
  email: string | null
  stage: string | null
  mensagem_conversao: string | null
  acessou_landing_at: string | null
  agendou_at: string | null
  pagou_at: string | null
  external_id: string | null
  created_at: string
  updated_at: string
}

interface PaymentRow {
  id: number
  mc_user_id: string | null
  external_id: string | null
  transaction_id: string | null
  order_id: string | null
  status: string
  tipo: string
  amount_cents: number | null
  amount_brl: number | null
  payer_name: string | null
  payer_email: string | null
  payer_phone: string | null
  payer_document: string | null
  renewal_link: string | null
  renewal_link_sent: boolean
  renewal_sent_at: string | null
  paid_at: string | null
  created_at: string
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10)
}

function lastNDays(days: number): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

export async function GET() {
  try {
    const [analyticsRes, paymentsRes] = await Promise.all([
      supabase.from('analytics').select('*').order('updated_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
    ])

    if (analyticsRes.error) throw analyticsRes.error
    if (paymentsRes.error) throw paymentsRes.error

    const analytics = (analyticsRes.data || []) as AnalyticsRow[]
    const payments = (paymentsRes.data || []) as PaymentRow[]
    const paidPayments = payments.filter((p) => p.status === 'paid')

    const totalLeads = analytics.length
    const byStage = {
      f_interessado: analytics.filter((a) => a.stage === 'f_interessado').length,
      f_fechamento: analytics.filter((a) => a.stage === 'f_fechamento').length,
      f_quebra_objecao: analytics.filter((a) => a.stage === 'f_quebra_objecao').length,
      pago: analytics.filter((a) => a.stage === 'pago').length,
    }
    const landingVisits = analytics.filter((a) => a.acessou_landing_at).length
    const agendamentos = analytics.filter((a) => a.agendou_at).length
    const pagamentos = paidPayments.length
    const receita = paidPayments.reduce((acc, p) => acc + (p.amount_brl || 0), 0)
    const ticketMedio = pagamentos > 0 ? receita / pagamentos : 0

    const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0)

    const taxas = {
      landing_para_agendamento: pct(agendamentos, landingVisits),
      agendamento_para_pagamento: pct(pagamentos, agendamentos),
      landing_para_pagamento: pct(pagamentos, landingVisits),
    }

    const trend = (days: number) => {
      const daysKeys = lastNDays(days)
      const base: Record<string, { date: string; acessou: number; agendou: number; pagou: number; receita: number }> = {}
      for (const key of daysKeys) {
        base[key] = { date: key, acessou: 0, agendou: 0, pagou: 0, receita: 0 }
      }
      for (const a of analytics) {
        if (a.acessou_landing_at && base[toDayKey(a.acessou_landing_at)]) base[toDayKey(a.acessou_landing_at)].acessou++
        if (a.agendou_at && base[toDayKey(a.agendou_at)]) base[toDayKey(a.agendou_at)].agendou++
        if (a.pagou_at && base[toDayKey(a.pagou_at)]) base[toDayKey(a.pagou_at)].pagou++
      }
      for (const p of paidPayments) {
        const key = p.paid_at ? toDayKey(p.paid_at) : toDayKey(p.created_at)
        if (base[key]) base[key].receita += p.amount_brl || 0
      }
      return daysKeys.map((k) => base[k])
    }

    const recentConversions = analytics.slice(0, 10).map((a) => ({
      mc_user_id: a.mc_user_id,
      nome: a.nome,
      telefone: a.telefone,
      email: a.email,
      stage: a.stage,
      mensagem_conversao: a.mensagem_conversao,
      acessou_landing_at: a.acessou_landing_at,
      agendou_at: a.agendou_at,
      pagou_at: a.pagou_at,
    }))

    const recentPayments = paidPayments.slice(0, 10).map((p) => ({
      id: p.id,
      mc_user_id: p.mc_user_id,
      transaction_id: p.transaction_id,
      tipo: p.tipo,
      amount_brl: p.amount_brl,
      payer_name: p.payer_name,
      payer_email: p.payer_email,
      payer_phone: p.payer_phone,
      renewal_link: p.renewal_link,
      renewal_link_sent: p.renewal_link_sent,
      renewal_sent_at: p.renewal_sent_at,
      paid_at: p.paid_at,
    }))

    return NextResponse.json({
      stats: {
        totalLeads,
        byStage,
        landingVisits,
        agendamentos,
        pagamentos,
        receita: Number(receita.toFixed(2)),
        ticketMedio: Number(ticketMedio.toFixed(2)),
        taxas: {
          landing_para_agendamento: Number(taxas.landing_para_agendamento.toFixed(1)),
          agendamento_para_pagamento: Number(taxas.agendamento_para_pagamento.toFixed(1)),
          landing_para_pagamento: Number(taxas.landing_para_pagamento.toFixed(1)),
        },
        trend7: trend(7),
        trend30: trend(30),
        recentConversions,
        recentPayments,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[DASHBOARD ANALYTICS] Erro:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao buscar analytics' }, { status: 500 })
  }
}
