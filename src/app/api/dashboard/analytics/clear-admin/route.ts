import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/dashboard/supabase'

export const dynamic = 'force-dynamic'

// Identifica o admin pelos dados gravados nas linhas (não depende do mc_user_id
// do ManyChat, que muda quando o contato é excluído).
const ADMIN_PHONE = '5513988658518'
const ADMIN_NAMES = ['felipe dutra']

const digits = (v: string | null | undefined) => (v ? String(v).replace(/\D/g, '') : '')

function isAdminPhone(value: string | null | undefined): boolean {
  const d = digits(value)
  if (!d) return false
  if (d === ADMIN_PHONE) return true
  if (ADMIN_PHONE.startsWith('55') && d === ADMIN_PHONE.slice(2)) return true
  if (d.startsWith('55') && d.slice(2) === ADMIN_PHONE) return true
  return false
}

function isAdminName(value: string | null | undefined): boolean {
  if (!value) return false
  const name = String(value).toLowerCase().trim()
  return ADMIN_NAMES.includes(name)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // Varre as linhas de analytics e marca as do admin pelo telefone OU nome gravados
    const { data: analytics, error: analyticsErr } = await supabase
      .from('analytics')
      .select('id, mc_user_id, nome, telefone, email')

    if (analyticsErr) throw analyticsErr

    const analyticsIds: number[] = []
    const mcIds: string[] = []

    for (const row of analytics || []) {
      const isAdmin = isAdminPhone(row.telefone) || isAdminName(row.nome)
      if (isAdmin) {
        analyticsIds.push(row.id)
        if (row.mc_user_id) mcIds.push(String(row.mc_user_id))
      }
    }

    // Exclui payments do admin (pelo telefone/nome do pagador ou pelo mc_user_id)
    let deletedPayments = 0
    if (mcIds.length > 0) {
      const { count } = await supabase.from('payments').delete().in('mc_user_id', mcIds)
      deletedPayments += count || 0
    }
    const { data: payByFields, error: payFieldsErr } = await supabase
      .from('payments')
      .select('id')
      .or(`payer_phone.ilike.%${ADMIN_PHONE}%,payer_name.ilike.%${ADMIN_NAMES[0]}%`)
    if (payFieldsErr) throw payFieldsErr
    const payIds = (payByFields || []).map((p) => p.id)
    if (payIds.length > 0) {
      const { count } = await supabase.from('payments').delete().in('id', payIds)
      deletedPayments += count || 0
    }

    // Exclui analytics do admin
    let deletedAnalytics = 0
    if (analyticsIds.length > 0) {
      const { count } = await supabase.from('analytics').delete().in('id', analyticsIds)
      deletedAnalytics = count || 0
    }

    return NextResponse.json({
      success: true,
      deletedAnalytics,
      deletedPayments,
      matchedMcIds: mcIds,
      reason: 'matched-by-stored-fields',
    })
  } catch (err) {
    console.error('[DASHBOARD ANALYTICS] Erro ao limpar admin:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao limpar admin' }, { status: 500 })
  }
}
