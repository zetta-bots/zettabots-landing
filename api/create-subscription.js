// Cria uma assinatura recorrente no Mercado Pago usando um plano pré-definido (preapproval_plan_id)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { planId, email, userId, name } = req.body;
  if (!planId || !email) return res.status(400).json({ error: 'planId e email são obrigatórios' });

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!mpToken) return res.status(500).json({ error: 'Mercado Pago não configurado' });

  const PLAN_NAMES = {
    [process.env.MP_PLAN_ID_START]: 'ZettaBots Start',
    [process.env.MP_PLAN_ID_PRO]: 'ZettaBots Pro',
    [process.env.MP_PLAN_ID_ENTERPRISE]: 'ZettaBots Enterprise',
  };

  if (!PLAN_NAMES[planId]) return res.status(400).json({ error: 'Plano inválido' });

  try {
    const subRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preapproval_plan_id: planId,
        payer_email: email,
        external_reference: userId || '',
        back_url: 'https://zettabots.ia.br/dashboard?plano=ativo',
        reason: PLAN_NAMES[planId],
      }),
    });

    const sub = await subRes.json();

    if (sub.init_point) {
      return res.status(200).json({
        success: true,
        init_point: sub.init_point,
        subscription_id: sub.id,
      });
    }

    console.error('[create-subscription] MP error:', JSON.stringify(sub));
    return res.status(400).json({ error: 'Falha ao criar assinatura', details: sub });
  } catch (err) {
    console.error('[create-subscription]', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
