
// Verificar quais rotas existem na Evolution
async function test() {
  const url = 'https://seriousokapi-evolution.cloudfy.live';
  const key = '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';

  // Tentar ver a documentação/rotas disponíveis
  const endpoints = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/docs' },
    { method: 'GET', path: '/api' },
    { method: 'GET', path: '/instance/fetchInstances' },  // sabemos que funciona
    // Tentar POST para chatgpt set
    { method: 'POST', path: '/chatgpt/settings/atlasdafe', body: { enabled: true } },
    { method: 'POST', path: '/chatgpt/set/atlasdafe', body: { enabled: true } },
    { method: 'POST', path: '/chatgpt/create/atlasdafe', body: { enabled: true, model: 'gpt-4o' } },
    { method: 'GET', path: '/chatgpt/fetchSession/atlasdafe' },
  ];

  for (const ep of endpoints) {
    console.log(`\nTesting ${ep.method} ${ep.path}`);
    try {
      const options = { 
        method: ep.method,
        headers: { 'apikey': key, 'Content-Type': 'application/json' }
      };
      if (ep.body) options.body = JSON.stringify(ep.body);
      const res = await fetch(`${url}${ep.path}`, options);
      const data = await res.json();
      if (res.ok) {
        console.log('✅ SUCCESS:', JSON.stringify(data).substring(0, 300));
      } else {
        console.log(`❌ ${res.status}:`, JSON.stringify(data).substring(0, 150));
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}
test();
