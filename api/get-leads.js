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

  if (!EVOLUTION_URL || !EVOLUTION_APIKEY) {
    return res.status(500).json({ error: 'Configuração pendente' })
  }

  const baseUrl = EVOLUTION_URL.trim().replace(/\/$/, '')

  try {
    const fetchRes = await fetch(`${baseUrl}/chat/fetchContacts?instanceName=${instanceName}`, {
      headers: { 'apikey': EVOLUTION_APIKEY }
    })
    
    if (!fetchRes.ok) throw new Error(`HTTP Error: ${fetchRes.status}`)
    
    const data = await fetchRes.json()
    const rawContacts = Array.isArray(data) ? data : (data.contacts || [])

    const leads = rawContacts.slice(0, 50).map(c => {
      const id = c.id || c.remoteJid || ''
      const phone = id.split('@')[0]
      return {
        name: c.name || c.pushName || c.pushname || (phone.length > 5 ? phone : 'Lead WhatsApp'),
        phone: phone.length > 5 ? phone : 'Oculto',
        status: 'Ativo'
      }
    })

    return res.status(200).json({ success: true, leads })

  } catch (error) {
    console.error('Erro no get-leads:', error)
    return res.status(500).json({ error: 'Erro ao buscar leads', details: error.message })
  }
}
