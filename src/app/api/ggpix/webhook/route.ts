import { NextResponse } from 'next/server';
import { upsertLead } from '@/services/notion';
import { sendMessage, addTagByName, findSubscriberByPhone, findSubscriberByEmail } from '@/lib/manychat';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const GGPIX_WEBHOOK_SECRET = process.env.GGPIX_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    // Verificar se o webhook tem secret configurado (opcional para segurança)
    if (GGPIX_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-webhook-secret');
      if (signature !== GGPIX_WEBHOOK_SECRET) {
        console.error('[GGPIX WEBHOOK] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = await req.json();
    console.log('[GGPIX WEBHOOK] Received:', JSON.stringify(body, null, 2));

    const { transactionId, externalId, status, amount, paidAt, payer } = body;

    // Verificar se o pagamento foi concluído (aceita COMPLETE, PAID, APPROVED)
    const normalizedStatus = String(status || '').toUpperCase();
    const isComplete = ['COMPLETE', 'PAID', 'APPROVED'].includes(normalizedStatus);
    if (!isComplete) {
      console.log('[GGPIX WEBHOOK] Payment not complete, status:', status);
      return NextResponse.json({ received: true, status });
    }

    // Formatar o valor para BRL
    const amountBRL = (amount / 100).toFixed(2);

    // Recuperar metadata do Redis
    const cachedMetaStr = (await redis.get(`pix:${externalId}`)) || (await redis.get(`pix:${transactionId}`));
    const cachedMeta = cachedMetaStr ? (typeof cachedMetaStr === 'string' ? JSON.parse(cachedMetaStr) : cachedMetaStr) : null;

    // 1. Atualizar lead no Notion
    try {
      const leadEmail = cachedMeta?.email || payer?.email || (payer?.document ? `${payer.document}@temp` : externalId);
      const leadName = cachedMeta?.name || payer?.name || 'Cliente';

      await upsertLead({
        leadName: leadName,
        externalId: externalId,
        email: leadEmail,
        status: 'Won',
        notes: `Pagamento PIX confirmado via GGPIX - Transação: ${transactionId} - Valor: R$ ${amountBRL} - Pago em: ${paidAt}`
      });

      console.log('[GGPIX WEBHOOK] Lead atualizado no Notion');
    } catch (notionErr) {
      console.error('[GGPIX WEBHOOK] Erro ao atualizar Notion:', notionErr);
    }

    // 2. Enviar mensagem de parabéns
    const subscriberId = cachedMeta?.subscriber_id 
        || (cachedMeta?.phone ? await findSubscriberByPhone(cachedMeta.phone) : null)
        || (cachedMeta?.email ? await findSubscriberByEmail(cachedMeta.email) : null)
        || (payer?.phone ? await findSubscriberByPhone(payer.phone) : null)
        || (payer?.email ? await findSubscriberByEmail(payer.email) : null);

    if (subscriberId) {
      const customerMessage = `🎉 Parabéns! Seu pagamento de R$ ${amountBRL} foi confirmado com sucesso!

Obrigado por confiar na Psicomarketing. Em breve você receberá mais informações sobre seu agendamento.

Transação: ${transactionId}`;
      await sendMessage(subscriberId, customerMessage);
      await addTagByName(subscriberId, 'Pagamento Concluído');
    } else {
      console.log('[WEBHOOK] Subscriber não encontrado para notificação do cliente');
    }

    // 3. Enviar notificação para admin
    const adminPhone = '5513988658518';
    const adminSubscriberId = await findSubscriberByPhone(adminPhone);

    if (adminSubscriberId) {
      const adminMessage = `💰 Novo pagamento confirmado!

Valor: R$ ${amountBRL}
Cliente: ${cachedMeta?.name || payer?.name || 'N/A'}
CPF: ${payer?.document || 'N/A'}
Transação: ${transactionId}
External ID: ${externalId}
Pago em: ${paidAt}`;

      await sendMessage(adminSubscriberId, adminMessage);
    } else {
      console.log('[WEBHOOK] Admin subscriber não encontrado');
    }

    console.log('[GGPIX WEBHOOK] Payment processed successfully');
    return NextResponse.json({ success: true, processed: true });

  } catch (error) {
    console.error('[GGPIX WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Endpoint para verificação (opcional - GGPIX pode usar para validar webhook)
export async function GET() {
  return NextResponse.json({ status: 'webhook_active' });
}
