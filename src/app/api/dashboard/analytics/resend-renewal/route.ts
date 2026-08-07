import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/dashboard/supabase'
import { buildRenewalLink, markRenewalSent } from '@/lib/analytics'
import { sendMessage } from '@/lib/manychat'

export async function POST(req: NextRequest) {
  try {
    const { payment_id } = await req.json()
    if (!payment_id) {
      return NextResponse.json({ error: 'payment_id é obrigatório' }, { status: 400 })
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .maybeSingle()

    if (error || !payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    if (!payment.mc_user_id) {
      return NextResponse.json({ error: 'Pagamento sem mc_user_id (cliente ManyChat) para envio' }, { status: 400 })
    }

    const renewalLink = buildRenewalLink({
      mcUserId: payment.mc_user_id,
      name: payment.payer_name,
      email: payment.payer_email,
      phone: payment.payer_phone,
    })

    const message = `🔁 Renovação da sua automação:\n\nClique aqui para renovar por mais um mês:\n${renewalLink}\n\nQualquer dúvida, é só chamar! 💜`
    await sendMessage(payment.mc_user_id, message)

    if (payment.transaction_id) {
      await markRenewalSent(payment.transaction_id, renewalLink)
    }

    return NextResponse.json({ success: true, renewal_link: renewalLink })
  } catch (err) {
    console.error('[RESEND RENEWAL] Erro:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao reenviar link' }, { status: 500 })
  }
}
