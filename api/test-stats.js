export default async function handler(req, res) {
  const url = 'https://seriousokapi-evolution.cloudfy.live';
  const key = '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';

  try {
    const listRes = await fetch(`${url}/instance/fetchInstances`, {
      headers: { 'apikey': key, 'Content-Type': 'application/json' },
      timeout: 8000
    });
    const instances = await listRes.json();
    const data = Array.isArray(instances) ? instances : (instances.data || []);
    const found = data.find(i => i.name.toLowerCase().includes('zettabots'));

    return res.status(200).json({
      found: found ? 'YES' : 'NO',
      instanceName: found?.name,
      _count: found?._count,
      all_instances: data.map(i => ({ name: i.name, _count: i._count }))
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
