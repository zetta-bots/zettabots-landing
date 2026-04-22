// api/get-leads.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { instanceName } = req.body;
  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  try {
    const r = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, { headers: { 'apikey': key } });
    const d = await r.json();
    const raw = Array.isArray(d) ? d : (d.chats || d.data || []);
    const leads = raw.filter(c => c.id && !c.id.includes('@g.us')).slice(0, 10).map(c => ({
      id: c.id, nome: c.name || c.pushName || 'Lead', whatsapp: c.id.split('@')[0], status: 'Interessado', data: 'Hoje'
    }));
    return res.status(200).json({ success: true, leads });
  } catch (e) { return res.status(500).json({ error: 'Leads error' }); }
}
