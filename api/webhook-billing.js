export default async function handler(req, res) {
  // Responder imediatamente — MP reenvía se demorar mais de 5s
  res.status(200).json({ received: true });
  if (req.method !== 'POST') return;

  // Validar assinatura do webhook (garante que a requisição veio do MP)
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    const dataId = req.query?.['data.id'] || req.body?.data?.id;
    if (xSignature && xRequestId && dataId) {
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1]};`;
      const crypto = await import('crypto');
      const ts = xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1];
      const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1];
      const signed = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const hmac = crypto.createHmac('sha256', secret).update(signed).digest('hex');
      if (hmac !== v1) {
        console.warn('⚠️ Assinatura inválida — requisição ignorada');
        return;
      }
    }
  }

  const body = req.body;
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const PLAN_MAP = {
    [process.env.MP_PLAN_ID_START]: 'start',
    [process.env.MP_PLAN_ID_PRO]: 'pro',
    [process.env.MP_PLAN_ID_ENTERPRISE]: 'enterprise',
  };

  console.log('📩 Webhook MP:', body.type, body.action, JSON.stringify(body.data));

  try {
    // === ASSINATURA CRIADA / ALTERADA (com trial) ===
    if (body.type === 'subscription_preapproval') {
      const subId = body.data?.id;
      if (!subId) return;

      const sub = await mpGet(`https://api.mercadopago.com/preapproval/${subId}`, mpToken);
      const planType = PLAN_MAP[sub.preapproval_plan_id];

      if (!planType) {
        console.warn('⚠️ preapproval_plan_id desconhecido:', sub.preapproval_plan_id);
        return;
      }

      if (sub.status === 'authorized') {
        // Trial iniciado — vincula subscription_id ao perfil pelo e-mail
        // plan_type continua 'trial' até o primeiro pagamento processar
        await updateProfileByEmail(sbUrl, sbKey, sub.payer_email, {
          mercadopago_subscription_id: subId,
          mercadopago_payer_id: String(sub.payer_id || ''),
        });
        console.log(`✅ Trial iniciado: ${sub.payer_email} → plano ${planType}`);
      } else if (sub.status === 'cancelled') {
        await updateProfileBySubscriptionId(sbUrl, sbKey, subId, {
          plan_type: 'blocked',
          is_active: false,
        });
        console.log(`🚫 Assinatura cancelada: ${subId}`);
      }
      return;
    }

    // === PAGAMENTO DA ASSINATURA PROCESSADO (pós-trial ou renovação mensal) ===
    if (body.type === 'subscription_authorized_payment') {
      const authorizedId = body.data?.id;
      if (!authorizedId) return;

      const payment = await mpGet(`https://api.mercadopago.com/authorized_payments/${authorizedId}`, mpToken);

      if (payment.status === 'processed') {
        const subId = payment.preapproval_id;
        const sub = await mpGet(`https://api.mercadopago.com/preapproval/${subId}`, mpToken);
        const planType = PLAN_MAP[sub.preapproval_plan_id];
        if (!planType) return;

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await updateProfileBySubscriptionId(sbUrl, sbKey, subId, {
          plan_type: planType,
          plan_expires_at: expiresAt.toISOString(),
          is_active: true,
        });
        console.log(`✅ Plano ${planType} ativado via pagamento de assinatura ${subId}`);
      }
      return;
    }

    // === PAGAMENTO AVULSO (PIX ou cartão fora de assinatura) ===
    if (body.type === 'payment' || (body.action && body.action.includes('payment'))) {
      const paymentId = body.data?.id;
      if (!paymentId) return;

      const payment = await mpGet(`https://api.mercadopago.com/v1/payments/${paymentId}`, mpToken);

      if (payment.status === 'approved') {
        const userId = payment.external_reference;
        if (!userId) return;

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: supabaseHeaders(sbKey),
          body: JSON.stringify({
            plan_type: 'pro',
            plan_expires_at: expiresAt.toISOString(),
            is_active: true,
          }),
        });
        console.log(`✅ Pagamento avulso aprovado para user ${userId}`);
      }
      return;
    }
  } catch (err) {
    console.error('❌ Erro no webhook-billing:', err.message);
  }
}

async function mpGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

function supabaseHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
}

async function updateProfileByEmail(sbUrl, sbKey, email, fields) {
  if (!email) return;

  // Supabase Admin API — busca usuário pelo e-mail
  const res = await fetch(
    `${sbUrl}/auth/v1/admin/users?page=1&per_page=1&email=${encodeURIComponent(email)}`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  );
  const data = await res.json();
  const userId = data.users?.[0]?.id;

  if (!userId) {
    // Usuário ainda não cadastrou conta — o frontend vai vincular ao fazer login
    console.warn(`⚠️ Usuário sem conta ainda: ${email}. Será vinculado no login.`);
    return;
  }

  await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: supabaseHeaders(sbKey),
    body: JSON.stringify(fields),
  });
}

async function updateProfileBySubscriptionId(sbUrl, sbKey, subId, fields) {
  await fetch(`${sbUrl}/rest/v1/profiles?mercadopago_subscription_id=eq.${encodeURIComponent(subId)}`, {
    method: 'PATCH',
    headers: supabaseHeaders(sbKey),
    body: JSON.stringify(fields),
  });
}
