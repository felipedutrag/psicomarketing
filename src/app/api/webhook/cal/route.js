import { NextResponse } from 'next/server';
import { upsertLead } from '@/services/notion';

/**
 * WEBHOOK CAL.COM -> NOTION
 * Recebe notificações de agendamentos realizados via Embed ou Link Direto.
 */
export async function POST(request) {
  try {
    const payload = await request.json();
    console.log('[Webhook/Cal] Recebido:', JSON.stringify(payload));

    const { triggerEvent, payload: data } = payload;

    if (triggerEvent === 'BOOKING_CREATED' || triggerEvent === 'BOOKING_RESCHEDULED') {
      const attendee = data.attendees[0];
      const startTime = new Date(data.startTime);
      
      const leadData = {
        leadName: attendee.name,
        externalId: attendee.email, // Email como chave única
        email: attendee.email,
        phone: attendee.phoneNumber || '',
        status: 'Contacted',
        source: 'Inbound',
        notes: `Agendamento ${triggerEvent === 'BOOKING_CREATED' ? 'Criado' : 'Reagendado'} via Cal.com. 
Data: ${startTime.toLocaleString('pt-BR')} 
Meeting: ${data.metadata?.videoCallUrl || 'N/A'}`
      };

      console.log(`[Webhook/Cal] Sincronizando lead no Notion: ${attendee.email}`);
      await upsertLead(leadData);
      
      return NextResponse.json({ message: 'Lead synchronized to Notion' }, { status: 200 });
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      const attendee = data.attendees[0];
      
      await upsertLead({
        leadName: attendee.name,
        externalId: attendee.email,
        status: 'Lost',
        notes: `Agendamento CANCELADO no Cal.com em ${new Date().toLocaleString('pt-BR')}`
      });
      
      return NextResponse.json({ message: 'Lead status updated to Lost' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook/Cal] Erro fatal:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
