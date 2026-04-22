export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recordId, systemPrompt, instanceName, webhookUrl, notificationEmail } = req.body
  if (!recordId) {
    return res.status(400).json({ error: 'ID do cliente é obrigatório' })
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6' 
  
  const EVOLUTION_URL = process.env.EVOLUTION_URL
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY

  if (recordId === 'mock-id') {
    return res.status(200).json({ success: true })
  }

  try {
    // 1. Atualizar no Airtable (Persistência)
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          systemPrompt: systemPrompt,
          webhookUrl: webhookUrl || '',
          email: notificationEmail || ''
        }
      })
    })

    // 2. Sincronizar com Evolution API (Live Bot)
    if (instanceName && EVOLUTION_URL && EVOLUTION_APIKEY) {
      const evolutionBaseUrl = EVOLUTION_URL.trim().replace(/\/$/, '')
      
      // Tenta atualizar a configuração de Chat GPT da instância
      await fetch(`${evolutionBaseUrl}/chatgpt/setSettings/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_APIKEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          systemPrompt: systemPrompt,
          model: "gpt-4o", // Modelo de alta performance
          timezone: "America/Sao_Paulo"
        })
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro no update-prompt:', error)
    return res.status(500).json({ error: 'Erro ao salvar no banco de dados ou sincronizar bot' })
  }
}
