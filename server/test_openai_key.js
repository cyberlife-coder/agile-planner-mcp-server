// Script minimal pour tester la clé OpenAI
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY absent');
  process.exit(1);
}

const data = JSON.stringify({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'system', content: 'ping' }, { role: 'user', content: 'ping' }],
  max_tokens: 5
});

const options = {
  hostname: 'api.openai.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});
req.on('error', error => {
  console.error('Erreur de requête:', error);
});
req.write(data);
req.end();
