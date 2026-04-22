export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { instanceName } = req.body
  if (!instanceName) {
    return res.status(400).json({ error: 'Instance name required' })
  }

  const EVOLUTION_URL = process.env.EVOLUTION_URL
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY

  try {
    // Busca estatísticas básicas da instância
    const fetchRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
      headers: { 'apikey': EVOLUTION_APIKEY }
    })
    
    if (!fetchRes.ok) throw new Error('Falha ao conectar com Evolution')
    
    const data = await fetchRes.json()
    const item = Array.isArray(data) ? data.find(i => i.instance?.instanceName === instanceName) : data

    if (!item) {
      return res.status(404).json({ error: 'Instância não encontrada' })
    }

    const counts = item._count || {}

    // Retorna dados estatísticos reais
    return res.status(200).json({
      success: true,
      stats: {
        contacts: counts.contacts || 0,
        chats: counts.chats || 0,
        messages: counts.messages || 0
      },
      status: item.instance?.status || 'disconnected'
    })

  } catch (error) {
    console.error('Erro no get-stats:', error)
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
}
