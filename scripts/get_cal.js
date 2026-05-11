const https = require('https');
const apiKey = 'cal_live_862d7a56605b2398433a2afddf6da233';

https.get(`https://api.cal.com/v1/event-types?apiKey=${apiKey}`, (res) => {
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
