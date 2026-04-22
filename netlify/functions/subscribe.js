export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY
  const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '2')
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured')
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuração incompleta' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Payload inválido' }) }
  }

  const { name, email, phone, segment } = body
  if (!name || !email || !phone || !segment) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Dados incompletos' }) }
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  try {
    const [firstName, ...rest] = name.trim().split(' ')
    const lastName = rest.join(' ')

    // Add/update contact in Brevo
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
          ORIGEM: 'Landing Page',
        },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    })

    // 201 = criado, 204 = atualizado — ambos são sucesso
    if (!contactRes.ok && contactRes.status !== 204) {
      const errBody = await contactRes.json().catch(() => ({}))
      console.error('Brevo contacts error:', contactRes.status, JSON.stringify(errBody))
      throw new Error(errBody.message || `Brevo error: ${contactRes.status}`)
    }

    console.log('Contact saved. List ID used:', BREVO_LIST_ID)

    // Envia notificação por e-mail para o admin (se NOTIFY_EMAIL configurado)
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Subscribe function error:', err.message)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao processar cadastro. Tente novamente.' }),
    }
  }
}
