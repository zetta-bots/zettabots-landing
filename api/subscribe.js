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
    console.log('📝 SB_URL:', !!SB_URL, 'SB_KEY:', !!SB_KEY)

    if (SB_URL && SB_KEY) {
      try {
        console.log('🔐 Criando usuário em Supabase Auth para:', email)
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

        const authText = await authRes.text()
        console.log('Auth response status:', authRes.status, 'body:', authText.substring(0, 200))

        if (authRes.ok) {
          const userData = JSON.parse(authText)
          userId = userData.id || userData.user?.id
          console.log('✅ Usuário criado em Auth:', userId)

          // Criar profile
          console.log('📝 Criando profile...')
          const profileRes = await fetch(`${SB_URL}/rest/v1/profiles`, {
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
              email: email,
              whatsapp_number: phone,
              segment: segment,
              company_name: businessName,
              plan_type: 'trial',
              is_active: true,
              created_at: new Date().toISOString(),
            }),
          })

          if (profileRes.ok) {
            console.log('✅ Profile criado:', userId)
          } else {
            console.error('❌ Erro ao criar profile:', profileRes.status, await profileRes.text())
          }
        } else if (authRes.status === 422) {
          // Email já existe — busca o userId para poder re-triggar o onboarding se necessário
          console.log('⚠️ Email já cadastrado, buscando userId existente:', email)
          try {
            const listRes = await fetch(`${SB_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
              headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
            })
            if (listRes.ok) {
              const listData = await listRes.json()
              const existingUser = listData.users?.[0]
              if (existingUser) {
                userId = existingUser.id
                console.log('✅ UserId existente encontrado:', userId)
              }
            }
          } catch (lookupErr) {
            console.error('Erro ao buscar usuário existente:', lookupErr.message)
          }
        } else {
          console.error('❌ Erro ao criar usuário Supabase:', authRes.status, authText.substring(0, 300))
        }
      } catch (sbErr) {
        console.error('❌ Erro Supabase:', sbErr.message)
      }
    } else {
      console.error('⚠️ Supabase não configurado: SB_URL=' + !!SB_URL + ', SB_KEY=' + !!SB_KEY)
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
      // Verifica se já tem instância ativa para não re-provisionar
      let hasInstance = false
      if (SB_URL && SB_KEY) {
        try {
          const profileCheck = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userId}&select=instance_name`, {
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
          })
          const profileData = await profileCheck.json()
          hasInstance = !!(profileData?.[0]?.instance_name)
        } catch {}
      }
      if (!hasInstance) {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name, email, phone, segment, businessName, planType: 'trial' }),
        }).catch((err) => console.error('N8N webhook failed:', err))
      } else {
        console.log('⚠️ Usuário já tem instância, n8n não re-trigado:', userId)
        return res.status(409).json({ error: 'Este email já está cadastrado. Acesse o painel para fazer login.', redirect: '/login' })
      }
    }

    return res.status(200).json({ success: true, userId })
  } catch (err) {
    console.error('Subscribe function error:', err.message)
    return res.status(500).json({ error: 'Erro ao processar cadastro. Tente novamente.' })
  }
}
