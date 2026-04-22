
async function test() {
  const url = 'https://seriousokapi-evolution.cloudfy.live';
  const key = '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  
  const testUrls = [
    `${url}/chat/fetchChats?instanceName=ZettaBots`,
    `${url}/chat/fetchChats/ZettaBots`
  ];
  
  for (const u of testUrls) {
    console.log(`Testing: ${u}`);
    try {
      const res = await fetch(u, { headers: { 'apikey': key } });
      const data = await res.json();
      console.log(`Data:`, JSON.stringify(data));
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}
test();
