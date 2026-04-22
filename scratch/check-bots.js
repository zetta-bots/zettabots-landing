
async function test() {
  const url = 'https://seriousokapi-evolution.cloudfy.live';
  const key = '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  
  const instances = ['ZettaBots', 'atlasdafe'];
  
  for (const name of instances) {
    console.log(`\n--- INSTANCE: ${name} ---`);
    try {
      const res = await fetch(`${url}/chatgpt/getSettings/${name}`, { headers: { 'apikey': key } });
      const data = await res.json();
      console.log(`AI Settings:`, JSON.stringify(data, null, 2));
      
      const resStatus = await fetch(`${url}/instance/connectionState/${name}`, { headers: { 'apikey': key } });
      const status = await resStatus.json();
      console.log(`Connection:`, status.instance.state);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}
test();
