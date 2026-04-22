export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone } = req.body
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' })
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    // Normalização para busca
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneWith55 = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const phoneWithout55 = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone

    // 1. Buscar o cliente no Airtable (Busca Global em múltiplas colunas)
    const filter = `OR(SEARCH('${phoneWithout55}', {phone}), SEARCH('${phoneWithout55}', {adminPhone}), SEARCH('${phoneWithout55}', {instanceName}), SEARCH('${phoneWithout55}', {whatsapp}))`
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(filter)}`
    
    const airtableRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    })
    const data = await airtableRes.json()
    
    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Número não encontrado. Verifique se você já é cliente ZettaBots.' })
    }

    const record = data.records[0]
    const recordId = record.id

    // 2. Gerar código real de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // 3. Salvar o código no Airtable
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { loginCode: code }
      })
    })

    // 4. Enviar mensagem via Evolution API (Instância Mestre ZettaBots)
    let EVOLUTION_URL = process.env.EVOLUTION_URL
    const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY
    EVOLUTION_URL = EVOLUTION_URL.replace(/\/$/, '')
    
    await fetch(`${EVOLUTION_URL}/message/sendText/ZettaBots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_APIKEY
      },
      body: JSON.stringify({
        number: phoneWith55,
        text: `🔐 *ZettaBots* | Seu código de acesso ao Painel é: *${code}*\n\nNão compartilhe este código com ninguém.`
      })
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro no auth-request:', error)
    return res.status(500).json({ error: 'Erro interno no servidor' })
  }
}
