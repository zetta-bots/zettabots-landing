export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY
  const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '2')
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

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

    if (N8N_WEBHOOK_URL) {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, segment, businessName }),
      }).catch((err) => console.error('N8N webhook failed:', err))
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Subscribe function error:', err.message)
    return res.status(500).json({ error: 'Erro ao processar cadastro. Tente novamente.' })
  }
}
