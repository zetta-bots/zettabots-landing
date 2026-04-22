export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid } = req.body;
  if (!action || !instanceName) return res.status(400).json({ error: 'Action and Instance required' });

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const airtableToken = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appQkUKRhf7rKotbT';

  try {
    const fetchOptions = { headers: { 'apikey': key, 'Content-Type': 'application/json' }, timeout: 8000 };

    switch (action) {
      case 'get-stats':
        try {
          const r = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, fetchOptions);
          const d = await r.json();
          const chats = Array.isArray(d) ? d : (d.chats || d.data || []);
          
          const totalChats = chats.length;
          const totalContacts = chats.filter(c => c.id && !c.id.includes('@g.us')).length;
          
          return res.status(200).json({ 
            success: true, 
            stats: { 
              contacts: totalContacts || 0, 
              chats: totalChats || 0, 
              messages: totalChats * 12, 
              savedTime: `${Math.floor(totalChats * 0.3)}h`,
              roi: `R$ ${(totalContacts * 150).toLocaleString('pt-BR')}`,
              activity: [12, 45, totalChats || 10, 55, 60, 48, 70]
            } 
          });
        } catch (e) {
          return res.status(200).json({ success: true, stats: { contacts: 0, chats: 0, messages: 0, savedTime: '0h', roi: 'R$ 0', activity: [0,0,0,0,0,0,0] } });
        }

      case 'get-leads':
        try {
          const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/tblu2DjzxbgZ84PL6?maxRecords=20&sort[0][field]=instanceName&sort[0][direction]=desc`, {
            headers: { 'Authorization': `Bearer ${airtableToken}` }
          });
          const airtableData = await airtableRes.json();
          
          if (airtableData.records && airtableData.records.length > 0) {
            return res.status(200).json({ 
              success: true, 
              leads: airtableData.records.map(r => ({
                name: r.fields.Nome || r.fields.businessName || r.fields.instanceName || 'Lead Ativo',
                phone: r.fields.WhatsApp || r.fields.adminPhone || r.fields.phone || 'Sem número',
                status: r.fields.status || r.fields.Status || 'Novo',
                date: r.createdTime ? new Date(r.createdTime).toLocaleDateString('pt-BR') : 'Hoje'
              }))
            });
          }
          throw new Error('No records');
        } catch (e) {
          // Fallback para contatos da Evolution se o Airtable falhar/estiver vazio
          const r = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, fetchOptions);
          const d = await r.json();
          const raw = Array.isArray(d) ? d : (d.chats || d.data || []);
          return res.status(200).json({ 
            success: true, 
            leads: raw.filter(c => c.id && !c.id.includes('@g.us')).slice(0, 15).map(c => ({
              name: c.name || c.pushName || 'Novo Contato', 
              phone: c.id.split('@')[0], 
              status: 'Identificado', 
              date: 'Hoje'
            }))
          });
        }

      case 'get-finance':
        return res.status(200).json({
          success: true,
          plan: 'ZettaBots Premium (Anual)',
          status: 'Ativo',
          nextBilling: '21/05/2026',
          value: 'R$ 1.490,00',
          invoices: [
            { id: 'INV-8821', date: '21/04/2026', value: 'R$ 1.490,00', status: 'Pago' },
            { id: 'INV-7712', date: '21/04/2025', value: 'R$ 1.490,00', status: 'Pago' }
          ]
        });

      case 'get-chats':
        try {
          const r = await fetch(`${url}/chat/fetchChats?instanceName=${instanceName}`, fetchOptions);
          const d = await r.json();
          const raw = Array.isArray(d) ? d : (d.chats || d.data || []);
          return res.status(200).json({ 
            success: true, 
            chats: raw.slice(0, 20).map(c => ({
              id: c.id, user: c.name || c.pushName || c.id.split('@')[0], 
              lastMsg: 'Monitorado via IA', time: 'Ativo'
            }))
          });
        } catch (e) {
          return res.status(200).json({ success: true, chats: [] });
        }

      case 'get-messages':
        try {
          const r = await fetch(`${url}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers: fetchOptions.headers,
            body: JSON.stringify({ where: { remoteJid }, take: 30 })
          });
          const d = await r.json();
          const raw = Array.isArray(d) ? d : (d.messages || []);
          return res.status(200).json({ 
            success: true, 
            messages: raw.reverse().map(m => ({
              text: m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mídia Recebida',
              fromMe: m.key?.fromMe,
              time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR') : ''
            }))
          });
        } catch (e) {
          return res.status(200).json({ success: true, messages: [] });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server Down' });
  }
}
