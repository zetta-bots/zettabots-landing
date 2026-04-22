export default async function handler(req, res) {
  // Retorna 200 rapidamente para o Mercado Pago não reenviar
  res.status(200).json({ received: true });

  if (req.method !== 'POST') return;

  const body = req.body;
  console.log('💰 Webhook Mercado Pago Recebido:', JSON.stringify(body));

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  // Mercado Pago envia notificações de pagamento no formato action=payment.created ou type=payment
  if ((body.action && body.action.includes('payment')) || body.type === 'payment') {
    const paymentId = body.data?.id;
    if (!paymentId) return;

    try {
      // 1. Confere o status real do pagamento na API do MP
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpToken}` }
      });
      const paymentData = await paymentRes.json();

      if (paymentData.status === 'approved') {
        const recordId = paymentData.external_reference; // Recupera o ID do Supabase
        
        if (recordId) {
          // 2. Atualiza no Supabase para PRO (+30 dias)
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          await fetch(`${sbUrl}/rest/v1/instances?id=eq.${recordId}`, {
            method: 'PATCH',
            headers: {
              'apikey': sbKey,
              'Authorization': `Bearer ${sbKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'pago',
              plan: 'ZettaBots Pro',
              next_billing: expiryDate.toISOString().split('T')[0]
            })
          });
          
          console.log(`✅ Upgrade PIX confirmado! Status de ${recordId} atualizado para PAGO.`);
        }
      }
    } catch(err) {
      console.error('❌ Erro no webhook do Mercado Pago:', err.message);
    }
  }
}
