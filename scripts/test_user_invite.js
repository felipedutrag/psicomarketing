async function test() {
  const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';
  const url = 'https://api.cal.com/v2/bookings';
  
  const body = {
    start: "2026-05-15T20:00:00.000Z",
    eventTypeId: 4565935,
    responses: {
      name: "Felipe Dutra Teste",
      email: "felipedutra@outlook.com"
    },
    timeZone: "America/Sao_Paulo",
    language: "pt",
    metadata: {}
  };

  console.log('Enviando convite de teste para felipedutra@outlook.com...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
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
