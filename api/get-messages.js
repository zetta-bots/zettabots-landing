export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { instanceName, remoteJid } = req.body
  if (!instanceName || !remoteJid) {
    return res.status(400).json({ error: 'Instance and remoteJid required' })
  }

  const EVOLUTION_URL = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '')
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk'

  try {
    const response = await fetch(`${EVOLUTION_URL}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_APIKEY
      },
      body: JSON.stringify({
        where: { remoteJid },
        take: 50
      })
    })

    const data = await response.json()
    const rawMsgs = Array.isArray(data) ? data : (data.messages || [])

    const messages = rawMsgs.reverse().map(m => {
      const msg = m.message || {}
      return {
        text: msg.conversation || 
              msg.extendedTextMessage?.text || 
              msg.imageMessage?.caption ||
              (msg.audioMessage ? '🎤 Áudio' : 
              (msg.imageMessage ? '📷 Imagem' : 
              (msg.videoMessage ? '🎥 Vídeo' : 'Mensagem não suportada'))),
        fromMe: m.key?.fromMe,
        time: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      }
    })

    return res.status(200).json({ success: true, messages })
  } catch (error) {
    console.error('Erro no get-messages:', error)
    return res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
}
