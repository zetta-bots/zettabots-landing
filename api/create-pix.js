export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recordId, email, amount = 247.00 } = req.body
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Token do Mercado Pago não configurado' })
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${recordId}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: "Assinatura ZettaBots Pro",
        payment_method_id: "pix",
        payer: {
          email: email || "cliente@email.com",
          identification: {
            type: "CPF",
            number: "00000000000"
          }
        },
        external_reference: recordId
      })
    })

    const data = await response.json()
    
    if (data.status === 'rejected') {
      return res.status(400).json({ error: 'Pagamento rejeitado', details: data.status_detail })
    }

    return res.status(200).json({
      id: data.id,
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
      status: data.status
    })
  } catch (error) {
    console.error('Erro ao criar PIX:', error)
    return res.status(500).json({ error: 'Erro ao gerar PIX' })
  }
}
