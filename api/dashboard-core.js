export default async function handler(req, res) {
  const action = req.body?.action || req.query?.action;
  
  if (req.method !== 'POST' && action !== 'scheduler-cron') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  let instanceName = req.body?.instanceName || req.query?.instanceName;
  const { remoteJid, recordId, email, name, payment_method, amount, planName, systemPrompt, webhookUrl, googleCalendarId, notificationEmail } = req.body || {};
  const planPrice = parseFloat(amount || 247);
  const planLabel = planName || 'Pro';
  
  // Ações que não precisam de instanceName obrigatoriamente
  const isAdminAction = [
    'get-admin-stats', 'get-all-instances', 'admin-extend', 'admin-toggle-status', 
    'list-instances', 'create-payment', 'create-checkout', 'test-update-atlas', 
    'test-reset-atlas', 'test-email', 'send-transbordo-email', 'scheduler-cron', 'get-schedules'
  ].includes(action);
  
  if (!action || (!isAdminAction && !instanceName)) {
    console.error('[dashboard-core] Missing required params:', { action, instanceName, isAdminAction });
    return res.status(400).json({ error: 'Action and Instance required' });
  }

  const url = (process.env.EVOLUTION_URL).replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY;
  const sbUrl = process.env.VITE_SUPABASE_URL;
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


        return found ? found.name : name;
      } catch (e) {
        return name;
      }
    };

    const syncContactsFromMessages = async (messages, instanceName) => {
      try {
        if (!Array.isArray(messages) || messages.length === 0) {
          return;
        }

        const uniqueContacts = new Map();
        let foundContacts = 0;

        for (const msg of messages) {
          if (!msg) continue;

          const remoteJid = msg.key?.remoteJid || msg.remoteJid || msg.from;
          if (!remoteJid) continue;

          const phone = remoteJid.replace(/@.+$/, '').trim();
          if (!phone || uniqueContacts.has(phone)) continue;

          foundContacts++;
          const pushName = msg.pushName || msg.senderName || msg.notifyName || null;
          const senderName = msg.senderName || msg.pushName || null;

          let name = pushName || senderName || null;
          if (!name && remoteJid.includes('@g.us')) {
            name = msg.chatName || null;
          }
          if (!name) {
            const cleaned = phone.replace(/^\+?55/, '').slice(-10);
            name = cleaned.length > 0 ? cleaned : phone;
          }

          uniqueContacts.set(phone, {
            phone,
            name: name || `Contato ${phone}`,
            instance_name: instanceName,
            stage: 'lead',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        if (uniqueContacts.size === 0) {
          return;
        }

        const contactsList = Array.from(uniqueContacts.values());
        const upsertPayload = contactsList.map(c => ({
          instance_name: c.instance_name,
          phone: c.phone,
          name: c.name,
          stage: c.stage,
          created_at: c.created_at,
          updated_at: c.updated_at
        }));

        const sbRes = await fetch(`${sbUrl}/rest/v1/crm_leads?on_conflict=instance_name,phone`, {
          method: 'POST',
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(upsertPayload),
          timeout: 5000
        });

        if (!sbRes.ok) {
          await sbRes.text().catch(() => {});
        }
      } catch (e) {
      }
    };

    switch (action) {
      case 'create-payment': {
        try {
          if (!recordId) return res.status(400).json({ error: 'Identificador do cliente não encontrado' });

          const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
          console.log('[create-payment] Token status:', token ? 'Loaded' : 'Missing', 'Token length:', token?.length || 0);

          if (!token) return res.status(500).json({ error: 'Mercado Pago não configurado no servidor' });

          const mpModule = await import('mercadopago');
          const { Payment, MercadoPagoConfig } = mpModule;
          const client = new MercadoPagoConfig({ accessToken: token });
          const payment = await new Payment(client).create({
            body: {
              transaction_amount: planPrice,
              description: `Assinatura ZettaBots ${planLabel} (30 dias)`,
              payment_method_id: 'pix',
              payer: {
                email: (email && email.includes('@')) ? email : 'cliente@zettabots.ia.br',
                first_name: name || 'Cliente ZettaBots'
              },
              external_reference: String(recordId),
              metadata: {
                plan_type: planLabel.toLowerCase()
              }
            }
          });
          return res.status(200).json({ success: true, payment });
        } catch (mpErr) {
          console.error('[create-payment] Mercado Pago Error:', mpErr.message);
          return res.status(500).json({ error: `Erro ao gerar Pix: ${mpErr.message}` });
        }
      }
      case 'create-checkout': {
        try {
          if (!recordId) return res.status(400).json({ error: 'Identificador do cliente não encontrado' });

          const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
          console.log('[create-checkout] Token status:', token ? 'Loaded' : 'Missing', 'Token length:', token?.length || 0);

          if (!token) return res.status(500).json({ error: 'Mercado Pago não configurado no servidor' });

          const mpModule = await import('mercadopago');
          const { Preference, MercadoPagoConfig } = mpModule;
          const client = new MercadoPagoConfig({ accessToken: token });
          const preference = await new Preference(client).create({
            body: {
              items: [
                {
                  title: `Assinatura ZettaBots ${planLabel} (30 dias)`,
                  quantity: 1,
                  unit_price: planPrice,
                  currency_id: 'BRL'
                }
              ],
              payer: {
                email: (email && email.includes('@')) ? email : 'cliente@zettabots.ia.br'
              },
              external_reference: String(recordId),
              back_urls: {
                success: 'https://zettabots.ia.br/dashboard?status=success',
                failure: 'https://zettabots.ia.br/dashboard?status=failure',
                pending: 'https://zettabots.ia.br/dashboard?status=pending'
              },
              auto_return: 'approved'
            }
          });
          return res.status(200).json({ success: true, url: preference.init_point });
        } catch (mpErr) {
          console.error('[create-checkout] Mercado Pago Error:', mpErr.message);
          return res.status(500).json({ error: `Erro ao gerar checkout: ${mpErr.message}` });
        }
      }
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
          const createdAt = profileData?.created_at ? new Date(profileData.created_at) : new Date();
          const nextBilling = profileData?.plan_expires_at
            ? new Date(profileData.plan_expires_at).toLocaleDateString('pt-BR')
            : new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

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
          }

          // Strategy 2: Try /chat/findAllChats endpoint
          if (raw.length === 0) {
            try {
              const r = await fetch(`${url}/chat/findAllChats/${realName}`, { ...fetchOptions, method: 'GET' });
              if (r.ok) {
                const d = await r.json();
                if (Array.isArray(d)) {
                  raw = d;
                } else if (d.chats) {
                  raw = Array.isArray(d.chats) ? d.chats : [d.chats];
                } else if (d.data) {
                  raw = Array.isArray(d.data) ? d.data : [d.data];
                } else if (d.remoteJid || d.id) {
                  // Single chat object
                  raw = [d];
                } else {
                  raw = [];
                }
              }
            } catch (e2) {
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
                if (Array.isArray(d)) {
                  raw = d;
                } else if (d.chats) {
                  raw = Array.isArray(d.chats) ? d.chats : [d.chats];
                } else if (d.data) {
                  raw = Array.isArray(d.data) ? d.data : [d.data];
                } else if (d.remoteJid || d.id) {
                  raw = [d];
                } else {
                  raw = [];
                }
              }
            } catch (e3) {
            }
          }

          // Strategy 4: Extract from messages (always run to combine with other strategies)
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

                // Merge existing chats with message-based chats
                raw.forEach(c => {
                  const jid = c.remoteJid || c.id;
                  if (jid && !uniqueChats[jid]) {
                    uniqueChats[jid] = c;
                  }
                });

                // Add/merge with message-based chats
                messages.forEach(msg => {
                  const jid = msg.remoteJid || msg.from || msg.key?.remoteJid;
                  if (jid) {
                    if (!uniqueChats[jid]) {
                      uniqueChats[jid] = {
                        id: jid,
                        remoteJid: jid,
                        name: msg.pushName || msg.senderName || jid.split('@')[0],
                        lastMsg: msg.text || msg.body || msg.message?.conversation || '[Mensagem]',
                        timestamp: msg.messageTimestamp || msg.timestamp || Date.now()
                      };
                    } else if (!uniqueChats[jid].lastMsg || !uniqueChats[jid].timestamp) {
                      // Enhance existing chat with message data
                      uniqueChats[jid].lastMsg = msg.text || msg.body || msg.message?.conversation || uniqueChats[jid].lastMsg;
                      uniqueChats[jid].timestamp = msg.messageTimestamp || msg.timestamp || uniqueChats[jid].timestamp;
                    }
                  }
                });

                raw = Object.values(uniqueChats).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              }
            }
          } catch (e4) {
          }


          // Buscar ai_paused do Supabase
          let aiPausedMap = {};
          try {
            const sbRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${instanceName}&select=ai_paused`, {
              headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
            });
            if (sbRes.ok) {
              const instances = await sbRes.json();
              if (instances.length > 0) {
                aiPausedMap[instanceName] = instances[0].ai_paused || false;
              }
            }
          } catch (e) {
            console.error('[get-chats] Error fetching ai_paused:', e.message);
          }

          return res.status(200).json({
            success: true,
            chats: raw.slice(0, 20).map(c => ({
              id: c.id || c.remoteJid,
              remoteJid: c.remoteJid || c.id,
              user: c.name || c.pushName || (c.remoteJid ? c.remoteJid.split('@')[0] : (c.id ? c.id.split('@')[0] : 'Cliente')),
              lastMsg: c.lastMsg || 'Monitorado via IA',
              time: 'Ativo',
              ai_paused: aiPausedMap[instanceName] || false
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
          if (!remoteJid) {
            return res.status(200).json({ success: true, messages: [] });
          }

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
              // Handle nested structure: { messages: { records: [...], total, pages } }
              if (Array.isArray(d)) {
                raw = d;
              } else if (d && d.messages && d.messages.records && Array.isArray(d.messages.records)) {
                raw = d.messages.records;
              } else if (d && d.messages && Array.isArray(d.messages)) {
                raw = d.messages;
              } else if (d && d.data && Array.isArray(d.data)) {
                raw = d.data;
              }
            }
          } catch (e1) {
          }

          // Strategy 2: Try /message/findMessages endpoint
          if (raw && raw.length === 0) {
            try {
              const r = await fetch(`${url}/message/findMessages/${realName}`, {
                method: 'POST',
                headers: fetchOptions.headers,
                body: JSON.stringify({ where: { remoteJid: jidToUse }, take: 50 })
              });
              if (r.ok) {
                const d = await r.json();
                if (Array.isArray(d)) {
                  raw = d;
                } else if (d && d.messages && d.messages.records && Array.isArray(d.messages.records)) {
                  raw = d.messages.records;
                } else if (d && d.messages && Array.isArray(d.messages)) {
                  raw = d.messages;
                } else if (d && d.data && Array.isArray(d.data)) {
                  raw = d.data;
                }
              }
            } catch (e2) {
            }
          }

          // Strategy 3: Try /message/fetchMessages endpoint
          if (raw && raw.length === 0) {
            try {
              const r = await fetch(`${url}/message/fetchMessages/${realName}?jid=${encodeURIComponent(jidToUse)}&limit=50`, {
                ...fetchOptions,
                method: 'GET'
              });
              if (r.ok) {
                const d = await r.json();
                if (Array.isArray(d)) {
                  raw = d;
                } else if (d && d.messages && d.messages.records && Array.isArray(d.messages.records)) {
                  raw = d.messages.records;
                } else if (d && d.messages && Array.isArray(d.messages)) {
                  raw = d.messages;
                } else if (d && d.data && Array.isArray(d.data)) {
                  raw = d.data;
                }
              }
            } catch (e3) {
            }
          }

          // Strategy 4: Try searching ALL messages without JID filter (to see if ANY messages exist)
          if (raw && raw.length === 0) {
            try {
              const r = await fetch(`${url}/message/findMessages/${realName}`, {
                method: 'POST',
                headers: fetchOptions.headers,
                body: JSON.stringify({ where: {}, take: 100 })
              });
              if (r.ok) {
                const d = await r.json();
                let allMsgs = [];
                if (Array.isArray(d)) {
                  allMsgs = d;
                } else if (d && d.messages && d.messages.records && Array.isArray(d.messages.records)) {
                  allMsgs = d.messages.records;
                } else if (d && d.messages && Array.isArray(d.messages)) {
                  allMsgs = d.messages;
                } else if (d && d.data && Array.isArray(d.data)) {
                  allMsgs = d.data;
                }

                // Filter by JID if we have messages
                if (allMsgs.length > 0) {
                  raw = allMsgs.filter(m => {
                    const msgJid = m.remoteJid || m.from || m.key?.remoteJid;
                    const match = msgJid === jidToUse || msgJid?.includes(jidToUse.split('@')[0]);
                    return match;
                  });
                }
              }
            } catch (e4) {
            }
          }

          // Ensure raw is always an array before using it
          if (!Array.isArray(raw)) raw = [];

          const mappedMessages = raw.reverse().slice(0, 50).map(m => {
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

            const timestamp = m.messageTimestamp || m.timestamp || (Date.now() / 1000);
            const date = new Date((timestamp * 1000) - (3 * 60 * 60 * 1000));

            return {
              id: m.key?.id,
              text,
              type,
              mimetype,
              fromMe: m.key?.fromMe,
              time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
          });

          syncContactsFromMessages(raw, realName);

          return res.status(200).json({
            success: true,
            messages: mappedMessages
          });
        } catch (e) {
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

      case 'send-manual-message': {
        const { remoteJid, text } = req.body;
        if (!instanceName || !remoteJid || !text) return res.status(400).json({ error: 'Faltam dados' });

        try {
          const evolutionRes = await fetch(`${url}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': key },
            body: JSON.stringify({ number: remoteJid.replace(/\D/g, ''), text })
          });
          const data = await evolutionRes.json();
          return res.json({ success: true, data });
        } catch (err) {
          return res.status(500).json({ error: err.message });
        }
      }

      case 'get-admin-stats': {
        try {
          const { email: adminEmail } = req.body;
          if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });

          // Manual mapping of instance IDs to display names
          const instanceDisplayNames = {
            'zbab2f7c727336': 'Atlas da Fé',
            'ZettaBots': 'ZettaBots'
          };

          // Fetch clients from Supabase
          const profRes = await fetch(
            `${sbUrl}/rest/v1/profiles?select=id,email,full_name,instance_name,plan_type,is_active,plan_expires_at,mercadopago_subscription_id&order=created_at.desc`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
          );
          let clients = await profRes.json() || [];

          // Fetch evolution instances for Health Check
          let evoInstances = [];
          try {
            const listRes = await fetch(`${url}/instance/fetchInstances`, fetchOptions);
            const instances = await listRes.json();
            evoInstances = Array.isArray(instances) ? instances : (instances.data || []);
          } catch(e) {}

          // Enrich clients with display names and health status
          clients = clients.map(client => {
            const bot_name =
              instanceDisplayNames[client.instance_name] ||
              client.instance_name ||
              client.full_name ||
              'Cliente';

            const evoMatch = evoInstances.find(i => i.name === client.instance_name);
            const evoStatus = evoMatch ? evoMatch.connectionStatus : 'disconnected';
            
            let health = 'red';
            if (evoStatus === 'open') {
              health = client.bot_paused ? 'yellow' : 'green';
            }

            return { ...client, bot_name, whatsapp_status: evoStatus, health_status: health };
          });

          const PLAN_MRR = { start: 127, pro: 247, enterprise: 997, trial: 0, blocked: 0, pago: 247 };
          const now = new Date();
          const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          // Exclude admin from client metrics
          const isAdmin = (c) => c.full_name === 'richardrovigati' || c.plan_type === 'admin';
          console.log('[ADMIN STATS] Checking clients:', clients.map(c => ({ full_name: c.full_name, plan_type: c.plan_type, isAdmin: isAdmin(c) })));
          const nonAdminClients = clients.filter(c => !isAdmin(c));
          console.log('[ADMIN STATS] Non-admin clients count:', nonAdminClients.length);

          const active   = nonAdminClients.filter(p => p.is_active && !['trial','blocked'].includes(p.plan_type));
          const trial    = nonAdminClients.filter(p => p.plan_type === 'trial');
          const blocked  = nonAdminClients.filter(p => p.plan_type === 'blocked' || !p.is_active);
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
            totalClients: nonAdminClients.length,
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
          return res.status(500).json({ error: 'Admin toggle error' });
        }
      }


      case 'test-update-atlas': {
        try {
          const { email: adminEmail } = req.body;
          if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });

          // Update Atlas da Fé to plan_type: start and expiration to 2026-05-03
          const updateRes = await fetch(
            `${sbUrl}/rest/v1/profiles?instance_name=eq.zbab2f7c727336`,
            {
              method: 'PATCH',
              headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({
                plan_type: 'start',
                plan_expires_at: '2026-05-03T23:59:59Z'
              }),
            }
          );

          if (!updateRes.ok) {
            const errText = await updateRes.text();
            throw new Error('Supabase Error: ' + errText);
          }

          return res.status(200).json({ success: true, message: 'Atlas da Fé updated to Start plan, expires 2026-05-03' });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }

      case 'test-reset-atlas': {
        try {
          const { email: adminEmail } = req.body;
          if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });

          const now = new Date();
          const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

          // Reset Atlas da Fé to TRIAL
          const updateRes = await fetch(
            `${sbUrl}/rest/v1/profiles?instance_name=eq.zbab2f7c727336`,
            {
              method: 'PATCH',
              headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({
                plan_type: 'trial',
                plan_expires_at: trialEnd,
                is_active: true
              }),
            }
          );

          if (!updateRes.ok) {
            const errText = await updateRes.text();
            throw new Error('Supabase Error: ' + errText);
          }

          return res.status(200).json({ success: true, message: `Atlas da Fé reset to TRIAL, expires in 7 days (${trialEnd})` });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }

      case 'get-all-instances':
        try {
          const isAdmin = (email === 'richardrovigati@gmail.com');
          const instanceDisplayNames = {
            'zbab2f7c727336': 'Atlas da Fé',
            'zba5b8f4b6e848': 'Atlas da Fé', // Mapping the new ID too
            'ZettaBots': 'ZettaBots'
          };

          // Se for admin, pega tudo. Se não, filtra pelo email.
          const queryParam = isAdmin ? 'select=*' : `email=eq.${encodeURIComponent(email)}&select=*`;
          const allRes = await fetch(`${sbUrl}/rest/v1/instances?${queryParam}&order=created_at.desc`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          let allData = await allRes.json() || [];

          // Add display name mapping
          allData = allData.map(instance => ({
            ...instance,
            display_name: instanceDisplayNames[instance.instance_name] || instance.instance_name || instance.name || 'Bot'
          }));

          return res.status(200).json({ success: true, instances: allData });
        } catch (error) {
          return res.status(500).json({ error: error.message });
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
            const contactsRes = await fetch(`${sbUrl}/rest/v1/crm_leads?instance_name=eq.${encodeURIComponent(found.name)}&select=*&limit=50&order=created_at.desc`, {
              headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
            });
            const sbContacts = await contactsRes.json() || [];
            contacts = sbContacts.map(c => ({
              id: c.id,
              name: c.name || c.phone || 'Contato',
              phone: c.phone || '---',
              status: c.stage || 'lead',
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
          return res.status(500).json({
            success: false,
            error: error.message,
            contacts: []
          });
        }
      }

      case 'chat-test': {
        try {
          const { message, systemPrompt, history } = req.body;
          const GROQ_KEY = process.env.GROQ_API_KEY;
          const GEMINI_KEY = process.env.GEMINI_API_KEY;

          // 1. Buscar base de conhecimento (RAG)
          let knowledgeBase = '';
          try {
            const kbRes = await fetch(
              `${sbUrl}/rest/v1/knowledge_base?instance_name=eq.${encodeURIComponent(instanceName)}&status=eq.active&select=extracted_text`,
              { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
            );
            const kbData = await kbRes.json();
            if (Array.isArray(kbData) && kbData.length > 0) {
              knowledgeBase = kbData.map(item => item.extracted_text).join('\n---\n');
            }
          } catch (e) {}
          
          // 2. Montar o Contexto Final
          let finalPrompt = systemPrompt || 'Você é a Sarah, assistente virtual da ZettaBots.';
          
          if (knowledgeBase && knowledgeBase.trim().length > 0) {
            finalPrompt += '\n\nBASE DE CONHECIMENTO (Use estes dados como prioridade para respostas técnicas):\n' + knowledgeBase;
          }

          finalPrompt += '\n\nIMPORTANTE: Se o usuário pedir o site ou link de cadastro, use sempre https://zettabots.ia.br/. Seja prestativo e siga o tom de voz definido.';

          // 3. Função Gemini (Fallback de Alta Disponibilidade)
          const callGemini = async () => {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  { role: 'user', parts: [{ text: `INSTRUÇÕES MESTRE:\n${finalPrompt}\n\nResponda agora ao cliente seguindo as regras acima.` }] },
                  { role: 'model', parts: [{ text: 'Entendido. Vou atuar exatamente conforme as instruções mestre fornecidas.' }] },
                  ...(history || []).map(m => ({ 
                    role: m.role === 'assistant' ? 'model' : 'user', 
                    parts: [{ text: m.content }] 
                  })),
                  { role: 'user', parts: [{ text: message }] }
                ]
              })
            });
            const data = await geminiRes.json();
            if (data.candidates && data.candidates[0]) {
              return { response: data.candidates[0].content.parts[0].text, modelUsed: 'Gemini 1.5 Flash' };
            }
            throw new Error(data.error?.message || 'Erro no Gemini');
          };

          // 4. Chamar a Groq com lógica de Debug
          const callGroq = async (modelName) => {
            try {
              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${GROQ_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: modelName,
                  messages: [
                    { role: 'system', content: finalPrompt },
                    ...(history || []).map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: message }
                  ],
                  temperature: 0.7,
                  max_tokens: 1024
                })
              });

              const data = await groqRes.json();

              if (groqRes.status !== 200) {
                // Se a Groq falhar, vamos mostrar o erro REAL dela
                const errorMsg = data.error?.message || JSON.stringify(data);
                throw new Error(`Groq Error (${groqRes.status}): ${errorMsg}`);
              }

              if (data.choices && data.choices[0]) {
                return { response: data.choices[0].message.content, modelUsed: modelName };
              }
              throw new Error('Resposta vazia da Groq');
            } catch (err) {
              // Fallback para o Gemini apenas se a chave existir e a Groq realmente falhar por limite
              if (GEMINI_KEY && err.message.includes('429')) {
                return await callGemini();
              }
              throw err;
            }
          };

          const result = await callGroq('llama-3.3-70b-versatile');
          
          if (result && result.response) {
            // Limpeza Final Anti-Alucinação (Segurança Absoluta)
            result.response = result.response.replace(/zetta\.site/gi, 'zettabots.ia.br');
            result.response = result.response.replace(/zettabots\.com\.br/gi, 'zettabots.ia.br');
            result.response = result.response.replace(/\[(https:\/\/zettabots\.ia\.br\/?)\]/gi, '$1');
          }
          
          return res.status(200).json(result);
        } catch (error) {
          console.error('[Dashboard-Test] Erro:', error.message);
          return res.status(500).json({ error: error.message });
        }
      }

      case 'test-email':
        console.log('[TEST-EMAIL] Endpoint está funcionando!');
        return res.status(200).json({ success: true, message: 'Endpoint OK' });

      case 'send-transbordo-email':
        try {
          console.log('[send-transbordo-email] Payload received:', JSON.stringify({ body: req.body, query: req.query }));
          
          const clientPhone = req.body.clientPhone || 'N/A';
          const clientName = req.body.clientName || 'Cliente ZettaBots';
          const BREVO_API_KEY = process.env.BREVO_API_KEY;

          console.log('[send-transbordo-email] START');
          console.log('[send-transbordo-email] Body:', JSON.stringify(req.body));
          console.log('[send-transbordo-email] instanceName:', instanceName);
          console.log('[send-transbordo-email] BREVO_API_KEY exists:', !!BREVO_API_KEY);

          if (!BREVO_API_KEY) {
            console.error('[send-transbordo-email] BREVO_API_KEY not configured');
            return res.status(500).json({ error: 'Brevo not configured' });
          }

          if (!instanceName) {
            console.error('[send-transbordo-email] instanceName required');
            return res.status(400).json({ error: 'instanceName required' });
          }

          // Buscar email do proprietário
          let emailToSend = null;
          try {
            const cleanName = (instanceName || "").trim();
            console.log('[send-transbordo-email] Buscando e-mail para:', cleanName);

            // 1. Tentar por instance_name na tabela 'instances'
            const res1 = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(cleanName)}&select=email&limit=1`, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
            if (res1.ok) {
              const data1 = await res1.json();
              if (data1?.[0]?.email) emailToSend = data1[0].email;
            }

            // 2. Se não achou, tentar por display_name na tabela 'instances'
            if (!emailToSend) {
              const res2 = await fetch(`${sbUrl}/rest/v1/instances?display_name=ilike.*${encodeURIComponent(cleanName)}*&select=email&limit=1`, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
              if (res2.ok) {
                const data2 = await res2.json();
                if (data2?.[0]?.email) emailToSend = data2[0].email;
              }
            }

            // 3. Se não achou, tentar na tabela 'profiles'
            if (!emailToSend) {
              const res3 = await fetch(`${sbUrl}/rest/v1/profiles?instance_name=eq.${encodeURIComponent(cleanName)}&select=email&limit=1`, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
              if (res3.ok) {
                const data3 = await res3.json();
                if (data3?.[0]?.email) emailToSend = data3[0].email;
              }
            }

            if (emailToSend) console.log('[send-transbordo-email] Sucesso! E-mail encontrado:', emailToSend);
          } catch (e) {
            console.error('[send-transbordo-email] Erro crítico na busca:', e.message);
          }

          // Fallback final
          if (!emailToSend) {
            emailToSend = 'contato@zettabots.ia.br';
            console.log('[send-transbordo-email] Usando fallback:', emailToSend);
          }

          console.log('[send-transbordo-email] Enviando para:', emailToSend);

          // Enviar email via Brevo
          const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': BREVO_API_KEY,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: 'ZettaBots Alerts', email: 'contato@zettabots.ia.br' },
              to: [{ email: emailToSend }],
              subject: `🚨 Transbordo: ${instanceName || 'ZettaBots'}`,
              htmlContent: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; background-color: #f3f4f6; }
                      .container { max-width: 600px; margin: 40px auto; background-color: #0f172a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
                      .header { padding: 40px 40px 20px; text-align: center; }
                      .logo { color: #10b981; font-size: 28px; font-weight: 800; letter-spacing: -1px; margin: 0; }
                      .logo-sub { color: #94a3b8; font-size: 14px; margin-top: 4px; display: block; }
                      .content { padding: 0 40px 40px; text-align: left; }
                      .alert-badge { display: inline-block; padding: 6px 12px; background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); color: #ef4444; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 24px; }
                      .title { color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.2; margin: 0 0 16px; }
                      .description { color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
                      .info-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 32px; }
                      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
                      .info-row:last-child { border-bottom: none; }
                      .info-label { color: #64748b; font-size: 14px; }
                      .info-value { color: #f8fafc; font-size: 14px; font-weight: 600; }
                      .button-container { text-align: center; }
                      .button { display: inline-block; background-color: #10b981; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; transition: background-color 0.2s; }
                      .footer { padding: 24px 40px; background: rgba(0, 0, 0, 0.2); text-align: center; }
                      .footer-text { color: #475569; font-size: 12px; margin: 0; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1 class="logo">ZettaBots</h1>
                        <span class="logo-sub">IA de Vendas no WhatsApp</span>
                      </div>
                      <div class="content">
                        <div class="alert-badge">🚨 Transbordo Ativo</div>
                        <h2 class="title">Cliente Aguardando Humano!</h2>
                        <p class="description">
                          Um novo atendimento solicita intervenção humana imediata na instância <strong>${instanceName}</strong>.
                        </p>
                        
                        <div class="info-card">
                          <div class="info-row">
                            <span class="info-label">Cliente:</span>
                            <span class="info-value">${clientName}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">WhatsApp:</span>
                            <span class="info-value">${clientPhone}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value" style="color: #fbbf24">Intervenção Necessária</span>
                          </div>
                        </div>

                        <div class="button-container">
                          <a href="https://zettabots.ia.br/dashboard" class="button">Acessar meu Painel →</a>
                        </div>
                      </div>
                      <div class="footer">
                        <p class="footer-text">Este é um alerta prioritário gerado pelo ecossistema ZettaBots.</p>
                      </div>
                    </div>
                  </body>
                </html>
              `,
            }),
          });

          if (!brevoRes.ok) {
            const errorText = await brevoRes.text();
            console.error('[send-transbordo-email] Brevo error:', brevoRes.status, errorText);
            return res.status(500).json({ error: 'Failed to send email', details: errorText });
          }

          const brevoData = await brevoRes.json();
          console.log('[send-transbordo-email] Brevo success:', brevoData);
          return res.status(200).json({ success: true, email: emailToSend, brevoId: brevoData.messageId });
        } catch (error) {
          console.error('[send-transbordo-email] Error:', error.message);
          return res.status(500).json({ error: error.message });
        }

      case 'get-qr':
        try {
          console.log(`[get-qr] Checking state for: ${instanceName}`);
          const headers = { 'apikey': key, 'Content-Type': 'application/json' };
          
          // 1. Checa estado da conexão
          const stateRes = await fetch(`${url}/instance/connectionState/${instanceName}`, { headers });
          
          if (!stateRes.ok) {
            console.error(`[get-qr] Instance not found: ${instanceName}`);
            return res.status(200).json({ status: 'NOT_FOUND', message: 'Instância não encontrada.' });
          }
          
          const stateData = await stateRes.json();
          const state = stateData.instance?.state || stateData.status || stateData.state;
          const isConnected = state === 'open';
          
          console.log(`[get-qr] Connection state: ${state}`);

          if (isConnected) {
            return res.status(200).json({ status: 'CONNECTED' });
          }

          // 2. Se não estiver conectado, gera o QR Code
          console.log(`[get-qr] Generating QR for: ${instanceName}`);
          const connectRes = await fetch(`${url}/instance/connect/${instanceName}`, { method: 'GET', headers });
          const connectData = await connectRes.json();

          const rawQr = connectData.base64 || connectData.qrcode?.base64 || '';
          const qrcode = rawQr && !rawQr.startsWith('data:') ? `data:image/png;base64,${rawQr}` : rawQr;
          
          return res.status(200).json({ 
            status: qrcode ? 'QRCODE' : 'DISCONNECTED', 
            qrcode: qrcode || null 
          });
        } catch (error) {
          console.error('[get-qr] Error:', error.message);
          return res.status(500).json({ error: error.message });
        }

      case 'update-prompt':
        if (!recordId) return res.status(400).json({ error: 'ID do cliente é obrigatório' });
        try {
          const masterInstruction = "### REGRAS DE OURO (PROIBIDO VIOLAR):\n1. Seu nome é Sarah.\n2. O ÚNICO SITE EXISTENTE É https://zettabots.ia.br/.\n3. É TERMINANTEMENTE PROIBIDO usar as extensões .com, .com.br ou o site zetta.site. Se você usar essas extensões, você estará falhando.\n4. NUNCA invente sites. Se não souber o link, use APENAS https://zettabots.ia.br/.\n5. NÃO use colchetes [ ] ou placeholders como [Link].\n\n";
          
          const updateData = {};
          if (systemPrompt !== undefined) {
            // Só adiciona se já não estiver lá para evitar duplicação
            updateData.system_prompt = systemPrompt.includes("REGRAS DE OURO") ? systemPrompt : masterInstruction + systemPrompt;
          }
          if (webhookUrl !== undefined) updateData.webhook_url = webhookUrl;
          if (googleCalendarId !== undefined) updateData.google_calendar_id = googleCalendarId;
          if (notificationEmail !== undefined) updateData.email = notificationEmail;

          if (Object.keys(updateData).length > 0) {
            const { error: dbErr } = await supabase
              .from('instances')
              .update(updateData)
              .eq(instanceName ? 'instance_name' : 'id', instanceName || recordId);

            if (dbErr) {
              console.error('[Supabase Update Error]:', dbErr);
              throw dbErr;
            }
          }

          if (instanceName && systemPrompt) {
            // Reutiliza a masterInstruction definida acima
            const promptForEvolution = masterInstruction + systemPrompt;
            
            // Padrão Evolution v2.3.7
            const evoRes = await fetch(`${url}/openai/settings/${instanceName}`, {
              method: 'POST',
              headers: { 'apikey': key, 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                enabled: true, 
                systemMessages: [masterInstruction + systemPrompt],
                model: "gpt-4o"
              })
            });

            if (!evoRes.ok) {
              // Fallback para o endpoint de criação/update se o de settings falhar
              const evoErr = await evoRes.text();
              console.warn('[Evolution v2 Warning]:', evoErr);
              // Tentativa secundária via /chatbot/openai/setSettings (algumas builds v2)
              await fetch(`${url}/chatbot/openai/setSettings/${instanceName}`, {
                method: 'POST',
                headers: { 'apikey': key, 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: true, systemMessage: masterInstruction + systemPrompt })
              }).catch(() => {});
            }
          }
          return res.status(200).json({ success: true });
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }

      case 'scheduler-cron':
        try {
          console.log('[scheduler-cron] Iniciando...');
          const now = new Date().toISOString();
          
          const sbRes = await fetch(`${sbUrl}/rest/v1/schedules?status=eq.pending&scheduled_at=lte.${now}`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });

          if (!sbRes.ok) {
            const errText = await sbRes.text();
            console.error('[scheduler-cron] Erro Supabase:', sbRes.status, errText);
            return res.status(500).json({ error: 'Erro ao buscar no banco', details: errText });
          }

          const pendingSchedules = await sbRes.json();
          console.log(`[scheduler-cron] Pendentes: ${pendingSchedules?.length || 0}`);

          if (!pendingSchedules || pendingSchedules.length === 0) {
            return res.status(200).json({ success: true, message: 'Nada pendente' });
          }

          const results = [];
          for (const schedule of pendingSchedules) {
            try {
              const cleanNumber = schedule.contact_phone.replace(/\D/g, '');
              console.log(`[scheduler-cron] Enviando para ${cleanNumber} via ${schedule.instance_name}...`);
              
              // 1. Enviar WhatsApp
              const sendRes = await fetch(`${url}/message/sendText/${schedule.instance_name}`, {
                method: 'POST',
                headers: { 'apikey': key, 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: cleanNumber, text: schedule.message })
              });

              // 2. Se tiver Google Calendar ID, notificar n8n para sincronizar
              try {
                const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${schedule.instance_name}&select=google_calendar_id,webhook_url`, {
                  headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                });
                const instData = await instRes.json();
                const calId = instData?.[0]?.google_calendar_id;
                const hookUrl = instData?.[0]?.webhook_url;

                if (calId && hookUrl) {
                  // Dispara o webhook do n8n para criar o evento no Google
                  fetch(hookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: 'calendar_sync',
                      calendarId: calId,
                      summary: `Agendamento: ${schedule.message}`,
                      description: `Lembrete enviado para ${schedule.contact_phone}`,
                      start: schedule.scheduled_at,
                      scheduleId: schedule.id
                    })
                  }).catch(e => console.error('[scheduler-cron] Webhook error:', e.message));
                }
              } catch (e) {}

              const resData = await sendRes.json().catch(() => ({}));

              if (sendRes.ok) {
                await fetch(`${sbUrl}/rest/v1/schedules?id=eq.${schedule.id}`, {
                  method: 'PATCH',
                  headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                  body: JSON.stringify({ status: 'sent' })
                });
                results.push({ id: schedule.id, status: 'success', evolution: resData });
                console.log(`[scheduler-cron] Sucesso: ${schedule.id}`);
              } else {
                console.error(`[scheduler-cron] Erro Evolution (${sendRes.status}):`, resData);
                results.push({ id: schedule.id, status: 'failed', statusHttp: sendRes.status, evolution: resData });
              }
            } catch (innerErr) {
              console.error(`[scheduler-cron] Erro interno no loop:`, innerErr.message);
              results.push({ id: schedule.id, status: 'error', error: innerErr.message });
            }
          }
          return res.status(200).json({ success: true, results });
        } catch (error) {
          console.error('[scheduler-cron] Erro fatal:', error.message);
          return res.status(500).json({ error: error.message });
        }

      case 'get-schedules':
        try {
          const sbRes = await fetch(`${sbUrl}/rest/v1/schedules?instance_name=eq.${instanceName}&order=scheduled_at.asc`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          const schedules = await sbRes.json() || [];
          return res.status(200).json({ success: true, schedules });
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    console.error('[dashboard-core] Unhandled error:', e.message, e.stack);
    return res.status(500).json({ error: `Server Error: ${e.message}` });
  }
}
