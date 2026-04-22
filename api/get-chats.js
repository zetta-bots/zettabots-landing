// api/get-chats.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { instanceName } = req.body;
  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  try {
    const r = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, { headers: { 'apikey': key } });
    const d = await r.json();
    const raw = Array.isArray(d) ? d : (d.chats || d.data || []);
    const chats = raw.slice(0, 20).map(c => ({
      id: c.id, remoteJid: c.id, user: c.name || c.pushName || 'WhatsApp', lastMsg: 'Conversa ativa', 
      time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--', phone: c.id.split('@')[0]
    }));
    return res.status(200).json({ success: true, chats });
  } catch (e) { return res.status(500).json({ error: 'Chats error' }); }
}
