const https = require('https');
const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';

const options = {
  hostname: 'api.cal.com',
  path: '/v2/event-types/4565935',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'cal-api-version': '2024-06-11'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch(e) {
      console.log(data);
    }
  });
});

req.on('error', console.error);
req.end();
