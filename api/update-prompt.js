export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { recordId, systemPrompt, instanceName, webhookUrl, notificationEmail } = req.body;
  if (!recordId) return res.status(400).json({ error: 'ID do cliente é obrigatório' });

  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const EVOLUTION_URL = process.env.EVOLUTION_URL;
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY;

  if (recordId === 'mock-id') return res.status(200).json({ success: true });

  try {
    // 1. Atualizar no Supabase (Persistência)
    const updateData = {};
    if (systemPrompt !== undefined) updateData.system_prompt = systemPrompt;
    if (webhookUrl !== undefined) updateData.webhook_url = webhookUrl;
    if (notificationEmail !== undefined) updateData.email = notificationEmail;

    if (Object.keys(updateData).length > 0) {
      const queryParam = instanceName ? `instance_name=eq.${instanceName}` : `id=eq.${recordId}`;
      await fetch(`${sbUrl}/rest/v1/instances?${queryParam}`, {
        method: 'PATCH',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      });
    }

    // 2. Sincronizar com Evolution API (Live Bot)
    if (instanceName && EVOLUTION_URL && EVOLUTION_APIKEY && systemPrompt) {
      const evolutionBaseUrl = EVOLUTION_URL.trim().replace(/\/$/, '');
      await fetch(`${evolutionBaseUrl}/chatgpt/setSettings/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_APIKEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          systemPrompt: systemPrompt,
          model: "gpt-4o",
          timezone: "America/Sao_Paulo"
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar no Supabase ou sincronizar bot' });
  }
}
