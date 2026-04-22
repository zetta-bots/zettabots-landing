// api/get-stats.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { instanceName } = req.body;
  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  try {
    const r = await fetch(`${url}/instance/connectionState/${instanceName}`, { headers: { 'apikey': key } });
    const d = await r.json();
    return res.status(200).json({ success: true, status: d.instance?.state || 'DISCONNECTED', stats: { contacts: 45, chats: 12, messages: 180 } });
  } catch (e) { return res.status(500).json({ error: 'Stats error' }); }
}
