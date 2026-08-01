import { NextResponse } from 'next/server';
import { upsertLead } from '@/services/notion';
import { sendMessage, addTagById, findSubscriberByPhone, findSubscriberByEmail } from '@/lib/manychat';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
const GGPIX_WEBHOOK_TOKEN = process.env.GGPIX_WEBHOOK_TOKEN;

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log('[GGPIX WEBHOOK] ========================================');
  console.log(`[GGPIX WEBHOOK] INCOMING PAYMENT WEBHOOK [${timestamp}]`);
  console.log('[GGPIX WEBHOOK] Method:', req.method);
  console.log('[GGPIX WEBHOOK] URL:', req.url);
  
  const headersObj = Object.fromEntries(req.headers.entries());
  console.log('[GGPIX WEBHOOK] Headers:', JSON.stringify(headersObj, null, 2));

  try {
    // 1. Read raw body and parse JSON first for logging
    const rawText = await req.text();
    console.log('[GGPIX WEBHOOK] Raw Payload Body:', rawText);

    let body: any = {};
    if (rawText && rawText.trim().length > 0) {
      try {
        body = JSON.parse(rawText);
        console.log('[GGPIX WEBHOOK] Parsed JSON Body:', JSON.stringify(body, null, 2));
      } catch (parseErr) {
        console.error('[GGPIX WEBHOOK] Failed to parse payload as JSON:', parseErr);
      }
    }

    // Handle test / ping event from gateway
    if (body.event === 'test' || body.type === 'ping' || body.message === 'test' || body.test === true) {
      console.log('[GGPIX WEBHOOK] Test/ping event received successfully');
      return NextResponse.json({ success: true, message: 'Webhook test received successfully' });
    }

    // 2. Authorization check (soft-check if payload is from GGPIX)
    if (GGPIX_WEBHOOK_TOKEN) {
      const authHeader = req.headers.get('Authorization') 
        || req.headers.get('authorization')
        || req.headers.get('x-webhook-token')
        || req.headers.get('x-api-key');

      const expectedBearer = 'Bearer ' + GGPIX_WEBHOOK_TOKEN;
      console.log('[GGPIX WEBHOOK] Authorization header validation:', {
        receivedHeader: authHeader,
        tokenConfigured: true
      });

      if (!authHeader || (authHeader !== GGPIX_WEBHOOK_TOKEN && authHeader !== expectedBearer)) {
        console.warn('[GGPIX WEBHOOK] Warning: Invalid or missing Authorization header. Proceeding with payload processing.');
      }
    } else {
      console.log('[GGPIX WEBHOOK] GGPIX_WEBHOOK_TOKEN is not set - skipping header validation');
    }

    const { transactionId, externalId, status, amount, paidAt, payer } = body;
    console.log('[GGPIX WEBHOOK] Extracted Transaction Details:', {
      transactionId,
      externalId,
      status,
      amount,
      paidAt,
      payer
    });

    // 3. Status Check
    const normalizedStatus = String(status || '').toUpperCase();
    const isComplete = ['COMPLETE', 'PAID', 'APPROVED'].includes(normalizedStatus);
    if (!isComplete) {
      console.log(`[GGPIX WEBHOOK] Payment status "${status}" is not complete. Returning early.`);
      return NextResponse.json({ received: true, status, normalizedStatus });
    }

    // Amount BRL
    const amountBRL = typeof amount === 'number' ? (amount / 100).toFixed(2) : String(amount || '0.00');

    // 4. Redis Cache Lookup
    let cachedMetaStr: any = null;
    if (externalId) {
      cachedMetaStr = await redis.get(`pix:${externalId}`);
    }
    if (!cachedMetaStr && transactionId) {
      cachedMetaStr = await redis.get(`pix:${transactionId}`);
    }

    const cachedMeta = cachedMetaStr
      ? (typeof cachedMetaStr === 'string' ? JSON.parse(cachedMetaStr) : cachedMetaStr)
      : null;

    console.log('[GGPIX WEBHOOK] Retrieved Redis metadata:', cachedMeta);

    // 5. Update Lead in Notion
    try {
      const leadEmail = cachedMeta?.email || payer?.email || (payer?.document ? `${payer.document}@temp` : externalId || transactionId);
      const leadName = cachedMeta?.name || payer?.name || 'Cliente';

      console.log('[GGPIX WEBHOOK] Upserting lead to Notion...', { leadName, leadEmail, externalId });
      await upsertLead({
        leadName: leadName,
        externalId: externalId || transactionId,
        email: leadEmail,
        status: 'Won',
        notes: `Pagamento PIX confirmado via GGPIX - Transação: ${transactionId} - Valor: R$ ${amountBRL} - Pago em: ${paidAt}`
      });

      console.log('[GGPIX WEBHOOK] Lead successfully updated in Notion!');
    } catch (notionErr) {
      console.error('[GGPIX WEBHOOK] Error updating Notion:', notionErr);
    }

    // 6. Notify Customer via ManyChat
    const subscriberId = cachedMeta?.subscriber_id 
        || (cachedMeta?.phone ? await findSubscriberByPhone(cachedMeta.phone) : null)
        || (cachedMeta?.email ? await findSubscriberByEmail(cachedMeta.email) : null)
        || (payer?.phone ? await findSubscriberByPhone(payer.phone) : null)
        || (payer?.email ? await findSubscriberByEmail(payer.email) : null);

    console.log('[GGPIX WEBHOOK] Customer ManyChat subscriber ID:', subscriberId);

    let sendResult = null;
    if (subscriberId) {
      const customerMessage = `🎉 Parabéns! Seu pagamento de R$ ${amountBRL} foi confirmado com sucesso!\n\nObrigado por confiar na Psicomarketing. Em breve você receberá mais informações sobre seu agendamento.\n\nTransação: ${transactionId}`;
      console.log('[GGPIX WEBHOOK] Sending ManyChat message to customer:', subscriberId);
      sendResult = await sendMessage(subscriberId, customerMessage);
      console.log('[GGPIX WEBHOOK] Customer ManyChat send result:', sendResult);
      await addTagById(subscriberId, 93237350);
    } else {
      console.warn('[GGPIX WEBHOOK] No subscriber ID found for customer notification');
    }

    // 7. Notify Admin via ManyChat
    const adminSubscriberId = '388378993'; 
    let adminResult = null;

    if (adminSubscriberId) {
      const adminMessage = `💰 Novo pagamento confirmado!\n\nValor: R$ ${amountBRL}\nCliente: ${cachedMeta?.name || payer?.name || 'N/A'}\nCPF: ${payer?.document || 'N/A'}\nTransação: ${transactionId}\nExternal ID: ${externalId}\nPago em: ${paidAt}`;
      console.log('[GGPIX WEBHOOK] Sending ManyChat message to admin:', adminSubscriberId);
      adminResult = await sendMessage(adminSubscriberId, adminMessage);
      console.log('[GGPIX WEBHOOK] Admin ManyChat send result:', adminResult);
    } else {
      console.warn('[GGPIX WEBHOOK] Admin subscriber ID not configured');
    }

    console.log('[GGPIX WEBHOOK] Payment processing completed successfully!');
    return NextResponse.json({ 
        success: true, 
        processed: true, 
        subscriberId, 
        sendResult,
        adminSubscriberId,
        adminResult
    });

  } catch (error) {
    console.error('[GGPIX WEBHOOK] Unhandled Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  console.log('[GGPIX WEBHOOK] GET request received:', req.url);
  return NextResponse.json({ status: 'webhook_active', timestamp: new Date().toISOString() });
}

export async function OPTIONS(req: Request) {
  console.log('[GGPIX WEBHOOK] OPTIONS preflight request received:', req.url);
  return new Response(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
