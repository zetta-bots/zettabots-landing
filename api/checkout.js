export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  let { recordId, email, name, payment_method = 'pix', instanceName } = req.body;
  
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  const sbUrl = process.env.VITE_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!mpToken) return res.status(500).json({ error: 'Mercado Pago token not configured' });

  try {
    // Busca o recordId no Supabase se ele não veio no body (para sessões antigas)
    if (!recordId && (email || instanceName)) {
      const filter = email ? `email=eq.${email}` : `instance_name=eq.${instanceName}`;
      const sbRes = await fetch(`${sbUrl}/rest/v1/instances?${filter}&select=id`, {
        headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
      });
      const sbData = await sbRes.json();
      if (sbData && sbData.length > 0) {
        recordId = sbData[0].id;
      }
    }

    if (!recordId) return res.status(400).json({ error: 'Identificador do cliente não encontrado. Por favor, faça login novamente.' });

    if (payment_method === 'pix') {
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${recordId}-${Date.now()}`
        },
        body: JSON.stringify({
          transaction_amount: 247.00,
          description: 'Assinatura ZettaBots Pro (30 dias)',
          payment_method_id: 'pix',
          payer: {
            email: email || 'contato@zettabots.com',
            first_name: name || 'Cliente ZettaBots'
          },
          external_reference: recordId
        })
      });

      const data = await response.json();

      if (data.status === 'pending' && data.point_of_interaction) {
        return res.status(200).json({
          success: true,
          qr_code: data.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
          payment_id: data.id
        });
      } else {
        return res.status(400).json({ error: 'Falha ao gerar PIX', details: data });
      }
    } else {
      // Lógica para Cartão de Crédito (Checkout Pro Preference)
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              title: 'Assinatura ZettaBots Pro (30 dias)',
              quantity: 1,
              unit_price: 247.00,
              currency_id: 'BRL'
            }
          ],
          external_reference: recordId,
          notification_url: 'https://zettabots.ia.br/api/webhook-billing',
          back_urls: {
            success: 'https://zettabots.ia.br/dashboard',
            failure: 'https://zettabots.ia.br/dashboard',
            pending: 'https://zettabots.ia.br/dashboard'
          },
          auto_return: 'approved'
        })
      });

      const data = await response.json();
      if (data.init_point) {
        return res.status(200).json({ success: true, init_point: data.init_point });
      } else {
        return res.status(400).json({ error: 'Falha ao gerar link de cartão', details: data });
      }
    }
  } catch (err) {
    console.error('[Checkout Error]', err);
    return res.status(500).json({ 
      error: 'Erro ao processar pagamento.', 
      details: err.message 
    });
  }
}
