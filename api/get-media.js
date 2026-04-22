export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { instanceName, messageId } = req.body;
  if (!instanceName || !messageId) return res.status(400).json({ error: 'Missing params' });

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';

  try {
    const resMedia = await fetch(`${url}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { key: { id: messageId } } })
    });
    
    if (!resMedia.ok) {
        throw new Error('Failed to fetch from Evolution');
    }
    
    const data = await resMedia.json();
    return res.status(200).json({ success: true, base64: data.base64, mimetype: data.mimetype });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching media' });
  }
}
