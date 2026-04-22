export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefone é obrigatório' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const EVOLUTION_URL = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const MASTER_INSTANCE = process.env.MASTER_INSTANCE || 'ZettaBots';

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithout55 = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone;
    const phoneWith55 = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Busca no Supabase (REST API)
    const filter = `phone=in.(${phoneWithout55},${phoneWith55})`;
    const sbRes = await fetch(`${supabaseUrl}/rest/v1/instances?${filter}&select=id`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    
    const data = await sbRes.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Número não encontrado no sistema.' });
    }

    const recordId = data[0].id;
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Salva o código na tabela
    await fetch(`${supabaseUrl}/rest/v1/instances?id=eq.${recordId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ login_code: code })
    });

    const masterMessage = `🔐 *CÓDIGO ZETTABOTS:* ${code}\n\nEste é o seu acesso seguro ao painel V2.`;
    await fetch(`${EVOLUTION_URL}/message/sendText/${MASTER_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_APIKEY },
      body: JSON.stringify({ number: phoneWith55, text: masterMessage })
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno na comunicação com o Supabase' });
  }
}
