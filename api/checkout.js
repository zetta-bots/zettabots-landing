export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { recordId, email, name, payment_method = 'pix' } = req.body;
  if (!recordId) return res.status(400).json({ error: 'Missing recordId' });

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!mpToken) return res.status(500).json({ error: 'Mercado Pago token not configured in .env' });

  try {
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
          notification_url: 'https://zettabots-landing.vercel.app/api/webhook-billing',
          back_urls: {
            success: 'https://zettabots-landing.vercel.app/dashboard',
            failure: 'https://zettabots-landing.vercel.app/dashboard',
            pending: 'https://zettabots-landing.vercel.app/dashboard'
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
    return res.status(500).json({ error: 'Internal error calling Mercado Pago' });
  }
}
