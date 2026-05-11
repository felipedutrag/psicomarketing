import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CAL_API_KEY = process.env.CAL_API_KEY;
const EVENT_TYPE_ID = 4565935; // viabilidade-patente

// GET /api/cal/slots?days=14
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '21');

    // Janela de 1 dia para o primeiro horário
    const from = new Date();
    from.setDate(from.getDate() + 1);
    from.setHours(0, 0, 0, 0);

    const to = new Date();
    to.setDate(to.getDate() + days);

    // Cal.com V2 endpoint oficial para slots
    const url = `https://api.cal.com/v2/slots/available?startTime=${encodeURIComponent(from.toISOString())}&endTime=${encodeURIComponent(to.toISOString())}&eventTypeId=${EVENT_TYPE_ID}&timeZone=America/Sao_Paulo`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-06-11', // Versão usada nos outros scripts do projeto
      },
      next: { revalidate: 60 },
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      console.error('[cal/slots] Erro API:', data);
      return NextResponse.json({ error: data.error?.message || 'Erro ao buscar slots' }, { status: 500 });
    }

    let rawSlots = data.data?.slots || data.data || {};
    const processedSlots = {};

    // Se a API retornar um array flat (comum na v2 às vezes), agrupamos por data
    if (Array.isArray(rawSlots)) {
      const grouped = {};
      rawSlots.forEach(s => {
        const time = typeof s === 'string' ? s : (s.time || s.start);
        if (!time) return;
        const d = new Date(time);
        const dateKey = d.toISOString().split('T')[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(s);
      });
      rawSlots = grouped;
    }


    Object.keys(rawSlots).forEach(dateKey => {
      let daySlots = rawSlots[dateKey];
      if (!Array.isArray(daySlots)) return;

      // Normaliza e filtra horários comerciais (09:00 - 17:00 em Brasília UTC-3)
      const validSlots = daySlots.map(s => {
        const time = typeof s === 'string' ? s : (s.time || s.start);
        return { time };
      }).filter(s => {
        if (!s.time) return false;
        
        const date = new Date(s.time);
        // Forçamos o cálculo para o fuso de Brasília (UTC-3)
        // Mesmo que o servidor esteja em UTC, isso garante a hora local correta
        const utcHour = date.getUTCHours();
        const hourBRT = (utcHour - 3 + 24) % 24;
        
        return hourBRT >= 9 && hourBRT <= 17;
      });

      if (validSlots.length > 0) {
        // Pega até 3 aleatórios para escassez
        processedSlots[dateKey] = validSlots
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      }
    });

    console.log('[cal/slots] Dias processados:', Object.keys(processedSlots).length);
    return NextResponse.json({ 
      slots: processedSlots, 
      status: 'success'
    });
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

    console.log('[cal/booking] Tentando agendar:', { name, email, start });

    if (!name || !email || !start) {
      return NextResponse.json({ error: 'Campos obrigatórios: name, email, start' }, { status: 400 });
    }

    // Verificação de segurança: Janela de 1 dia
    const startTime = new Date(start);
    const now = new Date();
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    if (diffHours < 24) { 
      return NextResponse.json({ 
        error: 'Data inválida: O agendamento deve ser feito com pelo menos 24h de antecedência.',
        details: { requested: start, now: now.toISOString() }
      }, { status: 400 });
    }

    const res = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-08-13', // Mantido para evitar o erro 404
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: startTime.toISOString(),
        eventTypeId: Number(EVENT_TYPE_ID),
        attendee: {
          name,
          email,
          timeZone: 'America/Sao_Paulo'
        }
      }),
    });

    const data = await res.json();
    console.log('[cal/booking] Resposta Cal.com:', JSON.stringify(data));

    if (!res.ok) {
      const errorMsg = data.error?.message || data.message || 'Erro ao agendar';
      return NextResponse.json({ error: errorMsg, details: data }, { status: res.status });
    }

    // --- LÓGICA DE GERAÇÃO DE PIX PARA INSERIR NO AGENDAMENTO ---
    let pixInfo = null;
    try {
      const externalId = crypto.randomUUID();
      const amountCents = 2900; // R$ 29,00
      
      const ggRes = await fetch('https://ggpixapi.com/api/v1/pix/in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.GGPIX_API_KEY || '',
        },
        body: JSON.stringify({
          amountCents: amountCents,
          description: `Agendamento Psicomarketing - ${externalId.slice(0, 8)}`,
          externalId: externalId,
          payerName: name,
          payerDocument: "12345678909", // CPF Genérico para agilizar
          expiresIn: 7200
        })
      });
      
      const ggData = await ggRes.json();
      if (ggRes.ok) {
        pixInfo = ggData;
      }
    } catch (pixErr) {
      console.error('[pix/booking] Erro ao gerar PIX:', pixErr.message);
    }

    return NextResponse.json({
      status: 'success',
      bookingId: data.data?.uid || data.uid,
      meetingUrl: data.data?.meetingUrl || data.meetingUrl,
      start: data.data?.start || data.start,
      pix: pixInfo ? {
        code: pixInfo.pixCopyPaste,
        qrCode: pixInfo.pixCode, // URL do QR Code se houver
        id: pixInfo.id
      } : null
    });

  } catch (e) {
    console.error('[cal/booking] Erro fatal:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
