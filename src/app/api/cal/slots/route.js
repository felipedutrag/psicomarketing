import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { upsertLead } from '@/services/notion';

const CAL_API_KEY = process.env.CAL_API_KEY;
const EVENT_TYPE_ID = 5650035; // evento com disponibilidade completa

// GET /api/cal/slots?days=14
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '21');

    const from = new Date();
    from.setDate(from.getDate() + 2);
    from.setHours(0, 0, 0, 0);

    const to = new Date();
    to.setDate(to.getDate() + days);

    // Cal.com V2 endpoint - timeZone garante que as datas retornem no fuso correto
    const url = `https://api.cal.com/v2/slots/available?startTime=${encodeURIComponent(from.toISOString())}&endTime=${encodeURIComponent(to.toISOString())}&eventTypeId=${EVENT_TYPE_ID}&timeZone=America/Sao_Paulo`;

    // Sem cache para sempre pegar horários frescos do Cal.com
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-06-11',
      },
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      console.error('[cal/slots] Erro API:', data);
      return NextResponse.json({ error: data.error?.message || 'Erro ao buscar slots' }, { status: 500 });
    }

    // Log para debugar a estrutura real do Cal.com
    const rawSlots = data.data?.slots || data.data || {};
    const processedSlots = {};

    if (Array.isArray(rawSlots)) {
      // Array flat — agrupa por data usando o fuso America/Sao_Paulo
      const grouped = {};
      rawSlots.forEach(s => {
        const time = typeof s === 'string' ? s : (s.time || s.start);
        if (!time) return;
        const dateKey = new Date(time).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // formato YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(s);
      });

      Object.keys(grouped).forEach(dateKey => {
        const daySlots = grouped[dateKey];
        const validSlots = daySlots.map(s => {
          const time = typeof s === 'string' ? s : (s.time || s.start);
          return { time };
        }).filter(s => {
          if (!s.time) return false;
          const hourBRT = parseInt(new Date(s.time).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }));
          return hourBRT >= 10 && hourBRT < 17;
        });

        if (validSlots.length > 0) {
          const count = Math.floor(Math.random() * 3) + 2; // 2, 3 ou 4
          processedSlots[dateKey] = validSlots
            .sort(() => Math.random() - 0.5)
            .slice(0, count)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        }
      });
    } else {
      Object.keys(rawSlots).forEach(dateKey => {
        const daySlots = rawSlots[dateKey];
        if (!Array.isArray(daySlots)) return;

        const validSlots = daySlots.map(s => {
          const time = typeof s === 'string' ? s : (s.time || s.start);
          return { time };
        }).filter(s => {
          if (!s.time) return false;
          const hourBRT = parseInt(new Date(s.time).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }));
          return hourBRT >= 10 && hourBRT < 17;
        });

        if (validSlots.length > 0) {
          const count = Math.floor(Math.random() * 3) + 2; // 2, 3 ou 4
          processedSlots[dateKey] = validSlots
            .sort(() => Math.random() - 0.5)
            .slice(0, count)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        }
      });
    }

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
    const { name, email, phone, start } = body;

    console.log('[cal/booking] Tentando agendar:', { name, email, phone, start });

    if (!name || !email || !phone || !start) {
      return NextResponse.json({ error: 'Campos obrigatórios: name, email, phone, start' }, { status: 400 });
    }

    // Verificação de segurança: Janela de 48h
    const startTime = new Date(start);
    const now = new Date();
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    if (diffHours < 48) { 
      return NextResponse.json({ 
        error: 'Data inválida: O agendamento deve ser feito com pelo menos 48h de antecedência.',
        details: { requested: start, now: now.toISOString() }
      }, { status: 400 });
    }

    // 1. --- GERAÇÃO DE PIX ANTES DO AGENDAMENTO ---
    let pixInfo = null;
    
    try {
      const externalId = crypto.randomUUID();
      const amountCents = 9900; // R$ 99,00
      
      const ggRes = await fetch('https://ggpixapi.com/api/v1/pix/in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.GGPIX_API_KEY || '',
        },
        body: JSON.stringify({
          amountCents: amountCents,
          description: `Agendamento Numbly - ${externalId.slice(0, 8)}`,
          externalId: externalId,
          payerName: name,
          payerEmail: email,
          payerPhone: phone,
          payerDocument: "12345678909", 
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

    // 2. --- CRIAÇÃO DO AGENDAMENTO NO CAL.COM ---
    const res = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'cal-api-version': '2024-08-13', 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: startTime.toISOString(),
        eventTypeId: Number(EVENT_TYPE_ID),
        attendee: {
          name,
          email,
          phoneNumber: phone,
          timeZone: 'America/Sao_Paulo'
        }
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error?.message || data.message || 'Erro ao agendar';
      return NextResponse.json({ error: errorMsg, details: data }, { status: res.status });
    }

    // 3. --- SINCRONIZAÇÃO COM NOTION (LILITH SYSTEM) ---
    try {
      await upsertLead({
        leadName: name,
        externalId: email, // Usando email como chave única para evitar duplicidade
        email: email,
        phone: phone,
        status: 'Contacted',
        source: 'Inbound',
        notes: `Agendado via Internal API em: ${startTime.toLocaleString('pt-BR')}. PIX gerado: ${pixInfo ? 'Sim' : 'Não'}`
      });
      console.log(`[Notion] Lead '${name}' sincronizado após agendamento.`);
    } catch (notionErr) {
      console.error('[Notion] Erro ao sincronizar lead:', notionErr.message);
    }

    return NextResponse.json({
      status: 'success',
      bookingId: data.data?.uid || data.uid,
      meetingUrl: data.data?.meetingUrl || data.meetingUrl,
      start: data.data?.start || data.start,
      pix: pixInfo ? {
        code: pixInfo.pixCopyPaste,
        qrCode: pixInfo.pixCode, 
        id: pixInfo.id
      } : null
    });

  } catch (e) {
    console.error('[cal/booking] Erro fatal:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
