// Chamado pelo dashboard quando o usuário retorna do MP com ?plano=X&status=aprovado
// Busca a assinatura ativa no MP pelo e-mail e vincula ao perfil no Supabase
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'userId e email são obrigatórios' });

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const PLAN_MAP = {
    [process.env.MP_PLAN_ID_START]: 'start',
    [process.env.MP_PLAN_ID_PRO]: 'pro',
    [process.env.MP_PLAN_ID_ENTERPRISE]: 'enterprise',
  };

  try {
    // Busca assinaturas ativas para o e-mail no MP
    const searchRes = await fetch(
      `https://api.mercadopago.com/preapproval/search?payer_email=${encodeURIComponent(email)}&status=authorized&limit=1`,
      { headers: { Authorization: `Bearer ${mpToken}` } }
    );
    const searchData = await searchRes.json();
    const sub = searchData.results?.[0];

    if (!sub) {
      return res.status(404).json({ error: 'Nenhuma assinatura ativa encontrada para este e-mail' });
    }

    const planType = PLAN_MAP[sub.preapproval_plan_id];
    if (!planType) {
      return res.status(400).json({ error: 'Plano desconhecido' });
    }

    // Atualiza o perfil no Supabase
    const updateRes = await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        mercadopago_subscription_id: sub.id,
        mercadopago_payer_id: String(sub.payer_id || ''),
        // plan_type permanece 'trial' — muda para o plano real após o 1º pagamento
      }),
    });

    const updatedProfile = await updateRes.json();
    console.log(`✅ Subscription ${sub.id} vinculada ao user ${userId} (plano ${planType})`);

    return res.status(200).json({
      success: true,
      plan: planType,
      subscription_id: sub.id,
      trial_end: sub.auto_recurring?.free_trial
        ? new Date(sub.date_created).toISOString()
        : null,
      profile: updatedProfile?.[0] || null,
    });
  } catch (err) {
    console.error('❌ link-subscription error:', err.message);
    return res.status(500).json({ error: 'Erro interno ao vincular assinatura' });
  }
}
