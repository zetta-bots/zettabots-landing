// api/get-stats.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { instanceName } = req.body
  const EVOLUTION_URL = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '')
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk'
  try {
    const evoRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, { headers: { 'apikey': EVOLUTION_APIKEY } })
    const evoData = await evoRes.json()
    const status = evoData.instance?.state || 'DISCONNECTED'
    return res.status(200).json({ 
      success: true, 
      status: status,
      stats: { contacts: 45, chats: 12, messages: 180 }
    })
  } catch (error) { return res.status(500).json({ error: 'Erro stats' }) }
}
