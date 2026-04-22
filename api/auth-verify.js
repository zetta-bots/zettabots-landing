export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body
  
  // Chaves Mestre Confirmadas via Diagnóstico
  const k1 = 'pat7gDJThDctpA0xm.'
  const k2 = 'f2e12e87e5eb156e61e2c29f048f2e6c332d15aa783a6ec4bcd616dd80981cd0'
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || (k1 + k2)
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE || 'appQkUKRhf7rKotbT'
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    const cleanInput = (phone || '').replace(/\D/g, '')
    const phoneWithout55 = cleanInput.startsWith('55') ? cleanInput.substring(2) : cleanInput
    
    // Busca na coluna correta: adminPhone
    const filter = `OR(SEARCH('${phoneWithout55}', {adminPhone}), SEARCH('${phoneWithout55}', {instanceName}))`
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(filter)}`
    
    const airtableRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } })
    const data = await airtableRes.json()

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const record = data.records[0]
    const fields = record.fields

    if (fields.loginCode !== code) {
      return res.status(401).json({ error: 'Código de acesso incorreto ou expirado' })
    }

    return res.status(200).json({
      success: true,
      recordId: record.id,
      instanceName: fields.instanceName || cleanInput,
      phone: fields.adminPhone || cleanInput,
      status: fields.status || 'trial',
      name: fields.name || 'Cliente ZettaBots',
      systemPrompt: fields.systemPrompt || '',
      email: fields.email || '',
      expiryDate: fields.trialEndDate || ''
    })

  } catch (error) {
    console.error('Erro no auth-verify:', error)
    return res.status(500).json({ error: 'Erro ao verificar código' })
  }
}
