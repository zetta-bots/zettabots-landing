export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    const cleanInput = phone.replace(/\D/g, '')
    const isAtlas = cleanInput.includes('1197737283')
    
    // PRIORIDADE: Bypass para Atlas da Fé
    if (isAtlas && code === '1234') {
      const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=OR(SEARCH('1197737283', {phone}), SEARCH('1197737283', {adminPhone}))`
      const airtableRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } })
      const data = await airtableRes.json()
      
      if (data.records && data.records.length > 0) {
        const record = data.records[0]
        const fields = record.fields
        return res.status(200).json({
          success: true,
          recordId: record.id,
          instanceName: fields.instanceName || '1197737283',
          phone: fields.adminPhone || '1197737283',
          status: fields.status || 'pago',
          name: fields.name || 'Atlas da Fé',
          systemPrompt: fields.systemPrompt || '',
          email: fields.email || '',
          expiryDate: fields.trialEndDate || '2026-12-31'
        })
      }
    }

    // FLUXO NORMAL: Outros usuários
    const phoneWith55 = cleanInput.startsWith('55') ? cleanInput : `55${cleanInput}`
    const phoneWithout55 = cleanInput.startsWith('55') ? cleanInput.substring(2) : cleanInput
    
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=OR({phone}='${phoneWith55}', {phone}='${phoneWithout55}', {adminPhone}='${phoneWith55}', {adminPhone}='${phoneWithout55}')`
    const airtableRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } })
    const data = await airtableRes.json()

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const record = data.records[0]
    const fields = record.fields

    if (fields.loginCode !== code) {
      return res.status(401).json({ error: 'Código de acesso incorreto' })
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
