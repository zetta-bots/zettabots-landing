export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { recordId, email, name } = req.body;
  if (!recordId) return res.status(400).json({ error: 'Missing recordId' });

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!mpToken) return res.status(500).json({ error: 'Mercado Pago token not configured in .env' });

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${recordId}-${Date.now()}` // Evita cobrança duplicada
      },
      body: JSON.stringify({
        transaction_amount: 97.00,
        description: 'Assinatura ZettaBots Pro (30 dias)',
        payment_method_id: 'pix',
        payer: {
          email: email || 'contato@zettabots.com',
          first_name: name || 'Cliente ZettaBots'
        },
        external_reference: recordId // Super importante: Vincula o pagamento ao banco Supabase
      })
    });

    const data = await response.json();

    if (data.status === 'pending' && data.point_of_interaction) {
      return res.status(200).json({
        success: true,
        qr_code: data.point_of_interaction.transaction_data.qr_code, // Copia e Cola
        qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64, // Imagem
        payment_id: data.id
      });
    } else {
      return res.status(400).json({ error: 'Falha ao gerar PIX', details: data });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal error calling Mercado Pago' });
  }
}
