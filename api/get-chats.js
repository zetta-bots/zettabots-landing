export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { instanceName } = req.body
  if (!instanceName) {
    return res.status(400).json({ error: 'Instance name required' })
  }

  let EVOLUTION_URL = process.env.EVOLUTION_URL
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY

  if (!EVOLUTION_URL || !EVOLUTION_APIKEY) {
    return res.status(500).json({ error: 'Configuração pendente' })
  }

  EVOLUTION_URL = EVOLUTION_URL.replace(/\/$/, '')

  try {
    const fetchRes = await fetch(`${EVOLUTION_URL}/chat/fetchChats?instanceName=${instanceName}`, {
      headers: { 'apikey': EVOLUTION_APIKEY }
    })
    
    if (!fetchRes.ok) throw new Error(`HTTP Error: ${fetchRes.status}`)
    
    const data = await fetchRes.json()
    
    // Suporte para diferentes formatos de retorno da Evolution
    const rawChats = Array.isArray(data) ? data : (data.chats || [])

    const chats = rawChats.slice(0, 10).map(chat => ({
      user: chat.name || chat.id?.split('@')[0] || 'Desconhecido',
      lastMsg: chat.message || 'Conversa iniciada',
      time: chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      phone: chat.id?.split('@')[0] || ''
    }))

    return res.status(200).json({ success: true, chats })

  } catch (error) {
    console.error('Erro no get-chats:', error)
    return res.status(500).json({ error: 'Erro ao buscar conversas', details: error.message })
  }
}
