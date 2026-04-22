export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, data } = req.body
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  // O Mercado Pago envia várias notificações, só queremos a de pagamento
  if (action !== 'payment.created' && req.query.type !== 'payment') {
    return res.status(200).json({ received: true })
  }

  const paymentId = data?.id || req.query['data.id']

  try {
    // 1. Consultar os detalhes do pagamento no Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    })
    const paymentData = await mpRes.json()

    // 2. Se o pagamento estiver aprovado
    if (paymentData.status === 'approved') {
      const recordId = paymentData.external_reference // Lembra que salvamos o ID do Airtable aqui?

      if (recordId) {
        // Calcular nova data de validade (+30 dias)
        const nextBilling = new Date()
        nextBilling.setDate(nextBilling.getDate() + 30)
        const trialEndDate = nextBilling.toISOString().split('T')[0]

        // 3. Atualizar o Airtable
        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              status: 'pago',
              trialEndDate: trialEndDate
            }
          })
        })
        
        console.log(`Pagamento aprovado para o record ${recordId}. Status atualizado no Airtable.`)
      }
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro no webhook-mp:', error)
    return res.status(500).json({ error: 'Erro interno' })
  }
}
