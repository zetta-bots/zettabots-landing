export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { instanceName, enabled, systemPrompt } = req.body;
  if (!instanceName) return res.status(400).json({ error: 'Missing params' });

  const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live';
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';

  try {
    const url = EVOLUTION_URL.trim().replace(/\/$/, '');
    const setRes = await fetch(`${url}/chatgpt/setSettings/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_APIKEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled: enabled,
        systemPrompt: systemPrompt || "Você é a Sarah.",
        model: "gpt-4o",
        timezone: "America/Sao_Paulo"
      })
    });

    if (!setRes.ok) throw new Error('Failed to toggle AI in Evolution');

    return res.status(200).json({ success: true, enabled });
  } catch (error) {
    return res.status(500).json({ error: 'Error toggling AI' });
  }
}
