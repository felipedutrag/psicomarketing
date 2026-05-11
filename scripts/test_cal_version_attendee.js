async function test() {
  const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';
  const url = 'https://api.cal.com/v2/bookings';
  
  const body = {
    start: "2026-05-19T16:00:00.000Z",
    eventTypeId: 4565935,
    attendee: {
      name: "Teste Old Version",
      email: "felipe@psicomarketing.com.br",
      timeZone: "America/Sao_Paulo"
    }
  };

  console.log('Testando via Fetch com version 2024-08-13 e attendee structure...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Erro:', e.message);
  }
}

test();
