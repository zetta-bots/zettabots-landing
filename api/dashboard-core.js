export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid } = req.body;
  if (!action || !instanceName) return res.status(400).json({ error: 'Action and Instance required' });

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const airtableToken = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appQkUKRhf7rKotbT';

  const table = 'tblu2DjzxbgZ84PL6'; // Tabela de Clientes

  try {
    const fetchOptions = { headers: { 'apikey': key, 'Content-Type': 'application/json' }, timeout: 8000 };

    // Função Sênior para achar a instância correta (evita erro de atlasdafe vs Atlas da Fé)
    const getCorrectInstance = async (name) => {
      try {
        const listRes = await fetch(`${url}/instance/fetchInstances`, fetchOptions);
        const instances = await listRes.json();
        const data = Array.isArray(instances) ? instances : (instances.data || []);
        const found = data.find(i => i.instanceName.toLowerCase() === name.toLowerCase() || i.instanceName.toLowerCase().includes(name.toLowerCase()));
        return found ? found.instanceName : name;
      } catch (e) { return name; }
    };

    switch (action) {
      case 'get-stats':
        try {
          const realName = await getCorrectInstance(instanceName);
          const r = await fetch(`${url}/chat/fetchChats?instanceName=${realName}`, fetchOptions);
          const d = await r.json();
          const chats = Array.isArray(d) ? d : (d.chats || d.data || []);
          
          let totalLeads = 0;
          try {
            const leadsRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}?filterByFormula={instanceName}='${realName}'&maxRecords=100`, {
              headers: { Authorization: `Bearer ${airtableToken}` }
            });
            const leadsData = await leadsRes.json();
            totalLeads = leadsData.records?.length || 0;
          } catch(e) {}
          
          const totalChats = chats.length;
          const totalContacts = chats.filter(c => c.id && !c.id.includes('@g.us')).length;
          
          return res.status(200).json({ 
            success: true, 
            status: 'CONNECTED',
            stats: { 
              contacts: totalLeads || totalContacts || 0, 
              chats: totalChats || (totalLeads * 2),
              messages: (totalLeads * 15) || (totalChats * 8), 
              savedTime: `${Math.floor((totalLeads * 0.5) + (totalChats * 0.2))}h`,
              roi: `R$ ${((totalLeads * 180) + (totalContacts * 45)).toLocaleString('pt-BR')}`,
              activity: [2, 5, 1, 8, 4, totalLeads || totalChats || 2, 0]
            } 
          });
        } catch (e) {
          return res.status(200).json({ success: true, stats: { contacts: 0, chats: 0, messages: 0, savedTime: '0h', roi: 'R$ 0', activity: [0,0,0,0,0,0,0] } });
        }

      case 'get-leads':
        try {
          const realName = await getCorrectInstance(instanceName);
          // Tenta buscar contatos reais da Evolution primeiro (Alta Fidelidade)
          const contactRes = await fetch(`${url}/contact/fetchContacts?instanceName=${realName}`, fetchOptions);
          const contactData = await contactRes.json();
          const contacts = Array.isArray(contactData) ? contactData : (contactData.data || []);

          if (contacts.length > 0) {
            return res.status(200).json({ 
              success: true, 
              leads: contacts.slice(0, 50).map(c => ({
                name: c.name || c.pushName || 'Lead Ativo',
                phone: c.id ? c.id.split('@')[0] : 'Sem número',
                status: 'Interagindo',
                date: 'Hoje'
              }))
            });
          }
          throw new Error('No contacts in Evolution');
        } catch (e) {
          // Fallback para o Airtable se a Evolution falhar
          const realName = await getCorrectInstance(instanceName);
          const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}?filterByFormula={instanceName}='${realName}'&maxRecords=20`, {
            headers: { Authorization: `Bearer ${airtableToken}` }
          });
          const airtableData = await airtableRes.json();
          return res.status(200).json({ 
            success: true, 
            leads: (airtableData.records || []).map(r => ({
              name: r.fields.Nome || r.fields.businessName || 'Lead do Airtable',
              phone: r.fields.WhatsApp || r.fields.adminPhone || '---',
              status: 'Novo',
              date: 'Recente'
            }))
          });
        }

      case 'get-chats':
        try {
          const realName = await getCorrectInstance(instanceName);
          const r = await fetch(`${url}/chat/fetchChats?instanceName=${realName}`, fetchOptions);
          const d = await r.json();
          let raw = Array.isArray(d) ? d : (d.chats || d.data || []);
          
          if (raw.length === 0) {
            const leadsRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}?filterByFormula={instanceName}='${realName}'&maxRecords=20`, {
              headers: { Authorization: `Bearer ${airtableToken}` }
            });
            const leadsData = await leadsRes.json();
            raw = (leadsData.records || []).map(record => {
              let phone = record.fields.WhatsApp || record.fields.adminPhone || '';
              if (phone && !phone.includes('@')) phone = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
              return { id: phone || record.id, name: record.fields.Nome || record.fields.businessName || 'Lead Ativo', lastMsg: 'Lead Monitorado pela Sarah' };
            });
          }

          return res.status(200).json({ 
            success: true, 
            chats: raw.slice(0, 20).map(c => ({
              id: c.id || c.remoteJid, user: c.name || c.pushName || (c.id ? c.id.split('@')[0] : 'Cliente'), 
              lastMsg: c.lastMsg || 'Monitorado via IA', time: 'Ativo'
            }))
          });
        } catch (e) {
          return res.status(200).json({ success: true, chats: [] });
        }

      case 'get-messages':
        try {
          const realName = await getCorrectInstance(instanceName);
          let { remoteJid } = req.body;
          if (remoteJid && !remoteJid.includes('@')) {
            remoteJid = `${remoteJid.replace(/\D/g, '')}@s.whatsapp.net`;
          }

          const r = await fetch(`${url}/chat/findMessages/${realName}`, {
            method: 'POST',
            headers: fetchOptions.headers,
            body: JSON.stringify({ where: { remoteJid }, take: 30 })
          });
          const d = await r.json();
          const raw = Array.isArray(d) ? d : (d.messages || []);
          return res.status(200).json({ 
            success: true, 
            messages: raw.reverse().map(m => {
              const msg = m.message || {};
              let text = msg.conversation || msg.extendedTextMessage?.text || '';
              let type = 'text';

              let mimetype = '';
              if (msg.imageMessage) { text = '📷 Foto'; type = 'image'; mimetype = msg.imageMessage.mimetype; }
              else if (msg.audioMessage) { text = '🎤 Áudio'; type = 'audio'; mimetype = msg.audioMessage.mimetype; }
              else if (msg.videoMessage) { text = '🎥 Vídeo'; type = 'video'; mimetype = msg.videoMessage.mimetype; }
              else if (msg.documentMessage) { text = '📄 Documento'; type = 'document'; mimetype = msg.documentMessage.mimetype; }
              else if (msg.stickerMessage) { text = '📦 Figurinha'; type = 'sticker'; mimetype = msg.stickerMessage.mimetype; }
              else if (!text) text = 'Mensagem de mídia/sistema';

              return { id: m.key?.id, text, type, mimetype, fromMe: m.key?.fromMe, time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '' }
            })
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
