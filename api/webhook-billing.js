
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  const airtableToken = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appQkUKRhf7rKotbT';
  const table = 'tblu2DjzxbgZ84PL6';

  console.log('💰 Webhook Financeiro Recebido:', JSON.stringify(body));

  try {
    // Extração flexível (Kiwify, Hotmart, Stripe)
    const email = body.email || body.customer?.email || body.data?.object?.customer_email;
    const status = body.status || body.event || body.type;
    const plan = body.plan_name || body.product_name || 'Premium';

    if (!email) throw new Error('Email não encontrado no webhook');

    // 1. Buscar usuário no Airtable pelo email
    const searchRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}?filterByFormula={email}='${email}'`, {
      headers: { Authorization: `Bearer ${airtableToken}` }
    });
    const searchData = await searchRes.json();

    if (!searchData.records || searchData.records.length === 0) {
      console.log(`⚠️ Usuário ${email} não encontrado no banco.`);
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    const recordId = searchData.records[0].id;
    let newStatus = 'trial';
    let expiryDate = new Date();

    // 2. Lógica de Status (Brasil Focus)
    if (['paid', 'approved', 'payment_approved', 'subscription_active', 'checkout.session.completed'].includes(status)) {
      newStatus = 'pago';
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // +1 ano para anual
    } else if (['canceled', 'refunded', 'subscription_canceled', 'charge.refunded'].includes(status)) {
      newStatus = 'bloqueado';
    }

    // 3. Atualizar Airtable
    await fetch(`https://api.airtable.com/v0/${baseId}/${table}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          status: newStatus,
          expiryDate: expiryDate.toISOString().split('T')[0]
        }
      })
    });

    console.log(`✅ Status de ${email} atualizado para: ${newStatus}`);
    return res.status(200).json({ success: true, updated: newStatus });

  } catch (error) {
    console.error('❌ Erro no Webhook Financeiro:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
