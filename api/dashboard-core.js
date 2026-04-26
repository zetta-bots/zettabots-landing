export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid } = req.body;
  
  // Ações que não precisam de instanceName obrigatoriamente
  const isAdminAction = ['get-admin-stats', 'get-all-instances', 'admin-extend', 'admin-toggle-status', 'list-instances', 'debug-chats'].includes(action);
  
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

        if (data.length === 0) return name;

        // Normalize string for matching
        const normalize = (str) => {
          if (!str) return '';
          return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^\w]/g, '')
            .trim();
        };

        const normalizedInput = normalize(name);
        let found = null;

        // Strategy 1: Exact match on instance.name
        found = data.find(i => i.name && normalize(i.name) === normalizedInput);

        // Strategy 2: Partial match on name
        if (!found) {
          found = data.find(i => i.name && normalize(i.name).includes(normalizedInput));
        }

        // Strategy 3: Match by phone
        if (!found) {
          found = data.find(i => i.phone && normalize(i.phone) === normalizedInput);
        }

        // Strategy 4: Supabase lookup by name → match by phone
        if (!found) {
          try {
            const sbRes = await fetch(
              `${sbUrl}/rest/v1/instances?instance_name=ilike.${encodeURIComponent(name)}&limit=1`,
              { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
            );
            if (sbRes.ok) {
              const sbData = await sbRes.json();
              if (sbData && sbData.length > 0 && sbData[0].phone) {
                // Found in Supabase, now match by phone in Evolution
                found = data.find(i => i.phone && normalize(i.phone) === normalize(sbData[0].phone));
              }
            }
          } catch (e) {
            console.log(`[getCorrectInstance] Supabase lookup failed:`, e.message);
          }
        }

        // Strategy 5: Fallback - use first connected instance (if only 1 other besides default)
        if (!found && data.length === 2) {
          found = data.find(i => i.name !== 'ZettaBots' && i.connectionStatus === 'open');
        }

        // Last resort: use first open connection
        if (!found) {
          found = data.find(i => i.connectionStatus === 'open');
        }

        console.log(`[getCorrectInstance] Input: "${name}" → Found: "${found?.name || 'NOT FOUND'}" (phone: ${found?.phone})`);

        return found ? found.name : name;
      } catch (e) {
        console.error(`[getCorrectInstance] Error:`, e.message);
        return name;
      }
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
          const found = data.find(i => (i.name && i.name.toLowerCase() === instanceName.toLowerCase()) || (i.name && i.name.toLowerCase().includes(instanceName.toLowerCase())));

          if (!found) throw new Error(`Instance "${instanceName}" not found`);

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
        try {
          const realName = await getCorrectInstance(instanceName);
          let leads = [];

          // Strategy 1: Try to get contacts from Evolution API
          try {
            const contactRes = await fetch(`${url}/contact/fetchContacts?instanceName=${realName}&limit=50`, fetchOptions);
            if (contactRes.ok) {
              const contactData = await contactRes.json();
              const contacts = Array.isArray(contactData) ? contactData : (contactData.contacts || contactData.data || []);

              if (contacts.length > 0) {
                leads = contacts.slice(0, 50).map(c => ({
                  name: c.name || c.pushName || 'Contato',
                  phone: c.id || c.jid || '---',
                  status: 'Ativo',
                  date: new Date().toLocaleDateString('pt-BR')
                }));
              }
            }
          } catch (e1) {
            console.log(`[get-leads] Strategy 1 failed:`, e1.message);
          }

          // Strategy 2: Extract from messages if no contacts found
          if (leads.length === 0) {
            try {
              const msgRes = await fetch(`${url}/message/findMessages/${realName}`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ where: {}, take: 100 })
              });
              if (msgRes.ok) {
                const msgData = await msgRes.json();
                const messages = Array.isArray(msgData) ? msgData : (msgData.messages || msgData.data || []);

                if (messages.length > 0) {
                  const uniqueLeads = {};
                  messages.forEach(msg => {
                    const jid = msg.remoteJid || msg.from || msg.key?.remoteJid;
                    if (jid && !uniqueLeads[jid]) {
                      uniqueLeads[jid] = {
                        name: msg.pushName || msg.senderName || jid.split('@')[0],
                        phone: jid,
                        status: 'Ativo',
                        date: msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
                      };
                    }
                  });
                  leads = Object.values(uniqueLeads).sort((a, b) => new Date(b.date) - new Date(a.date));
                }
              }
            } catch (e2) {
              console.log(`[get-leads] Strategy 2 failed:`, e2.message);
            }
          }

          // Strategy 3: Try Supabase as last resort
          if (leads.length === 0) {
            try {
              const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(realName)}&select=id`, {
                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
              });
              const instData = await instRes.json();

              if (instData && instData.length > 0) {
                const sbLeadsRes = await fetch(`${sbUrl}/rest/v1/leads?instance_id=eq.${instData[0].id}&limit=50`, {
                  headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                });
                const sbLeads = await sbLeadsRes.json() || [];

                if (sbLeads.length > 0) {
                  leads = sbLeads.map(r => ({
                    name: r.name || r.phone || 'Lead',
                    phone: r.phone || '---',
                    status: r.status || 'Novo',
                    date: r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : 'Recente'
                  }));
                }
              }
            } catch (e3) {
              console.log(`[get-leads] Strategy 3 failed:`, e3.message);
            }
          }

          return res.status(200).json({ success: true, leads });
        } catch (e) {
          console.error('[get-leads] Error:', e.message);
          return res.status(200).json({ success: true, leads: [], _debug: { error: e.message } });
        }
      }

      case 'get-chats':
        try {
          const realName = await getCorrectInstance(instanceName);
          let raw = [];

          // Strategy 1: Try /chat/fetchChats endpoint with limit
          try {
            const r = await fetch(`${url}/chat/fetchChats?instanceName=${realName}&limit=50`, fetchOptions);
            if (r.ok) {
              const d = await r.json();
              raw = Array.isArray(d) ? d : (d.chats || d.data || d.result || []);
            }
          } catch (e1) {
            console.log(`[get-chats] Strategy 1 failed:`, e1.message);
          }

          // Strategy 2: Try /chat/findAllChats endpoint
          if (raw.length === 0) {
            try {
              const r = await fetch(`${url}/chat/findAllChats/${realName}`, { ...fetchOptions, method: 'GET' });
              if (r.ok) {
                const d = await r.json();
                raw = Array.isArray(d) ? d : (d.chats || d.data || d.result || []);
              }
            } catch (e2) {
              console.log(`[get-chats] Strategy 2 failed:`, e2.message);
            }
          }

          // Strategy 3: Try /chat/findChats endpoint
          if (raw.length === 0) {
            try {
              const r = await fetch(`${url}/chat/findChats/${realName}`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ where: {}, take: 50 })
              });
              if (r.ok) {
                const d = await r.json();
                raw = Array.isArray(d) ? d : (d.chats || d.data || []);
              }
            } catch (e3) {
              console.log(`[get-chats] Strategy 3 failed:`, e3.message);
            }
          }

          // Strategy 4: Extract from messages as fallback
          if (raw.length === 0) {
            try {
              const msgRes = await fetch(`${url}/message/findMessages/${realName}`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ where: {}, take: 100 })
              });
              if (msgRes.ok) {
                const msgData = await msgRes.json();
                const messages = Array.isArray(msgData) ? msgData : (msgData.messages || msgData.data || []);

                if (messages.length > 0) {
                  const uniqueChats = {};
                  messages.forEach(msg => {
                    const jid = msg.remoteJid || msg.from || msg.key?.remoteJid;
                    if (jid && !uniqueChats[jid]) {
                      uniqueChats[jid] = {
                        id: jid,
                        remoteJid: jid,
                        name: msg.pushName || msg.senderName || jid.split('@')[0],
                        lastMsg: msg.text || msg.body || msg.message?.conversation || '[Mensagem]',
                        timestamp: msg.messageTimestamp || msg.timestamp || Date.now()
                      };
                    }
                  });
                  raw = Object.values(uniqueChats).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                  console.log(`[get-chats] Strategy 4 success: ${raw.length} chats from messages`);
                }
              }
            } catch (e4) {
              console.log(`[get-chats] Strategy 4 failed:`, e4.message);
            }
          }

          console.log(`[get-chats] Final result for ${realName}: ${raw.length} chats`);

          return res.status(200).json({
            success: true,
            chats: raw.slice(0, 20).map(c => ({
              id: c.id || c.remoteJid,
              user: c.name || c.pushName || (c.id ? c.id.split('@')[0] : 'Cliente'),
              lastMsg: c.lastMsg || 'Monitorado via IA',
              time: 'Ativo'
            }))
          });
        } catch (e) {
          console.error(`[get-chats] Error for ${instanceName}:`, e.message);
          return res.status(200).json({ success: true, chats: [] });
        }

      case 'get-messages':
        try {
          const realName = await getCorrectInstance(instanceName);
          let { remoteJid } = req.body;
          if (!remoteJid) return res.status(200).json({ success: true, messages: [] });

          // Ensure remoteJid is in correct format
          let jidToUse = remoteJid;
          if (!jidToUse.includes('@')) {
            const cleaned = jidToUse.replace(/\D/g, '');
            jidToUse = cleaned.length > 10 ? `${cleaned}@g.us` : `${cleaned}@s.whatsapp.net`;
          }

          let raw = [];

          // Strategy 1: Try /chat/findMessages endpoint
          try {
            const r = await fetch(`${url}/chat/findMessages/${realName}`, {
              method: 'POST',
              headers: fetchOptions.headers,
              body: JSON.stringify({ where: { remoteJid: jidToUse }, take: 50 })
            });
            if (r.ok) {
              const d = await r.json();
              raw = Array.isArray(d) ? d : (d.messages || d.data || []);
            }
          } catch (e1) {
            console.log(`[get-messages] Strategy 1 failed:`, e1.message);
          }

          // Strategy 2: Try /message/findMessages endpoint
          if (raw.length === 0) {
            try {
              const r = await fetch(`${url}/message/findMessages/${realName}`, {
                method: 'POST',
                headers: fetchOptions.headers,
                body: JSON.stringify({ where: { remoteJid: jidToUse }, take: 50 })
              });
              if (r.ok) {
                const d = await r.json();
                raw = Array.isArray(d) ? d : (d.messages || d.data || []);
              }
            } catch (e2) {
              console.log(`[get-messages] Strategy 2 failed:`, e2.message);
            }
          }

          // Strategy 3: Try /message/fetchMessages endpoint
          if (raw.length === 0) {
            try {
              const r = await fetch(`${url}/message/fetchMessages/${realName}?jid=${encodeURIComponent(jidToUse)}&limit=50`, {
                ...fetchOptions,
                method: 'GET'
              });
              if (r.ok) {
                const d = await r.json();
                raw = Array.isArray(d) ? d : (d.messages || d.data || []);
              }
            } catch (e3) {
              console.log(`[get-messages] Strategy 3 failed:`, e3.message);
            }
          }

          console.log(`[get-messages] Found ${raw.length} messages for ${jidToUse}`);

          return res.status(200).json({
            success: true,
            messages: raw.reverse().slice(0, 50).map(m => {
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

              return {
                id: m.key?.id,
                text,
                type,
                mimetype,
                fromMe: m.key?.fromMe,
                time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
              }
            })
          });
        } catch (e) {
          console.error(`[get-messages] Error:`, e.message);
          return res.status(200).json({ success: true, messages: [] });
        }

      case 'list-instances': {
        try {
          const listRes = await fetch(`${url}/instance/fetchInstances`, fetchOptions);
          const instances = await listRes.json();
          const data = Array.isArray(instances) ? instances : (instances.data || []);

          const formattedInstances = data.map(i => ({
            name: i.name,
            phone: i.phone,
            status: i.connectionStatus,
            ownerJid: i.ownerJid,
            integration: i.integration,
            _fullData: i
          }));

          return res.status(200).json({
            success: true,
            instances: formattedInstances,
            total: formattedInstances.length
          });
        } catch (e) {
          return res.status(200).json({ success: false, error: e.message });
        }
      }

      case 'debug-chats': {
        try {
          // First, get all instances
          const listRes = await fetch(`${url}/instance/fetchInstances`, fetchOptions);
          const instances = await listRes.json();
          const data = Array.isArray(instances) ? instances : (instances.data || []);

          const availableInstances = data.map(i => ({
            name: i.name,
            status: i.connectionStatus,
            phone: i.phone
          }));

          const realName = await getCorrectInstance(instanceName);
          const results = {};

          // Test Strategy 1
          try {
            const r = await fetch(`${url}/chat/fetchChats?instanceName=${realName}`, fetchOptions);
            results.strategy1 = { status: r.status, ok: r.ok, data: await r.json() };
          } catch (e) { results.strategy1 = { error: e.message }; }

          // Test Strategy 2
          try {
            const r = await fetch(`${url}/chat/findAllChats/${realName}`, { ...fetchOptions, method: 'GET' });
            results.strategy2 = { status: r.status, ok: r.ok, data: await r.json() };
          } catch (e) { results.strategy2 = { error: e.message }; }

          // Test Strategy 3
          try {
            const r = await fetch(`${url}/chat/findChats/${realName}`, {
              ...fetchOptions,
              method: 'POST',
              body: JSON.stringify({ where: {}, take: 50 })
            });
            results.strategy3 = { status: r.status, ok: r.ok, data: await r.json() };
          } catch (e) { results.strategy3 = { error: e.message }; }

          // Test Strategy 4 - Messages
          try {
            const r = await fetch(`${url}/message/findMessages/${realName}`, {
              ...fetchOptions,
              method: 'POST',
              body: JSON.stringify({ where: {}, take: 10 })
            });
            results.strategy4_response = { status: r.status, ok: r.ok };
            const msgData = await r.json();
            results.strategy4_sample = Array.isArray(msgData) ? msgData.slice(0, 1) : (msgData.messages ? msgData.messages.slice(0, 1) : msgData);
          } catch (e) { results.strategy4 = { error: e.message }; }

          return res.status(200).json({
            success: true,
            input: instanceName,
            realName,
            availableInstances,
            totalInstances: availableInstances.length,
            debug: results
          });
        } catch (e) {
          return res.status(200).json({ success: false, error: e.message });
        }
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

      case 'get-contacts': {
        try {
          const listRes = await fetch(`${url}/instance/fetchInstances`, {
            headers: { 'apikey': key, 'Content-Type': 'application/json' },
            timeout: 8000
          });
          const instances = await listRes.json();
          const data = Array.isArray(instances) ? instances : (instances.data || []);
          const found = data.find(i => (i.name && i.name.toLowerCase() === instanceName.toLowerCase()) || (i.name && i.name.toLowerCase().includes(instanceName.toLowerCase())));

          if (!found) {
            return res.status(200).json({
              success: true,
              contacts: [],
              contactCount: 0,
              message: 'Instance not found'
            });
          }

          const contactCount = found._count?.Contact || 0;

          // Try to get from Supabase first
          const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(found.name)}&select=id`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          const instData = await instRes.json();

          let contacts = [];
          if (instData && instData.length > 0) {
            const contactsRes = await fetch(`${sbUrl}/rest/v1/leads?instance_id=eq.${instData[0].id}&limit=50&order=created_at.desc`, {
              headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
            });
            const sbContacts = await contactsRes.json() || [];
            contacts = sbContacts.map(c => ({
              id: c.id,
              name: c.name || c.phone || 'Contato',
              phone: c.phone || '---',
              status: c.status || 'Novo',
              date: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Recente',
              source: 'supabase'
            }));
          }

          if (contacts.length === 0 && contactCount > 0) {
            return res.status(200).json({
              success: true,
              contacts: [],
              contactCount,
              message: `${contactCount} contato${contactCount > 1 ? 's' : ''} aguardando sincronização. Eles aparecerão aqui quando enviarem a primeira mensagem.`,
              hasData: true,
              totalContactsFromApi: contactCount
            });
          }

          return res.status(200).json({
            success: true,
            contacts,
            contactCount: contacts.length || contactCount,
            totalContactsFromApi: contactCount
          });
        } catch (error) {
          console.error('[get-contacts] Error:', error);
          return res.status(500).json({
            success: false,
            error: error.message,
            contacts: []
          });
        }
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server Error' });
  }
}
