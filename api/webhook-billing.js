export default async function handler(req, res) {
  // MP reenvía se não receber 200 em < 5s — responde imediatamente
  res.status(200).json({ received: true });
  if (req.method !== 'POST') return;

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    const dataId = req.query?.['data.id'] || req.body?.data?.id;
    if (xSignature && xRequestId && dataId) {
      const ts = xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1];
      const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1];
      const signed = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', secret).update(signed).digest('hex');
      if (hmac !== v1) {
        console.warn('[billing] assinatura inválida — ignorado');
        return;
      }
    }
  }

  const body = req.body;
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const evolutionUrl = 'https://seriousokapi-evolution.cloudfy.live';
  const evolutionKey = process.env.EVOLUTION_API_KEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';

  const PLAN_MAP = {
    [process.env.MP_PLAN_ID_START]: 'start',
    [process.env.MP_PLAN_ID_PRO]: 'pro',
    [process.env.MP_PLAN_ID_ENTERPRISE]: 'enterprise',
  };

  console.log('[billing] tipo:', body.type, '| ação:', body.action, '| id:', body.data?.id);

  try {
    // === ASSINATURA CRIADA / ALTERADA ===
    if (body.type === 'subscription_preapproval') {
      const subId = body.data?.id;
      if (!subId) return;

      const sub = await mpGet(`https://api.mercadopago.com/preapproval/${subId}`, mpToken);
      const planType = PLAN_MAP[sub.preapproval_plan_id];
      if (!planType) {
        console.warn('[billing] plano desconhecido:', sub.preapproval_plan_id);
        return;
      }

      if (sub.status === 'authorized') {
        const profile = await findProfileByEmail(sbUrl, sbKey, sub.payer_email);
        if (!profile) {
          console.warn('[billing] perfil não encontrado:', sub.payer_email);
          return;
        }

        // Ativa o plano imediatamente — não espera o authorized_payment
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await patchProfile(sbUrl, sbKey, profile.id, {
          mercadopago_subscription_id: subId,
          mercadopago_payer_id: String(sub.payer_id || ''),
          plan_type: planType,
          plan_expires_at: expiresAt.toISOString(),
          is_active: true,
        });

        if (profile.instance_name) {
          await patchInstances(sbUrl, sbKey, profile.instance_name, { status: planType });
        }

        await insertAuditLog(sbUrl, sbKey, {
          user_id: profile.id,
          instance_name: profile.instance_name || null,
          action: 'plan_activated',
          old_value: profile.plan_type,
          new_value: planType,
          triggered_by: 'mercadopago_webhook',
          metadata: JSON.stringify({ plan: planType, sub_id: subId, trigger: 'subscription_authorized' }),
        });

        // Provisiona instância se ainda não existe
        if (!profile.instance_name) {
          triggerOnboarding({ userId: profile.id, email: sub.payer_email, planType });
        }

        console.log(`[billing] plano ${planType} ativado (subscription_authorized): ${sub.payer_email}`);
        return;
      }

      if (sub.status === 'cancelled') {
        const profile = await findProfileBySubscriptionId(sbUrl, sbKey, subId);
        if (!profile) return;

        await patchProfile(sbUrl, sbKey, profile.id, { plan_type: 'blocked', is_active: false });

        if (profile.instance_name) {
          await patchInstances(sbUrl, sbKey, profile.instance_name, { status: 'blocked' });
          await logoutEvolution(evolutionUrl, evolutionKey, profile.instance_name);
        }

        await insertAuditLog(sbUrl, sbKey, {
          user_id: profile.id,
          instance_name: profile.instance_name || null,
          action: 'plan_blocked',
          old_value: profile.plan_type,
          new_value: 'blocked',
          triggered_by: 'mercadopago_webhook',
          metadata: JSON.stringify({ reason: 'subscription_cancelled', sub_id: subId }),
        });

        console.log(`[billing] assinatura cancelada: ${subId}`);
        return;
      }
    }

    // === PRIMEIRO PAGAMENTO / RENOVAÇÃO MENSAL ===
    if (body.type === 'subscription_authorized_payment') {
      const authorizedId = body.data?.id;
      if (!authorizedId) return;

      const payment = await mpGet(`https://api.mercadopago.com/authorized_payments/${authorizedId}`, mpToken);
      if (payment.status !== 'processed') return;

      const subId = payment.preapproval_id;
      const sub = await mpGet(`https://api.mercadopago.com/preapproval/${subId}`, mpToken);
      const planType = PLAN_MAP[sub.preapproval_plan_id];
      if (!planType) return;

      const profile = await findProfileBySubscriptionId(sbUrl, sbKey, subId);
      if (!profile) return;

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await patchProfile(sbUrl, sbKey, profile.id, {
        plan_type: planType,
        plan_expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      if (profile.instance_name) {
        await patchInstances(sbUrl, sbKey, profile.instance_name, { status: planType });
      }

      await insertAuditLog(sbUrl, sbKey, {
        user_id: profile.id,
        instance_name: profile.instance_name || null,
        action: 'plan_activated',
        old_value: profile.plan_type,
        new_value: planType,
        triggered_by: 'mercadopago_webhook',
        metadata: JSON.stringify({ plan: planType, sub_id: subId, payment_id: authorizedId }),
      });

      console.log(`[billing] plano ${planType} ativado: sub ${subId}`);
      return;
    }

    // === PAGAMENTO AVULSO (PIX) ===
    if (body.type === 'payment' || body.action?.includes('payment')) {
      const paymentId = body.data?.id;
      if (!paymentId) return;

      const payment = await mpGet(`https://api.mercadopago.com/v1/payments/${paymentId}`, mpToken);
      if (payment.status !== 'approved') return;

      const userId = payment.external_reference;
      if (!userId) return;

      const planType = payment.metadata?.plan_type || 'pro';
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await patchProfile(sbUrl, sbKey, userId, {
        plan_type: planType,
        plan_expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      // Busca instance_name para atualizar instances e audit
      const profileRes = await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}&select=instance_name,plan_type`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
      });
      const profileData = await profileRes.json();
      const instanceName = profileData?.[0]?.instance_name || null;

      if (instanceName) {
        await patchInstances(sbUrl, sbKey, instanceName, { status: 'pro' });
      }

      await insertAuditLog(sbUrl, sbKey, {
        user_id: userId,
        instance_name: instanceName,
        action: 'plan_activated',
        new_value: 'pro',
        triggered_by: 'mercadopago_webhook',
        metadata: JSON.stringify({ payment_id: paymentId, type: 'pix' }),
      });

      console.log(`[billing] PIX aprovado: user ${userId}`);
    }
  } catch (err) {
    console.error('[billing] erro:', err.message);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

async function findProfileByEmail(sbUrl, sbKey, email) {
  if (!email) return null;
  const res = await fetch(
    `${sbUrl}/auth/v1/admin/users?page=1&per_page=1&email=${encodeURIComponent(email)}`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  );
  const data = await res.json();
  const userId = data.users?.[0]?.id;
  if (!userId) return null;

  const profileRes = await fetch(
    `${sbUrl}/rest/v1/profiles?id=eq.${userId}&select=id,instance_name,plan_type&limit=1`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  );
  const profiles = await profileRes.json();
  return profiles?.[0] || null;
}

async function findProfileBySubscriptionId(sbUrl, sbKey, subId) {
  const res = await fetch(
    `${sbUrl}/rest/v1/profiles?mercadopago_subscription_id=eq.${encodeURIComponent(subId)}&select=id,instance_name,plan_type&limit=1`,
    { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
  );
  const data = await res.json();
  return data?.[0] || null;
}

async function patchProfile(sbUrl, sbKey, userId, fields) {
  await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: supabaseHeaders(sbKey),
    body: JSON.stringify(fields),
  });
}

async function patchInstances(sbUrl, sbKey, instanceName, fields) {
  await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(instanceName)}`, {
    method: 'PATCH',
    headers: supabaseHeaders(sbKey),
    body: JSON.stringify(fields),
  });
}

async function logoutEvolution(evolutionUrl, evolutionKey, instanceName) {
  await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers: { apikey: evolutionKey },
  }).catch(e => console.warn('[billing] evolution logout error:', e.message));
}

async function insertAuditLog(sbUrl, sbKey, entry) {
  await fetch(`${sbUrl}/rest/v1/audit_log`, {
    method: 'POST',
    headers: supabaseHeaders(sbKey),
    body: JSON.stringify(entry),
  }).catch(e => console.warn('[billing] audit_log error:', e.message));
}

function triggerOnboarding(data) {
  const url = process.env.N8N_ONBOARDING_WEBHOOK
    || 'https://seriousokapi-n8n.cloudfy.live/webhook/zettabots-onboarding';
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(e => console.warn('[billing] onboarding trigger error:', e.message));
}
