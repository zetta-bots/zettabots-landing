export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientPhone, clientName, instanceName } = req.body;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  console.log('[send-email] Recebido:', { clientPhone, clientName, instanceName });
  console.log('[send-email] BREVO_API_KEY existe:', !!BREVO_API_KEY);

  if (!BREVO_API_KEY) {
    console.error('[send-email] BREVO_API_KEY não configurada');
    return res.status(500).json({ error: 'Brevo not configured' });
  }

  const emailToSend = 'contato@zettabots.ia.br';

  try {
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
        subject: `Transbordo Ativo — ${clientName}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
            <h2 style="color:#dc2626;margin-top:0">Cliente Solicita Atendimento Humano</h2>
            <p style="color:#374151;line-height:1.6">Um cliente está aguardando atendimento.</p>
            <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#fff;border-radius:8px;overflow:hidden">
              <tr style="background:#f3f4f6">
                <td style="padding:12px;color:#666;font-weight:600">Cliente</td>
                <td style="padding:12px"><strong>${clientName}</strong></td>
              </tr>
              <tr>
                <td style="padding:12px;color:#666;font-weight:600">WhatsApp</td>
                <td style="padding:12px"><strong>${clientPhone}</strong></td>
              </tr>
            </table>
            <a href="https://zettabots.ia.br/dashboard" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Ir para o Painel</a>
          </div>
        `,
      }),
    });

    if (!brevoRes.ok) {
      const errorText = await brevoRes.text();
      console.error('[send-email] Brevo error:', brevoRes.status, errorText);
      return res.status(500).json({ error: 'Failed to send email', details: errorText });
    }

    console.log('[send-email] Email enviado com sucesso!');
    return res.status(200).json({ success: true, email: emailToSend });
  } catch (error) {
    console.error('[send-email] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
