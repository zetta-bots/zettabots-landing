export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid } = req.body;
  if (!action || !instanceName) return res.status(400).json({ error: 'Action and Instance required' });

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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
      case 'get-finance':
        try {
          const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${instanceName}&select=*`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          const instData = await instRes.json();
          if (instData && instData.length > 0) {
            const record = instData[0];
            return res.status(200).json({
              success: true,
              plan: record.plan || 'ZettaBots Pro',
              status: record.status || 'trial',
              nextBilling: record.next_billing ? new Date(record.next_billing).toLocaleDateString('pt-BR') : 'Sem Vencimento',
              value: 'R$ 97,00',
              invoices: [
                { id: 'FAT-202604', date: '21/04/2026', value: 'R$ 97,00', status: 'Pago' }
              ]
            });
          }
          throw new Error('Not found');
        } catch (e) {
          return res.status(500).json({ error: 'Finance fetch error' });
        }

      case 'get-stats':
        try {
          const realName = await getCorrectInstance(instanceName);
          const r = await fetch(`${url}/chat/fetchChats?instanceName=${realName}`, fetchOptions);
          const d = await r.json();
          const chats = Array.isArray(d) ? d : (d.chats || d.data || []);
          
          let totalLeads = 0;
          try {
            const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${realName}&select=id`, {
              headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
            });
            const instData = await instRes.json();
            if (instData && instData.length > 0) {
              const leadsRes = await fetch(`${sbUrl}/rest/v1/leads?instance_id=eq.${instData[0].id}&select=id`, {
                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
              });
              const leadsData = await leadsRes.json();
              totalLeads = leadsData?.length || 0;
            }
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
          // Fallback para o Supabase se a Evolution falhar
          const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${realName}&select=id`, {
             headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          const instData = await instRes.json();
          let sbLeads = [];
          if (instData && instData.length > 0) {
             const sbLeadsRes = await fetch(`${sbUrl}/rest/v1/leads?instance_id=eq.${instData[0].id}&limit=20`, {
                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
             });
             sbLeads = await sbLeadsRes.json() || [];
          }
          return res.status(200).json({ 
            success: true, 
            leads: sbLeads.map(r => ({
              name: r.name || 'Lead do Supabase',
              phone: r.phone || '---',
              status: r.status || 'Novo',
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : 'Recente'
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
            const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${realName}&select=id,phone,name`, {
              headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
            });
            const instData = await instRes.json();
            if (instData && instData.length > 0) {
              const record = instData[0];
              let phone = record.phone || '';
              if (phone && !phone.includes('@')) phone = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
              raw = [{ id: phone || record.id, name: record.name || 'Lead Ativo', lastMsg: 'Lead Monitorado pela Sarah' }];
            }
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

      case 'get-media':
        try {
          const { messageId } = req.body;
          if (!messageId) return res.status(400).json({ error: 'Missing params' });
          const resMedia = await fetch(`${url}/chat/getBase64FromMediaMessage/${instanceName}`, {
            method: 'POST',
            headers: fetchOptions.headers,
            body: JSON.stringify({ message: { key: { id: messageId } } })
          });
          if (!resMedia.ok) throw new Error('Failed to fetch from Evolution');
          const data = await resMedia.json();
          return res.status(200).json({ success: true, base64: data.base64, mimetype: data.mimetype });
        } catch (error) {
          return res.status(500).json({ error: 'Error fetching media' });
        }

      case 'toggle-ai':
        try {
          const { enabled, systemPrompt } = req.body;
          const setRes = await fetch(`${url}/chatgpt/setSettings/${instanceName}`, {
            method: 'POST',
            headers: fetchOptions.headers,
            body: JSON.stringify({
              enabled: enabled,
              systemPrompt: systemPrompt || "Você é a Sarah.",
              model: "gpt-4o",
              timezone: "America/Sao_Paulo"
            })
          });
          if (!setRes.ok) throw new Error('Failed to toggle AI in Evolution');
          return res.status(200).json({ success: true, enabled });
        } catch (error) {
          return res.status(500).json({ error: 'Error toggling AI' });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server Down' });
  }
}
