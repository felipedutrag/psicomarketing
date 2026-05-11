import { NextResponse } from 'next/server';

const CAL_API_KEY = process.env.CAL_API_KEY;
const EVENT_TYPE_ID = 4565935; // viabilidade-patente

// GET /api/cal/slots?days=14
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '21');

    // Respeita o minimumBookingNotice de 4320 min (3 dias)
    const from = new Date();
    from.setDate(from.getDate() + 3);
    const to = new Date();
    to.setDate(to.getDate() + days);

    const url = `https://api.cal.com/v2/slots?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}&eventTypeId=${EVENT_TYPE_ID}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-09-04',
      },
      next: { revalidate: 60 }, // cache 60s
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      return NextResponse.json({ error: data.error?.message || 'Erro ao buscar slots' }, { status: 500 });
    }

    return NextResponse.json({ slots: data.data, status: 'success' });
  } catch (e) {
    console.error('[cal/slots] Erro:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/cal/slots  → cria agendamento
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, start } = body;

    if (!name || !email || !start) {
      return NextResponse.json({ error: 'Campos obrigatórios: name, email, start' }, { status: 400 });
    }

    const res = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start,
        eventTypeId: EVENT_TYPE_ID,
        responses: {
          name,
          email,
        },
        timeZone: 'America/Sao_Paulo',
        language: 'pt',
        metadata: {},
      }),
    });

    const data = await res.json();
    console.log('[cal/booking] Resposta Cal.com:', JSON.stringify(data));

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Erro ao agendar', details: data }, { status: res.status });
    }

    return NextResponse.json({
      status: 'success',
      bookingId: data.data?.uid || data.uid,
      meetingUrl: data.data?.meetingUrl || data.meetingUrl,
      start: data.data?.start || data.start,
    });
  } catch (e) {
    console.error('[cal/booking] Erro fatal:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
