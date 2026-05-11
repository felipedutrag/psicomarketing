const https = require('https');
const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';

const bookingData = JSON.stringify({
  start: "2026-05-14T14:00:00.000Z",
  eventTypeId: 4565935,
  attendee: {
    name: "Teste de Debug AI",
    email: "felipe+debug@psicomarketing.com.br",
    timeZone: "America/Sao_Paulo"
  },
  timeZone: "America/Sao_Paulo",
  language: "pt",
  metadata: {}
});

// Tentando v2 com estrutura de resposta que o erro 400 sugeriu
const options = {
  hostname: 'api.cal.com',
  path: '/v2/bookings',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bookingData),
    'cal-api-version': '2024-06-11' // Tentando passar uma versão se necessário
  }
};

console.log('Enviando solicitação de agendamento (v2) para o Cal.com...');
const req = https.request(options, (res) => {
  let data = '';
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Resposta:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch(e) {
      console.log('Resposta bruta:');
      console.log(data);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(bookingData);
req.end();
