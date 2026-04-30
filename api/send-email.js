export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  const { clientPhone, clientName, instanceName } = req.body;
  
  console.log('[send-email] Recebido:', { clientPhone, clientName, instanceName });

  if (!BREVO_API_KEY) {
    console.error('[send-email] BREVO_API_KEY não configurada');
    return res.status(500).json({ error: 'Brevo not configured' });
  }

  // Buscar email do proprietário (Lógica Premium Robusta)
  let emailToSend = null;
  try {
    const cleanName = (instanceName || "").trim();
    
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
  } catch (e) {
    console.error('[send-email] Erro na busca de proprietário:', e.message);
  }

  // Fallback se não encontrar
  if (!emailToSend) {
    emailToSend = 'contato@zettabots.ia.br';
    console.log('[send-email] Usando fallback:', emailToSend);
  }

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
        subject: `🚨 Transbordo Ativo — ${clientName || 'Cliente'}`,
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
                    Um novo atendimento solicita intervenção humana imediata na instância <strong>${instanceName || 'ZettaBots'}</strong>.
                  </p>
                  
                  <div class="info-card">
                    <div class="info-row">
                      <span class="info-label">Cliente:</span>
                      <span class="info-value">${clientName || 'Cliente ZettaBots'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">WhatsApp:</span>
                      <span class="info-value">${clientPhone || 'N/A'}</span>
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
      console.error('[send-email] Brevo error:', brevoRes.status, errorText);
      return res.status(500).json({ error: 'Failed to send email', details: errorText });
    }

    console.log('[send-email] Email enviado com sucesso para:', emailToSend);
    return res.status(200).json({ success: true, email: emailToSend });
  } catch (error) {
    console.error('[send-email] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
