import { NextResponse } from 'next/server';
import { upsertLead } from '@/services/notion';

/**
 * POST /api/notion/update-status
 * Atualiza o status de um lead no Notion após confirmação de pagamento.
 */
export async function POST(request: Request) {
  try {
    const { email, name, status, value, notes } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required as externalId' }, { status: 400 });
    }

    console.log(`[Notion/Update] Atualizando status do lead ${email} para: ${status}`);

    await upsertLead({
      leadName: name || 'Cliente',
      externalId: email,
      email: email,
      status: status || 'Won', // Default para 'Won' se o pagamento foi confirmado
      value: value || 29.00,
      notes: notes || `Pagamento confirmado via PIX em ${new Date().toLocaleString('pt-BR')}`
    });

    return NextResponse.json({ success: true, message: 'Notion status updated' });
  } catch (error: any) {
    console.error('[Notion/Update] Erro ao atualizar status:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
