require('dotenv').config();
const https = require('https');

async function testGeminiHttps() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('Error: No API Key');
    return;
  }

  // Use a known stable model or list models to see what's available
  // Endpoint: https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models?key=${apiKey}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Testing connectivity...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.error) {
          console.log('API Error Code:', json.error.code);
          console.log('API Error Message:', JSON.stringify(json.error.message));
          if (json.error.message.includes('not supported')) {
             console.log('--> This usually means the API key is not enabled for this region or project.');
          }
        } else {
          console.log('API Success! Available models:', json.models ? json.models.length : 0);
          console.log('First model:', json.models && json.models[0] ? json.models[0].name : 'None');
        }
      } catch (e) {
        console.log('Response not JSON:', data.substring(0, 100));
      }
    });
  });

  req.on('error', (e) => {
    console.log('Request Error:', e.message);
  });

  req.end();
}

testGeminiHttps();
