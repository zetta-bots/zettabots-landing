export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { instanceName } = req.body
  const EVOLUTION_URL = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '')
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk'
  try {
    const response = await fetch(`${EVOLUTION_URL}/chat/fetchChats?instanceName=${instanceName}`, { headers: { 'apikey': EVOLUTION_APIKEY } })
    const data = await response.json()
    const rawChats = Array.isArray(data) ? data : (data.chats || data.data || [])
    const leads = rawChats.filter(chat => chat.id && !chat.id.includes('@g.us')).slice(0, 10).map(chat => ({
      id: chat.id, nome: chat.name || chat.pushName || 'Interessado', whatsapp: chat.id.split('@')[0], status: 'Interessado', data: 'Hoje'
    }))
    return res.status(200).json({ success: true, leads })
  } catch (error) { return res.status(500).json({ error: 'Erro leads' }) }
}
