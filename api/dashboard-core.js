export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, instanceName, remoteJid, recordId, email, name, payment_method, amount, planName } = req.body;
  const planPrice = parseFloat(amount || 247);
  const planLabel = planName || 'Pro';
  
  // Ações que não precisam de instanceName obrigatoriamente
  const isAdminAction = ['get-admin-stats', 'get-all-instances', 'admin-extend', 'admin-toggle-status', 'list-instances', 'create-payment', 'create-checkout'].includes(action);
  
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
                email: (email && email.includes('@')) ? email : 'cliente@zettabots.com.br',
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
                email: (email && email.includes('@')) ? email : 'cliente@zettabots.com.br'
              },
              external_reference: String(recordId),
              back_urls: {
                success: 'https://zettabots.com.br/dashboard?status=success',
                failure: 'https://zettabots.com.br/dashboard?status=failure',
                pending: 'https://zettabots.com.br/dashboard?status=pending'
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


          return res.status(200).json({
            success: true,
            chats: raw.slice(0, 20).map(c => ({
              id: c.id || c.remoteJid,
              remoteJid: c.remoteJid || c.id,
              user: c.name || c.pushName || (c.remoteJid ? c.remoteJid.split('@')[0] : (c.id ? c.id.split('@')[0] : 'Cliente')),
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

            return {
              id: m.key?.id,
              text,
              type,
              mimetype,
              fromMe: m.key?.fromMe,
              time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
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

      case 'get-admin-stats': {
        try {
          console.log('[ADMIN-STATS] Request received', req.body);
          const { email: adminEmail } = req.body;
          console.log('[ADMIN-STATS] Admin email:', adminEmail);

          // TODO: Enable this validation after testing
          // if (adminEmail !== 'richardrovigati@gmail.com') return res.status(403).json({ error: 'Acesso negado' });

          // Manual mapping of instance IDs to display names
          const instanceDisplayNames = {
            'zbab2f7c272336': 'Atlas da Fé',
            'ZettaBots': 'ZettaBots'
          };

          // Fetch clients from Supabase
          const profRes = await fetch(
            `${sbUrl}/rest/v1/profiles?select=id,email,full_name,instance_name,plan_type,is_active,plan_expires_at,mercadopago_subscription_id&order=created_at.desc`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
          );
          let clients = await profRes.json() || [];
          console.log('[ADMIN-STATS] Clients from Supabase:', clients.length, clients.slice(0, 1));

          // Enrich clients with display names using the mapping
          clients = clients.map(client => {
            const instanceName = String(client.instance_name || '').trim();
            const mapped = instanceDisplayNames[instanceName];
            const bot_name = `DEBUG: instance="${instanceName}" | mapped="${mapped}" | fallback="${client.instance_name}"`;
            console.log('[ADMIN-STATS]', { instanceName, mapped, keys: Object.keys(instanceDisplayNames) });
            return { ...client, bot_name };
          });

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

          // 1. Buscar base de conhecimento (RAG)
          let knowledgeBase = '';
          const { data: kbData } = await fetch(
            `${sbUrl}/rest/v1/knowledge_base?instance_name=eq.${encodeURIComponent(instanceName)}&status=eq.active&select=extracted_text`,
            { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
          ).then(r => r.json()).catch(() => ({ data: [] }));
          
          if (Array.isArray(kbData) && kbData.length > 0) {
            knowledgeBase = kbData.map(item => item.extracted_text).join('\n---\n');
          }

          // 2. Montar o Contexto Final
          let finalPrompt = systemPrompt || 'Você é a Sarah, assistente virtual da ZettaBots.';
          if (knowledgeBase) {
            finalPrompt += '\n\nBASE DE CONHECIMENTO (Use estes dados para responder):\n' + knowledgeBase;
          }

          // 3. Chamar a Groq com lógica de Retry e Fallback
          const callGroq = async (modelName, attempt = 1) => {
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

              // Se for erro de Rate Limit (429) e tivermos tentativas
              if (groqRes.status === 429 && attempt <= 3) {
                const waitTime = attempt * 2000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                const nextModel = attempt === 3 ? 'llama-3.1-8b-instant' : modelName;
                return callGroq(nextModel, attempt + 1);
              }

              if (data.choices && data.choices[0]) {
                return { response: data.choices[0].message.content, modelUsed: modelName };
              } else {
                throw new Error(data.error?.message || 'Erro na resposta da Groq');
              }
            } catch (err) {
              if (attempt <= 2) return callGroq(modelName, attempt + 1);
              throw err;
            }
          };

          const result = await callGroq('llama-3.3-70b-versatile');
          return res.status(200).json(result);
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    console.error('[dashboard-core] Unhandled error:', e.message, e.stack);
    return res.status(500).json({ error: `Server Error: ${e.message}` });
  }
}
