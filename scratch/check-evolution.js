
async function test() {
  const url = 'https://seriousokapi-evolution.cloudfy.live/instance/fetchInstances';
  const key = '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const res = await fetch(url, { headers: { 'apikey': key } });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
