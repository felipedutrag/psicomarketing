const https = require('https');
const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';

const start = new Date().toISOString().split('T')[0];
const end = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const options = {
  hostname: 'api.cal.com',
  path: `/v2/slots/available?eventTypeId=4565935&startTime=${start}&endTime=${end}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      console.log(data.substring(0, 1000));
    } catch(e) {}
  });
});

req.on('error', console.error);
req.end();
