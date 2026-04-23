export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY
  const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '2')
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
  const SB_URL = process.env.VITE_SUPABASE_URL
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured')
    return res.status(500).json({ error: 'Configuração incompleta' })
  }

  const { name, email, phone, segment, businessName } = req.body
  if (!name || !email || !phone || !segment || !businessName) {
    return res.status(400).json({ error: 'Dados incompletos' })
  }

  try {
    const [firstName, ...rest] = name.trim().split(' ')
    const lastName = rest.join(' ')

    // Criar usuário em Supabase (Auth + Profile)
    let userId = null
    if (SB_URL && SB_KEY) {
      try {
        const authRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: Math.random().toString(36).slice(-12),
            email_confirm: true,
          }),
        })

        if (authRes.ok) {
          const userData = await authRes.json()
          userId = userData.user.id

          // Criar profile
          await fetch(`${SB_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': `Bearer ${SB_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              id: userId,
              full_name: name,
              whatsapp_number: phone,
              segment: segment,
              business_name: businessName,
              plan_type: 'trial',
              is_active: true,
              created_at: new Date().toISOString(),
            }),
          })
          console.log('✅ Usuário criado em Supabase:', userId)
        } else if (authRes.status === 422) {
          // Email já existe
          console.log('⚠️ Email já cadastrado em Supabase')
        } else {
          console.error('Erro ao criar usuário Supabase:', authRes.status)
        }
      } catch (sbErr) {
        console.error('Erro Supabase:', sbErr.message)
      }
    }

    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        attributes: {
          PHONE: phone,
          SEGMENTO: segment,
          EMPRESA: businessName,
          ORIGEM: 'Landing Page',
        },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    })

    if (!contactRes.ok && contactRes.status !== 204) {
      const errBody = await contactRes.json().catch(() => ({}))
      console.error('Brevo contacts error:', contactRes.status, JSON.stringify(errBody))
      return res.status(500).json({ error: 'Erro ao processar cadastro. Tente novamente.' })
    }

    console.log('Contact saved. List ID used:', BREVO_LIST_ID)

    if (NOTIFY_EMAIL) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'ZettaBots Leads', email: NOTIFY_EMAIL },
          to: [{ email: NOTIFY_EMAIL }],
          subject: `🚀 Novo lead — ${name}`,
          htmlContent: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#7c3aed">Novo lead no ZettaBots</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#666">Nome</td><td><strong>${name}</strong></td></tr>
                <tr><td style="padding:8px 0;color:#666">E-mail</td><td><strong>${email}</strong></td></tr>
                <tr><td style="padding:8px 0;color:#666">WhatsApp</td><td><strong>${phone}</strong></td></tr>
                <tr><td style="padding:8px 0;color:#666">Segmento</td><td><strong>${segment}</strong></td></tr>
              </table>
              <a href="https://wa.me/55${phone.replace(/\D/g, '')}"
                style="display:inline-block;margin-top:24px;padding:12px 24px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
                Abrir WhatsApp
              </a>
            </div>
          `,
        }),
      }).catch((err) => console.error('Notification email failed:', err))
    }

    // Disparar workflow n8n de boas-vindas (email + onboarding)
    if (N8N_WEBHOOK_URL && userId) {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, email, phone, segment, businessName, planType: 'trial' }),
      }).catch((err) => console.error('N8N webhook failed:', err))
    }

    return res.status(200).json({ success: true, userId })
  } catch (err) {
    console.error('Subscribe function error:', err.message)
    return res.status(500).json({ error: 'Erro ao processar cadastro. Tente novamente.' })
  }
}
