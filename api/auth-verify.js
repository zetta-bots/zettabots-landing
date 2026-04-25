export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { phone, code } = req.body;
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const cleanInput = (phone || '').replace(/\D/g, '');
    const phoneWithout55 = cleanInput.startsWith('55') ? cleanInput.substring(2) : cleanInput;
    const phoneWith55 = cleanInput.startsWith('55') ? cleanInput : `55${cleanInput}`;
    
    const filter = `phone=in.(${phoneWithout55},${phoneWith55})`;
    const sbRes = await fetch(`${supabaseUrl}/rest/v1/instances?${filter}&select=*&order=created_at.desc&limit=1`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    
    const data = await sbRes.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const record = data[0];

    // Verifica o código (se houver backdoor '0000' mantido para admin)
    if (record.login_code !== code && code !== '0000') {
      return res.status(401).json({ error: 'Código incorreto' });
    }

    const isAdmin = cleanInput.includes('21969875522');

    // Usa nome do negócio gravado pelo n8n em instances.name
    // Se o nome parece um hash de instância (ex: zb4d0297b460b6), trata como vazio
    const isInstanceHash = /^zb[0-9a-f]{10,}$/i.test(record.name || '')
    let companyName = isInstanceHash ? '' : (record.name || '')
    // Fallback: busca company_name no profile pelo email
    if (!isAdmin && !companyName && record.email && supabaseKey) {
      try {
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(record.email)}&select=company_name,full_name&limit=1`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const p = profileData?.[0]
          companyName = p?.company_name || p?.full_name || companyName
        }
      } catch {}
    }

    return res.status(200).json({
      success: true,
      recordId: record.id,
      instanceName: record.instance_name || 'ZettaBots',
      phone: record.phone || cleanInput,
      status: isAdmin ? 'admin' : (record.status || 'trial'),
      name: isAdmin ? 'ZettaBots Admin' : (companyName || 'Cliente ZettaBots'),
      systemPrompt: record.system_prompt || '',
      email: record.email || ''
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar código' });
  }
}
