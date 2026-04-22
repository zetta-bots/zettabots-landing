export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid } = req.body;
  if (!action || !instanceName) return res.status(400).json({ error: 'Action and Instance required' });

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';

  try {
    switch (action) {
      case 'get-stats':
        const rStats = await fetch(`${url}/instance/connectionState/${instanceName}`, { headers: { 'apikey': key } });
        const dStats = await rStats.json();
        return res.status(200).json({ 
          success: true, 
          status: dStats.instance?.state || 'DISCONNECTED', 
          stats: { contacts: 84, chats: 26, messages: 412, savedTime: '14h', roi: 'R$ 1.200' } 
        });

      case 'get-chats':
        const rChats = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, { headers: { 'apikey': key } });
        const dChats = await rChats.json();
        const rawChats = Array.isArray(dChats) ? dChats : (dChats.chats || dChats.data || []);
        const chats = rawChats.slice(0, 15).map(c => ({
          id: c.id, 
          remoteJid: c.id, 
          user: c.name || c.pushName || c.id.split('@')[0], 
          lastMsg: 'Interação via Sarah AI', 
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }));
        return res.status(200).json({ success: true, chats });

      case 'get-leads':
        const rLeads = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, { headers: { 'apikey': key } });
        const dLeads = await rLeads.json();
        const rawLeads = Array.isArray(dLeads) ? dLeads : (dLeads.chats || dLeads.data || []);
        const leads = rawLeads.filter(c => c.id && !c.id.includes('@g.us')).slice(0, 10).map(c => ({
          name: c.name || c.pushName || 'Lead Interessado', 
          phone: c.id.split('@')[0], 
          status: 'Interessado', 
          date: 'Hoje'
        }));
        return res.status(200).json({ success: true, leads });

      case 'get-messages':
        const rMsgs = await fetch(`${url}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': key },
          body: JSON.stringify({ where: { remoteJid }, take: 50 })
        });
        const dMsgs = await rMsgs.json();
        const rawMsgs = Array.isArray(dMsgs) ? dMsgs : (dMsgs.messages || []);
        const messages = rawMsgs.reverse().map(m => ({
          text: m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mensagem de Mídia',
          fromMe: m.key?.fromMe,
          time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        return res.status(200).json({ success: true, messages });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server Error' });
  }
}
