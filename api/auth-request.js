export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone } = req.body
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' })
  }

  // MOCK BYPASS para o cliente Atlas da Fé em testes - LOGO NO INÍCIO
  // Aceita com ou sem 55 e variações comuns
  const isMock = phone === '1197737283' || phone === '551197737283' || phone === '5511977372830'
  
  if (isMock) {
    return res.status(200).json({ success: true, message: 'Bypass mode active' })
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    // 1. Buscar o cliente no Airtable pelo instanceName OU adminPhone
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=OR({instanceName}='${phone}', {adminPhone}='${phone}')`
    
    const airtableRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    })
    
    const data = await airtableRes.json()
    
    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Número não encontrado. Verifique se você já é cliente ZettaBots.' })
    }

    const record = data.records[0]
    const recordId = record.id

    // 2. Gerar código de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // 3. Salvar o código no Airtable (na coluna loginCode)
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          loginCode: code
        }
      })
    })

    // 4. Enviar mensagem via Evolution API (usando a instância do ZettaBots)
    const EVOLUTION_URL = process.env.EVOLUTION_URL
    const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY
    
    await fetch(`${EVOLUTION_URL}/message/sendText/ZettaBots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_APIKEY
      },
      body: JSON.stringify({
        number: phone,
        text: `🔐 *ZettaBots* | Seu código de acesso ao Painel é: *${code}*\n\nNão compartilhe este código com ninguém.`
      })
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro no auth-request:', error)
    return res.status(500).json({ error: 'Erro interno no servidor' })
  }
}
