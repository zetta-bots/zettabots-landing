export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recordId, phone, email } = req.body
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Token do Mercado Pago não configurado' })
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: "plano-pro",
            title: "Assinatura Mensal ZettaBots - Plano Pro",
            quantity: 1,
            unit_price: 247.00,
            currency_id: "BRL"
          }
        ],
        payer: {
          email: email || "cliente@email.com",
          identification: {
            type: "CPF",
            number: "00000000000"
          }
        },
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" } // Remove boleto se preferir apenas Cartão/PIX
          ],
          installments: 12
        },
        back_urls: {
          success: `${req.headers.origin || 'https://zettabots.ia.br'}/dashboard?payment=success`,
          failure: `${req.headers.origin || 'https://zettabots.ia.br'}/dashboard?payment=failure`,
          pending: `${req.headers.origin || 'https://zettabots.ia.br'}/dashboard?payment=pending`
        },
        auto_return: "approved",
        external_reference: recordId
      })
    })

    const data = await response.json()
    return res.status(200).json({ init_point: data.init_point })
  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return res.status(500).json({ error: 'Erro ao gerar link de pagamento' })
  }
}
