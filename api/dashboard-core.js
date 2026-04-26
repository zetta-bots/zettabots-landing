export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid } = req.body;
  
  // Ações de Admin não precisam de instanceName obrigatoriamente
  const isAdminAction = ['get-admin-stats', 'get-all-instances', 'admin-extend', 'admin-toggle-status'].includes(action);
  
  if (!action || (!isAdminAction && !instanceName)) {
    return res.status(400).json({ error: 'Action and Instance required' });
  }

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const fetchOptions = { headers: { 'apikey': key, 'Content-Type': 'application/json' }, timeout: 8000 };

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
          const { email } = req.body;
          const PLAN_DISPLAY = {
            start:      { label: 'Start',      value: 'R$ 127,00' },
            pro:        { label: 'Pro',         value: 'R$ 247,00' },
            enterprise: { label: 'Enterprise',  value: 'R$ 997,00' },
            trial:      { label: 'Trial',       value: 'Grátis'    },
            blocked:    { label: 'Bloqueado',   value: '—'         },
            pago:       { label: 'Pro',         value: 'R$ 247,00' },
          };

          let profileData = null;
          if (email) {
            const pRes = await fetch(
              `${sbUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=plan_type,plan_expires_at,mercadopago_subscription_id&limit=1`,
              { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
            );
            const pArr = await pRes.json();
            profileData = pArr?.[0] || null;
          }

          const status = profileData?.plan_type || 'trial';
          const planInfo = PLAN_DISPLAY[status] || PLAN_DISPLAY.trial;
          const nextBilling = profileData?.plan_expires_at
            ? new Date(profileData.plan_expires_at).toLocaleDateString('pt-BR')
            : 'Sem Vencimento';

          return res.status(200).json({
            success: true,
            plan: `ZettaBots ${planInfo.label}`,
            status,
            nextBilling,
            value: planInfo.value,
            invoices: [],
          });
        } catch (e) {
          return res.status(500).json({ error: 'Finance fetch error' });
        }

      case 'get-stats':
        try {
          const listRes = await fetch(`${url}/instance/fetchInstances`, fetchOptions);
          const instances = await listRes.json();
          const data = Array.isArray(instances) ? instances : (instances.data || []);
          const found = data.find(i => i.instanceName.toLowerCase() === instanceName.toLowerCase() || i.instanceName.toLowerCase().includes(instanceName.toLowerCase()));

          if (!found) throw new Error('Instance not found');

          const statsData = found._count || { Message: 0, Contact: 0, Chat: 0 };
          const contacts = statsData.Contact || 0;
          const messages = statsData.Message || 0;
          const chatsCount = statsData.Chat || 0;

          console.log('[get-stats] Found instance:', { name: found.instanceName, status: found.connectionStatus, _count: found._count, extracted: { contacts, messages, chatsCount } });

          return res.status(200).json({
            success: true,
            status: found.connectionStatus === 'open' ? 'CONNECTED' : 'DISCONNECTED',
            stats: {
              contacts: contacts,
              chats: chatsCount || (contacts * 1.5),
              messages: messages,
              savedTime: `${Math.floor((contacts * 0.5) + (chatsCount * 0.2))}h`,
              roi: `R$ ${((contacts * 180) + (chatsCount * 45)).toLocaleString('pt-BR')}`,
              activity: [2, 5, 1, 8, 4, contacts || 2, 0]
            },
            _debug: { instanceFound: true, contact_count: contacts, message_count: messages, chat_count: chatsCount }
          });
        } catch (e) {
          console.error('[get-stats] Error:', e.message);
          return res.status(200).json({ success: true, stats: { contacts: 0, chats: 0, messages: 0, savedTime: '0h', roi: 'R$ 0', activity: [0,0,0,0,0,0,0] }, _debug: { error: e.message } });
        }

      case 'get-leads': {
        let realName;
        try {
          realName = await getCorrectInstance(instanceName);
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
          try {
            if (!realName) realName = await getCorrectInstance(instanceName);
            const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(realName)}&select=id`, {
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
          } catch (innerErr) {
            return res.status(200).json({ success: true, leads: [] });
          }
        }
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
              raw = [{ id: phone || record.id, name: record.name || 'Lead Ativo', lastMsg: 'Monitorado via IA' }];
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

      case 'get-admin-stats': {
        try {
          const { email: adminEmail } = req.body;
          if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });

          const profRes = await fetch(
            `${sbUrl}/rest/v1/profiles?select=id,email,full_name,plan_type,is_active,plan_expires_at,mercadopago_subscription_id&order=created_at.desc`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
          );
          const clients = await profRes.json() || [];

          const PLAN_MRR = { start: 127, pro: 247, enterprise: 997, trial: 0, blocked: 0, pago: 247 };
          const now = new Date();
          const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const active   = clients.filter(p => p.is_active && !['trial','blocked'].includes(p.plan_type));
          const trial    = clients.filter(p => p.plan_type === 'trial');
          const blocked  = clients.filter(p => p.plan_type === 'blocked' || !p.is_active);
          const expiring = clients.filter(p => {
            if (!p.plan_expires_at || !p.is_active) return false;
            const d = new Date(p.plan_expires_at);
            return d > now && d <= in7;
          });
          const mrr = active.reduce((s, p) => s + (PLAN_MRR[p.plan_type] || 0), 0);
          const mrrDistribution = {
            start:      active.filter(p => p.plan_type === 'start').length * 127,
            pro:        active.filter(p => p.plan_type === 'pro' || p.plan_type === 'pago').length * 247,
            enterprise: active.filter(p => p.plan_type === 'enterprise').length * 997,
          };

          return res.status(200).json({
            success: true,
            mrr,
            mrrDistribution,
            totalClients: clients.length,
            totalActive:  active.length,
            totalTrial:   trial.length,
            totalBlocked: blocked.length,
            expiringSoon: expiring,
            clients,
          });
        } catch (e) {
          return res.status(500).json({ error: 'Admin stats error' });
        }
      }

      case 'admin-extend': {
        try {
          const { email: adminEmail, targetEmail, days = 7 } = req.body;
          if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });
          
          const pRes = await fetch(`${sbUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(targetEmail)}&select=plan_expires_at`, {
             headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
          });
          const pArr = await pRes.json();
          const currentExp = pArr?.[0]?.plan_expires_at ? new Date(pArr[0].plan_expires_at) : new Date();
          const newExp = new Date(currentExp.getTime() + (days * 24 * 60 * 60 * 1000)).toISOString();

          await fetch(
            `${sbUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(targetEmail)}`,
            {
              method: 'PATCH',
              headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({ plan_expires_at: newExp, is_active: true }),
            }
          );
          return res.status(200).json({ success: true });
        } catch (e) {
          return res.status(500).json({ error: 'Extend error' });
        }
      }

      case 'admin-toggle-status': {
        try {
          const { email: adminEmail, targetEmail, isActive } = req.body;
          if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado: ' + adminEmail });

          const sbRes = await fetch(
            `${sbUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(targetEmail)}`,
            {
              method: 'PATCH',
              headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({ is_active: isActive }),
            }
          );
          
          if (!sbRes.ok) {
            const errText = await sbRes.text();
            throw new Error('Supabase Error: ' + errText);
          }

          return res.status(200).json({ success: true });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }

      case 'get-all-instances':
        try {
          const { email } = req.body;
          if (email !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });

          const allRes = await fetch(`${sbUrl}/rest/v1/instances?select=*&order=created_at.desc`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          const allData = await allRes.json();
          return res.status(200).json({ success: true, instances: allData || [] });
        } catch (e) {
          return res.status(500).json({ error: 'Admin fetch error' });
        }

      case 'global-kill-switch': {
        try {
          const { email, enabled } = req.body;
          const profRes = await fetch(
            `${sbUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=instance_name`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
          );
          const profiles = await profRes.json();
          const targetInstance = profiles?.[0]?.instance_name;
          if (targetInstance) {
            await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(targetInstance)}`, {
              method: 'PATCH',
              headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({ ai_paused: enabled }),
            });
          }
          return res.status(200).json({ success: true, ai_paused: enabled });
        } catch (e) {
          return res.status(500).json({ error: 'Kill switch error' });
        }
      }

      case 'toggle-ai':
        try {
          const { enabled } = req.body;
          const paused = !enabled;
          await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(instanceName)}`, {
            method: 'PATCH',
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ ai_paused: paused }),
          });
          return res.status(200).json({ success: true, enabled, ai_paused: paused });
        } catch (error) {
          return res.status(500).json({ error: 'Error toggling AI' });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server Error' });
  }
}
