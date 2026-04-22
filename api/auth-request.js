export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone } = req.body
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' })
  }

  // Infraestrutura Mestre
  const k1 = 'pat7gDJThDctpA0xm.'
  const k2 = 'f2e12e87e5eb156e61e2c29f048f2e6c332d15aa783a6ec4bcd616dd80981cd0'
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || (k1 + k2)
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE || 'appQkUKRhf7rKotbT'
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'
  
  const EVOLUTION_URL = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '')
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk'

  try {
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneWithout55 = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone
    const phoneWith55 = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

    const filter = `OR(SEARCH('${phoneWithout55}', {adminPhone}), SEARCH('${phoneWithout55}', {instanceName}))`
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(filter)}`
    
    const airtableRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } })
    const data = await airtableRes.json()
    
    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Número não cadastrado.' })
    }

    const record = data.records[0]
    const recordId = record.id
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${recordId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { loginCode: code } })
    })

    // MENSAGEM ULTRA-LIMPA PARA EVITAR DISPARO DA IA
    // Usando um formato que parece um log de sistema
    const systemCodeMessage = `[ZettaBots-Auth-System]\nCODE: ${code}\nEXPIRE: 5min`

    await fetch(`${EVOLUTION_URL}/message/sendText/ZettaBots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_APIKEY },
      body: JSON.stringify({
        number: phoneWith55,
        text: systemCodeMessage
      })
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro no auth-request:', error)
    return res.status(500).json({ error: 'Erro interno' })
  }
}
